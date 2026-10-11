// ClassicGame.js - Wrapper/adaptor for GameState to match renderer expectations
import { GameState } from './game.js';

export class ClassicGame {
  constructor(playerNames, aiCount = 0) {
    console.log(`[DEBUG ClassicGame] Constructor called with playerNames: ${playerNames}, aiCount: ${aiCount}`);
    this.gameState = new GameState(playerNames, aiCount);

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

    console.log(`[DEBUG ClassicGame] Initialized with ${this.gameState.players.length} players`);
  }

  // Proxy methods to gameState
  getCurrentPlayerIndex() {
    const index = this.gameState.currentPlayerIndex;
    console.log(`[DEBUG ClassicGame.getCurrentPlayerIndex] Returning: ${index}`);
    return index;
  }

  getCurrentPlayer() {
    const player = this.gameState.getCurrentPlayer();
    console.log(`[DEBUG ClassicGame.getCurrentPlayer] Returning player: ${player.name} (index: ${this.gameState.currentPlayerIndex})`);
    return player;
  }

  getTopCard() {
    const card = this.gameState.getTopCard();
    console.log(`[DEBUG ClassicGame.getTopCard] Returning: ${card ? card.toString() : 'null'}`);
    return card;
  }

  getState() {
    console.log(`[DEBUG ClassicGame.getState] Getting state for player ${this.gameState.currentPlayerIndex}`);
    const state = this.gameState.getState();
    // Adapt the state to match what renderer expects.
    // GameState.getState() already maps players to plain objects with
    // handSize as a number, so just pass them through.
    const adaptedState = {
      players: state.players.map(p => ({
        name: p.name,
        handSize: p.handSize,
        isAI: p.isAI,
        hand: p.hand
      })),
      topCard: state.topCard,
      currentColor: state.currentColor,
      direction: state.direction,
      currentPlayerIndex: state.currentPlayerIndex,
      gameOver: state.gameOver,
      winner: state.winner,
      deckRemaining: state.deckRemaining,
      discardCount: state.discardCount
    };
    console.log(`[DEBUG ClassicGame.getState] State:`, {
      currentPlayer: adaptedState.players[adaptedState.currentPlayerIndex]?.name,
      handSize: adaptedState.players[adaptedState.currentPlayerIndex]?.handSize,
      topCard: adaptedState.topCard?.toString(),
      currentColor: adaptedState.currentColor,
      direction: adaptedState.direction
    });
    return adaptedState;
  }

  // UNO methods - adapt GameState's UNO tracking to match renderer expectations
  getUnoState() {
    console.log(`[DEBUG ClassicGame.getUnoState] Getting UNO state for player ${this.getCurrentPlayerIndex()}`);
    const playerIndex = this.getCurrentPlayerIndex();
    const player = this.getCurrentPlayer();
    const unoCalled = this.gameState.unoCalled[playerIndex];
    const unoSaid = this.gameState.unoSaid[playerIndex];

    const result = {
      handSize: player.handSize(),
      unoCalled: unoCalled,
      unoSaid: unoSaid,
      needsUno: player.handSize() === 1 && !unoCalled
    };

    console.log(`[DEBUG ClassicGame.getUnoState] UNO state:`, {
      handSize: result.handSize,
      unoCalled: result.unoCalled,
      unoSaid: result.unoSaid,
      needsUno: result.needsUno
    });

    return result;
  }

  sayUNO() {
    console.log(`[DEBUG ClassicGame.sayUNO] Player ${this.getCurrentPlayer().name} called UNO`);
    this.gameState.setUnoCalled();
  }

  // Game play methods
  playCard(cardIndex) {
    console.log(`[DEBUG ClassicGame.playCard] Attempting to play card at index ${cardIndex} for player ${this.getCurrentPlayer().name}`);

    // Call the gameState's playCard method
    const result = this.gameState.playCard(cardIndex);
    console.log(`[DEBUG ClassicGame.playCard] Raw result from gameState:`, {
      cardPlayed: result.card ? result.card.toString() : null,
      win: result.win,
      drawPenalty: result.drawPenalty,
      skipNext: result.skipNext,
      skipEveryone: result.skipEveryone,
      reverse: result.reverse,
      discardAll: result.discardAll,
      wildColorRoulette: result.wildColorRoulette,
      colorChange: result.colorChange
    });

    // Adapt the return value to match what renderer expects
    // renderer expects: {card, win, draw, skip, color}
    // gameState returns: {card, win, drawPenalty, skipNext, reverse, skipEveryone, discardAll, wildColorRoulette, colorChange}

    let draw = 0;
    let skip = false;
    let color = null;

    // Handle draw penalty
    if (result.drawPenalty > 0) {
      draw = result.drawPenalty;
      console.log(`[DEBUG ClassicGame.playCard] Draw penalty: ${draw}`);
    }

    // Handle skip effects
    if (result.skipNext || result.skipEveryone) {
      skip = true;
      console.log(`[DEBUG ClassicGame.playCard] Skip effect: true`);
    }

    // Handle color change (for wild cards)
    if (result.colorChange !== null) {
      color = result.colorChange;
      console.log(`[DEBUG ClassicGame.playCard] Color change: ${color}`);
    }

    // For Wild Color Roulette, we need to pick a random color
    // For simplicity, we'll just pick red here; in a real game we'd prompt for color selection
    if (result.wildColorRoulette) {
      // In a real implementation, we'd let the player choose a color
      // For now, we'll just pick a random color
      const COLORS = ['red', 'yellow', 'green', 'blue'];
      color = COLORS[Math.floor(Math.random() * COLORS.length)];
      console.log(`[DEBUG ClassicGame.playCard] Wild Color Roulette - selected color: ${color}`);
    }

    const adaptedResult = {
      card: result.card,
      win: result.win,
      draw: draw,
      skip: skip,
      color: color
    };

    console.log(`[DEBUG ClassicGame.playCard] Final adapted result:`, {
      cardPlayed: adaptedResult.card ? adaptedResult.card.toString() : null,
      win: adaptedResult.win,
      draw: adaptedResult.draw,
      skip: adaptedResult.skip,
      color: adaptedResult.color
    });

    return adaptedResult;
  }

