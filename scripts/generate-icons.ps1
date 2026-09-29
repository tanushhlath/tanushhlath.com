<#
.SYNOPSIS
  Generates every favicon / app icon / social image, plus the smaller
  headshot variant, from the one real headshot.

.DESCRIPTION
  Source:  public/images/profile/headshot.png   (the original photo)
  Outputs: public/images/branding/
             favicon-16.png, favicon-32.png, favicon-48.png   browser tabs
             apple-touch-icon.png  (180x180)                   iOS home screen
             icon-192.png, icon-512.png                        web app manifest
             icon-maskable-512.png                             Android adaptive icon
             og-image.png          (1200x630)                  link previews
           public/images/profile/headshot-640.png              small portrait

  The icons are a face-centred circular crop of the headshot on the site's
  dark background (#090B10) with a thin azure (#5D6CFF) ring. Tiny sizes use
  a tighter crop, a slight contrast boost and a light sharpen so the face
  still reads at 16px.

  HOW TO REGENERATE (after replacing the headshot, or to tweak the crop):
    npm run icons
  which runs three steps you can also run yourself:
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-icons.ps1
    node scripts/optimize-png.mjs public/images/branding public/images/profile/headshot-640.png
    node scripts/build-ico.mjs
  (optimize-png losslessly shrinks the PNGs; build-ico packs favicon-16/32/48
  into public/favicon.ico). Then rebuild the site: npm run build.

  If you use a different photo, say where the face is (in source pixels):
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-icons.ps1 `
      -FaceX 575 -FaceY 245 -CropSize 360

  Windows only: uses System.Drawing, built into Windows PowerShell 5.1.
  This file is plain ASCII on purpose (PowerShell 5.1 reads scripts as ANSI).
#>
param(
  # The original headshot.
  [string]$Source = (Join-Path $PSScriptRoot "..\public\images\profile\headshot.png"),
  # Where the favicons / app icons / og-image go.
  [string]$BrandingDir = (Join-Path $PSScriptRoot "..\public\images\branding"),
  # Where headshot-640.png goes.
  [string]$ProfileDir = (Join-Path $PSScriptRoot "..\public\images\profile"),
  # Centre of the face in the source photo, in source pixels.
  [int]$FaceX = 575,
  [int]$FaceY = 245,
  # Side of the square crop used for the large icons (top of the hair to the chin).
  [int]$CropSize = 360,
  # Tighter crop for the 16/32/48px favicons so the features stay legible.
  [int]$TightCropSize = 270,
  # Text printed on og-image.png. ([char]0x00E9 is an e-acute.)
  [string]$Name = "Tanushh Lath",
  [string]$Tagline = "I build, lead, compete, and keep asking better questions.",
  [string]$Kicker = "A person, not a r$([char]0x00E9)sum$([char]0x00E9)",
  [string]$Domain = "tanushhlath.com"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$Source = [System.IO.Path]::GetFullPath($Source)
$BrandingDir = [System.IO.Path]::GetFullPath($BrandingDir)
$ProfileDir = [System.IO.Path]::GetFullPath($ProfileDir)
New-Item -ItemType Directory -Force -Path $BrandingDir | Out-Null
New-Item -ItemType Directory -Force -Path $ProfileDir | Out-Null

# Site palette (dark theme, src/styles/theme.css).
$Ink      = [System.Drawing.Color]::FromArgb(255, 9, 11, 16)      # #090B10
$Paper    = [System.Drawing.Color]::FromArgb(255, 243, 240, 232)  # #F3F0E8
$PaperDim = [System.Drawing.Color]::FromArgb(255, 155, 160, 172)  # #9BA0AC
$Azure    = [System.Drawing.Color]::FromArgb(255, 93, 108, 255)   # #5D6CFF
$AzureSoft = [System.Drawing.Color]::FromArgb(255, 141, 152, 255) # lighter azure for small type
$Lavender = [System.Drawing.Color]::FromArgb(255, 169, 153, 255)  # #A999FF

# --------------------------------------------------------------------------
# Pixel helpers (compiled once; GDI+ gradients band visibly on dark colours)
# --------------------------------------------------------------------------

if (-not ("IconPixels" -as [type])) {
  Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class IconPixels {
  static byte[] Read(Bitmap bmp, out BitmapData data) {
    data = bmp.LockBits(new Rectangle(0, 0, bmp.Width, bmp.Height), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    byte[] px = new byte[data.Stride * bmp.Height];
    Marshal.Copy(data.Scan0, px, 0, px.Length);
    return px;
  }

  static void Write(Bitmap bmp, BitmapData data, byte[] px) {
    Marshal.Copy(px, 0, data.Scan0, px.Length);
    bmp.UnlockBits(data);
  }

  static byte Clamp(double v) { return (byte)(v < 0 ? 0 : v > 255 ? 255 : v); }

  // 8x8 Bayer matrix: ordered dither thresholds. A repeating pattern hides
  // banding as well as random noise does, but PNG still compresses it well.
  static readonly int[] Bayer = {
     0, 32,  8, 40,  2, 34, 10, 42,  48, 16, 56, 24, 50, 18, 58, 26,
    12, 44,  4, 36, 14, 46,  6, 38,  60, 28, 52, 20, 62, 30, 54, 22,
     3, 35, 11, 43,  1, 33,  9, 41,  51, 19, 59, 27, 49, 17, 57, 25,
    15, 47,  7, 39, 13, 45,  5, 37,  63, 31, 55, 23, 61, 29, 53, 21 };

  // Soft radial light: colour blended over opaque pixels with a smooth
  // (1 - t^2)^3 falloff, ordered-dithered so dark gradients never band.
  public static void Glow(Bitmap bmp, double cx, double cy, double radius, Color c, double strength) {
    BitmapData data; byte[] px = Read(bmp, out data);
    for (int y = 0; y < bmp.Height; y++) {
      for (int x = 0; x < bmp.Width; x++) {
        int i = y * data.Stride + x * 4;
        if (px[i + 3] == 0) continue;
        double dx = (x + 0.5 - cx) / radius, dy = (y + 0.5 - cy) / radius;
        double t2 = dx * dx + dy * dy;
        if (t2 >= 1) continue;
        double f = 1 - t2; double a = strength * f * f * f;
        double threshold = (Bayer[(y & 7) * 8 + (x & 7)] + 0.5) / 64.0;
        px[i]     = Clamp(Math.Floor(px[i]     + (c.B - px[i])     * a + threshold));
        px[i + 1] = Clamp(Math.Floor(px[i + 1] + (c.G - px[i + 1]) * a + threshold));
        px[i + 2] = Clamp(Math.Floor(px[i + 2] + (c.R - px[i + 2]) * a + threshold));
      }
    }
    Write(bmp, data, px);
  }

  // 3x3 unsharp mask on an opaque bitmap (edges clamp).
  public static void Sharpen(Bitmap bmp, double amount) {
    BitmapData data; byte[] px = Read(bmp, out data);
    byte[] src = (byte[])px.Clone();
    int w = bmp.Width, h = bmp.Height, s = data.Stride;
    for (int y = 0; y < h; y++) {
      for (int x = 0; x < w; x++) {
        for (int ch = 0; ch < 3; ch++) {
          double sum = 0;
          for (int ky = -1; ky <= 1; ky++) {
            int yy = Math.Min(h - 1, Math.Max(0, y + ky));
            for (int kx = -1; kx <= 1; kx++) {
              int xx = Math.Min(w - 1, Math.Max(0, x + kx));
              sum += src[yy * s + xx * 4 + ch];
            }
          }
          int i = y * s + x * 4 + ch;
          px[i] = Clamp(src[i] + (src[i] - sum / 9.0) * amount + 0.5);
        }
      }
    }
    Write(bmp, data, px);
  }
}
"@
}

# --------------------------------------------------------------------------
# Drawing helpers
# --------------------------------------------------------------------------

function New-Canvas([int]$Width, [int]$Height) {
  $bmp = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)
  return @{ Bitmap = $bmp; Graphics = $g }
}

function Save-Png($Canvas, [string]$Path) {
  $Canvas.Graphics.Dispose()
  $Canvas.Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $Canvas.Bitmap.Dispose()
  Write-Host ("  wrote  {0}" -f $Path)
}

# Colour matrix: saturation, then contrast around mid-grey (1 = unchanged).
function New-ToneAttributes([double]$Contrast = 1.0, [double]$Saturation = 1.0) {
  $lr = 0.3086; $lg = 0.6094; $lb = 0.0820
  $sr = (1 - $Saturation) * $lr; $sg = (1 - $Saturation) * $lg; $sb = (1 - $Saturation) * $lb
  $c = $Contrast; $t = [single]((1 - $c) / 2)
  $m = New-Object System.Drawing.Imaging.ColorMatrix
  $m.Matrix00 = [single](($sr + $Saturation) * $c); $m.Matrix01 = [single]($sr * $c); $m.Matrix02 = [single]($sr * $c)
  $m.Matrix10 = [single]($sg * $c); $m.Matrix11 = [single](($sg + $Saturation) * $c); $m.Matrix12 = [single]($sg * $c)
  $m.Matrix20 = [single]($sb * $c); $m.Matrix21 = [single]($sb * $c); $m.Matrix22 = [single](($sb + $Saturation) * $c)
  $m.Matrix33 = 1; $m.Matrix44 = 1
  $m.Matrix40 = $t; $m.Matrix41 = $t; $m.Matrix42 = $t
  $attrs = New-Object System.Drawing.Imaging.ImageAttributes
  $attrs.SetColorMatrix($m)
  # Mirror the edges while resampling so the crop border never goes soft/transparent.
  $attrs.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
  return $attrs
}

# Square source crop centred on (cx, cy), clamped inside the photo.
function Get-Crop($Image, [double]$CenterX, [double]$CenterY, [double]$Size) {
  $x = [Math]::Max(0, [Math]::Min($Image.Width - $Size, $CenterX - $Size / 2))
  $y = [Math]::Max(0, [Math]::Min($Image.Height - $Size, $CenterY - $Size / 2))
  return New-Object System.Drawing.RectangleF([single]$x, [single]$y, [single]$Size, [single]$Size)
}

# Paints the photo crop into an anti-aliased circle. Pass whole-pixel
# positions/diameters for tiny icons so the face isn't resampled twice.
function Add-FaceDisc($G, $Image, $Crop, [double]$X, [double]$Y, [int]$Diameter,
                      [double]$Contrast = 1.0, [double]$Saturation = 1.0,
                      [int]$Vignette = 0, [double]$Sharpen = 0) {
  $d = $Diameter
  $tile = New-Object System.Drawing.Bitmap($d, $d, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $tg = [System.Drawing.Graphics]::FromImage($tile)
  $tg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $tg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $tg.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $attrs = New-ToneAttributes -Contrast $Contrast -Saturation $Saturation
  $dest = New-Object System.Drawing.Rectangle(0, 0, $d, $d)
  $tg.DrawImage($Image, $dest, $Crop.X, $Crop.Y, $Crop.Width, $Crop.Height, [System.Drawing.GraphicsUnit]::Pixel, $attrs)
  if ($Vignette -gt 0) {
    # Darken the rim slightly: gives the disc depth and quiets the bright wall behind the face.
    $vp = New-Object System.Drawing.Drawing2D.GraphicsPath
    $vp.AddEllipse([single](-$d * 0.08), [single](-$d * 0.08), [single]($d * 1.16), [single]($d * 1.16))
    $vb = New-Object System.Drawing.Drawing2D.PathGradientBrush($vp)
    $vb.CenterColor = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
    $vb.SurroundColors = [System.Drawing.Color[]]@([System.Drawing.Color]::FromArgb($Vignette, 4, 6, 12))
    $vblend = New-Object System.Drawing.Drawing2D.Blend(3)
    $vblend.Positions = [single[]]@(0, 0.45, 1)
    $vblend.Factors = [single[]]@(0, 0.85, 1)
    $vb.Blend = $vblend
    $tg.FillRectangle($vb, 0, 0, $d, $d)
    $vb.Dispose(); $vp.Dispose()
  }
  $tg.Dispose(); $attrs.Dispose()
  if ($Sharpen -gt 0) { [IconPixels]::Sharpen($tile, $Sharpen) }

  $brush = New-Object System.Drawing.TextureBrush($tile)
  $brush.TranslateTransform([single]$X, [single]$Y)
  $G.FillEllipse($brush, [single]$X, [single]$Y, [single]$d, [single]$d)
  $brush.Dispose(); $tile.Dispose()
}

# Circle outline centred on (cx, cy); $Radius is the centre line of the stroke.
function Add-Ring($G, [double]$CenterX, [double]$CenterY, [double]$Radius, [double]$Width, [System.Drawing.Color]$Color) {
  $pen = New-Object System.Drawing.Pen($Color, [single]$Width)
  $G.DrawEllipse($pen, [single]($CenterX - $Radius), [single]($CenterY - $Radius), [single]($Radius * 2), [single]($Radius * 2))
  $pen.Dispose()
}

function New-RoundedRectPath([double]$X, [double]$Y, [double]$W, [double]$H, [double]$R) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $R * 2
  $p.AddArc([single]$X, [single]$Y, [single]$d, [single]$d, 180, 90)
  $p.AddArc([single]($X + $W - $d), [single]$Y, [single]$d, [single]$d, 270, 90)
  $p.AddArc([single]($X + $W - $d), [single]($Y + $H - $d), [single]$d, [single]$d, 0, 90)
  $p.AddArc([single]$X, [single]($Y + $H - $d), [single]$d, [single]$d, 90, 90)
  $p.CloseFigure()
  return $p
}

function Get-FontFamily([string[]]$Preferred) {
  $installed = (New-Object System.Drawing.Text.InstalledFontCollection).Families | ForEach-Object { $_.Name }
  foreach ($name in $Preferred) {
    if ($installed -contains $name) { return New-Object System.Drawing.FontFamily($name) }
  }
  return [System.Drawing.FontFamily]::GenericSerif
}

# Draws text with extra letter spacing (GDI+ has no tracking setting).
function Add-TrackedText($G, [string]$Text, $Font, $Brush, [double]$X, [double]$Y, [double]$Tracking) {
  $fmt = [System.Drawing.StringFormat]::GenericTypographic
  $cursor = $X
  foreach ($ch in $Text.ToCharArray()) {
    $s = [string]$ch
    $G.DrawString($s, $Font, $Brush, [single]$cursor, [single]$Y, $fmt)
    $w = if ($s -eq " ") { $G.MeasureString("n", $Font, 1000, $fmt).Width * 0.6 } else { $G.MeasureString($s, $Font, 1000, $fmt).Width }
    $cursor += $w + $Tracking
  }
}

# --------------------------------------------------------------------------
# Favicons + app icons
# --------------------------------------------------------------------------

$photo = [System.Drawing.Image]::FromFile($Source)
Write-Host ("Source {0} ({1}x{2})" -f $Source, $photo.Width, $photo.Height)

$wideCrop  = Get-Crop $photo $FaceX $FaceY $CropSize
$tightCrop = Get-Crop $photo $FaceX ($FaceY + 14) $TightCropSize

# Browser-tab favicons: the face disc with a pixel-aligned azure ring and
# transparent corners, so it sits well on light and dark tab strips alike.
function New-Favicon([int]$Size, [int]$RingWidth, [double]$Sharpen) {
  $c = New-Canvas $Size $Size
  $half = $Size / 2
  # Dark backing under everything so no light seams show between face and ring.
  $backing = New-Object System.Drawing.SolidBrush($Ink)
  $c.Graphics.FillEllipse($backing, [single]0, [single]0, [single]$Size, [single]$Size)
  $backing.Dispose()
  Add-FaceDisc $c.Graphics $photo $tightCrop $RingWidth $RingWidth ($Size - 2 * $RingWidth) `
    -Contrast 1.16 -Saturation 1.12 -Sharpen $Sharpen
  Add-Ring $c.Graphics $half $half ($half - $RingWidth / 2) $RingWidth $Azure
  return $c
}

