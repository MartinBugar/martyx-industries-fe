import React from 'react';
import { useTranslation } from 'react-i18next';
import PolicyPage from '../../components/common/PolicyPage/PolicyPage';

const CookiesPolicy: React.FC = () => {
  const { t } = useTranslation('policies');

  const sections = [
    {
      content: t('cookies_policy.intro'),
      links: [{ text: t('links.privacy_policy'), to: '/privacy-policy' }]
    },
    {
      title: t('cookies_policy.what_are.title'),
      content: t('cookies_policy.what_are.content')
    },
    {
      title: t('cookies_policy.how_use.title'),
      content: t('cookies_policy.how_use.content')
    },
    {
      content: t('cookies_policy.purposes.items', { returnObjects: true }) as string[]
    },
    {
      title: t('cookies_policy.types.title'),
      content: t('cookies_policy.types.intro')
    },
    {
      content: t('cookies_policy.types.items', { returnObjects: true }) as string[]
    },
    {
      title: t('cookies_policy.managing.title'),
      content: t('cookies_policy.managing.content')
    },
    {
      content: t('cookies_policy.browser_settings.content')
    },
    {
      title: t('cookies_policy.changes.title'),
      content: t('cookies_policy.changes.content')
    },
    {
      title: t('cookies_policy.contact.title'),
      content: t('cookies_policy.contact.content'),
      links: [{ text: t('links.about'), to: '/about' }]
    }
  ];

  return (
    <PolicyPage
      title={t('cookies_policy.title')}
      lastUpdated={t('cookies_policy.last_updated_date')}
      sections={sections}
    />
  );
};

export default CookiesPolicy;
