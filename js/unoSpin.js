// UnoSpinGameState class representing the state of a UNO Spin game
import { Deck } from './deck.js';
import { Player } from './player.js';
import { Card } from './card.js';
import { COLORS } from '../constants.js';

export class UnoSpinGameState {
  /**
   * @param {string[]} playerNames - Array of player names
   * @param {number} aiCount - Number of AI players (0-3)
   */
  constructor(playerNames, aiCount = 0) {
    console.log(`[DEBUG UnoSpinGameState] Constructor called with playerNames: ${playerNames}, aiCount: ${aiCount}`);
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

    // Spin wheel tracking
    this.spinResult = null;

    console.log(`[DEBUG UnoSpinGameState] Initialized with ${this.players.length} players`);
  }

  /**
   * Get the current player index
   * @returns {number} Index of the current player
   */
  getCurrentPlayerIndex() {
    const index = this.currentPlayerIndex;
    console.log(`[DEBUG UnoSpinGameState.getCurrentPlayerIndex] Returning: ${index}`);
    return index;
  }

  /**
   * Get the current player object
   * @returns {Player} The current player
   */
  getCurrentPlayer() {
    const player = this.players[this.currentPlayerIndex];
    console.log(`[DEBUG UnoSpinGameState.getCurrentPlayer] Returning player: ${player.name} (index: ${this.currentPlayerIndex})`);
    return player;
  }

  /**
   * Get the top card of the discard pile
   * @returns {Card|null} The top card
   */
  getTopCard() {
    const card = this.discardPile[this.discardPile.length - 1] || null;
    console.log(`[DEBUG UnoSpinGameState.getTopCard] Returning: ${card ? card.toString() : 'null'}`);
    return card;
  }

