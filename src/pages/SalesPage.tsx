// src/pages/SalesPage.tsx
import { useState, useEffect, FormEvent } from 'react';
import { Plus, ShoppingCart, Search, ChevronDown, ChevronUp, Trash2, Pencil } from 'lucide-react';
import { saleService } from '../services/index';
import { productService } from '../services/productService';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Button, Badge, Modal, Select, Empty, Input, Textarea } from '../components/ui';
import type { Sale, SaleStatus, Product, Profile } from '../types';
import './SalesPage.css';

type SellerOption = Pick<Profile, 'id' | 'full_name'>;

const STATUS_COLOR: Record<SaleStatus, 'gray'|'blue'|'amber'|'purple'|'green'|'red'> = {
  pending: 'amber', confirmed: 'blue', printing: 'purple',
  ready: 'green', delivered: 'gray', cancelled: 'red',
};

const ALL_STATUSES: SaleStatus[] = [
  'pending','confirmed','printing','ready','delivered','cancelled',
];

// ── Helpers ───────────────────────────────────────────────────
async function fetchSellers(): Promise<SellerOption[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('is_active', true)
    .order('full_name');
  return (data ?? []) as SellerOption[];
}

// ── Sale row (expandible) ────────────────────────────────────
function SaleRow({
  sale, onStatusChange, onEdit,
}: {
  sale: Sale;
  onStatusChange: () => void;
  onEdit: (sale: Sale) => void;
}) {
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
      <tr onClick={() => setExpanded(!expanded)}>
        <td>
          <p className="sale-customer">{sale.customer?.name ?? 'Cliente directo'}</p>
          <p className="sale-phone">{sale.customer?.phone ?? '—'}</p>
        </td>
        <td>
          <div className="sale-seller-cell">
            <div className="sale-seller-avatar">
              {(sale.seller?.full_name ?? '?').charAt(0).toUpperCase()}
            </div>
            <span className="sale-seller-name">
              {sale.seller?.full_name ?? '—'}
            </span>
          </div>
        </td>
        <td className="sale-date">
          {new Date(sale.created_at).toLocaleDateString('es-CO')}
        </td>
        <td>
          <Badge color={STATUS_COLOR[sale.status]}>
            {saleService.getStatusLabel(sale.status)}
          </Badge>
        </td>
        <td className="sale-total">{fmt(sale.total_amount)}</td>
        <td>
          <div className="sale-row-actions" onClick={e => e.stopPropagation()}>
            <button
              className="sale-edit-btn"
              onClick={() => onEdit(sale)}
              title="Editar venta"
            >
              <Pencil size={14}/>
            </button>
            <span className="sale-chevron">
              {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </span>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="sale-detail-row">
          <td colSpan={6}>
            <div className="sale-detail-inner">
              {/* Items */}
              <div>
                <p className="sale-detail-label">Productos</p>
                {(sale.items ?? []).map(item => (
                  <div key={item.id} className="sale-item-line">
                    <span className="sale-item-name">
                      {item.quantity}× {item.product_name}
                      {item.customization && (
                        <span className="sale-item-custom">({item.customization})</span>
                      )}
                    </span>
                    <span className="sale-item-price">{fmt(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {sale.notes && (
                <p className="sale-notes">Nota: {sale.notes}</p>
              )}

              {/* Change status */}
              <div className="status-actions">
                <span className="status-label">Cambiar estado:</span>
                {ALL_STATUSES.filter(s => s !== sale.status).map(s => (
                  <button
                    key={s}
                    className="status-btn"
                    disabled={saving}
                    onClick={e => { e.stopPropagation(); handleStatus(s); }}
                  >
                    {saleService.getStatusLabel(s)}
                  </button>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Edit Sale Modal ───────────────────────────────────────────
function EditSaleModal({ open, onClose, sale, sellers, onSaved }: {
  open: boolean;
  onClose: () => void;
  sale: Sale | null;
  sellers: SellerOption[];
  onSaved: () => void;
}) {
  const [sellerId, setSellerId] = useState('');
  const [status,   setStatus]   = useState<SaleStatus>('pending');
  const [notes,    setNotes]    = useState('');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (sale) {
      setSellerId(sale.seller_id);
      setStatus(sale.status);
      setNotes(sale.notes ?? '');
    }
  }, [sale]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sale) return;
    setLoading(true);
    try {
      await saleService.updateSale(sale.id, {
        seller_id: sellerId,
        status,
        notes: notes || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const sellerOptions = sellers.map(s => ({ value: s.id, label: s.full_name }));
  const statusOptions = ALL_STATUSES.map(s => ({
    value: s,
    label: saleService.getStatusLabel(s),
  }));

  return (
    <Modal open={open} onClose={onClose} title="Editar venta" size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          label="Vendedor responsable"
          value={sellerId}
          onChange={e => setSellerId(e.target.value)}
          options={sellerOptions}
          placeholder="Seleccionar vendedor"
        />
        <Select
          label="Estado"
          value={status}
          onChange={e => setStatus(e.target.value as SaleStatus)}
          options={statusOptions}
        />
        <Textarea
          label="Notas"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Instrucciones, dirección de entrega..."
          rows={3}
        />
        <div className="sf-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>Guardar cambios</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── New Sale Modal ────────────────────────────────────────────
function NewSaleModal({ open, onClose, onSaved, sellers }: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  sellers: SellerOption[];
}) {
  const { profile }             = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(false);
  const [sellerId, setSellerId] = useState(profile?.id ?? '');
  const [customerName, setCN]   = useState('');
  const [customerPhone, setCP]  = useState('');
  const [notes, setNotes]       = useState('');
  const [items, setItems]       = useState([
    { product_id: '', product_name: '', unit_price: 0, quantity: 1, customization: '' },
  ]);

  useEffect(() => {
    if (open) {
      setSellerId(profile?.id ?? '');
      productService.getMyProducts().then(setProducts);
    }
  }, [open, profile]);

  const addItem = () => setItems(prev => [
    ...prev,
    { product_id: '', product_name: '', unit_price: 0, quantity: 1, customization: '' },
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
        seller_id:   sellerId || profile.id,
        customer_id: customerId,
        notes:       notes || undefined,
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
      setCN(''); setCP(''); setNotes('');
      setSellerId(profile.id);
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

  const sellerOptions = sellers.map(s => ({ value: s.id, label: s.full_name }));

  return (
    <Modal open={open} onClose={onClose} title="Registrar venta" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* ── Vendedor ── */}
        <p className="sf-section-label">Vendedor responsable</p>
        <Select
          label="Vendedor"
          value={sellerId}
          onChange={e => setSellerId(e.target.value)}
          options={sellerOptions}
          placeholder="Seleccionar vendedor"
        />

        {/* ── Cliente ── */}
        <p className="sf-section-label">Datos del cliente</p>
        <div className="sf-grid-2">
          <Input label="Nombre del cliente" value={customerName}
            onChange={e => setCN(e.target.value)} placeholder="Opcional" />
          <Input label="Teléfono" value={customerPhone}
            onChange={e => setCP(e.target.value)} placeholder="300..." />
        </div>

        {/* ── Items ── */}
        <div className="sf-items-header">
          <p className="sf-section-label" style={{ margin: 0 }}>Productos</p>
          <button type="button" className="sf-add-line" onClick={addItem}>
            <Plus size={13}/> Agregar línea
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, i) => (
            <div key={i} className="sf-item-row">
              <div className="sf-item-col">
                <Select
                  value={item.product_id}
                  onChange={e => selectProduct(i, e.target.value)}
                  options={productOptions}
                  placeholder="Seleccionar producto"
                />
                {!item.product_id && (
                  <input
                    className="sf-item-input"
                    value={item.product_name}
                    onChange={e => setItem(i, 'product_name', e.target.value)}
                    placeholder="Nombre del producto"
                  />
                )}
                <input
                  className="sf-item-input"
                  value={item.customization}
                  onChange={e => setItem(i, 'customization', e.target.value)}
                  placeholder="Personalización (opcional)"
                />
              </div>
              <input
                type="number"
                className="sf-item-input"
                value={item.unit_price || ''}
                onChange={e => setItem(i, 'unit_price', Number(e.target.value))}
                placeholder="Precio"
              />
              <input
                type="number"
                min={1}
                className="sf-item-input"
                value={item.quantity}
                onChange={e => setItem(i, 'quantity', Number(e.target.value))}
              />
              <button
                type="button"
                className="sf-item-remove"
                onClick={() => removeItem(i)}
                style={{ visibility: items.length > 1 ? 'visible' : 'hidden' }}
              >
                <Trash2 size={14}/>
              </button>
            </div>
          ))}
        </div>

        {/* ── Total ── */}
        <div className="sf-total-box">
          <span className="sf-total-label">Total estimado:</span>
          <span className="sf-total-value">{fmt(total)}</span>
        </div>

        {/* ── Notas ── */}
        <Textarea label="Notas adicionales" value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Instrucciones especiales, dirección de entrega..." />

        <div className="sf-actions">
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
  const [sellers, setSellers]     = useState<SellerOption[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState<SaleStatus | ''>('');
  const [newOpen, setNewOpen]     = useState(false);
  const [editSale, setEditSale]   = useState<Sale | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await saleService.getMySales();
    setSales(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    fetchSellers().then(setSellers);
  }, []);

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
    <div className="sales-page">
      {/* Header */}
      <div className="sales-header">
        <div>
          <h1 className="sales-title">
            <div className="sales-title-icon"><ShoppingCart size={20}/></div>
            Ventas
          </h1>
          <p className="sales-subtitle">
            {sales.length} venta{sales.length !== 1 ? 's' : ''} registradas
          </p>
        </div>
        <Button icon={<Plus size={16}/>} onClick={() => setNewOpen(true)}>
          Registrar venta
        </Button>
      </div>

      {/* Toolbar */}
      <div className="sales-toolbar">
        <div className="sales-search">
          <Search size={14} className="sales-search-icon"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
          />
        </div>
        <select
          className="sales-status-filter"
          value={statusFilter}
          onChange={e => setStatus(e.target.value as SaleStatus | '')}
        >
          {statusOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="sales-loading">
          {[...Array(5)].map((_, i) => <div key={i} className="sales-skeleton"/>)}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <Empty
          icon={<ShoppingCart/>}
          title="Sin ventas"
          sub="Registra tu primera venta"
          action={
            <Button onClick={() => setNewOpen(true)} icon={<Plus size={14}/>}>
              Registrar venta
            </Button>
          }
        />
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="sales-table-wrap">
          <table className="sales-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Vendedor</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sale => (
                <SaleRow
                  key={sale.id}
                  sale={sale}
                  onStatusChange={load}
                  onEdit={setEditSale}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewSaleModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onSaved={load}
        sellers={sellers}
      />

      <EditSaleModal
        open={Boolean(editSale)}
        onClose={() => setEditSale(null)}
        sale={editSale}
        sellers={sellers}
        onSaved={() => { load(); setEditSale(null); }}
      />
    </div>
  );
}
