/**
 * Fetches history data from the backend server and updates the DOM accordingly.
 */
document.addEventListener('DOMContentLoaded', () => {
    fetchHistory();
});

/**
 * Fetches history data from the backend server and updates the DOM with history entries or a message if no history is available.
 * @returns {Promise<void>} A Promise that resolves when the history data is fetched and DOM is updated.
 */
async function fetchHistory() {
    try {
        // Backend server's endpoint for reading history
        const response = await fetch('/read?n=50');  // Adjust n as required
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const historyData = await response.json();
        
        if (historyData.length === 0) {
            updateHistoryDOMEmpty();
        } else {
            updateHistoryDOM(historyData);
        }
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        document.querySelector('.history-box-container').innerHTML = `<p>Failed to load history: ${error.message}</p>`;
    }
}

/**
 * Updates the DOM with history entries.
 * @param {Object[]} historyData - Array of history data objects.
 */
function updateHistoryDOM(historyData) {
    const container = document.querySelector('.history-box-container');
    container.innerHTML = ''; // Clear existing content
    historyData.forEach((item, index) => {
        const historyElement = document.createElement('div');
        historyElement.className = 'history-box';
        historyElement.innerHTML = `
            <h2>History ${index + 1}</h2>
            <p><strong>Input:</strong> ${item.input}</p>
            <p><strong>Output:</strong> ${item.output}</p>
            <p><strong>From:</strong> ${item.lang_in} <strong>To:</strong> ${item.lang_out}</p>
        `;
        container.appendChild(historyElement);
    });
}

/**
 * Updates the DOM with a message when no history is available.
 */
function updateHistoryDOMEmpty() {
    const container = document.querySelector('.history-box-container');
    container.innerHTML = '<p class="centered-message">No history available yet</p>';
}