  // Draw card for a specific player
  drawCardForPlayer(playerIndex) {
    console.log(`[DEBUG ClassicGame.drawCardForPlayer] Drawing card for player index ${playerIndex}`);

    // If deck is empty, reshuffle discard pile
    if (this.gameState.deck.isEmpty()) {
      console.log(`[DEBUG ClassicGame.drawCardForPlayer] Deck is empty, reshuffling discard pile`);
      this.reshuffleDiscard();
    }
    const card = this.gameState.deck.draw();
    console.log(`[DEBUG ClassicGame.drawCardForPlayer] Drew card: ${card ? card.toString() : 'null'}`);

    const player = this.gameState.players[playerIndex];
    if (card) {
      player.addCard(card);
      console.log(`[DEBUG ClassicGame.drawCardForPlayer] Added card to player ${player.name}'s hand, new hand size: ${player.handSize()}`);
    }
    return card;
  }

  // Draw card for current player
  drawCard() {
    console.log(`[DEBUG ClassicGame.drawCard] Drawing card for current player`);
    return this.drawCardForPlayer(this.getCurrentPlayerIndex());
  }

  // Check if a card is playable
  isPlayable(cardIndex) {
    console.log(`[DEBUG ClassicGame.isPlayable] Checking if card at index ${cardIndex} is playable for player ${this.getCurrentPlayer().name}`);
    const checkResult = this.gameState.checkPlayable(cardIndex);
    const playable = checkResult.playable;
    console.log(`[DEBUG ClassicGame.isPlayable] Card is playable: ${playable}`);
    return playable;
  }

  // Challenge previous player for not saying UNO
  challengePreviousPlayer() {
    console.log(`[DEBUG ClassicGame.challengePreviousPlayer] Challenging previous player`);
    const result = this.gameState.challengePreviousPlayer();
    console.log(`[DEBUG ClassicGame.challengePreviousPlayer] Challenge result: ${result}`);
    return result;
  }

  // Advance to the next player's turn. Direction changes (from Reverse cards)
  // are already applied inside GameState.playCard(), so we only need to move
  // the player index here. The renderer handles Skip/Draw penalties locally.
  nextTurn() {
    console.log(`[DEBUG ClassicGame.nextTurn] Advancing turn from player ${this.getCurrentPlayer().name} (index: ${this.gameState.currentPlayerIndex})`);
    console.log(`[DEBUG ClassicGame.nextTurn] Current direction: ${this.gameState.direction}`);

    this.gameState.currentPlayerIndex += this.gameState.direction;
    this.wrapPlayerIndex();
    this.gameState.resetUnoTracking();

    // Keep exposed properties in sync
    this.direction = this.gameState.direction;
    this.currentPlayerIndex = this.gameState.currentPlayerIndex;
    this.gameOver = this.gameState.gameOver;
    this.winner = this.gameState.winner;

    console.log(`[DEBUG ClassicGame.nextTurn] Advanced to player ${this.getCurrentPlayer().name} (index: ${this.gameState.currentPlayerIndex})`);
    console.log(`[DEBUG ClassicGame.nextTurn] New direction: ${this.gameState.direction}`);
  }

  // End turn (alias for nextTurn, kept for backwards compatibility)
  endTurn() {
    console.log(`[DEBUG ClassicGame.endTurn] Ending turn (calling nextTurn)`);
    this.nextTurn();
  }

  // Helper method to wrap player index
  wrapPlayerIndex() {
    console.log(`[DEBUG ClassicGame.wrapPlayerIndex] Wrapping player index ${this.gameState.currentPlayerIndex}`);
    let oldIndex = this.gameState.currentPlayerIndex;
    if (this.gameState.currentPlayerIndex >= this.gameState.players.length) {
      this.gameState.currentPlayerIndex = 0;
      console.log(`[DEBUG ClassicGame.wrapPlayerIndex] Wrapped from ${oldIndex} to 0`);
    } else if (this.gameState.currentPlayerIndex < 0) {
      this.gameState.currentPlayerIndex = this.gameState.players.length - 1;
      console.log(`[DEBUG ClassicGame.wrapPlayerIndex] Wrapped from ${oldIndex} to ${this.gameState.players.length - 1}`);
    } else {
      console.log(`[DEBUG ClassicGame.wrapPlayerIndex] Index ${oldIndex} is already in bounds`);
    }
  }

  // Reshuffle discard pile
  reshuffleDiscard() {
    console.log(`[DEBUG ClassicGame.reshuffleDiscard] Reshuffling discard pile`);
    this.gameState.reshuffleDiscard();
    this.discardPile = this.gameState.discardPile; // Update exposed property
    console.log(`[DEBUG ClassicGame.reshuffleDiscard] Discard pile reshuffled, new size: ${this.discardPile.length}`);
  }

  // Check if game is over
  isGameOver() {
    const result = this.gameState.isGameOver();
    console.log(`[DEBUG ClassicGame.isGameOver] Game over: ${result}`);
    return result;
  }

  // Get winner
  getWinner() {
    const winner = this.gameState.getWinner();
    console.log(`[DEBUG ClassicGame.getWinner] Winner: ${winner ? winner.name : 'null'}`);
    return winner;
  }
}