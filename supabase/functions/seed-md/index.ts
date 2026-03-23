import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const email = "jkkn@gmail.com";
    const password = "12345678";

    // Try to delete existing broken user first via direct listing
    try {
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const existing = listData?.users?.find((u) => u.email === email);
      if (existing) {
        // Delete profile and role first
        await supabaseAdmin.from("user_roles").delete().eq("user_id", existing.id);
        await supabaseAdmin.from("profiles").delete().eq("user_id", existing.id);
        // Delete the auth user
        const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(existing.id);
        if (delErr) {
          return new Response(JSON.stringify({ step: "delete", error: delErr.message }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    } catch (e) {
      return new Response(JSON.stringify({ step: "list/delete", error: e.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user properly via Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return new Response(JSON.stringify({ step: "create", error: createError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Assign MD role
    const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({
      user_id: newUser.user.id,
      role: "md",
    });

    // Create profile
    const { error: profErr } = await supabaseAdmin.from("profiles").insert({
      user_id: newUser.user.id,
      full_name: "JKKN MD",
      institute: "JKKNCET",
    });

    return new Response(JSON.stringify({ 
      success: true, 
      user_id: newUser.user.id,
      role_error: roleErr?.message || null,
      profile_error: profErr?.message || null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
