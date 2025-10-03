'use client';

import { useState } from 'react';
import styles from './ProductTabs.module.css';

interface ProductTabsProps {
  description?: string;
  specs?: Record<string, unknown>;
}

type TabType = 'description' | 'specifications' | 'reviews';

export default function ProductTabs({ description, specs }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('description');

  const hasSpecs = specs && Object.keys(specs).length > 0;

  return (
    <div className={styles.container}>
      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        <button
          className={`${styles.tabButton} ${activeTab === 'description' ? styles.active : ''}`}
          onClick={() => setActiveTab('description')}
        >
          Description
        </button>
        {hasSpecs && (
          <button
            className={`${styles.tabButton} ${activeTab === 'specifications' ? styles.active : ''}`}
            onClick={() => setActiveTab('specifications')}
          >
            Specifications
          </button>
        )}
        <button
          className={`${styles.tabButton} ${activeTab === 'reviews' ? styles.active : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'description' && (
          <div className={styles.descriptionTab}>
            {description ? (
              <div
                className={styles.description}
                dangerouslySetInnerHTML={{ __html: description }}
              />
            ) : (
              <p className={styles.noContent}>No description available.</p>
            )}
          </div>
        )}

        {activeTab === 'specifications' && (
          <div className={styles.specificationsTab}>
            {hasSpecs ? (
              <table className={styles.specsTable}>
                <tbody>
                  {Object.entries(specs!).map(([key, value]) => (
                    <tr key={key}>
                      <td className={styles.specKey}>
                        {key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())}
                      </td>
                      <td className={styles.specValue}>
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={styles.noContent}>No specifications available.</p>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className={styles.reviewsTab}>
            <p className={styles.noContent}>
              Reviews coming soon. Be the first to review this product!
            </p>
            {/* TODO: Implement reviews functionality */}
          </div>
        )}
      </div>
    </div>
  );
}
