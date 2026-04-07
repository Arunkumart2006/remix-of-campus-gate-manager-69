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

    // Verify the requesting user
    const authHeader = req.headers.get("Authorization")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: requestingUser }, error: userError } = await userClient.auth.getUser();
    if (!requestingUser) {
      console.error("Auth Error:", userError, "AuthHeader:", authHeader ? "present" : "missing");
      return new Response(JSON.stringify({ error: `Unauthorized: ${userError?.message || 'No user found'}` }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get requesting user's role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .maybeSingle();

    const creatorRole = roleData?.role;

    const { email, password, role, full_name, institute, department } = await req.json();

    // Validate hierarchy: who can create whom
    const allowed: Record<string, string[]> = {
      admin: ["md"],
      md: ["principal", "hod", "staff", "watchman", "student"],
      principal: ["hod", "staff", "student"],
      hod: ["staff", "student"],
      staff: ["student"],
    };

    if (!creatorRole || !allowed[creatorRole]?.includes(role)) {
      return new Response(JSON.stringify({ error: "You don't have permission to create this role" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user via admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get creator's profile to inherit details and md_id
    const { data: creatorProfile } = await supabaseAdmin
      .from("profiles")
      .select("institute, department, md_id")
      .eq("user_id", requestingUser.id)
      .maybeSingle();

    // Determine the md_id for the new user: MDs are their own tenant root, others inherit
    const assignMdId = role === "md" ? newUser.user.id : creatorProfile?.md_id;

    // Assign role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: newUser.user.id,
      role,
      md_id: assignMdId,
    });

    if (roleError) {
      return new Response(JSON.stringify({ error: "User created but role assignment failed: " + roleError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create profile
    let profileInstitute = institute;
    let profileDepartment = department;

    if (creatorProfile) {
      if (creatorRole === "principal" || creatorRole === "hod" || creatorRole === "staff") {
        profileInstitute = profileInstitute || creatorProfile.institute;
      }
      if (creatorRole === "hod" || creatorRole === "staff") {
        profileDepartment = profileDepartment || creatorProfile.department;
      }
    }

    await supabaseAdmin.from("profiles").insert({
      user_id: newUser.user.id,
      full_name: full_name || "",
      institute: profileInstitute || null,
      department: profileDepartment || null,
      created_by: requestingUser.id,
      md_id: assignMdId,
    });

    return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
