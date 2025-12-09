/**
 * ConfiguratorOptions Component
 *
 * Modern, minimalist configuration UI with accordion-style slots.
 * Design: High-tech, glassmorphism, with subtle glow effects.
 *
 * Features:
 * - Accordion slots (one open at a time)
 * - Radio-style option selection
 * - Inline price modifiers
 * - Thumbnail previews (when available)
 * - Smooth transitions
 */

import React, { useState, useEffect } from 'react';
import { useConfigurator } from '../../context/ConfiguratorContext';
import type { ConfiguratorSlot, ConfiguratorOption } from '../../types/configurator';
import './ConfiguratorOptions.css';

// =========================================================================
// SUB-COMPONENTS
// =========================================================================

interface SlotAccordionProps {
  slot: ConfiguratorSlot;
  isOpen: boolean;
  onToggle: () => void;
  selectedOption: ConfiguratorOption | undefined;
  onSelectOption: (option: ConfiguratorOption) => void;
}

const SlotAccordion: React.FC<SlotAccordionProps> = ({
  slot,
  isOpen,
  onToggle,
  selectedOption,
  onSelectOption,
}) => {
  return (
    <div className={`pco-slot ${isOpen ? 'pco-slot--open' : ''}`}>
      {/* Slot Header */}
      <button
        type="button"
        className="pco-slot__header"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        aria-expanded={isOpen}
        aria-controls={`pco-slot-content-${slot.id}`}
      >
        <div className="pco-slot__header-left">
          <span className="pco-slot__name">{slot.displayName}</span>
          {selectedOption && (
            <span className="pco-slot__selected">
              {selectedOption.displayName}
              {selectedOption.priceModifier !== 0 && (
                <span className="pco-slot__modifier">
                  {selectedOption.formattedPriceModifier}
                </span>
              )}
            </span>
          )}
        </div>
        <svg
          className="pco-slot__chevron"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Slot Content - using CSS for animation */}
      {isOpen && (
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
      )}
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

  // Track which slot is currently open (accordion behavior)
  // Initialize with first slot ID if configurator exists
  const [openSlotId, setOpenSlotId] = useState<number | null>(() => {
    return configurator?.slots?.[0]?.id ?? null;
  });

  // Auto-open first slot only when configurator first loads (not on every state change)
  useEffect(() => {
    if (configurator && configurator.slots.length > 0 && openSlotId === null) {
      setOpenSlotId(configurator.slots[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configurator]); // Intentionally excluding openSlotId to prevent reset loop

  const handleToggleSlot = (slotId: number) => {
    setOpenSlotId(prev => prev === slotId ? null : slotId);
  };

  const handleSelectOption = (slotKey: string, option: ConfiguratorOption, slotId: number) => {
    selectOption(slotKey, option);

    // Auto-advance to next slot after selection
    if (configurator) {
      const currentIndex = configurator.slots.findIndex(s => s.id === slotId);
      const nextSlot = configurator.slots[currentIndex + 1];
      if (nextSlot) {
        // Small delay for visual feedback
        setTimeout(() => {
          setOpenSlotId(nextSlot.id);
        }, 150);
      }
    }
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
      {/* Slots */}
      <div className="pco-slots">
        {configurator.slots.map((slot) => (
          <SlotAccordion
            key={slot.id}
            slot={slot}
            isOpen={openSlotId === slot.id}
            onToggle={() => handleToggleSlot(slot.id)}
            selectedOption={selectedOptions[slot.slotKey]}
            onSelectOption={(option) => handleSelectOption(slot.slotKey, option, slot.id)}
          />
        ))}
      </div>

      {/* Progress Indicator */}
      <div className="pco-progress">
        {configurator.slots.map((slot) => (
          <div
            key={slot.id}
            className={`pco-progress__dot ${selectedOptions[slot.slotKey] ? 'pco-progress__dot--complete' : ''} ${openSlotId === slot.id ? 'pco-progress__dot--active' : ''}`}
            title={slot.displayName}
          />
        ))}
      </div>
    </div>
  );
};

export default ConfiguratorOptions;
