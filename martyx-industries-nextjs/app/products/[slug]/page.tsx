import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProductSlugs } from "@/lib/api";
import type { Metadata } from "next";
import ProductGallery from "@/components/ProductGallery";
import AddToCart from "@/components/AddToCart";
import ProductTabs from "@/components/ProductTabs";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await getProductSlugs();
    return slugs.map((item) => ({
      slug: item.slug,
    }));
  } catch (_error) {
    // Return empty array if API is not available during build
    // This enables fallback mode where pages are generated on-demand
    console.warn('Unable to fetch product slugs during build time - using fallback mode');
    return [];
  }
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);

    const title = product.seo?.title || product.title;
    const description = product.seo?.description || product.shortDescription || product.description;
    const keywords = product.seo?.keywords || [];

    return {
      title,
      description,
      keywords,
      openGraph: {
        title: `${title} | MartyX Industries`,
        description: description || '',
        images: product.gallery?.length ? [
          {
            url: product.gallery[0].url,
            alt: product.gallery[0].alt || product.title,
          }
        ] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | MartyX Industries`,
        description: description || '',
        images: product.gallery?.length ? [product.gallery[0].url] : [],
      },
    };
  } catch (_error) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
    };
  }
}

export const revalidate = 3600; // Revalidate every hour

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  let product;

  try {
    product = await getProductBySlug(slug);
  } catch (_error) {
    notFound();
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="main-content">
      <div className="container">
        {/* Breadcrumbs */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <li>
              <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/products" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                Products
              </Link>
            </li>
            {product.category && (
              <>
                <li>/</li>
                <li>{product.category}</li>
              </>
            )}
            <li>/</li>
            <li style={{ color: 'var(--text-primary)' }}>{product.title}</li>
          </ol>
        </nav>

        {/* Product Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '3rem',
          marginBottom: '4rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            alignItems: 'start'
          }}>
            {/* Left Column - Gallery */}
            <ProductGallery gallery={product.gallery || []} title={product.title} />

            {/* Right Column - Product Info */}
            <div>
              {/* Category */}
              {product.category && (
                <span style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: 'var(--accent-color)',
                  color: 'white',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  marginBottom: '1rem'
                }}>
                  {product.category}
                </span>
              )}

              {/* Title */}
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                lineHeight: '1.2'
              }}>
                {product.title}
              </h1>

              {/* Short Description */}
              {product.shortDescription && (
                <p style={{
                  fontSize: '1.125rem',
                  color: 'var(--text-muted)',
                  marginBottom: '1.5rem',
                  lineHeight: '1.6'
                }}>
                  {product.shortDescription}
                </p>
              )}

              {/* Price */}
              <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: 'var(--accent-color)',
                marginBottom: '2rem'
              }}>
                {product.price} {product.currency}
              </div>

              {/* Add to Cart */}
              <AddToCart product={product} />

              {/* Availability & Shipping */}
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Availability:</strong>
                  <span style={{ color: 'var(--success-color)', marginLeft: '0.5rem' }}>In Stock</span>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Shipping:</strong>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    Worldwide shipping available
                  </span>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Processing Time:</strong>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    3-5 business days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs - Description, Specs, Reviews */}
        <ProductTabs
          description={product.description}
          specs={product.specs}
        />
      </div>
    </div>
  );
}