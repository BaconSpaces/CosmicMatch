// GameState class representing the state of a UNO Show 'Em No Mercy game
import { Deck } from './deck.js';
import { Player } from './player.js';
import { Card } from './card.js';
import { COLORS } from '../constants.js';

export class GameState {
  /**
   * @param {string[]} playerNames - Array of player names
   * @param {number} aiCount - Number of AI players (0-3)
   */
  constructor(playerNames, aiCount = 0) {
    console.log('[DEBUG GameState] Constructor called with', { playerNames, aiCount });
    // Initialize players
    this.players = [];

    // First add all human players
    for (let i = 0; i < playerNames.length; i++) {
      this.players.push(new Player(playerNames[i], false));
    }

    // Then add AI players
    for (let i = 0; i < aiCount; i++) {
      this.players.push(new Player(`AI_${i + 1}`, true));
    }

    // Initialize deck and deal cards
    this.deck = new Deck();
    this.deck.shuffle();

    // Deal 7 cards to each player
    for (const player of this.players) {
      for (let i = 0; i < 7; i++) {
        player.addCard(this.deck.draw());
      }
    }

    // Initialize discard pile (ensure first card is not wild)
    this.discardPile = [];
    let firstCard;
    do {
      firstCard = this.deck.draw();
    } while (firstCard.isWild());
    this.discardPile.push(firstCard);

    // Game state
    this.direction = 1; // 1 for clockwise, -1 for counter-clockwise
    this.currentPlayerIndex = 0;
    this.gameOver = false;
    this.winner = null;

    // UNO tracking
    this.unoCalled = new Array(this.players.length).fill(false);
    this.unoSaid = new Array(this.players.length).fill(false);

    // Draw penalty tracking
    this.drawPenalty = 0;
    this.drawPenaltyActive = false;

    // Current color (for wild cards)
    this.currentColor = null;

    console.log('[DEBUG GameState] Initialized with', {
      playerCount: this.players.length,
      humanPlayers: playerNames.length,
      aiPlayers: aiCount,
      deckRemaining: this.deck.remaining(),
      discardPileTop: this.discardPile[0]?.toString()
    });
  }

  /**
   * Get the current player index
   * @returns {number} Index of the current player
   */
  getCurrentPlayerIndex() {
    return this.currentPlayerIndex;
  }

  /**
   * Get the current player object
   * @returns {Player} The current player
   */
  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Get the top card of the discard pile
   * @returns {Card|null} The top card
   */
  getTopCard() {
    return this.discardPile[this.discardPile.length - 1] || null;
  }

  /**
   * Get the current game state
   * @returns {Object} The current game state
   */
  getState() {
    return {
      players: this.players.map(p => ({
        name: p.name,
        handSize: p.handSize(),
        isAI: p.isAI,
        hand: p.hand
      })),
      topCard: this.getTopCard(),
      currentColor: this.currentColor,
      direction: this.direction,
      currentPlayerIndex: this.currentPlayerIndex,
      gameOver: this.gameOver,
      winner: this.winner,
      deckRemaining: this.deck.remaining(),
      discardCount: this.discardPile.length
    };
  }

  /**
   * Get UNO state for the current player
   * @returns {Object} UNO state information
   */
  getUnoState() {
    const playerIndex = this.getCurrentPlayerIndex();
    const player = this.getCurrentPlayer();
    const unoCalled = this.unoCalled[playerIndex];
    const unoSaid = this.unoSaid[playerIndex];

    return {
      handSize: player.handSize(),
      unoCalled: unoCalled,
      unoSaid: unoSaid,
      needsUno: player.handSize() === 1 && !unoCalled
    };
  }

  /**
   * Mark that the current player has called UNO
   */
  sayUNO() {
    const playerIndex = this.getCurrentPlayerIndex();
    this.unoCalled[playerIndex] = true;
    this.unoSaid[playerIndex] = true;
  }

  /**
   * Set that the current player has called UNO (for compatibility with classicGame.js)
   */
  setUnoCalled() {
    this.sayUNO();
  }

