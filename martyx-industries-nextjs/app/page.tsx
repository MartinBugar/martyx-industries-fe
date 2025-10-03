import Image from "next/image";
import Link from "next/link";
import { getFeaturedProducts, type Product } from "@/lib/api";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to MartyX Industries - Premium 3D-printed RC models and components for enthusiasts and professionals.",
};

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  let featuredProducts: Product[] = [];

  try {
    featuredProducts = await getFeaturedProducts();
  } catch (error) {
    console.error('Failed to fetch featured products:', error);
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-purple-900 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            MartyX Industries
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Premium 3D-printed RC models and components designed for enthusiasts and professionals
          </p>
          <Link
            href="/products"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {product.gallery && product.gallery.length > 0 && (
                  <div className="relative h-64">
                    <Image
                      src={product.gallery[0].url}
                      alt={product.gallery[0].alt || product.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{product.title}</h3>
                  {product.shortDescription && (
                    <p className="text-gray-600 mb-4">{product.shortDescription}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {product.price} {product.currency}
                    </span>
                    <Link
                      href={`/products/${product.slug}`}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Why Choose MartyX Industries?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Premium Quality</h3>
              <p className="text-gray-600">
                High-precision 3D printing with premium materials for exceptional durability and detail.
              </p>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Custom Solutions</h3>
              <p className="text-gray-600">
                Tailored RC components and models designed to meet your specific requirements.
              </p>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Expert Support</h3>
              <p className="text-gray-600">
                Professional support from RC enthusiasts who understand your passion for quality.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
