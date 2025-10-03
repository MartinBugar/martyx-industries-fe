import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartProvider } from "@/context/CartContext";
import I18nProvider from "@/components/I18nProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://martyx-industries.com'),
  title: {
    default: 'MartyX Industries - Premium 3D-Printed RC Models',
    template: '%s | MartyX Industries'
  },
  description: 'Premium 3D-printed RC models and components. Discover high-quality remote control tanks, vehicles, and custom parts designed for enthusiasts and professionals.',
  keywords: ['3D printing', 'RC models', 'remote control', 'tanks', 'vehicles', 'custom parts', 'hobby'],
  authors: [{ name: 'MartyX Industries' }],
  creator: 'MartyX Industries',
  publisher: 'MartyX Industries',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://martyx-industries.com',
    siteName: 'MartyX Industries',
    title: 'MartyX Industries - Premium 3D-Printed RC Models',
    description: 'Premium 3D-printed RC models and components for enthusiasts and professionals.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MartyX Industries - Premium 3D-Printed RC Models',
    description: 'Premium 3D-printed RC models and components for enthusiasts and professionals.',
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://martyx-industries.com/" />
      </head>
      <body className={`${inter.variable} app-container`}>
        <I18nProvider>
          <WishlistProvider>
            <CartProvider>
              <Navbar cartCount={0} />
              <main className="main-content">
                {children}
              </main>
              <Footer />
            </CartProvider>
          </WishlistProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
