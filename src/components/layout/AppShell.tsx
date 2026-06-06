// src/components/layout/AppShell.tsx

import { ReactNode, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  BookOpen, LogOut, Menu, X, ChevronRight,
  Printer, Shield, ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import './AppShell.css';

// ── Nav structure ─────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'seller'] },
  { to: '/products',  label: 'Productos',  icon: Package,          roles: ['admin']           },
  { to: '/sales',     label: 'Ventas',     icon: ShoppingCart,     roles: ['admin', 'seller'] },
];

const MAESTROS_ITEMS = [
  { to: '/maestros/usuarios', label: 'Usuarios', icon: Users  },
  { to: '/maestros/roles',    label: 'Roles',     icon: Shield },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':          'Dashboard',
  '/products':           'Productos',
  '/sales':              'Ventas',
  '/maestros/usuarios':  'Usuarios',
  '/maestros/roles':     'Roles y permisos',
  '/catalog':            'Catálogo',
};

// ── SidebarNav ────────────────────────────────────────────────
function SidebarNav({ onLinkClick, isAdmin }: { onLinkClick?: () => void; isAdmin: boolean }) {
  const { profile, signOut } = useAuthStore();
  const navigate   = useNavigate();
  const location   = useLocation();

  // Auto-expande si alguna ruta de Maestros está activa
  const inMaestros = location.pathname.startsWith('/maestros');
  const [maestrosOpen, setMaestrosOpen] = useState(inMaestros);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter(i => i.roles.includes(profile?.role ?? ''));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div className="shell-logo">
        <div className="shell-logo-icon">
          <Printer size={17} />
        </div>
        <div>
          <p className="shell-logo-text">Print3D</p>
          <p className="shell-logo-sub">Panel de ventas</p>
        </div>
      </div>

      {/* Nav principal */}
      <nav className="shell-nav">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onLinkClick}
            className={({ isActive }) => `shell-nav-link${isActive ? ' active' : ''}`}
          >
            <item.icon size={17} />
            <span>{item.label}</span>
            <ChevronRight size={13} className="chevron" />
          </NavLink>
        ))}

        {/* Maestros — solo admin */}
        {isAdmin && (
          <div className="shell-nav-group">
            <button
              className={`shell-group-header${maestrosOpen ? ' open' : ''}`}
              onClick={() => setMaestrosOpen(o => !o)}
            >
              <span className="shell-group-label">Maestros</span>
              <ChevronDown size={13} className="group-chevron" />
            </button>

            <div className={`shell-group-items${maestrosOpen ? ' open' : ''}`}>
              {MAESTROS_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onLinkClick}
                  className={({ isActive }) =>
                    `shell-nav-link shell-nav-link--sub${isActive ? ' active' : ''}`
                  }
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                  <ChevronRight size={12} className="chevron" />
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Catálogo — sección separada */}
        <div className="shell-nav-section">
          <NavLink
            to="/catalog"
            onClick={onLinkClick}
            className={({ isActive }) => `shell-nav-link${isActive ? ' active' : ''}`}
          >
            <BookOpen size={17} />
            <span>Ver catálogo</span>
            <ChevronRight size={13} className="chevron" />
          </NavLink>
        </div>
      </nav>

      {/* Footer usuario */}
      <div className="shell-user-footer">
        <div className="shell-user-info">
          <div className="shell-user-avatar">
            {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <p className="shell-user-name">{profile?.full_name}</p>
            <p className="shell-user-role">{profile?.role}</p>
          </div>
        </div>
        <button className="shell-signout" onClick={handleSignOut}>
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ── AppShell ──────────────────────────────────────────────────
export function AppShell({ children }: { children: ReactNode }) {
  const { profile } = useAuthStore();
  const location    = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin   = profile?.role === 'admin';
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Print3D';

  return (
    <div className="shell-root">
      {/* Desktop sidebar */}
      <aside className="shell-sidebar">
        <SidebarNav isAdmin={isAdmin} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="shell-mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={`shell-sidebar-mobile${mobileOpen ? ' open' : ''}`}>
        <SidebarNav isAdmin={isAdmin} onLinkClick={() => setMobileOpen(false)} />
      </aside>

      {/* Main column */}
      <div className="shell-main">
        <header className="shell-topbar">
          <button
            className="shell-hamburger"
            style={{ display: 'none' }}
            id="hamburger-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>

          <span className="shell-topbar-title">{pageTitle}</span>

          <div className="shell-topbar-right">
            <span className="shell-topbar-name">{profile?.full_name}</span>
            <div className="shell-topbar-avatar">
              {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </div>
          </div>
        </header>

        <main className="shell-content">
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 767px) {
          #hamburger-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
