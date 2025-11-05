# PWA Desktop Installation Setup - Instructions

## Overview
Your application is now configured as a Progressive Web App (PWA) that can be installed on desktop computers (Windows, Mac, Linux) and mobile devices. Users will see an install prompt after visiting the site.

## What Was Implemented

### 1. Enhanced Manifest File (`public/manifest.webmanifest`)
- ✅ Desktop-optimized display modes including `window-controls-overlay`
- ✅ App categories for better discoverability
- ✅ Shortcuts for quick access to Products, Cart, and Account
- ✅ Screenshots configuration for install dialog
- ✅ Multiple icon sizes for different platforms

### 2. Install Prompt Component (`src/components/InstallPWA/`)
- ✅ Smart detection of installation capability
- ✅ Dismissible prompt that reappears after 7 days
- ✅ Desktop and mobile optimized UI
- ✅ Automatic detection if app is already installed

### 3. Integration
- ✅ Component integrated into main App.tsx
- ✅ Works alongside existing service worker

## Required Assets (You Need to Add These)

### Icons
You need to create the following icon files and place them in the `public/` folder:

1. **logo-512.png** (512x512 pixels)
   - High-resolution version of your logo
   - Should have transparent background
   - Used for desktop app icon and splash screens

2. **Current logo.png** (192x192 pixels)
   - Already exists, but verify it's a PNG (not SVG)
   - Should have transparent background

### Screenshots
You need to create screenshots and place them in the `public/` folder:

1. **screenshot-desktop.png** (1920x1080 pixels)
   - Full-width screenshot of your app on desktop
   - Shows main features prominently
   - Should be a real screenshot, not mockup

2. **screenshot-mobile.png** (750x1334 pixels)
   - Mobile view screenshot
   - Portrait orientation
   - Shows key mobile features

### How to Create Icons

#### Option 1: Using Online Tools
1. Go to https://realfavicongenerator.net/
2. Upload your logo (high-resolution PNG with transparent background)
3. Generate all sizes
4. Download and place in `public/` folder

#### Option 2: Using Image Editor (Photoshop, GIMP, etc.)
1. Open your logo
2. Resize to 512x512 pixels (maintain aspect ratio with transparent background)
3. Export as PNG
4. Repeat for 192x192 if needed

#### Option 3: Using ImageMagick (Command Line)
```bash
# Install ImageMagick first
# For 512x512
convert logo.png -resize 512x512 -background none -gravity center -extent 512x512 logo-512.png

# For 192x192
convert logo.png -resize 192x192 -background none -gravity center -extent 192x192 logo-192.png
```

### How to Create Screenshots

1. **Desktop Screenshot:**
   - Open your app in a browser
   - Set window size to 1920x1080
   - Navigate to your homepage or products page
   - Take screenshot (Windows: Win+Shift+S, Mac: Cmd+Shift+4)
   - Save as `screenshot-desktop.png` in `public/` folder

2. **Mobile Screenshot:**
   - Open Chrome DevTools (F12)
   - Toggle device toolbar (Ctrl+Shift+M)
   - Select iPhone 12 Pro or similar (375x667 base resolution)
   - Take screenshot
   - Save as `screenshot-mobile.png` in `public/` folder

## Testing the Installation

### On Desktop (Chrome/Edge):
1. Open your app in Chrome or Edge
2. After 3 seconds, you should see the install prompt at the bottom (or bottom-left on desktop)
3. Click "Install App"
4. The app will be installed and can be launched from:
   - Windows: Start Menu
   - Mac: Applications folder
   - Linux: Application menu

### On Mobile:
1. Open in Chrome (Android) or Safari (iOS)
2. Install prompt will appear
3. Or use browser menu → "Install App" / "Add to Home Screen"

### Manual Install (if prompt doesn't appear):
- **Chrome/Edge:** Look for install icon in address bar (⊕ or computer icon)
- **Chrome:** Menu → More tools → Install app
- **Edge:** Menu → Apps → Install this site as an app

## App Features After Installation

Once installed, users get:
- ✅ Native app-like window without browser UI
- ✅ Desktop icon/Start menu shortcut
- ✅ Offline functionality (thanks to service worker)
- ✅ Fast app launch
- ✅ Standalone window with custom title bar (on supported browsers)
- ✅ Quick access shortcuts (right-click app icon)

## Shortcuts Feature

When users right-click the installed app icon, they'll see shortcuts to:
- 🛍️ Products
- 🛒 Cart
- 👤 Account

## Browser Support

### Full PWA Install Support:
- ✅ Chrome 73+ (Windows, Mac, Linux, Android)
- ✅ Edge 79+ (Windows, Mac)
- ✅ Safari 16.4+ (Mac, iOS - limited)
- ✅ Samsung Internet 4+
- ✅ Opera 60+

### Limited Support:
- ⚠️ Firefox (no install prompt, but can be added manually)
- ⚠️ Safari iOS (Add to Home Screen instead)

## Customization

### Change Install Prompt Behavior

Edit `src/components/InstallPWA/InstallPWA.tsx`:

```typescript
// Change delay before showing prompt (currently 3 seconds)
setTimeout(() => {
  setShowInstallPrompt(true);
}, 3000); // Change this value

// Change how long to wait before showing again after dismiss (currently 7 days)
if (daysSinceDismissed < 7) { // Change this value
  return;
}
```

### Change App Colors

Edit `public/manifest.webmanifest`:

```json
{
  "background_color": "#0b0f14",  // Your brand color
  "theme_color": "#0b0f14"        // Your brand color
}
```

### Add More Shortcuts

Edit `public/manifest.webmanifest` shortcuts array:

```json
{
  "name": "Your Feature",
  "short_name": "Feature",
  "description": "Description",
  "url": "/your-route",
  "icons": [{ "src": "/logo.png", "sizes": "192x192" }]
}
```

## Troubleshooting

### Install prompt doesn't appear:
1. Check browser console for errors
2. Verify service worker is registered (DevTools → Application → Service Workers)
3. Ensure manifest is valid (DevTools → Application → Manifest)
4. App must be served over HTTPS (or localhost)
5. User may have already installed or dismissed recently

### Icons don't show correctly:
1. Verify icon files exist in `public/` folder
2. Check file sizes match manifest specifications
3. Clear browser cache and reload

### App doesn't work offline:
1. Check service worker status
2. Verify `sw.js` is loading correctly
3. Check Network tab for cached resources

## Production Checklist

Before deploying to production:

- [ ] Add `logo-512.png` to `public/` folder
- [ ] Verify `logo.png` is 192x192 PNG
- [ ] Add `screenshot-desktop.png` (1920x1080)
- [ ] Add `screenshot-mobile.png` (750x1334)
- [ ] Test install on Chrome desktop
- [ ] Test install on mobile device
- [ ] Verify shortcuts work after installation
- [ ] Test offline functionality
- [ ] Verify app icon appears in OS app menu
- [ ] Test uninstall process

## Analytics

To track PWA installations, you can add analytics to the install component:

```typescript
// In InstallPWA.tsx, add to handleInstallClick:
window.gtag?.('event', 'pwa_install', {
  event_category: 'engagement',
  event_label: 'PWA Installation'
});
```

## Additional Resources

- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Chrome Install Criteria](https://web.dev/install-criteria/)
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)

## Support

If you encounter issues:
1. Check browser DevTools Console
2. Check Application tab → Manifest
3. Check Application tab → Service Workers
4. Ensure HTTPS is enabled in production
