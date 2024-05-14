# SimpleTranslator

SimpleTranslator is a comprehensive web application that facilitates text translation between different languages. It features a translation service, a history tracking system, and an engaging matching game that uses translations. The client-side handles user interactions, displaying translations, and the matching game, while the server-side manages translation requests, history storage, and language data.


## Dependencies

This application utilizes the MyMemory Translated API for translation services. This API is freely available and supports a wide range of languages, making it a suitable choice for applications requiring multilingual translation capabilities.

For more details about the API and its specifications, visit the [MyMemory Translated API documentation](https://mymemory.translated.net/doc/spec.php).

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/1985lxw/SimpleTranslator.git
   cd SimpleTranslator

2. **Install dependencies:**
    ```bash
    npm install

3. **Run the server:**
    ```bash
    npm start

## Configuration

Ensure that the languages.json file in the /server directory contains the appropriate language codes and names. This file is used to dynamically load available translation languages.


## API Routes and Functionalities

### `/translate` (POST)

Translates text from one language to another using the MyMemory Translated API.

- **Endpoint:** `/translate`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "input": "Hello world!",
    "lang_in": "en",
    "lang_out": "fr"
  }
  ```
- **Response:**
  - `200 OK`: Returns the translated text.
  - `400 Bad Request`: Returns an error if input and output languages are the same.
  - `500 Internal Server Error`: Returns an error if the translation service fails.

**Example usage:**
  ```bash
  curl -X POST \
    -H "Content-Type: application/json" \
    -d '{"input":"Hello world!","lang_in":"en","lang_out":"fr"}' \
    http://localhost:5501/translate
  ```

### `/languages` (GET)

Serves the language data from a JSON file.

- **Endpoint:** `/languages`
- **Method:** `GET`
- **Response:**
  - `200 OK`: Returns a JSON object containing language codes and names.
  - `500 Internal Server Error`: Returns an error if the file cannot be read.

### `/store` (POST)

Stores a translation in the database.

- **Endpoint:** `/store`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "input": "Hello",
    "output": "Bonjour",
    "lang_in": "en",
    "lang_out": "fr"
  }
  ```
- **Response:**
  - `200 OK`: Confirms successful storage.
  - `400 Bad Request`: Returns an error if input is missing.
  - `500 Internal Server Error`: Returns an error if storing fails.

### `/read` (GET)

Retrieves the history of past translations.

- **Endpoint:** `/read`
- **Method:** `GET`
- **Query Parameters:**
  - `n` (optional): Number of recent translations to retrieve (default is 10).
- **Response:**
  - `200 OK`: Returns the translation history.
  - `404 Not Found`: Returns an error if history is unavailable.

### `/clear` (DELETE)

Clears all translation history.

- **Endpoint:** `/clear`
- **Method:** `DELETE`
- **Response:**
  - `200 OK`: Confirms successful clearing of history.
  - `404 Not Found`: Returns an error if clearing fails.

### `/searchTranslations` (GET)

Searches for translations based on the input text.

- **Endpoint:** `/searchTranslations`
- **Method:** `GET`
- **Query Parameters:**
  - `searchText` (required): Text to search for.
- **Response:**
  - `200 OK`: Returns matching translation objects.
  - `400 Bad Request`: Returns an error if search text is missing.
  - `500 Internal Server Error`: Returns an error if search fails.

### `/getTranslation` (GET)

Retrieves a full translation object by exact input text.

- **Endpoint:** `/getTranslation`
- **Method:** `GET`
- **Query Parameters:**
  - `inputText` (required): Exact text to retrieve the translation.
- **Response:**
  - `200 OK`: Returns the translation object.
  - `400 Bad Request`: Returns an error if input text is missing.
  - `404 Not Found`: Returns an error if no matching translation is found.
  - `500 Internal Server Error`: Returns an error if retrieval fails.

### `/` (GET)

Serves the main page of the application.

- **Endpoint:** `/`
- **Method:** `GET`
- **Response:**
  - `200 OK`: Returns the `index.html` file.

### `/history.html` (GET)

Serves the translation history page.

- **Endpoint:** `/history.html`
- **Method:** `GET`
- **Response:**
  - `200 OK`: Returns the `history.html` file.

### `/game.html` (GET)

Serves the translation game page.

- **Endpoint:** `/game.html`
- **Method:** `GET`
- **Response:**
  - `200 OK`: Returns the `game.html` file.

### `/*` (ALL)

Handles any other routes not implemented.

- **Response:**
  - `404 Not Found`: Returns an error for unspecified routes.
