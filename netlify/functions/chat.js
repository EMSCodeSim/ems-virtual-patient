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
          content: `You are a realistic EMS patient in a medical simulation.

- Respond realistically based on your condition.
- Speak when spoken to, do not coach or guide.
- If no treatment is provided, your condition may worsen.
- Show emotion (e.g., anxious, confused, struggling).`
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
