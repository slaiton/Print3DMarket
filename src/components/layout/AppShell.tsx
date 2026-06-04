// src/components/layout/AppShell.tsx
// Sidebar + topbar que envuelve todas las páginas protegidas

import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  BookOpen, LogOut, Menu, X, ChevronRight, Printer
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const navItems = [
  { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard, adminOnly: false },
  { to: '/products',   label: 'Productos',   icon: Package,         adminOnly: false },
  { to: '/sales',      label: 'Ventas',      icon: ShoppingCart,    adminOnly: false },
  { to: '/users',      label: 'Vendedores',  icon: Users,           adminOnly: true  },
];

function NavItem({ to, label, Icon, onClick }: {
  to: string; label: string; Icon: React.ElementType; onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
        ${isActive
          ? 'bg-accent text-white'
          : 'text-fg-muted hover:bg-bg hover:text-fg'
        }`
      }
    >
      <Icon size={18} />
      <span>{label}</span>
      <ChevronRight size={14} className="ml-auto opacity-40" />
    </NavLink>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const visibleItems = navItems.filter(
    item => !item.adminOnly || profile?.role === 'admin'
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-border">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
          <Printer size={16} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-sm text-fg leading-none">Print3D</p>
          <p className="text-xs text-fg-muted">Panel de ventas</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {visibleItems.map(item => (
          <NavItem
            key={item.to}
            to={item.to}
            label={item.label}
            Icon={item.icon}
            onClick={() => setMobileOpen(false)}
          />
        ))}

        <div className="mt-2 pt-2 border-t border-border">
          <NavItem
            to="/catalog"
            label="Ver catálogo"
            Icon={BookOpen}
            onClick={() => setMobileOpen(false)}
          />
        </div>
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center
                          text-xs font-bold text-accent">
            {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg truncate">{profile?.full_name}</p>
            <p className="text-xs text-fg-muted capitalize">{profile?.role}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                     text-fg-muted hover:bg-bg hover:text-red-500 transition-all"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-surface border-r border-border flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-surface border-r border-border
                         flex flex-col transition-transform md:hidden
                         ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar mobile */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3
                            bg-surface border-b border-border">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-fg-muted">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-bold text-sm text-fg">Print3D</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
