const chatBox = document.getElementById('chat-box');
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');

let simulationEnded = false;

function addMessage(sender, message) {
  const entry = document.createElement('div');
  entry.classList.add('chat-entry');
  entry.innerHTML = `<span class="${sender}">${sender === 'user' ? 'You' : 'Patient'}:</span> ${message}`;
  chatBox.appendChild(entry);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function getAIResponse(message) {
  const response = await fetch('/.netlify/functions/chatgpt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });

  const data = await response.json();
  return data.reply;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userInput = input.value.trim();
  if (userInput === '') return;

  addMessage('user', userInput);
  input.value = '';

  if (simulationEnded) {
    addMessage('bot', "The simulation has ended. Refresh the page to restart.");
    return;
  }

  const reply = await getAIResponse(userInput);
  addMessage('bot', reply);

  if (userInput.toLowerCase().includes("handoff") || userInput.toLowerCase().includes("hospital")) {
    simulationEnded = true;
  }
});
