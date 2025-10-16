import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  keywords?: string[];
}

/**
 * SEO Component for Dynamic Meta Tags
 * Updates document head with SEO-optimized meta tags
 */
export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  image,
  url,
  type = 'website',
  keywords = []
}) => {
  useEffect(() => {
    // Update page title
    document.title = `${title} | Martyx Industries`;

    const metaTags = [
      // Standard meta tags
      { name: 'description', content: description },
      { name: 'keywords', content: keywords.join(', ') },

      // Open Graph (Facebook, LinkedIn)
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: type },
      { property: 'og:image', content: image || 'https://martyx-industries.com/og-image.jpg' },
      { property: 'og:url', content: url || window.location.href },
      { property: 'og:site_name', content: 'Martyx Industries' },

      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image || 'https://martyx-industries.com/og-image.jpg' },

      // Additional SEO
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'Martyx Industries' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }
    ];

    // Update or create meta tags
    metaTags.forEach(({ name, property, content }) => {
      const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;

      if (!meta) {
        meta = document.createElement('meta');
        if (name) meta.setAttribute('name', name);
        if (property) meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }

      meta.setAttribute('content', content);
    });

    // Cleanup function
    return () => {
      // Optionally reset to defaults on unmount
    };
  }, [title, description, image, url, type, keywords]);

  return null;
};

export default SEO;
