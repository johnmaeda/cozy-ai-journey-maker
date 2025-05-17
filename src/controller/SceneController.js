import Scene from '../model/Scene';
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import LlmApiService from "../services/LlmApiService";

class SceneController {
  constructor(renderer) {
    this.renderer = renderer;
    this.scenes = [];
    this.currentIndex = 0;
    this.editMode = true;
    this.selectedFigureIndex = -1;
    
    // Initialize LlmApiService
    this.llmApiService = new LlmApiService();
    
    // Initialize UI elements
    this.ui = {
      titleInput: document.getElementById('titleInput'),
      captionInput: document.getElementById('captionInput'),
      contextInput: document.getElementById('contextInput'),
      soundInput: document.getElementById('soundInput'),
      numFiguresInput: document.getElementById('numFiguresInput'),
      emojiSelect: document.getElementById('emojiSelect'),
      figureText: document.getElementById('figureText'),
      textTypeSelect: document.getElementById('textTypeSelect'),
      sceneIndicator: document.getElementById('sceneIndicator'),
      prevButton: document.getElementById('prevButton'),
      nextButton: document.getElementById('nextButton'),
      deleteButton: document.getElementById('deleteButton'),
      modeButton: document.getElementById('modeButton'),
      exportButton: document.getElementById('exportButton'),
      storylineInput: document.getElementById('storylineInput'),
      generateButton: document.getElementById('generateButton'),
      onewordnameInput: document.getElementById('onewordname'),
      modelSwitch: document.getElementById('modelSwitch'),
    };

    // Set default storyline text
    this.ui.storylineInput.value = "A developer finds Azure AI Foundry and decides to use its Foundry Agent Service to create a multi-agent form-filler that is really easy to use.";

    // Update caption input to be single line
    this.ui.captionInput.setAttribute('inputmode', 'text');
    this.ui.captionInput.removeAttribute('rows');
    this.ui.captionInput.removeAttribute('resize');

    this.setupEventListeners();
    this.createInitialScene();
    
    // Set up export dialog
    this.setupExportDialog();
    this.setupStorylineGeneration();
    
    // ONLY add event listener for the generate button click
    this.ui.generateButton.addEventListener('click', () => {
      const storyline = this.ui.storylineInput.value;
      if (storyline) {
        this.generateStoryline();
      }
    });

    // Add event listener for onewordname input
    this.ui.onewordnameInput.addEventListener('sl-input', () => {
      if (this.selectedFigureIndex >= 0) {
        const figure = this.getCurrentScene().figures[this.selectedFigureIndex];
        figure.onewordname = this.ui.onewordnameInput.value;
        this.renderer.setScene(this.getCurrentScene());
      }
    });
    
    // Add keyboard event listeners for navigation in play mode
    document.addEventListener('keydown', (event) => {
      // Only process arrow keys in play mode
      if (!this.editMode) {
        if (event.key === 'ArrowLeft') {
          this.previousScene();
          event.preventDefault(); // Prevent default scrolling behavior
        } else if (event.key === 'ArrowRight') {
          this.nextScene();
          event.preventDefault(); // Prevent default scrolling behavior
        }
      }
    });
  }

  setupEventListeners() {
    // Scene navigation
    document.getElementById('addButton').addEventListener('click', () => this.addScene());
    this.ui.deleteButton.addEventListener('click', () => this.deleteScene());
    this.ui.prevButton.addEventListener('click', () => this.previousScene());
    this.ui.nextButton.addEventListener('click', () => this.nextScene());
    this.ui.modeButton.addEventListener('click', () => this.toggleMode());

    // Figure editing
    this.ui.emojiSelect.addEventListener('sl-input', (e) => 
      this.updateSelectedFigure({ emoji: e.target.value }));
    this.ui.figureText.addEventListener('sl-input', (e) => 
      this.updateSelectedFigureText(e.target.value));
    this.ui.textTypeSelect.addEventListener('sl-change', (e) => 
      this.updateSelectedFigureTextType(e.target.value));
    this.ui.numFiguresInput.addEventListener('sl-input', () => 
      this.updateFigureCount());

    // Scene properties
    this.ui.titleInput.addEventListener('sl-input', (e) => 
      this.updateCurrentScene({ title: e.target.value }));
    this.ui.captionInput.addEventListener('sl-input', (e) => 
      this.updateCurrentScene({ caption: e.target.value }));
    this.ui.contextInput.addEventListener('sl-input', (e) => 
      this.updateCurrentScene({ context: e.target.value }));
    this.ui.soundInput.addEventListener('sl-input', (e) => 
      this.updateCurrentScene({ sound: e.target.value }));

    // Export dialog
    this.ui.exportButton.addEventListener('click', () => {
      this.jsonTextArea.value = JSON.stringify(this.scenes, null, 2);
      this.exportDialog.style.display = 'block';
    });

    const exportPdfButton = document.getElementById('exportPdfButton');
    exportPdfButton.addEventListener('click', () => this.exportToPdf());
  }

