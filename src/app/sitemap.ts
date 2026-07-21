import type { MetadataRoute } from "next";

const siteUrl = "https://pondoflow.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/pricing", "/about", "/privacy-policy", "/privacy-notice", "/terms", "/login", "/signup"];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/pricing" ? 0.8 : 0.5,
  }));
}
