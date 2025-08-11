// Product data for the 3D model e-shop
import axisModel from '../assets/axis.glb';
const basePath = import.meta.env.BASE_URL ?? '/';
const makeGallery = (productId: string, count: number) => Array.from({ length: count }, (_, i) => `${basePath}productsGallery/${productId}/${i + 1}.png`);

export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  modelPath: string;
  gallery: string[];
  interactionInstructions: string[];
  productType: 'DIGITAL' | 'PHYSICAL';
}

// Base interaction instructions shared across products
const baseInteractionInstructions: string[] = [
  "Click and drag to rotate",
  "Scroll to zoom in/out",
  "Right-click and drag to pan"
];

// Default model viewer settings
export const defaultModelViewerSettings = {
  poster: "poster.webp",
  cameraOrbit: "3.953671009374416rad 1.3734740705980852red 55deg 4m",
  touchAction: "pan-y",
  alt: "A 3D model of an axis coordinate system",
  cameraControls: true,
  autoRotate: false,
  interactionPrompt: "none" as 'auto' | 'when-focused' | 'none',
  shadowIntensity: "1.38",
  exposure: 0.42,
  environmentImage: "legacy",
  shadowSoftness: "1",
  toneMapping: "neutral" as 'auto' | 'commerce' | 'filmic' | 'neutral' | 'legacy',
  metallicFactor: "0.28",
  roughnessFactor: "0.36",
  height: "500px"
};

// Multiple products array for the catalog
export const products: Product[] = [
  {
    id: "1",
    name: "Endeavour - 3D printed RC APC",
    price: 99.99,
    currency: "USD",
    description: "High-quality 3D model of an axis coordinate system. Perfect for educational purposes, visualization projects, or as a reference for 3D modeling and game development.",
    features: [
      "High-resolution textures",
      "Fully interactive 3D model",
      "Adjustable material properties",
      "Compatible with all major 3D software"
    ],
    modelPath: axisModel,
    gallery: makeGallery("1", 6),
    interactionInstructions: baseInteractionInstructions,
    productType: 'DIGITAL'
  },
  {
    id: "2",
    name: "Endeavour Pro - RC APC Variant",
    price: 129.99,
    currency: "USD",
    description: "Enhanced variant with extended features and higher detail level for professional use and display.",
    features: [
      "High-resolution textures",
      "Extended interaction presets",
      "Optimized for performance",
      "Great for demos and showcases"
    ],
    modelPath: axisModel,
    gallery: [],
    interactionInstructions: baseInteractionInstructions,
    productType: 'DIGITAL'
  },
  {
    id: "3",
    name: "Endeavour Lite - Educational Pack",
    price: 59.99,
    currency: "USD",
    description: "Lightweight version ideal for teaching fundamentals and quick previews.",
    features: [
      "Lightweight assets",
      "Fast loading",
      "Perfect for learning",
      "Beginner friendly"
    ],
    modelPath: axisModel,
    gallery: [],
    interactionInstructions: baseInteractionInstructions,
    productType: 'DIGITAL'
  }
];

export const product: Product = products[0];