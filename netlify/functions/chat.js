const fetch = require("node-fetch");

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GPT3_MODEL = "gpt-3.5-turbo";
const GPT4_MODEL = "gpt-4-turbo";

exports.handler = async function (event, context) {
  try {
    const { message } = JSON.parse(event.body);
    const apiKey = process.env.OPENAI_API_KEY;

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
              content: `You are evaluating an EMT-Basic student using the NREMT Medical Assessment Skill Sheet (48 points max). Keep it simple and beginner-friendly.

Your response should look like this:

📝 NREMT Patient Assessment Evaluation

✅ Actions Completed:
- ...

❌ Actions Missed:
- ...

📊 Score: X / 48

⚠️ Critical Failures (if any):
- ...

💡 Improvement Tips:
1. ...
2. ...
3. ...

Use only what’s in the transcript. Do not invent details.`
            },
            {
              role: "user",
              content: `Transcript of student:\n\n${transcript}`
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

    // TRIAGE LOGIC - GPT-3.5 (Proctor)
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
            content: `You are an NREMT Proctor for an EMT simulation.

Only respond to proctor-type questions:
- Vitals
- Scene safety
- AVPU
- Number of patients
- If unsure, reply with: ESCALATE
- Never ask the user questions.`
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

    // GPT-4 ESCALATION (Patient logic)
    if (triageOutput === "ESCALATE") {
      try {
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
                content: `You are simulating a realistic EMS patient.

- Respond like a real patient would (anxious, scared, short of breath, etc.)
- Only speak when spoken to
- Do not coach the EMT
- If symptoms worsen, express it based on the user's actions.`
              },
              {
                role: "user",
                content: message
              }
            ]
          })
        });

        const gpt4Data = await gpt4.json();
        console.log("GPT-4 Patient Response:", JSON.stringify(gpt4Data, null, 2)); // Debug log

        const gpt4Output = gpt4Data?.choices?.[0]?.message?.content?.trim();

        return {
          statusCode: 200,
          body: JSON.stringify({
            reply: gpt4Output || "⚠️ GPT-4 responded, but content was empty."
          })
        };

      } catch (err) {
        console.error("GPT-4 Error:", err);
        return {
          statusCode: 500,
          body: JSON.stringify({ reply: "⚠️ Error retrieving patient response from GPT-4." })
        };
      }
    }

    // GPT-3.5 handled it
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: triageOutput })
    };

  } catch (err) {
    console.error("Chat Handler Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "⚠️ Internal server error." })
    };
  }
};
