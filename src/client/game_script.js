/**
 * Fetches translations from the server.
 * This function retrieves an array of translations, each containing an input word and its translated output.
 *
 * @async
 * @function fetchTranslations
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of translation objects, 
 * each with an `input` (string) and an `output` (string) property.
 */
 async function fetchTranslations() {
  try {
    const response = await fetch('/read?n=50');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const translations = await response.json();
    return translations;
  } catch (error) {
    console.error('Error fetching translations:', error);
    return [];
  }
}

/**
 * Creates a box element for the game.
 * Each box represents a card in the matching game, containing either an input word or its translation.
 *
 * @function createBox
 * @param {string} content - The content of the box, which is either an input word or its translated output.
 * @param {string} id - The unique identifier for the box.
 * @returns {HTMLElement} The created box element.
 */
function createBox(content, id) {
  const box = document.createElement('div');
  box.classList.add('box', 'initial');
  box.dataset.id = id;
  box.dataset.content = content;
  box.textContent = content;
  return box;
}

/**
 * Shuffles an array randomly.
 * This is used to randomize the order of the cards in the game.
 *
 * @function shuffleArray
 * @param {Array} array - The array to shuffle.
 * @returns {Array} The shuffled array.
 */
function shuffleArray(array) {
  return array.sort(() => 0.5 - Math.random());
}

/**
 * Gets a random subset of an array.
 * This is used to select a random set of translation pairs for the game.
 *
 * @function getRandomSubset
 * @param {Array} array - The array to get a subset from.
 * @param {number} size - The size of the subset.
 * @returns {Array} The random subset of the array.
 */
function getRandomSubset(array, size) {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, size);
}

/**
 * Initializes the matching game with the provided translations.
 * Sets up the game board with cards, handles the game logic, and manages the game state.
 *
 * @function initializeGame
 * @param {Array<Object>} translations - An array of translation objects to use in the game.
 */
function initializeGame(translations) {
  const gameContainer = document.getElementById('game-container');
  const message = document.getElementById('message');
  const winnerMessage = document.getElementById('winner-message');
  const resetButton = document.getElementById('reset-button');

  // Reset game messages and button
  message.textContent = '';
  winnerMessage.style.display = 'none';
  resetButton.style.display = 'none';

  gameContainer.innerHTML = ''; // Clear previous game cards

  // Filter unique translations based on the input word
  const uniqueTranslations = [...new Map(translations.map(item => [item.input, item])).values()];

  // Check if there are enough translations to play the game
  if (uniqueTranslations.length < 3) {
    message.textContent = 'Not enough words to play. Please save more words.';
    gameContainer.classList.add('disabled');
    return;
  }

  // Determine the number of pairs to use in the game
  const numPairs = Math.min(6, Math.max(3, uniqueTranslations.length));
  const selectedTranslations = getRandomSubset(uniqueTranslations, numPairs);

  // Create card elements for each translation pair
  const cards = [];
  selectedTranslations.forEach((translation, index) => {
    cards.push(createBox(translation.input, `input-${index}`));
    cards.push(createBox(translation.output, `output-${index}`));
  });

  // Shuffle the cards
  shuffleArray(cards);

  // Add the cards to the game container
  cards.forEach(card => gameContainer.appendChild(card));

  // Start the game after a delay to allow players to see the initial state
  setTimeout(() => {
    cards.forEach(card => {
      card.classList.remove('initial');
      card.classList.add('hidden');
      card.textContent = '';
    });

    let firstCard = null;
    let secondCard = null;
    let lockBoard = false;
    let flipTimer = null;
    let matchedCount = 0;

    /**
     * Flips a card when clicked and handles game logic for matching pairs.
     * 
     * @function flipCard
     * @this {HTMLElement} The card element that was clicked.
     */
    function flipCard() {
      if (lockBoard || this === firstCard) return;

      clearTimeout(flipTimer);

      this.classList.add('flipped');
      this.classList.remove('hidden');
      this.textContent = this.dataset.content;

      if (!firstCard) {
        firstCard = this;
        flipTimer = setTimeout(() => {
          firstCard.classList.remove('flipped');
          firstCard.classList.add('hidden');
          firstCard.textContent = '';
          firstCard = null;
        }, 2000);
        return;
      }

      secondCard = this;
      lockBoard = true;

      const isMatch = firstCard.dataset.id.split('-')[1] === secondCard.dataset.id.split('-')[1];

      if (isMatch) {
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');
        firstCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('click', flipCard);
        matchedCount += 2;
        if (matchedCount === cards.length) {
          winnerMessage.style.display = 'block';
          resetButton.style.display = 'block';
        }
        resetBoard();
      } else {
        setTimeout(() => {
          firstCard.classList.remove('flipped');
          secondCard.classList.remove('flipped');
          firstCard.classList.add('hidden');
          secondCard.classList.add('hidden');
          firstCard.textContent = '';
          secondCard.textContent = '';
          resetBoard();
        }, 500);
      }
    }

    /**
     * Resets the game board state.
     * This function clears the selected cards and unlocks the board for the next turn.
     * 
     * @function resetBoard
     */
    function resetBoard() {
      [firstCard, secondCard, lockBoard] = [null, null, false];
    }

    // Add click event listeners to each card
    cards.forEach(card => card.addEventListener('click', flipCard));
  }, 4000);
}

/**
 * Resets the game by fetching translations and reinitializing the game.
 * This function is called when the reset button is clicked.
 * 
 * @function resetGame
 */
function resetGame() {
  fetchTranslations().then(data => initializeGame(data));
}

document.addEventListener('DOMContentLoaded', async () => {
  const translations = await fetchTranslations();
  initializeGame(translations);

  // Add event listener for reset button
  document.getElementById('reset-button').addEventListener('click', resetGame);
});