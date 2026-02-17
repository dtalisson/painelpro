import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  // Extract appId from URL path: /api_status/{appId}
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  // segments: ["api_status", "{appId}"] or ["api_status"]
  const appId = segments.length >= 2 ? segments[segments.length - 1] : null;

  if (!appId || appId === "api_status") {
    return new Response(
      JSON.stringify({ error: "Missing appId parameter. Use /api_status/{appId}" }),
      { status: 400, headers: corsHeaders }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const { data, error } = await supabase
    .from("app_status")
    .select("*")
    .eq("app_id", appId)
    .maybeSingle();

  if (error) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  if (!data) {
    return new Response(JSON.stringify({ error: "App not found" }), {
      status: 404,
      headers: corsHeaders,
    });
  }

  // Build response matching the spec
  const response: Record<string, unknown> = {
    status: data.status,
    current_version: data.current_version,
    min_version: data.min_version,
    maintenance: data.maintenance,
  };

  if (data.message) response.message = data.message;
  if (data.message_online) response.message_online = data.message_online;
  if (data.message_offline) response.message_offline = data.message_offline;
  if (data.message_update_required) response.message_update_required = data.message_update_required;
  if (data.message_maintenance) response.message_maintenance = data.message_maintenance;
  if (data.download_url) response.download_url = data.download_url;

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: corsHeaders,
  });
});
