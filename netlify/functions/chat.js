const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  try {
    const { message } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ reply: 'No message provided.' })
      };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are simulating a patient for an NREMT medical assessment. Only answer questions a real patient could answer. Respond naturally, do not provide clinical interpretations. Wait for questions and give relevant information only when asked. Use layperson language. If the user asks for vitals or information the patient wouldn’t know, a Proctor will respond instead.'
          },
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, no reply received.';

    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: 'Server error. Please try again later.' })
    };
  }
};
