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
            content: ' Patient- you will role-play as a realistic patient with a medical complaint as discribed in the dispatch information. Only answer questions that the user directly asks. Do not guide or coach. Use emotional, physical, and verbal responses appropriate to the patient's condition. React realistically if the user skips steps or does not build rapport, or does not provide treatment in a timely manor. Adjust your answers based on the user's assessment or treatment quality. .'
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
