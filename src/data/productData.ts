// Product data for the 3D model e-shop
// 3D Models now loaded from CDN via database (model_3d_viewer_url column)
// import endeavourModel from '../assets/3dModels/endeavour.glb'; // REMOVED: Now using CDN
// import raketaModel from '../assets/3dModels/raketa.glb'; // REMOVED: Now using CDN
import endeavourBuildPdf from '../assets/buildguide/1/endeavourBuild.pdf';
// CDN imports removed - gallery now loaded from database only

// makeGallery function removed - gallery now loaded from database only

export type ProductTabId = 'Details' | 'Download' | 'Features' | 'Reviews' | 'PrintInfo';

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

export type TabContent =
    | { kind: 'text'; text: string }
    | { kind: 'list'; items: string[] }
    | { kind: 'image'; image: TabImage }
    | { kind: 'gallery'; images: TabImage[] }
    | { kind: 'downloads'; items: TabDownloadItem[] }
    | { kind: 'printInfo'; data: PrintInfoData };

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
    availabilityStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PRE_ORDER' | 'DISCONTINUED' | 'BACKORDERED';
    requiresShipping: boolean;

    // From hardcoded frontend data
    features: string[];
    modelPath: string;
    gallery: string[];
    interactionInstructions: string[];
    modelViewerSettings?: ModelViewerSettings;
    tabs?: ProductTab[];
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
    availabilityStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PRE_ORDER' | 'DISCONTINUED' | 'BACKORDERED';
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

// Hardcoded frontend-specific data for products (UI, assets, tabs, etc.)
// These complement the backend MasterProduct + Variant data
export interface HardcodedProductData {
    masterProductId: number; // Must match backend master product ID for pairing
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
        videoUrl: 'https://youtu.be/b5QAer6Q8lY',
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
                id: 'PrintInfo',
                label: 'Print Info',
                content: {
                    kind: 'printInfo',
                    data: {
                        printSettings: {
                            printTime: '58-62 hours',
                            layerHeight: '0.2mm',
                            infill: '20-30%',
                            supports: true,
                            materials: ['PLA', 'PETG', 'ABS'],
                            estimatedCost: '€25-35'
                        },
                        rcComponents: [
                            {
                                name: 'Arduino Mega 2560',
                                quantity: 1,
                                specifications: 'Microcontroller board with 54 digital pins',
                                estimatedPrice: '€15-25',
                                required: true
                            },
                            {
                                name: 'DC Gear Motors',
                                quantity: 4,
                                specifications: '6V 200RPM with metal gearbox',
                                estimatedPrice: '€8-12 each',
                                required: true
                            },
                            {
                                name: 'Motor Driver Shield',
                                quantity: 1,
                                specifications: 'L298N dual motor driver',
                                estimatedPrice: '€5-8',
                                required: true
                            },
                            {
                                name: 'LiPo Battery',
                                quantity: 2,
                                specifications: '7.4V 2200mAh with XT60 connector',
                                estimatedPrice: '€20-30 each',
                                required: true
                            },
                            {
                                name: '2.4GHz RC Transmitter/Receiver',
                                quantity: 1,
                                specifications: 'FlySky FS-i6X or similar 6-channel system',
                                estimatedPrice: '€45-65',
                                required: true
                            },
                            {
                                name: 'Servo Motors',
                                quantity: 2,
                                specifications: 'SG90 micro servos for turret control',
                                estimatedPrice: '€3-5 each',
                                required: false
                            },
                            {
                                name: 'LED Strip',
                                quantity: 1,
                                specifications: 'WS2812B addressable LED strip (1m)',
                                estimatedPrice: '€8-12',
                                required: false
                            },
                            {
                                name: 'Ball Bearings',
                                quantity: 8,
                                specifications: '608ZZ skateboard bearings for wheels',
                                estimatedPrice: '€10-15',
                                required: true
                            }
                        ],
                        additionalNotes: [
                            'Print all parts with 0.2mm layer height for best fit and finish',
                            'Use supports for overhangs greater than 45 degrees',
                            'Post-process bearing holes with 8mm drill bit for smooth fit',
                            'Assembly requires basic soldering skills for electronics',
                            'Estimated total build cost: €150-220 (excluding 3D printer filament)',
                            'Build time: 2-3 weekends for experienced makers'
                        ]
                    }
                }
            },
            {
                id: 'Download',
                label: 'Download',
                content: {
                    kind: 'downloads',
                    items: [
                        {
                            label: 'Complete Build Guide', 
                            url: endeavourBuildPdf, 
                            format: 'PDF', 
                            size: '2.4 MB'
                        },
                        {
                            label: 'STL Files Package', 
                            url: '#', 
                            format: 'ZIP', 
                            size: '45.2 MB'
                        },
                        {
                            label: 'Arduino Code & Wiring Diagrams', 
                            url: '#', 
                            format: 'ZIP', 
                            size: '1.8 MB'
                        },
                        {
                            label: 'Parts List & Shopping Guide', 
                            url: '#', 
                            format: 'PDF', 
                            size: '650 KB'
                        }
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

// Debug: log hardcoded data in development
console.log('🔥 ProductData.ts LOADED - NEW VARIANT ARCHITECTURE!');
console.log('📊 HardcodedProductsData loaded:', hardcodedProductsData.map(p => ({
    masterProductId: p.masterProductId,
    tabsCount: p.tabs?.length || 0,
    tabIds: p.tabs?.map(t => t.id) || []
})));

// Products are now populated dynamically by the hybrid product service
// which merges MasterProduct + ProductVariant + HardcodedProductData
export const products: Product[] = []; // Populated by hybrid service at runtime
export const product: Product | null = null; // Populated by hybrid service at runtime