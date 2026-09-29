<#
  Responsive copies of the site's photos (Windows only).

  Run automatically by scripts/media-manifest.mjs (through
  scripts/lib/media-variants.mjs), which decides what needs writing and
  passes a job file. Not meant to be run by hand.

  For every job it reads the source photo once and writes each requested
  output: smaller copies for cards and thumbnails, plus a full-size JPEG
  of PNG photos (same pixels, a fraction of the bytes). The originals are
  never touched.

    - EXIF orientation is applied to the pixels, so a copy never needs it.
    - The copies carry no metadata at all (fresh encodes: no EXIF, GPS,
      XMP, text chunks or content credentials).
    - "flatten" jobs (opaque photos, screenshots with rounded transparent
      corners) are written as JPEG: pixels that are transparent take the
      colour of their nearest opaque neighbours instead of turning black.
    - other jobs (real transparency: cut-outs, logos) are written as PNG.

  Job file (UTF-8 JSON):
    [ { "source": "C:\...\public\media\events\x\1.png", "flatten": true,
        "outputs": [ { "width": 320, "height": 172, "path": "C:\...\_w\1-320.3f2a9c1b.jpg" } ] } ]

  Prints one line per job: "ok <index>" or "fail <index> <message>".

  Uses System.Drawing, built into Windows PowerShell 5.1.
  This file is plain ASCII on purpose (PowerShell 5.1 reads scripts as ANSI).
