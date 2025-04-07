const chatBox = document.getElementById('chat-box');
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');

// Function to add messages to chat
function addMessage(sender, message) {
  const entry = document.createElement('div');
  entry.classList.add('chat-entry');
  entry.innerHTML = `<span class="${sender}">${sender === 'user' ? 'You' : 'Patient'}:</span> ${message}`;
  chatBox.appendChild(entry);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to get AI response via Netlify function
async function getAIResponse(message) {
  try {
    const response = await fetch("/.netlify/functions/chatgpt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      throw new Error("Network response was not OK");
    }

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error("Error fetching AI response:", error);
    return "Sorry, something went wrong with the simulation.";
  }
}

// Handle user input submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userInput = input.value.trim();
  if (userInput === "") return;

  addMessage('user', userInput);
  input.value = '';

  const aiReply = await getAIResponse(userInput);
  addMessage('bot', aiReply);
});
