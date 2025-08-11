import React, { useEffect } from 'react';
import './BottomSheet.css';

interface BottomSheetProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ open, title = 'Filters', onClose, children }) => {
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="bs-overlay" onClick={onClose} />
      <div className={`bs-sheet ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="bs-header">
          <h3 className="bs-title">{title}</h3>
          <button className="bs-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="bs-content">
          {children}
        </div>
      </div>
    </>
  );
};

export default BottomSheet;
