import PouchDB from "pouchdb";
//quicker querying
import pouchdbFind from "pouchdb-find";

PouchDB.plugin(pouchdbFind);

// this is for history
const db = new PouchDB("translation-history");
// this is for the game
const db_words = new PouchDB("translation-words");

/**
 * FUNCTIONS ACCESSING DATABASE:
 * - nextID
 * - saveTranslation
 * - deleteTranslation
 * - clearTranslationHistory
 * - findTranslation
 * - loadHistory
 * 
 * - TODO: break up sentences into words and update translation-words
 */

/**
 * Determines the next free id number for storage
 * 
 * @async
 * @param {boolean} words - whether we're finding the id of words database or translation
 * @returns {number} id - next available id in database
 */
async function nextID(words = false) {
    // retrieves most recent document
    const lastTranslation = await db.allDocs({
        include_docs: true,
        descending: true,
        limit: 1
    });
    
    // Determines the next id number, deals with no translation issue
    let id = 0;
    if (lastTranslation.rows.length > 0) {
        id = parseInt(lastTranslation.rows[0].doc._id) + 1;
    }

    return id.toString();
}

/**
 * Stores a translation only if it does not exist with the same input, lang_in, and lang_out.
 * 
 * @param {string} input - The text input of what we wanted translated.
 * @param {string} output - The result of the translation.
 * @param {string} lang_in - The starting language code.
 * @param {string} lang_out - The result language code.
 * @throws Error - if there's a problem accessing the database.
 */
export async function saveTranslation(input, output, lang_in, lang_out) {
    try {
        const existingId = await findTranslation(input, lang_in, lang_out);
        if (existingId) {
            // Translation already exists, optionally update or skip saving.
            console.log(`Translation for '${input}' from '${lang_in}' to '${lang_out}' already exists.`);
            return;
        }
        
        const id = await nextID(); // gets the next available id
        await db.put({ _id: id, input, output, lang_in, lang_out }); // stores the new translation
        console.log('Translation saved successfully:', { id, input, output, lang_in, lang_out });
    } catch (error) {
        throw new Error(`Error storing history of input ${input}: ${error}`);
    }
}

/**
 * Clear Translation: removes a translation. This is typically done when the user enters a duplicate translation.
 * 
 * @async
 * @param {number} id - the id of the document to be marked as deleted
 * @throws Error - if the ID is not found
 */
async function deleteTranslation(id) {
    try {
        const doc = await db.get(id);
        await db.remove(doc);
    } catch (err) {
        console.log(`Error removing document id=${id}: ${err}`)
    }
}

/**
 * Clear History: Resets database for entirely new translations
 * 
 * @async
 * @throws Error - if there's a problem accessing the database
 */
export async function clearTranslationHistory() {
    try {
        const allDocs = await db.allDocs();
        const forRemoval = allDocs.rows.map(row => ({
            _id: row.id,
            _rev: row.value.rev,
            _deleted: true
        }));
        await db.bulkDocs(forRemoval);
    }
    catch (error){
        throw new Error(`Error deleting documents from database: ${error}`);
    }
}

/**
 * Searches history for a specific translation to prevent duplicates.
 * 
 * @param {string} input - The input text of the translation.
 * @param {string} lang_in - The language code of the input text.
 * @param {string} lang_out - The language code of the output text.
 * @returns {string|null} - The id of the found translation document or null if not found.
 */
async function findTranslation(input, lang_in, lang_out) {
    try {
        const result = await db.find({
            selector: {
                input: { $eq: input },
                lang_in: { $eq: lang_in },
                lang_out: { $eq: lang_out }
            },
            limit: 1
        });
        return result.docs.length > 0 ? result.docs[0]._id : null;
    } catch (error) {
        console.error("Error searching translation history:", error);
        return null;
    }
}

/**
 * Loads translation history
 * 
 * @async
 * @param {number} n - represents loading the n most recent documents
 * @returns Promise<> - resolves to translation history if any
 * @throws Error - if there's a problem accessing the database
 */
export async function loadHistory(n) {
    try {
        const result = await db.allDocs({ include_docs: true, descending: true, limit: n });

        if (result.rows.length < n) {
            console.log(`database only contains ${result.rows.length} instead of ${n}`);
        }

        return result.rows.map(row => row.doc);
    } 
    catch (error) {
        throw new Error(`Error loading documents from database: ${error}`);
    }
}

/** NOT IMPLEMENTED
 * Splits up phrases from translation-history and updates translation-words
 * 
 * @async
 * @param {string} input - the translation input
 * @param {string} lang_in - the input language
 * @throws Error - if there's a problem accessing the database
 */
export async function updateWords(input, lang_in) {
    try {
        const query = {
            "input": input,
            "lang_in": lang_in
        };

        const result = await db.find({ selector: query });

        if (result.docs.length > 0) {
            //if found
            const punctuation = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/;

            const in_words = result.docs[0].input.split(" ");
            in_words = in_words.map((word) => {
                return word.replace(punctuation, "");
            });
            
            const output_words = result.docs[0].output.split(" ");
            output_words = output_words.map((word) => {
                return word.replace(punctuation, "");
            });
            //error here, what if the words are not the same length?
            const id = nextID(true);
            await db_words.put({ _id: id, words });
        } 
        else {
            // if not found
            throw new Error('Translation not found in history');
        }
    }
    catch (error) {
        throw new Error(`Error updating translation words: ${error}`);
    }
}

/**
 * Clears words database to reset matching game
 * 
 * @async
 * @throws Error - if there's a problem deleting database
 */
export async function clearWords() {
    try {
        const allDocs = await db_words.allDocs();
        const forRemoval = allDocs.rows.map(row => ({
            _id: row.id,
            _rev: row.value.rev,
            _deleted: true
        }));
        await db.bulkDocs(forRemoval);
    } catch (error) {
        throw new Error(`Error deleting words database: ${error}`);
    }
}

/**
 * Search translations that match the given text partially or exactly.
 * @param {string} searchText - The text to search for in input translations.
 * @returns {Promise<Array<string>>} - A promise that resolves to an array of matching input texts.
 */
export async function searchTranslations(searchText) {
    try {
        const regex = new RegExp(searchText, 'i');  // Case-insensitive regex
        const result = await db.find({
            selector: { input: { $regex: regex } }
        });
        return result.docs;  // Return full docs
    } catch (error) {
        console.error("Error searching translations:", error);
        throw new Error('Failed to search translations');
    }
}


/**
 * Get a full translation for an exact match to the input text.
 * @param {string} inputText - The exact text of the translation input to find.
 * @returns {Promise<Object|null>} - A promise that resolves to the translation object or null if not found.
 */
export async function getTranslation(inputText) {
    try {
        const result = await db.find({
            selector: { input: { $eq: inputText } },
            limit: 1
        });
        return result.docs.length > 0 ? result.docs[0] : null;
    } catch (error) {
        console.error("Error retrieving translation:", error);
        throw new Error('Failed to retrieve translation');
    }
}
