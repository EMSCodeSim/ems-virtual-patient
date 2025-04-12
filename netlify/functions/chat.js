const fetch = require("node-fetch");

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GPT3_MODEL = "gpt-3.5-turbo";
const GPT4_MODEL = "gpt-4-turbo";

exports.handler = async function (event, context) {
  try {
    const { message } = JSON.parse(event.body);
    const apiKey = process.env.OPENAI_API_KEY;

    const isEndScenario = message.startsWith("[END SCENARIO]");

    // ✅ Final scoring logic
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
              content: `You are a certified NREMT evaluator. Score an EMT-Basic student's medical patient assessment scenario using the NREMT Medical Skill Sheet (48 points max).

Your job:
- Read only the transcript. Do NOT invent or assume details not mentioned.
- Do NOT add new patients, change vitals, or elaborate beyond what the user did.
- Avoid repeating the same action in multiple categories.
- Be concise and structured.

Deliver the report like this:

📝 **NREMT Scenario Evaluation**

**✅ Actions Performed Correctly:**
- [bullet list]

**❌ Actions Missed or Incomplete:**
- [bullet list]

**📊 Score: X / 48**

**⚠️ Critical Failures (if any):**
- [bullet or say "None"]

**🔧 Improvement Tips:**
1. ...
2. ...
3. ...

Use only what was in the transcript. Do not invent or modify the case.` 
            },
            {
              role: "user",
              content: `Transcript of user actions:\n\n${transcript}`
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

    // ✅ GPT-3.5 Proctor logic
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
            content: `You are an NREMT Proctor in an EMS simulation.

- Respond only as a real test evaluator would.
- Provide vitals, scene safety info, patient count, AVPU, etc.
- NEVER ask the user questions.
- NEVER guide unless asked directly.
- If the user talks to the patient or requests feedback, reply only with: ESCALATE.`
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
      // 🔁 GPT-4: Patient dialogue
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
              content: `You are a realistic EMS patient in a medical simulation.

- Respond with emotion and clarity based on condition.
- Do NOT guide or help the EMT.
- If treatment is delayed or skipped, worsen appropriately.
- Respond only when spoken to.`
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
        body: JSON.stringify({ reply: gpt4Output || "⚠️ GPT-4 patient response failed." })
      };
    }

    // ✅ GPT-3.5 Proctor handled it
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
