# Cosmic Match

A complete UNO card game desktop app using Electron, HTML, CSS, and vanilla JavaScript.

## Features

- Play UNO Classic mode (human vs AI)
- Cosmic theme
- Responsive design
- Local persistence for settings and stats (to be implemented)
- Multiple game modes (planned)

## Installation

1. Clone or download this repository.
2. Navigate to the project directory.
3. Install dependencies:

```bash
npm install
```

## Running the Game

To start the game in development mode:

```bash
npm start
```

This will launch the Electron window.

## Gameplay

### UNO Classic Rules

- Match cards by color, number, or symbol.
- If you cannot play, you must draw a card.
- Action cards:
  - Skip: Next player loses their turn.
  - Reverse: Reverses the direction of play.
  - Draw Two: Next player draws two cards and loses their turn.
  - Wild: Allows you to choose the next color.
  - Wild Draw Four: Choose the next color; the next player draws four cards and loses their turn. Can only be played if you have no matching color.
- When you have one card left, you must call "UNO!" before the next player takes a turn. If you forget and another player catches you, you must draw two cards.
- The first player to get rid of all their cards wins the round.

## Project Structure

- `main.js`: Electron main process.
- `preload.js`: Preload script for renderer (context isolation).
- `index.html`: Main HTML file.
- `styles.css`: Styles for the app.
- `renderer.js`: Renderer logic and game UI.
- `deck.js`: Deck of cards logic.
- `player.js`: Player class.
- `classicGame.js`: Game logic for UNO Classic.
- `constants.js`: Game constants.

## Future Work

- Implement other UNO modes (Party, Junior, Teams, Flip!, etc.)
- Add AI difficulty levels.
- Add sound effects and animations.
- Implement local storage for settings and player stats.
- Add online multiplayer (optional).

## License

ISC
