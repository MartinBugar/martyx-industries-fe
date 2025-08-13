// Product data for the 3D model e-shop
import axisModel from '../assets/axis.glb';

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
        productType: 'DIGITAL',
        modelViewerSettings: defaultModelViewerSettings,
        tabs: [
            {
                id: 'Details',
                label: 'Details',
                content: {
                    kind: 'text',
                    text: 'aaa'
                }
            },
            {
                id: 'Download',
                label: 'Download',
                content: {
                    kind: 'downloads',
                    items: [
                        { label: 'STL Pack (ZIP)', url: `${basePath}downloads/1/endeavour-stl-pack.zip`, size: '120 MB', format: 'ZIP' },
                        { label: 'User Manual (PDF)', url: `${basePath}downloads/1/endeavour-manual.pdf`, size: '2.1 MB', format: 'PDF' }
                    ]
                }
            },
            { id: 'Features', label: 'Features', content: { kind: 'list', items: [
                "High-resolution textures ",
                "Fully interactive 3D model",
                "Adjustable material properties",
                "Compatible with all major 3D software"
            ] } },
            { id: 'Reviews', label: 'Reviews', content: { kind: 'text', text: "No reviews yet. Be the first to review this product!" } }
        ]
    }
];

export const product: Product = products[0];