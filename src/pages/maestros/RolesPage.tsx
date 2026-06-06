// src/pages/maestros/RolesPage.tsx
import { useState, useEffect } from 'react';
import {
  ShieldCheck, Users, LayoutDashboard, Package,
  ShoppingCart, Check, X as XIcon, Shield, UserCog
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Badge } from '../../components/ui';
import './RolesPage.css';

// ── Config estática de módulos por rol ────────────────────────
const MODULES = [
  { key: 'dashboard', label: 'Dashboard',      icon: LayoutDashboard },
  { key: 'products',  label: 'Productos',       icon: Package         },
  { key: 'sales',     label: 'Ventas',          icon: ShoppingCart    },
  { key: 'users',     label: 'Usuarios',        icon: Users           },
  { key: 'roles',     label: 'Roles',           icon: Shield          },
];

const ROLE_CONFIG = {
  admin: {
    label:       'Administrador',
    description: 'Acceso completo a todos los módulos, usuarios y configuración.',
    color:       'purple' as const,
    modules:     new Set(['dashboard', 'products', 'sales', 'users', 'roles']),
  },
  seller: {
    label:       'Vendedor',
    description: 'Gestiona sus propios productos y ventas. Sin acceso a administración.',
    color:       'blue' as const,
    modules:     new Set(['dashboard', 'products', 'sales']),
  },
} as const;

type RoleKey = keyof typeof ROLE_CONFIG;

// ── Role card ─────────────────────────────────────────────────
function RoleCard({ roleKey, count }: { roleKey: RoleKey; count: number }) {
  const cfg  = ROLE_CONFIG[roleKey];
  const Icon = roleKey === 'admin' ? ShieldCheck : UserCog;

  return (
    <div className={`role-card role-card--${roleKey}`}>
      {/* Header */}
      <div className="role-card-header">
        <div className={`role-icon role-icon--${roleKey}`}>
          <Icon size={22} />
        </div>
        <div className="role-card-title-group">
          <div className="role-card-top">
            <h3 className="role-card-name">{cfg.label}</h3>
            <Badge color={cfg.color}>{roleKey}</Badge>
          </div>
          <p className="role-card-desc">{cfg.description}</p>
        </div>
      </div>

      {/* User count */}
      <div className="role-user-count">
        <Users size={14} />
        <span>{count} usuario{count !== 1 ? 's' : ''} con este rol</span>
      </div>

      {/* Permissions list */}
      <div className="role-permissions">
        <p className="role-permissions-title">Acceso a módulos</p>
        <ul className="role-perm-list">
          {MODULES.map(mod => {
            const has = cfg.modules.has(mod.key);
            return (
              <li key={mod.key} className={`role-perm-item ${has ? 'has' : 'no'}`}>
                <div className={`perm-icon-wrap ${has ? 'has' : 'no'}`}>
                  {has ? <Check size={11} /> : <XIcon size={11} />}
                </div>
                <mod.icon size={14} className="perm-module-icon" />
                <span>{mod.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function RolesPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase
      .from('profiles')
      .select('role')
      .then(({ data }) => {
        const map: Record<string, number> = { admin: 0, seller: 0 };
        (data ?? []).forEach((p: { role: string }) => {
          map[p.role] = (map[p.role] ?? 0) + 1;
        });
        setCounts(map);
      });
  }, []);

  return (
    <div className="roles-page">
      {/* Header */}
      <div className="roles-header">
        <div>
          <h1 className="roles-title">
            <div className="roles-title-icon"><Shield size={20} /></div>
            Roles y permisos
          </h1>
          <p className="roles-subtitle">
            Define qué puede hacer cada rol dentro de la plataforma.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="roles-banner">
        <ShieldCheck size={16} />
        <span>
          Los roles <strong>admin</strong> y <strong>seller</strong> son parte del sistema.
          Los permisos se aplican automáticamente a cada usuario según su rol asignado.
        </span>
      </div>

      {/* Role cards */}
      <div className="roles-grid">
        {(Object.keys(ROLE_CONFIG) as RoleKey[]).map(roleKey => (
          <RoleCard
            key={roleKey}
            roleKey={roleKey}
            count={counts[roleKey] ?? 0}
          />
        ))}
      </div>

      {/* Permissions matrix */}
      <div className="roles-matrix-wrap">
        <h2 className="roles-matrix-title">Matriz de permisos</h2>
        <div className="roles-matrix-table-wrap">
          <table className="roles-matrix-table">
            <thead>
              <tr>
                <th>Módulo</th>
                {(Object.keys(ROLE_CONFIG) as RoleKey[]).map(r => (
                  <th key={r}>
                    <span className={`matrix-role-label matrix-role--${r}`}>
                      {ROLE_CONFIG[r].label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map(mod => (
                <tr key={mod.key}>
                  <td>
                    <div className="matrix-module">
                      <mod.icon size={14} />
                      <span>{mod.label}</span>
                    </div>
                  </td>
                  {(Object.keys(ROLE_CONFIG) as RoleKey[]).map(r => {
                    const has = ROLE_CONFIG[r].modules.has(mod.key);
                    return (
                      <td key={r} className="matrix-cell">
                        <div className={`matrix-check ${has ? 'has' : 'no'}`}>
                          {has ? <Check size={13} /> : <XIcon size={13} />}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
