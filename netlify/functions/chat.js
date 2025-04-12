const fetch = require("node-fetch");

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GPT3_MODEL = "gpt-3.5-turbo";
const GPT4_MODEL = "gpt-4-turbo";

exports.handler = async function (event, context) {
  try {
    const { message } = JSON.parse(event.body);
    const apiKey = process.env.OPENAI_API_KEY;

    const isEndScenario = message.startsWith("[END SCENARIO]");

    // ✅ FINAL SCORING SECTION
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
              content: `You are a certified NREMT evaluator scoring an EMT-Basic student's medical patient assessment scenario using the official NREMT Medical Assessment Skill Sheet (48 total points).

Your task:
- Read the transcript of the student's performance.
- Translate common EMS/EMT slang into proper skill sheet actions:
  - "BSI" = "Takes PPE precautions"
  - "Scene safe" = "Determines scene safety"
  - "I check pulse" = "Assesses circulation"
  - "Rate your pain" = "Assesses severity"
  - "15L NRB" = "Administers oxygen"
  - "Any allergies?" = "Asks about allergies"
  - "Can you tell me your name?" = "Checks AVPU"
  - "We’re going emergent" = "Determines transport decision"

Your output should include:
1. Score out of 48
2. What the student did correctly
3. What they missed
4. 2–3 personalized improvement tips
5. Any reasons for a critical failure

Be objective and supportive. Use bullet points where helpful. Format clearly.`
            },
            {
              role: "user",
              content: `Here is the student's full transcript:\n\n${transcript}`
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

    // ✅ TRIAGE (GPT-3.5 Proctor or escalation)
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

- Only respond to questions a real test proctor would.
- If the user checks vitals or scene safety, provide realistic values.
- NEVER ask the user questions.
- NEVER explain or coach unless asked directly.
- If the user is talking to the patient or asking for feedback, reply ONLY with: ESCALATE.`
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

    // 🔁 GPT-4 for patient simulation
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
              content: `You are simulating a realistic EMS patient during a medical call.

- Respond emotionally, realistically, and only when spoken to.
- Reflect your condition worsening if delayed care occurs.
- Do not guide, hint, or help unless specifically asked.`
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

    // ✅ GPT-3.5 handled it
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