Save-Png (New-Favicon 16 1 0.45) (Join-Path $BrandingDir "favicon-16.png")
Save-Png (New-Favicon 32 2 0.35) (Join-Path $BrandingDir "favicon-32.png")
Save-Png (New-Favicon 48 2 0.25) (Join-Path $BrandingDir "favicon-48.png")

# App icons: the portrait disc on a dark tile under a soft azure glow.
#   -Shape "square"   full-bleed tile (iOS and Android apply their own mask)
#   -Shape "rounded"  rounded tile with transparent corners (desktop installs)
#   -DiscRatio        disc diameter / icon size. Maskable icons must keep
#                     everything inside the central 80% circle (safe zone).
function New-AppIcon([int]$Size, [string]$Shape, [double]$DiscRatio) {
  $c = New-Canvas $Size $Size
  $g = $c.Graphics
  $half = $Size / 2
  $bg = New-Object System.Drawing.SolidBrush($Ink)
  if ($Shape -eq "rounded") {
    $tilePath = New-RoundedRectPath 0 0 $Size $Size ($Size * 0.225)
    $g.FillPath($bg, $tilePath)
    $tilePath.Dispose()
  } else {
    $g.FillRectangle($bg, 0, 0, $Size, $Size)
  }
  $bg.Dispose()

  [IconPixels]::Glow($c.Bitmap, $half, $half - $Size * 0.03, $Size * 0.66, $Azure, 0.62)
  [IconPixels]::Glow($c.Bitmap, $half, $Size * 0.98, $Size * 0.52, $Lavender, 0.14)

  $disc = [int][Math]::Round($Size * $DiscRatio / 2) * 2
  $x0 = ($Size - $disc) / 2
  Add-FaceDisc $g $photo $wideCrop $x0 $x0 $disc -Contrast 1.05 -Saturation 1.05 -Vignette 70
  $gap = [Math]::Max(1.5, $Size * 0.016)
  $ring = [Math]::Max(1.5, $Size * 0.0085)
  Add-Ring $g $half $half ($disc / 2 + $gap + $ring / 2) $ring $Azure
  return $c
}

