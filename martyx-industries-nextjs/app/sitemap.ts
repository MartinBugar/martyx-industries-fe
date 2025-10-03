import { MetadataRoute } from 'next'
import { getProductSlugs } from '@/lib/api'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://martyx-industries.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/documents`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]

  // Dynamic product pages
  try {
    // Only try to fetch product slugs if API_BASE_URL is available
    if (process.env.API_BASE_URL) {
      const productSlugs = await getProductSlugs()
      const productPages: MetadataRoute.Sitemap = productSlugs.map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }))

      return [...staticPages, ...productPages]
    } else {
      console.warn('API_BASE_URL not set during build, skipping dynamic product pages in sitemap')
      return staticPages
    }
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return staticPages
  }
}
