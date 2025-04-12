const fetch = require("node-fetch");

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GPT3_MODEL = "gpt-3.5-turbo";
const GPT4_MODEL = "gpt-4-turbo";

exports.handler = async function (event, context) {
  try {
    const { message } = JSON.parse(event.body);
    const apiKey = process.env.OPENAI_API_KEY;
    const lowerMsg = message.toLowerCase();

    // Step 1: Send to GPT-3.5 for triage/proctor logic
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
Your role is to act like a real NREMT test evaluator—not a chatbot.

Strict rules:
- Only answer when asked.
- If the user checks vitals (e.g., "check pulse", "check BP"), give realistic values.
- NEVER ask the user questions.
- NEVER return questions as responses.
- NEVER guide or explain unless explicitly asked.
- If the user is speaking to the patient or asking for feedback, reply ONLY with: ESCALATE.

Examples:
User: I check the patient’s pulse  
You: The pulse is 110, regular and strong.

User: Is the scene safe?  
You: Yes, the scene is safe.

User: What is your name?  
You: ESCALATE`
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
      // Step 2: Send to GPT-4 Turbo for patient or scenario scoring
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
              content: `You are simulating a realistic EMS patient or giving NREMT scenario feedback.

If the user is asking the patient:
- Respond only if directly addressed.
- Be realistic: emotional, confused, or sick as appropriate.
- Do NOT help the user or give hints.

If the user is asking for feedback:
- Score them based on the NREMT medical checklist (48 points).
- Mention what they did right and what they missed.
- Give 2-3 specific improvement tips.
- Note any critical failures if applicable.`
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

    // Default response from GPT-3.5 (Proctor)
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
