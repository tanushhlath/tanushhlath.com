import type { MetadataRoute } from "next";
import { getAllWorkSlugs } from "@/lib/content";

const siteUrl = "https://tanushhlath.com";

const staticRoutes = ["", "/story", "/work", "/me", "/beyond", "/archive", "/explore"];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));
  const workEntries = getAllWorkSlugs().map((slug) => ({
    url: `${siteUrl}/work/${slug}`,
    lastModified: new Date(),
  }));
  return [...staticEntries, ...workEntries];
}
