import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactService } from '../../services/contactService';
import { companySettingsService } from '../../services/companySettingsService';
import { contactSchema, type ContactFormData } from '../../schemas/formSchemas';
import type { CompanySettingsDto } from '../../types/invoice';
import './Contact.css';
import { logInfo, logWarn, logError } from '../../services/logger';

const Contact: React.FC = () => {
  const { t } = useTranslation('contact');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettingsDto | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [sliderVerified, setSliderVerified] = useState(false);

  // React Hook Form setup with zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      subject: '',
      text: '',
      website: '',
      formStartTime: Date.now(),
      verificationToken: `verify_${Date.now()}_${Math.random().toString(36).substring(7)}`
    }
  });

  // Fetch company settings on component mount
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const settings = await companySettingsService.getCompanySettings();
        setCompanySettings(settings);
      } catch (error) {
        logError('Failed to load company settings:', error);
        // Fallback to translations if API fails
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchCompanySettings();
  }, []);

  const handleContactSubmit = async (formData: ContactFormData) => {
    setSubmitStatus('idle');
    setApiError(null);

    try {
      // Anti-bot validation: honeypot should be empty
      if (formData.website && formData.website.length > 0) {
        logWarn('[Contact] Bot detected - honeypot field filled');
        setSubmitStatus('error');
        setApiError('Invalid submission detected');
        return;
      }

      // Anti-bot validation: form should take at least 2 seconds to fill
      if (formData.formStartTime) {
        const timeSpent = Date.now() - formData.formStartTime;
        if (timeSpent < 2000) {
          logWarn('[Contact] Bot detected - form filled too quickly');
          setSubmitStatus('error');
          setApiError('Please take your time to fill out the form');
          return;
        }
      }

      // Submit to backend (only required fields)
      await contactService.sendMessage({
        email: formData.email,
        subject: formData.subject,
        text: formData.text
      });

      // Success
      setSubmitStatus('success');
      setSliderVerified(false);
      reset({
        email: '',
        subject: '',
        text: '',
        website: '',
        formStartTime: Date.now(),
        verificationToken: `verify_${Date.now()}_${Math.random().toString(36).substring(7)}`
      });
    } catch (error: any) {
      logError('Contact form submission error:', error);
      setSubmitStatus('error');

      // Handle API error with message from backend
      if (error.errorData && error.errorData.message) {
        setApiError(error.errorData.message);
      } else {
        setApiError(t('form.error'));
      }
    }
  };

  return (
    <div className="contact-page" role="main">
      <div className="contact-container">
        {/* Mascot and Contact Details - Left Side */}
        <div className="mascot-and-info-left">
          <div className="mascot-left">
            <img
              src="/cassandra/Contact-Cass.png"
              alt="Cassandra - váš kontaktný asistent"
              className="contact-mascot-image"
              loading="eager"
            />
          </div>

          {/* Contact Details Section */}
          <div className="contact-info-section-left">

            {/* Company Registration Details - First */}
            {!isLoadingSettings && companySettings && (
              <div className="info-content">
                <div className="info-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                </div>
                <div>
                  <p className="company-name"><strong>{companySettings.company_name}</strong></p>
                  <p><strong>{t('company_info.company_id', { ns: 'common' })}:</strong> {companySettings.company_id}</p>
                  <p><strong>{t('company_info.tax_id', { ns: 'common' })}:</strong> {companySettings.tax_id}</p>
                  <p><strong>{t('company_info.vat_id', { ns: 'common' })}:</strong> {companySettings.vat_id}</p>
                </div>
              </div>
            )}

            {/* Address - Second */}
            <div className="info-content">
              <div className="info-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                {isLoadingSettings ? (
                  <p>{t('loading', { ns: 'common' })}</p>
                ) : companySettings ? (
                  <>
                    <p>{companySettings.street}</p>
                    <p>{companySettings.city} {companySettings.postal_code}</p>
                    <p>{companySettings.country}</p>
                  </>
                ) : (
                  <>
                    <p>{t('company_info.address.street')}</p>
                    <p>{t('company_info.address.city')}</p>
                    <p>{t('company_info.address.country')}</p>
                  </>
                )}
              </div>
            </div>

            {/* Email - Third */}
            <div className="info-content">
              <div className="info-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                {isLoadingSettings ? (
                  <p>{t('loading', { ns: 'common' })}</p>
                ) : companySettings ? (
                  <a href={`mailto:${companySettings.email}`} className="contact-link">
                    {companySettings.email}
                  </a>
                ) : (
                  <a href={`mailto:${t('company_info.contact.email')}`} className="contact-link">
                    {t('company_info.contact.email')}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form - Right Side */}
        <section className="contact-form-section" aria-labelledby="contact-form-title">
          <h2 id="contact-form-title">{t('form.title')}</h2>
          <p className="form-subtitle">{t('form.subtitle')}</p>

          <form className="contact-form" onSubmit={handleSubmit(handleContactSubmit)}>
            <div className="form-group">
              <label htmlFor="email">{t('form.fields.email.label')}</label>
              <input
                type="email"
                id="email"
                placeholder={t('form.fields.email.placeholder')}
                className={errors.email ? 'error' : ''}
                disabled={isSubmitting}
                {...register('email')}
              />
              {errors.email && (
                <span className="field-error">{errors.email.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="subject">{t('form.fields.subject.label')}</label>
              <input
                type="text"
                id="subject"
                placeholder={t('form.fields.subject.placeholder')}
                className={errors.subject ? 'error' : ''}
                disabled={isSubmitting}
                {...register('subject')}
              />
              {errors.subject && (
                <span className="field-error">{errors.subject.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="text">{t('form.fields.text.label')}</label>
              <textarea
                id="text"
                placeholder={t('form.fields.text.placeholder')}
                rows={6}
                className={errors.text ? 'error' : ''}
                disabled={isSubmitting}
                {...register('text')}
              />
              {errors.text && (
                <span className="field-error">{errors.text.message}</span>
              )}
            </div>

            {/* Honeypot field - hidden from humans, but bots will fill it */}
            <div className="honeypot-field" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}>
              <label htmlFor="website">Website</label>
              <input
                type="text"
                id="website"
                tabIndex={-1}
                autoComplete="off"
                {...register('website')}
              />
            </div>

            {/* Slider and Submit Button Row */}
            <div className="form-submit-row">
              {/* Compact Slider verification */}
              <div className="slider-verification-compact">
                <div className="slider-track-compact">
                  <div
                    className={`slider-thumb-compact ${sliderVerified ? 'verified' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={(e) => {
                      const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                      if (rect) {
                        const dragDistance = e.clientX - rect.left;
                        const trackWidth = rect.width - 40; // 40px is thumb width
                        if (dragDistance >= trackWidth * 0.9) {
                          setSliderVerified(true);
                        }
                      }
                    }}
                  >
                    {sliderVerified ? '✓' : '→'}
                  </div>
                  <span className="slider-label-compact">
                    {sliderVerified ? t('form.slider_verified', 'Verified') : t('form.slider_instruction', 'Slide')}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting || !sliderVerified}
              >
                {isSubmitting ? t('form.sending') : t('form.submit')}
              </button>
            </div>

            {submitStatus === 'success' && (
              <div className="form-message success" role="alert">
                {t('form.success')}
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="form-message error" role="alert">
                {/* Show API error */}
                {apiError && (
                  <div className="api-error">
                    {apiError}
                  </div>
                )}

                {/* Show generic error if no specific error */}
                {!apiError && (
                  <div>{t('form.error')}</div>
                )}
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  );
};

export default Contact;
