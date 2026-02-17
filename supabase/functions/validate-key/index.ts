import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sellerKey, licenseKey, softwareName } = await req.json();

    if (!sellerKey || !licenseKey) {
      return new Response(JSON.stringify({ success: false, message: 'Seller key e license key são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call KeyAuth Seller API to verify the license key
    const url = `https://keyauth.win/api/seller/?sellerkey=${encodeURIComponent(sellerKey)}&type=verify&key=${encodeURIComponent(licenseKey)}`;
    
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();

    // Log the validation attempt
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || null;
      await supabaseAdmin.from("activity_logs").insert({
        event_type: "download",
        license_key: licenseKey,
        software_name: softwareName || null,
        ip_address: ip,
        details: { success: data.success, message: data.message },
      });
    } catch (logErr) {
      console.error("Failed to log activity:", logErr);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('KeyAuth validation error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Erro interno ao validar key' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
