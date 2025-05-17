class Scene {
  constructor(data = {}) {
    this.title = data.title || '';
    this.caption = data.caption || '';
    this.context = data.context || '';
    this.sound = data.sound || '';
    this.figures = (data.figures || []).map(f => ({
      emoji: f.emoji || '',
      speak: f.speak || '',
      thought: f.thought || '',
      display: f.display || '',
      prop: f.prop || '',
      onewordname: f.onewordname || ''
    }));
  }

  addFigure(figure = {}) {
    this.figures.push({
      emoji: figure.emoji || '',
      speak: figure.speak || '',
      thought: figure.thought || '',
      display: figure.display || '',
      prop: figure.prop || '',
      onewordname: figure.onewordname || ''
    });
  }

  removeFigure(index) {
    if (index >= 0 && index < this.figures.length) {
      this.figures.splice(index, 1);
    }
  }

  updateFigure(index, updates) {
    if (index >= 0 && index < this.figures.length) {
      const figure = this.figures[index];
      
      // Clear existing text types if a new one is being set
      if (updates.speak || updates.thought || updates.display || updates.prop) {
        figure.speak = '';
        figure.thought = '';
        figure.display = '';
        figure.prop = '';
      }
      
      Object.assign(figure, updates);
    }
  }

  setFigureCount(count) {
    const newCount = Math.max(0, count);
    while (this.figures.length < newCount) {
      this.addFigure();
    }
    while (this.figures.length > newCount) {
      this.figures.pop();
    }
  }

  toJSON() {
    return {
      title: this.title,
      caption: this.caption,
      context: this.context,
      sound: this.sound,
      figures: [...this.figures]
    };
  }

  static fromJSON(json) {
    return new Scene(json);
  }
}

export default Scene; 