// Function to change the text color of an element
function showText(event) {
    // Check if the clicked element has one of the specified classes
    if (['FAZ', 'FEZ', 'SAZ', 'SEZ', 'GP', 'FP'].includes(event.target.className)) {
        event.target.style.color = "black";
    }
}

// Loop through possible container IDs (A to Z) and attach the event listener
for (let i = 65; i <= 90; i++) { // ASCII values for A to Z
    const containerId = String.fromCharCode(i);
    const container = document.getElementById(containerId);
    if (container) {
        container.addEventListener('click', showText);
    }
}
