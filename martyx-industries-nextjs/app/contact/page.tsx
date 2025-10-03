'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Contact.module.css';

interface ContactFormData {
  email: string;
  subject: string;
  text: string;
}

export default function Contact() {
  const { t } = useTranslation('contact');
  const [formData, setFormData] = useState<ContactFormData>({
    email: '',
    subject: '',
    text: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (data: ContactFormData): string[] => {
    const errors: string[] = [];
    
    if (!data.email.trim()) {
      errors.push(t('form.validation.email_required', 'Email is required'));
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push(t('form.validation.email_invalid', 'Please enter a valid email address'));
    }
    
    if (!data.subject.trim()) {
      errors.push(t('form.validation.subject_required', 'Subject is required'));
    }
    
    if (!data.text.trim()) {
      errors.push(t('form.validation.message_required', 'Message is required'));
    } else if (data.text.trim().length < 10) {
      errors.push(t('form.validation.message_too_short', 'Message must be at least 10 characters long'));
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setValidationErrors([]);
    setApiError(null);

    try {
      // Frontend validation
      const errors = validateForm(formData);
      if (errors.length > 0) {
        setValidationErrors(errors);
        setSubmitStatus('error');
        return;
      }

      // Mock API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success
      setSubmitStatus('success');
      setFormData({ email: '', subject: '', text: '' });
    } catch (error: unknown) {
      console.error('Contact form submission error:', error);
      setSubmitStatus('error');
      setApiError(t('form.error', 'An error occurred while sending your message. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.contactPage} role="main">
      <div className={styles.contactContainer}>
        {/* Mascot and Contact Details - Left Side */}
        <div className={styles.mascotAndInfoLeft}>
          <div className={styles.mascotLeft}>
            <img
              src="/cassandra/Contact-Cass.png"
              alt="Cassandra - váš kontaktný asistent"
              className={styles.contactMascotImage}
              loading="eager"
            />
          </div>

          {/* Contact Details Section */}
          <div className={styles.contactInfoSectionLeft}>
            {/* Address */}
            <div className={styles.infoContent}>
              <div className={styles.infoIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <p>{t('company_info.address.street', 'Hlavná 123')}</p>
                <p>{t('company_info.address.city', '010 01 Žilina')}</p>
                <p>{t('company_info.address.country', 'Slovakia')}</p>
              </div>
            </div>

            {/* Phone */}
            <div className={styles.infoContent}>
              <div className={styles.infoIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div>
                <p>{t('company_info.phone', '+421 123 456 789')}</p>
              </div>
            </div>

            {/* Email */}
            <div className={styles.infoContent}>
              <div className={styles.infoIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <p>{t('company_info.email', 'info@martyx-industries.com')}</p>
              </div>
            </div>

            {/* Business Hours */}
            <div className={styles.infoContent}>
              <div className={styles.infoIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              </div>
              <div>
                <p>{t('company_info.hours.weekdays', 'Mon - Fri: 9:00 - 17:00')}</p>
                <p>{t('company_info.hours.weekend', 'Sat - Sun: Closed')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form - Right Side */}
        <div className={styles.contactFormSection}>
          <div className={styles.formHeader}>
            <h1>{t('title', 'Contact Us')}</h1>
            <p>{t('subtitle', 'Get in touch with our team. We\'re here to help with your RC modeling needs.')}</p>
          </div>

          {/* Success Message */}
          {submitStatus === 'success' && (
            <div className={styles.successMessage}>
              <div className={styles.successIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              </div>
              <div>
                <h3>{t('form.success.title', 'Message Sent!')}</h3>
                <p>{t('form.success.message', 'Thank you for your message. We\'ll get back to you within 24 hours.')}</p>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {(validationErrors.length > 0 || apiError) && (
            <div className={styles.errorMessages}>
              {validationErrors.map((error, index) => (
                <div key={index} className={styles.errorItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  {error}
                </div>
              ))}
              {apiError && (
                <div className={styles.errorItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  {apiError}
                </div>
              )}
            </div>
          )}

          {/* Contact Form */}
          <form className={styles.contactForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="email">{t('form.email.label', 'Email Address')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('form.email.placeholder', 'your.email@example.com')}
                required
                className={validationErrors.some(e => e.includes('email') || e.includes('Email')) ? styles.inputError : ''}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="subject">{t('form.subject.label', 'Subject')}</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder={t('form.subject.placeholder', 'What can we help you with?')}
                required
                className={validationErrors.some(e => e.includes('subject') || e.includes('Subject')) ? styles.inputError : ''}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="text">{t('form.message.label', 'Message')}</label>
              <textarea
                id="text"
                name="text"
                value={formData.text}
                onChange={handleInputChange}
                placeholder={t('form.message.placeholder', 'Tell us about your project, questions, or how we can help...')}
                rows={6}
                required
                className={validationErrors.some(e => e.includes('message') || e.includes('Message')) ? styles.inputError : ''}
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className={styles.spinner}></div>
                  {t('form.sending', 'Sending...')}
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                  </svg>
                  {t('form.send', 'Send Message')}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
