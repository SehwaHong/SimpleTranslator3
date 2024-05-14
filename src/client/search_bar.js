document.addEventListener("DOMContentLoaded", function() {
    const searchInput = document.getElementById("search");
    const clearButton = document.getElementById("clear");
    const resultList = document.getElementById("list");

    // Function to handle search functionality
    function search() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        // Perform search operation (e.g., filter items, fetch data, etc.)
        // For demonstration purposes, let's just log the search term
        console.log("Search term:", searchTerm);
    }

    // Function to clear search results
    function clearSearch() {
        searchInput.value = ""; // Clear the search input field
        resultList.innerHTML = ""; // Clear the search result list
    }

    // Event listener for search input
    searchInput.addEventListener("input", function() {
        search();
    });

    // Event listener for clear button
    clearButton.addEventListener("click", function() {
        clearSearch();
    });
});
