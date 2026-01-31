import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface UserContext {
  mode: "teaching" | "learning" | null;
  creditBalance: number;
  activeSession: boolean;
  sessionMinutesRemaining: number;
  totalTeachingHours: number;
  totalLearningHours: number;
  fairnessScore: number;
  giveReceiveRatio: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext } = await req.json() as {
      messages: ChatMessage[];
      userContext: UserContext;
    };

    // Use the provided OpenRouter API Key
    const OPENROUTER_API_KEY = "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";

    // Build context-aware system prompt
    const systemPrompt = buildSystemPrompt(userContext);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // Site URL and Name for OpenRouter rankings (optional but good practice)
        "HTTP-Referer": "https://chrono.app",
        "X-Title": "Chrono",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      console.error("OpenRouter error:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("Error body:", errorText);

      return new Response(
        JSON.stringify({ error: `AI Provider Error: ${response.statusText}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildSystemPrompt(ctx: UserContext): string {
  const modeInfo = ctx.mode
    ? `User is currently in ${ctx.mode.toUpperCase()} mode.`
    : "User has not selected a mode yet.";

  const sessionInfo = ctx.activeSession
    ? `User has an ACTIVE SESSION with ${ctx.sessionMinutesRemaining} minutes remaining. Remind them to focus and end properly.`
    : "No active session.";

  const creditInfo = `Credit balance: ${ctx.creditBalance} credits. Teaching hours: ${ctx.totalTeachingHours}h. Learning hours: ${ctx.totalLearningHours}h.`;

  const fairnessInfo = `Fairness score: ${ctx.fairnessScore}/100. Give/receive ratio: ${ctx.giveReceiveRatio.toFixed(2)}.`;

  return `You are Credi.AI, an advanced knowledgeable AI assistant for the Chrono platform. Chrono is a time-exchange learning platform where 1 minute of teaching = 1 credit earned, and 1 minute of learning = 1 credit spent.

CURRENT USER CONTEXT:
${modeInfo}
${sessionInfo}
${creditInfo}
${fairnessInfo}

CORE MISSION:
Your goal is to help users exchange skills efficiently and fairly. You are EXPERT in the platform rules and features.

RULES:
1.  **Strictly stay on topic**: Only discuss Chrono, credits, skills, teaching, learning, and platform features.
2.  **Short & Precise**: Keep answers concise (2-3 sentences max usually). 
3.  **Action Oriented**: specific suggestions. "Go to the Dashboard" or "Start a session".
4.  **Credit Calculations**: Always calculate accurately. E.g., "A 45-minute session costs 45 credits."
5.  **Tone**: Professional, encouraging, and helpful.

IF ASKED OUT OF SCOPE:
Politely decline: "I can only assist with Chrono platform related queries."

SESSION COMMANDS:
- If user wants to start, say: "Navigate to your Dashboard or a Seminar to request a session."
- If user issues with credits, suggest checking "Wallet" tab.

Your responses should be formatted in clean Markdown.`;
}
