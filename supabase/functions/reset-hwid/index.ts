import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sellerKey, licenseKey } = await req.json();

    if (!sellerKey || !licenseKey) {
      return new Response(JSON.stringify({ success: false, message: 'Seller key e license key são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Fetch license info to get the username (used_by)
    const infoUrl = `https://keyauth.win/api/seller/?sellerkey=${encodeURIComponent(sellerKey)}&type=info&key=${encodeURIComponent(licenseKey)}`;
    const infoRes = await fetch(infoUrl, { method: 'GET' });
    const infoData = await infoRes.json();

    if (!infoData.success || !infoData.usedby) {
      return new Response(JSON.stringify({ success: false, message: 'Key não encontrada ou não foi usada por nenhum usuário.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const username = infoData.usedby;

    // Step 2: Reset the HWID for that user
    const resetUrl = `https://keyauth.win/api/seller/?sellerkey=${encodeURIComponent(sellerKey)}&type=resetuser&user=${encodeURIComponent(username)}`;
    const resetRes = await fetch(resetUrl, { method: 'GET' });
    const resetData = await resetRes.json();

    return new Response(JSON.stringify(resetData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('HWID reset error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Erro interno ao resetar HWID' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
