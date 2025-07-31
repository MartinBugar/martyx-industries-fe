# E-Shop Component Structure

## Component Hierarchy

```
App
├── Header
│   └── Cart
├── Main
│   ├── ProductView (3D Model)
│   └── ProductDetails
└── Footer
```

## Components Description

### App
- Main container component
- Manages global state (cart items, product data)
- Renders all other components

### Header
- Contains logo and navigation
- Displays cart icon with item count
- Toggles cart visibility

### Cart
- Displays cart items
- Shows total price
- Provides checkout functionality
- Can be toggled open/closed

### ProductView
- Contains the 3D model viewer
- Handles model interaction
- Provides fullscreen toggle
- Allows material property adjustments

### ProductDetails
- Displays product information (name, price, description)
- Lists product features
- Shows interaction instructions
- Contains "Add to Cart" button

### Footer
- Contains copyright information
- Links to policies, about, contact, etc.
- Social media links

## File Structure

```
src/
├── components/
│   ├── Header/
│   │   ├── Header.tsx
│   │   ├── Header.css
│   │   └── index.ts
│   ├── Cart/
│   │   ├── Cart.tsx
│   │   ├── Cart.css
│   │   └── index.ts
│   ├── ProductView/
│   │   ├── ProductView.tsx
│   │   ├── ProductView.css
│   │   └── index.ts
│   ├── ProductDetails/
│   │   ├── ProductDetails.tsx
│   │   ├── ProductDetails.css
│   │   └── index.ts
│   ├── Footer/
│   │   ├── Footer.tsx
│   │   ├── Footer.css
│   │   └── index.ts
│   └── ModelViewer/
│       ├── ModelViewer.tsx
│       ├── ModelViewer.css
│       └── index.ts
├── data/
│   └── productData.ts
├── App.tsx
├── App.css
└── main.tsx
```

## Data Flow

1. Product data is stored in `productData.ts`
2. App component loads product data and manages cart state
3. Product data is passed to ProductView and ProductDetails
4. Cart state is passed to Header (for count) and Cart components
5. User interactions (add to cart, checkout) update the state in App