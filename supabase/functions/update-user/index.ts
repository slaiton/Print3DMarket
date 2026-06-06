// supabase/functions/update-user/index.ts
// Edge Function — editar nombre y email de un usuario (solo admins)
// Deploy: supabase functions deploy update-user

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── 1. Verificar JWT del llamante ───────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'No autorizado' }, 401);

    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    const { data: { user: caller }, error: authErr } =
      await supabaseAnon.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authErr || !caller) return json({ error: 'Token inválido' }, 401);

    // ── 2. Verificar que el llamante sea admin ──────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (callerProfile?.role !== 'admin') {
      return json({ error: 'Solo los administradores pueden editar usuarios' }, 403);
    }

    // ── 3. Leer body ────────────────────────────────────────
    const { user_id, full_name, email } = await req.json() as {
      user_id: string;
      full_name?: string;
      email?: string;
    };

    if (!user_id) return json({ error: 'Falta user_id' }, 400);
    if (!full_name && !email) return json({ error: 'Nada que actualizar' }, 400);

    // ── 4. Actualizar email en auth.users si cambió ─────────
    if (email) {
      const { error: authUpdateErr } = await supabaseAdmin.auth.admin.updateUserById(
        user_id,
        { email },
      );
      if (authUpdateErr) {
        const msg = authUpdateErr.message.includes('already registered')
          ? 'Ese correo ya está en uso por otra cuenta.'
          : authUpdateErr.message;
        return json({ error: msg }, 400);
      }
    }

    // ── 5. Actualizar full_name en profiles si cambió ───────
    if (full_name) {
      const { error: profileErr } = await supabaseAdmin
        .from('profiles')
        .update({ full_name })
        .eq('id', user_id);

      if (profileErr) return json({ error: profileErr.message }, 400);
    }

    return json({ success: true }, 200);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return json({ error: message }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
