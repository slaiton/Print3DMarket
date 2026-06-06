import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { AppShell } from './components/layout/AppShell';

import CatalogPage   from './pages/catalog/CatalogPage';
import LoginPage     from './pages/login/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage  from './pages/ProductsPage';
import SalesPage     from './pages/SalesPage';
import UsersPage     from './pages/UsersPage';
import RolesPage     from './pages/maestros/RolesPage';

// ── Loading screen ────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 32, height: 32,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── RequireAuth — cualquier usuario autenticado ───────────────
function RequireAuth() {
  const { profile, initialized } = useAuthStore();

  if (!initialized) return <LoadingScreen />;
  if (!profile)     return <Navigate to="/login" replace />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

// ── RequireAdmin — solo rol 'admin' ───────────────────────────
function RequireAdmin() {
  const { profile, initialized } = useAuthStore();
  if (!initialized) return <LoadingScreen />;
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const { init } = useAuthStore();
  useEffect(() => { init(); }, [init]);

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Públicas (sin sesión) ─────────────────────── */}
        <Route path="/"        element={<CatalogPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/login"   element={<LoginPage />} />

        {/* ── Autenticadas (admin + seller) ─────────────── */}
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products"  element={<ProductsPage />} />
          <Route path="/sales"     element={<SalesPage />} />

          {/* ── Solo admin ────────────────────────────────── */}
          <Route element={<RequireAdmin />}>
            {/* Alias de compatibilidad */}
            <Route path="/users" element={<Navigate to="/maestros/usuarios" replace />} />
            {/* Módulo Maestros */}
            <Route path="/maestros/usuarios" element={<UsersPage />} />
            <Route path="/maestros/roles"    element={<RolesPage />} />
          </Route>
        </Route>

        {/* ── Fallback ──────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
