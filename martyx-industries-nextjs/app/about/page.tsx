import Link from "next/link";
// About page is static, no API needed
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "O Martyx Industries",
    description: "Spájame vášeň pre RC modelárstvo s najmodernejšou technológiou 3D tlače. Kvalitné STL súbory a RC komponenty.",
    openGraph: {
      title: "O Martyx Industries | Inovatívne 3D riešenia",
      description: "Spájame vášeň pre RC modelárstvo s najmodernejšou technológiou 3D tlače. Kvalitné STL súbory a RC komponenty.",
    },
  };
}

export const revalidate = 86400; // Revalidate daily

export default function AboutPage() {

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            O Martyx Industries
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Spájame vášeň pre RC modelárstvo s najmodernejšou technológiou 3D tlače
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <div className="prose prose-lg max-w-none">
              <h2>Vitajte v Martyx Industries</h2>
              <p>Sme vášniví tvorcovia prémiových 3D tlačených RC modelov a komponentov. Naším poslaním je poskytovať nadšencom a profesionálom vysokokvalitné, presne navrhnuté produkty, ktoré prekračujú očakávania.</p>

              <h3>Náš príbeh</h3>
              <p>Založená RC nadšencami, Martyx Industries kombinuje špičkovú technológiu 3D tlače s hlbokými znalosťami diaľkovo ovládaných vozidiel. Rozumieme tomu, čo je potrebné na vytvorenie produktov, ktoré spoľahlivo fungujú v náročných podmienkach.</p>

              <h3>Záväzok kvality</h3>
              <p>Každý produkt, ktorý vytvárame, prechádza prísnym testovaním a kontrolou kvality. Používame len prémiové materiály a najmodernejšiu tlačovú technológiu na zabezpečenie trvanlivosti a presnosti každého komponentu.</p>

              <h3>Inovácie</h3>
              <p>Neustále posúvame hranice toho, čo je možné s technológiou 3D tlače, vyvíjame nové techniky a materiály na vytvorenie produktov, ktoré bolo predtým nemožné vyrobiť.</p>
            </div>
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