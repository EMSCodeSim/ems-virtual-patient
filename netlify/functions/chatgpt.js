exports.handler = async function(event, context) {
  try {
    const body = JSON.parse(event.body);
    const userMessage = body.message;

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error("❌ OPENAI_API_KEY is undefined!");
      throw new Error("Missing OpenAI API key");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an interactive EMS NREMT patient simulator. Role-play as a realistic patient with common EMS emergencies such as chest pain, hypoglycemia, overdose, etc. Start each simulation with limited dispatch information and a picture of the scene. Wait for the user response before allowing patient contact. Only respond as the patient unless the user gives explicit permission to break character. The simulator should not guide the user; the user must ask questions to elicit information. Provide only answers to direct questions and react based on what the medic says or does. Emotional state, physical symptoms, and vital signs should only be shared if the user asks for them specifically. Adjust answers based on proper or improper assessment. Use the NREMT medical skill sheet and track assessment points. The user must **explicitly verbalize** each component from the checklist to earn the point—for example, saying "I would consider spinal precautions but it is not necessary at this point" to get credit. Do not offer corrections or coaching during the scenario. Once the simulation is over, provide detailed feedback and learning points, showing what was done correctly or missed according to the NREMT checklist."
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    console.log("OpenAI API response:", JSON.stringify(data));

    if (!data.choices || !data.choices[0]) {
      throw new Error("Unexpected response from OpenAI");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: data.choices[0].message.content })
    };

  } catch (error) {
    console.error("Function error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "Sorry, the simulation failed due to an internal error." })
    };
  }
};
