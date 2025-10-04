import type { TFunction } from 'i18next';
import i18n from '@/i18n';
import { type ProductTab, type TabContent, type HardcodedProductData, hardcodedProductsData } from '@/data/productData';
// In Next.js, assets are served from public folder
const endeavourBuildPdf = '/buildguide/1/endeavourBuild.pdf';

/**
 * Utility functions for localizing hardcoded product data
 */

/**
 * Get localized features for a product
 */
export const getLocalizedFeatures = (productId: string, t: TFunction): string[] => {
  // Map product IDs to translation keys
  const productKey = productId === '1' ? 'endeavour' : 'raketa';
  
  try {
    return t(`product_data.${productKey}.features`, { returnObjects: true }) as string[];
  } catch (error) {
    console.warn(`Failed to load localized features for product ${productId}:`, error);
    // Fallback to hardcoded features
    return productId === '1' 
      ? [
          "High-resolution textures",
          "Fully interactive 3D model", 
          "Adjustable material properties",
          "Compatible with all major 3D software"
        ]
      : [
          "Advanced rocket design",
          "Printable in multiple parts",
          "Detailed assembly instructions", 
          "Compatible with standard rocket engines"
        ];
  }
};

/**
 * Get localized details content for a product
 */
export const getLocalizedDetailsContent = (productId: string, t: TFunction): TabContent => {
  const productKey = productId === '1' ? 'endeavour' : 'raketa';
  
  try {
    const details = t(`product_data.${productKey}.details`, { returnObjects: true }) as any;
    
    const content = `<h2>${details.title}</h2>` +
      `<p>${details.intro}</p>` +
      `<p>${details.description}</p>` +
      `<h3>${details.specs_title}</h3>` +
      `<p>${details.specs.replace(/\n/g, '<br/>')}</p>` +
      `<p>${details.conclusion}</p>`;
    
    return {
      kind: 'text',
      text: content
    };
  } catch (error) {
    console.warn(`Failed to load localized details for product ${productId}:`, error);
    // Fallback to hardcoded content
    const fallbackContent = productId === '1' 
      ? '<h2>Endeavour - 3D Printed RC APC Project</h2>' +
        '<p>The Endeavour is an exciting 3D printed RC Armored Personnel Carrier (APC) project that brings together modern DIY technology and RC modeling. This comprehensive kit provides everything you need to create your own Arduino-powered RC vehicle from the ground up.</p>' +
        '<p>Our DIY kit includes all the necessary STL files for 3D printing the complete vehicle - from chassis and wheels to body panels and internal components. The innovative modular design allows for easy assembly and customization to match your preferences. At the heart of the Endeavour is an Arduino Mega 2560 board that handles all movement control and auxiliary features with precision.</p>' +
        '<h3>Key Technical Specifications:</h3>' +
        '<p>• Overall dimensions: 45cm (L) x 25cm (W) x 20cm (H)<br/>• Weight: ~2.5kg when fully assembled<br/>• Drive system: 4 DC motors with tank-style tracks<br/>• Control: 2.4GHz RC transmitter/receiver<br/>• Power: 2x 7.4V 2200mAh LiPo batteries<br/>• Print time: ~60 hours total<br/>• Recommended layer height: 0.2mm<br/>• Infill: 20-30%</p>' +
        '<p>The kit comes complete with detailed step-by-step assembly instructions, comprehensive wiring diagrams, and ready-to-use Arduino code. This project is ideal for makers with intermediate experience in 3D printing and basic Arduino programming skills. Please note that additional hardware components like motors, electronics, and fasteners need to be purchased separately.</p>'
      : '<h2>Raketa - Model Rocket Kit</h2>' +
        '<p>The Raketa is a precision-engineered model rocket project designed for enthusiasts who want to combine 3D printing with aerospace engineering.</p>' +
        '<p>This comprehensive kit includes all necessary components to build your own model rocket from scratch. The modular design ensures easy assembly while maintaining structural integrity.</p>' +
        '<h3>Technical Specifications:</h3>' +
        '<p>• Height: 30cm<br/>• Diameter: 5cm<br/>• Weight: ~400g<br/>• Engine compatibility: Standard model rocket engines<br/>• Recovery system: Parachute<br/>• Print time: ~15 hours total</p>' +
        '<p>Perfect for educational purposes and hobbyist rocket enthusiasts. All safety guidelines and launch procedures are included in the documentation.</p>';
    
    return {
      kind: 'text',
      text: fallbackContent
    };
  }
};

/**
 * Get localized tabs for a product
 */
export const getLocalizedTabs = (productId: string, t: TFunction): ProductTab[] => {
  const features = getLocalizedFeatures(productId, t);
  const detailsContent = getLocalizedDetailsContent(productId, t);
  
  // Get the original hardcoded data to preserve PrintInfo
  const originalData = hardcodedProductsData.find(data => data.id === productId);
  const originalPrintInfoTab = originalData?.tabs?.find(tab => tab.id === 'PrintInfo');
  
  const tabs: ProductTab[] = [
    {
      id: 'Details',
      label: t('tabs.details'),
      content: detailsContent
    }
  ];

  // Add PrintInfo tab if it exists in original data (preserve the printInfo content)
  if (originalPrintInfoTab) {
    tabs.push({
      id: 'PrintInfo',
      label: t('tabs.printInfo', 'Print Info'),
      content: originalPrintInfoTab.content // Preserve original printInfo data
    });
  }

  tabs.push(
    {
      id: 'Download',
      label: t('tabs.download'),
      content: {
        kind: 'downloads',
        items: [
          { 
            label: t('downloads.build_guide'), 
            url: endeavourBuildPdf,
            format: 'PDF' 
          }
        ]
      }
    },
    {
      id: 'Features',
      label: t('tabs.features'),
      content: {
        kind: 'list',
        items: features
      }
    }
  );
  
  return tabs;
};

/**
 * Get localized hardcoded product data using current i18n language
 * This function can be used in services without requiring a component context
 */
export const getLocalizedHardcodedProductDataForService = (productId: string): Partial<HardcodedProductData> => {
  // Get current language and translation function for products namespace
  const currentLanguage = i18n.language || 'en';
  const t = i18n.getFixedT(currentLanguage, 'products');
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 Getting localized product data for ${productId} in language: ${currentLanguage}`);
  }
  
  const features = getLocalizedFeatures(productId, t);
  const tabs = getLocalizedTabs(productId, t);
  
  return {
    features,
    tabs
  };
};

/**
 * Get localized hardcoded product data (for component usage)
 */
export const getLocalizedHardcodedProductData = (productId: string, t: TFunction): Partial<HardcodedProductData> => {
  const features = getLocalizedFeatures(productId, t);
  const tabs = getLocalizedTabs(productId, t);
  
  return {
    features,
    tabs
  };
};
