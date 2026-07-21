import type { MetadataRoute } from "next";

const siteUrl = "https://pondoflow.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/payroll", "/billing", "/employees", "/schedule", "/time", "/payslips", "/reports", "/dev", "/api"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