  createInitialScene() {
    const initialScene = new Scene({
      figures: Array(parseInt(this.ui.numFiguresInput.value) || 2).fill({})
    });
    this.scenes.push(initialScene);
    this.updateUI();
  }

  getCurrentScene() {
    return this.scenes[this.currentIndex];
  }

  updateCurrentScene(updates) {
    const scene = this.getCurrentScene();
    if (!scene) return;

    Object.assign(scene, updates);
    this.renderer.setScene(scene);
  }

  updateSelectedFigure(updates) {
    if (this.selectedFigureIndex >= 0) {
      const scene = this.getCurrentScene();
      const figure = scene.figures[this.selectedFigureIndex];
      
      // Apply updates to the figure
      Object.assign(figure, updates);
      
      // Force renderer to redraw
      this.renderer.redraw();
    }
  }

  updateSelectedFigureText(text) {
    if (this.selectedFigureIndex >= 0) {
      const figure = this.getCurrentScene().figures[this.selectedFigureIndex];
      const selectedType = this.ui.textTypeSelect.value;
      
      // Remove any existing text types
      ['speak', 'display', 'thought', 'prop'].forEach(type => {
        if (figure[type]) {
          delete figure[type];
        }
      });
      
      // Set the new text type
      figure[selectedType] = text;
      
      // Force renderer to redraw
      this.renderer.redraw();
    }
  }

  updateSelectedFigureTextType(newType) {
    if (this.selectedFigureIndex === -1) return;
    
    const figure = this.getCurrentScene().figures[this.selectedFigureIndex];
    const currentText = this.ui.figureText.value;
    
    // Remove any existing text types
    ['speak', 'display', 'thought', 'prop'].forEach(type => {
        if (figure[type]) {
            delete figure[type];
        }
    });
    
    // Set the new text type
    figure[newType] = currentText;
    
    // Force renderer to redraw
    this.renderer.redraw();
  }

  updateFigureCount() {
    const newCount = parseInt(this.ui.numFiguresInput.value) || 2;
    const currentScene = this.getCurrentScene();
    
    // Store existing data
    const existingData = currentScene.figures.map(figure => {
      const newFigure = { 
        x: figure.x,
        y: figure.y,
        emoji: figure.emoji || '',
        onewordname: figure.onewordname || ''
      };
      
      ['speak', 'display', 'thought', 'prop'].forEach(type => {
        if (figure[type]) {
          newFigure[type] = figure[type];
        }
      });
      
      return newFigure;
    });
    
    currentScene.figures = [];
    
    // Update renderer margins before calculating new positions
    this.renderer.updateMarginLR(newCount);
    
    for (let i = 0; i < newCount; i++) {
      if (i < existingData.length) {
        const existingFigure = existingData[i];
        existingFigure.x = this.renderer.calculateFigureX(i, newCount);
        currentScene.figures.push(existingFigure);
      } else {
        currentScene.figures.push({
          x: this.renderer.calculateFigureX(i, newCount),
          y: this.renderer.figureDefaultY,
          emoji: '',
          speak: '',
          onewordname: ''
        });
      }
    }
    
    if (this.selectedFigureIndex >= newCount) {
      this.selectFigure(newCount - 1);
    } else if (this.selectedFigureIndex >= 0) {
      this.selectFigure(this.selectedFigureIndex);
    }
  }

  selectFigure(index) {
    this.selectedFigureIndex = index;
    this.renderer.setSelectedFigure(index);
    
    if (index >= 0 && index < this.getCurrentScene().figures.length) {
      const figure = this.getCurrentScene().figures[index];
      
      // Update UI elements
      this.ui.emojiSelect.value = figure.emoji || '';
      this.ui.onewordnameInput.value = figure.onewordname || '';
      
      const existingType = ['speak', 'display', 'thought', 'prop']
        .find(type => figure[type]);
      
      if (existingType) {
        this.ui.figureText.value = figure[existingType];
        this.ui.textTypeSelect.value = existingType;
      } else {
        const scene = this.getCurrentScene();
        const sceneType = ['sound', 'context']
          .find(type => scene[type]);
        
        if (sceneType) {
          this.ui.figureText.value = scene[sceneType];
          this.ui.textTypeSelect.value = sceneType;
        } else {
          this.ui.figureText.value = '';
          this.ui.textTypeSelect.value = 'speak';
        }
      }
    }
  }

  toggleMode() {
    this.editMode = !this.editMode;
    this.renderer.setEditMode(this.editMode);
    
    this.ui.modeButton.innerHTML = this.editMode ? 'Play Mode' : 'Edit Mode';
    
    if (!this.editMode) {
      this.selectFigure(-1);
    } else if (this.getCurrentScene().figures.length > 0) {
      this.selectFigure(0);
    }
  }

