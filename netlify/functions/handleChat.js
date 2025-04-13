const fetch = require('node-fetch');

const scoringTriggers = {
  "checked_airway": /airway|open.*airway/i,
  "gave_oxygen": /oxygen|non-rebreather|15L/i,
  "gave_aspirin": /aspirin|ASA|324mg/i,
  "called_als": /ALS|advanced life support/i
};

const expectedActions = [
  "checked_airway",
  "gave_oxygen",
  "gave_aspirin",
  "called_als"
];

exports.handler = async function(event, context) {
  const { message, history = [] } = JSON.parse(event.body);

  const systemPrompt = "You are simulating a 55-year-old male experiencing chest pain at home. Only provide information when the EMT asks. Respond only as the patient.";

  let userScore = {};
  Object.entries(scoringTriggers).forEach(([key, regex]) => {
    if (regex.test(message)) {
      userScore[key] = true;
    }
  });

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: message }
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4-turbo",
      messages
    })
  });

  const data = await response.json();
  const reply = data.choices[0].message.content;

  return {
    statusCode: 200,
    body: JSON.stringify({
      reply,
      updatedHistory: [...history, { role: "user", content: message }, { role: "assistant", content: reply }],
      userScore
    })
  };
};