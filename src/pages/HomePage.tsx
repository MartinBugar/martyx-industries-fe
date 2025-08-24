import React, { lazy, Suspense } from "react";
import "../styles/home.css";
import Hero from "../components/home/Hero";
import HowItWorks from "../components/home/HowItWorks";
import FeaturedProducts from "../components/home/FeaturedProducts";
import Testimonials from "../components/home/Testimonials";
import Newsletter from "../components/home/Newsletter";

const Interactive3D = lazy(() => import("../components/home/Interactive3D"));
const VideoDemo = lazy(() => import("../components/home/VideoDemo"));

export default function HomePage() {
  return (
    <main className="home" role="main">
      <Hero />
      <section className="section"><HowItWorks /></section>
      <section className="section"><FeaturedProducts /></section>
      <section className="section">
        <Suspense fallback={<div className="card">Loading 3D…</div>}>
          <Interactive3D />
        </Suspense>
      </section>
      <section className="section">
        <Suspense fallback={<div className="card">Loading video…</div>}>
          <VideoDemo />
        </Suspense>
      </section>
      <section className="section"><Testimonials /></section>
      <section className="section"><Newsletter /></section>
    </main>
  );
}
