// Test for UNO Show 'Em No Mercy ClassicGame
const { ClassicGame } = require('../js/classicGame.js');
const { Card } = require('../js/card.js');
const { COLORS } = require('../constants.js');

console.log('Testing ClassicGame...');

// Test 1: Creating a new game
{
  const game = new ClassicGame(['Human'], 2); // 1 human, 2 AI
  console.log(`Test 1: Created game with ${game.players.length} players`);
  if (game.players.length === 3) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }

  // Check that we have 1 human and 2 AI players
  const humanCount = game.players.filter(p => !p.isAI).length;
  const aiCount = game.players.filter(p => p.isAI).length;
  if (humanCount === 1 && aiCount === 2) {
    console.log('✓ PASS: Correct player types');
  } else {
    console.log('✗ FAIL: Incorrect player types');
  }
}

// Test 2: Initial deal (7 cards each)
{
  const game = new ClassicGame(['Human'], 1); // 1 human, 1 AI
  const humanHandSize = game.players[0].handSize();
  const aiHandSize = game.players[1].handSize();
  console.log(`Test 2: Human hand size: ${humanHandSize}, AI hand size: ${aiHandSize}`);
  if (humanHandSize === 7 && aiHandSize === 7) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }
}

// Test 3: Starting discard pile (should not be a wild card)
{
  const game = new ClassicGame(['Human'], 1);
  const topCard = game.getTopCard();
  console.log(`Test 3: Starting discard card: ${topCard.toString()}`);

  // Check that it's not a wild card (wild cards have color === 'wild')
  const isWild = topCard.color === 'wild';

  if (!isWild) {
    console.log('✓ PASS: Starting card is not wild');
  } else {
    console.log('✗ FAIL: Starting card is wild');
  }
}

// Test 4: Playing a matching color card
{
  const game = new ClassicGame(['Human'], 0); // Just human player
  // Force a known top card for testing
  game.discardPile = [new Card('red', 5)];
  game.currentColor = 'red';

  // Give human player a matching card
  game.players[0].hand = [new Card('red', 3)]; // Same color

  const playable = game.isPlayable(0);
  console.log(`Test 4: Red 3 playable on Red 5: ${playable} (expected true)`);
  if (playable) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }
}

// Test 5: Playing a matching value card
{
  const game = new ClassicGame(['Human'], 0); // Just human player
  // Force a known top card for testing
  game.discardPile = [new Card('red', 5)];
  game.currentColor = 'red';

  // Give human player a matching value card (different color)
  game.players[0].hand = [new Card('blue', 5)]; // Same value

  const playable = game.isPlayable(0);
  console.log(`Test 5: Blue 5 playable on Red 5: ${playable} (expected true)`);
  if (playable) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }
}

// Test 6: Playing a wild card
{
  const game = new ClassicGame(['Human'], 0); // Just human player
  // Force a known top card for testing
  game.discardPile = [new Card('red', 5)];
  game.currentColor = 'red';

  // Give human player a wild card
  game.players[0].hand = [new Card('wild', 'wild')];

  const playable = game.isPlayable(0);
  console.log(`Test 6: Wild playable on Red 5: ${playable} (expected true)`);
  if (playable) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }
}

// Test 7: Drawing cards
{
  const game = new ClassicGame(['Human'], 0);
  const initialDeckSize = game.deck.remaining();
  const card = game.drawCard();
  const finalDeckSize = game.deck.remaining();
  console.log(`Test 7: Drew card. Deck size: ${initialDeckSize} -> ${finalDeckSize}`);
  if (finalDeckSize === initialDeckSize - 1) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }
}

// Test 8: Playing a Draw Two card
{
  const game = new ClassicGame(['Human'], 1); // Human and AI
  // Force a known top card for testing
  game.discardPile = [new Card('red', 5)];
  game.currentColor = 'red';

  // Give human player a Draw Two card
  game.players[0].hand = [new Card('red', 'draw2')];

  // Play the card
  const result = game.playCard(0);
  console.log(`Test 8: Drew cards from Draw Two: ${result.draw} (expected 2)`);
  console.log(`Test 8: Skip flag from Draw Two: ${result.skip} (expected true)`);
  if (result.draw === 2 && result.skip === true) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }
}

