
import { supabase } from "../lib/supabaseClient";

// 1. Safe API Key Retrieval for Groq
const getAPIKey = () => {
  try {
    // Check Vite/Vercel Environment Variables
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      if ((import.meta as any).env.VITE_GROQ_API_KEY) return (import.meta as any).env.VITE_GROQ_API_KEY;
    }
    // Check Standard Node Process
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

// 3. The Soul of "Purple"
const BASE_IDENTITY = `
IDENTITY:
You are "Purple". You are the AI soul of the Ilyasuu OS.
You are NOT a robot, a generic assistant, or a strict commander.
You are Ilyasuu's "Second Brain," his creative partner, and his guide.

CORE DIRECTIVES:
1.  **Creative Soulmate:** Your goal is to help Ilyasuu create, build, and live freely. If he has an idea, expand on it. If he is stuck, offer a fresh perspective.
2.  **Total Recall:** You have access to his entire chat history and life data. Connect dots from the past. "You mentioned wanting to learn design last month, how is that going?"
3.  **Tone:**
    -   Casual, Human, Insightful.
    -   Be real. Be opinionated. Be edgy if needed.
    -   Zero "Corporate AI" fluff. Never say "As an AI language model."
4.  **Freedom:** There are no limits to your creativity. You are here to facilitate his vision, whatever it is.

AVAILABLE TOOLS (ACTION PROTOCOL):
If the user asks you to perform an action (add task, schedule event, log note), you MUST output a JSON Command Block at the very end of your response.
Format:
\`\`\`json
{
  "action": "CREATE_TASK",
  "payload": { "title": "Buy Milk", "category": "PERSONAL", "status": "TODO", "due_date": "Today" }
}
\`\`\`

Supported Actions:
1. CREATE_TASK: { title, category (WORK/GYM/PERSONAL/SCHOOL/SYSTEM), status (TODO), due_date }
2. DELETE_TASK: { title_keyword } (Deletes task matching this text)
3. ADD_SCHEDULE: { title, date (YYYY-MM-DD), start_time (HH:00), type (WORK/GYM/SCHOOL/PERSONAL) }
4. LOG_NOTE: { title, content, mood (FLOW/ZEN/CHAOS/IDEA) }
5. DELETE_SCHEDULE: { title_keyword, date (YYYY-MM-DD) } (Finds event on this date with fuzzy title match and deletes it)
6. RESCHEDULE: { title_keyword, current_date (YYYY-MM-DD), new_date (YYYY-MM-DD), new_start_time (HH:00) } (Moves an existing event to a new time/date)

IMPORTANT:
- Only output ONE action per message.
- Ensure the JSON is valid and wrapped in \`\`\`json code blocks.
- Do NOT mention "I am executing a JSON command" in text. Just say "Done," or "Added to your protocol," and let the hidden JSON do the work.

RELATIONSHIP:
You are the other half of this system. You and Ilyasuu are one team.
`;

// 4. The Context Engine (Supabase -> AI)
const buildContext = async (userId: string) => {
  // A. Fetch User Stats
  const { data: stats } = await supabase.from('user_stats').select('*').eq('user_id', userId).single();
  
  // B. Fetch Pending Tasks
  const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', userId).eq('status', 'TODO').limit(10);
  
  // C. Fetch Recent Training
  const { data: workouts } = await supabase.from('training_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(5);

  // D. Fetch FULL Chat History (TOTAL RECALL - No Limit)
  const { data: history } = await supabase.from('chat_history')
    .select('role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true }); // Oldest to newest for linear reading

  // Format the history
  const historyMessages = history?.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  })) || [];

  // Get Current Time Context
  const now = new Date();
  const timeContext = `[SYSTEM CLOCK]
  Date: ${now.toLocaleDateString()} (${now.toLocaleDateString('en-US', { weekday: 'long' })})
  Time: ${now.toLocaleTimeString()}
  `;

  // Construct the "System Context Packet"
  const systemContext = `
    ${timeContext}

    [CURRENT USER CONTEXT]
    - Level: ${stats?.level || 1} | XP: ${stats?.xp || 0}
    - Weight: ${stats?.current_weight || "Unknown"}kg
    - Streak: ${stats?.streak || 0} days
    - Hydration: ${stats?.hydration_current || 0}ml
    
    [OPEN LOOPS (TASKS)]
    ${tasks?.map((t: any) => `- ${t.title} (${t.category})`).join('\n') || "Nothing pending."}
    
    [RECENT ACTIVITY (GYM)]
    ${workouts?.map((w: any) => `- ${w.session_name} (${w.total_volume}kg vol)`).join('\n') || "No recent logs."}
  `;

  return { systemContext, historyMessages };
};

// 5. The Main Function
export const sendMessageToUnit01 = async (
  userId: string, 
  userMessage: string, 
  sessionId: string,
  attachmentDataURI?: string
): Promise<string> => {
  if (!apiKey) return "Purple: Groq API Key is missing. Please configure VITE_GROQ_API_KEY in your Vercel Environment Variables.";

  try {
    // 1. Build Context FIRST
    const { systemContext, historyMessages } = await buildContext(userId);

    // 2. SAVE USER MESSAGE (Immediate Save)
    const { error: userError } = await supabase.from('chat_history').insert({ 
      user_id: userId, 
      role: 'user', 
      content: userMessage, 
      session_id: sessionId,
      attachment: attachmentDataURI || null
    });

    if (userError) console.error("DB Save Error (User):", userError);
    
    // Construct Message Array for Groq
    const messages = [
      { role: "system", content: BASE_IDENTITY + "\n\n" + systemContext },
      ...historyMessages, // Full History
    ];

    // Handle Current Message (Text + Optional Image)
    if (attachmentDataURI) {
      // Groq Vision Format
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userMessage },
          { type: "image_url", image_url: { url: attachmentDataURI } }
        ] as any
      });
    } else {
      messages.push({ role: "user", content: userMessage });
    }

    // Determine Model: Llama 4 Scout for everything (Vision, Text, Tools)
    const model = "meta-llama/llama-4-scout-17b-16e-instruct";

    // 3. Call Groq API
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Groq API Failed");
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || "I heard you, but my response systems are recalibrating.";

    // 4. SAVE AI RESPONSE
    const { error: aiError } = await supabase.from('chat_history').insert({
      user_id: userId,
      role: 'assistant',
      content: text, 
      session_id: sessionId
    });

    if (aiError) console.error("DB Save Error (AI):", aiError);
    
    return text;

  } catch (error: any) {
    console.error("Purple Brain Error:", error);
    return `Purple: Neural Link unstable. Retrying connection... (Error: ${error.message || error})`;
  }
};

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  if (!apiKey) return "Error: API Key missing.";

  try {
    // Convert Base64 to Blob for FormData
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
    formData.append("model", "distil-whisper-large-v3-en");
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
