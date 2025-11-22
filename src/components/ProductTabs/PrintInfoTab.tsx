import React from 'react';
import { useTranslation } from 'react-i18next';
import { type TabContent, type PrintInfoData } from '../../data/productData';
import './ProductTabs.css';
import { logInfo, logWarn, logError } from '../../services/logger';

// PrintInfo tab content interface - matches the union type in productData.ts
interface PrintInfoTabContent {
  kind: 'printInfo';
  data: PrintInfoData;
}

interface PrintInfoTabProps {
  content: TabContent | PrintInfoTabContent;
}

const PrintInfoTab: React.FC<PrintInfoTabProps> = ({ content }) => {
  const { t } = useTranslation('products');

  if (import.meta.env.DEV) {
    logInfo('🖨️ PrintInfoTab received content:', JSON.stringify(content, null, 2));
    logInfo('🖨️ PrintInfoTab content kind:', content.kind);
    logInfo('🖨️ PrintInfoTab content type:', typeof content);
  }

  // Handle legacy content types or missing print info
  if (content.kind !== 'printInfo') {
    if (import.meta.env.DEV) {
      logInfo('❌ Content kind is not printInfo, kind is:', content.kind);
      logInfo('❌ Full content object:', content);
    }
    return (
      <div className="print-info-unavailable">
        <p>{t('printInfo.unavailable', 'Print information not available for this product.')}</p>
        {import.meta.env.DEV && (
          <div style={{marginTop: '1rem', padding: '1rem', background: '#f0f0f0', fontSize: '12px'}}>
            <strong>Debug info:</strong><br/>
            Content kind: {content.kind}<br/>
            Content: {JSON.stringify(content, null, 2)}
          </div>
        )}
      </div>
    );
  }

  if (import.meta.env.DEV) {
    logInfo('✅ PrintInfo data received:', content.data);
  }

  const { printSettings, rcComponents, additionalNotes } = content.data;

  return (
    <div className="print-info-container">
      {/* Print Settings Section */}
      <section className="print-settings-section">
        <div className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6,9 6,2 18,2 18,9"></polyline>
            <path d="m6 18h4v2h4v-2h4"></path>
            <rect x="6" y="14" width="12" height="4"></rect>
          </svg>
          <span>{t('printInfo.printSettings', '3D Print Settings')}</span>
        </div>

        <div className="settings-grid">
          <div className="setting-item">
            <span className="setting-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
              {t('printInfo.printTime', 'Print Time')}:
            </span>
            <span className="setting-value">{printSettings.printTime}</span>
          </div>

          <div className="setting-item">
            <span className="setting-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h18v18H3zM9 9h6v6H9z"></path>
              </svg>
              {t('printInfo.layerHeight', 'Layer Height')}:
            </span>
            <span className="setting-value">{printSettings.layerHeight}</span>
          </div>

          <div className="setting-item">
            <span className="setting-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z"></path>
              </svg>
              {t('printInfo.infill', 'Infill')}:
            </span>
            <span className="setting-value">{printSettings.infill}</span>
          </div>

          <div className="setting-item">
            <span className="setting-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20"></path>
              </svg>
              {t('printInfo.supports', 'Supports')}:
            </span>
            <span className={`setting-value ${printSettings.supports ? 'required' : 'not-required'}`}>
              {printSettings.supports
                ? t('printInfo.supportsRequired', 'Required')
                : t('printInfo.supportsNotRequired', 'Not Required')
              }
            </span>
          </div>

          {printSettings.estimatedCost && (
            <div className="setting-item">
              <span className="setting-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                {t('printInfo.estimatedCost', 'Est. Material Cost')}:
              </span>
              <span className="setting-value cost">{printSettings.estimatedCost}</span>
            </div>
          )}
        </div>

        {/* Materials */}
        <div className="materials-section">
          <h4 className="subsection-title">{t('printInfo.materials', 'Recommended Materials')}</h4>
          <div className="materials-list">
            {printSettings.materials.map((material, index) => (
              <span key={index} className="material-tag">
                {material}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* RC Components Section */}
      <section className="rc-components-section">
        <div className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <span>{t('printInfo.rcComponents', 'Required RC Components')}</span>
        </div>

        <div className="components-list">
          {rcComponents.map((component, index) => (
            <div key={index} className={`component-item ${component.required ? 'required' : 'optional'}`}>
              <div className="component-header">
                <div className="component-name">
                  {component.required ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="required-icon">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="optional-icon">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  )}
                  <span className="name">{component.name}</span>
                  <span className="quantity">×{component.quantity}</span>
                </div>
                {component.estimatedPrice && (
                  <span className="component-price">{component.estimatedPrice}</span>
                )}
              </div>

              {component.specifications && (
                <div className="component-specs">
                  {component.specifications}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Component Summary */}
        <div className="components-summary">
          <div className="summary-item">
            <span className="summary-label">{t('printInfo.requiredComponents', 'Required Components')}:</span>
            <span className="summary-value">{rcComponents.filter(c => c.required).length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t('printInfo.optionalComponents', 'Optional Components')}:</span>
            <span className="summary-value">{rcComponents.filter(c => !c.required).length}</span>
          </div>
        </div>
      </section>

      {/* Additional Notes */}
      {additionalNotes && additionalNotes.length > 0 && (
        <section className="additional-notes-section">
          <div className="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
            <span>{t('printInfo.additionalNotes', 'Additional Notes')}</span>
          </div>
          <ul className="notes-list">
            {additionalNotes.map((note, index) => (
              <li key={index} className="note-item">{note}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default PrintInfoTab;