// Test 9: Playing a Wild Draw Four card
{
  const game = new ClassicGame(['Human'], 1); // Human and AI
  // Force a known top card for testing
  game.discardPile = [new Card('red', 5)];
  game.currentColor = 'red';

  // Give human player a Wild Draw Four card
  game.players[0].hand = [new Card('wild', 'wild_draw4')];

  // Play the card
  const result = game.playCard(0);
  console.log(`Test 9: Drew cards from Wild Draw Four: ${result.draw} (expected 4)`);
  console.log(`Test 9: Skip flag from Wild Draw Four: ${result.skip} (expected true)`);
  if (result.draw === 4 && result.skip === true) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }
}

// Test 10: Playing a Reverse card
{
  const game = new ClassicGame(['Human'], 2); // Human and 2 AI (3 players total)
  // Force a known top card for testing
  game.discardPile = [new Card('red', 5)];
  game.currentColor = 'red';

  // Give human player a Reverse card
  game.players[0].hand = [new Card('red', 'reverse')];

  // Play the card
  const result = game.playCard(0);
  console.log(`Test 10: Direction after Reverse: ${game.direction} (expected -1)`);
  if (game.direction === -1) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }
}

// Test 11: Playing a Skip card
{
  const game = new ClassicGame(['Human'], 2); // Human and 2 AI (3 players total)
  // Force a known top card for testing
  game.discardPile = [new Card('red', 5)];
  game.currentColor = 'red';

  // Give human player a Skip card
  game.players[0].hand = [new Card('red', 'skip')];

  // Play the card
  const result = game.playCard(0);
  console.log(`Test 11: Skip flag from Skip card: ${result.skip} (expected true)`);
  if (result.skip === true) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }
}

// Test 12: Check for win condition
{
  const game = new ClassicGame(['Human'], 0);
  // Force a known top card for testing
  game.discardPile = [new Card('red', 5)];
  game.currentColor = 'red';

  // Give human player one card
  game.players[0].hand = [new Card('red', 3)];

  // Play the card (should result in win)
  const result = game.playCard(0);
  console.log(`Test 12: Win condition after playing last card: ${result.win} (expected true)`);
  console.log(`Test 12: Game over flag: ${game.gameOver} (expected true)`);
  console.log(`Test 12: Winner: ${game.winner ? game.winner.name : 'null'} (expected 'Human')`);
  if (result.win && game.gameOver && game.winner && game.winner.name === 'Human') {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }
}

// Test 13: UNO state tracking
{
  const game = new ClassicGame(['Human'], 0);
  // Force a known top card for testing
  game.discardPile = [new Card('red', 5)];
  game.currentColor = 'red';

  // Give human player two cards
  game.players[0].hand = [new Card('red', 3), new Card('yellow', 2)];

  // Check UNO state before playing
  let unoState = game.getUnoState();
  console.log(`Test 13a: UNO needed with 2 cards: ${unoState.needsUno} (expected false)`);
  console.log(`Test 13a: UNO said with 2 cards: ${unoState.unoSaid} (expected false)`);

  // Play one card (should leave 1 card)
  game.playCard(0);

  // Check UNO state after playing
  unoState = game.getUnoState();
  console.log(`Test 13b: UNO needed with 1 card: ${unoState.needsUno} (expected true)`);
  console.log(`Test 13b: UNO said with 1 card: ${unoState.unoSaid} (expected false, requires manual UNO call)`);

  // Call UNO
  game.sayUNO();

  // Check UNO state after calling UNO
  unoState = game.getUnoState();
  console.log(`Test 13c: UNO needed with 1 card after UNO call: ${unoState.needsUno} (expected true)`);
  console.log(`Test 13c: UNO said with 1 card after UNO call: ${unoState.unoSaid} (expected true)`);

  if (unoState.needsUno && unoState.unoSaid) { // After calling UNO, the player still has one card and has said UNO
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }
}

// Test 14: Challenging UNO
{
  const game = new ClassicGame(['Human'], 1); // Human and AI
  // Force a known top card for testing
  game.discardPile = [new Card('red', 5)];
  game.currentColor = 'red';

  // Set up AI player with one card and UNO not said
  game.players[1].hand = [new Card('blue', 3)]; // AI has one card
  game.unoSaid[1] = false; // AI didn't say UNO

  // Set human player turn (so we can challenge the AI)
  game.currentPlayerIndex = 0;

  // Challenge the previous player (AI)
  const success = game.challengePreviousPlayer();
  console.log(`Test 14: Challenge success when AI had 1 card and didn't say UNO: ${success} (expected true)`);
  console.log(`Test 14: AI hand size after challenge: ${game.players[1].handSize()} (expected 3, drew 2 cards)`);
  if (success && game.players[1].handSize() === 3) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }
}

console.log('\nClassicGame tests completed.');