Save-Png (New-AppIcon 180 "square" 0.74) (Join-Path $BrandingDir "apple-touch-icon.png")
Save-Png (New-AppIcon 192 "rounded" 0.72) (Join-Path $BrandingDir "icon-192.png")
Save-Png (New-AppIcon 512 "rounded" 0.72) (Join-Path $BrandingDir "icon-512.png")
Save-Png (New-AppIcon 512 "square" 0.66) (Join-Path $BrandingDir "icon-maskable-512.png")

# --------------------------------------------------------------------------
# Social preview (og:image): 1200x630, dark editorial card
# --------------------------------------------------------------------------

function New-OgImage {
  $W = 1200; $H = 630
  $c = New-Canvas $W $H
  $g = $c.Graphics
  $g.Clear($Ink)

  # Atmosphere: one azure bloom behind the portrait and a faint lavender echo
  # (dithered, so the dark gradient never bands).
  [IconPixels]::Glow($c.Bitmap, 905, 300, 560, $Azure, 0.34)
  [IconPixels]::Glow($c.Bitmap, 1120, 640, 420, $Lavender, 0.1)
  [IconPixels]::Glow($c.Bitmap, 120, -40, 520, $Azure, 0.06)

  # Hairline frame, like a printed plate.
  $framePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(24, 243, 240, 232), 1)
  $g.DrawRectangle($framePen, 28, 28, $W - 57, $H - 57)
  $framePen.Dispose()

  # Portrait disc (head and shoulders) in the same ring language as the icons.
  $ogCrop = Get-Crop $photo $FaceX ($FaceY + 55) 470
  $cx = 905; $cy = 315; $disc = 404
  Add-FaceDisc $g $photo $ogCrop ($cx - $disc / 2) ($cy - $disc / 2) $disc -Contrast 1.04 -Saturation 1.04 -Vignette 80
  Add-Ring $g $cx $cy ($disc / 2 + 10) 2.5 $Azure
  Add-Ring $g $cx $cy ($disc / 2 + 32) 1 ([System.Drawing.Color]::FromArgb(46, 93, 108, 255))

  # Type: display serif name (Fraunces if installed, else Georgia), sans details.
  $serif = Get-FontFamily @("Fraunces", "Georgia")
  $sans = Get-FontFamily @("Manrope", "Segoe UI")
  $px = [System.Drawing.GraphicsUnit]::Pixel
  $kickerFont = New-Object System.Drawing.Font($sans, 15, [System.Drawing.FontStyle]::Bold, $px)
  $nameFont = New-Object System.Drawing.Font($serif, 92, [System.Drawing.FontStyle]::Regular, $px)
  $tagFont = New-Object System.Drawing.Font($sans, 27, [System.Drawing.FontStyle]::Regular, $px)
  $domainFont = New-Object System.Drawing.Font($sans, 16, [System.Drawing.FontStyle]::Bold, $px)

  $azureBrush = New-Object System.Drawing.SolidBrush($AzureSoft)
  $paperBrush = New-Object System.Drawing.SolidBrush($Paper)
  $dimBrush = New-Object System.Drawing.SolidBrush($PaperDim)
  $rule = New-Object System.Drawing.SolidBrush($Azure)
  $x = 84

  $g.FillRectangle($rule, $x, 199, 34, 2)
  Add-TrackedText $g $Kicker.ToUpperInvariant() $kickerFont $azureBrush ($x + 50) 190 3.2
  $g.DrawString($Name, $nameFont, $paperBrush, [single]($x - 5), [single]224, [System.Drawing.StringFormat]::GenericTypographic)
  $tagRect = New-Object System.Drawing.RectangleF([single]$x, [single]352, [single]500, [single]120)
  $g.DrawString($Tagline, $tagFont, $dimBrush, $tagRect)
  $g.FillRectangle($rule, $x, 526, 8, 8)
  Add-TrackedText $g $Domain.ToUpperInvariant() $domainFont $paperBrush ($x + 22) 519 2.6

  $rule.Dispose(); $azureBrush.Dispose(); $paperBrush.Dispose(); $dimBrush.Dispose()
  $kickerFont.Dispose(); $nameFont.Dispose(); $tagFont.Dispose(); $domainFont.Dispose()
  return $c
}

Save-Png (New-OgImage) (Join-Path $BrandingDir "og-image.png")

# --------------------------------------------------------------------------
# Smaller portrait for small placements (640px wide, same aspect ratio)
# --------------------------------------------------------------------------

$smallW = 640
$smallH = [int][Math]::Round($photo.Height * $smallW / $photo.Width)
$small = New-Canvas $smallW $smallH
$attrs = New-ToneAttributes
$small.Graphics.DrawImage($photo, (New-Object System.Drawing.Rectangle(0, 0, $smallW, $smallH)), 0, 0, $photo.Width, $photo.Height, [System.Drawing.GraphicsUnit]::Pixel, $attrs)
$attrs.Dispose()
Save-Png $small (Join-Path $ProfileDir "headshot-640.png")

$photo.Dispose()
Write-Host "Done. Next: node scripts/optimize-png.mjs, then node scripts/build-ico.mjs (or just: npm run icons)"
