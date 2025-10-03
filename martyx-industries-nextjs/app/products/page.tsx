import Image from "next/image";
import Link from "next/link";
import { getProducts, type Product } from "@/lib/api";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse our collection of premium 3D-printed RC models and components. High-quality remote control tanks, vehicles, and custom parts.",
  openGraph: {
    title: "Products | MartyX Industries",
    description: "Browse our collection of premium 3D-printed RC models and components.",
  },
};

export const dynamic = 'force-dynamic'; // Render on-demand

export default async function ProductsPage() {
  let products: Product[] = [];
  let totalCount: number = 0;
  let hasMore: boolean = false;

  try {
    const result = await getProducts(1, 20);
    products = result.products;
    totalCount = result.totalCount;
    hasMore = result.hasMore;
  } catch (error) {
    console.error('Failed to fetch products:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Products</h1>
          <p className="text-lg text-gray-600">
            Discover our collection of premium 3D-printed RC models and components
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Showing {products.length} of {totalCount} products
          </p>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group"
              >
                {/* Product Image */}
                {product.gallery && product.gallery.length > 0 ? (
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={product.gallery[0].url}
                      alt={product.gallery[0].alt || product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                  </div>
                ) : (
                  <div className="h-64 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image available</span>
                  </div>
                )}

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.title}
                  </h3>

                  {product.shortDescription && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.shortDescription}
                    </p>
                  )}

                  {product.category && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-3">
                      {product.category}
                    </span>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-blue-600">
                      {product.price} {product.currency}
                    </span>

                    {product.featured && (
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">
              No products found
            </h2>
            <p className="text-gray-500">
              Check back soon for new products!
            </p>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center mt-12">
            <Link
              href="/products?page=2"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Load More Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}