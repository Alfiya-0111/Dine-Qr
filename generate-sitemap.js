// generate-sitemap.js
import { writeFileSync } from "fs";

const FIREBASE_URL = "https://YOUR-PROJECT.firebaseio.com/restaurants.json";

async function generateSitemap() {
  const res = await fetch(FIREBASE_URL);
  const restaurants = await res.json();

  const ids = restaurants ? Object.keys(restaurants) : [];

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
  </url>`;

  const restaurantUrls = ids.map(id => `
  <url>
    <loc>https://khaatogo.com/menu/${id}</loc>
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
  console.log(`✅ ${ids.length} restaurants ka sitemap ready!`);
}

generateSitemap();