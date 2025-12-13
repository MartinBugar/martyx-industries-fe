/**
 * ConfiguratorOptions Component
 *
 * Modern, minimalist configuration UI with always-visible slots.
 * Design: High-tech, glassmorphism, with subtle glow effects.
 *
 * Features:
 * - All slots always visible (non-collapsible)
 * - Radio-style option selection
 * - Inline price modifiers
 * - Thumbnail previews (when available)
 * - Smooth transitions
 */

import React from 'react';
import { useConfigurator } from '../../context/ConfiguratorContext';
import type { ConfiguratorSlot, ConfiguratorOption } from '../../types/configurator';
import './ConfiguratorOptions.css';

// =========================================================================
// SUB-COMPONENTS
// =========================================================================

interface SlotSectionProps {
  slot: ConfiguratorSlot;
  selectedOption: ConfiguratorOption | undefined;
  onSelectOption: (option: ConfiguratorOption) => void;
}

const SlotSection: React.FC<SlotSectionProps> = ({
  slot,
  selectedOption,
  onSelectOption,
}) => {
  return (
    <div className="pco-slot pco-slot--open">
      {/* Slot Header - non-interactive, just a label */}
      <div className="pco-slot__header pco-slot__header--static">
        <div className="pco-slot__header-left">
          <span className="pco-slot__name">{slot.displayName}</span>
        </div>
      </div>

      {/* Slot Content - always visible */}
      <div
        id={`pco-slot-content-${slot.id}`}
        className="pco-slot__content"
        role="radiogroup"
        aria-label={`Select ${slot.displayName}`}
      >
        <div className="pco-slot__options">
          {slot.options.filter(opt => opt.isActive).map((option) => {
            const isSelected = selectedOption?.id === option.id;

            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`pco-option ${isSelected ? 'pco-option--selected' : ''}`}
                onClick={() => onSelectOption(option)}
              >
                {/* Thumbnail */}
                {option.thumbnailUrl && (
                  <div className="pco-option__thumb">
                    <img
                      src={option.thumbnailUrl}
                      alt=""
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Option Info */}
                <div className="pco-option__info">
                  <span className="pco-option__name">{option.displayName}</span>
                  <span className="pco-option__price">
                    {option.priceModifier === 0 ? (
                      'Included'
                    ) : (
                      option.formattedPriceModifier
                    )}
                  </span>
                </div>

                {/* Selection Indicator */}
                <div className="pco-option__radio">
                  <div className="pco-option__radio-inner" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// MAIN COMPONENT
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

  const handleSelectOption = (slotKey: string, option: ConfiguratorOption) => {
    selectOption(slotKey, option);
  };

  if (loading) {
    return (
      <div className={`pco-container ${className || ''}`}>
        <div className="pco-loading">
          <div className="pco-loading__spinner" />
          <span>Loading options...</span>
        </div>
      </div>
    );
  }

  if (error || !configurator) {
    return null;
  }

  return (
    <div className={`pco-container ${className || ''}`}>
      {/* Slots - all always visible */}
      <div className="pco-slots">
        {configurator.slots.map((slot) => (
          <SlotSection
            key={slot.id}
            slot={slot}
            selectedOption={selectedOptions[slot.slotKey]}
            onSelectOption={(option) => handleSelectOption(slot.slotKey, option)}
          />
        ))}
      </div>

      {/* Progress Indicator */}
      <div className="pco-progress">
        {configurator.slots.map((slot) => (
          <div
            key={slot.id}
            className={`pco-progress__dot ${selectedOptions[slot.slotKey] ? 'pco-progress__dot--complete' : ''}`}
            title={slot.displayName}
          />
        ))}
      </div>
    </div>
  );
};

export default ConfiguratorOptions;
