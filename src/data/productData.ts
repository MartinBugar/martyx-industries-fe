// Product data for the 3D model e-shop
import axisModel from '../assets/axis.glb';

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  modelPath: string;
  interactionInstructions: string[];
}

// Main product data
export const product: Product = {
  id: "3d-axis-model",
  name: "3D Axis Coordinate System",
  price: 99.99,
  description: "High-quality 3D model of an axis coordinate system. Perfect for educational purposes, visualization projects, or as a reference for 3D modeling and game development.",
  features: [
    "High-resolution textures",
    "Fully interactive 3D model",
    "Adjustable material properties",
    "Compatible with all major 3D software"
  ],
  modelPath: axisModel,
  interactionInstructions: [
    "Click and drag to rotate",
    "Scroll to zoom in/out",
    "Right-click and drag to pan"
  ]
};

// Default model viewer settings
export const defaultModelViewerSettings = {
  poster: "poster.webp",
  cameraOrbit: "225deg 55deg 4m",
  touchAction: "pan-y",
  alt: "A 3D model of an axis coordinate system",
  cameraControls: true,
  autoRotate: false,
  interactionPrompt: "none",
  shadowIntensity: "1.38",
  exposure: 0.42,
  environmentImage: "legacy",
  shadowSoftness: "1",
  toneMapping: "neutral",
  metallicFactor: 0.28,
  roughnessFactor: 0.36,
  height: "500px"
};