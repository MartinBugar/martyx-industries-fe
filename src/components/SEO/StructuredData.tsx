import React from 'react';

interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  sku?: string;
  averageRating?: number;
  reviewCount?: number;
}

interface StructuredDataProps {
  type: 'Product' | 'Organization' | 'WebSite';
  data?: any;
  product?: Product;
}

/**
 * Structured Data Component (Schema.org JSON-LD)
 * Helps search engines understand page content
 */
export const StructuredData: React.FC<StructuredDataProps> = ({ type, data, product }) => {
  let structuredData: any = {};

  if (type === 'Product' && product) {
    structuredData = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      'name': product.name,
      'description': product.description,
      'image': product.imageUrl || 'https://martyx-industries.com/default-product.jpg',
      'sku': product.sku || product.id.toString(),
      'offers': {
        '@type': 'Offer',
        'url': `https://martyx-industries.com/products/${product.id}`,
        'priceCurrency': product.currency || 'EUR',
        'price': product.price,
        'availability': 'https://schema.org/InStock',
        'seller': {
          '@type': 'Organization',
          'name': 'Martyx Industries'
        }
      }
    };

    // Add aggregate rating if available
    if (product.averageRating && product.reviewCount) {
      structuredData.aggregateRating = {
        '@type': 'AggregateRating',
        'ratingValue': product.averageRating,
        'reviewCount': product.reviewCount
      };
    }
  } else if (type === 'Organization') {
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'Martyx Industries',
      'url': 'https://martyx-industries.com',
      'logo': 'https://martyx-industries.com/logo.png',
      'description': '3D Printed Models and Miniatures E-commerce Platform',
      'sameAs': [
        // Add social media URLs here when available
      ]
    };
  } else if (type === 'WebSite') {
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'Martyx Industries',
      'url': 'https://martyx-industries.com',
      'potentialAction': {
        '@type': 'SearchAction',
        'target': 'https://martyx-industries.com/products?search={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    };
  } else if (data) {
    structuredData = data;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

export default StructuredData;
