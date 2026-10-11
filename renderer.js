// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[DEBUG] DOM loaded, starting game initialization');
    let ClassicGame;
    let UnoFlexGame;
    let UnoSpinGame;
    let COLORS;

    try {
        console.log('[DEBUG] Loading game modules...');
        // Import game modules using dynamic imports
        const classicGameModule = await import('./classicGame.js');
        ClassicGame = classicGameModule.ClassicGame;
        console.log('[DEBUG] ClassicGame module loaded');

        const unoFlexGameModule = await import('./js/unoFlexGame.js');
        UnoFlexGame = unoFlexGameModule.UnoFlexGame;
        console.log('[DEBUG] UnoFlexGame module loaded');

        const unoSpinGameModule = await import('./js/unoSpinGame.js');
        UnoSpinGame = unoSpinGameModule.UnoSpinGame;
        console.log('[DEBUG] UnoSpinGame module loaded');

        const constantsModule = await import('./constants.js');
        COLORS = constantsModule.COLORS;
        console.log('[DEBUG] Constants module loaded');

        console.log('[DEBUG] All modules loaded successfully');
    } catch (error) {
        console.error('[DEBUG] Failed to load game modules:', error);
        document.getElementById('app').innerHTML = `
            <div style="padding: 20px; text-align: center; color: red;">
                <h2>Error Loading Game</h2>
                <p>Failed to load game modules. Please check the console for details.</p>
            </div>
        `;
        return;
    }

    // Game state
    let game = null;
    let humanPlayerIndex = 0; // Human player is always player 0
    let aiPlayerCount = 2;    // Number of AI players (will be read from settings)
    let totalPlayers = 3;     // Total players (human + AI)
    let gameStarted = false;
    let gameOver = false;
    let unoCalled = false;    // Track if UNO has been called for human player
    let pendingDrawPenalty = 0; // Tracks if we need to draw cards due to +2/+4/etc.
    let drawPenaltySource = null; // Tracks who caused the draw penalty
    let skipNextPlayer = false;   // Tracks if we need to skip the next player
    let reverseDirection = false; // Tracks if direction should be reversed
    let gameMode = 'show-em-no-mercy'; // Default game mode
    let soundEnabled = true;          // Sound on/off (from settings)
    let lastGameMode = 'show-em-no-mercy'; // Track last game mode that was played
    let hasPlayedBefore = false; // Track if we've played a game before
    console.log('[DEBUG] Initial game mode set to:', gameMode);

    // DOM elements
    const appDiv = document.getElementById('app');
    const statusDiv = document.getElementById('status');
    const logDiv = document.getElementById('log');
    const handDiv = document.getElementById('hand');
    const discardPileDiv = document.getElementById('discard-pile');
    const deckDiv = document.getElementById('deck');
    const currentPlayerDiv = document.getElementById('current-player');
    const directionDiv = document.getElementById('direction');
    const unoButton = document.getElementById('uno-button');
    const challengeButton = document.getElementById('challenge-button');
    const startButton = document.getElementById('start-button');
    const drawButton = document.getElementById('draw-button');
    const playButton = document.getElementById('play-button');

    // Menu elements
    const mainMenu = document.getElementById('main-menu');
    const gameScreenContainer = document.getElementById('game-screen-container');
    const settingsMenu = document.getElementById('settings-menu');
    const howtoMenu = document.getElementById('howto-menu');
    const gameModeMenu = document.getElementById('game-mode-menu');

    // Settings elements
    const aiCountSelect = document.getElementById('ai-count-select');
    const gameModeSelect = document.getElementById('game-mode-select');
    const settingsBackButton = document.getElementById('settings-back-button');
    const settingsApplyButton = document.getElementById('settings-apply-button');

    // How to Play elements
    const howtoBackButton = document.getElementById('howto-back-button');

    // Challenge modal elements
    const unoModal = document.getElementById('uno-modal');
    const challengeStatus = document.getElementById('challenge-status');
    const confirmChallengeButton = document.getElementById('confirm-challenge');

    // Settings extras
    const soundToggle = document.getElementById('sound-toggle');

    // Main menu elements
    const mmGameModesButton = document.getElementById('mm-game-modes-button');
    const mmSettingsButton = document.getElementById('mm-settings-button');
    const mmHowtoButton = document.getElementById('mm-howto-button');
    const mmQuitButton = document.getElementById('mm-quit-button');

    // Game mode menu elements
    const gmUnoClassicButton = document.getElementById('gm-uno-classic-button');
    const gmUnoShowEmButton = document.getElementById('gm-uno-show-em-button');
    const gmUnoFlexButton = document.getElementById('gm-uno-flex-button');
    const gmUnoSpinButton = document.getElementById('gm-uno-spin-button');
    const gmBackButton = document.getElementById('gm-back-button');

    const requiredElements = [
        appDiv,
        statusDiv,
        logDiv,
        handDiv,
        discardPileDiv,
        deckDiv,
        currentPlayerDiv,
        directionDiv,
        unoButton,
        challengeButton,
        startButton,
        drawButton,
        playButton,
        mainMenu,
        gameScreenContainer,
        settingsMenu,
        howtoMenu,
        gameModeMenu,
        aiCountSelect,
        gameModeSelect,
        settingsBackButton,
        settingsApplyButton,
        howtoBackButton,
        unoModal,
        challengeStatus,
        confirmChallengeButton,
        soundToggle,
        mmGameModesButton,
        mmSettingsButton,
        mmHowtoButton,
        mmQuitButton,
        gmUnoClassicButton,
        gmUnoShowEmButton,
        gmUnoFlexButton,
        gmUnoSpinButton,
        gmBackButton
    ];

    if (requiredElements.some(element => element === null)) {
        const missingIds = [
            'app',
            'status',
            'log',
            'hand',
            'discard-pile',
            'deck',
            'current-player',
            'direction',
            'uno-button',
            'challenge-button',
            'start-button',
            'draw-button',
            'play-button',
            'main-menu',
            'game-screen-container',
            'settings-menu',
            'howto-menu',
            'ai-count-select',
            'game-mode-select',
            'settings-back-button',
            'settings-apply-button',
            'howto-back-button',
            'mm-game-modes-button',
            'mm-settings-button',
            'mm-howto-button',
            'mm-quit-button'
        ].filter((id) => document.getElementById(id) === null);

        console.error('Missing required DOM elements:', missingIds);
        return;
    }

    // Initialize the UI
    function initUI() {
        // Add click event listeners for game controls
        startButton.addEventListener('click', () => {
            console.log('[DEBUG] Start button clicked');
            startGame();
        });
        drawButton.addEventListener('click', handleDraw);
        playButton.addEventListener('click', handlePlay);
        unoButton.addEventListener('click', handleUNO);
        challengeButton.addEventListener('click', showChallengeModal);

        // Challenge modal: confirm runs the challenge, backdrop/again closes it
        confirmChallengeButton.addEventListener('click', () => {
            hideChallengeModal();
            handleChallenge();
        });
        unoModal.addEventListener('click', (event) => {
            if (event.target === unoModal) {
                hideChallengeModal();
            }
        });

        // Sound toggle (settings menu)
        soundToggle.addEventListener('change', () => {
            soundEnabled = soundToggle.checked;
            addToLog(soundEnabled ? 'Sound enabled' : 'Sound disabled');
        });

        // Add click event listeners for menu controls
        mmGameModesButton.addEventListener('click', showGameModeMenu);
        mmSettingsButton.addEventListener('click', showSettingsMenu);
        mmHowtoButton.addEventListener('click', showHowtoMenu);

        // Game mode selection buttons - start the chosen game directly
        gmUnoClassicButton.addEventListener('click', () => {
            lastGameMode = 'classic';
            startGameFromMenu();
        });

        gmUnoShowEmButton.addEventListener('click', () => {
            lastGameMode = 'show-em-no-mercy';
            startGameFromMenu();
        });

        gmUnoFlexButton.addEventListener('click', () => {
            lastGameMode = 'flex';
            startGameFromMenu();
        });

        gmUnoSpinButton.addEventListener('click', () => {
            lastGameMode = 'spin';
            startGameFromMenu();
        });

        gmBackButton.addEventListener('click', showMainMenu);
        mmQuitButton.addEventListener('click', () => {
            // Close the application window (works in Electron)
            window.close();
        });

        settingsBackButton.addEventListener('click', showMainMenu);
        settingsApplyButton.addEventListener('click', () => {
            // Apply settings, update last game mode, and go back to main menu
            readSettingsFromMenu();
            lastGameMode = gameMode;
            showMainMenu();
        });

        howtoBackButton.addEventListener('click', showMainMenu);

        // Initially disable game controls
        setGameControlsEnabled(false);
        setSpecialControlsEnabled(false);

        // Start with main menu visible
        showMainMenu();
    }

    // Show main menu
    function showMainMenu() {
        mainMenu.style.display = 'flex';
        gameModeMenu.style.display = 'none';
        gameScreenContainer.style.display = 'none';
        settingsMenu.style.display = 'none';
        howtoMenu.style.display = 'none';
    }

    // Show game mode selection menu
    function showGameModeMenu() {
        mainMenu.style.display = 'none';
        gameModeMenu.style.display = 'flex';
        gameScreenContainer.style.display = 'none';
        settingsMenu.style.display = 'none';
        howtoMenu.style.display = 'none';
    }

    // Show game screen
    function showGameScreen() {
        mainMenu.style.display = 'none';
        gameModeMenu.style.display = 'none';
        gameScreenContainer.style.display = 'block';
        settingsMenu.style.display = 'none';
        howtoMenu.style.display = 'none';
    }

    // Show settings menu
    function showSettingsMenu() {
        mainMenu.style.display = 'none';
        gameModeMenu.style.display = 'none';
        gameScreenContainer.style.display = 'none';
        settingsMenu.style.display = 'flex';
        howtoMenu.style.display = 'none';
    }

    // Show how to play menu
    function showHowtoMenu() {
        mainMenu.style.display = 'none';
        gameModeMenu.style.display = 'none';
        gameScreenContainer.style.display = 'none';
        settingsMenu.style.display = 'none';
        howtoMenu.style.display = 'flex';
    }

    // Show the UNO challenge modal
    function showChallengeModal() {
        if (!gameStarted || gameOver) return;
        challengeStatus.textContent = 'Challenge the previous player for not calling UNO? Success: they draw 2. Fail: you draw 2.';
        unoModal.classList.add('show');
    }

    // Hide the UNO challenge modal
    function hideChallengeModal() {
        unoModal.classList.remove('show');
    }

    // Read settings from the menu
    function readSettingsFromMenu() {
        aiPlayerCount = parseInt(aiCountSelect.value);
        gameMode = gameModeSelect.value;

        // Update total players
        totalPlayers = 1 + aiPlayerCount; // 1 human + AI players

        console.log(`Settings: ${aiPlayerCount} AI players, Game mode: ${gameMode}`);
    }

    // Start a game chosen from the game mode menu
    function startGameFromMenu() {
        // Pick up the AI player count (and game mode) from the settings menu
        readSettingsFromMenu();
        // startGame() uses lastGameMode when a game has been played before
        hasPlayedBefore = true;
        showGameScreen();
        startGame();
    }

    // Start a new game
    function startGame() {
        // Determine which game mode to use:
        // If we've played before, use lastGameMode (for restart)
        // Otherwise, use current gameMode from settings (for fresh start)
        const gameModeToUse = hasPlayedBefore ? lastGameMode : gameMode;

        // Import the appropriate game class based on game mode
        if (gameModeToUse === 'classic') {
            // For classic UNO, we use ClassicGame
            game = new ClassicGame(['Human'], aiPlayerCount);
            addToLog('Starting a new UNO Classic game...');
        } else if (gameModeToUse === 'flex') {
            // For UNO Flex, we use the UnoFlexGame class
            game = new UnoFlexGame(['Human'], aiPlayerCount);
            addToLog('Starting a new UNO Flex game...');
        } else if (gameModeToUse === 'spin') {
            // For UNO Spin, we use the UnoSpinGame class
            game = new UnoSpinGame(['Human'], aiPlayerCount);
            addToLog('Starting a new UNO Spin game...');
        } else {
            // For Show 'Em No Mercy, we use the enhanced GameState via ClassicGame wrapper
            game = new ClassicGame(['Human'], aiPlayerCount);
            addToLog('Starting a new UNO Show \'Em No Mercy game...');
        }

        gameStarted = true;
        gameOver = false;
        unoCalled = false;
        pendingDrawPenalty = 0;
        drawPenaltySource = null;
        skipNextPlayer = false;
        reverseDirection = false;

        // Update UI
        startButton.textContent = 'Restart Game';
        setGameControlsEnabled(true);
        setSpecialControlsEnabled(false);
        unoButton.disabled = true;
        challengeButton.disabled = true;

        // Clear logs and status
        logDiv.innerHTML = '';
        statusDiv.textContent = 'Game started!';

        addToLog(`Created game with ${totalPlayers} players (You + ${aiPlayerCount} AI)`);

        // Render initial state
        renderGameState();

        // Mark that we've played a game before (for future restarts)
        hasPlayedBefore = true;

        // If the first player is AI, let them play
        if (game.getCurrentPlayerIndex() !== humanPlayerIndex) {
            setTimeout(playAITurn, 500);
        }
    }

    // Enable/disable game controls
    function setGameControlsEnabled(enabled) {
        drawButton.disabled = !enabled;
        playButton.disabled = !enabled;
    }

    // Enable/disable special controls
    function setSpecialControlsEnabled(enabled) {
        unoButton.disabled = !enabled;
        challengeButton.disabled = !enabled;
    }

    // Add message to game log
    function addToLog(message) {
        const logEntry = document.createElement('div');
        logEntry.textContent = message;
        logDiv.appendChild(logEntry);
        logDiv.scrollTop = logDiv.scrollHeight; // Auto-scroll to bottom
    }

    // Set status message
    function setStatus(message) {
        statusDiv.textContent = message;
    }

    // Render the current game state
    function renderGameState() {
        if (!game) return;

        // Get game state
        const state = game.getState();

        // Update current player display
        currentPlayerDiv.textContent = `Player ${state.currentPlayerIndex + 1}`;
        if (state.currentPlayerIndex === humanPlayerIndex) {
            currentPlayerDiv.textContent += ' (YOU)';
            currentPlayerDiv.style.color = 'green';
        } else {
            currentPlayerDiv.textContent += ` (AI ${state.currentPlayerIndex})`;
            currentPlayerDiv.style.color = 'blue';
        }

        // Update direction
        directionDiv.textContent = state.direction === 1 ? 'Clockwise' : 'Counter-clockwise';

        // Update deck visualization
        deckDiv.innerHTML = ''; // Clear previous content
        const deckVisual = createDeckVisual(state.deckRemaining);
        deckDiv.appendChild(deckVisual);

        // Update discard pile (show top card)
        if (state.topCard) {
            discardPileDiv.innerHTML = createCardElement(state.topCard.color, state.topCard.value, true);
        } else {
            discardPileDiv.innerHTML = '<div class="card empty">[Empty]</div>';
        }

        // Update human player's hand
        const humanPlayer = state.players[humanPlayerIndex];
        if (humanPlayer && humanPlayer.hand) {
            renderHand(humanPlayer.hand);
        }

        // Update the players panel: refresh AI opponents next to the human panel
        const playersContainer = document.querySelector('.players-container');
        if (playersContainer) {
            // Remove stale AI panels (everything after the human panel)
            while (playersContainer.children.length > 1) {
                playersContainer.removeChild(playersContainer.lastChild);
            }

            state.players.forEach((p, index) => {
                if (index === humanPlayerIndex) {
                    // Highlight the human panel when it's their turn
                    const humanPanel = playersContainer.children[0];
                    if (humanPanel) {
                        humanPanel.classList.toggle('active', state.currentPlayerIndex === humanPlayerIndex);
                    }
                    const humanScore = document.getElementById('player-0-score');
                    if (humanScore) {
                        humanScore.textContent = `Cards: ${p.handSize}`;
                    }
                    return;
                }

                // Build a panel for each AI opponent
                const panel = document.createElement('div');
                panel.className = 'player' + (state.currentPlayerIndex === index ? ' active' : '');
                panel.id = `player-${index}`;

                const name = document.createElement('div');
                name.className = 'player-name';
                name.textContent = `${p.name} (AI)`;

                const cards = document.createElement('div');
                cards.className = 'player-score';
                cards.textContent = `Cards: ${p.handSize}`;

                panel.appendChild(name);
                panel.appendChild(cards);
                playersContainer.appendChild(panel);
            });
        }

        // Update UNO button state
        const unoState = game.getUnoState();
        if (unoState.needsUno && !unoState.unoSaid) {
            unoButton.disabled = false;
            unoButton.style.backgroundColor = '#ff9800';
        } else {
            unoButton.disabled = true;
            unoButton.style.backgroundColor = '';
        }

        // Update challenge button state
        // Can challenge if previous player just played a Wild Draw Four or similar
        // For simplicity, we'll enable it when it's not our turn and game is active
        challengeButton.disabled = !(state.currentPlayerIndex !== humanPlayerIndex && gameStarted && !gameOver);
    }

    // Render the human player's hand
    function renderHand(hand) {
        handDiv.innerHTML = ''; // Clear current hand

        hand.forEach((card, index) => {
            const cardElement = createCardElement(card.color, card.value, false);
            cardElement.dataset.index = index; // Store index for selection
            cardElement.addEventListener('click', () => selectCard(index));
            handDiv.appendChild(cardElement);
        });
    }

    // Create a visual deck representation
    function createDeckVisual(count) {
        // Create a container for the deck visualization
        const deckContainer = document.createElement('div');
        deckContainer.className = 'deck-visualization';

        // Limit the visual count to avoid too many cards (max 5 visible cards)
        const visibleCount = Math.min(count, 5);

        // Create the visual stack of card backs
        for (let i = 0; i < visibleCount; i++) {
            const cardBack = document.createElement('div');
            cardBack.className = 'card deck-card-back';

            // Add slight offset for each card to show the stack
            cardBack.style.transform = `translate(${i * 4}px, ${i * 2}px) rotate(${i * 2}deg)`;
            cardBack.style.zIndex = String(visibleCount - i);

            deckContainer.appendChild(cardBack);
        }

        // Add the count overlay if there are more cards than we're showing visually
        if (count > visibleCount) {
            const countOverlay = document.createElement('div');
            countOverlay.className = 'deck-count-overlay';
            countOverlay.textContent = `+${count - visibleCount}`;
            deckContainer.appendChild(countOverlay);
        } else if (count > 0) {
            // Show exact count if we're showing all cards visually
            const countOverlay = document.createElement('div');
            countOverlay.className = 'deck-count-overlay';
            countOverlay.textContent = String(count);
            deckContainer.appendChild(countOverlay);
        }

        // If deck is empty, show a visual indicator
        if (count === 0) {
            const emptyIndicator = document.createElement('div');
            emptyIndicator.className = 'deck-empty-indicator';
            emptyIndicator.textContent = '∅';
            deckContainer.appendChild(emptyIndicator);
        }

        return deckContainer;
    }

    // Create a card element for display
    function createCardElement(color, value, isSmall = false) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        if (isSmall) cardDiv.classList.add('small');

        // Set color
        let displayColor = color;
        let displayValue = value;

        if (color === 'wild') {
            displayColor = 'black';
            // Special display for wild cards
            switch (value) {
                case 'wild':
                    displayValue = 'Wild';
                    break;
                case 'wild_draw4':
                    displayValue = 'Wild Draw Four';
                    break;
                case 'wild_reverse_draw4':
                    displayValue = 'Wild Reverse Draw Four';
                    break;
                case 'wild_draw6':
                    displayValue = 'Wild Draw Six';
                    break;
                case 'wild_draw10':
                    displayValue = 'Wild Draw Ten';
                    break;
                case 'wild_color_roulette':
                    displayValue = 'Wild Color Roulette';
                    break;
                case 'discard_all':
                    displayValue = 'Discard All';
                    break;
                case 'skip_everyone':
                    displayValue = 'Skip Everyone';
                    break;
                default:
                    displayValue = value;
            }
        } else {
            // Normal colored card
            displayColor = color;
            displayValue = value;
        }

        cardDiv.style.backgroundColor = getCardBackgroundColor(color);
        cardDiv.style.color = getCardTextColor(color);

        // For number cards, show the number
        // For action cards, show text or symbol
        if (typeof value === 'number') {
            cardDiv.textContent = value;
        } else {
            // Use first letter(s) for action cards for compact display
            const actionMap = {
                'skip': 'S',
                'reverse': '↔',
                'draw2': '+2',
                'draw4': '+4',
                'wild': 'W',
                'wild_draw4': 'WD4',
                'wild_reverse_draw4': 'WRD4',
                'wild_draw6': 'WD6',
                'wild_draw10': 'WD10',
                'wild_color_roulette': 'WCR',
                'discard_all': 'DA',
                'skip_everyone': 'SE'
            };
            cardDiv.textContent = actionMap[value] || value;
        }

        return cardDiv;
    }

    // Get background color for card based on its color
    function getCardBackgroundColor(color) {
        switch (color) {
            case 'red': return '#f44336';
            case 'yellow': return '#ffeb3b';
            case 'green': return '#4caf50';
            case 'blue': return '#2196f3';
            case 'wild': return '#000000';
            default: return '#9e9e9e';
        }
    }

    // Get text color for card based on its color
    function getCardTextColor(color) {
        // For dark backgrounds, use white text; for light backgrounds, use black text
        const darkColors = ['red', 'blue', 'wild'];
        return darkColors.includes(color) ? '#ffffff' : '#000000';
    }

    // Check whether a card can be played on the current top card, respecting
    // the current color in play (important after wild cards are played).
    function isCardPlayable(card, topCard, currentColor) {
        if (!card || !topCard) return false;

        // Wild cards can always be played
        if (card.isWild()) {
            return true;
        }

        // Match by the current color in play (set after a wild card)
        if (currentColor && card.color === currentColor) {
            return true;
        }

        // Match by the top card's color
        if (card.color === topCard.color) {
            return true;
        }

        // Match by value (number or action symbol)
        if (card.value === topCard.value) {
            return true;
        }

        return false;
    }

    // Handle card selection
    let selectedCardIndex = null;

    function selectCard(index) {
        // Deselect previously selected card
        if (selectedCardIndex !== null) {
            const prevCard = handDiv.children[selectedCardIndex];
            if (prevCard) {
                prevCard.style.border = '2px solid #ccc';
                prevCard.style.transform = 'scale(1)';
            }
        }

        // Select new card
        selectedCardIndex = index;
        const card = handDiv.children[index];
        if (card) {
            card.style.border = '2px solid #ff9800';
            card.style.transform = 'scale(1.1)';
        }

        // Enable play button if a card is selected
        playButton.disabled = !(selectedCardIndex !== null && gameStarted && !gameOver);
    }

    // Handle drawing a card
    function handleDraw() {
        if (!gameStarted || gameOver) return;

        // Check if we need to draw due to a penalty
        if (pendingDrawPenalty > 0) {
            // Draw penalty cards
            for (let i = 0; i < pendingDrawPenalty; i++) {
                const card = game.drawCardForPlayer(humanPlayerIndex);
                if (card) {
                    addToLog(`You drew a ${card.color} ${card.value} due to a ${drawPenaltySource}'s ${getDrawCardName(card.value)}`);
                }
            }

            // Reset penalty
            pendingDrawPenalty = 0;
            drawPenaltySource = null;

            // After drawing penalty cards, the player may now play a card
            // (they do NOT lose their turn just for drawing penalty cards)
            setStatus('Draw penalty resolved. You may now play a card.');
            renderGameState();
            return;
        }

        // Normal draw: draw one card and let the player keep their turn
        const card = game.drawCardForPlayer(humanPlayerIndex);
        if (card) {
            addToLog(`You drew a ${card.color} ${card.value}`);
        }

        // Check for UNO
        checkUNO();

        // Re-render the hand so the newly drawn card is visible
        renderGameState();

        // Do NOT end the turn — the player can still play the drawn card
    }

    // Handle playing a card
    function handlePlay() {
        if (!gameStarted || gameOver || selectedCardIndex === null) return;

        // If there's a pending draw penalty, the player must draw before playing
        if (pendingDrawPenalty > 0) {
            addToLog(`You must draw ${pendingDrawPenalty} card(s) before you can play.`);
            return;
        }

        // Get the selected card from human player's hand
        const state = game.getState();
        if (!state.players[humanPlayerIndex].hand || selectedCardIndex >= state.players[humanPlayerIndex].hand.length) {
            addToLog('Invalid card selection');
            return;
        }

        const cardToPlay = state.players[humanPlayerIndex].hand[selectedCardIndex];

        // Check if the card can be played (using currentColor for wild-matching)
        const topCard = game.getTopCard();
        const currentColor = state.currentColor || (topCard ? topCard.color : null);
        if (!topCard || !isCardPlayable(cardToPlay, topCard, currentColor)) {
            addToLog(`You cannot play a ${cardToPlay.color} ${cardToPlay.value} on a ${topCard.color} ${topCard.value}`);
            return;
        }

        // Play the card
        const result = game.playCard(selectedCardIndex);
        if (result.card) {
            addToLog(`You played a ${result.card.color} ${result.card.value}`);

            // Handle special card effects
            handleSpecialCardEffect(result);

            // Check if game is over
            if (result.win) {
                gameOver = true;
                setStatus(`Game over! You win.`);
                addToLog(`Game over! You win.`);
                setGameControlsEnabled(false);
                setSpecialControlsEnabled(false);

                // Show final state
                renderGameState();
                return;
            }

            // Check for UNO
            checkUNO();

            // End turn
            endTurn();
        } else {
            addToLog('Failed to play card');
        }
    }

    // Handle calling UNO
    function handleUNO() {
        if (!gameStarted || gameOver) return;

        const unoState = game.getUnoState();
        if (!unoState.needsUno) {
            addToLog('You can only call UNO when you have exactly one card');
            return;
        }

        if (unoState.unoSaid) {
            addToLog('You have already called UNO');
            return;
        }

        game.sayUNO();
        unoCalled = true;
        unoButton.disabled = true;
        unoButton.style.backgroundColor = '';
        addToLog('You called UNO!');
        setStatus('UNO called!');
    }

    // Handle challenging the previous player
    function handleChallenge() {
        if (!gameStarted || gameOver) return;

        const success = game.challengePreviousPlayer();
        if (success) {
            addToLog('Challenge successful! Previous player had to draw 2 cards.');
        } else {
            addToLog('Challenge unsuccessful. You must draw 2 cards.');

            // Draw 2 cards as penalty
            for (let i = 0; i < 2; i++) {
                const card = game.drawCardForPlayer(humanPlayerIndex);
                if (card) {
                    // Card is automatically added to player's hand by drawCardForPlayer
                }
            }

            // Check for UNO after drawing
            checkUNO();
        }

        // End turn (challenger loses their turn)
        endTurn();
    }

    // Handle special card effects
    function handleSpecialCardEffect(result) {
        // Handle draw penalties
        if (result.draw > 0) {
            pendingDrawPenalty = result.draw;
            drawPenaltySource = game.getState().currentPlayerIndex === humanPlayerIndex ? 'you' : `player ${game.getState().currentPlayerIndex}`;
            addToLog(`Next player must draw ${pendingDrawPenalty} cards`);
        }

        // Handle skip
        if (result.skip) {
            skipNextPlayer = true;
            addToLog('Next player loses a turn');
        }

        // Handle wild card color change
        if (result.card.value === 'wild' ||
            result.card.value === 'wild_draw4' ||
            result.card.value === 'wild_reverse_draw4' ||
            result.card.value === 'wild_draw6' ||
            result.card.value === 'wild_draw10' ||
            result.card.value === 'wild_color_roulette') {
            // Use the color from the game state if available, otherwise pick a random color
            if (result.color !== null) {
                game.currentColor = result.color;
                addToLog(`Color changed to ${result.color}`);
            } else {
                // For now, we'll just pick a random color
                // In a real game, we'd prompt the player to choose a color
                const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
                game.currentColor = randomColor;
                addToLog(`Color changed to ${randomColor}`);
            }
        }
    }

    // Check if UNO should be called
    function checkUNO() {
        const unoState = game.getUnoState();
        if (unoState.needsUno && !unoState.unoSaid) {
            unoButton.disabled = false;
            unoButton.style.backgroundColor = '#ff9800';
            setStatus('You have one card! Press UNO button.');
        } else {
            unoButton.disabled = true;
            unoButton.style.backgroundColor = '';
        }
    }

    // Get the name of a draw card for logging
    function getDrawCardName(value) {
        switch (value) {
            case 'draw2': return 'Draw Two';
            case 'draw4': return 'Draw Four';
            case 'wild_draw6': return 'Wild Draw Six';
            case 'wild_draw10': return 'Wild Draw Ten';
            default: return value;
        }
    }

    // End the current turn and proceed to next player
    function endTurn() {
        // If a skip was triggered by the last played card, advance an extra
        // turn so the skipped player is bypassed.
        if (skipNextPlayer) {
            skipNextPlayer = false;
            game.nextTurn();
        }

        // Advance to the next player's turn
        game.nextTurn();

        // Small delay before rendering
        setTimeout(() => {
            renderGameState();

            // If the next player is the human and there's a pending draw penalty,
            // the human must draw those cards before playing.
            if (!gameOver && game.getCurrentPlayerIndex() === humanPlayerIndex) {
                if (pendingDrawPenalty > 0) {
                    setStatus(`You must draw ${pendingDrawPenalty} card(s) before playing.`);
                }
                return;
            }

            // If it's AI's turn, let them play
            if (!gameOver && game.getCurrentPlayerIndex() !== humanPlayerIndex) {
                setTimeout(playAITurn, 1000);
            }
        }, 500);
    }

    // AI player turn logic
    function playAITurn() {
        if (!gameStarted || gameOver) return;

        const state = game.getState();
        if (state.winner !== null) return;

        const aiPlayerIndex = state.currentPlayerIndex;
        const hand = state.players[aiPlayerIndex].hand;
        const topCard = state.topCard;
        const currentColor = state.currentColor || (topCard ? topCard.color : null);

        // If there's a pending draw penalty, the AI must draw those cards first
        if (pendingDrawPenalty > 0) {
            for (let i = 0; i < pendingDrawPenalty; i++) {
                const card = game.drawCardForPlayer(aiPlayerIndex);
                if (card) {
                    addToLog(`AI Player ${aiPlayerIndex} drew a ${card.color} ${card.value} (penalty)`);
                }
            }
            pendingDrawPenalty = 0;
            drawPenaltySource = null;
            renderGameState();
            // After drawing penalty, the AI's turn ends (they lose their turn)
            endTurn();
            return;
        }

        if (!hand || !topCard) {
            endTurn();
            return;
        }

        // Find playable cards using currentColor (wild cards change the effective color)
        const playableIndices = [];
        for (let i = 0; i < hand.length; i++) {
            if (isCardPlayable(hand[i], topCard, currentColor)) {
                playableIndices.push(i);
            }
        }

        let cardIndexToPlay = null;

        // If we have playable cards, choose one strategically
        if (playableIndices.length > 0) {
            // Simple strategy: prefer action cards, then highest number
            // In a full implementation, this would be more sophisticated

            // First, look for draw cards to play if we can penalize others
            for (const index of playableIndices) {
                const card = hand[index];
                if (card.isDrawCard()) {
                    cardIndexToPlay = index;
                    break;
                }
            }

            // If no draw cards, look for skips/reverses
            if (cardIndexToPlay === null) {
                for (const index of playableIndices) {
                    const card = hand[index];
                    if (card.value === 'skip' || card.value === 'reverse') {
                        cardIndexToPlay = index;
                        break;
                    }
                }
            }

            // If still no special cards, play the highest number card
            if (cardIndexToPlay === null) {
                let highestValue = -1;
                for (const index of playableIndices) {
                    const card = hand[index];
                    if (typeof card.value === 'number' && card.value > highestValue) {
                        highestValue = card.value;
                        cardIndexToPlay = index;
                    }
                }

                // If no number cards, just play the first playable card
                if (cardIndexToPlay === null) {
                    cardIndexToPlay = playableIndices[0];
                }
            }
        } else {
            // No playable cards, must draw
            addToLog(`AI Player ${aiPlayerIndex} drew a card`);
            const card = game.drawCardForPlayer(aiPlayerIndex);
            if (card) {
                // Card is automatically added to player's hand by drawCardForPlayer
            }

            // Check if the drawn card is playable (using currentColor)
            const newHand = state.players[aiPlayerIndex].hand;
            const lastCard = newHand[newHand.length - 1];
            if (lastCard && isCardPlayable(lastCard, topCard, currentColor)) {
                // Auto-play the drawn card if it's playable
                cardIndexToPlay = newHand.length - 1;
                addToLog(`AI Player ${aiPlayerIndex} played the drawn card`);
            } else {
                // End turn after drawing
                endTurn();
                return;
            }
        }

        // Play the selected card
        if (cardIndexToPlay !== null) {
            const result = game.playCard(cardIndexToPlay);
            if (result.card) {
                addToLog(`AI Player ${aiPlayerIndex} played a ${result.card.color} ${result.card.value}`);

                // Handle special card effects
                handleSpecialCardEffect(result);

                // Check if game is over
                if (result.win) {
                    gameOver = true;
                    setStatus(`Game over! AI Player ${aiPlayerIndex} wins.`);
                    addToLog(`Game over! AI Player ${aiPlayerIndex} wins.`);
                    setGameControlsEnabled(false);
                    setSpecialControlsEnabled(false);
                    renderGameState();
                    return;
                }
            } else {
                addToLog(`AI Player ${aiPlayerIndex} failed to play card`);
            }
        }

        // End turn
        endTurn();
    }

    // Initialize the UI
    initUI();

    // Initial render
    renderGameState();
});