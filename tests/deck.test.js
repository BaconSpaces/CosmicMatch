// Test for UNO Show 'Em No Mercy Deck
const { Deck } = require('../js/deck.js');
const { Card } = require('../js/card.js');

console.log('Testing Deck...');

// Create a new deck
const deck = new Deck();

// Test 1: Deck should have 168 cards
console.log(`Test 1: Deck has ${deck.remaining()} cards (expected 168)`);
if (deck.remaining() === 168) {
  console.log('✓ PASS');
} else {
  console.log('✗ FAIL');
}

// Test 2: Check distribution of card types
const cards = deck.getCards();

// Count number cards (0-9 in 4 colors)
let numberCount = 0;
let colorActionCount = 0;
let wildActionCount = 0;

const colorActionValues = ['skip', 'reverse', 'draw2', 'draw4', 'discard_all', 'skip_everyone'];
const wildActionValues = ['wild', 'wild_reverse_draw4', 'wild_draw6', 'wild_draw10', 'wild_color_roulette'];

for (const card of cards) {
  if (card.isNumber()) {
    numberCount++;
  } else if (!card.isWild() && colorActionValues.includes(card.value)) {
    colorActionCount++;
  } else if (card.isWild() && wildActionValues.includes(card.value)) {
    wildActionCount++;
  }
}

console.log(`Test 2a: Number cards: ${numberCount} (expected 76)`);
if (numberCount === 76) {
  console.log('✓ PASS');
} else {
  console.log('✗ FAIL');
}

console.log(`Test 2b: Color action cards: ${colorActionCount} (expected 56)`);
if (colorActionCount === 56) {
  console.log('✓ PASS');
} else {
  console.log('✗ FAIL');
}

console.log(`Test 2c: Wild action cards: ${wildActionCount} (expected 36)`);
if (wildActionCount === 36) {
  console.log('✓ PASS');
} else {
  console.log('✗ FAIL');
}

// Test 3: Drawing cards reduces deck size
const initialSize = deck.remaining();
const drawnCard = deck.draw();
const sizeAfterDraw = deck.remaining();
console.log(`Test 3: Drawing a card reduces deck from ${initialSize} to ${sizeAfterDraw}`);
if (sizeAfterDraw === initialSize - 1 && drawnCard !== null) {
  console.log('✓ PASS');
} else {
  console.log('✗ FAIL');
}

// Test 4: Adding card increases deck size
deck.addCard(drawnCard);
const sizeAfterAdd = deck.remaining();
console.log(`Test 4: Adding a card increases deck from ${sizeAfterDraw} to ${sizeAfterAdd}`);
if (sizeAfterAdd === sizeAfterDraw + 1) {
  console.log('✓ PASS');
} else {
  console.log('✗ FAIL');
}

// Test 5: Shuffling changes order (probabilistic test)
const deck2 = new Deck();
const originalOrder = deck2.getCards().map(c => c.toString());
deck2.shuffle();
const shuffledOrder = deck2.getCards().map(c => c.toString());
const isDifferent = originalOrder.join('') !== shuffledOrder.join('');
console.log(`Test 5: Shuffling changes card order: ${isDifferent} (likely true)`);
if (isDifferent) {
  console.log('✓ PASS');
} else {
  console.log('! MAYBE FAIL (very unlikely but possible)');
}

console.log('\nDeck tests completed.');