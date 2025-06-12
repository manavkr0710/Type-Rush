interface AITypingConfig {
  baseSpeed: number;  // Base typing speed in WPM
  mistakeRate: number;  // Probability of making a mistake (0-1)
  mistakePatterns: {
    [key: string]: number;  // Common mistake patterns and their probabilities
  };
  fatigueFactor: number;  // How much the AI slows down over time (0-1)
  personality: 'careful' | 'balanced' | 'aggressive';  // AI personality type
}

const defaultConfig: AITypingConfig = {
  baseSpeed: 80,  // 80 WPM base speed
  mistakeRate: 0.03,  // 3% chance of mistake per character (reduced from 5%)
  mistakePatterns: {
    'adjacent': 0.5,  // 50% chance of hitting adjacent key
    'double': 0.2,    // 20% chance of double-pressing
    'skip': 0.2,      // 20% chance of skipping a character
    'swap': 0.1       // 10% chance of swapping adjacent characters
  },
  fatigueFactor: 0.05,  // 5% slowdown over time (reduced from 10%)
  personality: 'balanced'
};

// Personality configurations
const personalityConfigs = {
  careful: {
    baseSpeed: 70,
    mistakeRate: 0.02,
    fatigueFactor: 0.03
  },
  balanced: {
    baseSpeed: 80,
    mistakeRate: 0.03,
    fatigueFactor: 0.05
  },
  aggressive: {
    baseSpeed: 90,
    mistakeRate: 0.04,
    fatigueFactor: 0.07
  }
};

export class AITypingSimulator {
  private config: AITypingConfig;
  private currentPosition: number = 0;
  private startTime: number = 0;
  private mistakes: number = 0;
  private text: string = '';
  private consecutiveCorrect: number = 0;
  private lastMistakeTime: number = 0;
  private mistakeCooldown: number = 0;

  constructor(config: Partial<AITypingConfig> = {}) {
    // Apply personality config first, then override with any custom config
    const personality = config.personality || defaultConfig.personality;
    this.config = { 
      ...defaultConfig, 
      ...personalityConfigs[personality],
      ...config 
    };
  }

  public startTyping(text: string) {
    this.text = text;
    this.currentPosition = 0;
    this.startTime = Date.now();
    this.mistakes = 0;
    this.consecutiveCorrect = 0;
    this.lastMistakeTime = 0;
    this.mistakeCooldown = 0;
  }

  public getNextChar(): { char: string; isMistake: boolean } {
    if (this.currentPosition >= this.text.length) {
      return { char: '', isMistake: false };
    }

    const timeElapsed = (Date.now() - this.startTime) / 1000 / 60; // in minutes
    const currentSpeed = this.config.baseSpeed * (1 - (timeElapsed * this.config.fatigueFactor));
    const charPerMinute = currentSpeed * 5; // assuming 5 characters per word
    const msPerChar = (60 * 1000) / charPerMinute;

    // Simulate human-like typing delay with natural variation
    const baseDelay = msPerChar * (0.9 + Math.random() * 0.2); // 10% variation (reduced from 20%)
    
    // Add slight pauses after punctuation
    const currentChar = this.text[this.currentPosition];
    const punctuationPause = /[.,!?]/.test(currentChar) ? 150 + Math.random() * 100 : 0;
    
    const totalDelay = baseDelay + punctuationPause;
    
    if (Date.now() - this.startTime < totalDelay) {
      return { char: '', isMistake: false };
    }

    // Implement mistake cooldown to avoid too many mistakes in succession
    const now = Date.now();
    if (this.mistakeCooldown > 0) {
      this.mistakeCooldown -= (now - this.lastMistakeTime);
      this.lastMistakeTime = now;
    }

    // Decide if we should make a mistake
    // Reduce mistake probability after consecutive correct characters
    const mistakeProbability = this.config.mistakeRate * (1 - (this.consecutiveCorrect * 0.01));
    
    if (this.mistakeCooldown <= 0 && Math.random() < mistakeProbability) {
      this.mistakes++;
      this.consecutiveCorrect = 0;
      this.mistakeCooldown = 500 + Math.random() * 1000; // 0.5-1.5 second cooldown
      this.lastMistakeTime = now;
      
      const mistakeType = this.getRandomMistakeType();
      return this.generateMistake(mistakeType);
    }

    this.consecutiveCorrect++;
    const char = this.text[this.currentPosition];
    this.currentPosition++;
    return { char, isMistake: false };
  }

  private getRandomMistakeType(): string {
    const rand = Math.random();
    let cumulative = 0;
    for (const [type, prob] of Object.entries(this.config.mistakePatterns)) {
      cumulative += prob;
      if (rand < cumulative) return type;
    }
    return 'adjacent'; // fallback
  }

