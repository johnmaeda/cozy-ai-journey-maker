# Cozy AI Customer Journey Maker

A visual storytelling tool to create customer journey scenarios using AI assistance. Built with p5.js and integrates with Azure AI Foundry Azure OpenAI or plain OpenAI

## Features

- Create multi-scene customer journey visualizations
- Generate storylines with AI (supports OpenAI and Azure OpenAI) 
- Edit scenes with customizable figures, dialogue, and actions
- Navigate scenes in Play Mode using arrow keys
- Export your journey as JSON or PDF
- Customize figures with emojis and text/thought bubbles

## Setup

1. Clone the repository
```bash
git clone https://github.com/johnmaeda/cozy-ai-journey-maker.git
cd cozy-ai-journey-maker
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser to the URL shown in the terminal (typically http://localhost:5173)

## API Configuration

The app supports both OpenAI and Azure OpenAI APIs:

### OpenAI
1. Click the gear icon (⚙️) in the top right corner
2. Select "OpenAI" as the API provider
3. Enter your OpenAI API key
4. Click Save

### Azure OpenAI
1. Click the gear icon (⚙️) in the top right corner
2. Select "Azure OpenAI" as the API provider (default)
3. Enter your Azure OpenAI endpoint URL and API key
4. Click Save

## How to Use

1. **Write a storyline**: Enter a description of your customer journey scenario in the text area
2. **Generate scenes**: Click "Generate Journey" to create a sequence of scenes using AI
3. **Edit mode**: Customize each scene's details, figures, and dialogue
4. **Play mode**: Click "Play Mode" button to view your customer journey (use arrow keys to navigate)

## Advanced Editing

- Add or delete scenes
- Edit scene titles and captions
- Customize figures with different emojis
- Add speech bubbles, thought bubbles, or screen displays
- Export to PDF for presentations or JSON for further customization
