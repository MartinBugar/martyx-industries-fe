// Product data for the 3D model e-shop
// 3D Models now loaded from CDN via database (model_3d_viewer_url column)
// import endeavourModel from '../assets/3dModels/endeavour.glb'; // REMOVED: Now using CDN
// import raketaModel from '../assets/3dModels/raketa.glb'; // REMOVED: Now using CDN
// CDN imports removed - gallery now loaded from database only

// makeGallery function removed - gallery now loaded from database only

export type ProductTabId = 'Details' | 'Download' | 'Features' | 'Reviews' | 'PrintInfo' | 'Included';

export type TabImage = { src: string; alt?: string; caption?: string };
export type TabDownloadItem = { label: string; url: string; size?: string; format?: string };

// Print info types
export interface PrintSettings {
  printTime: string;
  layerHeight: string;
  infill: string;
  supports: boolean;
  materials: string[];
  estimatedCost?: string;
}

export interface RCComponent {
  name: string;
  quantity: number;
  specifications?: string;
  estimatedPrice?: string;
  required: boolean;
}

export interface PrintInfoData {
  printSettings: PrintSettings;
  rcComponents: RCComponent[];
  additionalNotes?: string[];
}

// Build Info types (V46)
export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface BuildInfo {
  partsCount: number;
  screwsCount: number;
  filamentGrams: number;
  filamentType: string;
  printTimeHours: number;
  assemblyTimeHours: number;
  requiredTools: string[];
  skillsRequired: string[];
  estimatedTotalHours: number;
}

export type TabContent =
    | { kind: 'text'; text: string }
    | { kind: 'list'; items: string[] }
    | { kind: 'image'; image: TabImage }
    | { kind: 'gallery'; images: TabImage[] }
    | { kind: 'downloads'; items: TabDownloadItem[] }
    | { kind: 'printInfo'; data: PrintInfoData }
    | { kind: 'buildInfo'; data: BuildInfo };

export interface ProductTab {
    id: ProductTabId;
    label: string;
    content: TabContent;
}

// NEW: Product interface now represents a merged MasterProduct + ProductVariant + hardcoded UI data
export interface Product {
    // From MasterProduct
    masterProductId: number;
    name: string;
    slug: string;
    description: string;
    longDescription?: string;
    productCategory: 'MODEL_KIT' | 'MERCHANDISE' | 'ELECTRONICS' | 'ACCESSORIES' | 'DIGITAL_DOWNLOAD';

    // From selected ProductVariant
    variantId: number;
    variantName: string;
    sku: string;
    priceWithVat: number;
    priceWithoutVat: number;
    vatRate: number;
    vatAmount: number;
    currency: string;
    variantType: 'DIGITAL_ONLY' | 'PHYSICAL_ONLY' | 'HYBRID';
    fulfillmentType: 'DIGITAL' | 'PHYSICAL' | 'MIXED';
    stockQuantity: number;
    availabilityStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'PRE_ORDER' | 'DISCONTINUED' | 'BACKORDERED';
    requiresShipping: boolean;

    // From hardcoded frontend data
    features: string[];
    modelPath: string;
    gallery: string[];
    interactionInstructions: string[];
    modelViewerSettings?: ModelViewerSettings;
    videoUrl?: string;

    // From selected ProductVariant components
    components?: Array<{
        id: number;
        componentName: string;
        componentType?: string;
        description?: string | null;
        quantity?: number | null;
        digital?: boolean;
        physical?: boolean;
        iconName?: string;
        badgeColor?: string;
        label?: string;
        formattedFileSize?: string;
        displayOrder?: number | null;
    }>;

    // All available variants for this product
    availableVariants?: ProductVariant[];

    // Build difficulty & info (V46)
    difficultyLevel?: DifficultyLevel;
    buildInfo?: BuildInfo;
}

// Individual variant info (used in variant selector)
export interface ProductVariant {
    variantId: number;
    variantName: string;
    priceWithVat: number;
    priceWithoutVat: number;
    currency: string;
    sku: string;
    variantType: 'DIGITAL_ONLY' | 'PHYSICAL_ONLY' | 'HYBRID';
    stockQuantity: number;
    availabilityStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'PRE_ORDER' | 'DISCONTINUED' | 'BACKORDERED';
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
    cameraOrbit: "3.953671009374416rad 1.3734740705980852rad 55deg 1m",
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
    metallicFactor: "0.41",
    roughnessFactor: "0.36",
    height: "500px"
};

// Hardcoded frontend-specific data for products (UI, assets only - NO TABS)
// These complement the backend MasterProduct + Variant data
// TABS ARE NOW LOADED FROM BACKEND API PER VARIANT
export interface HardcodedProductData {
    masterProductId: number; // Must match backend master product ID for pairing
    features: string[];
    modelPath: string;
    gallery: string[];
    interactionInstructions: string[];
    modelViewerSettings?: ModelViewerSettings;
    videoUrl?: string;
}

// Hardcoded data that cannot be retrieved from backend
// TABS ARE NOW FULLY MANAGED IN BACKEND DATABASE PER VARIANT
export const hardcodedProductsData: HardcodedProductData[] = [
    {
        masterProductId: 1, // Must match backend master product ID
        features: [
            "High-resolution textures",
            "Fully interactive 3D model",
            "Adjustable material properties",
            "Compatible with all major 3D software"
        ],
        modelPath: '', // Use CDN URL from database (model_3d_viewer_url column)
        gallery: [], // Gallery loaded from database
        interactionInstructions: baseInteractionInstructions,
        modelViewerSettings: defaultModelViewerSettings,
        videoUrl: 'https://youtu.be/b5QAer6Q8lY'
    },
    {
        masterProductId: 2, // Must match backend master product ID
        features: [
            "AAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            "BBBBBBBBBBBBBBBBBBBBBBBBBB",
            "CCCCCCCCCCCCCCCCCCCCCCCCCCC",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDD"
        ],
        modelPath: '', // Use CDN URL from database (model_3d_viewer_url column)
        gallery: [], // Gallery loaded from database
        interactionInstructions: baseInteractionInstructions,
        modelViewerSettings: defaultModelViewerSettings,
        videoUrl: 'https://www.youtube-nocookie.com/embed/bXxOCo0VL1Y'
    }
];

// Debug: log hardcoded data in development
console.log('🔥 ProductData.ts LOADED - NEW VARIANT ARCHITECTURE!');
console.log('📊 HardcodedProductsData loaded (NO HARDCODED TABS):', hardcodedProductsData.map(p => ({
    masterProductId: p.masterProductId,
    hasVideoUrl: !!p.videoUrl
})));

// Products are now populated dynamically by the hybrid product service
// which merges MasterProduct + ProductVariant + HardcodedProductData
export const products: Product[] = []; // Populated by hybrid service at runtime
export const product: Product | null = null; // Populated by hybrid service at runtime