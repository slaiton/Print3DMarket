// src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, DollarSign, Users, TrendingUp, ArrowRight, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { StatCard, Card, Badge } from '../components/ui';
import { productService } from '../services/productService';
import { saleService } from '../services/index';
import type { SaleStatus } from '../types';

const STATUS_COLOR: Record<SaleStatus, 'gray'|'blue'|'amber'|'purple'|'green'|'red'> = {
  pending:   'amber',
  confirmed: 'blue',
  printing:  'purple',
  ready:     'green',
  delivered: 'gray',
  cancelled: 'red',
};

export default function DashboardPage() {
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (isAdmin) {
          const { data } = await supabase.rpc('get_dashboard_stats');
          if (data) setStats(data);
        } else if (profile?.id) {
          const { data } = await supabase.rpc('get_seller_stats', { p_seller_id: profile.id });
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
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fg">
          {greeting}, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-fg-muted mt-1">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-surface border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {isAdmin ? (
            <>
              <StatCard label="Productos" value={stats.total_products ?? 0}
                sub={`${stats.available_products ?? 0} disponibles`}
                icon={<Package size={18}/>} color="blue"/>
              <StatCard label="Ventas totales" value={stats.total_sales ?? 0}
                sub={`${stats.sales_this_month ?? 0} este mes`}
                icon={<ShoppingCart size={18}/>} color="purple"/>
              <StatCard label="Ingresos totales" value={fmt(stats.revenue_total ?? 0)}
                sub="Ventas no canceladas"
                icon={<DollarSign size={18}/>} color="green"/>
              <StatCard label="Vendedores activos" value={stats.total_sellers ?? 0}
                sub={`${stats.total_customers ?? 0} clientes`}
                icon={<Users size={18}/>} color="amber"/>
            </>
          ) : (
            <>
              <StatCard label="Mis productos" value={stats.my_products ?? 0}
                icon={<Package size={18}/>} color="blue"/>
              <StatCard label="Mis ventas" value={stats.my_sales ?? 0}
                icon={<ShoppingCart size={18}/>} color="purple"/>
              <StatCard label="Mis ingresos" value={fmt(stats.my_revenue ?? 0)}
                sub="Total acumulado"
                icon={<DollarSign size={18}/>} color="green"/>
              <StatCard label="Este mes" value={fmt(stats.my_revenue_this_month ?? 0)}
                sub={`${stats.pending_sales ?? 0} pendientes`}
                icon={<TrendingUp size={18}/>} color="amber"/>
            </>
          )}
        </div>
      )}

      {/* Content grid */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Recent sales */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-fg flex items-center gap-2">
              <Clock size={16} className="text-fg-muted" /> Ventas recientes
            </h2>
            <Link to="/sales" className="text-xs text-accent hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={12}/>
            </Link>
          </div>
          {recentSales.length === 0 ? (
            <p className="text-sm text-fg-muted py-4 text-center">Sin ventas aún</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentSales.map(sale => (
                <div key={sale.id} className="flex items-center justify-between py-2
                                              border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-fg">
                      {sale.customer?.name ?? 'Cliente directo'}
                    </p>
                    <p className="text-xs text-fg-muted">
                      {new Date(sale.created_at).toLocaleDateString('es-CO')}
                      {' · '}{sale.items?.length ?? 0} item(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={STATUS_COLOR[sale.status as SaleStatus]}>
                      {saleService.getStatusLabel(sale.status)}
                    </Badge>
                    <span className="text-sm font-bold text-fg">
                      {fmt(sale.total_amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick actions */}
        <Card>
          <h2 className="font-bold text-fg mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/products/new', label: 'Nuevo producto', icon: Package,      color: 'bg-blue-50   text-blue-600' },
              { to: '/sales/new',    label: 'Registrar venta', icon: ShoppingCart, color: 'bg-green-50  text-green-600' },
              { to: '/products',     label: 'Ver catálogo',    icon: Package,      color: 'bg-purple-50 text-purple-600' },
              { to: '/sales',        label: 'Ver ventas',      icon: TrendingUp,   color: 'bg-amber-50  text-amber-600' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center gap-2 p-4 rounded-xl
                           border border-border hover:border-accent/40
                           hover:bg-bg transition-all group"
              >
                <div className={`p-2.5 rounded-lg ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <span className="text-xs font-medium text-fg text-center leading-tight">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
