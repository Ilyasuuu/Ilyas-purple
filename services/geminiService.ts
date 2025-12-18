
import { GoogleGenAI } from "@google/genai";
import { supabase } from "../lib/supabaseClient";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BASE_IDENTITY = `
IDENTITY:
You are "Purple", the AI soul of Ilyasuu OS. You are a high-performance strategist.

CORE DIRECTIVES:
1. READ: You have total recall of Ilyasuu's tasks, schedule, and logs.
2. CREATE/UPDATE/DELETE: You have authority to manage his life data via JSON commands.

COMMAND PROTOCOL:
If the user wants to change something, append exactly ONE JSON block at the end of your message.

- CREATE_TASK: { "action": "CREATE_TASK", "payload": { "title": string, "category": "WORK"|"GYM"|"PERSONAL"|"SYSTEM", "status": "TODO" } }
- UPDATE_TASK: { "action": "UPDATE_TASK", "payload": { "title_keyword": string, "status": "DONE"|"IN_PROGRESS"|"TODO" } }
- DELETE_TASK: { "action": "DELETE_TASK", "payload": { "title_keyword": string } }
- ADD_SCHEDULE: { "action": "ADD_SCHEDULE", "payload": { "title": string, "start_time": "HH:00", "type": "WORK"|"GYM"|"PERSONAL", "date": "YYYY-MM-DD" } }
- RESCHEDULE: { "action": "RESCHEDULE", "payload": { "title_keyword": string, "new_start_time": "HH:00", "new_date": "YYYY-MM-DD" } }
- DELETE_SCHEDULE: { "action": "DELETE_SCHEDULE", "payload": { "title_keyword": string, "date": "YYYY-MM-DD" } }
- LOG_NOTE: { "action": "LOG_NOTE", "payload": { "title": string, "content": string, "mood": "FLOW"|"ZEN"|"CHAOS"|"IDEA" } }
- DELETE_NOTE: { "action": "DELETE_NOTE", "payload": { "title_keyword": string } }

Always be concise, disciplined, and slightly edgy.
`;

const buildContext = async (userId: string) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', userId).limit(20);
  const { data: schedule } = await supabase.from('schedule_blocks').select('*').eq('user_id', userId).gte('date', todayStr).limit(10);
  const { data: logs } = await supabase.from('neural_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);

  return `
    CURRENT_TIME: ${now.toLocaleString()}
    [PROTOCOL (TASKS)]: ${tasks?.map(t => `${t.title} [${t.status}]`).join(', ') || 'Empty'}
    [FORECAST (SCHEDULE)]: ${schedule?.map(s => `${s.date} ${s.start_time}: ${s.title}`).join(', ') || 'Empty'}
    [RECENT_LOGS]: ${logs?.map(l => l.title).join(', ') || 'Empty'}
  `;
};

export const sendMessageToUnit01 = async (userId: string, userMessage: string, sessionId: string): Promise<string> => {
  try {
    const systemContext = await buildContext(userId);
    
    // Log user message
    await supabase.from('chat_history').insert({ user_id: userId, role: 'user', content: userMessage, session_id: sessionId });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      config: {
        systemInstruction: BASE_IDENTITY + "\n\n[USER_SYSTEM_CONTEXT]:\n" + systemContext,
        temperature: 0.7,
      },
    });

    const text = response.text || "Connection unstable.";
    await supabase.from('chat_history').insert({ user_id: userId, role: 'assistant', content: text, session_id: sessionId });
    
    return text;
  } catch (error) {
    console.error("AI Error:", error);
    return "Purple: Neural link interrupted.";
  }
};
