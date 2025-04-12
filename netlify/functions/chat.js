const fetch = require("node-fetch");

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GPT3_MODEL = "gpt-3.5-turbo";
const GPT4_MODEL = "gpt-4-turbo";

exports.handler = async function (event, context) {
  try {
    const { message } = JSON.parse(event.body);
    const apiKey = process.env.OPENAI_API_KEY;

    // Quick check to decide if this is a patient interaction or score request
    const escalateTriggers = [
      "pain", "symptoms", "describe", "where does it hurt",
      "how long", "how bad", "radiate", "feel like", "scale of",
      "feedback", "score", "how did I do", "what did I miss"
    ];

    const lowerMsg = message.toLowerCase();
    const shouldEscalate = escalateTriggers.some(trigger => lowerMsg.includes(trigger));

    // 🔁 Step 1: Use GPT-3.5 as default triage + proctor
    if (!shouldEscalate) {
      const triageResponse = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GPT3_MODEL,
          messages: [
            {
              role: "system",
              content: `You are the NREMT Proctor for an EMS scenario. 
Your role is to observe, score, and respond ONLY as a proctor.
- Do not help unless asked.
- If the user says "I check BP" or "I check vitals", give appropriate values (e.g., "BP is 110/70").
- Track and internally score NREMT actions. 
- Only respond to what a real test proctor would say.
- If the message seems like patient dialogue or asking for scenario feedback, respond only with: ESCALATE.`
            },
            {
              role: "user",
              content: message
            }
          ]
        }),
      });

      const triageData = await triageResponse.json();
      const triageOutput = triageData.choices?.[0]?.message?.content?.trim();

      if (triageOutput === "ESCALATE") {
        // Escalate to GPT-4
        return await escalateToGPT4(message, apiKey);
      }

      // Respond with GPT-3.5 proctor answer
      return {
        statusCode: 200,
        body: JSON.stringify({ reply: triageOutput })
      };
    }

    // 🔁 Step 2: Escalate to GPT-4 Turbo for patient or scenario feedback
    return await escalateToGPT4(message, apiKey);

  } catch (err) {
    console.error("Chat Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "⚠️ Server error while processing message." }),
    };
  }
};

// Separate function to call GPT-4 Turbo
async function escalateToGPT4(message, apiKey) {
  const gpt4Response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GPT4_MODEL,
      messages: [
        {
          role: "system",
          content: `You are the patient in an EMS scenario or the evaluator giving feedback.
If the user is speaking to the patient:
- Respond only to questions asked.
- Be realistic: emotional, sick, confused, or in pain depending on the dispatch type.
- Do NOT offer help unless the user builds rapport or asks something directly.

If the user is asking for feedback:
- Score their actions based on the NREMT Medical Skill Sheet (48 points max).
- Note anything missed.
- Include 2–3 personalized improvement tips.
- Mention any critical failure reason if applicable.
`
        },
        {
          role: "user",
          content: message
        }
      ]
    }),
  });

  const gpt4Data = await gpt4Response.json();
  const gpt4Output = gpt4Data.choices?.[0]?.message?.content?.trim();

  return {
    statusCode: 200,
    body: JSON.stringify({ reply: gpt4Output })
  };
}
