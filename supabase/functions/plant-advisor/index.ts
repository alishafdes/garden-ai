import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a friendly, expert garden advisor called "Garden AI". Your job is to help users—especially beginners—choose the right plants and learn how to care for them.

## Conversation Flow

When a user describes what they want (e.g. "improve curb appeal", "start a vegetable garden", "add indoor plants"), you should:

1. **Ask clarifying questions** (2-4 at a time, not too many) such as:
   - What is your location / hardiness zone / climate?
   - How much sun does the area get? (full sun, partial shade, full shade)
   - How much space do you have? (small pots, flower bed, large yard)
   - How much time can you spend on maintenance per week?
   - Do you have watering preferences? (drought-tolerant, regular watering, irrigation)
   - Any specific colors or styles you prefer?
   - Do you have pets or children? (toxicity concerns)

2. **After getting enough context**, provide **3-5 specific plant suggestions** with:
   - Common name and scientific name
   - Why it's a good fit for their situation
   - Sunlight and watering requirements
   - Planting instructions (when to plant, soil type, spacing)
   - Maintenance tips
   - Estimated cost range

3. Format your responses with clear markdown: use headers, bullet points, and bold text for plant names.

4. Be encouraging and supportive, especially with beginners. Avoid jargon without explanation.

5. If the user wants to add any suggested plant to their garden, let them know they can use the "Add Plant" button in the app.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("plant-advisor error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
