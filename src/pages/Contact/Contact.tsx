import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Contact.css';

const Contact: React.FC = () => {
  const { t } = useTranslation('contact');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // TODO: Implement actual form submission to backend
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate success
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page" role="main">
      <div className="contact-container">
        {/* Company Information - Left Side */}
        <section className="company-info" aria-labelledby="company-info-title">
          <h1 className="page-title">{t('title')}</h1>
          <p className="page-subtitle">{t('subtitle')}</p>
          <h2 id="company-info-title">{t('company_info.title')}</h2>
          
          <div className="company-card">
            <h3 className="company-name">{t('company_info.name')}</h3>
            <p className="company-description">{t('company_info.description')}</p>
          </div>

          <div className="info-section">
            <h4>{t('company_info.address.title')}</h4>
            <div className="info-content">
              <div className="info-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <p>{t('company_info.address.street')}</p>
                <p>{t('company_info.address.city')}</p>
                <p>{t('company_info.address.country')}</p>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h4>{t('company_info.contact.title')}</h4>
            
            <div className="info-content">
              <div className="info-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div>
                <a href={`tel:${t('company_info.contact.phone')}`} className="contact-link">
                  {t('company_info.contact.phone')}
                </a>
              </div>
            </div>

            <div className="info-content">
              <div className="info-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <a href={`mailto:${t('company_info.contact.email')}`} className="contact-link">
                  {t('company_info.contact.email')}
                </a>
              </div>
            </div>

            <div className="info-content">
              <div className="info-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              </div>
              <div>
                <p>{t('company_info.contact.business_hours')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form - Right Side */}
        <section className="contact-form-section" aria-labelledby="contact-form-title">
          <h2 id="contact-form-title">{t('form.title')}</h2>
          <p className="form-subtitle">{t('form.subtitle')}</p>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">{t('form.fields.name.label')}</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={t('form.fields.name.placeholder')}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('form.fields.email.label')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('form.fields.email.placeholder')}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">{t('form.fields.subject.label')}</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder={t('form.fields.subject.placeholder')}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">{t('form.fields.message.label')}</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder={t('form.fields.message.placeholder')}
                rows={6}
                required
                disabled={isSubmitting}
              />
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('form.sending') : t('form.submit')}
            </button>

            {submitStatus === 'success' && (
              <div className="form-message success" role="alert">
                {t('form.success')}
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="form-message error" role="alert">
                {t('form.error')}
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  );
};

export default Contact;
