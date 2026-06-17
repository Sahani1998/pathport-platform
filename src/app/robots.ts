import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow:  ["/", "/colleges", "/courses", "/students", "/study-destination"],
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
    sitemap: "https://pathport.in/sitemap.xml",
  };
}
