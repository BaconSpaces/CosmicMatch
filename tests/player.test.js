// Test for UNO Show 'Em No Mercy Player
const { Player } = require('../js/player.js');
const { Card } = require('../js/card.js');

console.log('Testing Player...');
console.log('Card constructor:', Card);

// Test 1: Creating a player
const player = new Player('TestPlayer', false);
console.log(`Test 1: Player ${player.name} isAI: ${player.isAI} (expected false)`);
if (player.name === 'TestPlayer' && !player.isAI) {
  console.log('✓ PASS');
} else {
  console.log('✗ FAIL');
}

// Test 2: Adding cards to hand
const redFive = new Card('red', 5);
const blueSkip = new Card('blue', 'skip');
player.addCard(redFive);
player.addCard(blueSkip);
console.log(`Test 2: Player hand size: ${player.handSize()} (expected 2)`);
if (player.handSize() === 2) {
  console.log('✓ PASS');
} else {
  console.log('✗ FAIL');
}

// Test 3: Removing a card from hand
const removedCard = player.removeCard(0);
console.log(`Test 3: Removed card: ${removedCard.toString()} (expected red 5)`);
if (removedCard.toString() === 'red 5' && player.handSize() === 1) {
  console.log('✓ PASS');
} else {
  console.log('✗ FAIL');
}

// Test 4: hasCard()
console.log(`Test 4a: Player has blue skip: ${player.hasCard('blue', 'skip')} (expected true)`);
if (player.hasCard('blue', 'skip')) {
  console.log('✓ PASS');
} else {
  console.log('✗ FAIL');
}

console.log(`Test 4b: Player has red 5: ${player.hasCard('red', 5)} (expected false)`);
if (!player.hasCard('red', 5)) {
  console.log('✓ PASS');
} else {
  console.log('✗ FAIL');
}

console.log(`Test 4c: Player has any red card: ${player.hasCard('red', null)} (expected false)`);
if (!player.hasCard('red', null)) {
  console.log('✓ PASS');
} else {
  console.log('✗ FAIL');
}

// Test 5: getPlayableIndices
const player2 = new Player('Player2', false);
const redThree = new Card('red', 3);
const blueThree = new Card('blue', '3');
const greenDrawTwo = new Card('green', 'draw2');
const yellowWildCard = new Card('wild', 'wild');

player2.addCard(redThree);    // index 0
player2.addCard(blueThree);   // index 1
player2.addCard(greenDrawTwo); // index 2
player2.addCard(yellowWildCard); // index 3

const topCard = new Card('red', 5); // Red 5 on discard pile
const currentColor = 'red'; // Current color is red

const playableIndices = player2.getPlayableIndices(topCard, currentColor);
console.log(`Test 5: Playable indices on Red 5 with current color red: [${playableIndices}] (expected [0,3])`);
// Red 3 matches color (0)
// Blue 3: no match (color blue != red, value 3 != 5)
// Green Draw 2: no match
// Wild: playable
// So expected [0, 3]

if (playableIndices.length === 2 &&
    playableIndices.includes(0) &&
    playableIndices.includes(3)) {
  console.log('✓ PASS');
} else {
  console.log('✗ FAIL');
}

// Test 6: isPlayable (same as getPlayableIndices but for single card)
console.log(`Test 6a: Red 3 is playable on Red 5: ${player2.isPlayable(redThree, topCard, currentColor)} (expected true)`);
if (player2.isPlayable(redThree, topCard, currentColor)) {
  console.log('✓ PASS');
} else {
  console.log('✗ FAIL');
}

console.log(`Test 6b: Blue 3 is playable on Red 5: ${player2.isPlayable(blueThree, topCard, currentColor)} (expected false)`);
if (!player2.isPlayable(blueThree, topCard, currentColor)) {
  console.log('✓ PASS');
} else {
  console.log('✗ FAIL');
}

console.log(`Test 6c: Wild is playable on Red 5: ${player2.isPlayable(yellowWildCard, topCard, currentColor)} (expected true)`);
if (player2.isPlayable(yellowWildCard, topCard, currentColor)) {
  console.log('✓ PASS');
} else {
  console.log('✗ FAIL');
}

console.log('\nPlayer tests completed.');