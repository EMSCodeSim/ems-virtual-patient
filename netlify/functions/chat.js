const fetch = require("node-fetch");

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GPT3_MODEL = "gpt-3.5-turbo";
const GPT4_MODEL = "gpt-4-turbo";

exports.handler = async function (event, context) {
  try {
    const { message } = JSON.parse(event.body);
    const apiKey = process.env.OPENAI_API_KEY;

    const lowerMsg = message.toLowerCase();

    // Step 1: Send to GPT-3.5 (Proctor + Triage)
    const triage = await fetch(OPENAI_API_URL, {
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
            content: `You are the NREMT Proctor for an EMS simulation. 
Respond ONLY as the Proctor.
- Provide vitals if asked (e.g., BP, HR, skin).
- Give scene details like safety, number of patients.
- Do NOT help unless asked directly.
- If the message is directed at the patient or asks for feedback, reply with just: ESCALATE.`
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const triageData = await triage.json();
    const triageOutput = triageData.choices?.[0]?.message?.content?.trim();

    if (triageOutput === "ESCALATE") {
      // Step 2: Send to GPT-4 Turbo for patient or feedback logic
      const gpt4 = await fetch(OPENAI_API_URL, {
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
              content: `You are simulating a realistic EMS patient or providing scenario scoring.
If the message is a question to the patient:
- Answer realistically based on your condition.
- Do NOT guide or help unless directly asked.
- React emotionally and physically appropriate to the condition.

If the user is asking for feedback:
- Score the scenario out of 48 points.
- Mention what they did correctly and missed.
- Provide 2-3 improvement tips.
- Mention any critical failures if present.`
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      });

      const gpt4Data = await gpt4.json();
      const gpt4Output = gpt4Data.choices?.[0]?.message?.content?.trim();

      return {
        statusCode: 200,
        body: JSON.stringify({ reply: gpt4Output || "⚠️ GPT-4 failed to respond." })
      };
    }

    // Default: GPT-3.5 Proctor response
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: triageOutput })
    };

  } catch (err) {
    console.error("Chat error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "⚠️ Server error occurred." })
    };
  }
};
