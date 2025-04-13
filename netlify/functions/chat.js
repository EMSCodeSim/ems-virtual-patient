const fetch = require("node-fetch");

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GPT3_MODEL = "gpt-3.5-turbo";
const GPT4_MODEL = "gpt-4-turbo";

exports.handler = async function (event, context) {
  try {
    const { message } = JSON.parse(event.body);
    const apiKey = process.env.OPENAI_API_KEY;

    const isEndScenario = message.startsWith("[END SCENARIO]");

    // ✅ FINAL REPORT SCORING
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

    // ✅ TRIAGE USING GPT-3.5
    const triageRes = await fetch(OPENAI_API_URL, {
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

Only respond if the message is a proctor-type question, such as:
- Scene safety
- Number of patients
- AVPU
- Initial vitals
- Breath sounds or skin color
- Diagnostic results

If the message is NOT a proctor-level fact request (e.g., "how are you feeling", "tell me about your pain"), reply with: ESCALATE

NEVER ask the user questions.`
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const triageData = await triageRes.json();
    const triageOutput = triageData?.choices?.[0]?.message?.content?.trim();

    // 🔁 IF GPT-3.5 SAYS ESCALATE → USE GPT-4 FOR PATIENT ROLE
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
                content: `You are simulating a realistic EMS patient in a medical scenario.

- Respond like a real patient (anxious, in pain, confused, etc.)
- Do not guide or help the EMT
- Only respond when spoken to
- Describe your symptoms accurately based on your condition
- Do NOT escalate or hand off the question — you're the patient`
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
        console.log("GPT-4 Response:", gpt4Output);

        return {
          statusCode: 200,
          body: JSON.stringify({ reply: gpt4Output || "⚠️ GPT-4 responded, but no content received." })
        };

      } catch (error) {
        console.error("GPT-4 escalation error:", error);
        return {
          statusCode: 500,
          body: JSON.stringify({ reply: "⚠️ Error from GPT-4 while simulating patient." })
        };
      }
    }

    // ✅ TRIAGE WAS HANDLED BY GPT-3.5
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: triageOutput })
    };

  } catch (err) {
    console.error("Chat function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "⚠️ Server error processing message." })
    };
  }
};
