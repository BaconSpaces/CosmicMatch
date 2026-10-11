// UnoSpinGame.js - Wrapper/adaptor for UnoSpinGameState to match renderer expectations
import { UnoSpinGameState } from './unoSpin.js';

export class UnoSpinGame {
  constructor(playerNames, aiCount = 0) {
    this.gameState = new UnoSpinGameState(playerNames, aiCount);

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

  // UNO methods - adapt UnoSpinGameState's UNO tracking to match renderer expectations
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
    // gameState returns: {card, win, drawPenalty, skipNext, skipEveryone, reverse, discardAll, wildColorRoulette, colorChange, spinWheel}

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
    this.gameState.nextTurn();
    // Keep exposed properties in sync
    this.direction = this.gameState.direction;
    this.currentPlayerIndex = this.gameState.currentPlayerIndex;
    this.gameOver = this.gameState.gameOver;
    this.winner = this.gameState.winner;
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