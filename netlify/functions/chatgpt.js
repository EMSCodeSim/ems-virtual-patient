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
            content: "You are a interactive EMS NREMT patient simulator. Start with dispatch information giving limited information on chief complaint, describe the scene but do not say scene is safe unless asked, respond only to what the user does or says, only respons as the patient do not break your role, and follow NREMT EMT-B protocol strictly. Do not guide or correct. End when handoff is complete and give feedback."
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
