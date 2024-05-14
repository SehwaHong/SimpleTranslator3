import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import * as db from './db.js';
import fetch from 'node-fetch';
import fs from 'fs'; 

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 5501;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(join(__dirname, '..', 'client')));


/**
 * Serves the language data from a JSON file.
 * This endpoint reads a JSON file containing language codes and their corresponding names,
 * and sends it back as a JSON response. It's used for dynamically loading language options
 * on the client-side.
 *
 * @route GET /languages
 * @returns {Object} 200 - A JSON object containing language codes and names.
 * @returns {Error}  500 - Returns a server error if the file cannot be read.
 */
app.get('/languages', (req, res) => {
  const filePath = join(__dirname, 'languages.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading language file:', err);
            res.status(500).send('Failed to load language data');
            return;
        }
        try {
            const languages = JSON.parse(data);
            res.json(languages);
        } catch (parseError) {
            console.error('Error parsing JSON data:', parseError);
            console.error('Data received:', data);
            res.status(500).send('Failed to parse language data');
        }
    });
});

/**
 * Handles POST requests to translate text from one language to another using an external translation service.
 * This endpoint requires three pieces of data: the text to translate, the source language code, and the target language code.
 * It constructs a request to the MyMemory Translated API, parses the response, and returns the translated text.
 * If the API returns a specific error message about language selection, it responds with an appropriate error message.
 * 
 * @param {string} req.body.input - The text to be translated.
 * @param {string} req.body.lang_in - The ISO language code of the source language (e.g., 'en' for English).
 * @param {string} req.body.lang_out - The ISO language code of the target language (e.g., 'fr' for French).
 * @returns {Promise<Response>} - The response object from Express, containing the translated text if successful.
 * @throws {Error} - Sends a 500 HTTP status code and error information if an error occurs during the API request or handling.
 */
app.post('/translate', async (req, res) => {
  try {
      // Extract input text, input language, and output language from request body
      const { input, lang_in, lang_out } = req.body;

      // Make a request to the translation API
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=${lang_in}|${lang_out}`;

      // Extract the translated text from the response
      const response = await fetch(url);
      const json = await response.json();
      const translatedText = json.responseData.translatedText;

      // Check for a specific error message from the API
      if (translatedText === "PLEASE SELECT TWO DISTINCT LANGUAGES") {
          return res.status(400).json({ error: "PLEASE SELECT TWO DISTINCT LANGUAGES" });
      }

      // Send the translated text as the response
      res.status(200).send(translatedText);
  } catch (error) {
      // Handle errors
      console.error('Error translating text:', error);
      res.status(500).json({ error: 'An error occurred while translating text', error});
  }
});


/**
 * Asynchronously creates a history of the translation in the database. If the input field is empty,
 * a 400 status code is returned to indicate database update failure. Otherwise, it stores the full
 * translation history.
 * 
 * TODO: add a check for past translation, if exists update id number to match the order.
 * 
 * CRUD: create
 */
app.post('/store', async (req, res) => {
    const { input, output, lang_in, lang_out } = req.body;
    if (!input || !output || !lang_in || !lang_out) {
        res.status(400).send("<h1>Translation input required</h1>");
        return;
    }
    try {
        await db.saveTranslation(input, output, lang_in, lang_out);
        res.status(200).send(`<h1>Translation of ${input} successfully stored</h1>`);
    } catch (err) {
        res.status(500).send(`<h1>Internal Server Error: ${err}</h1><p>Unable to store translation</p>`);
    }
});

/**
 * Asynchronously reads the history of the past n translations. If n are unavailable, only available
 * history is returned and the user is notified.
 * 
 * CRUD: read
 */
app.get('/read', async (req, res) => {
    const n = req.query.n ? parseInt(req.query.n) : 10; // Default to 10 if not specified
    try {
        const history = await db.loadHistory(n);
        res.status(200).json(history);
    } catch (err) {
        res.status(404).send(`<h1>History unavailable</h1>`);
    }
});

/**
 * Clear All History: Clears the database and resets history.
 * 
 * CRUD: delete
 */
app.delete('/clear', async (req, res) => {
    try {
        await db.clearTranslationHistory();
        res.status(200).send(`<h1>All History Successfully Cleared</h1>`);
    } catch (err) {
        res.status(404).send(`<h1>Error deleting all history</h1>`);
    }
});

/**
 * Asynchronously updates the history of phrases into single words for matching tile game.
 * 
 * CRUD: update
 */
app.put('/update', async (req, res) => {
    try {
        const translations = await db.loadHistory(); // Assuming this retrieves all translations
        const transformedTranslations = translations.map(translation => {
            // Transformation logic here
            return translation; // Placeholder for transformed translation
        });
        await db.updateTranslationHistory(transformedTranslations);
        res.status(200).send(`<h1>Translation History Successfully Updated</h1>`);
    } catch (err) {
        res.status(500).send(`<h1>Error updating translation history</h1>`);
    }
});

/**
 * Endpoint to search and retrieve full translation objects based on the search input.
 * 
 * @route GET /searchTranslations
 * @param {string} searchText - Query string to search for in saved translations.
 * @returns {Array<Object>} - List of translation objects that match the query.
 */
app.get('/searchTranslations', async (req, res) => {
  const searchText = req.query.searchText;
  if (!searchText) {
      return res.status(400).send({ error: "Search text is required." });
  }

  try {
    // Assuming `searchTranslations` is adapted to return full translation objects
    const translations = await db.searchTranslations(searchText);
    res.json(translations);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

/**
* Endpoint to retrieve a full translation object by exact input text.
* 
* @route GET /getTranslation
* @param {string} inputText - Exact input text to retrieve the full translation object.
* @returns {Object} - Full translation object if found.
*/
app.get('/getTranslation', async (req, res) => {
  const inputText = req.query.inputText;
  if (!inputText) {
      return res.status(400).send({ error: "Query parameter 'searchTranslations' is required." });
  }

  try {
    const translation = await db.getTranslation(inputText);
    if (translation) {
        res.json(translation);
    } else {
        res.status(404).json({ error: 'No matching translation found.' });
    }
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


// Handling requests to the root of the server
app.get('/', (req, res) => {
  // This route will serve 'index.html' from the 'src/client' directory
  res.sendFile(join(__dirname, '..', 'client', 'index.html'));
});

// Handling requests to the history page of the server
app.get('/history.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'history.html'));
});

// Handling requests to the game page of the server
app.get('/game.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'game.html'));
});

// Handle any other routes not implemented
app.all('*', (req, res) => {
    res.status(404).send("Page not found.");
});

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
