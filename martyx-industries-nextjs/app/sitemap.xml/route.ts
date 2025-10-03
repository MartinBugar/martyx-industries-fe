import { getProductSlugs } from '@/lib/api';

export async function GET() {
  const baseUrl = 'https://martyx-industries.com';

  // Static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/documents`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
  ];

  // Dynamic product routes
  let productRoutes: Array<{
    url: string;
    lastModified: string;
    changeFrequency: 'weekly';
    priority: number;
  }> = [];

  try {
    const productSlugs = await getProductSlugs();
    productRoutes = productSlugs.map(({ slug }) => ({
      url: `${baseUrl}/products/${slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (_error) {
    console.warn('Unable to fetch product slugs for sitemap - continuing with static routes only');
    // Continue with static routes even if product routes fail
  }

  // Combine all routes
  const allRoutes = [...staticRoutes, ...productRoutes];

  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (route) => `  <url>
    <loc>${route.url}</loc>
    <lastmod>${route.lastModified}</lastmod>
    <changefreq>${route.changeFrequency}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}