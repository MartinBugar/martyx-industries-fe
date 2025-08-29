// Product data for the 3D model e-shop
import axisModel from '../assets/axis.glb';
import endeavourBuildPdf from '../assets/buildguide/1/endeavourBuild.pdf';

const basePath = import.meta.env.BASE_URL ?? '/';
const makeGallery = (productId: string, count: number) => Array.from({length: count}, (_, i) => `${basePath}productsGallery/${productId}/${i + 1}.png`);

export type ProductTabId = 'Details' | 'Download' | 'Features' | 'Reviews';

export type TabImage = { src: string; alt?: string; caption?: string };
export type TabDownloadItem = { label: string; url: string; size?: string; format?: string };

export type TabContent =
    | { kind: 'text'; text: string }
    | { kind: 'list'; items: string[] }
    | { kind: 'image'; image: TabImage }
    | { kind: 'gallery'; images: TabImage[] }
    | { kind: 'downloads'; items: TabDownloadItem[] };

export interface ProductTab {
    id: ProductTabId;
    label: string;
    content: TabContent;
}

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
    modelViewerSettings?: ModelViewerSettings;
    tabs?: ProductTab[];
    videoUrl?: string;
}

// Base interaction instructions shared across products
const baseInteractionInstructions: string[] = [
    "Click and drag to rotate",
    "Scroll to zoom in/out",
    "Right-click and drag to pan"
];

// Model viewer settings type
export type ModelViewerSettings = {
    poster?: string;
    cameraOrbit?: string;
    touchAction?: string;
    alt?: string;
    cameraControls?: boolean;
    autoRotate?: boolean;
    interactionPrompt?: 'auto' | 'when-focused' | 'none';
    shadowIntensity?: string;
    exposure?: number | string;
    environmentImage?: string;
    shadowSoftness?: string;
    toneMapping?: 'auto' | 'commerce' | 'filmic' | 'neutral' | 'legacy';
    metallicFactor?: string | number;
    roughnessFactor?: string | number;
    height?: string;
};

// Default model viewer settings for product id "1"
export const defaultModelViewerSettings: ModelViewerSettings = {
    poster: undefined,
    cameraOrbit: "3.953671009374416rad 1.3734740705980852red 55deg 4m",
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
    metallicFactor: "0.28",
    roughnessFactor: "0.36",
    height: "500px"
};

// Hardcoded frontend-specific data for products (UI, assets, tabs, etc.)
// These complement the backend ProductDto data
export interface HardcodedProductData {
    id: string; // Must match backend product ID for pairing
    currency: string;
    features: string[];
    modelPath: string;
    gallery: string[];
    interactionInstructions: string[];
    modelViewerSettings?: ModelViewerSettings;
    videoUrl?: string;
    tabs?: ProductTab[];
}

// Hardcoded data that cannot be retrieved from backend
export const hardcodedProductsData: HardcodedProductData[] = [
    {
        id: "1", // Must match backend product ID
        currency: "USD",
        features: [
            "High-resolution textures",
            "Fully interactive 3D model",
            "Adjustable material properties",
            "Compatible with all major 3D software"
        ],
        modelPath: axisModel,
        gallery: makeGallery("1", 6),
        interactionInstructions: baseInteractionInstructions,
        modelViewerSettings: defaultModelViewerSettings,
        videoUrl: 'https://www.youtube-nocookie.com/embed/bXxOCo0VL1Y',
        tabs: [
            {
                id: 'Details',
                label: 'Details',
                content: {
                    kind: 'text',
                    text: '<h2>Endeavour - 3D Printed RC APC Project</h2>' +
                        '<p>The Endeavour is an exciting 3D printed RC Armored Personnel Carrier (APC) project that brings together modern DIY technology and RC modeling. This comprehensive kit provides everything you need to create your own Arduino-powered RC vehicle from the ground up.</p>' +
                        '<p>Our DIY kit includes all the necessary STL files for 3D printing the complete vehicle - from chassis and wheels to body panels and internal components. The innovative modular design allows for easy assembly and customization to match your preferences. At the heart of the Endeavour is an Arduino Mega 2560 board that handles all movement control and auxiliary features with precision.</p>' +
                        '<h3>Key Technical Specifications:</h3>' +
                        '<p>• Overall dimensions: 45cm (L) x 25cm (W) x 20cm (H)\n• Weight: ~2.5kg when fully assembled\n• Drive system: 4 DC motors with tank-style tracks\n• Control: 2.4GHz RC transmitter/receiver\n• Power: 2x 7.4V 2200mAh LiPo batteries\n• Print time: ~60 hours total\n• Recommended layer height: 0.2mm\n• Infill: 20-30%</p>' +
                        '<p>The kit comes complete with detailed step-by-step assembly instructions, comprehensive wiring diagrams, and ready-to-use Arduino code. This project is ideal for makers with intermediate experience in 3D printing and basic Arduino programming skills. Please note that additional hardware components like motors, electronics, and fasteners need to be purchased separately.</p>'
                }
            },
            {
                id: 'Download',
                label: 'Download',
                content: {
                    kind: 'downloads',
                    items: [
                        {label: 'Endeavour Build Guide (PDF)', url: endeavourBuildPdf, format: 'PDF'}
                    ]
                }
            },
            {
                id: 'Features', label: 'Features', content: {
                    kind: 'list', items: [
                        "High-resolution textures ",
                        "Fully interactive 3D model",
                        "Adjustable material properties",
                        "Compatible with all major 3D software"
                    ]
                }
            },
        ]
    }
];

// Legacy exports will be replaced by the hybrid product service
// These are kept temporarily for backward compatibility during migration
export const products: Product[] = []; // Will be populated by hybrid service
export const product: Product | null = null; // Will be populated by hybrid service