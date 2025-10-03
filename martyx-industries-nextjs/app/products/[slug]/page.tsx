import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProductSlugs } from "@/lib/api";
import type { Metadata } from "next";

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-blue-600">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/products" className="hover:text-blue-600">
                Products
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900">{product.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Gallery */}
          <div className="space-y-4">
            {product.gallery && product.gallery.length > 0 ? (
              <>
                {/* Main Image */}
                <div className="relative h-96 lg:h-[500px] overflow-hidden rounded-lg">
                  <Image
                    src={product.gallery[0].url}
                    alt={product.gallery[0].alt || product.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </div>

                {/* Thumbnail Gallery */}
                {product.gallery.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.gallery.slice(1, 5).map((image, index) => (
                      <div key={index} className="relative h-24 overflow-hidden rounded">
                        <Image
                          src={image.url}
                          alt={image.alt || `${product.title} - Image ${index + 2}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 25vw, 12.5vw"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="h-96 lg:h-[500px] bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">No images available</span>
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.title}
              </h1>

              {product.category && (
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mb-4">
                  {product.category}
                </span>
              )}

              <div className="text-4xl font-bold text-blue-600 mb-6">
                {product.price} {product.currency}
              </div>

              {product.shortDescription && (
                <p className="text-lg text-gray-700 mb-6">
                  {product.shortDescription}
                </p>
              )}
            </div>

            {/* Product Description */}
            {product.description && (
              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold mb-3">Description</h3>
                <div
                  className="text-gray-700"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            {/* Specifications */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Specifications</h3>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <table className="w-full">
                    <tbody>
                      {Object.entries(product.specs).map(([key, value]) => (
                        <tr key={key} className="border-b last:border-b-0">
                          <td className="py-2 pr-4 font-medium text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </td>
                          <td className="py-2 text-gray-900">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors">
                Add to Cart
              </button>

              <button className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-colors">
                Add to Wishlist
              </button>
            </div>

            {/* Product Meta */}
            <div className="text-sm text-gray-500 space-y-1">
              {product.createdAt && (
                <p>Added: {new Date(product.createdAt).toLocaleDateString()}</p>
              )}
              {product.updatedAt && (
                <p>Last updated: {new Date(product.updatedAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}