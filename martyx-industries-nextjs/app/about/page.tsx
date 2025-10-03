import Link from "next/link";
import { getAboutPage } from "@/lib/api";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const aboutData = await getAboutPage();

    return {
      title: aboutData.seo?.title || aboutData.title || "About Us",
      description: aboutData.seo?.description || "Learn more about MartyX Industries and our passion for premium 3D-printed RC models.",
      openGraph: {
        title: `${aboutData.seo?.title || aboutData.title || "About Us"} | MartyX Industries`,
        description: aboutData.seo?.description || "Learn more about MartyX Industries and our passion for premium 3D-printed RC models.",
      },
    };
  } catch (_error) {
    return {
      title: "About Us",
      description: "Learn more about MartyX Industries and our passion for premium 3D-printed RC models.",
    };
  }
}

export const revalidate = 86400; // Revalidate daily

export default async function AboutPage() {
  let aboutData;

  try {
    aboutData = await getAboutPage();
  } catch (_error) {
    // Fallback content if API fails
    aboutData = {
      title: "About MartyX Industries",
      content: `
        <div class="prose max-w-none">
          <h2>Welcome to MartyX Industries</h2>
          <p>We are passionate creators of premium 3D-printed RC models and components. Our mission is to provide enthusiasts and professionals with high-quality, precision-engineered products that exceed expectations.</p>

          <h3>Our Story</h3>
          <p>Founded by RC enthusiasts, MartyX Industries combines cutting-edge 3D printing technology with deep knowledge of remote control vehicles. We understand what it takes to create products that perform reliably in demanding conditions.</p>

          <h3>Quality Commitment</h3>
          <p>Every product we create undergoes rigorous testing and quality control. We use only premium materials and state-of-the-art printing technology to ensure durability and precision in every component.</p>

          <h3>Innovation</h3>
          <p>We continuously push the boundaries of what's possible with 3D printing technology, developing new techniques and materials to create products that were previously impossible to manufacture.</p>
        </div>
      `
    };
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {aboutData.title || "About MartyX Industries"}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Crafting the future of RC modeling with precision 3D printing technology
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: aboutData.content }}
            />
          </div>

          {/* Values Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality First</h3>
              <p className="text-gray-600">
                Rigorous testing and premium materials ensure every product meets our high standards.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Innovation</h3>
              <p className="text-gray-600">
                Pushing the boundaries of 3D printing to create previously impossible designs.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Community</h3>
              <p className="text-gray-600">
                Built by enthusiasts, for enthusiasts. We understand your passion for RC modeling.
              </p>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="bg-blue-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-6 opacity-90">
              Explore our products or get in touch to discuss custom solutions.
            </p>
            <div className="space-x-4">
              <Link
                href="/products"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
              >
                Browse Products
              </Link>
              <Link
                href="/contact"
                className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-block"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}