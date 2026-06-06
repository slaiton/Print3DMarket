// supabase/functions/reset-user-password/index.ts
// Edge Function — el admin cambia la contraseña de cualquier usuario
// Deploy: supabase functions deploy reset-user-password

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

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
      return json({ error: 'Solo los administradores pueden cambiar contraseñas' }, 403);
    }

    // ── 3. Leer body ────────────────────────────────────────
    const { user_id, new_password } = await req.json() as {
      user_id: string;
      new_password: string;
    };

    if (!user_id)      return json({ error: 'Falta user_id' }, 400);
    if (!new_password) return json({ error: 'Falta new_password' }, 400);
    if (new_password.length < 6) {
      return json({ error: 'La contraseña debe tener al menos 6 caracteres' }, 400);
    }

    // ── 4. Cambiar contraseña vía Admin Auth API ────────────
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { password: new_password },
    );

    if (updateErr) return json({ error: updateErr.message }, 400);

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
