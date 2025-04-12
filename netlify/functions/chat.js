const fetch = require('node-fetch');

const GPT3_MODEL = "gpt-3.5-turbo";
const GPT4_MODEL = "gpt-4-turbo";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

exports.handler = async function(event, context) {
  try {
    const { message } = JSON.parse(event.body);
    const apiKey = process.env.OPENAI_API_KEY;

    // Step 1: Use GPT-3.5 as triage
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
            content: `You are an EMS simulator assistant. 
Your job is to triage the user's message and respond in one of two ways:
- If you can handle the response as a proctor or dispatcher, answer directly.
- If the message is complex (e.g. patient speaking, emotional, or requires scoring), respond only with: ESCALATE`
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
      // Step 2: Use GPT-4 Turbo for complex responses
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
              content: `You are an EMS virtual patient simulator using GPT-4. Respond in realistic detail as either the patient or provide a detailed scenario summary or score breakdown.`
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

    // GPT-3.5 responded normally
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: triageOutput })
    };

  } catch (err) {
    console.error("Chat error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "⚠️ Server error." })
    };
  }
};
