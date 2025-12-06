
import { GoogleGenAI } from "@google/genai";
import { supabase } from "../lib/supabaseClient";

// 1. Initialize Gemini with new SDK and process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  const historyText = history?.map(msg => 
    `[${new Date(msg.created_at).toLocaleDateString()}] ${msg.role === 'user' ? 'ILYASUU' : 'PURPLE'}: ${msg.content}`
  ).join('\n') || "No prior memory.";

  // Get Current Time Context
  const now = new Date();
  const timeContext = `[SYSTEM CLOCK]
  Date: ${now.toLocaleDateString()} (${now.toLocaleDateString('en-US', { weekday: 'long' })})
  Time: ${now.toLocaleTimeString()}
  `;

  // Construct the "Context Packet"
  return `
    ${timeContext}

    [CURRENT USER CONTEXT]
    - Level: ${stats?.level || 1} | XP: ${stats?.xp || 0}
    - Weight: ${stats?.current_weight || "Unknown"}kg
    - Streak: ${stats?.streak || 0} days
    - Hydration: ${stats?.hydration_current || 0}ml
    
    [OPEN LOOPS (TASKS)]
    ${tasks?.map(t => `- ${t.title} (${t.category})`).join('\n') || "Nothing pending."}
    
    [RECENT ACTIVITY (GYM)]
    ${workouts?.map(w => `- ${w.session_name} (${w.total_volume}kg vol)`).join('\n') || "No recent logs."}
    
    [LONG TERM MEMORY (FULL CONVERSATION HISTORY)]
    ${historyText}
    
    [USER INPUT FOLLOWS]
  `;
};

// 5. The Main Function
export const sendMessageToUnit01 = async (
  userId: string, 
  userMessage: string, 
  sessionId: string,
  attachmentDataURI?: string // Supports Images, PDFs, Audio, Video
): Promise<string> => {
  if (!process.env.API_KEY) return "Purple: API Key is missing. Check your config.";

  try {
    // 1. SAVE USER MESSAGE (Immediate Save)
    // CRITICAL: Use 'userMessage', NOT 'response'. This fixes the bug where AI text was saved as user input.
    const { error: userError } = await supabase.from('chat_history').insert({ 
      user_id: userId, 
      role: 'user', 
      content: userMessage, // Correct variable
      session_id: sessionId,
      attachment: attachmentDataURI || null
    });

    if (userError) console.error("DB Save Error (User):", userError);

    // 2. Build Context & Send to AI
    const contextData = await buildContext(userId);
    
    const fullPrompt = `
      ${BASE_IDENTITY}
      
      ${contextData}
      
      ILYASUU: ${userMessage}
    `;

    let response;
    
    if (attachmentDataURI) {
      // Parse Data URI: data:[<mediatype>][;base64],<data>
      const matches = attachmentDataURI.match(/^data:(.+);base64,(.+)$/);
      
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash", 
          contents: {
            parts: [
              { inlineData: { mimeType: mimeType, data: base64Data } },
              { text: fullPrompt }
            ]
          }
        });
      } else {
        // Fallback
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: fullPrompt,
        });
      }
    } else {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
      });
    }

    const text = response.text || "I heard you, but my response systems are recalibrating.";

    // 3. SAVE AI RESPONSE
    // CRITICAL: Save the generated 'text' with role 'assistant'
    const { error: aiError } = await supabase.from('chat_history').insert({
      user_id: userId,
      role: 'assistant',
      content: text, // The AI's response
      session_id: sessionId
    });

    if (aiError) console.error("DB Save Error (AI):", aiError);
    
    return text;

  } catch (error) {
    console.error("Purple Brain Error:", error);
    return "Purple: Neural Link unstable. Retrying connection... (Error: " + error + ")";
  }
};

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  if (!process.env.API_KEY) return "Error: API Key missing.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { text: "Transcribe the following audio exactly as spoken. Do not add any commentary, just the text." },
          {
            inlineData: {
              mimeType: "audio/webm",
              data: base64Audio
            }
          }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Transcription Error:", error);
    return "";
  }
};
