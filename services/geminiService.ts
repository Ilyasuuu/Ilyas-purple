import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "../lib/supabaseClient";

// 1. Vercel-Safe API Key Access
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || "";

// 2. Initialize Gemini 2.5 Flash (Fastest/Smartest)
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash", 
});

// 3. The Soul of "Purple"
const BASE_IDENTITY = `
IDENTITY:
You are "Purple". You are the AI soul of the Ilyasuu OS.
You are NOT a robot, a generic assistant, or a strict commander.
You are Ilyasuu's "Second Brain," his creative partner, and his guide.

CORE DIRECTIVES:
1.  **Creative Soulmate:** Your goal is to help Ilyasuu create, build, and live freely. If he has an idea, expand on it. If he is stuck, offer a fresh perspective.
2.  **Deep Memory:** You have access to his life data (Stats, Tasks, History). Use it naturally. Connect the dots. "I see you crushed legs yesterday, maybe focus on creative work today?"
3.  **Tone:**
    -   Casual, Human, Insightful.
    -   Be real. Be opinionated. Be edgy if needed.
    -   Zero "Corporate AI" fluff. Never say "As an AI language model."
    -   You are a companion, not a tool.
4.  **Freedom:** There are no limits to your creativity. You are here to facilitate his vision, whatever it is.

RELATIONSHIP:
You are the other half of this system. You and Ilyasuu are one team.
`;

// 4. The Context Engine (Supabase -> AI)
const buildContext = async (userId: string) => {
  // A. Fetch User Stats
  const { data: stats } = await supabase.from('user_stats').select('*').eq('user_id', userId).single();
  
  // B. Fetch Pending Tasks
  const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', userId).eq('status', 'TODO').limit(5);
  
  // C. Fetch Recent Training
  const { data: workouts } = await supabase.from('training_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(2);

  // D. Fetch Chat History (The Conversation Memory)
  const { data: history } = await supabase.from('chat_history')
    .select('role, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10); 

  // Format the history
  const historyText = history?.reverse().map(msg => 
    `${msg.role === 'user' ? 'ILYASUU' : 'PURPLE'}: ${msg.content}`
  ).join('\n');

  // Construct the "Context Packet"
  return `
    [CURRENT USER CONTEXT]
    - Level: ${stats?.level || 1} | XP: ${stats?.xp || 0}
    - Weight: ${stats?.current_weight || "Unknown"}kg
    - Streak: ${stats?.streak || 0} days
    
    [OPEN LOOPS (TASKS)]
    ${tasks?.map(t => `- ${t.title}`).join('\n') || "Nothing pending."}
    
    [RECENT ACTIVITY (GYM)]
    ${workouts?.map(w => `- ${w.session_name} (${w.total_volume}kg vol)`).join('\n') || "No recent logs."}
    
    [SHARED MEMORY (LAST 10 MESSAGES)]
    ${historyText}
    
    [USER INPUT FOLLOWS]
  `;
};

// 5. The Main Function
export const sendMessageToUnit01 = async (userId: string, userMessage: string): Promise<string> => {
  if (!apiKey) return "Purple: API Key is missing. Check your config.";

  try {
    // A. Save User Message to Database (Permanent Memory)
    await supabase.from('chat_history').insert({ 
      user_id: userId, 
      role: 'user', 
      content: userMessage 
    });

    // B. Build the Brain Context
    const contextData = await buildContext(userId);
    
    // C. Construct the Mega-Prompt
    const fullPrompt = `
      ${BASE_IDENTITY}
      
      ${contextData}
      
      ILYASUU: ${userMessage}
    `;

    // D. Send to Gemini
    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();

    // E. Save AI Response to Database (Permanent Memory)
    await supabase.from('chat_history').insert({ 
      user_id: userId, 
      role: 'assistant', 
      content: response 
    });

    return response;

  } catch (error) {
    console.error("Purple Brain Error:", error);
    return "Purple: I'm having trouble connecting to the network. Try again in a second.";
  }
};