  /**
   * Get the current game state
   * @returns {Object} The current game state
   */
  getState() {
    console.log(`[DEBUG UnoSpinGameState.getState] Getting state for player ${this.currentPlayerIndex}`);
    const state = {
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
    console.log(`[DEBUG UnoSpinGameState.getState] State:`, {
      currentPlayer: state.players[state.currentPlayerIndex]?.name,
      handSize: state.players[state.currentPlayerIndex]?.handSize,
      topCard: state.topCard?.toString(),
      currentColor: state.currentColor,
      direction: state.direction
    });
    return state;
  }

  /**
   * Get UNO state for the current player
   * @returns {Object} UNO state information
   */
  getUnoState() {
    console.log(`[DEBUG UnoSpinGameState.getUnoState] Getting UNO state for player ${this.getCurrentPlayerIndex()}`);
    const playerIndex = this.getCurrentPlayerIndex();
    const player = this.getCurrentPlayer();
    const unoCalled = this.unoCalled[playerIndex];
    const unoSaid = this.unoSaid[playerIndex];

    const result = {
      handSize: player.handSize(),
      unoCalled: unoCalled,
      unoSaid: unoSaid,
      needsUno: player.handSize() === 1 && !unoCalled
    };

    console.log(`[DEBUG UnoSpinGameState.getUnoState] UNO state:`, {
      handSize: result.handSize,
      unoCalled: result.unoCalled,
      unoSaid: result.unoSaid,
      needsUno: result.needsUno
    });

    return result;
  }

  /**
   * Mark that the current player has called UNO
   */
  sayUNO() {
    console.log(`[DEBUG UnoSpinGameState.sayUNO] Player ${this.getCurrentPlayer().name} called UNO`);
    const playerIndex = this.getCurrentPlayerIndex();
    this.unoCalled[playerIndex] = true;
    this.unoSaid[playerIndex] = true;
  }

  /**
   * Set that the current player has called UNO (for compatibility)
   */
  setUnoCalled() {
    console.log(`[DEBUG UnoSpinGameState.setUnoCalled] Setting UNO called for player ${this.getCurrentPlayer().name}`);
    this.sayUNO();
  }

  /**
   * Play a card from a player's hand
   * @param {number} cardIndex - Index of the card in the player's hand
   * @returns {Object} Result of playing the card
   */
  playCard(cardIndex) {
    console.log(`[DEBUG UnoSpinGameState.playCard] Attempting to play card at index ${cardIndex} for player ${this.getCurrentPlayer().name}`);

    const player = this.getCurrentPlayer();
    if (cardIndex < 0 || cardIndex >= player.hand.length) {
      console.log(`[DEBUG UnoSpinGameState.playCard] Invalid card index: ${cardIndex}, hand size: ${player.hand.length}`);
      return { card: null, win: false, draw: 0, skip: false, color: null };
    }

    const cardToPlay = player.hand[cardIndex];
    const topCard = this.getTopCard();
    console.log(`[DEBUG UnoSpinGameState.playCard] Playing card: ${cardToPlay.toString()}, top card: ${topCard ? topCard.toString() : 'none'}`);

    // Check if card is playable
    if (!this.isPlayable(cardIndex)) {
      console.log(`[DEBUG UnoSpinGameState.playCard] Card is not playable`);
      return { card: null, win: false, draw: 0, skip: false, color: null };
    }

    // Remove card from player's hand
    const playedCard = player.removeCard(cardIndex);
    console.log(`[DEBUG UnoSpinGameState.playCard] Removed card from hand, new hand size: ${player.handSize()}`);

    // Add to discard pile
    this.discardPile.push(playedCard);
    console.log(`[DEBUG UnoSpinGameState.playCard] Added to discard pile, new discard pile size: ${this.discardPile.length}`);

    // Check for win
    const win = player.handSize() === 0;
    if (win) {
      console.log(`[DEBUG UnoSpinGameState.playCard] Player ${player.name} has won!`);
      this.gameOver = true;
      this.winner = player;
    }

    // Handle special card effects
    let draw = 0;
    let skip = false;
    let color = null;
    let spinWheel = false;

    // Handle draw penalties
    if (playedCard.isDrawCard()) {
      draw = playedCard.getDrawValue();
      this.drawPenalty = draw;
      this.drawPenaltyActive = true;
      console.log(`[DEBUG UnoSpinGameState.playCard] Draw card played, draw value: ${draw}`);
    }

    // Handle skip/reverse
    if (playedCard.value === 'skip' || playedCard.value === 'skip_everyone') {
      skip = true;
      console.log(`[DEBUG UnoSpinGameState.playCard] Skip card played`);
    } else if (playedCard.value === 'reverse') {
      this.direction *= -1; // Reverse direction
      console.log(`[DEBUG UnoSpinGameState.playCard] Reverse card played, new direction: ${this.direction}`);
    }

    // Handle wild cards and color changes
    if (playedCard.isWild()) {
      // For simplicity, we'll auto-select a color
      // In a real game, the player would choose
      const availableColors = COLORS.filter(c => c !== 'wild');
      color = availableColors[Math.floor(Math.random() * availableColors.length)];
      this.currentColor = color;
      console.log(`[DEBUG UnoSpinGameState.playCard] Wild card played, selected color: ${color}`);
    }

    // Handle special wild cards from Uno Spin deck
    switch (playedCard.value) {
      case 'wild_draw6':
        draw = 6;
        this.drawPenalty = draw;
        this.drawPenaltyActive = true;
        console.log(`[DEBUG UnoSpinGameState.playCard] Wild draw 6 played, draw 6`);
        // Color will be set below
        break;
      case 'wild_draw10':
        draw = 10;
        this.drawPenalty = draw;
        this.drawPenaltyActive = true;
        console.log(`[DEBUG UnoSpinGameState.playCard] Wild draw 10 played, draw 10`);
        // Color will be set below
        break;
      case 'spin_wheel':
        // Spin the wheel for a random effect
        this.spinWheel();
        spinWheel = true;
        console.log(`[DEBUG UnoSpinGameState.playCard] Spin wheel played, result: ${this.spinResult}`);

        // Capture color for wild spin wheel results
        if (this.spinResult === 'wild' || this.spinResult === 'wild_draw_four') {
          color = this.currentColor;
          console.log(`[DEBUG UnoSpinGameState.playCard] Spin wheel wild/wild_draw_four, color: ${color}`);
        }
        break;
    }

    // If we haven't set a color from a wild card, check if we need to maintain current color
    if (!color && !playedCard.isWild()) {
      // If there's a current color from a previous wild card, we need to match it
      if (this.currentColor) {
        color = this.currentColor;
        console.log(`[DEBUG UnoSpinGameState.playCard] Maintaining current color: ${this.currentColor}`);
      }
    }

    // Determine skip effects
    let skipNext = false;
    let skipEveryone = false;
    if (playedCard.value === 'skip') {
      skipNext = true;
      console.log(`[DEBUG UnoSpinGameState.playCard] Skip effect: next player skipped`);
    } else if (playedCard.value === 'skip_everyone') {
      skipEveryone = true;
      console.log(`[DEBUG UnoSpinGameState.playCard] Skip effect: all players skipped`);
    } else if (playedCard.value === 'draw2' || playedCard.value === 'wild_draw4') {
      // In this implementation, Draw Two and Wild Draw Four also skip the next player
      skipNext = true;
      console.log(`[DEBUG UnoSpinGameState.playCard] Skip effect from draw card: next player skipped`);
    } else if (playedCard.value === 'spin_wheel') {
      // Check spin wheel result for skip effects
      if (this.spinResult === 'skip') {
        skipNext = true;
        console.log(`[DEBUG UnoSpinGameState.playCard] Skip effect from spin wheel: next player skipped`);
      }
      // Note: spin wheel doesn't have skip_everyone effect
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
      colorChange: color,
      spinWheel: spinWheel
    };

    console.log(`[DEBUG UnoSpinGameState.playCard] Play result:`, {
      cardPlayed: playedCard ? playedCard.toString() : null,
      win,
      drawPenalty: draw,
      skipNext,
      skipEveryone,
      reverse: playedCard.value === 'reverse',
      discardAll: playedCard.value === 'discard_all',
      wildColorRoulette: playedCard.value === 'wild_color_roulette',
      colorChange: color,
      spinWheel: spinWheel
    });

    return result;
  }

  /**
   * Spin the wheel for a random effect
   */
  spinWheel() {
    console.log(`[DEBUG UnoSpinGameState.spinWheel] Spinning the wheel`);
    const spinResults = [
      'draw_two',
      'draw_four',
      'reverse',
      'skip',
      'discard_two',
      'trade_hands',
      'show_hand',
      'wild',
      'wild_draw_four',
      'rotate_discard'
    ];

    this.spinResult = spinResults[Math.floor(Math.random() * spinResults.length)];
    console.log(`[DEBUG UnoSpinGameState.spinWheel] Spin result: ${this.spinResult}`);

    // Apply the spin result
    switch (this.spinResult) {
      case 'draw_two':
        this.drawPenalty = 2;
        this.drawPenaltyActive = true;
        console.log(`[DEBUG UnoSpinGameState.spinWheel] Draw two penalty: 2`);
        break;
      case 'draw_four':
        this.drawPenalty = 4;
        this.drawPenaltyActive = true;
        console.log(`[DEBUG UnoSpinGameState.spinWheel] Draw four penalty: 4`);
        break;
      case 'reverse':
        this.direction *= -1;
        console.log(`[DEBUG UnoSpinGameState.spinWheel] Direction reversed, new direction: ${this.direction}`);
        break;
      case 'skip':
        // Skip next player
        console.log(`[DEBUG UnoSpinGameState.spinWheel] Skip next player`);
        break;
      case 'discard_two':
        // Current player discards 2 random cards
        const player = this.getCurrentPlayer();
        console.log(`[DEBUG UnoSpinGameState.spinWheel] Player ${player.name} discarding 2 random cards`);
        if (player.hand.length >= 2) {
          const indices = [];
          for (let i = 0; i < 2; i++) {
            indices.push(Math.floor(Math.random() * player.hand.length));
          }
          // Sort descending to remove from end first
          indices.sort((a, b) => b - a);
          for (const index of indices) {
            player.hand.splice(index, 1);
          }
          console.log(`[DEBUG UnoSpinGameState.spinWheel] Player ${player.name} hand size after discard: ${player.handSize()}`);
        }
        break;
      case 'trade_hands':
        // Trade hands with next player
        const currentPlayer = this.getCurrentPlayer();
        const nextIndex = this.wrapPlayerIndex(this.currentPlayerIndex + this.direction);
        const nextPlayer = this.players[nextIndex];
        console.log(`[DEBUG UnoSpinGameState.spinWheel] Trading hands between ${currentPlayer.name} and ${nextPlayer.name}`);
        [currentPlayer.hand, nextPlayer.hand] = [nextPlayer.hand, currentPlayer.hand];
        break;
      case 'show_hand':
        // All players show their hands (no gameplay effect, just for fun)
        console.log(`[DEBUG UnoSpinGameState.spinWheel] All players showing hands`);
        break;
      case 'wild':
        // Wild card - choose a color
        const wildColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.currentColor = wildColor;
        console.log(`[DEBUG UnoSpinGameState.spinWheel] Wild card, selected color: ${wildColor}`);
        break;
      case 'wild_draw_four':
        // Wild Draw Four - choose color and next player draws 4
        const wildFourColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.currentColor = wildFourColor;
        this.drawPenalty = 4;
        this.drawPenaltyActive = true;
        console.log(`[DEBUG UnoSpinGameState.spinWheel] Wild draw four, color: ${wildFourColor}, penalty: 4`);
        break;
      case 'rotate_discard':
        // Rotate the discard pile (move bottom to top)
        if (this.discardPile.length > 1) {
          const bottomCard = this.discardPile.shift();
          this.discardPile.push(bottomCard);
          console.log(`[DEBUG UnoSpinGameState.spinWheel] Rotated discard pile`);
        }
        break;
    }
  }

  /**
   * Check if a card at the given index is playable
   * @param {number} cardIndex - Index of the card in the current player's hand
   * @returns {{playable: boolean}} Object indicating if the card is playable
   */
  checkPlayable(cardIndex) {
    console.log(`[DEBUG UnoSpinGameState.checkPlayable] Checking if card at index ${cardIndex} is playable for player ${this.getCurrentPlayer().name}`);
    const player = this.getCurrentPlayer();
    if (cardIndex < 0 || cardIndex >= player.hand.length) {
      console.log(`[DEBUG UnoSpinGameState.checkPlayable] Invalid card index: ${cardIndex}, hand size: ${player.hand.length}`);
      return { playable: false };
    }

    const card = player.hand[cardIndex];
    const topCard = this.getTopCard();
    if (!topCard) return { playable: true }; // First play of the game

    // Check if there's an active draw penalty - if so, we can only play draw cards to stack
    if (this.drawPenaltyActive) {
      const playable = card.isDrawCard();
      console.log(`[DEBUG UnoSpinGameState.checkPlayable] Active draw penalty, card is draw card: ${playable}`);
      return { playable: playable };
    }

    // Use the player's isPlayable method which considers currentColor
    const playable = player.isPlayable(card, topCard, this.currentColor);
    console.log(`[DEBUG UnoSpinGameState.checkPlayable] Card is playable: ${playable}`);
    return { playable: playable };
  }

  /**
   * Check if a card at the given index is playable
   * @param {number} cardIndex - Index of the card in the current player's hand
   * @returns {boolean} True if the card is playable
   */
  isPlayable(cardIndex) {
    console.log(`[DEBUG UnoSpinGameState.isPlayable] Checking if card at index ${cardIndex} is playable for player ${this.getCurrentPlayer().name}`);
    const playable = this.checkPlayable(cardIndex).playable;
    console.log(`[DEBUG UnoSpinGameState.isPlayable] Card is playable: ${playable}`);
    return playable;
  }

  /**
   * Draw a card for a specific player
   * @param {number} playerIndex - Index of the player to draw for
   * @returns {Card|null} The drawn card
   */
  drawCardForPlayer(playerIndex) {
    console.log(`[DEBUG UnoSpinGameState.drawCardForPlayer] Drawing card for player index ${playerIndex}`);
    // If deck is empty, reshuffle discard pile (except top card)
    if (this.deck.remaining() === 0) {
      console.log(`[DEBUG UnoSpinGameState.drawCardForPlayer] Deck is empty, reshuffling discard pile`);
      this.reshuffleDiscard();
    }

    const card = this.deck.draw();
    console.log(`[DEBUG UnoSpinGameState.drawCardForPlayer] Drew card: ${card ? card.toString() : 'null'}`);
    if (card) {
      this.players[playerIndex].addCard(card);
      console.log(`[DEBUG UnoSpinGameState.drawCardForPlayer] Added card to player ${this.players[playerIndex].name}'s hand, new hand size: ${this.players[playerIndex].handSize()}`);
    }
    return card;
  }

  /**
   * Draw a card for the current player
   * @returns {Card|null} The drawn card
   */
  drawCard() {
    console.log(`[DEBUG UnoSpinGameState.drawCard] Drawing card for current player`);
    return this.drawCardForPlayer(this.getCurrentPlayerIndex());
  }

  /**
   * Challenge the previous player for not saying UNO
   * @returns {boolean} True if the challenge was successful
   */
  challengePreviousPlayer() {
    console.log(`[DEBUG UnoSpinGameState.challengePreviousPlayer] Challenging previous player`);
    // Get the previous player (accounting for direction)
    const prevIndex = this.currentPlayerIndex - this.direction;
    const wrappedPrevIndex = this.wrapPlayerIndex(prevIndex);

    // Check if the previous player had UNO to say but didn't
    const prevPlayer = this.players[wrappedPrevIndex];
    if (prevPlayer.handSize() === 1 && !this.unoCalled[wrappedPrevIndex]) {
      // Challenge successful - previous player must draw 2 cards
      console.log(`[DEBUG UnoSpinGameState.challengePreviousPlayer] Challenge successful, player ${prevPlayer.name} must draw 2 cards`);
      for (let i = 0; i < 2; i++) {
        this.drawCardForPlayer(wrappedPrevIndex);
      }
      return true;
    }

    // Challenge unsuccessful - challenger must draw 2 cards
    console.log(`[DEBUG UnoSpinGameState.challengePreviousPlayer] Challenge unsuccessful, challenger must draw 2 cards`);
    for (let i = 0; i < 2; i++) {
      this.drawCardForPlayer(this.getCurrentPlayerIndex());
    }
    return false;
  }

  /**
   * Advance to the next player's turn
   */
  nextTurn() {
    console.log(`[DEBUG UnoSpinGameState.nextTurn] Advancing turn from player ${this.getCurrentPlayer().name} (index: ${this.currentPlayerIndex})`);
    console.log(`[DEBUG UnoSpinGameState.nextTurn] Current direction: ${this.direction}`);
    // Move to next player based on direction
    this.currentPlayerIndex += this.direction;
    this.wrapPlayerIndex(this.currentPlayerIndex);

    // Reset UNO tracking for the new turn
    this.resetUnoTracking();

    console.log(`[DEBUG UnoSpinGameState.nextTurn] Advanced to player ${this.getCurrentPlayer().name} (index: ${this.currentPlayerIndex})`);
    console.log(`[DEBUG UnoSpinGameState.nextTurn] New direction: ${this.direction}`);
  }

  /**
   * End turn (alias for nextTurn)
   */
  endTurn() {
    console.log(`[DEBUG UnoSpinGameState.endTurn] Ending turn (calling nextTurn)`);
    this.nextTurn();
  }

  /**
   * Wrap player index to stay within bounds
   * @param {number} index - Player index to wrap
   * @returns {number} Wrapped player index
   */
  wrapPlayerIndex(index) {
    console.log(`[DEBUG UnoSpinGameState.wrapPlayerIndex] Wrapping player index ${index}`);
    let oldIndex = this.currentPlayerIndex;
    if (index >= this.players.length) {
      this.currentPlayerIndex = 0;
      console.log(`[DEBUG UnoSpinGameState.wrapPlayerIndex] Wrapped from ${oldIndex} to 0`);
    } else if (index < 0) {
      this.currentPlayerIndex = this.players.length - 1;
      console.log(`[DEBUG UnoSpinGameState.wrapPlayerIndex] Wrapped from ${oldIndex} to ${this.players.length - 1}`);
    } else {
      this.currentPlayerIndex = index;
      console.log(`[DEBUG UnoSpinGameState.wrapPlayerIndex] Index ${oldIndex} is already in bounds`);
    }
    return this.currentPlayerIndex;
  }

  /**
   * Reset UNO tracking for the current player
   */
  resetUnoTracking() {
    console.log(`[DEBUG UnoSpinGameState.resetUnoTracking] Resetting UNO tracking for player ${this.getCurrentPlayer().name}`);
    const playerIndex = this.getCurrentPlayerIndex();
    this.unoCalled[playerIndex] = false;
    // Note: unoSaid stays true if the player actually said UNO
  }

  /**
   * Reshuffle the discard pile into the deck (keeping the top card)
   */
  reshuffleDiscard() {
    console.log(`[DEBUG UnoSpinGameState.reshuffleDiscard] Reshuffling discard pile`);
    if (this.discardPile.length <= 1) return; // Nothing to reshuffle

    // Keep the top card
    const topCard = this.discardPile.pop();
    console.log(`[DEBUG UnoSpinGameState.reshuffleDiscard] Kept top card: ${topCard.toString()}`);

    // Shuffle the rest into the deck
    while (this.discardPile.length > 0) {
      this.deck.addCard(this.discardPile.pop());
    }

    this.deck.shuffle();
    console.log(`[DEBUG UnoSpinGameState.reshuffleDiscard] Deck shuffled, new size: ${this.deck.remaining()}`);

    // Put the top card back
    this.discardPile.push(topCard);
    console.log(`[DEBUG UnoSpinGameState.reshuffleDiscard] Discard pile reshuffled, new size: ${this.discardPile.length}`);
  }

  /**
   * Check if the game is over
   * @returns {boolean} True if the game is over
   */
  isGameOver() {
    const result = this.gameOver;
    console.log(`[DEBUG UnoSpinGameState.isGameOver] Game over: ${result}`);
    return result;
  }

  /**
   * Get the winner of the game
   * @returns {Player|null} The winning player
   */
  getWinner() {
    const winner = this.winner || null;
    console.log(`[DEBUG UnoSpinGameState.getWinner] Winner: ${winner ? winner.name : 'null'}`);
    return winner;
  }
}