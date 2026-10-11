// UnoFlexGame.js - Wrapper/adaptor for UnoFlexGameState to match renderer expectations
import { UnoFlexGameState } from './unoFlex.js';

export class UnoFlexGame {
  constructor(playerNames, aiCount = 0) {
    this.gameState = new UnoFlexGameState(playerNames, aiCount);

    // Expose properties directly for compatibility with tests and renderer
    this.players = this.gameState.players;
    this.deck = this.gameState.deck;
    this.unoCalled = this.gameState.unoCalled;
    this.unoSaid = this.gameState.unoSaid;

    Object.defineProperties(this, {
      direction: {
        get: () => this.gameState.direction,
        set: value => { this.gameState.direction = value; },
        configurable: true
      },
      currentPlayerIndex: {
        get: () => this.gameState.currentPlayerIndex,
        set: value => { this.gameState.currentPlayerIndex = value; },
        configurable: true
      },
      gameOver: {
        get: () => this.gameState.gameOver,
        set: value => { this.gameState.gameOver = value; },
        configurable: true
      },
      winner: {
        get: () => this.gameState.winner,
        set: value => { this.gameState.winner = value; },
        configurable: true
      },
      discardPile: {
        get: () => this.gameState.discardPile,
        set: value => { this.gameState.discardPile = value; },
        configurable: true
      },
      currentColor: {
        get: () => this.gameState.currentColor,
        set: value => { this.gameState.currentColor = value; },
        configurable: true
      },
      drawPenalty: {
        get: () => this.gameState.drawPenalty,
        set: value => { this.gameState.drawPenalty = value; },
        configurable: true
      },
      drawPenaltyActive: {
        get: () => this.gameState.drawPenaltyActive,
        set: value => { this.gameState.drawPenaltyActive = value; },
        configurable: true
      }
    });
  }

  // Proxy methods to gameState
  getCurrentPlayerIndex() {
    return this.gameState.currentPlayerIndex;
  }

  getCurrentPlayer() {
    return this.gameState.getCurrentPlayer();
  }

  getTopCard() {
    return this.gameState.getTopCard();
  }

  getState() {
    return {
      players: this.gameState.players.map(p => ({
        name: p.name,
        handSize: p.handSize(),
        isAI: p.isAI,
        hand: p.hand
      })),
      topCard: this.gameState.getTopCard(),
      currentColor: this.gameState.currentColor,
      direction: this.gameState.direction,
      currentPlayerIndex: this.gameState.currentPlayerIndex,
      gameOver: this.gameState.gameOver,
      winner: this.gameState.winner,
      deckRemaining: this.gameState.deck.remaining(),
      discardCount: this.gameState.discardPile.length
    };
  }

  // UNO methods - adapt UnoFlexGameState's UNO tracking to match renderer expectations
  getUnoState() {
    const playerIndex = this.getCurrentPlayerIndex();
    const player = this.getCurrentPlayer();
    const unoCalled = this.gameState.unoCalled[playerIndex];
    const unoSaid = this.gameState.unoSaid[playerIndex];

    return {
      handSize: player.handSize(),
      unoCalled: unoCalled,
      unoSaid: unoSaid,
      needsUno: player.handSize() === 1 && !unoCalled
    };
  }

  sayUNO() {
    this.gameState.sayUNO();
  }

  // Game play methods
  playCard(cardIndex) {
    // Call the gameState's playCard method
    const result = this.gameState.playCard(cardIndex);

    // Adapt the return value to match what renderer expects
    // renderer expects: {card, win, draw, skip, color}
    // gameState returns: {card, win, drawPenalty, skipNext, skipEveryone, reverse, discardAll, wildColorRoulette, colorChange, plusOne, minusOneTarget}

    let draw = 0;
    let skip = false;
    let color = null;

    // Handle draw penalty
    if (result.drawPenalty > 0) {
      draw = result.drawPenalty;
    }

    // Handle skip effects
    if (result.skipNext || result.skipEveryone) {
      skip = true;
    }

    // Handle color change (for wild cards)
    if (result.colorChange !== null) {
      color = result.colorChange;
    }

    // For Wild Color Roulette, Hash Card, we need to pick a random color
    // For simplicity, we'll just pick red here; in a real game we'd prompt for color selection
    if (result.wildColorRoulette || result.discardAll) {
      // In a real implementation, we'd let the player choose a color
      // For now, we'll just pick a random color
      const COLORS = ['red', 'yellow', 'green', 'blue'];
      color = COLORS[Math.floor(Math.random() * COLORS.length)];
    }

    return {
      card: result.card,
      win: result.win,
      draw: draw,
      skip: skip,
      color: color
    };
  }

  // Draw card for a specific player
  drawCardForPlayer(playerIndex) {
    // If deck is empty, reshuffle discard pile
    if (this.gameState.deck.remaining() === 0) {
      this.gameState.reshuffleDiscard();
    }
    const card = this.gameState.deck.draw();
    const player = this.gameState.players[playerIndex];
    if (card) {
      player.addCard(card);
    }
    return card;
  }

  // Draw card for current player
  drawCard() {
    return this.drawCardForPlayer(this.getCurrentPlayerIndex());
  }

  // Check if a card is playable
  isPlayable(cardIndex) {
    return this.gameState.isPlayable(cardIndex);
  }

  // Challenge previous player for not saying UNO
  challengePreviousPlayer() {
    return this.gameState.challengePreviousPlayer();
  }

  // Advance to the next player's turn
  nextTurn() {
    // Check if +1 card was played (current player gets to play again)
    if (this.gameState.plusOneActive) {
      this.gameState.plusOneActive = false;
      // Don't advance turn, current player plays again
      return;
    }

    // Move to next player based on direction
    this.gameState.currentPlayerIndex += this.gameState.direction;
    this.gameState.wrapPlayerIndex(this.gameState.currentPlayerIndex);
    this.gameState.resetUnoTracking();
  }

  // End turn (alias for nextTurn)
  endTurn() {
    this.nextTurn();
  }

  // Check if game is over
  isGameOver() {
    return this.gameState.isGameOver();
  }

  // Get winner
  getWinner() {
    return this.gameState.getWinner();
  }
}