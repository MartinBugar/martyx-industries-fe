import React from 'react';
import { useTranslation } from 'react-i18next';
import PolicyPage from '../../components/common/PolicyPage/PolicyPage';

const TermsOfService: React.FC = () => {
  const { t } = useTranslation('policies');

  const sections = [
    {
      content: t('terms_of_service.intro')
    },
    {
      title: t('terms_of_service.use_service.title'),
      content: t('terms_of_service.use_service.items', { returnObjects: true }) as string[]
    },
    {
      title: t('terms_of_service.purchases.title'),
      content: t('terms_of_service.purchases.content')
    },
    {
      title: t('terms_of_service.intellectual_property.title'),
      content: t('terms_of_service.intellectual_property.content')
    },
    {
      title: t('terms_of_service.limitation.title'),
      content: t('terms_of_service.limitation.content')
    },
    {
      title: t('terms_of_service.privacy.title'),
      content: t('terms_of_service.privacy.content'),
      links: [
        { text: t('links.privacy_policy'), to: '/privacy-policy' },
        { text: t('links.cookie_policy'), to: '/cookies-policy' }
      ]
    },
    {
      title: t('terms_of_service.changes.title'),
      content: t('terms_of_service.changes.content')
    },
    {
      title: t('terms_of_service.contact.title'),
      content: t('terms_of_service.contact.content'),
      links: [{ text: t('links.about'), to: '/about' }]
    }
  ];

  return (
    <PolicyPage
      title={t('terms_of_service.title')}
      lastUpdated={t('terms_of_service.last_updated_date')}
      sections={sections}
    />
  );
};

export default TermsOfService;
