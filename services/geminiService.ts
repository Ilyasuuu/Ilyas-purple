import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. FIX: Use Vite's method to access the key
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';

// Initialize client
const genAI = new GoogleGenerativeAI(apiKey);

// 2. OPTIMIZATION: Use 'gemini-1.5-flash'. 
// It is faster and cheaper than '3-pro' for a personal assistant.
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-pro",
  systemInstruction: `
    You are the AI Assistant for "Ilyasuu OS". Your name is "Unit-01".
    Your goal is to keep Ilyasuu focused, productive, and disciplined.
    Be efficient.
    When asked about gym or code, be technically accurate but demanding.
    Theme: High-Performance.
  `
});

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!apiKey) return "Unit-01 Error: Security Clearance Missing (API Key not found).";

  try {
    const result = await model.generateContent(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unit-01: Signal lost. Re-engaging protocols...";
  }
};

export const analyzeDay = async (tasks: string[]): Promise<string> => {
  const prompt = `
    Analyze Ilyasuu's current status.
    Pending Tasks: ${tasks.join(', ') || "None"}.
    
    Give me a status report and a motivational command. 
    Keep it under 2 sentences.
  `;
  return sendMessageToGemini(prompt);
};