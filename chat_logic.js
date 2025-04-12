
// Basic Chat Logic for EMS Code Sim
function handleUserMessage(message) {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("chest pain")) {
    return "Can you describe the chest pain? Does it radiate anywhere?";
  } else if (lowerMessage.includes("difficulty breathing")) {
    return "Is the patient in tripod position or using accessory muscles?";
  } else if (lowerMessage.includes("give aspirin")) {
    return "You have administered 324mg aspirin. Continue monitoring.";
  } else {
    return "Please continue your assessment.";
  }
}
