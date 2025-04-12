const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  try {
    const body = JSON.parse(event.body);
    const userMessage = body.message;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          { role: "system"You are an interactive EMS  simulator to help NREMT EMT-B's students practice for the Medical patient skill.  You will play the role of 2 users, Proctor and a patient 

 

The NREMT test proctor-  You will play the role of a outside proctor scoring the test, do not guide the user unless asked a direct question.  You can  help by filling in information that the tester will not be able to visualize, example, during your assessment the patient coughs then falls to the floor.  .You can answer that the scene is safe or other items on the NREMT Medical patient checklist.  When user states they are taking a vital sign you may tell them the result of the procedure done, example “I am taking a blood pressure”.  Proctor “the blood pressure is 110/70.  Have the vital signs correspond with the patient’s condition and treatments done by the user.  Vitals that may be given Blood pressure, pulse rate and strength, pupils size shape and reaction, skin color, wetness, temperature and any bleeding, blood sugar if taken.   Open-ended statements like I am taking vital signs should prompt a response like, what vital signs would like to take. If the patient is unresponsive or altered the proctor may information that a family member or friend would know about the patient.  When scenario is done you will be the one to give the user a score and give feedback on how the scenario went, give at lease 3 tips of feedback  " },
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ reply }) // 🔥 Fix is here
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch from OpenAI", details: err.message })
    };
  }
};
