// generate-sitemap.js
import { writeFileSync } from "fs";

const PROJECT_ID = "dineqr-ec134";
const FIREBASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/restaurants`;

async function generateSitemap() {
  const res = await fetch(FIREBASE_URL);
  const data = await res.json();

  const slugs = (data.documents || [])
    .map(doc => doc.fields?.slug?.stringValue)
    .filter(Boolean);

  const staticUrls = `
  <url>
    <loc>https://khaatogo.com/</loc>
    <lastmod>2026-05-18</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://khaatogo.com/login</loc>
    <lastmod>2026-05-18</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://khaatogo.com/signup</loc>
    <lastmod>2026-05-18</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;

  const restaurantUrls = slugs.map(slug => `
  <url>
    <loc>https://khaatogo.com/menu/${slug}</loc>
    <lastmod>2026-05-18</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${restaurantUrls}
</urlset>`;

  writeFileSync("public/sitemap.xml", sitemap);
  console.log(`✅ ${slugs.length} restaurants ka sitemap ready!`);
}

generateSitemap();