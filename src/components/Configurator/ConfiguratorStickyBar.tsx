/**
 * ConfiguratorStickyBar Component
 *
 * Sticky bottom bar for configurator with total price and Add to Cart.
 * Always visible when configurator is active on product detail page.
 */

import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Share2, Save } from 'lucide-react';
import { useConfigurator } from '../../context/ConfiguratorContext';
import { useCart } from '../../context/useCart';
import { useAuth } from '../../context/AuthContext';
import WishlistButton from '../WishlistButton';
import ShareConfigurationModal from '../ShareConfigurationModal';
import SaveConfigurationModal from '../SaveConfigurationModal';
import type { Product } from '../../data/productData';
import type { SelectedConfiguration } from '../../types/configurator';
import './ConfiguratorStickyBar.css';

// =========================================================================
// UTILITY FUNCTIONS
// =========================================================================

const validateConfiguration = (
  config: SelectedConfiguration,
  validSlotKeys: Set<string>
): boolean => {
  for (const key of Object.keys(config)) {
    if (!validSlotKeys.has(key)) return false;

    const value = config[key];
    if (typeof value !== 'object' || value === null) return false;
    if (typeof value.optionId !== 'number' || value.optionId < 0) return false;
    if (typeof value.optionKey !== 'string') return false;
    if (typeof value.displayName !== 'string') return false;
    if (typeof value.priceModifier !== 'number') return false;
  }
  return true;
};

// =========================================================================
// COMPONENT
// =========================================================================

interface ConfiguratorStickyBarProps {
  product: Product;
}

const ConfiguratorStickyBar: React.FC<ConfiguratorStickyBarProps> = ({ product }) => {
  const {
    configurator,
    loading,
    error,
    selectedOptions,
    totalModifier,
    selectedConfiguration,
    validSlotKeys,
  } = useConfigurator();

  const { addToCartWithConfiguration } = useCart();
  const { isAuthenticated } = useAuth();
  const [addingToCart, setAddingToCart] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Calculate total price (base + modifier)
  const basePrice = product.priceWithVat;
  const totalPrice = basePrice + totalModifier;
  const currencySymbol = product.currency === 'USD' ? '$' : '€';

  // Handle add to cart
  const handleAddToCart = useCallback(async () => {
    if (!validateConfiguration(selectedConfiguration, validSlotKeys)) {
      toast.error('Invalid configuration. Please try again.');
      return;
    }

    setAddingToCart(true);
    try {
      // Always add 1 item
      const result = await addToCartWithConfiguration(product, selectedConfiguration, totalModifier, 1);

      switch (result) {
        case 'added':
          toast.success('Configured product added to cart!');
          break;
        case 'limit':
          toast.error('Maximum quantity limit reached for this product');
          break;
        case 'out_of_stock':
          toast.error('This product is currently out of stock');
          break;
        case 'discontinued':
          toast.error('This product has been discontinued');
          break;
        case 'error':
          break;
      }
    } finally {
      setAddingToCart(false);
    }
  }, [product, selectedConfiguration, validSlotKeys, totalModifier, addToCartWithConfiguration]);

  // Don't render if configurator is loading, has error, or not available
  if (loading || error || !configurator) {
    return null;
  }

  const hasSelections = Object.keys(selectedOptions).length > 0;

  return (
    <div className="configurator-sticky-bar" role="region" aria-label="Configuration summary">
      <div className="sticky-bar-content">
        {/* Price Section */}
        <div className="sticky-bar-price">
          <div className="price-breakdown">
            <span className="price-label">Total</span>
            {totalModifier !== 0 && (
              <span className="price-modifier">
                ({totalModifier >= 0 ? '+' : ''}{currencySymbol}{totalModifier.toFixed(2)})
              </span>
            )}
          </div>
          <div className="price-total">
            {currencySymbol}{totalPrice.toFixed(2)}
          </div>
        </div>

        {/* Actions */}
        <div className="sticky-bar-actions">
          {isAuthenticated && (
            <button
              className="sticky-bar-save"
              onClick={() => setShowSaveModal(true)}
              disabled={!hasSelections}
              aria-label="Save configuration"
              title="Save to library"
            >
              <Save size={20} />
            </button>
          )}
          <button
            className="sticky-bar-share"
            onClick={() => setShowShareModal(true)}
            disabled={!hasSelections}
            aria-label="Share configuration"
            title="Share configuration"
          >
            <Share2 size={20} />
          </button>
          <WishlistButton
            productId={product.masterProductId}
            variant="icon"
            size="medium"
            className="sticky-bar-wishlist"
          />
          <button
            className="sticky-bar-button"
            onClick={handleAddToCart}
            disabled={addingToCart || !hasSelections}
            aria-busy={addingToCart}
          >
            {addingToCart ? (
              <>
                <span className="button-spinner" aria-hidden="true" />
                Adding...
              </>
            ) : (
              'Add to Cart'
            )}
          </button>
        </div>
      </div>

      {/* Share Modal */}
      <ShareConfigurationModal
        isOpen={showShareModal}
        masterProductId={product.masterProductId}
        configuration={selectedConfiguration}
        priceModifier={totalModifier}
        onClose={() => setShowShareModal(false)}
      />

      {/* Save Modal (authenticated users only) */}
      {isAuthenticated && (
        <SaveConfigurationModal
          isOpen={showSaveModal}
          masterProductId={product.masterProductId}
          configuration={selectedConfiguration}
          priceModifier={totalModifier}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
};

export default ConfiguratorStickyBar;
