import React from 'react';
import './Slider.css';

interface SliderProps {
  id: string;
  label: string;
  value: number;
  min: string | number;
  max: string | number;
  step: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  decimals?: number;
}

const Slider: React.FC<SliderProps> = ({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  decimals = 2
}) => {
  return (
    <div className="slider-container">
      <label htmlFor={id} className="slider-label">
        {label}: {value.toFixed(decimals)}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          className="slider-input"
        />
      </label>
    </div>
  );
};

export default Slider;