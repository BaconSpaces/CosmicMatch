// Deck class for UNO Show 'Em No Mercy
import { Card } from './card.js';

export class Deck {
  constructor() {
    this.cards = [];
    this.build();
    this.shuffle();
  }

  /**
   * Builds the deck with the assumed distribution that totals 168 cards:
   *
   * Number cards (0-9 in 4 colors): 76 cards
   *   - 0: 1 per color → 4
   *   - 1-9: 2 per color per number → 9×2×4 = 72
   *   Total: 4 + 72 = 76
   *
   * Color action cards (per color): 56 cards
   *   - Skip: 3 per color → 12
   *   - Reverse: 3 per color → 12
   *   - Draw Two: 3 per color → 12
   *   - Draw Four: 2 per color → 8
   *   - Discard All: 2 per color → 8
   *   - Skip Everyone: 1 per color → 4
   *   Total: 12+12+12+8+8+4 = 56
   *
   * Wild action cards: 36 cards
   *   - Wild: 8
   *   - Wild Reverse Draw 4: 8
   *   - Wild Draw 6: 6
   *   - Wild Draw 10: 6
   *   - Wild Color Roulette: 8
   *   Total: 8+8+6+6+8 = 36
   *
   * Grand total: 76 + 56 + 36 = 168 cards
   */
  build() {
    const colors = ['red', 'yellow', 'green', 'blue'];

    // Add number cards
    for (const color of colors) {
      // Add one 0
      this.cards.push(new Card(color, 0));
      // Add two of each number 1-9
      for (let num = 1; num <= 9; num++) {
        this.cards.push(new Card(color, num));
        this.cards.push(new Card(color, num));
      }
    }

    // Add color action cards
    // Skip: 3 per color
    for (const color of colors) {
      for (let i = 0; i < 3; i++) {
        this.cards.push(new Card(color, 'skip'));
      }
    }
    // Reverse: 3 per color
    for (const color of colors) {
      for (let i = 0; i < 3; i++) {
        this.cards.push(new Card(color, 'reverse'));
      }
    }
    // Draw Two: 3 per color
    for (const color of colors) {
      for (let i = 0; i < 3; i++) {
        this.cards.push(new Card(color, 'draw2'));
      }
    }
    // Draw Four: 2 per color
    for (const color of colors) {
      for (let i = 0; i < 2; i++) {
        this.cards.push(new Card(color, 'draw4'));
      }
    }
    // Discard All: 2 per color
    for (const color of colors) {
      for (let i = 0; i < 2; i++) {
        this.cards.push(new Card(color, 'discard_all'));
      }
    }
    // Skip Everyone: 1 per color
    for (const color of colors) {
      this.cards.push(new Card(color, 'skip_everyone'));
    }

    // Add wild action cards
    // Wild: 8
    for (let i = 0; i < 8; i++) {
      this.cards.push(new Card('wild', 'wild'));
    }
    // Wild Reverse Draw 4: 8
    for (let i = 0; i < 8; i++) {
      this.cards.push(new Card('wild', 'wild_reverse_draw4'));
    }
    // Wild Draw 6: 6
    for (let i = 0; i < 6; i++) {
      this.cards.push(new Card('wild', 'wild_draw6'));
    }
    // Wild Draw 10: 6
    for (let i = 0; i < 6; i++) {
      this.cards.push(new Card('wild', 'wild_draw10'));
    }
    // Wild Color Roulette: 8
    for (let i = 0; i < 8; i++) {
      this.cards.push(new Card('wild', 'wild_color_roulette'));
    }
  }

  /**
   * Shuffles the deck using Fisher-Yates algorithm
   */
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  /**
   * Draws a card from the top of the deck
   * @returns {Card|null} The drawn card or null if deck is empty
   */
  draw() {
    return this.cards.length > 0 ? this.cards.pop() : null;
  }

  /**
   * Adds a card to the bottom of the deck
   * @param {Card} card - The card to add
   */
  addCard(card) {
    this.cards.push(card);
  }

  /**
   * Returns the number of cards remaining in the deck
   * @returns {number}
   */
  remaining() {
    return this.cards.length;
  }

  /**
   * Checks if the deck is empty
   * @returns {boolean}
   */
  isEmpty() {
    return this.cards.length === 0;
  }

  /**
   * Returns a copy of the deck array (for testing)
   * @returns {Card[]}
   */
  getCards() {
    return [...this.cards];
  }
}

// For CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Deck };
}