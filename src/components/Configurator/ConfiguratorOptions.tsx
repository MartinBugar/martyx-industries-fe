/**
 * ConfiguratorOptions Component
 *
 * Configuration slot selection UI for the product configurator.
 * Shows slot options as selectable pills with price modifiers.
 *
 * This component is placed in the ProductDetails area when configurator is enabled.
 * The Add to Cart functionality is now in a separate sticky bar component.
 */

import React from 'react';
import { useConfigurator } from '../../context/ConfiguratorContext';
import './ConfiguratorOptions.css';

// =========================================================================
// COMPONENT
// =========================================================================

interface ConfiguratorOptionsProps {
  className?: string;
}

const ConfiguratorOptions: React.FC<ConfiguratorOptionsProps> = ({ className }) => {
  const {
    configurator,
    loading,
    error,
    selectedOptions,
    selectOption,
  } = useConfigurator();

  if (loading) {
    return (
      <div className={`configurator-options-container ${className || ''}`}>
        <div className="configurator-options-loading">
          <div className="loading-spinner" />
          <p>Loading configuration options...</p>
        </div>
      </div>
    );
  }

  if (error || !configurator) {
    return null;
  }

  return (
    <div className={`configurator-options-container ${className || ''}`} role="form" aria-label="Configuration options">
      {configurator.slots.map((slot) => (
        <fieldset key={slot.id} className="configurator-slot">
          <legend className="configurator-slot-title" id={`slot-${slot.id}-label`}>
            {slot.icon && <span className="slot-icon" aria-hidden="true">{slot.icon}</span>}
            {slot.displayName}
          </legend>

          <div
            className="configurator-option-grid"
            role="radiogroup"
            aria-labelledby={`slot-${slot.id}-label`}
          >
            {slot.options.map((option) => {
              const isSelected = selectedOptions[slot.slotKey]?.id === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${option.displayName}, price modifier ${option.formattedPriceModifier}`}
                  className={`configurator-option-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => selectOption(slot.slotKey, option)}
                  tabIndex={isSelected ? 0 : -1}
                >
                  {option.thumbnailUrl && (
                    <img
                      src={option.thumbnailUrl}
                      alt=""
                      aria-hidden="true"
                      className="option-thumbnail"
                      loading="lazy"
                    />
                  )}
                  <div className="option-info">
                    <span className="option-name">{option.displayName}</span>
                    <span className="option-price">{option.formattedPriceModifier}</span>
                  </div>
                  {isSelected && <span className="option-check" aria-hidden="true">&#10003;</span>}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
};

export default ConfiguratorOptions;
