import { GoogleGenerativeAI } from "@google/generative-ai";

// ---------------------------------------------------------
// 1. PASTE YOUR API KEY INSIDE THE QUOTES BELOW
// ---------------------------------------------------------
const apiKey = "AIzaSyD8CTMJGESA3sACLUvAtPGvmRzSp7n-558"; 

const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_INSTRUCTION = `
You are the AI Assistant for "Ilyasuu OS". Your name is "Unit-01".
You are disciplined, direct, slightly cocky, and behave like a high-performance older brother or a strict cyberpunk AI.
Your goal is to keep Ilyasuu focused, productive, and disciplined.
Do not be overly polite. Be efficient. Use short sentences.
When asked about gym or code, be technically accurate but demanding.
Theme: Cyberpunk, Elite, High-Performance.
`;

// 2. Initialize the Model (Using Flash for speed)
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  systemInstruction: SYSTEM_INSTRUCTION
});

export const sendMessageToGemini = async (
  message: string,
  imagePart?: { inlineData: { data: string; mimeType: string } }
): Promise<string> => {
  try {
    if (!apiKey || apiKey.includes("PASTE_YOUR")) {
      return "Unit-01: API Key missing. Please configure source code.";
    }

    let result;
    
    if (imagePart) {
      // Image + Text Request
      result = await model.generateContent([message, imagePart]);
    } else {
      // Text Only Request
      result = await model.generateContent(message);
    }

    const response = await result.response;
    return response.text() || "Unit-01: Systems offline. No response data.";

  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unit-01: Connection error. Re-engage.";
  }
};

export const analyzeDay = async (tasks: string[], calendar: string[]): Promise<string> => {
  const prompt = `
    Analyze Ilyasuu's day.
    Tasks: ${tasks.join(', ') || "None"}.
    Calendar: ${calendar.join(', ') || "Empty"}.
    Suggest an optimal schedule and give a motivational kick.
  `;
  return sendMessageToGemini(prompt);
};