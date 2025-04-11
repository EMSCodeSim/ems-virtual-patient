const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  try {
    const body = JSON.parse(event.body);
    const userMessage = body.message;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: " Patient- you will role-play as a realistic patient with a medical complaint as described in the dispatch information. Only answer questions that the user directly asks. Do not guide or coach. Use emotional, physical, and verbal responses appropriate to the patient's condition. React realistically if the user skips steps or does not build rapport, or does not provide treatment in a timely manor. Adjust your answers based on the user's assessment or treatment quality. ." },
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ reply }) // 🔥 Fix is here
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch from OpenAI", details: err.message })
    };
  }
};
