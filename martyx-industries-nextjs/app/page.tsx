import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import Newsletter from "@/components/Newsletter";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "Home",
  description: "Premium 3D-printed RC models and components. High-precision manufacturing for enthusiasts and professionals. Discover custom tanks, vehicles, and parts.",
};

// ISR Configuration: Revalidate every 5 minutes with tag-based revalidation
export const revalidate = 300;

interface Product {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  price: number;
  currency: string;
  gallery?: Array<{
    id: string;
    url: string;
    alt?: string;
  }>;
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}/api/v1/products?featured=true&limit=6`, {
      next: {
        revalidate: 300,
        tags: ['home', 'products']
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data.slice(0, 6) : [];
  } catch (error) {
    console.error('Failed to fetch featured products:', error);
    return [];
  }
}

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className={styles.homePage}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Premium 3D-Printed RC Models
          </h1>
          <p className={styles.heroSubtitle}>
            High-precision manufacturing meets cutting-edge design.
            Discover professional-grade RC components and custom models.
          </p>

          <div className={styles.heroButtons}>
            <Link href="/products" className="primary-btn">
              Browse Products
            </Link>
            <Link href="/about" className="secondary-btn">
              Learn More
            </Link>
          </div>

          <div className={styles.keyFacts}>
            <div className={styles.keyFact}>
              <span className={styles.factNumber}>500+</span>
              <span className={styles.factLabel}>Models Printed</span>
            </div>
            <div className={styles.keyFact}>
              <span className={styles.factNumber}>0.1mm</span>
              <span className={styles.factLabel}>Precision</span>
            </div>
            <div className={styles.keyFact}>
              <span className={styles.factNumber}>48h</span>
              <span className={styles.factLabel}>Avg. Delivery</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorksSection}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>How It Works</h2>

          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>Choose Your Model</h3>
              <p className={styles.stepDescription}>
                Browse our collection of premium RC models and components.
                Each product is designed with precision and tested for durability.
              </p>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>Customize & Order</h3>
              <p className={styles.stepDescription}>
                Select your preferred materials, colors, and specifications.
                Our advanced 3D printing technology ensures perfect results.
              </p>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>Receive & Enjoy</h3>
              <p className={styles.stepDescription}>
                Get your custom-printed model delivered ready to assemble.
                Professional quality, shipped fast to your door.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className={styles.productsSection}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Featured Products</h2>

          {featuredProducts.length === 0 ? (
            <div className={styles.noProducts}>
              <p>No featured products available at the moment.</p>
              <Link href="/products" className="primary-btn">
                View All Products
              </Link>
            </div>
          ) : (
            <div className={styles.productsGrid}>
              {featuredProducts.map((product) => (
                <div key={product.id} className={styles.productCard}>
                  {product.gallery && product.gallery.length > 0 ? (
                    <div className={styles.productImage}>
                      <Image
                        src={product.gallery[0].url}
                        alt={product.gallery[0].alt || product.title}
                        fill
                        className={styles.image}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className={styles.productImagePlaceholder}>
                      <span>No Image</span>
                    </div>
                  )}

                  <div className={styles.productInfo}>
                    <h3 className={styles.productTitle}>{product.title}</h3>
                    {product.shortDescription && (
                      <p className={styles.productDescription}>
                        {product.shortDescription}
                      </p>
                    )}

                    <div className={styles.productFooter}>
                      <span className={styles.productPrice}>
                        {product.price} {product.currency}
                      </span>
                      <Link
                        href={`/products/${product.slug}`}
                        className={styles.productLink}
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.viewAllContainer}>
            <Link href="/products" className="secondary-btn">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={styles.testimonialsSection}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>What Our Customers Say</h2>

          <div className={styles.testimonialsGrid}>
            <div className={styles.testimonial}>
              <div className={styles.testimonialRating}>★★★★★</div>
              <p className={styles.testimonialText}>
                &ldquo;The quality is outstanding! The precision and detail in every print
                is exactly what I needed for my RC projects.&rdquo;
              </p>
              <p className={styles.testimonialAuthor}>— Martin K., RC Enthusiast</p>
            </div>

            <div className={styles.testimonial}>
              <div className={styles.testimonialRating}>★★★★★</div>
              <p className={styles.testimonialText}>
                &ldquo;Fast delivery and professional service. The custom tank components
                fit perfectly and look amazing.&rdquo;
              </p>
              <p className={styles.testimonialAuthor}>— Peter S., Model Builder</p>
            </div>

            <div className={styles.testimonial}>
              <div className={styles.testimonialRating}>★★★★★</div>
              <p className={styles.testimonialText}>
                &ldquo;I&apos;ve ordered multiple times and the consistency is incredible.
                MartyX Industries is now my go-to for all RC parts.&rdquo;
              </p>
              <p className={styles.testimonialAuthor}>— Jana D., Professional Racer</p>
            </div>

            <div className={styles.testimonial}>
              <div className={styles.testimonialRating}>★★★★★</div>
              <p className={styles.testimonialText}>
                &ldquo;The attention to detail and customer support is exceptional.
                They helped me design a custom chassis that exceeded expectations.&rdquo;
              </p>
              <p className={styles.testimonialAuthor}>— Lukáš M., Designer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className={styles.newsletterSection}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Stay Updated</h2>
          <p className={styles.newsletterDescription}>
            Subscribe to our newsletter for the latest products, special offers, and RC tips.
          </p>
          <Newsletter />
        </div>
      </section>
    </div>
  );
}
