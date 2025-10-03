// Hardcoded frontend-specific data for products (UI, assets, tabs, etc.)
// These complement the backend ProductDto data

import { type HardcodedProductData, type ModelViewerSettings } from '../types/product';

// Default model viewer settings for product id "1"
export const defaultModelViewerSettings: ModelViewerSettings = {
    poster: undefined,
    cameraOrbit: "3.953671009374416rad 1.3734740705980852rad 55deg 1m",
    touchAction: "pan-y",
    alt: "A 3D model of an axis coordinate system",
    cameraControls: true,
    autoRotate: false,
    interactionPrompt: "none",
    shadowIntensity: "1.38",
    exposure: 0.42,
    environmentImage: "legacy",
    shadowSoftness: "0.8",
    toneMapping: "neutral",
    metallicFactor: "0.41",
    roughnessFactor: "0.36",
    height: "600px"
};

// Hardcoded data that cannot be retrieved from backend
export const hardcodedProductsData: HardcodedProductData[] = [
    {
        id: "1", // Must match backend product ID
        features: [
            "High-resolution textures",
            "Fully interactive 3D model",
            "Adjustable material properties",
            "Compatible with all major 3D software"
        ],
        modelPath: "/assets/3dModels/endeavour.glb",
        gallery: [], // Gallery loaded from database
        interactionInstructions: [],
        modelViewerSettings: defaultModelViewerSettings,
        videoUrl: 'https://youtu.be/b5QAer6Q8lY'
    },
    {
        id: "2", // Must match backend product ID
        features: [
            "Detailed rocket design",
            "3D printable components",
            "Interactive model viewer",
            "High-quality textures"
        ],
        modelPath: "/assets/3dModels/raketa.glb",
        gallery: [], // Gallery loaded from database
        interactionInstructions: [],
        modelViewerSettings: {
            ...defaultModelViewerSettings,
            alt: "A 3D model of a rocket"
        }
    }
];

// Helper function to get hardcoded data by product ID
export const getHardcodedDataById = (id: string): HardcodedProductData | null => {
    return hardcodedProductsData.find(data => data.id === id) || null;
};
