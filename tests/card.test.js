// Test for UNO Show 'Em No Mercy Card
const { Card } = require('../js/card.js');

console.log('Testing Card...');

// Test 1: Creating a number card
{
  const redFive = new Card('red', 5);
  console.log(`Test 1: Red 5 - ${redFive.toString()}`);
  if (redFive.color === 'red' && redFive.value === 5 && redFive.toString() === 'red 5') {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }
}

// Test 2: Creating a wild card
{
  const wildDrawFour = new Card('wild', 'wild_draw4');
  console.log(`Test 2: Wild Draw Four - ${wildDrawFour.toString()}`);
  if (wildDrawFour.color === 'wild' && wildDrawFour.value === 'wild_draw4' &&
      wildDrawFour.toString() === 'Wild wild_draw4') {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }
}

// Test 3: isWild()
{
  const redFive = new Card('red', 5);
  console.log(`Test 3a: Red 5 isWild(): ${redFive.isWild()} (expected false)`);
  if (!redFive.isWild()) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }

  const wildDrawFour = new Card('wild', 'wild_draw4');
  console.log(`Test 3b: Wild Draw Four isWild(): ${wildDrawFour.isWild()} (expected true)`);
  if (wildDrawFour.isWild()) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }
}

// Test 4: isNumber()
{
  const redFive = new Card('red', 5);
  console.log(`Test 4a: Red 5 isNumber(): ${redFive.isNumber()} (expected true)`);
  if (redFive.isNumber()) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }

  console.log(`Test 4b: Skip card isNumber(): ${new Card('red', 'skip').isNumber()} (expected false)`);
  if (!new Card('red', 'skip').isNumber()) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }
}

// Test 5: isDrawCard()
{
  console.log(`Test 5a: Draw Two isDrawCard(): ${new Card('red', 'draw2').isDrawCard()} (expected true)`);
  if (new Card('red', 'draw2').isDrawCard()) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }

  console.log(`Test 5b: Draw Four isDrawCard(): ${new Card('red', 'draw4').isDrawCard()} (expected true)`);
  if (new Card('red', 'draw4').isDrawCard()) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }

  console.log(`Test 5c: Wild Draw 6 isDrawCard(): ${new Card('wild', 'wild_draw6').isDrawCard()} (expected true)`);
  if (new Card('wild', 'wild_draw6').isDrawCard()) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }

  console.log(`Test 5d: Wild Draw 10 isDrawCard(): ${new Card('wild', 'wild_draw10').isDrawCard()} (expected true)`);
  if (new Card('wild', 'wild_draw10').isDrawCard()) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }

  console.log(`Test 5e: Skip isDrawCard(): ${new Card('red', 'skip').isDrawCard()} (expected false)`);
  if (!new Card('red', 'skip').isDrawCard()) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }
}

// Test 6: getDrawValue()
{
  console.log(`Test 6a: Draw Two getDrawValue(): ${new Card('red', 'draw2').getDrawValue()} (expected 2)`);
  if (new Card('red', 'draw2').getDrawValue() === 2) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }

  console.log(`Test 6b: Draw Four getDrawValue(): ${new Card('red', 'draw4').getDrawValue()} (expected 4)`);
  if (new Card('red', 'draw4').getDrawValue() === 4) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }

  console.log(`Test 6c: Wild Draw 6 getDrawValue(): ${new Card('wild', 'wild_draw6').getDrawValue()} (expected 6)`);
  if (new Card('wild', 'wild_draw6').getDrawValue() === 6) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }

  console.log(`Test 6d: Wild Draw 10 getDrawValue(): ${new Card('wild', 'wild_draw10').getDrawValue()} (expected 10)`);
  if (new Card('wild', 'wild_draw10').getDrawValue() === 10) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }

  console.log(`Test 6e: Skip getDrawValue(): ${new Card('red', 'skip').getDrawValue()} (expected 0)`);
  if (new Card('red', 'skip').getDrawValue() === 0) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }
}

// Test 7: canPlayOn()
{
  const redThree = new Card('red', 3);
  const redFive = new Card('red', 5);
  const blueFive = new Card('blue', 5);
  const yellowSkip = new Card('yellow', 'skip');
  const greenReverse = new Card('green', 'reverse');
  const wild = new Card('wild', 'wild');

  // Same color
  console.log(`Test 7a: Red 5 can play on Red 3 (same color): ${redFive.canPlayOn(redThree)} (expected true)`);
  if (redFive.canPlayOn(redThree)) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }

  // Same value
  console.log(`Test 7b: Blue 5 can play on Red 5 (same value): ${blueFive.canPlayOn(redFive)} (expected true)`);
  if (blueFive.canPlayOn(redFive)) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }

  // Wild card
  console.log(`Test 7c: Wild can play on Red 3: ${wild.canPlayOn(redThree)} (expected true)`);
  if (wild.canPlayOn(redThree)) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }

  // Different color and value
  console.log(`Test 7d: Blue 3 can play on Red 5: ${new Card('blue', '3').canPlayOn(redFive)} (expected false)`);
  if (!new Card('blue', '3').canPlayOn(redFive)) {
    console.log('✓ PASS');
  } else {
    console.log('✗ FAIL');
  }
}

console.log('\nCard tests completed.');