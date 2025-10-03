'use client';

import { useState, FormEvent } from 'react';
import styles from './Newsletter.module.css';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      // Simulate API call - replace with actual newsletter API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));

      // TODO: Replace with actual API call
      // const response = await fetch('/api/newsletter', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email }),
      // });

      setStatus('success');
      setMessage('Thank you for subscribing! Check your email to confirm.');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again later.');
      console.error('Newsletter subscription error:', error);
    }
  };

  return (
    <div className={styles.newsletterContainer}>
      <form onSubmit={handleSubmit} className={styles.newsletterForm}>
        <div className={styles.inputGroup}>
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'loading'}
            className={styles.emailInput}
            aria-label="Email address"
            required
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className={styles.submitButton}
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </button>
        </div>

        {message && (
          <div
            className={`${styles.message} ${
              status === 'success' ? styles.successMessage : styles.errorMessage
            }`}
            role="alert"
          >
            {message}
          </div>
        )}
      </form>

      <p className={styles.privacyText}>
        We respect your privacy. Unsubscribe at any time.
      </p>
    </div>
  );
}
