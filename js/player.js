// Player class representing a player in UNO Show 'Em No Mercy
export class Player {
  /**
   * @param {string} name - The player's name
   * @param {boolean} isAI - Whether this player is an AI
   */
  constructor(name, isAI = false) {
    this.name = name;
    this.isAI = isAI;
    this.hand = []; // Array of Card objects
  }

  /**
   * Adds a card to the player's hand
   * @param {Card} card - The card to add
   */
  addCard(card) {
    this.hand.push(card);
  }

  /**
   * Removes and returns a card from the player's hand at the specified index
   * @param {number} index - The index of the card to remove
   * @returns {Card} The removed card
   */
  removeCard(index) {
    if (index < 0 || index >= this.hand.length) {
      throw new Error(`Invalid card index: ${index}`);
    }
    return this.hand.splice(index, 1)[0];
  }

  /**
   * Returns the number of cards in the player's hand
   * @returns {number}
   */
  handSize() {
    return this.hand.length;
  }

  /**
   * Checks if the player has a card with the specified color and value
   * @param {string} color - The color to match (null for any color)
   * @param {string|number} value - The value to match
   * @returns {boolean} True if the player has at least one matching card
   */
  hasCard(color, value) {
    return this.hand.some(card =>
      (color === null || card.color === color) &&
      card.value === value
    );
  }

  /**
   * Returns an array of indices of playable cards given the current top card and color
   * @param {Card} topCard - The current top card of the discard pile
   * @param {string} currentColor - The current color in play (for wilds)
   * @returns {number[]} Array of indices of playable cards
   */
  getPlayableIndices(topCard, currentColor) {
    const playableIndices = [];

    for (let i = 0; i < this.hand.length; i++) {
      const card = this.hand[i];
      if (this.isPlayable(card, topCard, currentColor)) {
        playableIndices.push(i);
      }
    }

    return playableIndices;
  }

  /**
   * Checks if a card can be played on top of another card
   * @param {Card} card - The card to check
   * @param {Card} topCard - The current top card of the discard pile
   * @param {string} currentColor - The current color in play (for wilds)
   * @returns {boolean} True if the card can be played
   */
  isPlayable(card, topCard, currentColor) {
    // Wild cards are always playable
    if (card.isWild()) {
      return true;
    }

    // Match by color (either card color matches current color, or current color matches card color)
    if (card.color === currentColor || currentColor === card.color) {
      return true;
    }

    // Match by value (number or action)
    if (card.value === topCard.value) {
      return true;
    }

    return false;
  }

  /**
   * Returns a string representation of the player's hand
   * @returns {string}
   */
  handToString() {
    return this.hand.map(card => card.toString()).join(', ');
  }
}

// For CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Player };
}