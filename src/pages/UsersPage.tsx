// src/pages/UsersPage.tsx
// Administración de usuarios — solo admin

import { useState, useEffect } from 'react';
import { UserPlus, Users, ShieldCheck, UserX, Mail, Search, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button, Badge, Modal, Input, Empty } from '../components/ui';
import type { Profile } from '../types';
import './UsersPage.css';

// ── Invite modal ─────────────────────────────────────────────
function InviteModal({ open, onClose, onDone }: {
  open: boolean; onClose: () => void; onDone: () => void;
}) {
  const [email, setEmail]     = useState('');
  const [name, setName]       = useState('');
  const [role, setRole]       = useState<'seller' | 'admin'>('seller');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  const handleInvite = async () => {
    if (!email || !name) { setError('Completa todos los campos'); return; }
    setLoading(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('invite-user', {
        body: { email, full_name: name, role },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setSent(true);
      onDone();
    } catch (e: any) {
      setError(e.message ?? 'Error al enviar la invitación');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setEmail(''); setName(''); setRole('seller'); setSent(false); setError(''); };

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title="Invitar usuario">
      {sent ? (
        <div className="uf-success">
          <div className="uf-success-icon"><Mail size={24} /></div>
          <p className="uf-success-title">¡Invitación enviada!</p>
          <p className="uf-success-sub">
            {email} recibirá un correo para configurar su contraseña.
          </p>
          <Button onClick={() => { reset(); onClose(); }}>Cerrar</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Nombre completo" value={name}
            onChange={e => setName(e.target.value)} placeholder="Ana García" />
          <Input label="Correo electrónico" type="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="usuario@email.com" />

          <div>
            <p className="uf-role-label">Rol asignado</p>
            <div className="uf-role-group">
              {(['seller', 'admin'] as const).map(r => (
                <label key={r} className="uf-role-option">
                  <input type="radio" name="role" value={r}
                    checked={role === r} onChange={() => setRole(r)} />
                  {r === 'seller' ? 'Vendedor' : 'Administrador'}
                </label>
              ))}
            </div>
          </div>

          {error && <div className="uf-error-box">{error}</div>}

          <div className="uf-actions">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleInvite} loading={loading} icon={<Mail size={14} />}>
              Enviar invitación
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Edit modal ────────────────────────────────────────────────
function EditUserModal({ user, open, onClose, onDone }: {
  user: Profile | null; open: boolean; onClose: () => void; onDone: () => void;
}) {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Sincroniza campos cuando cambia el usuario seleccionado
  useEffect(() => {
    if (user) {
      setName(user.full_name ?? '');
      // El email viene de auth.users, no de profiles — lo dejamos vacío
      // para que el admin solo edite si quiere cambiarlo
      setEmail('');
      setError('');
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) { setError('El nombre no puede estar vacío'); return; }
    setLoading(true);
    setError('');
    try {
      const body: Record<string, string> = { user_id: user!.id, full_name: name.trim() };
      if (email.trim()) body.email = email.trim();

      const { data, error: fnError } = await supabase.functions.invoke('update-user', {
        body,
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      onDone();
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar usuario">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input
          label="Nombre completo"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre del usuario"
        />
        <Input
          label="Nuevo correo electrónico"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Dejar vacío para no cambiar"
          hint="Solo completa si quieres cambiar el correo actual."
        />

        {error && <div className="uf-error-box">{error}</div>}

        <div className="uf-actions">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} loading={loading} icon={<Pencil size={14} />}>
            Guardar cambios
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers]         = useState<Profile[]>([]);
  const [loading, setLoading]     = useState(true);
  const [inviteOpen, setInvite]   = useState(false);
  const [editUser, setEditUser]   = useState<Profile | null>(null);
  const [search, setSearch]       = useState('');

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

  const changeRole = async (user: Profile, role: 'seller' | 'admin') => {
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
    <div className="users-page">
      {/* Header */}
      <div className="users-header">
        <div>
          <h1 className="users-title">
            <div className="users-title-icon"><Users size={20} /></div>
            Usuarios
          </h1>
          <p className="users-subtitle">
            {users.length} usuario{users.length !== 1 ? 's' : ''} registrados
          </p>
        </div>
        <Button icon={<UserPlus size={16} />} onClick={() => setInvite(true)}>
          Invitar usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="users-stats">
        <div className="ustat-card">
          <div className="ustat-icon blue"><Users size={20} /></div>
          <div>
            <p className="ustat-label">Total</p>
            <p className="ustat-value">{users.length}</p>
          </div>
        </div>
        <div className="ustat-card">
          <div className="ustat-icon green"><Users size={20} /></div>
          <div>
            <p className="ustat-label">Activos</p>
            <p className="ustat-value">{activeCount}</p>
          </div>
        </div>
        <div className="ustat-card">
          <div className="ustat-icon purple"><ShieldCheck size={20} /></div>
          <div>
            <p className="ustat-label">Admins</p>
            <p className="ustat-value">{adminCount}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="users-toolbar">
        <div className="users-search">
          <Search size={14} className="users-search-icon" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="users-loading">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="users-skeleton" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <Empty
          icon={<Users />}
          title="Sin usuarios"
          sub="Invita al primer miembro de tu equipo"
          action={
            <Button onClick={() => setInvite(true)} icon={<UserPlus size={14} />}>
              Invitar usuario
            </Button>
          }
        />
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                {['Usuario', 'Rol', 'Estado', 'Se unió', 'Acciones'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id}>
                  {/* Nombre + avatar */}
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="user-name">{user.full_name}</p>
                        {user.phone && <p className="user-phone">{user.phone}</p>}
                      </div>
                    </div>
                  </td>

                  {/* Rol */}
                  <td>
                    <select
                      className="role-select"
                      value={user.role}
                      onChange={e => changeRole(user, e.target.value as 'seller' | 'admin')}
                    >
                      <option value="seller">Vendedor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>

                  {/* Estado */}
                  <td>
                    <Badge color={user.is_active ? 'green' : 'red'}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>

                  {/* Fecha */}
                  <td style={{ fontSize: '.8rem', color: '#6b7280' }}>
                    {new Date(user.created_at).toLocaleDateString('es-CO')}
                  </td>

                  {/* Acciones */}
                  <td>
                    <div className="user-actions">
                      <button
                        className="user-edit-btn"
                        onClick={() => setEditUser(user)}
                        title="Editar usuario"
                      >
                        <Pencil size={13} />
                        Editar
                      </button>
                      <button
                        className={`toggle-btn ${user.is_active ? 'deactivate' : 'activate'}`}
                        onClick={() => toggleActive(user)}
                      >
                        <UserX size={13} />
                        {user.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InviteModal open={inviteOpen} onClose={() => setInvite(false)} onDone={load} />
      <EditUserModal
        user={editUser}
        open={!!editUser}
        onClose={() => setEditUser(null)}
        onDone={load}
      />
    </div>
  );
}
