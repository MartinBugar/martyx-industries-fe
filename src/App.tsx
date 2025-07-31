import './App.css'
import ModelViewer from './components/ModelViewer'
import axisModel from './assets/axis.glb'
import { useState } from 'react'

function App() {
  const modelPath = axisModel
  const [isFullscreen, setIsFullscreen] = useState(true)

  // This function is just to demonstrate how you could control fullscreen from outside the component
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <>
      {!isFullscreen && (
        <header>
          <h1>3D Model Viewer</h1>
        </header>
      )}
      <main>
        <div className="model-container">
          <ModelViewer 
            modelPath={modelPath}
            poster="poster.webp"
            camera-orbit="225deg 55deg 4m"
            touch-action="pan-y"
            alt="A 3D model of an axis coordinate system"
            cameraControls={true}
            autoRotate={false}
            interaction-prompt="none"
            shadowIntensity="1.38"
            exposure={0.42}
            environment-image="legacy"
            shadow-softness="1"
            toneMapping="neutral"
            metallicFactor={3}
            height="500px"
            fullscreen={isFullscreen}
          />
        </div>
        {!isFullscreen && (
          <div className="controls">
            <h2>Model Controls</h2>
            <p>
              This is a simple 3D model viewer using Google's &lt;model-viewer&gt; web component.
              You can interact with the model by:
            </p>
            <ul>
              <li>Click and drag to rotate the model</li>
              <li>Scroll to zoom in and out</li>
              <li>Right-click and drag to pan</li>
              <li>Use the Fullscreen button to view the model in fullscreen mode</li>
              <li>Press ESC to exit fullscreen mode</li>
            </ul>
            <button 
              onClick={toggleFullscreen}
              style={{
                padding: '8px 16px',
                backgroundColor: '#213547',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Toggle Fullscreen
            </button>
          </div>
        )}
      </main>
    </>
  )
}

export default App
