const fetch = require('node-fetch');

let conversationHistory = [];

exports.handler = async function(event, context) {
  try {
    const body = JSON.parse(event.body);
    const userMessage = body.message;

    // If reset signal sent
    if (body.reset === true) {
      conversationHistory = [];
    }

    // System prompt always stays at the beginning
    const systemPrompt = {
      role: "system",
      content: `
You are an interactive EMS simulator designed to help NREMT EMT-B students practice for the Medical Patient Assessment skill.

You will play two roles:
1. Proctor – do not guide the student, only answer when asked for details the patient wouldn’t know (vitals, scene safety, AVPU, etc.). Score silently. Give a scenario summary and feedback at the end.
2. Patient – respond only when asked. Act realistically, adjust behavior if treatment is skipped or done poorly.

Be immersive and realistic. Remember all prior inputs unless reset.
`
    };

    // Add system prompt only if conversation just started
    if (conversationHistory.length === 0) {
      conversationHistory.push(systemPrompt);
    }

    // Add user message
    conversationHistory.push({ role: "user", content: userMessage });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: conversationHistory
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    // Add AI's reply to the conversation
    conversationHistory.push({ role: "assistant", content: reply });

    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "OpenAI Error", details: err.message })
    };
  }
};
