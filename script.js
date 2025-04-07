const chatBox = document.getElementById('chat-box');
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');

async function getAIResponse(message) {
  const response = await fetch("/.netlify/functions/chatgpt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message })
  });
  const data = await response.json();
  return data.reply;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const question = input.value.trim();
  if (question === "") return;

  addMessage('user', question);
  input.value = '';

  const reply = await getAIResponse(question);
  addMessage('bot', reply);
});
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
