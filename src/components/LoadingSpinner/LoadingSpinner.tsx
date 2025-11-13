import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  text
}) => {
  return (
    <div className={`loading-spinner-container ${size}`}>
      <div className="dual-ring-spinner">
        <div className="spinner-ring ring-outer"></div>
        <div className="spinner-ring ring-inner"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
