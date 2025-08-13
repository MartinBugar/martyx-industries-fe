import React from 'react';
import { useParams } from 'react-router-dom';
import { product as defaultProduct, products, type Product, type ProductTab, type ProductTabId } from '../data/productData';
import ProductView from '../components/ProductView/ProductView';
import ProductDetails from '../components/ProductDetails/ProductDetails';
import './Pages.css';

const buildTabs = (p: Product): ProductTab[] => {
  if (p.tabs && p.tabs.length > 0) return p.tabs;
  const tabs: ProductTab[] = [
    { id: 'Details', label: 'Details', content: { kind: 'text', text: p.description } },
    { id: 'Features', label: 'Features', content: { kind: 'list', items: p.features } }
  ];
  if (p.productType === 'DIGITAL') {
    tabs.splice(1, 0, { id: 'Download', label: 'Download', content: { kind: 'text', text: 'Files available for download after purchase.' } });
  }
  tabs.push({ id: 'Reviews', label: 'Reviews', content: { kind: 'text', text: 'No reviews yet.' } });
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
    <div className="page-container product-detail-page">
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
            {activeTab.content.kind === 'text' && (
              <p>{activeTab.content.text}</p>
            )}
            {activeTab.content.kind === 'list' && (
              <ul>
                {activeTab.content.items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
