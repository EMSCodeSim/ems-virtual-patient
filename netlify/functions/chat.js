const fetch = require('node-fetch');

const GPT3_MODEL = "gpt-3.5-turbo";
const GPT4_MODEL = "gpt-4-turbo";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

exports.handler = async function(event, context) {
  try {
    const { message } = JSON.parse(event.body);
    const apiKey = process.env.OPENAI_API_KEY;

    // Step 1: Send message to GPT-3.5 as triage
    const triageResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: GPT3_MODEL,
        messages: [
          {
            role: "system",
            content: `You are an EMS simulator. Your role is to triage the user's message and decide whether:
1. You should respond directly as a proctor.
2. You should escalate the message to GPT-4 if it requires emotional complexity, patient dialogue, or final scenario scoring.
If escalation is needed, reply only with: ESCALATE.
Otherwise, reply with your response as a proctor.`
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const triageData = await triageResponse.json();
    const triageOutput = triageData.choices?.[0]?.message?.content?.trim();

    if (triageOutput === "ESCALATE") {
      // Step 2: Escalate to GPT-4
      const gpt4Response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: GPT4_MODEL,
          messages: [
            {
              role: "system",
              content: `You are a highly realistic EMS patient simulator. Respond with patient dialogue, complex reasoning, emotional tone, or provide scenario scoring when needed.`
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      });

      const gpt4Data = await gpt4Response.json();
      const gpt4Output = gpt4Data.choices?.[0]?.message?.content?.trim();

      return {
        statusCode: 200,
        body: JSON.stringify({ reply: gpt4Output })
      };
    }

    // GPT-3.5 handled it
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: triageOutput })
    };

  } catch (err) {
    console.error("Chat error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "⚠️ Error handling the message." })
    };
  }
};
