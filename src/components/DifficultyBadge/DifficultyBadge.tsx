import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './DifficultyBadge.css';

export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

interface DifficultyBadgeProps {
  level: DifficultyLevel;
  showLink?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const difficultyConfig = {
  BEGINNER: {
    color: '#4ade80',
    icon: '🌱',
    labelKey: 'beginner'
  },
  INTERMEDIATE: {
    color: '#60a5fa',
    icon: '⚙️',
    labelKey: 'intermediate'
  },
  ADVANCED: {
    color: '#8b5cf6',  // Changed from #a78bfa to #8b5cf6 for WCAG AA compliance (4.5:1 contrast)
    icon: '🔧',
    labelKey: 'advanced'
  },
  EXPERT: {
    color: '#f87171',
    icon: '🏆',
    labelKey: 'expert'
  }
};

const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({
  level,
  showLink = false,
  size = 'medium'
}) => {
  const { t } = useTranslation('difficulty');

  if (!level || !difficultyConfig[level]) {
    return null;
  }

  const config = difficultyConfig[level];
  const label = t(`levels.${config.labelKey}.name`, level);

  const badgeContent = (
    <div
      className={`difficulty-badge difficulty-badge-${size}`}
      style={{
        borderColor: config.color,
        color: config.color
      }}
    >
      <span className="difficulty-badge-icon">{config.icon}</span>
      <span className="difficulty-badge-label">{label}</span>
    </div>
  );

  if (showLink) {
    // Create hash link to specific difficulty section
    const sectionHash = `#${level.toLowerCase()}`;

    return (
      <Link
        to={`/build-difficulty-guide${sectionHash}`}
        className="difficulty-badge-link"
      >
        {badgeContent}
        <svg
          className="difficulty-badge-link-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </Link>
    );
  }

  return badgeContent;
};

export default DifficultyBadge;
