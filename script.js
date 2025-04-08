const chatBox = document.getElementById('chat-box');
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const micBtn = document.createElement('button');

micBtn.textContent = '🎤';
micBtn.type = 'button';
micBtn.style.marginLeft = '10px';
form.appendChild(micBtn);

let simulationEnded = false;

// Speak patient responses
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
}

// Add messages to the chat window
function addMessage(sender, message) {
  const entry = document.createElement('div');
  entry.classList.add('chat-entry');
  entry.innerHTML = `<span class="${sender}">${sender === 'user' ? 'You' : 'Patient'}:</span> ${message}`;
  chatBox.appendChild(entry);
  chatBox.scrollTop = chatBox.scrollHeight;
  if (sender === 'bot') speak(message);
}

// Send user input to the AI
async function getAIResponse(message) {
  const response = await fetch('/.netlify/functions/chatgpt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  const data = await response.json();
  return data.reply;
}

// Submit text input
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

// Speech recognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognizer = new SpeechRecognition();
recognizer.lang = 'en-US';
recognizer.interimResults = false;
recognizer.continuous = false;

micBtn.addEventListener('click', () => {
  recognizer.start();
});

// When speech is recognized
recognizer.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  input.value = transcript;
  form.dispatchEvent(new Event('submit'));
};

recognizer.onerror = (event) => {
  console.error('Speech recognition error:', event.error);
};
