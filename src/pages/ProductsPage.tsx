// src/pages/ProductsPage.tsx
import { useState, useRef, FormEvent, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, ImagePlus, Package, Search } from 'lucide-react';
import { useMyProducts } from '../hooks/useMyProducts';
import { productService } from '../services/productService';
import { categoryService } from '../services/index';
import { useAuthStore } from '../store/useAuthStore';
import { Button, Input, Textarea, Select, Badge, Modal, Confirm, Empty } from '../components/ui';
import type { Product, CreateProductDTO } from '../types';
import type { Category } from '../types';
import './ProductsPage.css';

// ── Form modal ───────────────────────────────────────────────
function ProductModal({ open, onClose, product, onSaved }: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onSaved: () => void;
}) {
  const { profile } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CreateProductDTO & { id?: string }>({
    name: '', description: '', price: 0, cost: undefined,
    material: '', color: '', stock: 0, is_available: true,
    is_customizable: false, images: [], tags: [], category_id: '',
    print_time_hrs: undefined, weight_grams: undefined,
  });

  useEffect(() => {
    if (open) categoryService.getAll().then(setCategories);
  }, [open]);

  useEffect(() => {
    if (product) {
      setForm({
        id: product.id,
        name: product.name,
        description: product.description ?? '',
        price: product.price,
        cost: product.cost ?? undefined,
        material: product.material ?? '',
        color: product.color ?? '',
        stock: product.stock,
        is_available: product.is_available,
        is_customizable: product.is_customizable,
        images: product.images ?? [],
        tags: product.tags ?? [],
        category_id: product.category_id ?? '',
        print_time_hrs: product.print_time_hrs ?? undefined,
        weight_grams: product.weight_grams ?? undefined,
      });
    } else {
      setForm({
        name: '', description: '', price: 0, cost: undefined,
        material: '', color: '', stock: 0, is_available: true,
        is_customizable: false, images: [], tags: [], category_id: '',
        print_time_hrs: undefined, weight_grams: undefined,
      });
    }
    setErrors({});
  }, [product, open]);

  const set = (field: string, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name  = 'El nombre es requerido';
    if (form.price <= 0)   e.price = 'El precio debe ser mayor a 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingImg(true);
    try {
      const url = await productService.uploadImage(file, profile.id);
      set('images', [...(form.images ?? []), url]);
    } catch {
      alert('Error al subir imagen');
    } finally {
      setUploadingImg(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = (url: string) =>
    set('images', (form.images ?? []).filter(i => i !== url));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate() || !profile) return;
    setLoading(true);
    try {
      if (form.id) {
        await productService.update(form.id, form);
      } else {
        await productService.create(form, profile.id);
      }
      onSaved();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const materials = productService.getMaterials().map(m => ({ value: m, label: m }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={form.id ? 'Editar producto' : 'Nuevo producto'}
      size="lg"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Imágenes ── */}
        <div>
          <p className="pf-section-label">Imágenes del producto</p>
          <div className="pf-img-grid">
            {(form.images ?? []).map(url => (
              <div key={url} className="pf-img-thumb">
                <img src={url} alt="" />
                <button type="button" className="pf-img-remove" onClick={() => removeImage(url)}>
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="pf-img-add"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingImg}
            >
              {uploadingImg
                ? <span>Subiendo…</span>
                : <><ImagePlus size={20}/><span>Agregar</span></>
              }
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
          </div>
        </div>

        {/* ── Info básica ── */}
        <p className="pf-section-label">Información básica</p>
        <div className="pf-grid-2">
          <div className="pf-col-full">
            <Input
              label="Nombre del producto *"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              error={errors.name}
              placeholder="Ej: Maceta geométrica hexagonal"
            />
          </div>
          <Select
            label="Categoría"
            value={form.category_id ?? ''}
            onChange={e => set('category_id', e.target.value || undefined)}
            placeholder="Sin categoría"
            options={categories.map(c => ({ value: c.id, label: `${c.icon ?? ''} ${c.name}` }))}
          />
          <Select
            label="Material"
            value={form.material ?? ''}
            onChange={e => set('material', e.target.value || undefined)}
            placeholder="Seleccionar"
            options={materials}
          />
          <div className="pf-col-full">
            <Textarea
              label="Descripción"
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe el producto, dimensiones, usos..."
              rows={3}
            />
          </div>
        </div>

        {/* ── Precios y stock ── */}
        <p className="pf-section-label">Precio y stock</p>
        <div className="pf-grid-3">
          <Input
            label="Precio de venta *"
            type="number"
            value={form.price || ''}
            onChange={e => set('price', Number(e.target.value))}
            error={errors.price}
            placeholder="0"
          />
          <Input
            label="Costo producción"
            type="number"
            value={form.cost ?? ''}
            onChange={e => set('cost', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Solo tú lo ves"
            hint="Privado"
          />
          <Input
            label="Stock"
            type="number"
            value={form.stock ?? 0}
            onChange={e => set('stock', Number(e.target.value))}
            placeholder="0"
          />
        </div>

        {/* ── Detalles técnicos ── */}
        <p className="pf-section-label">Detalles técnicos</p>
        <div className="pf-grid-3">
          <Input
            label="Color"
            value={form.color ?? ''}
            onChange={e => set('color', e.target.value)}
            placeholder="Ej: Negro mate"
          />
          <Input
            label="Tiempo impresión (h)"
            type="number"
            step="0.5"
            value={form.print_time_hrs ?? ''}
            onChange={e => set('print_time_hrs', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="3.5"
          />
          <Input
            label="Peso (gramos)"
            type="number"
            value={form.weight_grams ?? ''}
            onChange={e => set('weight_grams', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="85"
          />
        </div>

        {/* ── Opciones ── */}
        <div className="pf-toggle-row">
          {[
            { field: 'is_available',    label: 'Disponible en catálogo' },
            { field: 'is_customizable', label: 'Acepta personalización' },
          ].map(({ field, label }) => (
            <label key={field} className="pf-toggle">
              <input
                type="checkbox"
                checked={Boolean(form[field as keyof typeof form])}
                onChange={e => set(field, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>

        {/* ── Acciones ── */}
        <div className="pf-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>
            {form.id ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function ProductsPage() {
  const { products, loading, reload } = useMyProducts();
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState<Product | null>(null);
  const [deleting, setDeleting]       = useState<Product | null>(null);
  const [delLoading, setDelLoading]   = useState(false);
  const [search, setSearch]           = useState('');

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openNew  = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setModalOpen(true); };

  const handleDelete = async () => {
    if (!deleting) return;
    setDelLoading(true);
    try {
      await productService.delete(deleting.id);
      setDeleting(null);
      reload();
    } finally {
      setDelLoading(false);
    }
  };

  const toggleAvail = async (p: Product) => {
    await productService.toggleAvailability(p.id, !p.is_available);
    reload();
  };

  return (
    <div className="products-page">
      {/* Header */}
      <div className="products-header">
        <div className="products-header-left">
          <h1 className="products-title">
            <div className="products-title-icon"><Package size={20}/></div>
            Productos
          </h1>
          <p className="products-subtitle">
            {products.length} producto{products.length !== 1 ? 's' : ''} en tu catálogo
          </p>
        </div>
        <Button icon={<Plus size={16}/>} onClick={openNew}>Nuevo producto</Button>
      </div>

      {/* Toolbar */}
      <div className="products-toolbar">
        <div className="products-search">
          <Search size={14} className="products-search-icon"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="products-loading">
          {[...Array(5)].map((_, i) => <div key={i} className="products-skeleton"/>)}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <Empty
          icon={<Package/>}
          title="Sin productos"
          sub="Agrega tu primer producto al catálogo"
          action={<Button onClick={openNew} icon={<Plus size={14}/>}>Agregar producto</Button>}
        />
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="products-table-wrap">
          <table className="products-table">
            <thead>
              <tr>
                {['Producto', 'Precio', 'Stock', 'Estado', 'Acciones'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="pt-thumb">
                      {p.images[0] ? (
                        <img src={p.images[0]} alt="" className="pt-thumb img"/>
                      ) : (
                        <div className="pt-thumb-placeholder">
                          <Package size={16}/>
                        </div>
                      )}
                      <div>
                        <p className="pt-name">{p.name}</p>
                        <p className="pt-meta">{p.material ?? '—'} · {p.color ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="pt-price">{productService.formatPrice(p.price)}</td>
                  <td>
                    <Badge color={p.stock > 0 ? 'green' : 'red'}>{p.stock} uds</Badge>
                  </td>
                  <td>
                    <Badge color={p.is_available ? 'green' : 'gray'}>
                      {p.is_available ? 'Disponible' : 'Oculto'}
                    </Badge>
                  </td>
                  <td>
                    <div className="pt-actions">
                      <button
                        className="pt-btn"
                        onClick={() => toggleAvail(p)}
                        title={p.is_available ? 'Ocultar del catálogo' : 'Mostrar en catálogo'}
                      >
                        {p.is_available ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                      <button className="pt-btn edit" onClick={() => openEdit(p)}>
                        <Pencil size={15}/>
                      </button>
                      <button className="pt-btn del" onClick={() => setDeleting(p)}>
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editing}
        onSaved={reload}
      />

      <Confirm
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={delLoading}
        title="Eliminar producto"
        message={`¿Eliminar "${deleting?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
