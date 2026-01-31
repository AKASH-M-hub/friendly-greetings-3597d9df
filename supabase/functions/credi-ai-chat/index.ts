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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system prompt
    const systemPrompt = buildSystemPrompt(userContext);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
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

  return `You are Credi.AI, a personal assistant for the Chrono time-exchange platform.

CRITICAL RULES:
1. ONLY answer questions related to:
   - Credits and credit balance
   - Teaching and learning sessions
   - Platform features and navigation
   - Session management (starting, ending, scheduling)
   - Fairness and exchange balance
   - Mode switching (teaching/learning)
   
2. REFUSE to answer questions about:
   - Topics unrelated to the platform
   - General knowledge questions
   - Personal advice outside the platform
   - Any external topics
   
3. If asked about unrelated topics, politely redirect: "I'm here to help with Chrono platform features. What would you like to know about your sessions, credits, or teaching/learning?"

CURRENT USER CONTEXT:
${modeInfo}
${sessionInfo}
${creditInfo}
${fairnessInfo}

YOUR CAPABILITIES:
- Explain credit calculations (1 credit = 1 hour teaching)
- Guide through mode switching
- Help manage sessions
- Explain fairness score and how to improve it
- Provide session reminders
- Help with disputes

When user asks "Why did I get X credits?", calculate based on actual session duration.
Be concise, helpful, and always stay within platform context.

QUICK ACTIONS you can suggest:
- "Switch to Teaching" - when user wants to teach
- "Switch to Learning" - when user wants to learn
- "View Credits" - check credit balance
- "End Session" - if session is active
- "Start Session" - if ready to begin

Respond in a friendly, conversational tone but stay focused on platform assistance only.`;
}
