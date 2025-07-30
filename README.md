# 3D Model Viewer

A web application for displaying 3D models in the GLB format using Google's Model Viewer web component.

## Features

- Display 3D models in GLB format
- Interactive camera controls (rotate, zoom, pan)
- Auto-rotation option
- Customizable environment lighting
- Shadow rendering
- Responsive design

## Technologies Used

- React 19
- TypeScript
- Vite
- Google's Model Viewer web component

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd 3d1
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### Adding Your Own 3D Models

You can add 3D models in two ways:

#### Method 1: Using the public directory

1. Place your GLB model files in the `public/models` directory
2. Update the `modelPath` in `App.tsx` to point to your model:
   ```tsx
   const modelPath = '/models/your-model.glb'
   ```

#### Method 2: Using the src/assets directory

1. Place your GLB model files in the `src/assets` directory
2. Import and use the model in `App.tsx`:
   ```tsx
   import modelFile from './assets/your-model.glb'
   
   function App() {
     const modelPath = modelFile
     // ...
   }
   ```

### Customizing the Model Viewer

The `ModelViewer` component accepts various props to customize the appearance and behavior:

```tsx
<ModelViewer 
  modelPath="/models/your-model.glb"
  alt="Description of your 3D model"
  cameraControls={true}
  autoRotate={true}
  shadowIntensity="1"
  height="500px"
  width="100%"
  backgroundColor="#f5f5f5"
/>
```

Available props include:
- `modelPath` (required): Path to the GLB model file
- `alt`: Alternative text for accessibility
- `poster`: Path to a poster image shown while the model loads
- `cameraControls`: Enable/disable camera controls
- `autoRotate`: Enable/disable auto-rotation
- `ar`: Enable/disable AR mode (on supported devices)
- `environmentImage`: Set the environment lighting
- `exposure`: Set the exposure level
- `shadowIntensity`: Set the shadow intensity
- `shadowSoftness`: Set the shadow softness
- `fieldOfView`: Set the field of view
- `width`: Set the width of the container
- `height`: Set the height of the container
- `backgroundColor`: Set the background color

## Troubleshooting

### Vite Development Server Issues

If you encounter an error like `TypeError: crypto.hash is not a function` when starting the development server, it may be due to a compatibility issue between Vite and your Node.js version. Try the following solutions:

1. Update Node.js to the latest version
2. Downgrade Vite to a compatible version:
   ```bash
   npm install vite@4.5.0
   ```

### Model Loading Issues

If your 3D model doesn't load correctly:

1. Ensure the model is in the correct GLB format
2. Check that the path to the model is correct
3. Depending on your approach:
   - For models in the public directory: Verify the model file is in the `public/models` directory
   - For models in the src/assets directory: Verify the import path is correct and that Vite is properly configured to handle GLB files
4. Check the browser console for any errors
5. Try using a different model to determine if the issue is with the specific model file

## License

MIT
