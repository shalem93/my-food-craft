import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const { phone, message, orderId } = await req.json();
    
    if (!phone || !message) {
      return new Response(
        JSON.stringify({ error: 'Phone number and message are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // For now, we'll simulate SMS sending by logging the message
    // In production, you'd integrate with Twilio, AWS SNS, or another SMS provider
    console.log(`SMS to ${phone}: ${message} (Order: ${orderId})`);
    
    // Simulate SMS delivery
    const smsData = {
      to: phone,
      message,
      orderId,
      status: 'sent',
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: `sms_${Date.now()}`,
        data: smsData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('SMS sending error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send SMS' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});