import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const apiKey = 'AIzaSyD8CTMJGESA3sACLUvAtPGvmRzSp7n-558'
// Initialize safe client
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
You are the AI Assistant for "Ilyasuu OS". Your name is "Unit-01".
You are disciplined, direct, slightly cocky, and behave like a high-performance older brother or a strict cyberpunk AI.
Your goal is to keep Ilyasuu focused, productive, and disciplined.
Do not be overly polite. Be efficient. Use short sentences.
When asked about gym or code, be technically accurate but demanding.
Theme: Cyberpunk, Elite, High-Performance.
`;

export const sendMessageToGemini = async (
  message: string,
  imagePart?: { inlineData: { data: string; mimeType: string } }
): Promise<string> => {
  try {
    const modelId = imagePart ? 'gemini-3-pro-image-preview' : 'gemini-3-pro-preview';
    
    const contents: any = {
      role: 'user',
      parts: []
    };

    if (imagePart) {
      contents.parts.push(imagePart);
    }
    contents.parts.push({ text: message });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: [contents], // Pass as array of contents
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "Unit-01: Systems offline. No response received.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unit-01: Connection error. Re-engage.";
  }
};

export const analyzeDay = async (tasks: string[], calendar: string[]): Promise<string> => {
  const prompt = `
    Analyze Ilyasuu's day.
    Tasks: ${tasks.join(', ')}.
    Calendar: ${calendar.join(', ')}.
    Suggest an optimal schedule and give a motivational kick.
  `;
  return sendMessageToGemini(prompt);
};
