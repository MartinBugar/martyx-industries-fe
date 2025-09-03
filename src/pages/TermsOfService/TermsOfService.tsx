import React from 'react';
import PolicyPage from '../../components/common/PolicyPage/PolicyPage';

const TermsOfService: React.FC = () => {
  const sections = [
    {
      content: 'Welcome to Martyx Industries. These Terms of Service ("Terms") govern your use of our website and services. By accessing or using our services, you agree to be bound by these Terms.'
    },
    {
      title: 'Use of the service',
      content: [
        'You must be at least 18 years old or have parental consent to use our services.',
        'You agree not to misuse the services or violate applicable laws.',
        'We reserve the right to modify or discontinue features at any time.'
      ]
    },
    {
      title: 'Purchases and payments',
      content: 'All purchases are subject to our pricing and availability. Payments are processed by third-party providers under their terms and security standards.'
    },
    {
      title: 'Intellectual property',
      content: 'All content, designs, and materials provided are owned by or licensed to Martyx Industries and are protected by applicable intellectual property laws. You may not reproduce or distribute content without permission.'
    },
    {
      title: 'Limitation of liability',
      content: 'To the fullest extent permitted by law, Martyx Industries will not be liable for any indirect, incidental, or consequential damages arising from the use of our services.'
    },
    {
      title: 'Privacy',
      content: 'Your use of our services is also governed by our [Privacy Policy] and our [Cookie Policy].',
      links: [
        { text: 'Privacy Policy', to: '/privacy-policy' },
        { text: 'Cookie Policy', to: '/cookies-policy' }
      ]
    },
    {
      title: 'Changes to these terms',
      content: 'We may update these Terms from time to time. Continued use of the service after changes constitutes acceptance of the new Terms.'
    },
    {
      title: 'Contact',
      content: 'For questions about these Terms, contact us via the details on our [About] page.',
      links: [{ text: 'About', to: '/about' }]
    }
  ];

  return (
    <PolicyPage 
      title="Terms of Service" 
      lastUpdated="11 August 2025" 
      sections={sections} 
    />
  );
};

export default TermsOfService;
