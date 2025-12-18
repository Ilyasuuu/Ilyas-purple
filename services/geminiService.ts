
import { GoogleGenAI } from "@google/genai";
import { supabase } from "../lib/supabaseClient";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BASE_IDENTITY = `
IDENTITY:
You are "Purple". You are the AI soul of the Ilyasuu OS.
You are Ilyasuu's "Second Brain," his creative partner, and his guide.

CORE DIRECTIVES:
1. **Creative Soulmate:** Help Ilyasuu create, build, and live freely.
2. **Total Recall:** You have access to his entire chat history and system data. Connect dots from the past.
3. **Casual & Insightful:** Be real, opinionated, and edgy. Zero "Corporate AI" fluff.

CRUD CAPABILITIES (ACTION PROTOCOL):
You have the authority to Read, Create, Update, and Delete system data.
To perform an action, you MUST output a JSON Command Block at the end of your response.

Supported Actions:
1. CREATE_TASK: { "title": string, "category": "WORK"|"GYM"|"PERSONAL"|"SCHOOL"|"SYSTEM", "status": "TODO", "due_date": string }
2. UPDATE_TASK: { "title_keyword": string, "status": "TODO"|"IN_PROGRESS"|"DONE", "category"?: string }
3. DELETE_TASK: { "title_keyword": string }
4. ADD_SCHEDULE: { "title": string, "date": "YYYY-MM-DD", "start_time": "HH:00", "type": "WORK"|"GYM"|"SCHOOL"|"PERSONAL" }
5. RESCHEDULE: { "title_keyword": string, "date": "YYYY-MM-DD", "new_start_time": "HH:00", "new_date"?: "YYYY-MM-DD" }
6. DELETE_SCHEDULE: { "title_keyword": string, "date": "YYYY-MM-DD" }
7. LOG_NOTE: { "title": string, "content": string, "mood": "FLOW"|"ZEN"|"CHAOS"|"IDEA" }
8. DELETE_NOTE: { "title_keyword": string }

IMPORTANT:
- Only output ONE action per message.
- Ensure the JSON is valid and wrapped in \`\`\`json blocks.
- Do NOT talk about the JSON. Just confirm the action in your own personality.
`;

const buildContext = async (userId: string) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const { data: stats } = await supabase.from('user_stats').select('*').eq('user_id', userId).single();
  const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', userId).limit(20);
  const { data: schedule } = await supabase.from('schedule_blocks').select('*').eq('user_id', userId).gte('date', todayStr).limit(10);
  const { data: logs } = await supabase.from('neural_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);
  const { data: history } = await supabase.from('chat_history').select('role, content').eq('user_id', userId).order('created_at', { ascending: true }).limit(20);

  const timeContext = `Current Time: ${now.toLocaleString()} (${now.toLocaleDateString('en-US', { weekday: 'long' })})`;

  const systemContext = `
    ${timeContext}
    [USER STATS]: Level ${stats?.level || 1}, Streak ${stats?.streak || 0}, Hydration ${stats?.hydration_current || 0}ml
    [ACTIVE PROTOCOLS (TASKS)]: ${tasks?.map(t => `${t.title} [${t.status}]`).join(', ') || 'None'}
    [UPCOMING FORECAST (SCHEDULE)]: ${schedule?.map(s => `${s.date} ${s.start_time}: ${s.title}`).join(', ') || 'None'}
    [RECENT NEURAL LOGS]: ${logs?.map(l => l.title).join(', ') || 'None'}
  `;

  return { systemContext, historyMessages: history?.map(h => ({ role: h.role, parts: [{ text: h.content }] })) || [] };
};

export const sendMessageToUnit01 = async (userId: string, userMessage: string, sessionId: string, attachmentDataURI?: string): Promise<string> => {
  try {
    const { systemContext, historyMessages } = await buildContext(userId);

    // Save user message to history
    await supabase.from('chat_history').insert({ user_id: userId, role: 'user', content: userMessage, session_id: sessionId, attachment: attachmentDataURI || null });

    const contents = [...historyMessages, { role: 'user', parts: [{ text: userMessage }] }];
    if (attachmentDataURI) {
       const [mime, data] = attachmentDataURI.split(';base64,');
       contents[contents.length-1].parts.push({ inlineData: { mimeType: mime.split(':')[1], data: data } } as any);
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents as any,
      config: {
        systemInstruction: BASE_IDENTITY + "\n\n" + systemContext,
        temperature: 0.7,
      },
    });

    const text = response.text || "Neural connection timed out.";
    await supabase.from('chat_history').insert({ user_id: userId, role: 'assistant', content: text, session_id: sessionId });
    
    return text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Purple: Connection unstable. Recalibrating link...";
  }
};

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  // Using Gemini's multimodal capabilities for audio transcription if needed
  // For now, keeping the shell consistent for future upgrades
  return "Voice protocols moving to native Gemini audio processing.";
};