  private generateMistake(type: string): { char: string; isMistake: boolean } {
    const currentChar = this.text[this.currentPosition];
    let mistakeChar = '';

    switch (type) {
      case 'adjacent':
        // Simulate hitting an adjacent key with improved accuracy
        const adjacentKeys: { [key: string]: string[] } = {
          'a': ['q', 'w', 's', 'z'],
          's': ['a', 'w', 'd', 'x'],
          'd': ['s', 'f', 'c', 'x'],
          'f': ['d', 'g', 'v', 'c'],
          'g': ['f', 'h', 'b', 'v'],
          'h': ['g', 'j', 'n', 'b'],
          'j': ['h', 'k', 'm', 'n'],
          'k': ['j', 'l', ',', 'm'],
          'l': ['k', ';', '.', ','],
          'i': ['u', 'o', 'k', '8'],
          'o': ['i', 'p', 'l', '9'],
          'p': ['o', '[', ';', '0'],
          'u': ['y', 'i', 'j', '7'],
          'y': ['t', 'u', 'h', '6'],
          't': ['r', 'y', 'g', '5'],
          'r': ['e', 't', 'f', '4'],
          'e': ['w', 'r', 'd', '3'],
          'w': ['q', 'e', 's', '2'],
          'q': ['1', 'w', 'a', '`'],
          'z': ['`', 'x', 's', 'a'],
          'x': ['z', 'c', 'd', 's'],
          'c': ['x', 'v', 'f', 'd'],
          'v': ['c', 'b', 'g', 'f'],
          'b': ['v', 'n', 'h', 'g'],
          'n': ['b', 'm', 'j', 'h'],
          'm': ['n', ',', 'k', 'j'],
          ',': ['m', '.', 'l', 'k'],
          '.': [',', '/', ';', 'l'],
          '/': ['.', 'shift', ';', '.'],
          ' ': ['v', 'b', 'n', 'c'] // Space bar adjacent keys
        };
        
        // Get adjacent keys for current character, or use a default set
        const adjacent = adjacentKeys[currentChar.toLowerCase()] || [currentChar];
        
        // Bias towards more common adjacent keys
        const commonAdjacent = adjacent.slice(0, 2); // First two are more common
        const uncommonAdjacent = adjacent.slice(2);
        
        // 70% chance to pick from common adjacent keys
        if (Math.random() < 0.7) {
          mistakeChar = commonAdjacent[Math.floor(Math.random() * commonAdjacent.length)];
        } else {
          mistakeChar = uncommonAdjacent[Math.floor(Math.random() * uncommonAdjacent.length)];
        }
        break;

      case 'double':
        // Simulate double-pressing with reduced probability for certain characters
        if (/[aeiou]/.test(currentChar.toLowerCase())) {
          // Vowels are more likely to be double-pressed
          mistakeChar = currentChar + currentChar;
        } else {
          // For non-vowels, 50% chance to skip this mistake type
          return this.getNextChar();
        }
        break;

      case 'skip':
        // Simulate skipping a character with context awareness
        // Less likely to skip important characters
        if (/[aeiou]/.test(currentChar.toLowerCase()) || /[.,!?]/.test(currentChar)) {
          // 30% chance to skip vowels or punctuation
          if (Math.random() < 0.3) {
            this.currentPosition++;
            return this.getNextChar();
          }
        } else {
          // 70% chance to skip other characters
          this.currentPosition++;
          return this.getNextChar();
        }
        mistakeChar = currentChar; // Fallback if we decide not to skip
        break;

      case 'swap':
        // Simulate swapping adjacent characters with context awareness
        if (this.currentPosition < this.text.length - 1) {
          const nextChar = this.text[this.currentPosition + 1];
          
          // Less likely to swap if it would create an invalid word pattern
          const wouldCreateInvalidPattern = /[aeiou]{3,}/.test(currentChar + nextChar + nextChar) || 
                                           /[^aeiou]{5,}/.test(currentChar + nextChar + nextChar);
          
          if (!wouldCreateInvalidPattern) {
            mistakeChar = nextChar;
            this.currentPosition++;
          } else {
            mistakeChar = currentChar;
          }
        } else {
          mistakeChar = currentChar;
        }
        break;

      default:
        mistakeChar = currentChar;
    }

    return { char: mistakeChar, isMistake: true };
  }

  public getStats() {
    return {
      position: this.currentPosition,
      mistakes: this.mistakes,
      timeElapsed: (Date.now() - this.startTime) / 1000,
      accuracy: this.currentPosition > 0 ? 
        ((this.currentPosition - this.mistakes) / this.currentPosition) * 100 : 100
    };
  }
} 