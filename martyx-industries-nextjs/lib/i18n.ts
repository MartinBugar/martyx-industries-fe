import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    nav: {
      home: 'Home',
      products: 'Products',
      about: 'About',
      contact: 'Contact',
      search: 'Search',
      search_placeholder: 'Search products...',
      cart: 'Cart',
      wishlist: 'Wishlist',
      sign_in: 'Sign In',
      sign_up: 'Sign Up',
      sign_out: 'Sign Out',
      account: 'Account',
      toggle_navigation: 'Toggle navigation',
      close_menu: 'Close menu',
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
    },
  },
  sk: {
    nav: {
      home: 'Domov',
      products: 'Produkty',
      about: 'O nás',
      contact: 'Kontakt',
      search: 'Hľadať',
      search_placeholder: 'Hľadať produkty...',
      cart: 'Košík',
      wishlist: 'Wishlist',
      sign_in: 'Prihlásiť sa',
      sign_up: 'Registrovať sa',
      sign_out: 'Odhlásiť sa',
      account: 'Účet',
      toggle_navigation: 'Prepnúť navigáciu',
      close_menu: 'Zavrieť menu',
    },
    common: {
      loading: 'Načítavam...',
      error: 'Chyba',
      success: 'Úspech',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
