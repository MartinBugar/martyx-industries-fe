import React from 'react';
import PolicyPage from '../../components/common/PolicyPage/PolicyPage';

const PrivacyPolicy: React.FC = () => {
  const sections = [
    {
      content: 'This Privacy Policy explains how Martyx Industries ("we", "us", or "our") collects, uses, and safeguards your information when you visit our website and use our services. By using our site, you agree to the collection and use of information in accordance with this policy.'
    },
    {
      title: 'Information we collect',
      content: [
        'Account information such as name, email address, and password.',
        'Order and payment details processed securely via trusted payment providers.',
        'Usage data and analytics to improve performance and user experience.',
        'Cookies and similar technologies. See our [Cookie Policy] for details.'
      ],
      links: [{ text: 'Cookie Policy', to: '/cookies-policy' }]
    },
    {
      title: 'How we use your information',
      content: [
        'To provide, maintain, and improve our services.',
        'To process transactions and fulfill orders.',
        'To communicate with you regarding your account, orders, and updates.',
        'To enhance security, prevent fraud, and comply with legal obligations.'
      ]
    },
    {
      title: 'Data retention',
      content: 'We retain personal data only for as long as necessary to provide our services and comply with legal requirements. When data is no longer needed, we securely delete or anonymize it.'
    },
    {
      title: 'Sharing your information',
      content: 'We do not sell your personal information. We may share information with service providers (e.g., payment processors) strictly for operational purposes and only under appropriate safeguards.'
    },
    {
      title: 'Your rights',
      content: 'Depending on your location, you may have rights to access, correct, or delete your personal data, and to object to or restrict certain processing. To exercise these rights, contact us via the details on our [About] page.',
      links: [{ text: 'About', to: '/about' }]
    },
    {
      title: 'Changes to this policy',
      content: 'We may update this Privacy Policy from time to time. We will post any changes on this page and update the "Last updated" date above.'
    },
    {
      title: 'Contact us',
      content: 'If you have questions about this Privacy Policy, please reach out via the contact details on our [About] page.',
      links: [{ text: 'About', to: '/about' }]
    }
  ];

  return (
    <PolicyPage 
      title="Privacy Policy" 
      lastUpdated="11 August 2025" 
      sections={sections} 
    />
  );
};

export default PrivacyPolicy;
