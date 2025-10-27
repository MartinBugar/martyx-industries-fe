import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import FooterNew from './FooterNew';

// Wrapper for React Router
const RouterDecorator = (Story: React.ComponentType) => (
  <BrowserRouter>
    <Story />
  </BrowserRouter>
);

const meta = {
  title: 'Components/FooterNew',
  component: FooterNew,
  decorators: [RouterDecorator],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Moderný, prémiový footer komponent pre e-shop s dark theme dizajnom. Obsahuje newsletter, navigačné linky, trust badges, kontakt a social media linky.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FooterNew>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default Story
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Základný footer v desktop zobrazení.',
      },
    },
  },
};

// Mobile View
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Footer v mobile zobrazení s akordeónmi pre navigačné sekcie.',
      },
    },
  },
};

// Tablet View
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Footer v tablet zobrazení s 2-3 stĺpcami.',
      },
    },
  },
};

// Desktop Wide
export const DesktopWide: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Footer v širokom desktop zobrazení (1920px+).',
      },
    },
  },
};

// With Context
export const WithPageContext: Story = {
  decorators: [
    (Story) => (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-white border-b p-4">
          <h1 className="text-2xl font-bold">Martyx Industries</h1>
        </header>
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Page Content</h2>
            <p className="text-gray-600 mb-4">
              This story shows the footer in the context of a full page layout.
              Scroll down to see the footer.
            </p>
            <div className="h-[600px] bg-white rounded-lg shadow-sm p-8">
              <p>Main content area...</p>
            </div>
          </div>
        </main>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Footer zobrazený v kontexte celej stránky s header a main obsahom.',
      },
    },
  },
};

// Dark Background (to show the footer clearly)
export const OnDarkBackground: Story = {
  decorators: [
    (Story) => (
      <div className="bg-[#000000] min-h-screen flex items-end">
        <Story />
      </div>
    ),
  ],
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Footer na tmavom pozadí pre lepšiu vizualizáciu kontrastu.',
      },
    },
  },
};

// Accessibility Test
export const AccessibilityTest: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'label',
            enabled: true,
          },
          {
            id: 'button-name',
            enabled: true,
          },
          {
            id: 'link-name',
            enabled: true,
          },
        ],
      },
    },
    docs: {
      description: {
        story: 'Footer s aktívnymi accessibility testami. Použite Accessibility addon v Storybook pre kompletný audit.',
      },
    },
  },
};

// Newsletter Focus State
export const NewsletterFocusState: Story = {
  play: async ({ canvasElement }) => {
    const canvas = canvasElement as HTMLElement;
    const input = canvas.querySelector('input[type="email"]') as HTMLInputElement;
    if (input) {
      input.focus();
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Footer so zameraním na newsletter input pole pre zobrazenie focus stavu.',
      },
    },
  },
};

// With Long Content (Scroll Test)
export const WithLongContent: Story = {
  decorators: [
    (Story) => (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 bg-gray-100 p-8">
          <h1 className="text-4xl font-bold mb-8">Long Page Content</h1>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="mb-8 p-6 bg-white rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">Section {i + 1}</h2>
              <p className="text-gray-600">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
                quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
          ))}
        </div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Footer na stránke s dlhým obsahom pre testovanie scroll správania.',
      },
    },
  },
};
