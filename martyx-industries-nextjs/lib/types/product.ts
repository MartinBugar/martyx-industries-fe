// Product tab types
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

// Product interface
export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  features?: string[];
  modelPath?: string;
  gallery?: string[];
  interactionInstructions?: string[];
  productType: 'DIGITAL' | 'PHYSICAL';
  modelViewerSettings?: ModelViewerSettings;
  tabs?: ProductTab[];
  videoUrl?: string;
}

// Hardcoded frontend-specific data for products (UI, assets, tabs, etc.)
// These complement the backend ProductDto data
export interface HardcodedProductData {
  id: string; // Must match backend product ID for pairing
  features: string[];
  modelPath: string;
  gallery: string[];
  interactionInstructions: string[];
  modelViewerSettings?: ModelViewerSettings;
  videoUrl?: string;
  tabs?: ProductTab[];
}
