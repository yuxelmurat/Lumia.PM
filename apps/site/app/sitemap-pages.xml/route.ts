import { SITE_URL } from "@/lib/site-config";

export const dynamic = "force-static";

const paths = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/pricing", changefreq: "monthly", priority: "0.8" },
  { loc: "/monday-alternative", changefreq: "monthly", priority: "0.7" },
  { loc: "/asana-alternative", changefreq: "monthly", priority: "0.7" },
  { loc: "/excel-alternative", changefreq: "monthly", priority: "0.7" },
];

export function GET() {
  const lastmod = new Date().toISOString();
  const urls = paths
    .map(
      (p) => `  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
