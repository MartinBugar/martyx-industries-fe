# Matrix Background Effect

A professional Matrix-style falling character background effect for the admin login page.

## 🎯 Features

- **Dark yellow falling characters** on pure black background (#C9A000)
- **Configurable speed and density** for easy customization
- **Optimized performance** using `requestAnimationFrame`
- **No memory leaks** - proper cleanup on unmount
- **Non-intrusive** - doesn't block user interactions
- **Admin login only** - not visible on public pages

## 📍 Location

**Component:** `src/components/MatrixBackground/MatrixBackground.tsx`
**Used in:** `src/pages/admin/AdminLogin.tsx` (ADMIN LOGIN PAGE ONLY)

## ⚙️ Configuration

### Quick Configuration

Edit the props in `src/pages/admin/AdminLogin.tsx`:

```tsx
<MatrixBackground
  speed={0.4}      // Falling speed (0.1 - 2.0)
  density={0.85}   // Rain density (0.1 - 1.5)
/>
```

### Configuration Options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `speed` | `number` | `0.4` | Speed multiplier for falling characters. Lower = slower, more cinematic. Range: 0.1 - 2.0 |
| `density` | `number` | `0.85` | Density of the character rain. Lower = fewer columns. Range: 0.1 - 1.5 |
| `characters` | `string` | `'ABCDEFG...'` | Custom character set for falling text |
| `color` | `string` | `'#C9A000'` | Primary color for falling characters (dark yellow) |

### Example Configurations

**Slow and subtle (current default):**
```tsx
<MatrixBackground speed={0.4} density={0.85} />
```

**Fast and intense:**
```tsx
<MatrixBackground speed={1.2} density={1.2} />
```

**Minimal background:**
```tsx
<MatrixBackground speed={0.3} density={0.5} />
```

**Custom characters and color:**
```tsx
<MatrixBackground
  speed={0.5}
  density={1.0}
  characters="01010101アイウエオ"
  color="#00FF41"
/>
```

## 🎨 Color Customization

To change the character color, edit the `color` prop:

```tsx
<MatrixBackground color="#C9A500" />  // Lighter yellow
<MatrixBackground color="#00FF41" />  // Classic Matrix green
<MatrixBackground color="#FF6B6B" />  // Red variant
```

## 🚀 How It Works

1. **Canvas Rendering**: Uses HTML5 Canvas for smooth animation
2. **requestAnimationFrame**: 60fps animation loop for optimal performance
3. **Multi-layer depth**: Characters have varying opacity for depth perception
4. **Fade-out effect**: Characters smoothly disappear at the bottom
5. **Continuous loop**: Characters reset to top after reaching bottom

## 🔧 Advanced Customization

### Change Character Set

Edit the default character set in the component or pass custom characters:

```tsx
// Binary only
<MatrixBackground characters="01" />

// Numbers only
<MatrixBackground characters="0123456789" />

// Japanese katakana + numbers
<MatrixBackground characters="アイウエオカキクセタチツテト0123456789" />

// Custom symbols
<MatrixBackground characters="$€£¥₿♠♣♥♦" />
```

### Performance Tuning

For better performance on slower machines:

```tsx
// Lighter configuration
<MatrixBackground speed={0.3} density={0.6} />
```

For high-end machines:

```tsx
// More intense configuration
<MatrixBackground speed={0.8} density={1.3} />
```

## 🛑 How to Disable/Remove

To completely remove the Matrix effect:

1. Open `src/pages/admin/AdminLogin.tsx`
2. Remove or comment out these lines:

```tsx
{/* Matrix Background Effect - ADMIN LOGIN ONLY */}
{/* Configuration: speed={0.4} density={0.85} */}
{/* To disable: Remove this component */}
<MatrixBackground speed={0.4} density={0.85} />
```

3. Optionally remove the import:

```tsx
import MatrixBackground from '../../components/MatrixBackground/MatrixBackground';
```

## 📊 Z-Index Layering

The Matrix effect uses a carefully structured z-index system:

```
z-index: 0   - Matrix canvas (background)
z-index: 1   - Gradient overlay (.martyx-admin-bg)
z-index: 10  - Admin login form (.martyx-admin-content)
z-index: 9999 - Modal overlay (if any)
```

This ensures the Matrix stays in the background while the login form remains fully interactive.

## 🐛 Troubleshooting

### Matrix not visible
- Check that the component is imported correctly
- Verify z-index values in CSS
- Ensure canvas has proper dimensions

### Performance issues
- Reduce `density` prop (try 0.5 - 0.7)
- Reduce `speed` prop (try 0.2 - 0.3)
- Check browser console for errors

### Characters not falling smoothly
- Ensure `requestAnimationFrame` is supported in browser
- Check for other CPU-intensive scripts running
- Try reducing density

## 🔒 Security Note

This effect is **only visible on the admin login page** (`/admin/login`). It does NOT appear on:
- Public login pages
- Other admin pages (after successful login)
- Any other routes in the application

## 📝 Technical Details

- **Rendering**: HTML5 Canvas 2D Context
- **Animation**: requestAnimationFrame (60fps target)
- **Cleanup**: Automatic on component unmount
- **Memory**: No leaks, proper event listener cleanup
- **Accessibility**: Pointer events disabled (clicks pass through)

## 🎯 Best Practices

1. **Keep it subtle**: The login form should always be the main focus
2. **Test performance**: Verify smooth animation on target devices
3. **Don't overdo it**: Use moderate speed and density values
4. **Consider accessibility**: Ensure text remains readable

## 📄 Files

```
src/components/MatrixBackground/
├── MatrixBackground.tsx    # Main component
├── MatrixBackground.css    # Styling
├── index.ts               # Export
└── README.md             # This file
```

## 🔗 Integration

Currently integrated in:
- ✅ `src/pages/admin/AdminLogin.tsx` - Admin login page

NOT integrated in:
- ❌ Public login pages
- ❌ Other admin pages
- ❌ Global layout

---

**Last updated:** 2025-01-22
**Version:** 1.0.0
