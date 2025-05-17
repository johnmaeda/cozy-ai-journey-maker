class SceneRenderer {
  constructor(p5Instance) {
    this.p = p5Instance;
    this.editMode = true;
    this.selectedFigureIndex = -1;

    // Constants for rendering
    this.figureDefaultY = this.p.int(this.p.height * 0.5);
    this.marginLR = this.p.int(this.p.width * 0.3);
    this.bubbleTextSize = 16;
    this.bubbleLineHeight = this.bubbleTextSize * 1.6;
    this.bubblePadding = 10;
    this.verticalSpacing = 40;
    // Add face emojis array
    this.faceEmojis = [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "😂",
      "🤣",
      "😊",
      "😇",
      "🙂",
      "🙃",
      "😉",
      "😌",
      "😍",
      "🥰",
      "😘",
      "😗",
      "😙",
      "😚",
      "😋",
      "😜",
      "😝",
      "😛",
      "🤑",
      "🤗",
      "🤭",
      "🤫",
      "🤔",
      "🤐",
      "🤨",
      "😐",
      "😑",
      "😶",
      "😏",
      "😒",
      "🙄",
      "😬",
      "😮‍💨",
      "🤥",
      "😌",
      "😔",
      "😪",
      "🤤",
      "😴",
      "😷",
      "🤒",
      "🤕",
      "🤢",
      "🤮",
      "🤧",
      "😵",
      "😵‍💫",
      "🤯",
      "🤠",
      "🥳",
      "🥸",
      "😎",
      "🤓",
      "🧐",
      "😕",
      "😟",
      "🙁",
      "☹️",
      "😮",
      "😯",
      "😲",
      "😳",
      "🥺",
      "😦",
      "😧",
      "😨",
      "😰",
      "😥",
      "😢",
      "😭",
      "😱",
      "😖",
      "😣",
      "😞",
      "😓",
      "😩",
      "😫",
      "🥱",
      "😤",
      "😡",
      "😠",
      "🤬",
      "😈",
      "👿",
      "💀",
      "🤡",
      "👹",
      "👺",
      "👻",
      "👽",
      "👾",
      "🤖",
      "🧑‍🔧",
      "👶",
      "👦",
      "👧",
      "👨",
      "👩",
      "👱",
      "👱‍♂️",
      "👱‍♀️",
      "👨‍🦰",
      "🧑",
      "🧔",
      "🧔‍♂️",
      "🧔‍♀️",
      "👴",
      "👵",
      "🧓",
      "👲",
      "👳",
      "👳‍♂️",
      "👳‍♀️",
      "👮",
      "👮‍♂️",
      "👮‍♀️",
      "👷",
      "👷‍♂️",
      "👷‍♀️",
      "🧑‍🦱",
      "👩",
      "💂",
      "💂‍♂️",
      "💂‍♀️",
      "🕵️",
      "🕵️‍♂️",
      "🕵️‍♀️",
      "👩‍⚕️",
      "👨‍⚕️",
      "👩‍🌾",
      "👨‍🌾",
      "👩‍🍳",
      "👨‍🍳",
      "👩‍🎓",
      "👨‍🎓",
      "👩‍🎤",
      "👨‍🎤",
      "👩‍🏫",
      "👨‍🏫",
      "👩‍🏭",
      "👨‍🏭",
      "👩‍💻",
      "👨‍💻",
      "👩‍💼",
      "👨‍💼",
      "👩‍🔧",
      "👨‍🔧",
      "👩‍🔬",
      "👨‍🔬",
      "👩‍🎨",
      "👨‍🎨",
      "👩‍🚒",
      "👨‍🚒",
      "👩‍✈️",
      "👨‍✈️",
      "👩‍🚀",
      "👨‍🚀",
      "👩‍⚖️",
      "👨‍⚖️",
      "👰",
      "🤵",
      "🤵‍♂️",
      "🤵‍♀️",
      "👸",
      "🤴",
      "🥷",
      "🦸",
      "🦸‍♂️",
      "🦸‍♀️",
      "🦹",
      "🦹‍♂️",
      "🦹‍♀️",
      "🧙",
      "🧙‍♂️",
      "🧙‍♀️",
      "🧛",
      "🧛‍♂️",
      "🧛‍♀️",
      "🧝",
      "🧝‍♂️",
      "🧝‍♀️",
      "🧟",
      "🧟‍♂️",
      "🧟‍♀️",
      "💆",
      "💆‍♂️",
      "💆‍♀️",
      "💇",
      "💇‍♂️",
      "💇‍♀️",
      "🤹‍♂️",
      "🤹‍♀️",
      "🧖",
      "🧖‍♂️",
      "🧖‍♀️",
    ];

    // Initialize in setup
    this.setup();
  }

  setup() {
    this.figureDefaultY = this.p.int(this.p.height * 0.5);
    this.marginLR = this.p.int(this.p.width * 0.3);
  }

  setScene(sceneData) {
    this.currentScene = sceneData;
    if (sceneData && sceneData.figures) {
      this.updateMarginLR(sceneData.figures.length);
    }
  }

  setEditMode(mode) {
    this.editMode = mode;
  }

  setSelectedFigure(index) {
    this.selectedFigureIndex = index;
  }

  handleClick(mouseX, mouseY) {
    if (!this.editMode || !this.currentScene) return null;

    const figures = this.currentScene.figures;
    for (let i = 0; i < figures.length; i++) {
      const x = this.calculateFigureX(i, figures.length);
      const y = this.figureDefaultY;

      // Check if click is within figure's bounding box (head + body)
      if (
        mouseX > x - 25 &&
        mouseX < x + 25 &&
        mouseY > y - 15 &&
        mouseY < y + 90
      ) {
        return i;
      }
    }
    return null;
  }

  draw() {
    const p = this.p;
    p.background(220);
    if (!this.currentScene) return;

    //   // Draw sound if it exists
    //   if (this.currentScene.sound) {
    //     p.textSize(14);
    //     p.textAlign(p.RIGHT, p.TOP);
    //     p.fill(100);
    //     p.text('🔊 ' + this.currentScene.sound, p.width - 10, 70);
    //   }

    // this.drawTitle();
    // this.drawContext();
    // this.drawSound();
    this.drawFigures();
    this.drawCaption();
  }

  drawContext() {
    this.p.textSize(14);
    this.p.textAlign(this.p.LEFT, this.p.TOP);
    this.p.fill(100);
    this.p.text("📝 " + this.currentScene.context, 10, 40);
  }

  drawTitle() {
    this.p.textSize(20);
    this.p.textAlign(this.p.CENTER, this.p.TOP);
    this.p.fill(0);
    this.p.text(this.currentScene.title || "-", this.p.width / 2, 10);
  }

  drawSound() {
    if (this.currentScene.sound) {
      this.p.textSize(14);
      this.p.textAlign(this.p.RIGHT, this.p.TOP);
      this.p.fill(100);
      this.p.text("🔊 " + this.currentScene.sound, this.p.width - 10, 70);
    }
  }

  drawCaption() {
    this.p.textSize(14);
    this.p.textAlign(this.p.CENTER, this.p.BOTTOM);
    this.p.fill(0);
    const margin = this.p.width * 0.2;
    this.p.text(
      this.currentScene.caption || "-",
      margin,
      this.p.height - 50,
      this.p.width - margin * 2
    );
  }

  drawFigures() {
    if (!this.currentScene.figures) return;

    const standardBubbleWidth = this.calculateStandardBubbleWidth();
    this.currentScene.figures.forEach((figure, i) => {
      const x = this.calculateFigureX(i, this.currentScene.figures.length);
      this.drawFigureText(
        x,
        this.figureDefaultY,
        figure,
        standardBubbleWidth,
        i
      );
      this.drawFigure(x, this.figureDefaultY, figure, i);
    });
  }

  drawFigure(x, y, figure, index) {
    const p = this.p;
    p.push();

    const isDisplayOrProp = figure && (figure.display || figure.prop);

    // Draw selection box if selected and in edit mode
    if (this.editMode && index === this.selectedFigureIndex) {
      p.noFill();
      p.stroke(135, 206, 235); // Light blue color
      p.strokeWeight(2);
      p.rectMode(p.CENTER);
      p.rect(x, y + 35, 50, 120, 5);
    }

    if (isDisplayOrProp) {
      this.drawDisplayOrProp(x, y, figure);
    } else {
      this.drawCharacter(x, y, figure);
    }
    p.pop();
  }

  drawDisplayOrProp(x, y, figure) {
    const p = this.p;
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

    // Draw onewordname if it exists
    if (false && figure.onewordname) {
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.noStroke();
      p.fill(0);
      p.text(figure.onewordname, x, y + 120);
    }
  }

  drawCharacter(x, y, figure) {
    const p = this.p;
    //      if (this.isFaceEmoji(figure.emoji) || !figure.emoji) {
    if (true) {
      p.stroke(0);
      p.strokeWeight(2);

      if (true) { // just draw stick figure face
        p.fill(255);
        p.circle(x, y, 30);
      } else {
        p.textSize(35);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(figure.emoji, x, y + 2);
      }

      // Draw stick figure body
      p.line(x, y + 15, x, y + 65);
      p.line(x - 20, y + 30, x + 20, y + 30);
      p.line(x, y + 65, x - 15, y + 90);
      p.line(x, y + 65, x + 15, y + 90);
    } else {
      p.textSize(35);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(figure.emoji, x, y + 35);
    }

    // Draw onewordname if it exists
    if (figure.onewordname) {
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.noStroke();
      p.fill(0);
      p.text(figure.onewordname, x, y + 120);
    }
  }

  drawFigureText(x, y, figure, bubbleWidth, nth) {
    const p = this.p;
    const { speak, display, thought, prop } = figure;
    const textType = speak
      ? "speak"
      : display
      ? "display"
      : thought
      ? "thought"
      : prop
      ? "prop"
      : null;
    const textContent = speak || display || thought || prop;

    if (!textContent || textContent.length === 0) return;

    p.push();

    // Set text properties based on type
    const textConfig = this.getTextConfig(textType);
    const { textSize, padding, lineHeight } = textConfig;

    y = y - ((nth + 1) % 2) * 10;

    // Word wrap text
    p.textSize(textSize);
    const wrappedLines = this.wrapText(textContent, bubbleWidth - padding * 2);
    const bubbleHeight = wrappedLines.length * lineHeight + padding * 2;
    const bubbleY = y - bubbleHeight - lineHeight * 3;

    switch (textType) {
      case "display":
        this.drawDisplayBubble(
          x,
          bubbleY,
          bubbleWidth,
          bubbleHeight,
          wrappedLines,
          padding,
          lineHeight
        );
        break;
      case "prop":
        this.drawPropText(x, bubbleY, wrappedLines, lineHeight);
        break;
      default:
        this.drawSpeechBubble(
          x,
          y,
          bubbleY,
          bubbleWidth,
          bubbleHeight,
          wrappedLines,
          padding,
          lineHeight,
          textType
        );
    }

    p.pop();
  }

  getTextConfig(textType) {
    switch (textType) {
      case "speak":
        return { textSize: 13, padding: 10, lineHeight: 16 };
      case "thought":
        return { textSize: 11, padding: 8, lineHeight: 14 };
      case "display":
        return { textSize: 9, padding: 9, lineHeight: 12 };
      default:
        return { textSize: 10, padding: 10, lineHeight: 13 };
    }
  }

  wrapText(text, maxWidth) {
    const p = this.p;
    // Replace all occurrences of the string "\n" with an actual newline character
    const modifiedText = text.replace(/\\n/g, '\n');
    
    // Split text by newlines first
    const lines = modifiedText.split('\n');
    const wrappedLines = [];

    lines.forEach(line => {
        const words = line.split(/\s+/); // Split each line into words
        let currentLine = '';

        words.forEach(word => {
            if (word === '') return; // Skip empty strings

            const testLine = currentLine + word + ' ';
            if (p.textWidth(testLine) < maxWidth) {
                currentLine = testLine; // Add word to current line
            } else {
                wrappedLines.push(currentLine.trim()); // Save the current line
                currentLine = word + ' '; // Start a new line with the current word
            }
        });

        // Push any remaining text in currentLine to wrappedLines
        if (currentLine) {
            wrappedLines.push(currentLine.trim());
        }
    });

    return wrappedLines;
  }

  drawDisplayBubble(
    x,
    bubbleY,
    bubbleWidth,
    bubbleHeight,
    wrappedLines,
    padding,
    lineHeight
  ) {
    const p = this.p;
    p.stroke(0);
    p.strokeWeight(1);
    p.fill(0);
    p.rectMode(p.CENTER);
    p.rect(x, bubbleY + bubbleHeight / 2, bubbleWidth, bubbleHeight, 5);
    this.drawBubbleText(x, bubbleY, wrappedLines, padding, lineHeight, [0,255,0]);
  }

  drawPropText(x, bubbleY, wrappedLines, lineHeight) {
    const p = this.p;
    p.textSize(10);
    p.textAlign(p.CENTER, p.TOP);
    p.noStroke();
    p.fill(0);
    wrappedLines.forEach((line, i) => {
      const lineY = bubbleY + this.bubblePadding + i * lineHeight;
      p.text(
        line,
        x,
        wrappedLines.length * lineHeight + 150 + lineY + lineHeight * 0.2
      );
    });
  }

  drawSpeechBubble(
    x,
    y,
    bubbleY,
    bubbleWidth,
    bubbleHeight,
    wrappedLines,
    padding,
    lineHeight,
    textType
  ) {
    const p = this.p;
    p.stroke(0);
    p.strokeWeight(1);

    if (textType === "thought") {
      p.drawingContext.setLineDash([1, 3]);
    } else {
      p.drawingContext.setLineDash([]);
    }

    p.fill(255);
    p.rectMode(p.CENTER);
    p.rect(x, bubbleY + bubbleHeight / 2, bubbleWidth, bubbleHeight, 5);

    // Draw tail
    const tailY = textType === "speak" ? 0 : 2;
    p.line(x, bubbleY + bubbleHeight + tailY, x, y - 25);

    this.drawBubbleText(x, bubbleY, wrappedLines, padding, lineHeight);
  }

  drawBubbleText(x, bubbleY, wrappedLines, padding, lineHeight, textColor = [0, 0, 0]) {
    const p = this.p;
    p.fill(textColor);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    wrappedLines.forEach((line, i) => {
      const lineY = bubbleY + padding + i * lineHeight;
      p.text(line, x, lineY + lineHeight * 0.2);
    });
  }

  isFaceEmoji(emoji) {
    if (!emoji || typeof emoji !== "string") return false;
    return this.faceEmojis.includes(emoji);
  }

  calculateStandardBubbleWidth() {
    const numFigures = this.currentScene.figures.length;
    const usableWidth = this.p.width - this.marginLR * 2;
    const padding = 8;
    return usableWidth / (numFigures - 1) - padding;
  }

  calculateFigureX(index, totalFigures) {
    const usableWidth = this.p.width - this.marginLR * 2;
    if (totalFigures === 1) {
      return this.p.width / 2;
    }
    return this.marginLR + (usableWidth * index) / (totalFigures - 1);
  }

  updateMarginLR(numFigures) {
    const val = this.p.min(numFigures - 1, 5) / 5;
    this.marginLR = this.p.lerp(
      this.p.int(this.p.width * 0.45),
      this.p.int(this.p.width * 0.1),
      val
    );
  }

  redraw() {
    this.p.clear();
    this.draw();
  }

  captureSceneImage() {
    return this.p.canvas.toDataURL('image/png');
  }
}

export default SceneRenderer;
