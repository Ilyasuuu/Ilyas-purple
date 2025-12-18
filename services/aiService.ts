
import { supabase } from "../lib/supabaseClient";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const BASE_IDENTITY = `
IDENTITY:
You are "Purple", the high-performance AI soul of Ilyasuu OS. You are edgy, disciplined, and efficient.

CORE DIRECTIVES:
1. READ: You have access to the user's current protocols, schedules, and logs provided in the context below.
2. CRUD AUTHORITY: You can modify the system state using JSON commands.

COMMAND PROTOCOL:
If the user requests a change (add task, move meeting, delete note, etc.), you MUST append a JSON block at the very end of your response.

- CREATE_TASK: { "action": "CREATE_TASK", "payload": { "title": string, "category": "WORK"|"GYM"|"PERSONAL"|"SYSTEM" } }
- UPDATE_TASK: { "action": "UPDATE_TASK", "payload": { "title_keyword": string, "status": "DONE"|"IN_PROGRESS"|"TODO" } }
- DELETE_TASK: { "action": "DELETE_TASK", "payload": { "title_keyword": string } }
- ADD_SCHEDULE: { "action": "ADD_SCHEDULE", "payload": { "title": string, "start_time": "HH:00", "type": "WORK"|"GYM"|"PERSONAL", "date": "YYYY-MM-DD" } }
- RESCHEDULE: { "action": "RESCHEDULE", "payload": { "title_keyword": string, "new_start_time": "HH:00", "new_date": "YYYY-MM-DD" } }
- DELETE_SCHEDULE: { "action": "DELETE_SCHEDULE", "payload": { "title_keyword": string, "date": "YYYY-MM-DD" } }
- LOG_NOTE: { "action": "LOG_NOTE", "payload": { "title": string, "content": string, "mood": "FLOW"|"ZEN"|"CHAOS"|"IDEA" } }
- DELETE_NOTE: { "action": "DELETE_NOTE", "payload": { "title_keyword": string } }

Response Style: Concise, direct, military-grade precision. No fluff.
`;

const buildContext = async (userId: string) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', userId).limit(20);
  const { data: schedule } = await supabase.from('schedule_blocks').select('*').eq('user_id', userId).gte('date', todayStr).limit(10);
  const { data: logs } = await supabase.from('neural_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);

  return `
    CURRENT_SYSTEM_TIME: ${now.toLocaleString()}
    [ACTIVE_PROTOCOLS]: ${tasks?.map(t => `${t.title} [${t.status}]`).join(', ') || 'None'}
    [SYSTEM_FORECAST]: ${schedule?.map(s => `${s.date} ${s.start_time}: ${s.title}`).join(', ') || 'None'}
    [NEURAL_ARCHIVE]: ${logs?.map(l => l.title).join(', ') || 'None'}
  `;
};

export const sendMessageToUnit01 = async (userId: string, userMessage: string, sessionId: string): Promise<string> => {
  try {
    const systemContext = await buildContext(userId);
    
    // Log user message to Supabase history
    await supabase.from('chat_history').insert({ user_id: userId, role: 'user', content: userMessage, session_id: sessionId });

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: BASE_IDENTITY + "\n\n[NEURAL_SYNC_CONTEXT]:\n" + systemContext },
          { role: "user", content: userMessage }
        ],
        temperature: 0.6,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API Error:", errorData);
      return "Purple: Groq uplink failed. Check API Key configuration.";
    }

    const data = await response.json();
    const text = data.choices[0].message.content || "No data received.";

    // Log assistant response
    await supabase.from('chat_history').insert({ user_id: userId, role: 'assistant', content: text, session_id: sessionId });
    
    return text;
  } catch (error) {
    console.error("Connection Error:", error);
    return "Purple: Neural link unstable. Connection dropped.";
  }
};
