import p5 from 'p5';

new p5((p) => {
  // Global variables scoped to the p5 instance
  let scenes = [];
  let currentSceneIndex = 0;
  let editMode = true;
  let figureDefaultY;
  let marginLR;
  let selectedFigure = 0;
  let lastSelectedFigure = -1;
  
  // DOM element references
  let titleInput, textTypeSelect, addButton, deleteButton;
  let prevButton, sceneIndicator, nextButton, modeButton;
  let numFiguresInput, emojiSelect, figureText;
  let captionInput, contextInput, soundInput;
  let exportButton, storylineInput, generateButton;

  const faceEmojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
    // ... (rest of the emoji array)
  ];
  let highBubbleOffset = 20;  
  let lowBubbleOffset = 10;   
  let bubbleTextSize = 16;    
  let bubbleLineHeight = bubbleTextSize * 1.6;  
  let bubblePadding = 10;     
  let verticalSpacing = 40;   

  function isFaceEmoji(emoji) {
    if (!emoji || typeof emoji !== 'string') return false;
    return faceEmojis.includes(emoji);
  }

  p.setup = () => {
    const canvas = p.createCanvas(640, 480);
    canvas.parent('canvasContainer');
    
    // set the default y position for the figures
    figureDefaultY = p.int(p.height * 0.5);
    marginLR = p.int(p.width * 0.3);

    // Access HTML elements
    titleInput = document.getElementById('titleInput');
    textTypeSelect = document.getElementById('textTypeSelect');
    addButton = document.getElementById('addButton');
    deleteButton = document.getElementById('deleteButton');
    prevButton = document.getElementById('prevButton');
    sceneIndicator = document.getElementById('sceneIndicator');
    nextButton = document.getElementById('nextButton');
    modeButton = document.getElementById('modeButton');
    numFiguresInput = document.getElementById('numFiguresInput');
    emojiSelect = document.getElementById('emojiSelect');
    figureText = document.getElementById('figureText');
    captionInput = document.getElementById('captionInput');
    contextInput = document.getElementById('contextInput');
    soundInput = document.getElementById('soundInput');
    exportButton = document.getElementById('exportButton');
    storylineInput = document.getElementById('storylineInput');
    generateButton = document.getElementById('generateButton');

    // Add event listeners for scene navigation buttons
    addButton.addEventListener('click', () => {
      const numFigures = parseInt(numFiguresInput.value) || 2;
      const newScene = {
        title: '',
        figures: [],
        caption: '',
        sound: '',
        context: ''
      };

      updateMarginLR(numFigures);
      for (let i = 0; i < numFigures; i++) {
        newScene.figures.push({
          x: calculateFigureX(i, numFigures),
          y: figureDefaultY,
          emoji: '',
          speak: '',
          onewordname: ''
        });
      }

      scenes.splice(currentSceneIndex + 1, 0, newScene);
      currentSceneIndex++;
      
      // Clear inputs
      titleInput.value = '';
      captionInput.value = '';
      contextInput.value = '';
      soundInput.value = '';
      figureText.value = '';
      
      // Update UI
      updateSceneIndicator();
      updateButtonStyles();
      
      // Select first figure in new scene
      if (editMode) {
        selectFigure(0);
      }
      
      // Force redraw
      p.redraw();
    });
    deleteButton.addEventListener('click', () => deleteScene());
    prevButton.addEventListener('click', () => prevScene());
    nextButton.addEventListener('click', () => nextScene());
    modeButton.addEventListener('click', () => toggleMode());
    exportButton.addEventListener('click', () => exportScenes());

    // Add event listener for emoji input
    emojiSelect.addEventListener('sl-input', (e) => {
      if (selectedFigure >= 0 && selectedFigure < scenes[currentSceneIndex].figures.length) {
        scenes[currentSceneIndex].figures[selectedFigure].emoji = e.target.value;
        // Force a p5.js redraw to show the updated emoji
        p.redraw();
      }
    });

    // Add event listener for figureText
    figureText.addEventListener('sl-input', (e) => {
      if (selectedFigure >= 0 && selectedFigure < scenes[currentSceneIndex].figures.length) {
        const figure = scenes[currentSceneIndex].figures[selectedFigure];
        const selectedType = textTypeSelect.value;
        
        // Remove any existing text types from the figure
        ['speak', 'display', 'thought', 'prop'].forEach(type => {
          if (figure[type]) {
            delete figure[type];
          }
        });
        
        // Set the new text type
        figure[selectedType] = e.target.value;
      }
    });

    // Add event listener for textTypeSelect
    textTypeSelect.addEventListener('sl-change', (e) => {
      if (selectedFigure >= 0 && selectedFigure < scenes[currentSceneIndex].figures.length) {
        const figure = scenes[currentSceneIndex].figures[selectedFigure];
        const selectedType = e.target.value;
        const currentText = figureText.value || '';
        
        ['speak', 'context', 'sound', 'display', 'thought', 'prop'].forEach(type => {
          if (figure[type]) {
            delete figure[type];
          }
        });
        
        figure[selectedType] = currentText;
        selectFigure(selectedFigure);
      }
    });

    // Add event listener for numFiguresInput
    numFiguresInput.addEventListener('sl-input', (e) => {
      updateFigureCount();
    });

    // Add event listeners for title and caption inputs
    titleInput.addEventListener('sl-input', (e) => {
      scenes[currentSceneIndex].title = e.target.value;
    });

    captionInput.addEventListener('sl-input', (e) => {
      scenes[currentSceneIndex].caption = e.target.value;
    });

    contextInput.addEventListener('sl-input', (e) => {
      scenes[currentSceneIndex].context = e.target.value;
    });

    soundInput.addEventListener('sl-input', (e) => {
      scenes[currentSceneIndex].sound = e.target.value;
    });

    // Add event listener for onewordname input
    const onewordnameInput = document.getElementById('onewordname');
    onewordnameInput.addEventListener('sl-input', (e) => {
      if (selectedFigure >= 0 && selectedFigure < scenes[currentSceneIndex].figures.length) {
        scenes[currentSceneIndex].figures[selectedFigure].onewordname = e.target.value;
        p.redraw();
      }
    });

    // Initialize the first scene with default number of figures
    const initialFigureCount = parseInt(numFiguresInput.value) || 2;
    const initialScene = {
      figures: [],
      caption: '',
      title: '',
      sound: '',
      context: ''
    };

    updateMarginLR(initialFigureCount);
    for (let i = 0; i < initialFigureCount; i++) {
      initialScene.figures.push({
        x: calculateFigureX(i, initialFigureCount),
        y: figureDefaultY,
        emoji: '',
        speak: '',
        onewordname: ''
      });
    }

    scenes.push(initialScene);
    updateSceneIndicator();
    updateButtonStyles();

    // Add this to your setup function after creating the canvas
    document.addEventListener('click', handleDocumentClick);

    // Initialize the first figure selection and UI
    if (editMode && initialScene.figures.length > 0) {
      selectedFigure = 0;
      const figure = initialScene.figures[0];
      
      // Initialize Shoelace components with the first figure's data
      emojiSelect.value = figure.emoji || '';
      figureText.value = figure.speak || '';
      textTypeSelect.value = 'speak';
    }

    setupExportDialog();
  };

  p.draw = () => {
    p.background(220);
    if (scenes.length === 0) return;

    const currentScene = scenes[currentSceneIndex];
    if (!currentScene) return;

    // Draw title
    p.textSize(20);
    p.textAlign(p.CENTER, p.TOP);
    p.fill(0);
    p.text(currentScene.title || '-', p.width / 2, 10);

    // Draw sound if it exists
    if (currentScene.sound) {
      p.textSize(14);
      p.textAlign(p.RIGHT, p.TOP);
      p.fill(100);
      p.text('🔊 ' + currentScene.sound, p.width - 10, 40);
    }

    // Draw figures and their text
    if (currentScene.figures) {
      const standardBubbleWidth = calculateStandardBubbleWidth();
      currentScene.figures.forEach((figure, i) => {
        const x = calculateFigureX(i, currentScene.figures.length);
        drawFigureText(x, figureDefaultY, figure, standardBubbleWidth, i);
        drawFigure(x, figureDefaultY, figure);
      });
    }

    // Draw caption at bottom
    p.textSize(12);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.fill(0);
    const margin = 50;
    p.text(currentScene.caption || '-', margin, p.height - 30, p.width - margin * 2);

    if (editMode && selectedFigure === -1 && currentScene.figures.length > 0) {
      selectFigure(0);
    }
  };

  function drawFigure(x, y, figure) {
    p.push();
    
    // Get the current figure to check its type
    const isDisplayOrProp = figure && (figure.display || figure.prop);
    
    // Draw selection box if selected and in edit mode
    if (editMode && figure === scenes[currentSceneIndex].figures[selectedFigure]) {
      p.noFill();
      p.stroke(135, 206, 235);  // Light blue color
      p.strokeWeight(2);
      p.rectMode(p.CENTER);
      p.rect(x, y + 35, 50, 120, 5);
    }
    
    if (isDisplayOrProp) {
      // For display or prop types, only show emoji or square
      if (figure.emoji) {
        p.textSize(35);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(figure.emoji, x, y + 35);
      } else {
        p.rectMode(p.CENTER);
        p.stroke(0);
        p.strokeWeight(2);
        p.fill(255);
        p.square(x, y + 35, 30);
      }
    } else {
      // Check if the emoji is a face emoji or if no emoji is provided
      if (isFaceEmoji(figure.emoji) || !figure.emoji) {
        // Reset stroke for figure drawing
        p.stroke(0);
        p.strokeWeight(2);
        
        if (!figure.emoji) {
          // Head
          p.fill(255);
          p.circle(x, y, 30);
        }
        
        // Emoji face (only if emoji is not empty)
        if (figure.emoji) {
          p.textSize(35);
          p.textAlign(p.CENTER, p.CENTER);
          p.text(figure.emoji, x, y + 2);
        }
        
        // Body
        p.line(x, y + 15, x, y + 65);
        
        // Arms
        p.line(x - 20, y + 30, x + 20, y + 30);
        
        // Legs
        p.line(x, y + 65, x - 15, y + 90);
        p.line(x, y + 65, x + 15, y + 90);
      } else {
        // If not a face emoji, just show the emoji centered
        p.textSize(35);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(figure.emoji, x, y + 35);
      }
    }
    
    p.pop();
  }

  function drawFigureText(x, y, figure, bubbleWidth, nth) {
    const { speak, display, thought, prop } = figure;
    const textType = speak ? 'speak' : display ? 'display' : thought ? 'thought' : prop ? 'prop' : null;
    const textContent = speak || display || thought || prop;

    if (!textContent || textContent.length === 0) return;

    p.push();
    
    // Set text size based on type
    switch(textType) {
      case 'speak':
        bubbleTextSize = 13;
        bubblePadding = 10;
        break;
      case 'thought':
        bubbleTextSize = 11;
        bubblePadding = 8;
        break;
      case 'display':
        bubbleTextSize = 9;
        bubblePadding = 9;
        break;
      default:
        bubbleTextSize = 10;
        bubblePadding = 10;
        break;
    }
    bubbleLineHeight = bubbleTextSize * 1.25;

    y = y - (nth%2)*10;
    
    // Word wrap text
    p.textSize(bubbleTextSize);
    const words = textContent.split(' ');
    const lines = [''];
    let currentLine = 0;

    words.forEach(word => {
      const testLine = lines[currentLine] + word + ' ';
      if (p.textWidth(testLine) < bubbleWidth - bubblePadding * 2) {
        lines[currentLine] = testLine;
      } else {
        currentLine++;
        lines[currentLine] = word + ' ';
      }
    });

    const wrappedLines = lines.map(line => line.trim()).filter(line => line.length > 0);
    const bubbleHeight = wrappedLines.length * bubbleLineHeight + bubblePadding * 2;
    const bubbleY = y - bubbleHeight - bubbleLineHeight*3;

    if (textType === 'display') {
      // Draw display bubble
      p.stroke(0);
      p.strokeWeight(1);
      p.fill(255);
      p.rectMode(p.CENTER);
      p.rect(x, bubbleY + bubbleHeight/2, bubbleWidth, bubbleHeight, 5);
      
      // Draw text
      p.fill(0);
      p.noStroke();
      p.textAlign(p.CENTER, p.TOP);
      wrappedLines.forEach((line, i) => {
        const lineY = bubbleY + bubblePadding + (i * bubbleLineHeight);
        p.text(line, x, lineY + bubbleLineHeight*.2);
      });
    } else if (textType === 'prop') {
      // Draw prop text
      p.textSize(10);
      p.textAlign(p.CENTER, p.TOP);
      p.noStroke();
      p.fill(0);
      wrappedLines.forEach((line, i) => {
        const lineY = bubbleY + bubblePadding + (i * bubbleLineHeight);
        p.text(line, x, wrappedLines.length*bubbleLineHeight + 150 + lineY + bubbleLineHeight*.2);
      });
    } else {
      // Handle speak and thought bubbles
      p.stroke(0);
      p.strokeWeight(1);
      if (textType === 'thought') {
        p.drawingContext.setLineDash([1, 3]);
      } else {
        p.drawingContext.setLineDash([]);
      }

      p.fill(255);
      p.rectMode(p.CENTER);
      p.rect(x, bubbleY + bubbleHeight/2, bubbleWidth, bubbleHeight, 5);
      
      if (textType === 'speak') {
        p.line(x, bubbleY + bubbleHeight, x, y-25);
      } else {
        p.line(x, bubbleY + bubbleHeight + 2, x, y-25);
      }
      
      // Draw text
      p.fill(0);
      p.noStroke();
      p.textAlign(p.CENTER, p.TOP);
      wrappedLines.forEach((line, i) => {
        const lineY = bubbleY + bubblePadding + (i * bubbleLineHeight);
        p.text(line, x, lineY + bubbleLineHeight*.2);
      });
    }

    p.pop();
  }

  function deleteScene() {
    if (scenes.length <= 1) return;
    scenes.splice(currentSceneIndex, 1);
    if (currentSceneIndex >= scenes.length) {
      currentSceneIndex = scenes.length - 1;
    }
    updateUI();
  }

  function prevScene() {
    if (currentSceneIndex > 0) {
      currentSceneIndex--;
      updateUI();
    }
  }

  function nextScene() {
    if (currentSceneIndex < scenes.length - 1) {
      currentSceneIndex++;
      updateUI();
    }
  }

  function toggleMode() {
    editMode = !editMode;
    modeButton.innerHTML = editMode ? 'Play Mode' : 'Edit Mode';
    
    const currentScene = scenes[currentSceneIndex];
    if (editMode && currentScene && currentScene.figures.length > 0) {
      selectFigure(0);
    } else {
      selectedFigure = -1;
    }
  }

  function updateUI() {
    const currentScene = scenes[currentSceneIndex];
    if (!currentScene) return;

    titleInput.value = currentScene.title || '';
    captionInput.value = currentScene.caption || '';
    contextInput.value = currentScene.context || '';
    soundInput.value = currentScene.sound || '';
    
    numFiguresInput.value = currentScene.figures.length;
    figureText.value = '';
    
    // Always select first figure if in edit mode and figures exist
    if (editMode && currentScene.figures.length > 0) {
      selectFigure(0);
    } else {
      selectedFigure = -1;
    }
    
    updateSceneIndicator();
    updateButtonStyles();
  }

  function exportScenes() {
    const scenesCopy = scenes.map(scene => {
      const sceneCopy = {};
      
      // Only add non-empty scene-level properties
      if (scene.title) sceneCopy.title = scene.title;
      if (scene.caption) sceneCopy.caption = scene.caption;
      if (scene.context) sceneCopy.context = scene.context;
      if (scene.sound) sceneCopy.sound = scene.sound;
      
      // Handle figures
      sceneCopy.figures = scene.figures.map(figure => {
        const figureCopy = {
          emoji: figure.emoji || ''
        };
        
        // Add any existing non-empty text types
        ['speak', 'display', 'thought', 'prop'].forEach(type => {
          if (figure[type]) {
            figureCopy[type] = figure[type];
          }
        });

        // Add onewordname if it exists
        if (figure.onewordname) {
          figureCopy.onewordname = figure.onewordname;
        }
        
        return figureCopy;
      });
      
      return sceneCopy;
    });

    return JSON.stringify(scenesCopy, null, 2);
  }

  // Mouse interaction for edit mode
  p.mousePressed = () => {
    if (!editMode) return;
    
    // Only handle selection if the click is within the canvas
    if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) {
      return;
    }
    
    const currentScene = scenes[currentSceneIndex];
    if (!currentScene) return;

    // Check if clicked near any figure
    for (let i = 0; i < currentScene.figures.length; i++) {
      const x = calculateFigureX(i, currentScene.figures.length);
      const d = p.dist(p.mouseX, p.mouseY, x, figureDefaultY);
      if (d < 30) { // 30 pixel radius for selection
        lastSelectedFigure = i;
        selectFigure(i);
        return;
      }
    }
    
    // If clicked away from figures within canvas, deselect
    lastSelectedFigure = -1;
    selectFigure(-1);
  };

  // Keyboard shortcuts - only active in play mode
  p.keyPressed = () => {
    // Only handle arrow keys in play mode
    if (!editMode) {
      if (p.keyCode === p.LEFT_ARROW) {
        prevScene();
        return false; // Prevent default p5.js behaviors
      } else if (p.keyCode === p.RIGHT_ARROW) {
        nextScene();
        return false; // Prevent default p5.js behaviors
      }
    }
    return true; // Let other keys be processed normally
  };

  function updateFigureCount() {
    const newCount = parseInt(numFiguresInput.value) || 2;
    const currentScene = scenes[currentSceneIndex];
    
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
    
    updateMarginLR(newCount);
    for (let i = 0; i < newCount; i++) {
      if (i < existingData.length) {
        const existingFigure = existingData[i];
        existingFigure.x = calculateFigureX(i, newCount);
        currentScene.figures.push(existingFigure);
      } else {
        currentScene.figures.push({
          x: calculateFigureX(i, newCount),
          y: figureDefaultY,
          emoji: '',
          speak: '',
          onewordname: ''
        });
      }
    }
    
    if (selectedFigure >= newCount) {
      selectedFigure = newCount - 1;
    }
    
    if (selectedFigure >= 0) {
      selectFigure(selectedFigure);
    }
  }

  function updateButtonStyles() {
    prevButton.disabled = currentSceneIndex <= 0;
    nextButton.disabled = currentSceneIndex >= scenes.length - 1;
    deleteButton.disabled = scenes.length <= 1;
  }

  function updateSceneIndicator() {
    sceneIndicator.textContent = `Scene ${currentSceneIndex + 1} of ${scenes.length}`;
  }

  function importScenes(newScenes) {
    scenes = newScenes.map(scene => {
      // Create a new scene with default empty values
      const processedScene = {
        figures: [],
        title: '',
        caption: '',
        context: '',
        sound: ''
      };
      
      // Copy over any existing scene-level properties
      if (scene.title) processedScene.title = scene.title;
      if (scene.caption) processedScene.caption = scene.caption;
      if (scene.context) processedScene.context = scene.context;
      if (scene.sound) processedScene.sound = scene.sound;
      
      // Process figures
      processedScene.figures = scene.figures.map((figure, index) => {
        const processedFigure = {
          x: calculateFigureX(index, scene.figures.length),
          y: figureDefaultY,
          emoji: figure.emoji || '',
          onewordname: figure.onewordname || ''
        };
        
        // Copy over any existing text types
        ['speak', 'display', 'thought', 'prop'].forEach(type => {
          if (figure[type]) {
            processedFigure[type] = figure[type];
          }
        });
        
        return processedFigure;
      });
      
      return processedScene;
    });
    
    currentSceneIndex = 0;
    updateSceneIndicator();
    updateButtonStyles();
    updateUIForScene();
  }

  function updateMarginLR(numFigures) {
    let val = p.min((numFigures-1), 5)/5;
    marginLR = p.lerp(p.int(p.width * 0.45), p.int(p.width * 0.1), val);
  }

  function calculateFigureX(index, totalFigures) {
    const usableWidth = p.width - (marginLR * 2);
    if (totalFigures === 1) {
      return p.width / 2; // Center single figure
    }
    return marginLR + (usableWidth * index) / (totalFigures - 1);
  }

  function selectFigure(index) {
    selectedFigure = index;
    if (index >= 0 && index < scenes[currentSceneIndex].figures.length) {
      const figure = scenes[currentSceneIndex].figures[index];
      
      // For Shoelace components, we need to use their value property
      emojiSelect.value = figure.emoji || '';
      document.getElementById('onewordname').value = figure.onewordname || '';
      
      const existingType = ['speak', 'display', 'thought', 'prop'].find(type => figure[type]);
      if (existingType) {
        figureText.value = figure[existingType];
        textTypeSelect.value = existingType;
      } else {
        const sceneType = ['sound', 'context'].find(type => scenes[currentSceneIndex][type]);
        if (sceneType) {
          figureText.value = scenes[currentSceneIndex][sceneType];
          textTypeSelect.value = sceneType;
        } else {
          figureText.value = '';
          textTypeSelect.value = 'speak';
        }
      }
    }
  }

  function setLineDash(list) {
    p.drawingContext.setLineDash(list);
  }

  function calculateStandardBubbleWidth() {
    const numFigures = scenes[currentSceneIndex].figures.length;
    const usableWidth = p.width - (marginLR * 2);
    const padding = 8;
    return (usableWidth/(numFigures-1)) - padding;
  }

  // Add this new function to handle document clicks
  function handleDocumentClick(event) {
    if (!editMode) return;
    
    // Check if the click is outside the canvas
    const canvas = document.querySelector('#canvasContainer canvas');
    if (!canvas.contains(event.target)) {
      // Maintain the last selected figure
      selectedFigure = lastSelectedFigure;
      p.redraw();
    }
  }

  function drawTextBubble(x, y, text, type, bubbleWidth) {
    if (!text) return;
    
    p.push();
    p.textSize(bubbleTextSize);
    
    // Split text into words and create wrapped lines
    const words = text.split(' ');
    let lines = [''];
    let currentLine = 0;
    
    words.forEach(word => {
      const testLine = lines[currentLine] + word + ' ';
      const testWidth = p.textWidth(testLine);
      
      if (testWidth > bubbleWidth) {
        currentLine++;
        lines[currentLine] = word + ' ';
      } else {
        lines[currentLine] = testLine;
      }
    });
    
    // Trim whitespace from lines
    lines = lines.map(line => line.trim());
    
    // Calculate total height needed for bubble
    const totalHeight = lines.length * bubbleLineHeight;
    
    // Draw bubble and text
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(1);
    
    const padding = bubblePadding;
    const bubbleHeight = totalHeight + (padding * 2);
    
    // Draw different bubble types
    switch(type) {
      case 'speak':
        drawSpeechBubble(x, y - highBubbleOffset, bubbleWidth, bubbleHeight);
        break;
      case 'thought':
        drawThoughtBubble(x, y - highBubbleOffset, bubbleWidth, bubbleHeight);
        break;
      case 'display':
        drawDisplayBubble(x, y + lowBubbleOffset, bubbleWidth, bubbleHeight);
        break;
      case 'prop':
        drawPropBubble(x, y + lowBubbleOffset, bubbleWidth, bubbleHeight);
        break;
    }
    
    // Draw text
    p.fill(0);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    
    let yOffset = (type === 'speak' || type === 'thought') ? 
                  y - highBubbleOffset - bubbleHeight + padding :
                  y + lowBubbleOffset + padding;
    
    lines.forEach(line => {
      p.text(line, x, yOffset);
      yOffset += bubbleLineHeight;
    });
    
    p.pop();
  }

  function setupExportDialog() {
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

    // Add event listener to export button
    exportButton.addEventListener('click', () => {
      jsonTextArea.value = JSON.stringify(scenes, null, 2);
      exportDialog.style.display = 'block';
    });

    saveButton.addEventListener('click', () => {
      try {
        const newScenes = JSON.parse(jsonTextArea.value);
        importScenes(newScenes);
        exportDialog.style.display = 'none';
      } catch (e) {
        console.error('Invalid JSON:', e);
        alert('Invalid JSON format');
      }
    });

    cancelButton.addEventListener('click', () => {
      exportDialog.style.display = 'none';
    });
  }
});

export default p5;