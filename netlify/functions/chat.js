const fetch = require('node-fetch');

exports.handler = async function(event) {
  try {
    const { message } = JSON.parse(event.body);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a virtual EMS patient responding to assessment questions. Be realistic and concise.' },
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();

    const reply = data.choices?.[0]?.message?.content || 'No response available.';

    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: 'There was an error processing your request.' })
    };
  }
};
