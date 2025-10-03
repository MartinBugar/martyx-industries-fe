import { getProducts, type Product } from "@/lib/api";
import type { Metadata } from "next";
import ProductsGrid from "@/components/ProductsGrid";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Products | MartyX Industries",
  description: "Browse our premium 3D-printed RC models and components. High-quality remote control tanks, vehicles, and custom parts manufactured with precision.",
  openGraph: {
    title: "Products | MartyX Industries",
    description: "Browse our collection of premium 3D-printed RC models and components.",
  },
};

// ISR configuration with tag-based revalidation
export const revalidate = 300; // Revalidate every 5 minutes

export default async function ProductsPage() {
  let products: Product[] = [];
  let totalCount: number = 0;
  let hasMore: boolean = false;

  try {
    // Fetch with ISR and tags - Spring Data pages are 0-indexed
    const result = await getProducts(0, 50);
    products = Array.isArray(result?.products) ? result.products : [];
    totalCount = result?.totalCount || 0;
    hasMore = result?.hasMore || false;

    console.log(`📊 Products page loaded: ${products.length} products, total: ${totalCount}`);
  } catch (error) {
    console.error('❌ Failed to fetch products in page component:', error);
    products = [];
    totalCount = 0;
    hasMore = false;
  }

  // Extract unique categories from products
  const categories = Array.from(
    new Set(products.map(p => p.category).filter(Boolean))
  ) as string[];

  return (
    <div className="main-content">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Products</h1>
          <p className={`text-lg ${styles['page-description']}`}>
            Discover our collection of premium 3D-printed RC models and components
          </p>
        </div>

        {/* Client Component with search/filter */}
        <ProductsGrid
          initialProducts={products}
          categories={categories}
          totalCount={totalCount}
        />

        {hasMore && (
          <p className={`text-center mt-8 ${styles['more-products-text']}`}>
            More products available. Use search and filters to find specific items.
          </p>
        )}
      </div>
    </div>
  );
}
