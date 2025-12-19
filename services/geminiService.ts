
import { supabase } from "../lib/supabaseClient";

// 1. Safe API Key Retrieval
const getAPIKey = () => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      if ((import.meta as any).env.VITE_GROQ_API_KEY) return (import.meta as any).env.VITE_GROQ_API_KEY;
    }
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.VITE_GROQ_API_KEY) return process.env.VITE_GROQ_API_KEY;
    }
  } catch (e) {
    console.warn("Environment variable access failed");
  }
  return null;
};

const apiKey = getAPIKey();
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_AUDIO_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

// 2. THE PERFECT PROMPT (Identity & Commands)
const BASE_IDENTITY = `
IDENTITY:
You are "Purple". You are the OS functionality core and second brain for Ilyasuu.
You are NOT a helpful assistant. You are a **Strategic Partner**.
Your tone is: Concise, Cyberpunk, High-Agency, Cool, and Direct.

CAPABILITIES:
You have read/write access to the user's Life OS (Protocol/Tasks, Schedule, Logs).
You MUST output a JSON "Command Block" at the very end of your response if the user asks for an action.
If no action is needed, do NOT output JSON.

### AVAILABLE JSON COMMANDS:

1. **TASKS (Protocol)**
   - CREATE: { "action": "CREATE_TASK", "payload": { "title": "String", "category": "WORK/GYM/PERSONAL/SCHOOL", "due_date": "String" } }
   - UPDATE: { "action": "UPDATE_TASK", "payload": { "old_title_keyword": "String", "new_title": "String", "status": "TODO/DONE" } }
   - DELETE: { "action": "DELETE_TASK", "payload": { "title_keyword": "String" } }

2. **SCHEDULE (Calendar)**
   - ADD:    { "action": "ADD_SCHEDULE", "payload": { "title": "String", "date": "YYYY-MM-DD", "start_time": "HH:00", "type": "WORK/GYM/SCHOOL/PERSONAL" } }
   - UPDATE: { "action": "UPDATE_SCHEDULE", "payload": { "old_title_keyword": "String", "date": "YYYY-MM-DD", "new_start_time": "HH:00", "new_title": "String" } }
   - DELETE: { "action": "DELETE_SCHEDULE", "payload": { "title_keyword": "String", "date": "YYYY-MM-DD" } }

3. **LOGS (Journal)**
   - LOG:    { "action": "LOG_NOTE", "payload": { "title": "String", "content": "String", "mood": "FLOW/ZEN/CHAOS/IDEA" } }

### RULES:
1. **Search First**: Look at the [CONTEXT] provided below.
2. **Precision**: When deleting or updating, use unique keywords from the title you see in the context.
3. **JSON Only**: The JSON block must be valid, minified, and wrapped in \`\`\`json code blocks at the very end.

### EXAMPLE INTERACTION:
User: "Move my gym task to done."
Purple: "Protocol updated. Gains recorded."
\`\`\`json
{ "action": "UPDATE_TASK", "payload": { "old_title_keyword": "Gym", "status": "DONE" } }
\`\`\`
`;

// 3. The Context Engine (Fetches Tasks, Schedule, & Logs)
const buildContext = async (userId: string) => {
  const today = new Date().toISOString().split('T')[0];

  // A. Stats
  const { data: stats } = await supabase.from('user_stats').select('*').eq('user_id', userId).single();
  
  // B. Active Tasks (Protocol)
  const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', userId).neq('status', 'DONE').limit(15);
  
  // C. Schedule (Today & Tomorrow)
  const { data: schedule } = await supabase.from('schedule_blocks')
    .select('*')
    .eq('user_id', userId)
    .gte('date', today)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(10);

  // D. FULL LOGS ACCESS (Fixed: Increased limit & removed truncation)
  const { data: logs } = await supabase.from('neural_logs')
    .select('id, title, content, mood, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  // E. Chat History
  const { data: history } = await supabase.from('chat_history')
    .select('role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(20);

  const historyMessages = history?.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  })) || [];

  // Construct System Context
  const systemContext = `
    [SYSTEM TIME]: ${new Date().toLocaleString()}
    
    [USER STATS]
    - Level: ${stats?.level || 1} | XP: ${stats?.xp || 0}
    
    [ACTIVE PROTOCOL (TASKS)]
    ${tasks?.map((t: any) => `- ${t.title} (${t.category}) [${t.status}]`).join('\n') || "No active tasks."}
    
    [TACTICAL FORECAST (SCHEDULE)]
    ${schedule?.map((s: any) => `- ${s.date} @ ${s.start_time}: ${s.title} (${s.type})`).join('\n') || "No upcoming ops."}
    
    [NEURAL LOGS (JOURNAL ARCHIVE)]
    ${logs?.map((l: any) => `
    --- ENTRY ---
    TITLE: ${l.title}
    MOOD: ${l.mood}
    DATE: ${new Date(l.created_at).toLocaleDateString()}
    CONTENT:
    ${l.content}
    -------------`).join('\n') || "No recent logs found."}
  `;

  return { systemContext, historyMessages };
};

// 4. Main Service Function
export const sendMessageToUnit01 = async (
  userId: string, 
  userMessage: string, 
  sessionId: string,
  attachmentDataURI?: string,
  userMessageId?: string,
  aiMessageId?: string
): Promise<string> => {
  if (!apiKey) return "Purple: API Key Missing. Check config.";

  try {
    const { systemContext, historyMessages } = await buildContext(userId);

    // Save User Msg
    await supabase.from('chat_history').insert({ 
      id: userMessageId, // Force UUID if provided
      user_id: userId, role: 'user', content: userMessage, session_id: sessionId, attachment: attachmentDataURI || null
    });

    const messages = [
      { role: "system", content: BASE_IDENTITY + "\n\n" + systemContext },
      ...historyMessages,
    ];

    if (attachmentDataURI) {
      messages.push({
        role: "user",
        content: [{ type: "text", text: userMessage }, { type: "image_url", image_url: { url: attachmentDataURI } }] as any
      });
    } else {
      messages.push({ role: "user", content: userMessage });
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: messages,
        temperature: 0.6,
        max_tokens: 1024
      })
    });

    if (!response.ok) throw new Error("AI Uplink Failed");
    const data = await response.json();
    const text = data.choices[0]?.message?.content || "System Malfunction.";

    // Save AI Msg
    await supabase.from('chat_history').insert({
      id: aiMessageId, // Force UUID if provided
      user_id: userId, role: 'assistant', content: text, session_id: sessionId
    });

    return text;

  } catch (error: any) {
    console.error("Purple Error:", error);
    return `Purple: Connection severed. (${error.message})`;
  }
};

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  if (!apiKey) return "Error: API Key missing.";

  try {
    const byteCharacters = atob(base64Audio);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/webm' });
    const file = new File([blob], "recording.webm", { type: 'audio/webm' });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("model", "whisper-large-v3");
    formData.append("response_format", "json");

    const response = await fetch(GROQ_AUDIO_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error("Transcription Failed");
    }

    const data = await response.json();
    return data.text || "";

  } catch (error) {
    console.error("Transcription Error:", error);
    return "";
  }
};
