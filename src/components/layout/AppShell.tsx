// src/components/layout/AppShell.tsx

import { ReactNode, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  BookOpen, LogOut, Menu, X, ChevronRight, Printer
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import './AppShell.css';

const navItems = [
  { to: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard, adminOnly: false },
  { to: '/products',  label: 'Productos',   icon: Package,         adminOnly: false },
  { to: '/sales',     label: 'Ventas',      icon: ShoppingCart,    adminOnly: false },
  { to: '/users',     label: 'Vendedores',  icon: Users,           adminOnly: true  },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/products':  'Productos',
  '/sales':     'Ventas',
  '/users':     'Vendedores',
  '/catalog':   'Catálogo',
};

function SidebarNav({ onLinkClick, isAdmin }: { onLinkClick?: () => void; isAdmin: boolean }) {
  const { profile, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const visible = navItems.filter(i => !i.adminOnly || isAdmin);

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

      {/* Nav */}
      <nav className="shell-nav">
        {visible.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onLinkClick}
            className={({ isActive }) =>
              `shell-nav-link${isActive ? ' active' : ''}`
            }
          >
            <item.icon size={17} />
            <span>{item.label}</span>
            <ChevronRight size={13} className="chevron" />
          </NavLink>
        ))}

        <div className="shell-nav-section">
          <NavLink
            to="/catalog"
            onClick={onLinkClick}
            className={({ isActive }) =>
              `shell-nav-link${isActive ? ' active' : ''}`
            }
          >
            <BookOpen size={17} />
            <span>Ver catálogo</span>
            <ChevronRight size={13} className="chevron" />
          </NavLink>
        </div>
      </nav>

      {/* User footer */}
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

export function AppShell({ children }: { children: ReactNode }) {
  const { profile } = useAuthStore();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin    = profile?.role === 'admin';
  const pageTitle  = PAGE_TITLES[location.pathname] ?? 'Print3D';

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
        {/* Topbar — visible en todos los tamaños */}
        <header className="shell-topbar">
          {/* Hamburger solo en mobile */}
          <button
            className="shell-hamburger"
            style={{ display: 'none' }}
            id="hamburger-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>

          {/* Título de página */}
          <span className="shell-topbar-title">{pageTitle}</span>

          {/* Usuario */}
          <div className="shell-topbar-right">
            <span className="shell-topbar-name">{profile?.full_name}</span>
            <div className="shell-topbar-avatar">
              {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="shell-content">
          {children}
        </main>
      </div>

      {/* Inline style para mostrar hamburger solo en mobile */}
      <style>{`
        @media (max-width: 767px) {
          #hamburger-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
