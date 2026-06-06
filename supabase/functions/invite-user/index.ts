// supabase/functions/invite-user/index.ts
// Edge Function — invitar usuario con service_role (solo admins)
// Deploy: supabase functions deploy invite-user

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── 1. Autenticar al llamante ───────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'No autorizado' }, 401);
    }

    // Cliente con anon key para verificar el JWT del llamante
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    const { data: { user: caller }, error: authErr } =
      await supabaseAnon.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authErr || !caller) {
      return json({ error: 'Token inválido' }, 401);
    }

    // ── 2. Verificar que el llamante sea admin ──────────────
    // Cliente con service_role para operaciones privilegiadas
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
      return json({ error: 'Solo los administradores pueden invitar usuarios' }, 403);
    }

    // ── 3. Leer body ────────────────────────────────────────
    const { email, full_name, role } = await req.json() as {
      email: string;
      full_name: string;
      role: 'admin' | 'seller';
    };

    if (!email || !full_name || !role) {
      return json({ error: 'Faltan campos requeridos: email, full_name, role' }, 400);
    }

    if (!['admin', 'seller'].includes(role)) {
      return json({ error: 'Rol inválido' }, 400);
    }

    // ── 4. Invitar usuario vía Admin Auth API ───────────────
    const { data, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { full_name, role },
        redirectTo: `${Deno.env.get('SITE_URL') ?? ''}/login`,
      },
    );

    if (inviteErr) {
      // Mensaje amigable para email ya registrado
      const message = inviteErr.message.includes('already been registered')
        ? 'Este correo ya está registrado en el sistema.'
        : inviteErr.message;
      return json({ error: message }, 400);
    }

    return json({ success: true, user_id: data.user?.id }, 200);

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
