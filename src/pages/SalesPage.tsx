// src/pages/SalesPage.tsx
// Lista de ventas + modal registrar venta nueva

import { useState, useEffect, FormEvent } from 'react';
import { Plus, ShoppingCart, Search, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { saleService } from '../services/index';
import { productService } from '../services/productService';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Button, Badge, Modal, Select, Empty, Input, Textarea } from '../components/ui';
import type { Sale, SaleStatus, Product } from '../types';

const STATUS_COLOR: Record<SaleStatus, 'gray'|'blue'|'amber'|'purple'|'green'|'red'> = {
  pending: 'amber', confirmed: 'blue', printing: 'purple',
  ready: 'green', delivered: 'gray', cancelled: 'red',
};

const ALL_STATUSES: SaleStatus[] = ['pending','confirmed','printing','ready','delivered','cancelled'];

// ── Sale row (expandible) ────────────────────────────────────
function SaleRow({ sale, onStatusChange }: { sale: Sale; onStatusChange: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving]     = useState(false);
  const fmt = productService.formatPrice;

  const handleStatus = async (status: SaleStatus) => {
    setSaving(true);
    await saleService.updateStatus(sale.id, status);
    onStatusChange();
    setSaving(false);
  };

  return (
    <>
      <tr
        className="border-b border-border hover:bg-bg/50 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3">
          <div>
            <p className="font-medium text-fg text-sm">
              {sale.customer?.name ?? 'Cliente directo'}
            </p>
            <p className="text-xs text-fg-muted">{sale.customer?.phone ?? '—'}</p>
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-fg-muted">
          {new Date(sale.created_at).toLocaleDateString('es-CO')}
        </td>
        <td className="px-4 py-3">
          <Badge color={STATUS_COLOR[sale.status]}>
            {saleService.getStatusLabel(sale.status)}
          </Badge>
        </td>
        <td className="px-4 py-3 font-bold text-fg text-sm">
          {fmt(sale.total_amount)}
        </td>
        <td className="px-4 py-3 text-fg-muted">
          {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </td>
      </tr>

      {expanded && (
        <tr className="bg-bg/30">
          <td colSpan={5} className="px-4 py-3">
            <div className="flex flex-col gap-3">
              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-fg-muted uppercase mb-2">Productos</p>
                <div className="flex flex-col gap-1">
                  {(sale.items ?? []).map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-fg">
                        {item.quantity}× {item.product_name}
                        {item.customization && (
                          <span className="text-xs text-fg-muted ml-2">({item.customization})</span>
                        )}
                      </span>
                      <span className="font-medium text-fg">{fmt(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {sale.notes && (
                <p className="text-xs text-fg-muted border-t border-border pt-2">
                  Nota: {sale.notes}
                </p>
              )}

              {/* Change status */}
              <div className="flex items-center gap-2 border-t border-border pt-2">
                <span className="text-xs font-medium text-fg-muted">Cambiar estado:</span>
                <div className="flex flex-wrap gap-1">
                  {ALL_STATUSES.filter(s => s !== sale.status).map(s => (
                    <button
                      key={s}
                      disabled={saving}
                      onClick={e => { e.stopPropagation(); handleStatus(s); }}
                      className="px-2.5 py-1 text-xs border border-border rounded-lg
                                 hover:border-accent hover:text-accent transition-colors
                                 disabled:opacity-50"
                    >
                      → {saleService.getStatusLabel(s)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── New sale modal ───────────────────────────────────────────
function NewSaleModal({ open, onClose, onSaved }: {
  open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const { profile }             = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(false);
  const [customerName, setCN]   = useState('');
  const [customerPhone, setCP]  = useState('');
  const [notes, setNotes]       = useState('');
  const [items, setItems]       = useState([
    { product_id: '', product_name: '', unit_price: 0, quantity: 1, customization: '' }
  ]);

  useEffect(() => {
    if (open && profile) productService.getMyProducts().then(setProducts);
  }, [open, profile]);

  const addItem = () => setItems(prev => [
    ...prev,
    { product_id: '', product_name: '', unit_price: 0, quantity: 1, customization: '' }
  ]);

  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const setItem = (i: number, field: string, value: unknown) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const selectProduct = (i: number, productId: string) => {
    const p = products.find(pr => pr.id === productId);
    if (p) {
      setItem(i, 'product_id',   p.id);
      setItem(i, 'product_name', p.name);
      setItem(i, 'unit_price',   p.price);
    } else {
      setItem(i, 'product_id',   '');
      setItem(i, 'product_name', '');
      setItem(i, 'unit_price',   0);
    }
  };

  const total = items.reduce((sum, it) => sum + (it.unit_price * it.quantity), 0);
  const fmt   = productService.formatPrice;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (items.some(it => !it.product_name)) {
      alert('Todos los items deben tener nombre');
      return;
    }
    setLoading(true);
    try {
      // Crear cliente si se ingresó nombre
      let customerId: string | undefined;
      if (customerName.trim()) {
        const { data: cust } = await supabase
          .from('customers')
          .insert({ name: customerName, phone: customerPhone || null, created_by: profile.id })
          .select('id')
          .single();
        customerId = cust?.id;
      }

      await saleService.create({
        customer_id: customerId,
        notes: notes || undefined,
        items: items.map(it => ({
          product_id:    it.product_id || undefined,
          product_name:  it.product_name,
          unit_price:    it.unit_price,
          quantity:      it.quantity,
          customization: it.customization || undefined,
        })),
      }, profile.id);

      onSaved();
      onClose();
      // Reset
      setCN(''); setCP(''); setNotes('');
      setItems([{ product_id: '', product_name: '', unit_price: 0, quantity: 1, customization: '' }]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const productOptions = [
    { value: '', label: '— Producto libre —' },
    ...products.map(p => ({ value: p.id, label: `${p.name} (${fmt(p.price)})` })),
  ];

  return (
    <Modal open={open} onClose={onClose} title="Registrar venta" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Cliente */}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre del cliente" value={customerName}
            onChange={e => setCN(e.target.value)} placeholder="Opcional" />
          <Input label="Teléfono" value={customerPhone}
            onChange={e => setCP(e.target.value)} placeholder="300..." />
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-fg">Productos</p>
            <button type="button" onClick={addItem}
              className="text-xs text-accent flex items-center gap-1 hover:underline">
              <Plus size={12}/> Agregar línea
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {items.map((item, i) => (
              <div key={i} className="grid gap-2 p-3 bg-bg rounded-lg border border-border"
                style={{ gridTemplateColumns: '1fr 80px 70px auto' }}>

                <div className="flex flex-col gap-1">
                  <Select
                    value={item.product_id}
                    onChange={e => selectProduct(i, e.target.value)}
                    options={productOptions}
                    placeholder="Seleccionar producto"
                  />
                  {!item.product_id && (
                    <input
                      value={item.product_name}
                      onChange={e => setItem(i, 'product_name', e.target.value)}
                      placeholder="Nombre del producto"
                      className="px-2 py-1.5 text-xs border border-border rounded-lg
                                 bg-surface text-fg outline-none focus:border-accent"
                    />
                  )}
                  <input
                    value={item.customization}
                    onChange={e => setItem(i, 'customization', e.target.value)}
                    placeholder="Personalización (opcional)"
                    className="px-2 py-1.5 text-xs border border-border rounded-lg
                               bg-surface text-fg outline-none focus:border-accent"
                  />
                </div>

                <input
                  type="number"
                  value={item.unit_price || ''}
                  onChange={e => setItem(i, 'unit_price', Number(e.target.value))}
                  placeholder="Precio"
                  className="px-2 py-1.5 text-xs border border-border rounded-lg
                             bg-surface text-fg outline-none focus:border-accent"
                />
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={e => setItem(i, 'quantity', Number(e.target.value))}
                  className="px-2 py-1.5 text-xs border border-border rounded-lg
                             bg-surface text-fg outline-none focus:border-accent"
                />
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)}
                    className="p-1.5 text-fg-muted hover:text-red-500 transition-colors">
                    <Trash2 size={14}/>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-end">
          <div className="bg-bg border border-border rounded-lg px-4 py-2">
            <span className="text-xs text-fg-muted">Total: </span>
            <span className="text-base font-bold text-fg">{fmt(total)}</span>
          </div>
        </div>

        <Textarea label="Notas" value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Instrucciones especiales, dirección de entrega..." />

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>Registrar venta</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function SalesPage() {
  const [sales, setSales]         = useState<Sale[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState<SaleStatus | ''>('');
  const [modalOpen, setModal]     = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await saleService.getMySales();
    setSales(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = sales.filter(s => {
    const matchName   = !search || s.customer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchName && matchStatus;
  });

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    ...ALL_STATUSES.map(s => ({ value: s, label: saleService.getStatusLabel(s) })),
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-fg">Ventas</h1>
          <p className="text-sm text-fg-muted mt-0.5">{sales.length} en total</p>
        </div>
        <Button icon={<Plus size={16}/>} onClick={() => setModal(true)}>
          Registrar venta
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="pl-8 pr-3 py-2 text-sm border border-border rounded-lg bg-bg
                       text-fg outline-none focus:border-accent placeholder:text-fg-muted"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatus(e.target.value as SaleStatus | '')}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-bg
                     text-fg outline-none focus:border-accent"
        >
          {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-surface border border-border rounded-xl animate-pulse"/>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <Empty
          icon={<ShoppingCart/>}
          title="Sin ventas"
          sub="Registra tu primera venta"
          action={<Button onClick={() => setModal(true)} icon={<Plus size={14}/>}>Registrar venta</Button>}
        />
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg border-b border-border">
              <tr>
                {['Cliente', 'Fecha', 'Estado', 'Total', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs font-semibold
                                          text-fg-muted uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(sale => (
                <SaleRow key={sale.id} sale={sale} onStatusChange={load} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewSaleModal open={modalOpen} onClose={() => setModal(false)} onSaved={load}/>
    </div>
  );
}