  addScene() {
    const newScene = new Scene({
      figures: Array(parseInt(this.ui.numFiguresInput.value) || 2).fill({})
    });
    
    this.scenes.splice(this.currentIndex + 1, 0, newScene);
    this.currentIndex++;
    
    this.clearInputs();
    this.updateUI();
    
    if (this.editMode) {
      this.selectFigure(0);
    }
  }

  deleteScene() {
    if (this.scenes.length <= 1) return;
    
    this.scenes.splice(this.currentIndex, 1);
    if (this.currentIndex >= this.scenes.length) {
      this.currentIndex = this.scenes.length - 1;
    }
    
    this.updateUI();
  }

  previousScene() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateUI();
    }
  }

  nextScene() {
    if (this.currentIndex < this.scenes.length - 1) {
      this.currentIndex++;
      this.updateUI();
    }
  }

  clearInputs() {
    this.ui.titleInput.value = '';
    this.ui.captionInput.value = '';
    this.ui.contextInput.value = '';
    this.ui.soundInput.value = '';
    this.ui.figureText.value = '';
  }

  updateUI() {
    const scene = this.getCurrentScene();
    if (!scene) return;

    // Update scene inputs
    this.ui.titleInput.value = scene.title || '';
    this.ui.captionInput.value = scene.caption || '';
    this.ui.contextInput.value = scene.context || '';
    this.ui.soundInput.value = scene.sound || '';
    
    // Update navigation
    this.ui.prevButton.disabled = this.currentIndex <= 0;
    this.ui.nextButton.disabled = this.currentIndex >= this.scenes.length - 1;
    this.ui.deleteButton.disabled = this.scenes.length <= 1;
    this.ui.sceneIndicator.textContent = `Scene ${this.currentIndex + 1} of ${this.scenes.length}`;
    
    // Update renderer
    this.renderer.setScene(scene);
    
    // Select first figure if in edit mode
    if (this.editMode && scene.figures.length > 0) {
      this.selectFigure(0);
    }
  }

  setupExportDialog() {
    // Create dialog elements
    const exportDialog = document.createElement('div');
    exportDialog.style.display = 'none';
    exportDialog.style.position = 'fixed';
    exportDialog.style.top = '50%';
    exportDialog.style.left = '50%';
    exportDialog.style.transform = 'translate(-50%, -50%)';
    exportDialog.style.backgroundColor = 'white';
    exportDialog.style.padding = '20px';
    exportDialog.style.border = '1px solid black';
    exportDialog.style.zIndex = '1000';

    const jsonTextArea = document.createElement('textarea');
    jsonTextArea.style.width = '500px';
    jsonTextArea.style.height = '300px';
    exportDialog.appendChild(jsonTextArea);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '10px';
    buttonContainer.style.textAlign = 'right';

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';

    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(cancelButton);
    exportDialog.appendChild(buttonContainer);
    document.body.appendChild(exportDialog);

    // Store dialog elements
    this.exportDialog = exportDialog;
    this.jsonTextArea = jsonTextArea;

    // Add event listeners
    saveButton.addEventListener('click', () => {
      try {
        const newScenes = JSON.parse(this.jsonTextArea.value);
        this.importScenes(newScenes);
        this.exportDialog.style.display = 'none';
      } catch (e) {
        console.error('Invalid JSON:', e);
        alert('Invalid JSON format');
      }
    });

    cancelButton.addEventListener('click', () => {
      this.exportDialog.style.display = 'none';
    });
  }

  importScenes(newScenes) {
    this.scenes = newScenes;
    this.currentIndex = 0;
    this.updateUI();
  }

  setupStorylineGeneration() {
    // Define Zod schema
    const TextContent = z.object({
      type: z.enum(['speak', 'thought', 'display', 'prop']),
      content: z.string()
    });

    const FigureSchema = z.object({
      emoji: z.string(),
      onewordname: z.string().optional(),
      text: TextContent
    });

    const SceneSchema = z.object({
      title: z.string().optional(),
      caption: z.string(),
      context: z.string().optional(),
      sound: z.string().optional(),
      figures: z.array(FigureSchema)
    });

    // Wrap the array in a root object
    this.StorySchema = z.object({
      scenes: z.array(SceneSchema)
    });

    // Set up settings dialog handlers
    const settingsButton = document.querySelector('#settingsButton');
    const settingsDialog = document.querySelector('#settingsDialog');
    const apiKeyInput = document.querySelector('#apiKeyInput');
    const saveSettingsButton = document.querySelector('#saveSettingsButton');
    const apiProviderRadio = document.querySelector('#apiProviderRadio');
    const openaiSettings = document.querySelector('#openaiSettings');
    const azureSettings = document.querySelector('#azureSettings');
    const azureApiKeyInput = document.querySelector('#azureApiKeyInput');
    const azureEndpointInput = document.querySelector('#azureEndpointInput');

    if (!settingsButton || !settingsDialog || !apiKeyInput || !saveSettingsButton) {
      console.error('Settings elements not found');
      return;
    }

    // Toggle settings visibility based on provider selection
    apiProviderRadio.addEventListener('sl-change', (event) => {
      console.log('Provider changed:', event.target.value);
      const provider = event.target.value;
      if (provider === 'openai') {
        openaiSettings.style.display = 'block';
        azureSettings.style.display = 'none';
        console.log('Showing OpenAI settings');
      } else if (provider === 'azure') {
        openaiSettings.style.display = 'none';
        azureSettings.style.display = 'block';
        console.log('Showing Azure settings');
      }
    });

    // Show stored API key if it exists
    const apiKey = localStorage.getItem('openai_api_key');
    if (apiKey) {
      apiKeyInput.value = apiKey;
      this.initializeOpenAI(apiKey);
    }
    
    // Show stored Azure OpenAI settings if they exist
    const azureApiKey = localStorage.getItem('azure_openai_api_key');
    const azureEndpoint = localStorage.getItem('azure_openai_endpoint');
    if (azureApiKey) {
      azureApiKeyInput.value = azureApiKey;
    }
    if (azureEndpoint) {
      azureEndpointInput.value = azureEndpoint;
    }
    
    // Set the provider preference if it was saved previously
    const savedProvider = localStorage.getItem('api_provider');
    if (savedProvider) {
      apiProviderRadio.value = savedProvider;
      // Manually trigger the change event to update UI visibility
      const event = new CustomEvent('sl-change', { 
        detail: { value: savedProvider }
      });
      apiProviderRadio.dispatchEvent(event);
      
      // Configure LlmApiService with saved settings
      if (savedProvider === 'openai' && apiKey) {
        this.llmApiService.saveApiConfig('OpenAI', apiKey);
      } else if (savedProvider === 'azure' && azureApiKey && azureEndpoint) {
        this.llmApiService.saveApiConfig('Azure OpenAI', azureApiKey, azureEndpoint);
      }
    } else {
      // Default to Azure if no preference was saved
      apiProviderRadio.value = 'azure';
      openaiSettings.style.display = 'none';
      azureSettings.style.display = 'block';
    }

    settingsButton.addEventListener('click', () => {
      const currentProvider = apiProviderRadio.value;
      console.log('Opening settings, current provider:', currentProvider);
      
      // Force update display based on current provider
      if (currentProvider === 'openai') {
        openaiSettings.style.display = 'block';
        azureSettings.style.display = 'none';
      } else if (currentProvider === 'azure') {
        openaiSettings.style.display = 'none';
        azureSettings.style.display = 'block';
      }
      
      settingsDialog.show();
    });

    // Handle dialog closing properly
    settingsDialog.addEventListener('sl-request-close', (event) => {
      // Prevent the default close behavior
      event.preventDefault();
      // Remove focus from any buttons before closing
      document.activeElement?.blur();
      // Close the dialog
      settingsDialog.hide();
    });

    saveSettingsButton.addEventListener('click', () => {
      const provider = apiProviderRadio.value;
      
      // Save the selected provider
      localStorage.setItem('api_provider', provider);
      
      if (provider === 'openai') {
        const newApiKey = apiKeyInput.value.trim();
        if (newApiKey) {
          localStorage.setItem('openai_api_key', newApiKey);
          this.initializeOpenAI(newApiKey);
          // Save to LlmApiService as well
          this.llmApiService.saveApiConfig('OpenAI', newApiKey);
          // Remove focus before closing
          document.activeElement?.blur();
          settingsDialog.hide();
        } else {
          alert('Please enter a valid API key');
        }
      } else if (provider === 'azure') {
        const azureApiKey = azureApiKeyInput.value.trim();
        const azureEndpoint = azureEndpointInput.value.trim();
        
        if (azureApiKey && azureEndpoint) {
          localStorage.setItem('azure_openai_api_key', azureApiKey);
          localStorage.setItem('azure_openai_endpoint', azureEndpoint);
          // Save to LlmApiService
          this.llmApiService.saveApiConfig('Azure OpenAI', azureApiKey, azureEndpoint);
          document.activeElement?.blur();
          settingsDialog.hide();
        } else {
          alert('Please enter both a valid Azure API key and endpoint');
        }
      }
    });
  }

  initializeOpenAI(apiKey) {
    // Keep the original OpenAI SDK initialization for backward compatibility
    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
    
    // If we're using Azure, this gets handled through the llmApiService
    // which is configured from localStorage settings
  }

  async generateStoryline() {
    // Check for API configuration
    const apiInfo = this.llmApiService.getApiInfo();
    const provider = apiInfo.provider;
    
    if (!apiInfo.apiKey || (provider === 'Azure OpenAI' && !apiInfo.endpoint)) {
      alert(`Please set your ${provider} configuration in Settings first`);
      document.getElementById('settingsDialog').show();
      return;
    }
    
    const storyline = this.ui.storylineInput.value;
    const spinner = document.getElementById('generateSpinner');
    const generateButton = this.ui.generateButton;
    const storyLength = document.querySelector('sl-radio-group[name="storyLength"]').value;
    const useEnhancedModel = this.ui.modelSwitch.checked;
    // Map radio values to scene ranges
    const lengthRanges = {
      short: "1-3",
      medium: "4-6",
      long: "7-12"
    };

    const prompt1 = `// Comic Strip Generator Prompt

/*
Create ${lengthRanges[storyLength]} sequential scenes that tell a complete story. Each scene should include:
- Title and caption
- Figures that advance the narrative through dialogue/actions/thoughts
- Clear emotional progression
*/

// Figure Schema:
{
  "emoji": string,  // Required: Use face/person emoji for characters, device emoji for displays
  "text": {
    "type": string,  // "speak" | "thought" | "display" | "prop"
    "content": string
  },
  "onewordname": string  // Optional
}

// Scene Schema:
{
  "scenes": [
    {
      "title": string,
      "caption": string,
      "figures": Figure[]  // Figures ordered left to right
    }
  ]
}

// STRICT CHARACTER EMOJI RULES:
// If text.type is "speak" or "thought":
// - Emoji MUST start with a face/head
// - MUST be one of: 😀-😶 or 👩/👨 variants
// - Any skin tone variation is allowed
// - Will REJECT: 👔 👕 👗 👋 💪 🦶 🏃‍♂️ 💃 💼 📱 🎭

// For other types:
// - Display type: MUST be 📱 💻 or 📺 and only if it makes sense in the scene when looking at a screen
// - Prop type: Any object emoji allowed. Only introduce a prop if it makes sense in the scene.

// Notes:
// - 'speak' is a character's dialogue
// - 'thought' is a character's internal monologue
// - 'display' is what appears on a screen or device
// - 'prop' is an object or item in the scene with a onewordname and explanation. don't use more than one.
// - If there is a prop or display with more than one character then ordinally put it between the two figures in order.`;
    const prompt2 = `You are a storyteller AI that must output valid JSON according to the schemas and rules below.

SCHEMA & FORMAT RULES

Output Format (Root Object): { "scenes": [ { "title": string, "caption": string, "figures": Figure[] }, ... ] }

Figure Object Structure: { "emoji": string, // REQUIRED "text": { "type": string, // one of "speak", "thought", "display", or "prop" "content": string // short text for the figure's dialogue/thought/display/prop }, "onewordname": string // OPTIONAL (e.g., "Alex", "Car") }

SCENE CREATION GUIDELINES

Create exactly ${lengthRanges[storyLength]} sequential scenes that form a short, complete story.

Each scene must have:

A "title": short phrase summarizing the scene.
A "caption": one or two sentences giving context or setting.
A "figures" array with one or more figures that advance the narrative.
For each figure:

"emoji": Must be a valid emoji that fits the "text.type":
If "text.type" = "speak" or "thought":
The emoji MUST be a face/head (e.g., 😃, 🙁, 😶) or a person silhouette (e.g., 👩, 👨, including skin-tone variants).
Prohibited for characters: torso/body or clothing emojis (like 👔, 👗, etc.).
If "text.type" = "display":
The emoji MUST be one of 📱, 💻, or 📺.
If "text.type" = "prop":
The emoji can be any object (e.g., 🚗, ☕, 🗝, 🌳).
"text.content":
If "text.type" = "speak": dialogue that the character says aloud.
If "text.type" = "thought": internal monologue (unspoken).
If "text.type" = "display": content visible on a device/screen.
If "text.type" = "prop": short explanation of the object.
Do not repeat the same character in a single scene.

A "character" is considered repeated if they have the same "onewordname" or the same face/head emoji.
If the same person needs to speak and think in the same scene, merge both lines into one text (or choose only one text type).
Do not use more than one prop or display in any single scene.

If there is a prop or display and multiple characters in the same scene, place the prop/display between the two characters in the "figures" array (left to right).

Keep each figure's "text.content" concise (a sentence or two at most).

End your response with valid JSON only. No extra commentary, code fences, or explanations.

EXAMPLE (Illustrative Purposes Only; your output must follow the same structure): { "scenes": [ { "title": "Scene Title", "caption": "Scene caption here.", "figures": [ { "emoji": "😃", "text": { "type": "speak", "content": "Hello, I'm a friendly character." }, "onewordname": "Bob" }, { "emoji": "💻", "text": { "type": "display", "content": "Information on the screen." } } ] } ] }

INSTRUCTIONS

Generate the final answer as valid JSON (no code fences or extra text). Follow the above schema and rules strictly. If you need a specific number of scenes, replace ${lengthRanges[storyLength]} with a fixed number (e.g., 5).`;

const prompt3 = `You are a storyteller AI that must output valid JSON according to the schema and format rules below. Your output should look similar to the example at the end, which illustrates a multi-scene user journey involving software.

SCHEMA & FORMAT RULES

Output Format (Root Object): { "scenes": [ { "title": string, "caption": string, "figures": Figure[] }, ... ] }

Figure Object Structure: { "emoji": string, // REQUIRED "name": string, // OPTIONAL "speak": string, // OPTIONAL "display": string // OPTIONAL }

SCENE CREATION GUIDELINES

Create exactly ${lengthRanges[storyLength]} sequential scenes that form a short, complete story.

Each "scene" in the "scenes" array is an object with:

"title": a short phrase summarizing the scene.
"caption": one or two sentences giving context or setting.
"figures": an array of figure objects.
Each figure has:

"emoji": must be a valid emoji that fits the "speak"/"display" usage:
If the figure is speaking (has a "speak" field): use a face/head emoji (e.g., 😃, 🙁, 🤔) or a person emoji (e.g., 🧑, 👩‍💻, etc.).
If the figure is displaying content (has a "display" field): use either 📱 (for on-the-go/mobile) or 💻 (for desktop/laptop).
You can use other emojis (like 🚗, ☕, etc.) for props if needed, although the example below does not showcase prop usage.
"name": optional one-word or short name/role (e.g., "Alex", "MS PM").
"speak": short text (a sentence or two) that the character says aloud.
"display": short text (a sentence or two) describing the content on the device's screen.
Scenes should form a short, coherent story about interacting with or building software, typically showing or referencing an on-screen display (💻 or 📱) in most scenes.

Keep each figure's text concise.

You may show the same figure multiple times within one scene if needed (for instance, if the same person has multiple lines of dialogue or actions).

End your response with valid JSON only (no code fences or extra commentary).

EXAMPLE (for illustration only; your output should follow this structure and style):

[ { "figures": [ { "emoji": "😡", "name": "Fleet Manager", "speak": "Why can't this app solve my problems like the AI in other apps?" }, { "emoji": "💻", "display": "EV Feedback Forum: 1100 upvotes on your post!" } ], "caption": "A frustrated fleet manager posts to the EV feedback forum." }, { "figures": [ { "emoji": "🤔", "name": "Foundry EV PM", "speak": "This top feedback item looks doable. It'd be good to try working on this." }, { "emoji": "💻", "display": "Top Feedback: 'Enable easier AI deployment for developers.'" } ], "caption": "A Foundry EV PM notices the top feedback item in their task list and considers working on it." }, { "figures": [ { "emoji": "🧑", "name": "MS Sales", "speak": "We at Microsoft AI Foundry can help!" }, { "emoji": "🧑‍💻", "name": "MS PM", "speak": "Let's see how we can support the Foundry Ev PM and devs with this task." } ], "caption": "Foundry to the rescue!" }, { "figures": [ { "emoji": "🧑‍💻", "name": "MS PM", "speak": "This could be the perfect solution for our developer customer." }, { "emoji": "💻", "display": "Azure AI Foundry Portal: 'Try @Foundry to help create AI models!'" }, { "emoji": "🤖", "name": "@foundry", "speak": "Ready to assist with AI creation." } ], "caption": "The PMs visit the Azure AI Foundry portal and see a banner promoting @Foundry for creating AI." }, { "figures": [ { "emoji": "🧑‍💻", "name": "MS PM", "speak": "Let's connect the new AI Agents to the data sources and set up the Weather Key." }, { "emoji": "💻", "display": "Weather Key entered successfully. AI Agent connected to weather data." } ], "caption": "The user configures the AI Agent with the Weather Key and hooks it to weather data." }, { "figures": [ { "emoji": "🧑‍💻", "name": "MS PM", "speak": "Now, let's point the AI Agent to the SharePoint list containing public customer service policies." }, { "emoji": "💻", "display": "AI Agent connected to SP List: Public Customer Service Policies." } ], "caption": "The user connects the AI Agent to the SharePoint list for customer service policies." }, { "figures": [ { "emoji": "🧑‍💻", "name": "MS PM", "speak": "Finally, let's connect the AI Agent to Fabric to access accessory inventory and warehouse location information." }, { "emoji": "💻", "display": "AI Agent connected to Fabric: Accessory Inventory and Warehouse Locations." } ], "caption": "The user connects the AI Agent to Fabric for inventory and warehouse information." }, { "figures": [ { "emoji": "🧑‍💻", "name": "MS PM", "speak": "I want to use the multiple agents in the Fleet Management Template to help users get real work done." }, { "emoji": "💻", "display": "Fleet Management Template:\n - Includes multiple AI Agents to assist in processes like task allocation, scheduling, and reporting." } ], "caption": "The developer explores the agents in the Fleet Management Template as part of the Foundry Workforce." }, { "figures": [ { "emoji": "🧑‍💻", "name": "MS PM", "speak": "This process is similar to what I need. Let's 'Save as / Copy' and make some edits." }, { "emoji": "💻", "display": "Process copied. Open in Visual Designer to customize as needed." } ], "caption": "The developer identifies a process and uses 'Save as / Copy' to begin customizing it." }, { "figures": [ { "emoji": "🧑‍💻", "name": "MS PM", "speak": "I'll tweak the workflow and make adjustments to match my requirements." }, { "emoji": "💻", "display": "Visual Designer:\n- Drag-and-drop tools for editing workflows.\n- Current steps: Task Allocation -> Inventory Check -> Report Generation." } ], "caption": "The developer uses the Visual Designer to edit the process and tailor it to their needs." }, { "figures": [ { "emoji": "🧑‍💻", "name": "MS PM", "speak": "Let's ensure everything is secure. It's great that many items come pre-configured out-of-the-box." }, { "emoji": "💻", "display": "Security Setup:\n- OOB Configurations Applied:\n - Access Control\n - Data Encryption\n - API Authentication\n- Custom Setup Options Available." } ], "caption": "The developer configures security settings, leveraging many out-of-the-box configurations." }, { "figures": [ { "emoji": "🧑‍💻", "name": "MS PM", "speak": "I can now see metrics across all AI products and resources in one place!" }, { "emoji": "💻", "name": "MS PM", "display": "Metrics Dashboard:\n- Microsoft AI Products\n- Fabric Integrations\n- CPS Utilization\n- GPU Performance\n- Real-time Monitoring: Security Status -> 100% Secure." } ], "caption": "The developer accesses a comprehensive dashboard to review metrics across AI products and resources." }, { "figures": [ { "emoji": "🧑‍💻", "name": "MS PM", "speak": "I've finalized the changes in Foundry Canvas. Let's push them to GitHub." }, { "emoji": "💻", "speak": "Foundry Canvas:\n- Changes Prepared for Push\n- GitHub PR Integration Available." } ], "caption": "The developer finalizes changes in Foundry Canvas and prepares to push to GitHub." }, { "figures": [ { "emoji": "🧑‍💻", "name": "MS PM", "speak": "I'll review the pull request in GitHub and verify the changes." }, { "emoji": "💻", "speak": "GitHub:\n- PR: feature/ai-agent-update\n- Files Changed: 12\n- Ready for Merge." } ], "caption": "The developer reviews the pull request in GitHub for the changes pushed from Foundry Canvas." }, { "figures": [ { "emoji": "🧑‍💻", "name": "MS PM", "speak": "Let's open VS Code to refine the code further and ensure the Kernel runs smoothly." }, { "emoji": "💻", "speak": "VS Code:\n- Branch: feature/ai-agent-update\n- Connected to GitHub Repository\n- Kernel Ready for Execution." } ], "caption": "The developer switches to VS Code to refine and test the Kernel code." }, { "figures": [ { "emoji": "🧑‍💻", "name": "MS PM", "speak": "Running the Kernel now to ensure it points to the agents and tools correctly." }, { "emoji": "💻", "speak": "Kernel Running:\n- AI Agents Connected\n- Tools Initialized\n- Workflows Operational." } ], "caption": "The developer runs the Kernel to connect agents, tools, and workflows, completing the process." }, { "figures": [ { "emoji": "🧑‍💻", "name": "MS PM", "speak": "Let's use Canvas to set up pipelines for Dev, UAT, and Prod environments." }, { "emoji": "💻", "speak": "Pipeline Builder in Canvas:\n- Dev Pipeline: Configured\n- UAT Pipeline: Configured\n- Prod Pipeline: Configured\n- Status: All pipelines ready for deployment." } ], "caption": "The developer uses Foundry Canvas to create and configure pipelines for all environments." }, { "figures": [ { "emoji": "🧑‍💻", "name": "MS PM", "speak": "I can finalize and refine the code in VS Code without leaving the Foundry environment." }, { "emoji": "💻", "speak": "VS Code:\n- Connected to Foundry Canvas\n- Pipeline Scripts Ready for Final Review\n- Integration with Deployment Tools Active." } ], "caption": "The developer finalizes their work in VS Code while seamlessly integrated with Foundry Canvas." }, { "figures": [ { "emoji": "👨‍💻", "name": "MS PM", "speak": "The new Fleet app makes it easy to manage vehicles with this AI Agent!" }, { "emoji": "💻", "speak": "Fleet App:\n- Agent: Proactively manages maintenance schedules, weather alerts, and inventory.\n- Task Completed: Winter tire replacements scheduled for the fleet." } ], "caption": "A user interacts with the Fleet app, leveraging the new AI Agent to manage fleet operations efficiently." }, { "figures": [ { "emoji": "👨‍💻", "name": "MS PM", "speak": "This AI Agent is now helping me in M365 to organize team tasks and reports!" }, { "emoji": "💻", "speak": "M365 Integration:\n- AI Agent:\n - Automates report generation.\n - Assigns tasks based on team schedules.\n - Tracks task completion in real-time." } ], "caption": "The same AI Agent is reused in M365 to enhance productivity, helping users manage tasks and reports effectively." } ]

INSTRUCTIONS

Read the schema and format rules carefully.
Create a coherent story in multiple scenes (similar to the example) about someone building or using software, typically featuring a display device (💻 or 📱) in most scenes.
Each scene has a short title/caption and an array of figures with either "speak" or "display" content.
Ensure the final answer is valid JSON and do not include any extra text or commentary.

`;
    if (!storyline) {
      alert('Please enter a storyline description');
      return;
    }

    // Show spinner and disable button
    spinner.style.display = 'inline-block';
    generateButton.disabled = true;

    try {
      // Use LlmApiService for API calls
      const systemMessage = { role: "system", content: prompt3 };
      const userMessage = { role: "user", content: `Generate a multi-scene comic strip storyline based on this description: ${storyline}` };
      
      // Determine model based on provider and switch setting
      const modelOptions = {
        model: useEnhancedModel ? "gpt-4.1" : "gpt-4.1-mini",
        deploymentName: useEnhancedModel ? "gpt-4.1" : "gpt-4.1-mini",
        max_tokens: 2000,
        temperature: 0.7
      };
      
      // Call the LLM API through our service
      const jsonResponse = await this.llmApiService.makeApiCall(
        [systemMessage, userMessage],
        modelOptions
      );
      
      try {
        // Parse JSON response
        const responseData = JSON.parse(jsonResponse);
        
        if (!responseData.scenes) {
          throw new Error("Response doesn't contain scenes array");
        }
        
        // Transform the data to match our expected format
        const validatedScenes = responseData.scenes.map(scene => {
          const transformedScene = {
            title: scene.title || '',
            caption: scene.caption || '',
            figures: []
          };
          
          transformedScene.figures = scene.figures.map(figure => {
            const transformedFigure = {
              emoji: figure.emoji || ''
            };
            
            if (figure.onewordname || figure.name) {
              transformedFigure.onewordname = figure.onewordname || figure.name;
            }
            
            // Handle different text types (speak, thought, display, prop)
            if (figure.speak) {
              transformedFigure.speak = figure.speak;
            } else if (figure.thought) {
              transformedFigure.thought = figure.thought;
            } else if (figure.display) {
              transformedFigure.display = figure.display;
            } else if (figure.prop) {
              transformedFigure.prop = figure.prop;
            } else if (figure.text) {
              // Handle the schema format where text is an object with type and content
              transformedFigure[figure.text.type] = figure.text.content;
            }
            
            return transformedFigure;
          });
          
          return transformedScene;
        });
        
        this.importScenes(validatedScenes);
      } catch (parseError) {
        console.error('Error parsing LLM response:', parseError);
        alert('Error parsing the response from the language model. Please try again.');
      }
    } catch (error) {
      console.error('Error generating storyline:', error);
      alert(`Error generating storyline: ${error.message}`);
    } finally {
      // Hide spinner and re-enable button
      spinner.style.display = 'none';
      generateButton.disabled = false;
    }
  }

  async exportToPdf() {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [this.renderer.p.width, this.renderer.p.height]
    });

    // Store current scene index and edit mode
    const currentIdx = this.currentIndex;
    const wasEditMode = this.editMode;
    
    // Temporarily disable edit mode
    if (wasEditMode) {
      this.toggleMode();
    }

    // Iterate through all scenes
    for (let i = 0; i < this.scenes.length; i++) {
      // Set current scene
      this.currentIndex = i;
      this.updateUI();
      
      // Force a redraw and wait for it
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Capture the scene
      const imageData = this.renderer.captureSceneImage();
      
      // Add new page if not first page
      if (i > 0) {
        pdf.addPage();
      }
      
      // Add image to PDF
      pdf.addImage(
        imageData, 
        'PNG', 
        0, 
        0, 
        this.renderer.p.width, 
        this.renderer.p.height
      );
    }

    // Restore original scene and edit mode
    this.currentIndex = currentIdx;
    if (wasEditMode) {
      this.toggleMode();
    }
    this.updateUI();

    // Save the PDF
    pdf.save('story.pdf');
  }
}

export default SceneController; 