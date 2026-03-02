const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('PLANT_ID_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Plant.id API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, query, token } = await req.json();

    if (action === 'search') {
      if (!query || query.length < 2) {
        return new Response(
          JSON.stringify({ entities: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(
        `https://plant.id/api/v3/kb/plants/name_search?q=${encodeURIComponent(query)}&limit=20`,
        { headers: { 'Api-Key': apiKey } }
      );

      if (!response.ok) {
        const err = await response.text();
        console.error('Plant.id search error:', err);
        return new Response(
          JSON.stringify({ error: 'Plant search failed', entities: [] }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'detail') {
      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Access token required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(
        `https://plant.id/api/v3/kb/plants/${token}?details=common_names,url,description,image,watering,best_watering,best_light_condition,best_soil_type`,
        { headers: { 'Api-Key': apiKey } }
      );

      if (!response.ok) {
        const err = await response.text();
        console.error('Plant.id detail error:', err);
        return new Response(
          JSON.stringify({ error: 'Plant detail fetch failed' }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "search" or "detail".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