  /**
   * Play a card from a player's hand
   * @param {number} cardIndex - Index of the card in the player's hand
   * @returns {Object} Result of playing the card
   */
  playCard(cardIndex) {
    console.log(`[DEBUG GameState.playCard] Attempting to play card at index ${cardIndex} for player ${this.getCurrentPlayer().name}`);
    const player = this.getCurrentPlayer();
    if (cardIndex < 0 || cardIndex >= player.hand.length) {
      console.log(`[DEBUG GameState.playCard] Invalid card index: ${cardIndex}, hand size: ${player.hand.length}`);
      return { card: null, win: false, draw: 0, skip: false, color: null };
    }

    const cardToPlay = player.hand[cardIndex];
    const topCard = this.getTopCard();
    console.log(`[DEBUG GameState.playCard] Playing card: ${cardToPlay.toString()}, top card: ${topCard?.toString() || 'none'}`);

    // Check if card is playable
    if (!this.isPlayable(cardIndex)) {
      console.log(`[DEBUG GameState.playCard] Card is not playable`);
      return { card: null, win: false, draw: 0, skip: false, color: null };
    }

    // Remove card from player's hand
    const playedCard = player.removeCard(cardIndex);
    console.log(`[DEBUG GameState.playCard] Removed card from hand, new hand size: ${player.handSize()}`);

    // Add to discard pile
    this.discardPile.push(playedCard);
    console.log(`[DEBUG GameState.playCard] Added to discard pile, new discard pile size: ${this.discardPile.length}`);

    // Check for win
    const win = player.handSize() === 0;
    if (win) {
      console.log(`[DEBUG GameState.playCard] Player ${player.name} has won!`);
      this.gameOver = true;
      this.winner = player;
    }

    // Handle special card effects
    let draw = 0;
    let skip = false;
    let color = null;

    // Handle draw penalties
    if (playedCard.isDrawCard()) {
      draw = playedCard.getDrawValue();
      this.drawPenalty = draw;
      this.drawPenaltyActive = true;
      console.log(`[DEBUG GameState.playCard] Draw card played, draw value: ${draw}`);
    }

    // Handle skip/reverse
    if (playedCard.value === 'skip' || playedCard.value === 'skip_everyone') {
      skip = true;
      console.log(`[DEBUG GameState.playCard] Skip card played`);
    } else if (playedCard.value === 'reverse') {
      this.direction *= -1; // Reverse direction
      console.log(`[DEBUG GameState.playCard] Reverse card played, new direction: ${this.direction}`);
    }

    // Handle wild cards and color changes
    if (playedCard.isWild()) {
      // For simplicity, we'll auto-select a color
      // In a real game, the player would choose
      const availableColors = COLORS.filter(c => c !== 'wild');
      color = availableColors[Math.floor(Math.random() * availableColors.length)];
      this.currentColor = color;
      console.log(`[DEBUG GameState.playCard] Wild card played, selected color: ${color}`);
    }

    // Handle special wild cards from the expanded deck
    switch (playedCard.value) {
      case 'wild_reverse_draw4':
        this.direction *= -1; // Reverse direction
        draw = 4;
        this.drawPenalty = draw;
        this.drawPenaltyActive = true;
        console.log(`[DEBUG GameState.playCard] Wild reverse draw 4 played, direction reversed, draw 4`);
        // Color will be set below
        break;
      case 'wild_draw6':
        draw = 6;
        this.drawPenalty = draw;
        this.drawPenaltyActive = true;
        console.log(`[DEBUG GameState.playCard] Wild draw 6 played, draw 6`);
        break;
      case 'wild_draw10':
        draw = 10;
        this.drawPenalty = draw;
        this.drawPenaltyActive = true;
        console.log(`[DEBUG GameState.playCard] Wild draw 10 played, draw 10`);
        break;
      case 'wild_color_roulette':
        // Player chooses a color, all players discard cards of that color
        // For simplicity, we'll just pick a random color
        const rouletteColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        color = rouletteColor;
        this.currentColor = color;
        console.log(`[DEBUG GameState.playCard] Wild color roulette played, selected color: ${rouletteColor}`);
        // Make all players discard cards of this color
        for (const p of this.players) {
          const cardsToRemove = [];
          for (let i = 0; i < p.hand.length; i++) {
            if (p.hand[i].color === rouletteColor) {
              cardsToRemove.push(i);
            }
          }
          // Remove in reverse order to maintain indices
          for (let i = cardsToRemove.length - 1; i >= 0; i--) {
            p.hand.splice(cardsToRemove[i], 1);
          }
        }
        break;
      case 'discard_all':
        // Player chooses a color and discards all cards of that color
        // For simplicity, we'll pick a random color
        const discardColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        color = discardColor;
        this.currentColor = color;
        console.log(`[DEBUG GameState.playCard] Discard all played, selected color: ${discardColor}`);
        // Make all players discard cards of this color
        for (const p of this.players) {
          const cardsToRemove = [];
          for (let i = 0; i < p.hand.length; i++) {
            if (p.hand[i].color === discardColor) {
              cardsToRemove.push(i);
            }
          }
          // Remove in reverse order to maintain indices
          for (let i = cardsToRemove.length - 1; i >= 0; i--) {
            p.hand.splice(cardsToRemove[i], 1);
          }
        }
        break;
    }

    // If we haven't set a color from a wild card, check if we need to maintain current color
    if (!color && !playedCard.isWild()) {
      // If there's a current color from a previous wild card, we need to match it
      if (this.currentColor) {
        color = this.currentColor;
        console.log(`[DEBUG GameState.playCard] Maintaining current color: ${this.currentColor}`);
      }
    }

    // Determine skip effects
    let skipNext = false;
    let skipEveryone = false;
    if (playedCard.value === 'skip') {
      skipNext = true;
      console.log(`[DEBUG GameState.playCard] Skip effect: next player skipped`);
    } else if (playedCard.value === 'skip_everyone') {
      skipEveryone = true;
      console.log(`[DEBUG GameState.playCard] Skip effect: all players skipped`);
    } else if (playedCard.value === 'draw2' || playedCard.value === 'wild_draw4') {
      // In this implementation, Draw Two and Wild Draw Four also skip the next player
      skipNext = true;
      console.log(`[DEBUG GameState.playCard] Skip effect from draw card: next player skipped`);
    }

    const result = {
      card: playedCard,
      win: win,
      drawPenalty: draw,
      skipNext: skipNext,
      skipEveryone: skipEveryone,
      reverse: playedCard.value === 'reverse' ? true : false,
      discardAll: playedCard.value === 'discard_all' ? true : false,
      wildColorRoulette: playedCard.value === 'wild_color_roulette' ? true : false,
      colorChange: color
    };

    console.log(`[DEBUG GameState.playCard] Play result:`, {
      cardPlayed: playedCard?.toString(),
      win,
      drawPenalty: draw,
      skipNext,
      skipEveryone,
      reverse: playedCard.value === 'reverse',
      discardAll: playedCard.value === 'discard_all',
      wildColorRoulette: playedCard.value === 'wild_color_roulette',
      colorChange: color
    });

    return result;
  }

