import React from 'react';
import { useParams } from 'react-router-dom';
import { product as defaultProduct, products, type Product, type ProductTab, type ProductTabId } from '../data/productData';
import ProductView from '../components/ProductView/ProductView';
import './ProductDetail/ProductDetail.css';
import '../components/ProductDetails/ProductDetails.css';
import '../components/ProductTabs/ProductTabs.css';
import { DetailsTab, DownloadTab, FeaturesTab, ReviewsTab} from '../components/ProductTabs';
import { useCart } from '../context/useCart';

// Local inlined ProductDetails component (previously in components/ProductDetails/ProductDetails.tsx)
interface ProductDetailsProps {
  product: Product;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  const { addToCart } = useCart();

  const [popup, setPopup] = React.useState<{ visible: boolean; message: string; variant: 'success' | 'warning' }>({
    visible: false,
    message: '',
    variant: 'success'
  });
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  const handleAddToCart = () => {
    const status = addToCart(product);
    const isLimit = status === 'limit';
    const message = isLimit ? 'Only 1 piece of this product is allowed in cart' : 'Product was added to cart';
    const variant = isLimit ? 'warning' : 'success';

    setPopup({ visible: true, message, variant });
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setPopup(p => ({ ...p, visible: false }));
    }, 2000);
  };
  
  return (
    <div id="details" className="product-details">
      <h2>{product.name}</h2>
      <div className="product-type">{product.productType === 'DIGITAL' ? 'DIGITAL PRODUCT' : (product.productType === 'PHYSICAL' ? 'PHYSICAL PRODUCT' : product.productType)}</div>
      <div className="price">${product.price.toFixed(2)}</div>
      <p className="description">{product.description}</p>
      
      <h3 id="features">Features:</h3>
      <ul className="features-list">
        {product.features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>

      
      <button 
        className={`add-to-cart-btn${popup.visible ? ` is-popup ${popup.variant}` : ''}`}
        onClick={handleAddToCart}
        disabled={popup.visible}
        aria-live="polite"
      >
        {popup.visible ? popup.message : 'Add to Cart'}
      </button>
    </div>
  );
};

const toYouTubeEmbedUrl = (url: string): string => {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace(/^\//, '');
      return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) return url;
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
  } catch {
    return url;
  }
  return url;
};

const buildTabs = (p: Product): ProductTab[] => {
  let tabs: ProductTab[];
  if (p.tabs && p.tabs.length > 0) {
    tabs = [...p.tabs];
  } else {
    tabs = [
      { id: 'Details', label: 'Details', content: { kind: 'text', text: p.description } },
      { id: 'Features', label: 'Features', content: { kind: 'list', items: p.features } }
    ];
    if (p.productType === 'DIGITAL') {
      tabs.splice(1, 0, { id: 'Download', label: 'Download', content: { kind: 'text', text: 'Files available for download after purchase.' } });
    }
  }
  // Ensure Reviews tab exists but do not source its content from static data
  if (!tabs.some(t => t.id === 'Reviews')) {
    tabs.push({ id: 'Reviews', label: 'Reviews', content: { kind: 'text', text: '' } });
  }
  return tabs;
};

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const selected = products.find(p => p.id === id) ?? defaultProduct;
  const tabs = React.useMemo(() => buildTabs(selected), [selected]);
  const [active, setActive] = React.useState<ProductTabId>(tabs[0]?.id ?? 'Details');

  React.useEffect(() => {
    setActive(tabs[0]?.id ?? 'Details');
  }, [tabs]);

  const activeTab = tabs.find(t => t.id === active) ?? tabs[0];

  return (
    <div className="product-detail-page">
      <div className="product-container">
        <ProductView product={selected} />
        <ProductDetails product={selected} />

        <nav className="product-bookmarks" aria-label="Product sections" role="tablist">
          {tabs.map((t) => (
            <a
              key={t.id}
              id={`tab-${t.id}`}
              href="#"
              role="tab"
              aria-selected={t.id === active}
              aria-controls={`panel-${t.id}`}
              onClick={(e) => { e.preventDefault(); setActive(t.id); }}
            >
              {t.label}
            </a>
          ))}
        </nav>

        {activeTab && (
          <div
            id={`panel-${activeTab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab.id}`}
            className="product-tab-panel"
          >
            {activeTab.id === 'Details' && <DetailsTab content={activeTab.content} />}
            {activeTab.id === 'Download' && <DownloadTab content={activeTab.content} />}
            {activeTab.id === 'Features' && <FeaturesTab content={activeTab.content} />}
            {activeTab.id === 'Reviews' && <ReviewsTab content={activeTab.content} productId={selected.id} />}
          </div>
        )}

        {selected.videoUrl && (
          <div className="product-video-section" style={{ marginTop: '24px' }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px' }}>
              <iframe
                title="Product video"
                src={toYouTubeEmbedUrl(selected.videoUrl)}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
