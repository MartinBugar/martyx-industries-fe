'use client';

import React from 'react';
import styles from '../app/home.module.css';

export default function NewsletterForm() {
  const [subscribed, setSubscribed] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    console.log('newsletter_subscribed');
  };

  return (
    <div className={styles.newsletterFormContainer}>
      <form className={styles.newsletterForm} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="newsletter-email" className={styles.formLabel}>Email Address</label>
          <div className={styles.inputWrapper}>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              required
              placeholder="your@email.com"
              className={styles.newsletterInput}
              aria-label="Subscribe to newsletter"
            />
            <button type="submit" className={styles.newsletterSubmit} aria-label="Subscribe">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <p className={styles.formNote}>
          We respect your privacy. Unsubscribe at any time.
        </p>
      </form>

      {subscribed && (
        <div className={styles.newsletterSuccess} role="status" aria-live="polite">
          <div className={styles.successIcon}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h4>Successfully Subscribed!</h4>
          <p>Thank you for joining our newsletter.</p>
        </div>
      )}
    </div>
  );
}