  /**
   * Check if a card at the given index is playable
   * @param {number} cardIndex - Index of the card in the current player's hand
   * @returns {{playable: boolean}} Object indicating if the card is playable
   */
  checkPlayable(cardIndex) {
    const player = this.getCurrentPlayer();
    if (cardIndex < 0 || cardIndex >= player.hand.length) {
      return { playable: false };
    }

    const card = player.hand[cardIndex];
    const topCard = this.getTopCard();
    if (!topCard) return { playable: true }; // First play of the game

    // Check if there's an active draw penalty - if so, we can only play draw cards to stack
    if (this.drawPenaltyActive) {
      return { playable: card.isDrawCard() };
    }

    // Use the player's isPlayable method which considers currentColor
    return { playable: player.isPlayable(card, topCard, this.currentColor) };
  }

  /**
   * Check if a card at the given index is playable
   * @param {number} cardIndex - Index of the card in the current player's hand
   * @returns {boolean} True if the card is playable
   */
  isPlayable(cardIndex) {
    return this.checkPlayable(cardIndex).playable;
  }

  /**
   * Draw a card for a specific player
   * @param {number} playerIndex - Index of the player to draw for
   * @returns {Card|null} The drawn card
   */
  drawCardForPlayer(playerIndex) {
    // If deck is empty, reshuffle discard pile (except top card)
    if (this.deck.remaining() === 0) {
      this.reshuffleDiscard();
    }

    const card = this.deck.draw();
    if (card) {
      this.players[playerIndex].addCard(card);
    }
    return card;
  }

