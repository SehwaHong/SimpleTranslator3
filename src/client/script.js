/**
 * This script handles the dynamic functionalities of the SimpleTranslator application,
 * including language switching, translation, and saving translations.
 */

 const toggleSwitch = document.getElementById("switch");
 const title = document.getElementById("title");
 const inputTextbox = document.getElementById("input-textbox");
 const outputTextbox = document.getElementById("output-textbox");
 const gameColor = document.querySelector(".game_id");
 const historyColor = document.querySelector(".history_id");
 const languageDropdowns = document.querySelectorAll('.language-choices select');
 const switchButton = document.getElementById('language-switch-button');
 const saveButton = document.getElementById('save-translation-button');
 
 // Populate language dropdowns on page load
 document.addEventListener('DOMContentLoaded', async () => {
   await populateLanguageDropdowns();
 });
 
 // Event listener for the save translation feature
 saveButton.addEventListener('click', saveTranslation);
 
 // Event listener for the toggle switch to change background color and title color
 toggleSwitch.addEventListener('click', () => {
   document.body.style.backgroundColor = document.body.style.backgroundColor === 'pink' ? 'black' : 'pink';
   title.style.color = document.body.style.backgroundColor === 'black' ? 'pink' : 'black';
   gameColor.style.color = document.body.style.backgroundColor === 'black' ? 'pink' : 'black';
   historyColor.style.color = document.body.style.backgroundColor === 'black' ? 'pink' : 'black';
 });
 
 // Event listeners for language selection changes
 languageDropdowns.forEach(dropdown => {
   dropdown.addEventListener('change', translateText);
 });
 
 // Event listener for input textbox to trigger translation
 inputTextbox.addEventListener("input", translateText);
 
 // Event listener for the switch button to swap languages and trigger translation
 switchButton.addEventListener('click', () => {
   const temp = languageDropdowns[0].value;
   languageDropdowns[0].value = languageDropdowns[1].value;
   languageDropdowns[1].value = temp;
 
   // Swap the values of the input and output textboxes if both are not empty
   if (inputTextbox.value && outputTextbox.value) {
     const tempText = inputTextbox.value;
     inputTextbox.value = outputTextbox.value;
     outputTextbox.value = tempText;
 } else if (inputTextbox.value || outputTextbox.value) {
     // If one of them is empty, simply move the non-empty value to the other and clear the former
     inputTextbox.value = outputTextbox.value + inputTextbox.value;
     outputTextbox.value = '';
 }
 
   translateText(); // Call translate after switching languages
 });
 
 /**
  * Translates text from one language to another by making a POST request to the server.
  * Updates the outputTextbox with the translated text or an error message.
  */
 async function translateText() {
   const langIn = languageDropdowns[0].value;
   const langOut = languageDropdowns[1].value;
   const inputText = inputTextbox.value;
 
   if (!inputText) {
       outputTextbox.value = '';
       return;
   }
 
   try {
       const response = await fetch('/translate', {
           method: 'POST',
           headers: {'Content-Type': 'application/json'},
           body: JSON.stringify({input: inputText, lang_in: langIn, lang_out: langOut})
       });
 
       if (response.ok) {
           const translatedText = await response.text();
           outputTextbox.value = translatedText;
       } else if(response.status === 400) {
            const errorData = await response.json();
           outputTextbox.value = errorData.error;
       } else {
           outputTextbox.value = 'Translation failed.';
       }
   } catch (error) {
       console.error('Error translating text:', error);
       outputTextbox.value = 'Error during translation.';
   }
 }
 
 /**
  * Populates language selection dropdowns with available languages by fetching them from the server.
  */
 async function populateLanguageDropdowns() {
   try {
       const response = await fetch('/languages');
       const languages = await response.json();
       const langInSelect = document.getElementById('lang-in-select');
       const langOutSelect = document.getElementById('lang-out-select');
 
       Object.entries(languages).forEach(([code, name]) => {
           const optionIn = new Option(name, code);
           const optionOut = new Option(name, code);
           langInSelect.appendChild(optionIn);
           langOutSelect.appendChild(optionOut);
       });
   } catch (error) {
       console.error('Failed to load languages:', error);
   }
 }
 
 /**
  * Saves a translation to the database via a POST request to the server.
  * Only saves the translation if both input and translation texts are present.
  */
 async function saveTranslation() {
   const inputText = inputTextbox.value;
   const translatedText = outputTextbox.value;
   const langIn = document.getElementById('lang-in-select').selectedOptions[0].text;
   const langOut = document.getElementById('lang-out-select').selectedOptions[0].text;
 
   console.log("input:" + inputText);
 
   console.log("output:" + translatedText);
 
   if (!inputText || !translatedText) {
       console.error('Both input and translation must be present to save.');
       return;
   }
 
   try {
       const response = await fetch('/store', {
           method: 'POST',
           headers: {'Content-Type': 'application/json'},
           body: JSON.stringify({
               input: inputText,
               output: translatedText,
               lang_in: langIn,
               lang_out: langOut
           })
       });
 
       if (response.ok) {
           console.log('Translation saved successfully');
           // Optionally clear input/output fields or give user feedback
       } else {
           console.error('Failed to save translation');
           // Handle errors, possibly show user an error message
       }
   } catch (error) {
       console.error('Error saving translation:', error);
   }
 }
 
 /**
  * Handles input in the search field to fetch and display translations found.
  * Displays translations in a list and clears the list if no input is present.
  */
 document.getElementById('search').addEventListener('input', async function() {
   const searchText = this.value;
   const resultsList = document.getElementById('list');
   
   if (!searchText) {
       resultsList.innerHTML = ''; // Clear the list if the search box is cleared
       return;
   }
 
   try {
       const response = await fetch(`/searchTranslations?searchText=${encodeURIComponent(searchText)}`);
       if (!response.ok) throw new Error('Failed to fetch translations');
       const translations = await response.json();
 
       if (translations.length === 0) {
           resultsList.innerHTML = '<li class="no-results">No results found.</li>';
           return;
       }
 
       resultsList.innerHTML = ''; // Clear previous results
       translations.forEach(translation => {
           const listItem = document.createElement('li');
         listItem.innerHTML = `<strong>Input:</strong> ${translation.input} 
           <p><strong>Output:</strong> ${translation.output}
           <p><strong>From:</strong> ${translation.lang_in} 
           <p><strong>To:</strong> ${translation.lang_out}`;
           resultsList.appendChild(listItem);
       });
   } catch (error) {
       console.error('Error fetching translations:', error);
       resultsList.innerHTML = '<li class="no-results">Error loading results.</li>';
   }
 });
 
 /**
  * Clears the search input and results list when the clear button is clicked.
  */
 document.getElementById('clear').addEventListener('click', function(event) {
     event.preventDefault();  // Prevent form submission
     document.getElementById('search').value = '';
     document.getElementById('list').innerHTML = '';
 });
 
 gameColor.addEventListener('mouseenter', () => {
   gameColor.style.color = 'rgb(218, 25, 225)';
   gameColor.style.textDecoration = 'underline';
 });
 
 gameColor.addEventListener('mouseleave', () => {  
   gameColor.style.color = document.body.style.backgroundColor === 'black' ? 'pink' : 'black';
   gameColor.style.textDecoration = 'none';
 });
 
 historyColor.addEventListener('mouseenter', () => {
   historyColor.style.color = 'rgb(218, 25, 225)';
   historyColor.style.textDecoration = 'underline';
 });
 
 historyColor.addEventListener('mouseleave', () => {
   historyColor.style.color = document.body.style.backgroundColor === "black" ? "pink" : "black";
   historyColor.style.textDecoration = 'none';
 });
 