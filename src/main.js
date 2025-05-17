import '@shoelace-style/shoelace/dist/themes/light.css';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path';
import p5 from 'p5';

// Import our components
import Scene from './model/Scene';
import SceneRenderer from './renderer/SceneRenderer';
import SceneController from './controller/SceneController';

// Set up Shoelace
setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/dist/');

// Import Shoelace components
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/button-group/button-group.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/details/details.js';
import '@shoelace-style/shoelace/dist/components/radio-group/radio-group.js';
import '@shoelace-style/shoelace/dist/components/radio-button/radio-button.js';
import '@shoelace-style/shoelace/dist/components/radio/radio.js';
import '@shoelace-style/shoelace/dist/components/switch/switch.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';

// Import styles
import './style.css';

// Initialize the application
new p5((p) => {
  let renderer;
  let controller;

  p.setup = () => {
    // Create canvas and add to container
    const canvas = p.createCanvas(640, 480);
    canvas.parent('canvasContainer');
    
    // Initialize renderer
    renderer = new SceneRenderer(p);
    
    // Initialize controller with renderer
    controller = new SceneController(renderer);
    
    // Handle canvas clicks for figure selection
    canvas.mousePressed(() => {
      if (controller.editMode) {
        const figureIndex = renderer.handleClick(p.mouseX, p.mouseY);
        if (figureIndex !== null) {
          controller.selectFigure(figureIndex);
        }
      }
    });
  };

  p.draw = () => {
    renderer.draw();
  };
});

// Export for potential use in other modules
export { Scene };
