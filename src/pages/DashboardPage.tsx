// src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, DollarSign, Users, TrendingUp, ArrowRight, Clock, Percent } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Badge } from '../components/ui';
import { productService } from '../services/productService';
import { saleService } from '../services/index';
import type { SaleStatus } from '../types';
import './DashboardPage.css';
import DashboardHeader from './DashboardHeader';

const STATUS_COLOR: Record<SaleStatus, 'gray' | 'blue' | 'amber' | 'purple' | 'green' | 'red'> = {
  pending: 'amber',
  confirmed: 'blue',
  printing: 'purple',
  ready: 'green',
  delivered: 'gray',
  cancelled: 'red',
};

export default function DashboardPage() {
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';
  const [stats, setStats]               = useState<Record<string, number>>({});
  const [recentSales, setRecentSales]   = useState<any[]>([]);
  const [commissions, setCommissions]   = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (isAdmin) {
          const [{ data: s }, { data: c }] = await Promise.all([
            supabase.rpc('get_dashboard_stats'),
            supabase.rpc('get_seller_commissions'),
          ]);
          if (s) setStats(s);
          if (c) setCommissions(c);
        } else if (profile?.id) {
          const { data } = await supabase.rpc('get_seller_stats', { seller_id: profile.id });
          if (data) setStats(data);
        }

        // Últimas ventas
        const sales = await saleService.getMySales();
        setRecentSales(sales.slice(0, 5));
      } finally {
        setLoading(false);
      }
    }
    if (profile) load();
  }, [profile, isAdmin]);

  const fmt = (n: number) => productService.formatPrice(n);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Header */}
        <DashboardHeader
          greeting={greeting}
          fullName={profile?.full_name}
        />
        {/* Stats grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-surface border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
<div className="stats-grid">

  {isAdmin ? (
    <>
      <div className="stat-box">
        <div className="stat-icon blue">
          <Package size={22} />
        </div>

        <div className="stat-label">
          Productos
        </div>

        <div className="stat-value">
          {stats.total_products ?? 0}
        </div>

        <div className="stat-sub">
          {stats.available_products ?? 0} disponibles
        </div>
      </div>

      <div className="stat-box">
        <div className="stat-icon purple">
          <ShoppingCart size={22} />
        </div>

        <div className="stat-label">
          Ventas Totales
        </div>

        <div className="stat-value">
          {stats.total_sales ?? 0}
        </div>

        <div className="stat-sub">
          {stats.sales_this_month ?? 0} este mes
        </div>
      </div>

      <div className="stat-box">
        <div className="stat-icon green">
          <DollarSign size={22} />
        </div>

        <div className="stat-label">
          Ingresos Totales
        </div>

        <div className="stat-value">
          {fmt(stats.revenue_total ?? 0)}
        </div>

        <div className="stat-sub">
          Ventas no canceladas
        </div>
      </div>

      <div className="stat-box">
        <div className="stat-icon orange">
          <Users size={22} />
        </div>

        <div className="stat-label">
          Vendedores
        </div>

        <div className="stat-value">
          {stats.total_sellers ?? 0}
        </div>

        <div className="stat-sub">
          {stats.total_customers ?? 0} clientes
        </div>
      </div>
    </>
  ) : (
    <>
      <div className="stat-box">
        <div className="stat-icon blue">
          <Package size={22} />
        </div>

        <div className="stat-label">
          Mis Productos
        </div>

        <div className="stat-value">
          {stats.my_products ?? 0}
        </div>

        <div className="stat-sub">
          Catálogo activo
        </div>
      </div>

      <div className="stat-box">
        <div className="stat-icon purple">
          <ShoppingCart size={22} />
        </div>

        <div className="stat-label">
          Mis Ventas
        </div>

        <div className="stat-value">
          {stats.my_sales ?? 0}
        </div>

        <div className="stat-sub">
          Ventas registradas
        </div>
      </div>

      <div className="stat-box">
        <div className="stat-icon green">
          <DollarSign size={22} />
        </div>

        <div className="stat-label">
          Mis Ingresos
        </div>

        <div className="stat-value">
          {fmt(stats.my_revenue ?? 0)}
        </div>

        <div className="stat-sub">
          Total acumulado
        </div>
      </div>

      <div className="stat-box">
        <div className="stat-icon orange">
          <TrendingUp size={22} />
        </div>

        <div className="stat-label">
          Este Mes
        </div>

        <div className="stat-value">
          {fmt(stats.my_revenue_this_month ?? 0)}
        </div>

        <div className="stat-sub">
          {stats.pending_sales ?? 0} pendientes
        </div>
      </div>

      <div className="stat-box stat-box--accent">
        <div className="stat-icon accent">
          <Percent size={22} />
        </div>

        <div className="stat-label">
          Mi Comisión
        </div>

        <div className="stat-value">
          {fmt(stats.my_commission ?? 0)}
        </div>

        <div className="stat-sub">
          {(stats.commission_pct ?? 0).toFixed(1)}% sobre ventas
        </div>
      </div>
    </>
  )}

</div>
        )}

        {/* Content grid */}
        <div className="content-grid">
          {/* Recent sales */}
          <div className="glass-card">
            <div className="dash-card-title">
              <h2 style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Clock size={16} style={{ opacity:.7 }} /> Ventas recientes
              </h2>
              <Link to="/sales" style={{ fontSize:'.8rem', color:'#60a5fa', display:'flex', alignItems:'center', gap:4, textDecoration:'none' }}>
                Ver todas <ArrowRight size={12} />
              </Link>
            </div>
            {recentSales.length === 0 ? (
              <p style={{ textAlign:'center', color:'rgba(255,255,255,.45)', fontSize:'.875rem', padding:'16px 0' }}>Sin ventas aún</p>
            ) : (
              <div className="sales-list">
                {recentSales.map(sale => (
                  <div key={sale.id} className="sale-item">
                    <div>
                      <p className="sale-name">{sale.customer?.name ?? 'Cliente directo'}</p>
                      <p className="sale-date">
                        {new Date(sale.created_at).toLocaleDateString('es-CO')}
                        {' · '}{sale.items?.length ?? 0} item(s)
                      </p>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Badge color={STATUS_COLOR[sale.status as SaleStatus]}>
                        {saleService.getStatusLabel(sale.status)}
                      </Badge>
                      <span className="sale-total">{fmt(sale.total_amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="glass-card">
            <div className="dash-card-title">
              <h2>Acciones rápidas</h2>
            </div>
            <div className="quick-grid">
              {(isAdmin ? [
                { to: '/products', label: 'Nuevo producto',   icon: Package,      color: 'quick-blue'   },
                { to: '/sales',    label: 'Registrar venta',  icon: ShoppingCart, color: 'quick-green'  },
                { to: '/products', label: 'Ver productos',    icon: Package,      color: 'quick-purple' },
                { to: '/sales',    label: 'Ver ventas',       icon: TrendingUp,   color: 'quick-orange' },
              ] : [
                { to: '/sales',    label: 'Registrar venta',  icon: ShoppingCart, color: 'quick-green'  },
                { to: '/sales',    label: 'Ver ventas',       icon: TrendingUp,   color: 'quick-orange' },
                { to: '/catalog',  label: 'Ver catálogo',     icon: Package,      color: 'quick-blue'   },
                { to: '/dashboard',label: 'Mi comisión',      icon: Percent,      color: 'quick-purple' },
              ]).map(item => (
                <Link key={item.label} to={item.to} className="quick-action">
                  <div className={`quick-icon ${item.color}`}>
                    <item.icon size={20} />
                  </div>
                  <span className="quick-label">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Tabla de comisiones — solo admin */}
        {isAdmin && !loading && commissions.length > 0 && (
          <div className="commission-card">
            <div className="commission-header">
              <h2 className="commission-title">
                <Percent size={16} />
                Comisiones por vendedor
              </h2>
            </div>
            <div className="commission-table-wrap">
              <table className="commission-table">
                <thead>
                  <tr>
                    <th>Vendedor</th>
                    <th>% Comisión</th>
                    <th>Ventas acumuladas</th>
                    <th>Comisión a pagar</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((row: any) => (
                    <tr key={row.id}>
                      <td>
                        <div className="comm-seller">
                          <div className="comm-avatar">
                            {row.full_name?.charAt(0).toUpperCase()}
                          </div>
                          {row.full_name}
                        </div>
                      </td>
                      <td>
                        <span className="comm-pct">{Number(row.commission_pct).toFixed(1)}%</span>
                      </td>
                      <td className="comm-amount">{fmt(row.revenue ?? 0)}</td>
                      <td className="comm-total">{fmt(row.commission ?? 0)}</td>
                      <td>
                        <span className={`comm-status ${row.is_active ? 'active' : 'inactive'}`}>
                          {row.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
