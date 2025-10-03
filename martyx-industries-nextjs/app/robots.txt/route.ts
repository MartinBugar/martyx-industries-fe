export function GET() {
  const robotsTxt = `
User-agent: *
Allow: /

# Sitemap
Sitemap: https://martyx-industries.com/sitemap.xml

# Disallow admin and API routes
Disallow: /api/
Disallow: /admin/
Disallow: /_next/

# Allow specific paths
Allow: /products/
Allow: /about
Allow: /documents
`.trim();

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}