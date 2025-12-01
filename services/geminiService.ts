import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.API_KEY || '';
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

export const getRealMadridSchedule = async (): Promise<any[]> => {
  const prompt = `
    Using Google Search, find the next 2 scheduled or ongoing football matches for Real Madrid (Men's Team).
    This MUST be real-time data. 
    
    Output the data as a raw text list, one match per line, using this STRICT pipe-separated format:
    DATE|TIME|OPPONENT|COMPETITION|STATUS|SIDE|SCORE
    
    Format Rules:
    - DATE: YYYY-MM-DD
    - TIME: HH:MM (UTC time)
    - OPPONENT: Name of the other team
    - COMPETITION: e.g. La Liga, Champions League
    - STATUS: 'SCHEDULED', 'LIVE', or 'FINISHED'
    - SIDE: 'HOME' (if RM is home) or 'AWAY' (if RM is away)
    - SCORE: The current score as 'HomeGoals-AwayGoals' (e.g. 2-1). If scheduled, use 'null'.
    
    Example Output:
    2025-10-26|20:00|Barcelona|La Liga|SCHEDULED|HOME|null
    2025-10-30|19:00|Valencia|La Liga|LIVE|AWAY|1-2
    
    Do not include any other text, markdown, or explanation. Just the list.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // Low temp for extraction
      },
    });
    
    const text = response.text || "";
    const lines = text.trim().split('\n');
    const matches = [];

    for (const line of lines) {
       // Simple validation to ensure it looks like our pipe format
       if (line.includes('|')) {
          const parts = line.split('|').map(p => p.trim());
          if (parts.length >= 7) {
            const [date, time, opponent, competition, status, side, score] = parts;
            matches.push({
              date, time, opponent, competition, status, side, score
            });
          }
       }
    }
    return matches;

  } catch (error) {
    console.error("Gemini Schedule Fetch Error:", error);
    return [];
  }
};
