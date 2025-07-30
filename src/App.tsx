import './App.css'
import ModelViewer from './components/ModelViewer'
import axisModel from './assets/axis.glb'

function App() {
  const modelPath = axisModel

  return (
    <>
      <header>
        <h1>3D Model Viewer</h1>
      </header>
      <main>
        <div className="model-container">
          <ModelViewer 
            modelPath={modelPath}
            camera-orbit="45deg 55deg 4m"
            touch-action="pan-y"
            alt="A 3D model of an axis coordinate system"
            cameraControls={true}
            autoRotate={false}
            shadowIntensity="1"
            height="500px"
          />
        </div>
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
          </ul>
        </div>
      </main>
    </>
  )
}

export default App
