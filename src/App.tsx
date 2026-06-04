// src/App.tsx — versión completa con rutas protegidas

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { AppShell } from './components/layout/AppShell';

import CatalogPage   from './pages/CatalogPage';
import LoginPage     from './pages/login/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage  from './pages/ProductsPage';
import SalesPage     from './pages/SalesPage';
import UsersPage     from './pages/UsersPage';

// ── Guard: requiere sesión activa ────────────────────────────
function RequireAuth() {
  const { profile, initialized } = useAuthStore();

  if (!initialized) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent
                        rounded-full animate-spin"/>
      </div>
    );
  }
  if (!profile) return <Navigate to="/login" replace />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

// ── Guard: solo admins ───────────────────────────────────────
function RequireAdmin() {
  const { profile } = useAuthStore();
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

// ── Tailwind CSS variables (global) ─────────────────────────
// Inyectadas como variables CSS para que los componentes las usen
const GlobalStyles = () => (
  <style>{`
    :root {
      --color-accent:       #e85d04;
      --color-accent-dark:  #cc5200;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
      background: #f7f5f0;
      color: #0f0f0f;
    }
    /* Tailwind-compatible CSS vars para el sistema de diseño */
    .bg-bg       { background-color: #f7f5f0; }
    .bg-surface  { background-color: #ffffff; }
    .text-fg     { color: #0f0f0f; }
    .text-fg-muted { color: #6b7280; }
    .border-border { border-color: #e5e7eb; }
    .accent { color: #e85d04; }
    .bg-accent { background-color: #e85d04; }
    .bg-accent-dark { background-color: #cc5200; }
    .focus\\:border-accent:focus { border-color: #e85d04; }
    .hover\\:border-accent:hover { border-color: #e85d04; }
    .hover\\:bg-accent:hover { background-color: #e85d04; }
    .hover\\:text-accent:hover { color: #e85d04; }
    .text-accent { color: #e85d04; }
    .border-accent { border-color: #e85d04; }
    .accent\\/10 { background-color: rgba(232,93,4,0.1); }
    .accent\\/40 { border-color: rgba(232,93,4,0.4); }

    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  `}</style>
);

export default function App() {
  const { init } = useAuthStore();
  useEffect(() => { init(); }, [init]);

  return (
    <>
      <GlobalStyles />
      <BrowserRouter>
        <Routes>
          {/* Público */}
          <Route path="/"        element={<CatalogPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/login"   element={<LoginPage />} />

          {/* Protegidas */}
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products"  element={<ProductsPage />} />
            <Route path="/sales"     element={<SalesPage />} />

            {/* Solo admin */}
            <Route element={<RequireAdmin />}>
              <Route path="/users" element={<UsersPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
