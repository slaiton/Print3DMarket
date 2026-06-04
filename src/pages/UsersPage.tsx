// src/pages/UsersPage.tsx
// Administración de vendedores — solo admin

import { useState, useEffect } from 'react';
import { UserPlus, Users, ShieldCheck, UserX, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button, Badge, Modal, Input, Empty, Card } from '../components/ui';
import type { Profile } from '../types';

// ── Invite modal ─────────────────────────────────────────────
function InviteModal({ open, onClose, onDone }: {
  open: boolean; onClose: () => void; onDone: () => void;
}) {
  const [email, setEmail]     = useState('');
  const [name, setName]       = useState('');
  const [role, setRole]       = useState<'seller'|'admin'>('seller');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  const handleInvite = async () => {
    if (!email || !name) { setError('Completa todos los campos'); return; }
    setLoading(true);
    setError('');
    try {
      // Supabase Admin API — invitar usuario
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { full_name: name, role },
      });
      if (inviteError) throw inviteError;
      setSent(true);
      onDone();
    } catch (e: any) {
      // Si no tiene permisos de admin vía cliente, usar edge function o mostrar instrucción
      setError(
        e.message?.includes('not allowed')
          ? 'Para invitar usuarios, ve a Supabase → Authentication → Users → Invite user, ingresa el email y luego actualiza el role en la tabla profiles.'
          : e.message
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setEmail(''); setName(''); setRole('seller'); setSent(false); setError(''); };

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title="Invitar vendedor">
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
            <Mail size={22} className="text-green-600"/>
          </div>
          <p className="font-semibold text-fg">¡Invitación enviada!</p>
          <p className="text-sm text-fg-muted">
            {email} recibirá un correo para configurar su contraseña.
          </p>
          <Button onClick={() => { reset(); onClose(); }}>Cerrar</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Input label="Nombre completo" value={name}
            onChange={e => setName(e.target.value)} placeholder="Ana García" />
          <Input label="Correo electrónico" type="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="vendedor@email.com" />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-fg">Rol</label>
            <div className="flex gap-3">
              {(['seller', 'admin'] as const).map(r => (
                <label key={r} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="role" value={r}
                    checked={role === r} onChange={() => setRole(r)}
                    className="accent-accent"/>
                  <span className="text-sm text-fg capitalize">{r === 'seller' ? 'Vendedor' : 'Administrador'}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200
                            rounded-lg p-3 leading-relaxed">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleInvite} loading={loading} icon={<Mail size={14}/>}>
              Enviar invitación
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers]       = useState<Profile[]>([]);
  const [loading, setLoading]   = useState(true);
  const [inviteOpen, setInvite] = useState(false);
  const [search, setSearch]     = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setUsers((data ?? []) as Profile[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (user: Profile) => {
    await supabase.from('profiles')
      .update({ is_active: !user.is_active })
      .eq('id', user.id);
    load();
  };

  const changeRole = async (user: Profile, role: 'seller'|'admin') => {
    await supabase.from('profiles').update({ role }).eq('id', user.id);
    load();
  };

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (u.phone ?? '').includes(search)
  );

  const activeCount = users.filter(u => u.is_active).length;
  const adminCount  = users.filter(u => u.role === 'admin').length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-fg">Vendedores</h1>
          <p className="text-sm text-fg-muted mt-0.5">{users.length} usuarios registrados</p>
        </div>
        <Button icon={<UserPlus size={16}/>} onClick={() => setInvite(true)}>
          Invitar vendedor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="flex items-center gap-3 !p-4">
          <div className="p-2 rounded-lg bg-blue-50">
            <Users size={18} className="text-blue-600"/>
          </div>
          <div>
            <p className="text-xs text-fg-muted">Total</p>
            <p className="text-xl font-bold text-fg">{users.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 !p-4">
          <div className="p-2 rounded-lg bg-green-50">
            <Users size={18} className="text-green-600"/>
          </div>
          <div>
            <p className="text-xs text-fg-muted">Activos</p>
            <p className="text-xl font-bold text-fg">{activeCount}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 !p-4">
          <div className="p-2 rounded-lg bg-purple-50">
            <ShieldCheck size={18} className="text-purple-600"/>
          </div>
          <div>
            <p className="text-xs text-fg-muted">Admins</p>
            <p className="text-xl font-bold text-fg">{adminCount}</p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o teléfono..."
          className="w-full max-w-sm px-3 py-2 text-sm border border-border rounded-lg
                     bg-bg text-fg outline-none focus:border-accent placeholder:text-fg-muted"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-surface border border-border rounded-xl animate-pulse"/>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <Empty
          icon={<Users/>}
          title="Sin vendedores"
          sub="Invita al primer miembro de tu equipo"
          action={<Button onClick={() => setInvite(true)} icon={<UserPlus size={14}/>}>Invitar vendedor</Button>}
        />
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg border-b border-border">
              <tr>
                {['Vendedor', 'Rol', 'Estado', 'Se unió', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold
                                          text-fg-muted uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-bg/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center
                                      justify-center text-sm font-bold text-accent flex-shrink-0">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-fg">{user.full_name}</p>
                        {user.phone && <p className="text-xs text-fg-muted">{user.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={e => changeRole(user, e.target.value as 'seller'|'admin')}
                      className="text-xs border border-border rounded-lg px-2 py-1
                                 bg-bg text-fg outline-none focus:border-accent"
                    >
                      <option value="seller">Vendedor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={user.is_active ? 'green' : 'red'}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-muted">
                    {new Date(user.created_at).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(user)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs
                                  rounded-lg border transition-all
                                  ${user.is_active
                                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                                    : 'border-green-200 text-green-600 hover:bg-green-50'
                                  }`}
                    >
                      <UserX size={12}/>
                      {user.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InviteModal open={inviteOpen} onClose={() => setInvite(false)} onDone={load}/>
    </div>
  );
}
