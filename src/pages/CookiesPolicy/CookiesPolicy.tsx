import React from 'react';
import PolicyPage from '../../components/common/PolicyPage/PolicyPage';

const CookiesPolicy: React.FC = () => {
  const sections = [
    {
      content: 'This Cookie Policy explains how Martyx Industries ("we", "us", or "our") uses cookies and similar technologies on our website. It should be read together with our [Privacy Policy].',
      links: [{ text: 'Privacy Policy', to: '/privacy-policy' }]
    },
    {
      title: 'What are cookies?',
      content: 'Cookies are small text files that are stored on your device when you visit a website. They help the site remember your actions and preferences (such as login, language, and other settings) over a period of time, so you don\'t have to re-enter them whenever you come back to the site or browse from one page to another.'
    },
    {
      title: 'How we use cookies',
      content: 'We use cookies for the following purposes:'
    },
    {
      content: [
        'Strictly necessary cookies – Required for core site functionality, such as security, network management, and accessibility. These cannot be disabled.',
        'Analytics cookies – Help us understand how visitors interact with our site so we can improve performance and user experience.',
        'Marketing cookies – Used to deliver relevant content and offers based on your interests.'
      ]
    },
    {
      title: 'Cookies we use',
      content: 'Below is an overview of the types of cookies you may encounter on our site:'
    },
    {
      content: [
        'Session cookies – Temporary cookies that stay on your device until you close your browser.',
        'Persistent cookies – Remain on your device for a set period or until deleted.',
        'First-party cookies – Set by our website directly.',
        'Third-party cookies – Set by third parties (e.g., analytics or payment providers) when interacting with our site.'
      ]
    },
    {
      title: 'Managing your cookie preferences',
      content: 'You can manage your preferences at any time using the cookie banner on our site. To update your choices, open the banner via the "Preferences" option when it appears, or clear your cookies to have the banner re-appear.'
    },
    {
      content: 'You can also block or delete cookies through your browser settings. Please note that blocking some types of cookies may impact your experience on the site and the services we are able to offer.'
    },
    {
      title: 'Changes to this policy',
      content: 'We may update this Cookie Policy from time to time to reflect changes to our cookies or for operational, legal, or regulatory reasons. Please revisit this page regularly to stay informed about our use of cookies.'
    },
    {
      title: 'Contact us',
      content: 'If you have any questions about our use of cookies, please contact us via the details provided on our [About] page.',
      links: [{ text: 'About', to: '/about' }]
    }
  ];

  return (
    <PolicyPage 
      title="Cookie Policy" 
      lastUpdated="11 August 2025" 
      sections={sections} 
    />
  );
};

export default CookiesPolicy;
