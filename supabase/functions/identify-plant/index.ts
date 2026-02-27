import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert botanist and plant identification specialist. When given a photo of a plant, identify it and return structured information. Be confident but honest when uncertain. Always provide care tips relevant to home gardeners.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Identify this plant. Provide: common name, scientific name, plant type (flower, herb, vegetable, tree, succulent, houseplant, shrub), confidence level (high/medium/low), a brief description, sunlight needs (full sun, partial shade, full shade), watering frequency (daily, every 2-3 days, weekly, bi-weekly), and 3 care tips.",
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "identify_plant",
              description: "Return structured plant identification results",
              parameters: {
                type: "object",
                properties: {
                  common_name: { type: "string", description: "Common name of the plant" },
                  scientific_name: { type: "string", description: "Scientific/Latin name" },
                  plant_type: { type: "string", enum: ["flower", "herb", "vegetable", "tree", "succulent", "houseplant", "shrub", "grass", "fern", "vine"] },
                  confidence: { type: "string", enum: ["high", "medium", "low"] },
                  description: { type: "string", description: "Brief 1-2 sentence description" },
                  sunlight: { type: "string", enum: ["Full sun", "Partial shade", "Full shade"] },
                  watering_frequency: { type: "string", enum: ["Daily", "Every 2-3 days", "Weekly", "Bi-weekly", "Monthly"] },
                  care_tips: {
                    type: "array",
                    items: { type: "string" },
                    description: "3 practical care tips for home gardeners",
                  },
                },
                required: ["common_name", "scientific_name", "plant_type", "confidence", "description", "sunlight", "watering_frequency", "care_tips"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "identify_plant" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error [${response.status}]: ${text}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("AI did not return structured identification data");
    }

    const plantData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(plantData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("identify-plant error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
