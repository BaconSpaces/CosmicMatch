// Game constants for UNO Classic
export const COLORS = ['red', 'yellow', 'green', 'blue'];
export const VALUES = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'Skip', 'Reverse', 'Draw Two'
];
export const WILD_VALUES = ['Wild', 'Wild Draw Four'];
export const WILD_COLORS = ['red', 'yellow', 'green', 'blue']; // for choosing

// Card points for scoring
export const CARD_POINTS = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  'Skip': 20,
  'Reverse': 20,
  'Draw Two': 20,
  'Wild': 50,
  'Wild Draw Four': 50
};

// Game modes
export const GAME_MODES = {
  CLASSIC: 'classic',
  // Other modes will be added later
};

// Direction
export const DIRECTION = {
  CLOCKWISE: 1,
  COUNTER_CLOCKWISE: -1
};