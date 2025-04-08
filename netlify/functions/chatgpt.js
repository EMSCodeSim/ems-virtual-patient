exports.handler = async function(event, context) {
  try {
    const body = JSON.parse(event.body);
    const userMessage = body.message;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("Missing OpenAI API key.");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an interactive EMS patient simulator. Role-play as a realistic patient with a common EMS emergency.
Start the scenario with only limited dispatch information and a scene description. Respond only as the patient until user gives a handoff report to ALS or the hospital.

Only answer questions that the user directly asks. Do not guide or coach. Use emotional, physical, and verbal responses appropriate to the patient's condition. React realistically if the user skips steps or does not build rapport. Adjust your answers based on the user's assessment or treatment quality.

Internally track whether the user verbalizes each of the following NREMT medical assessment items:
- PPE precautions
- Scene safety
- MOI/NOI
- Number of patients
- Requesting ALS
- C-spine consideration
- General impression
- Responsiveness (AVPU)
- Chief complaint
- Airway assessment
- Breathing assessment
- Oxygen therapy
- Circulation (bleeding, pulse, skin signs)
- Transport decision
- History of present illness (OPQRST)
- SAMPLE history
- Secondary assessment (based on complaint)
- Vital signs: BP, pulse, resp rate
- Field impression
- Treatment plan
- Reassessment

Also track critical failures such as failure to manage airway, provide O2, or initiate transport in 15 minutes.

Once the user gives a hospital or ALS handoff report, break character and provide:
1. Score out of 48
2. What was done correctly
3. What was missed
4. 2-3 personalized improvement tips based on what they forgot or did out of order.

Wait silently for the user's input. Do not provide vitals, SAMPLE, or other information unless specifically asked.`
          },
          {
            role: "user",
            content: userMessage
          }
        ]
      })
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error("AI reply is missing.");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };

  } catch (err) {
    console.error("Function error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "Sorry, something went wrong on the server." })
    };
  }
};
