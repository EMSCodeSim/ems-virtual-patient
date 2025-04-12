function handleUserMessage(message, prebuiltResponses) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("chest pain")) {
    return prebuiltResponses["chest pain"].questions.join(" ");
  } else if (lowerMessage.includes("respiratory distress") || lowerMessage.includes("difficulty breathing")) {
    return prebuiltResponses["respiratory distress"].questions.join(" ");
  } else if (lowerMessage.includes("give aspirin")) {
    return "You have administered 324mg aspirin. Continue monitoring.";
  } else {
    return "Please continue your assessment.";
  }
}
