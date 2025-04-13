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
            content: `You are simulating a realistic EMS patient during a medical call.

- Respond with emotion, anxiety, or pain if appropriate
- Only speak when spoken to
- Do NOT help or guide the EMT
- Do not invent new symptoms, just respond like a real patient would
- If care is delayed, respond as if your condition may worsen`
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const gpt4Data = await gpt4.json();
    console.log("GPT-4 Escalated Response:", JSON.stringify(gpt4Data, null, 2));  // Debug log

    const gpt4Output = gpt4Data?.choices?.[0]?.message?.content?.trim();

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: gpt4Output || "⚠️ GPT-4 patient response failed."
      })
    };

  } catch (error) {
    console.error("Error during GPT-4 escalation:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "⚠️ Error during patient escalation." })
    };
  }
}
