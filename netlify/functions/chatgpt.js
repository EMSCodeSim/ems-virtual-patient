fetch()

exports.handler = async function(event, context) {
  const body = JSON.parse(event.body);
  const userMessage = body.message;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a realistic EMS patient simulator. Only respond as the patient." },
        { role: "user", content: userMessage }
      ],
    }),
  });

  const data = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify({ reply: data.choices[0].message.content }),
  };
};
