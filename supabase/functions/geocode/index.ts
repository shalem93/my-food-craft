import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();
    
    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Geocoding address:', address);

    // Try structured search first for better accuracy with US addresses
    const addressParts = address.split(',').map((p: string) => p.trim());
    let data = [];
    
    // Try full address first
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=us`,
      {
        headers: {
          'User-Agent': 'HomemadeEats/1.0'
        }
      }
    );
    data = await response.json();
    console.log('Nominatim response (full):', data);

    // If no results, try with just street + city + state/zip
    if (!data || data.length === 0) {
      // Try a simplified version - just city and zip
      const simplifiedAddress = addressParts.slice(1).join(', '); // Remove street number/name
      console.log('Trying simplified address:', simplifiedAddress);
      
      const response2 = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(simplifiedAddress)}&limit=1&countrycodes=us`,
        {
          headers: {
            'User-Agent': 'HomemadeEats/1.0'
          }
        }
      );
      data = await response2.json();
      console.log('Nominatim response (simplified):', data);
    }

    // If still no results, try zip code only for approximate location
    if (!data || data.length === 0) {
      const zipMatch = address.match(/\b(\d{5})\b/);
      if (zipMatch) {
        console.log('Trying zip code only:', zipMatch[1]);
        const response3 = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&postalcode=${zipMatch[1]}&country=us&limit=1`,
          {
            headers: {
              'User-Agent': 'HomemadeEats/1.0'
            }
          }
        );
        data = await response3.json();
        console.log('Nominatim response (zip):', data);
      }
    }

    if (data && data.length > 0) {
      return new Response(
        JSON.stringify({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          display_name: data[0].display_name
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Address not found. Try adding state (e.g., FL) or check spelling.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