#>
param(
  [Parameter(Mandatory = $true)][string]$Jobs,
  # JPEG quality, 0-100.
  [int]$Quality = 84
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

if (-not ("MediaThumbs" -as [type])) {
  Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class MediaThumbs {
  public static void Render(string source, bool flatten, int[] widths, int[] heights, string[] paths, long quality) {
    byte[] bytes = File.ReadAllBytes(source);
    using (MemoryStream stream = new MemoryStream(bytes))
    using (Image image = Image.FromStream(stream, false, true))
    using (Bitmap pixels = Upright(image)) {
      if (flatten) Flatten(pixels);
      for (int i = 0; i < widths.Length; i++) {
        using (Bitmap output = Resize(pixels, widths[i], heights[i], !flatten)) {
          Save(output, paths[i], flatten, quality);
        }
      }
    }
  }

  // A 32-bit copy of the image with its EXIF orientation applied to the pixels.
  static Bitmap Upright(Image image) {
    Bitmap bmp = new Bitmap(image.Width, image.Height, PixelFormat.Format32bppArgb);
    bmp.SetResolution(96, 96);
    using (Graphics g = Graphics.FromImage(bmp)) {
      g.CompositingMode = CompositingMode.SourceCopy;
      g.InterpolationMode = InterpolationMode.NearestNeighbor;
      g.PixelOffsetMode = PixelOffsetMode.Half;
      g.DrawImage(image, new Rectangle(0, 0, image.Width, image.Height), 0, 0, image.Width, image.Height, GraphicsUnit.Pixel);
    }
    int orientation = 1;
    foreach (int id in image.PropertyIdList) {
      if (id != 0x0112) continue;
      byte[] value = image.GetPropertyItem(id).Value;
      if (value != null && value.Length >= 2) orientation = BitConverter.ToUInt16(value, 0);
    }
    RotateFlipType turn = RotateFlipType.RotateNoneFlipNone;
    switch (orientation) {
      case 2: turn = RotateFlipType.RotateNoneFlipX; break;
      case 3: turn = RotateFlipType.Rotate180FlipNone; break;
      case 4: turn = RotateFlipType.Rotate180FlipX; break;
      case 5: turn = RotateFlipType.Rotate90FlipX; break;
      case 6: turn = RotateFlipType.Rotate90FlipNone; break;
      case 7: turn = RotateFlipType.Rotate270FlipX; break;
      case 8: turn = RotateFlipType.Rotate270FlipNone; break;
    }
    if (turn != RotateFlipType.RotateNoneFlipNone) bmp.RotateFlip(turn);
    return bmp;
  }

  // Makes every pixel opaque. Pixels at least half opaque keep their colour;
  // the rest (rounded screenshot corners) take the average colour of their
  // already-known neighbours, filled inwards ring by ring.
  static void Flatten(Bitmap bmp) {
    int w = bmp.Width, h = bmp.Height;
    Rectangle rect = new Rectangle(0, 0, w, h);
    BitmapData data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    try {
      int stride = data.Stride;
      byte[] px = new byte[stride * h];
      Marshal.Copy(data.Scan0, px, 0, px.Length);
      bool[] known = new bool[w * h];
      bool[] queued = new bool[w * h];
      bool any = false, missing = false;
      for (int y = 0; y < h; y++) {
        for (int x = 0; x < w; x++) {
          bool k = px[y * stride + x * 4 + 3] >= 128;
          known[y * w + x] = k;
          if (k) any = true; else missing = true;
        }
      }
      if (any && missing) {
        List<int> ring = new List<int>();
        for (int i = 0; i < w * h; i++) {
          if (!known[i] && Touches(known, i, w, h)) { ring.Add(i); queued[i] = true; }
        }
        while (ring.Count > 0) {
          int[] colour = new int[ring.Count * 3];
          for (int r = 0; r < ring.Count; r++) {
            int i = ring[r], x0 = i % w, y0 = i / w, n = 0, sb = 0, sg = 0, sr = 0;
            for (int dy = -1; dy <= 1; dy++) {
              for (int dx = -1; dx <= 1; dx++) {
                int x = x0 + dx, y = y0 + dy;
                if ((dx == 0 && dy == 0) || x < 0 || y < 0 || x >= w || y >= h || !known[y * w + x]) continue;
                int o = y * stride + x * 4;
                sb += px[o]; sg += px[o + 1]; sr += px[o + 2]; n++;
              }
            }
            colour[r * 3] = sb / n; colour[r * 3 + 1] = sg / n; colour[r * 3 + 2] = sr / n;
          }
          List<int> next = new List<int>();
          for (int r = 0; r < ring.Count; r++) {
            int i = ring[r], o = (i / w) * stride + (i % w) * 4;
            px[o] = (byte)colour[r * 3]; px[o + 1] = (byte)colour[r * 3 + 1]; px[o + 2] = (byte)colour[r * 3 + 2];
            known[i] = true;
          }
          for (int r = 0; r < ring.Count; r++) {
            int i = ring[r], x0 = i % w, y0 = i / w;
            for (int dy = -1; dy <= 1; dy++) {
              for (int dx = -1; dx <= 1; dx++) {
                int x = x0 + dx, y = y0 + dy;
                if (x < 0 || y < 0 || x >= w || y >= h) continue;
                int j = y * w + x;
                if (!known[j] && !queued[j]) { queued[j] = true; next.Add(j); }
              }
            }
          }
          ring = next;
        }
      }
      for (int y = 0; y < h; y++) {
        for (int x = 0; x < w; x++) px[y * stride + x * 4 + 3] = 255;
      }
      Marshal.Copy(px, 0, data.Scan0, px.Length);
    } finally {
      bmp.UnlockBits(data);
    }
  }

  static bool Touches(bool[] known, int i, int w, int h) {
    int x0 = i % w, y0 = i / w;
    for (int dy = -1; dy <= 1; dy++) {
      for (int dx = -1; dx <= 1; dx++) {
        int x = x0 + dx, y = y0 + dy;
        if (x >= 0 && y >= 0 && x < w && y < h && known[y * w + x]) return true;
      }
    }
    return false;
  }

  // High-quality resample (bicubic with prefiltering, mirrored edges so the
  // border never darkens). Same size = exact copy.
  static Bitmap Resize(Bitmap src, int width, int height, bool alpha) {
    PixelFormat format = alpha ? PixelFormat.Format32bppArgb : PixelFormat.Format24bppRgb;
    if (width == src.Width && height == src.Height) {
      Bitmap copy = src.Clone(new Rectangle(0, 0, width, height), format);
      copy.SetResolution(96, 96);
      return copy;
    }
    Bitmap dst = new Bitmap(width, height, format);
    dst.SetResolution(96, 96);
    using (Graphics g = Graphics.FromImage(dst))
    using (ImageAttributes attrs = new ImageAttributes()) {
      g.CompositingMode = CompositingMode.SourceCopy;
      g.CompositingQuality = CompositingQuality.HighQuality;
      g.InterpolationMode = InterpolationMode.HighQualityBicubic;
      g.PixelOffsetMode = PixelOffsetMode.HighQuality;
      g.SmoothingMode = SmoothingMode.HighQuality;
      attrs.SetWrapMode(WrapMode.TileFlipXY);
      g.DrawImage(src, new Rectangle(0, 0, width, height), 0, 0, src.Width, src.Height, GraphicsUnit.Pixel, attrs);
    }
    return dst;
  }

  // Writes next to the target first, then swaps it in, so a failed run never
  // leaves a half-written file under the final name.
  static void Save(Bitmap bmp, string path, bool jpeg, long quality) {
    string temp = path + ".tmp";
    if (jpeg) {
      ImageCodecInfo codec = null;
      foreach (ImageCodecInfo c in ImageCodecInfo.GetImageEncoders()) {
        if (c.FormatID == ImageFormat.Jpeg.Guid) codec = c;
      }
      using (EncoderParameters options = new EncoderParameters(1)) {
        options.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, quality);
        bmp.Save(temp, codec, options);
      }
    } else {
      bmp.Save(temp, ImageFormat.Png);
    }
    if (File.Exists(path)) File.Delete(path);
    File.Move(temp, path);
  }
}
"@
}

# (PowerShell 5.1 passes a parsed JSON array down the pipe as ONE object;
# ForEach-Object unrolls it into its jobs.)
$list = @(Get-Content -Raw -Encoding UTF8 -LiteralPath $Jobs | ConvertFrom-Json | ForEach-Object { $_ })
for ($index = 0; $index -lt $list.Count; $index++) {
  $job = $list[$index]
  try {
    $outputs = @($job.outputs)
    $widths = [int[]]@($outputs | ForEach-Object { [int]$_.width })
    $heights = [int[]]@($outputs | ForEach-Object { [int]$_.height })
    $paths = [string[]]@($outputs | ForEach-Object { [string]$_.path })
    foreach ($dir in ($paths | ForEach-Object { Split-Path -Parent $_ } | Select-Object -Unique)) {
      New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    [MediaThumbs]::Render([string]$job.source, [bool]$job.flatten, $widths, $heights, $paths, [long]$Quality)
    Write-Output "ok $index"
  } catch {
    $message = $_.Exception.Message -replace "\s+", " "
    Write-Output "fail $index $message"
  }
}