  /**
   * Draw a card for the current player
   * @returns {Card|null} The drawn card
   */
  drawCard() {
    return this.drawCardForPlayer(this.getCurrentPlayerIndex());
  }

  /**
   * Challenge the previous player for not saying UNO
   * @returns {boolean} True if the challenge was successful
   */
  challengePreviousPlayer() {
    // Get the previous player (accounting for direction)
    const prevIndex = this.currentPlayerIndex - this.direction;
    const wrappedPrevIndex = this.wrapPlayerIndex(prevIndex);

    // Check if the previous player had UNO to say but didn't
    const prevPlayer = this.players[wrappedPrevIndex];
    if (prevPlayer.handSize() === 1 && !this.unoCalled[wrappedPrevIndex]) {
      // Challenge successful - previous player must draw 2 cards
      for (let i = 0; i < 2; i++) {
        this.drawCardForPlayer(wrappedPrevIndex);
      }
      return true;
    }

    // Challenge unsuccessful - challenger must draw 2 cards
    for (let i = 0; i < 2; i++) {
      this.drawCardForPlayer(this.getCurrentPlayerIndex());
    }
    return false;
  }

  /**
   * Advance to the next player's turn
   */
  nextTurn() {
    // Move to next player based on direction
    this.currentPlayerIndex += this.direction;
    this.wrapPlayerIndex(this.currentPlayerIndex);

    // Reset UNO tracking for the new turn
    this.resetUnoTracking();
  }

  /**
   * End turn (alias for nextTurn)
   */
  endTurn() {
    this.nextTurn();
  }

  /**
   * Wrap player index to stay within bounds
   * @param {number} index - Player index to wrap
   * @returns {number} Wrapped player index
   */
  wrapPlayerIndex(index) {
    if (index >= this.players.length) {
      this.currentPlayerIndex = 0;
    } else if (index < 0) {
      this.currentPlayerIndex = this.players.length - 1;
    } else {
      this.currentPlayerIndex = index;
    }
    return this.currentPlayerIndex;
  }

  /**
   * Reset UNO tracking for the current player
   */
  resetUnoTracking() {
    const playerIndex = this.getCurrentPlayerIndex();
    this.unoCalled[playerIndex] = false;
    // Note: unoSaid stays true if the player actually said UNO
  }

  /**
   * Reshuffle the discard pile into the deck (keeping the top card)
   */
  reshuffleDiscard() {
    if (this.discardPile.length <= 1) return; // Nothing to reshuffle

    // Keep the top card
    const topCard = this.discardPile.pop();

    // Shuffle the rest into the deck
    while (this.discardPile.length > 0) {
      this.deck.addCard(this.discardPile.pop());
    }

    this.deck.shuffle();

    // Put the top card back
    this.discardPile.push(topCard);
  }

  /**
   * Check if the game is over
   * @returns {boolean} True if the game is over
   */
  isGameOver() {
    return this.gameOver;
  }

  /**
   * Get the winner of the game
   * @returns {Player|null} The winning player
   */
  getWinner() {
    return this.winner || null;
  }
}