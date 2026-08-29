import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Placeholder content ships as local SVGs; safe here since all image
    // sources are our own static assets, never user-uploaded.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
  },
  // The dev-mode route/build indicator badge is a development aid only —
  // it never ships in a production build regardless of this flag, but we
  // turn it off explicitly so it never appears in any local preview either.
  devIndicators: false,
};

export default nextConfig;
