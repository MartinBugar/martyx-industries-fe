import React from 'react';
import { useTranslation } from 'react-i18next';
import { type TabContent, type BuildInfo } from '../../data/productData';
import './ProductTabs.css';
import { logInfo } from '../../services/logger';

// BuildInfo tab content interface
interface BuildInfoTabContent {
  kind: 'buildInfo';
  data: BuildInfo;
}

interface BuildInfoTabProps {
  content: TabContent | BuildInfoTabContent;
}

const BuildInfoTab: React.FC<BuildInfoTabProps> = ({ content }) => {
  const { t } = useTranslation('products');

  if (import.meta.env.DEV) {
    logInfo('🔨 BuildInfoTab received content:', JSON.stringify(content, null, 2));
    logInfo('🔨 BuildInfoTab content kind:', content.kind);
  }

  // Handle legacy content types or missing build info
  if (content.kind !== 'buildInfo') {
    if (import.meta.env.DEV) {
      logInfo('❌ Content kind is not buildInfo, kind is:', content.kind);
    }
    return (
      <div className="build-info-unavailable">
        <p>{t('buildInfo.unavailable', 'Build information not available for this product.')}</p>
      </div>
    );
  }

  const {
    partsCount,
    screwsCount,
    filamentGrams,
    filamentType,
    printTimeHours,
    assemblyTimeHours,
    requiredTools,
    skillsRequired,
    estimatedTotalHours
  } = content.data;

  return (
    <div className="build-info-container">
      {/* Overview Stats */}
      <section className="build-overview-section">
        <div className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
          <span>{t('buildInfo.overview', 'Build Overview')}</span>
        </div>

        <div className="build-stats-grid">
          <div className="stat-card">
            <div className="stat-icon parts">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{partsCount}</span>
              <span className="stat-label">{t('buildInfo.totalParts', 'Total Parts')}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon screws">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M8 4h8M8 20h8M6 12h12"></path>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{screwsCount}</span>
              <span className="stat-label">{t('buildInfo.screws', 'Screws')}</span>
              <span className="stat-badge no-glue">{t('buildInfo.noGlue', 'No Glue!')}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon time">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{estimatedTotalHours}h</span>
              <span className="stat-label">{t('buildInfo.totalTime', 'Total Build Time')}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon filament">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{filamentGrams}g</span>
              <span className="stat-label">{t('buildInfo.filament', 'Filament Required')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Time Breakdown */}
      <section className="time-breakdown-section">
        <div className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12,6 12,12 16,14"></polyline>
          </svg>
          <span>{t('buildInfo.timeBreakdown', 'Time Breakdown')}</span>
        </div>

        <div className="time-breakdown-grid">
          <div className="time-item">
            <div className="time-bar print">
              <div className="time-bar-fill" style={{width: `${(printTimeHours / estimatedTotalHours) * 100}%`}}></div>
            </div>
            <div className="time-details">
              <span className="time-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6,9 6,2 18,2 18,9"></polyline>
                  <path d="m6 18h4v2h4v-2h4"></path>
                  <rect x="6" y="14" width="12" height="4"></rect>
                </svg>
                {t('buildInfo.printTime', '3D Printing')}
              </span>
              <span className="time-value">{printTimeHours}h</span>
            </div>
          </div>

          <div className="time-item">
            <div className="time-bar assembly">
              <div className="time-bar-fill" style={{width: `${(assemblyTimeHours / estimatedTotalHours) * 100}%`}}></div>
            </div>
            <div className="time-details">
              <span className="time-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
                {t('buildInfo.assemblyTime', 'Assembly')}
              </span>
              <span className="time-value">{assemblyTimeHours}h</span>
            </div>
          </div>
        </div>

        <div className="time-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{t('buildInfo.timeNote', 'Times are estimates and may vary based on experience and equipment.')}</span>
        </div>
      </section>

      {/* Materials */}
      <section className="materials-section">
        <div className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          </svg>
          <span>{t('buildInfo.materials', 'Required Materials')}</span>
        </div>

        <div className="materials-content">
          <div className="material-item">
            <span className="material-label">{t('buildInfo.filamentType', 'Filament Type')}:</span>
            <span className="material-value">{filamentType}</span>
          </div>
          <div className="material-item">
            <span className="material-label">{t('buildInfo.filamentAmount', 'Amount Needed')}:</span>
            <span className="material-value">{filamentGrams}g ({(filamentGrams / 1000).toFixed(2)} kg)</span>
          </div>
        </div>
      </section>

      {/* Required Tools */}
      <section className="tools-section">
        <div className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          </svg>
          <span>{t('buildInfo.requiredTools', 'Required Tools')}</span>
        </div>

        <div className="tools-list">
          {requiredTools.map((tool, index) => (
            <div key={index} className="tool-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>{tool}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Required Skills */}
      <section className="skills-section">
        <div className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
          </svg>
          <span>{t('buildInfo.requiredSkills', 'Recommended Skills')}</span>
        </div>

        <div className="skills-list">
          {skillsRequired.map((skill, index) => (
            <div key={index} className="skill-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <span>{skill}</span>
            </div>
          ))}
        </div>
      </section>

      {/* No Glue Highlight */}
      <section className="no-glue-highlight">
        <div className="highlight-content">
          <div className="highlight-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <div className="highlight-text">
            <h3>{t('buildInfo.noGlueTitle', 'No Glue Required!')}</h3>
            <p>{t('buildInfo.noGlueDescription', 'This model uses precision-engineered screw connections for superior strength and easy disassembly. Perfect for maintenance, modifications, and learning how everything works.')}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(BuildInfoTab);