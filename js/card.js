// Card class representing a UNO Show 'Em No Mercy card
export class Card {
  /**
   * @param {string} color - 'red', 'yellow', 'green', 'blue', or 'wild'
   * @param {string|number} value - For number cards: 0-9; for action cards: 'skip', 'reverse', 'draw2', 'draw4', 'discard_all', 'skip_everyone';
   *                                for wild cards: 'wild', 'wild_reverse_draw4', 'wild_draw6', 'wild_draw10', 'wild_color_roulette'
   */
  constructor(color, value) {
    this.color = color; // 'red', 'yellow', 'green', 'blue', 'wild'
    this.value = value; // see above for possible values
  }

  /**
   * Returns a string representation of the card for display
   * @returns {string}
   */
  toString() {
    if (this.color === 'wild') {
      return `Wild ${this.value}`;
    }
    return `${this.color} ${this.value}`;
  }

  /**
   * Returns true if the card is a wild card
   * @returns {boolean}
   */
  isWild() {
    return this.color === 'wild';
  }

  /**
   * Returns true if the card is a number card
   * @returns {boolean}
   */
  isNumber() {
    return typeof this.value === 'number' && this.value >= 0 && this.value <= 9;
  }

  /**
   * Returns true if the card is a draw card (for stacking purposes)
   * Draw cards are: draw2, draw4, wild_draw6, wild_draw10
   * @returns {boolean}
   */
  isDrawCard() {
    return [
      'draw2',
      'draw4',
      'wild_draw4',
      'wild_reverse_draw4',
      'wild_draw6',
      'wild_draw10'
    ].includes(this.value);
  }

  /**
   * Returns the draw value of this card (for stacking)
   * @returns {number} - 2 for draw2, 4 for draw4, 6 for wild_draw6, 10 for wild_draw10, 0 otherwise
   */
  getDrawValue() {
    switch (this.value) {
      case 'draw2': return 2;
      case 'draw4': return 4;
      case 'wild_draw4': return 4;
      case 'wild_reverse_draw4': return 4;
      case 'wild_draw6': return 6;
      case 'wild_draw10': return 10;
      default: return 0;
    }
  }

  /**
   * Returns true if the card can be played on top of another card (matching by color, number, or symbol)
   * @param {Card} topCard - the current top card of the discard pile
   * @param {boolean} allowWild - whether wild cards are allowed (always true except for Wild Draw Four rules)
   * @returns {boolean}
   */
  canPlayOn(topCard, allowWild = true) {
    // Wild cards can always be played (except for specific Wild Draw Four rules handled elsewhere)
    if (this.isWild() && allowWild) {
      return true;
    }

    // Same color
    if (this.color === topCard.color) {
      return true;
    }

    // Same value (for number cards or action cards)
    if (this.value === topCard.value) {
      return true;
    }

    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Card };
}