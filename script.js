const chatBox = document.getElementById('chat-box');
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');

// Basic response logic — customize this!
const responses = {
  "what's your name": "My name is John. I think I hurt my chest.",
  "where does it hurt": "My chest really hurts, especially when I breathe.",
  "how old are you": "I'm 57 years old.",
  "are you allergic to anything": "Yes, I'm allergic to penicillin.",
  "do you take any medications": "Yes, I take lisinopril for high blood pressure."
};

function addMessage(sender, message) {
  const entry = document.createElement('div');
  entry.classList.add('chat-entry');
  entry.innerHTML = `<span class="${sender}">${sender === 'user' ? 'You' : 'Patient'}:</span> ${message}`;
  chatBox.appendChild(entry);
  chatBox.scrollTop = chatBox.scrollHeight;
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const question = input.value.trim();
  if (question === "") return;

  addMessage('user', question);
  input.value = '';

  // Basic keyword matching
  const lower = question.toLowerCase();
  let response = "I'm not sure how to answer that.";

  for (let key in responses) {
    if (lower.includes(key)) {
      response = responses[key];
      break;
    }
  }

  setTimeout(() => addMessage('bot', response), 500); // Simulate delay
});
