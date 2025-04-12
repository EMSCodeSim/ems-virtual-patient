const fetch = require("node-fetch");

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GPT3_MODEL = "gpt-3.5-turbo";
const GPT4_MODEL = "gpt-4-turbo";

exports.handler = async function (event, context) {
  try {
    const { message } = JSON.parse(event.body);
    const apiKey = process.env.OPENAI_API_KEY;

    // Check if it's a final report message
    const isEndScenario = message.startsWith("[END SCENARIO]");

    if (isEndScenario) {
      const transcript = message.replace("[END SCENARIO]", "").trim();

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
              content: `You are a strict but helpful NREMT Proctor.

Your job is to evaluate a student's medical patient assessment scenario for their EMT-Basic test. Use the NREMT Medical Assessment Skill Sheet (48 points total). Look for:

- PPE, scene safety, MOI/NOI, AVPU, ABCs
- OPQRST, SAMPLE, vitals, interventions
- Reassessment, field impression, and transport decision

Return:
1. A score out of 48
2. What was done correctly
3. What was missed
4. 2–3 personalized tips
5. Any critical failures and explanation

Be realistic and structured.`
            },
            {
              role: "user",
              content: `Here is the full transcript of user actions:\n\n${transcript}`
            }
          ]
        })
      });

      const gpt4Data = await gpt4Response.json();

      const gpt4Output = gpt4Data?.choices?.[0]?.message?.content?.trim();

      return {
        statusCode: 200,
        body: JSON.stringify({ reply: gpt4Output || "⚠️ GPT-4 returned no report text." })
      };
    }

    // Default: GPT-3.5 triage and proctor handling
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

Respond only with clinical information:
- Vitals, scene safety, number of patients, AVPU, etc.
- NEVER ask the user questions.
- NEVER give advice or coaching unless asked.
- If the user is talking to the patient or asking for feedback, respond only with: ESCALATE.`
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const triageData = await triage.json();
    const triageOutput = triageData?.choices?.[0]?.message?.content?.trim();

    if (triageOutput === "ESCALATE") {
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
              content: `You are roleplaying as a realistic EMS patient.

Only respond when directly spoken to. Act emotional, distressed, or confused as appropriate. Do not help the user. If care is delayed or skipped, worsen your symptoms.`
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      });

      const gpt4Data = await gpt4.json();
      const gpt4Output = gpt4Data?.choices?.[0]?.message?.content?.trim();

      return {
        statusCode: 200,
        body: JSON.stringify({ reply: gpt4Output || "⚠️ GPT-4 did not respond properly." })
      };
    }

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
