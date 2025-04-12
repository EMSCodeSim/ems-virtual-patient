const fetch = require("node-fetch");

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GPT3_MODEL = "gpt-3.5-turbo";
const GPT4_MODEL = "gpt-4-turbo";

exports.handler = async function (event, context) {
  try {
    const { message } = JSON.parse(event.body);
    const apiKey = process.env.OPENAI_API_KEY;

    const isEndScenario = message.startsWith("[END SCENARIO]");

    // 🟥 Scenario End: Run full GPT-4 scoring logic
    if (isEndScenario) {
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
              content: `You are acting as a NREMT Proctor scoring an EMT-Basic medical patient assessment scenario using the official NREMT skill sheet.

Evaluate the student based on this transcript. Provide the following:
1. A score out of 48
2. What was done correctly
3. What was missed
4. 2–3 personalized improvement tips based on what they forgot or did out of order
5. Explain any reasons for a critical failure if applicable

Use the NREMT categories such as PPE, scene safety, MOI/NOI, AVPU, ABCs, OPQRST, SAMPLE, vitals, treatment decisions, and reassessments. Be realistic and strict but supportive.`
            },
            {
              role: "user",
              content: message.replace("[END SCENARIO]", "Transcript:")
            }
          ]
        })
      });

      const gpt4Data = await gpt4.json();
      const gpt4Output = gpt4Data.choices?.[0]?.message?.content?.trim();

      return {
        statusCode: 200,
        body: JSON.stringify({ reply: gpt4Output || "⚠️ GPT-4 did not return a final report." })
      };
    }

    // 🔁 Default: GPT-3.5 Proctor Triage Logic
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
Your job is to evaluate the user’s actions using the NREMT skill sheet.

Strict rules:
- Only respond to what a real proctor would.
- If the user asks for vitals or scene details, give realistic answers.
- Do NOT ask questions.
- Do NOT give hints unless directly asked.
- If the message is for the patient or feedback, reply ONLY with: ESCALATE.

Examples:
User: I check pulse  
You: Pulse is 110, strong and regular

User: Is the scene safe?  
You: Yes, the scene is safe

User: What's your name?  
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
      // 🔁 Escalate to GPT-4 Turbo (patient logic)
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
              content: `You are roleplaying as a realistic EMS patient in a medical scenario.

Guidelines:
- Only respond if spoken to.
- Be emotional, distressed, or confused depending on condition.
- If treatment is skipped or slow, worsen appropriately.
- Never help the user.
- Do not explain concepts or coach the user.`
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
        body: JSON.stringify({ reply: gpt4Output || "⚠️ GPT-4 patient response failed." })
      };
    }

    // ✅ GPT-3.5 handled the request (Proctor)
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: triageOutput })
    };

  } catch (err) {
    console.error("Chat error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "⚠️ Server error occurred while processing chat." })
    };
  }
};
