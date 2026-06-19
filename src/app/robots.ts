import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow:  [
          "/", "/colleges", "/courses", "/students", "/study-destination",
          "/about", "/our-story", "/mission", "/vision", "/careers", "/press", "/contact",
          "/trust", "/legal", "/privacy", "/terms",
          "/resources", "/blog", "/insights", "/success-stories", "/help",
        ],
        disallow: [
          "/dashboard/",
          "/api/",
          "/admin/",
          "/login",
          "/signup",
          "/activate-account",
          "/verify-email",
          "/forgot-password",
          "/reset-password",
          "/invoices/",
          "/receipts/",
        ],
      },
    ],
    sitemap: "https://pathport.sg/sitemap.xml",
  };
}
