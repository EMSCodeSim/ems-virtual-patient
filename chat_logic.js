// Function to load prebuilt responses from the JSON file
async function loadPrebuiltResponses() {
    const response = await fetch('prebuilt_responses.json');
    return await response.json();
}

// Function to handle user messages
function handleUserMessage(message, prebuiltResponses) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("chest pain")) {
        return prebuiltResponses["chest pain"].questions.join(" ");
    } else if (lowerMessage.includes("respiratory distress") || lowerMessage.includes("difficulty breathing")) {
        return prebuiltResponses["respiratory distress"].questions.join(" ");
    } else if (lowerMessage.includes("give aspirin")) {
        return "You have administered 324mg aspirin. Continue monitoring.";
    } else {
        return "Please continue your assessment.";
    }
}

// Example usage
loadPrebuiltResponses()
    .then(prebuiltResponses => {
        // Example message handling
        const message = "The patient is experiencing chest pain.";
        const response = handleUserMessage(message, prebuiltResponses);
        console.log(response); // Logs the response based on the prebuilt responses
    })
    .catch(error => {
        console.error("Error loading prebuilt responses:", error);
    });
