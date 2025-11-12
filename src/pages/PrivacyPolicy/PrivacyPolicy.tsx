import React from 'react';
import { useTranslation } from 'react-i18next';
import PolicyPage from '../../components/common/PolicyPage/PolicyPage';

const PrivacyPolicy: React.FC = () => {
  const { t } = useTranslation('policies');

  const sections = [
    {
      content: t('privacy_policy.intro')
    },
    {
      title: t('privacy_policy.information_collect.title'),
      content: t('privacy_policy.information_collect.items', { returnObjects: true }) as string[],
      links: [{ text: t('links.cookie_policy'), to: '/cookies-policy' }]
    },
    {
      title: t('privacy_policy.how_use.title'),
      content: t('privacy_policy.how_use.items', { returnObjects: true }) as string[]
    },
    {
      title: t('privacy_policy.data_retention.title'),
      content: t('privacy_policy.data_retention.content')
    },
    {
      title: t('privacy_policy.sharing.title'),
      content: t('privacy_policy.sharing.content')
    },
    {
      title: t('privacy_policy.your_rights.title'),
      content: t('privacy_policy.your_rights.content'),
      links: [{ text: t('links.about'), to: '/about' }]
    },
    {
      title: t('privacy_policy.changes.title'),
      content: t('privacy_policy.changes.content')
    },
    {
      title: t('privacy_policy.contact.title'),
      content: t('privacy_policy.contact.content'),
      links: [{ text: t('links.about'), to: '/about' }]
    }
  ];

  return (
    <PolicyPage
      title={t('privacy_policy.title')}
      lastUpdated={t('privacy_policy.last_updated_date')}
      sections={sections}
    />
  );
};

export default PrivacyPolicy;
