import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Content-Type': 'application/json',
};

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const LOCKOUT_MINUTES = 30;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: corsHeaders,
    });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ success: false, message: 'Email e senha são obrigatórios.' }), {
        status: 400, headers: corsHeaders,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      return new Response(JSON.stringify({ success: false, message: 'Email inválido.' }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (password.length > 128) {
      return new Response(JSON.stringify({ success: false, message: 'Senha inválida.' }), {
        status: 400, headers: corsHeaders,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("cf-connecting-ip") 
      || "unknown";

    // Cleanup old attempts
    await supabaseAdmin.rpc("cleanup_old_login_attempts");

    // Check rate limit by IP
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
    
    const { data: ipAttempts } = await supabaseAdmin
      .from("login_attempts")
      .select("id", { count: "exact" })
      .eq("ip_address", ip)
      .eq("success", false)
      .gte("attempted_at", windowStart);

    const ipCount = ipAttempts?.length || 0;

    if (ipCount >= MAX_ATTEMPTS) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: `Muitas tentativas. Tente novamente em ${LOCKOUT_MINUTES} minutos.`,
        locked: true,
      }), {
        status: 429, headers: corsHeaders,
      });
    }

    // Check rate limit by email
    const { data: emailAttempts } = await supabaseAdmin
      .from("login_attempts")
      .select("id", { count: "exact" })
      .eq("email", email.toLowerCase())
      .eq("success", false)
      .gte("attempted_at", windowStart);

    const emailCount = emailAttempts?.length || 0;

    if (emailCount >= MAX_ATTEMPTS) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: `Muitas tentativas para este email. Tente novamente em ${LOCKOUT_MINUTES} minutos.`,
        locked: true,
      }), {
        status: 429, headers: corsHeaders,
      });
    }

    // Attempt login using admin client
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      // Log failed attempt
      await supabaseAdmin.from("login_attempts").insert({
        ip_address: ip,
        email: email.toLowerCase(),
        success: false,
      });

      const remaining = MAX_ATTEMPTS - (ipCount + 1);

      return new Response(JSON.stringify({ 
        success: false, 
        message: remaining > 0 
          ? `Credenciais inválidas. ${remaining} tentativa(s) restante(s).`
          : `Muitas tentativas. Tente novamente em ${LOCKOUT_MINUTES} minutos.`,
        locked: remaining <= 0,
      }), {
        status: 401, headers: corsHeaders,
      });
    }

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      // Not admin - sign out and log
      await supabaseAuth.auth.signOut();
      await supabaseAdmin.from("login_attempts").insert({
        ip_address: ip,
        email: email.toLowerCase(),
        success: false,
      });

      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Sem permissão de administrador.',
      }), {
        status: 403, headers: corsHeaders,
      });
    }

    // Log successful attempt
    await supabaseAdmin.from("login_attempts").insert({
      ip_address: ip,
      email: email.toLowerCase(),
      success: true,
    });

    return new Response(JSON.stringify({ 
      success: true,
      session: authData.session,
    }), {
      status: 200, headers: corsHeaders,
    });

  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({ success: false, message: 'Erro interno.' }), {
      status: 500, headers: corsHeaders,
    });
  }
});
