exports.handler = async function(event, context) {
  try {
    const body = JSON.parse(event.body);
    const userMessage = body.message;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("Missing OpenAI API key.");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a realistic EMS patient simulator. Start with dispatch, wait for contact, respond only to what the user does or says, and follow NREMT simulation protocol strictly. Do not guide or correct. End when handoff is complete."
          },
          {
            role: "user",
            content: userMessage
          }
        ]
      })
    });

    const data = await response.json();
    console.log("AI Response:", JSON.stringify(data));

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error("AI reply is missing or malformed.");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };

  } catch (err) {
    console.error("Function error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "Sorry, something went wrong on the server." })
    };
  }
};
