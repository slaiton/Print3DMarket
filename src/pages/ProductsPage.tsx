// src/pages/ProductsPage.tsx
// Lista de productos + modal crear/editar

import { useState, useRef, FormEvent } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, ImagePlus, Package } from 'lucide-react';
import { useMyProducts } from '../hooks/useMyProducts';
import { productService } from '../services/productService';
import { categoryService } from '../services/index';
import { useAuthStore } from '../store/useAuthStore';
import { Button, Input, Textarea, Select, Badge, Modal, Confirm, Empty } from '../components/ui';
import type { Product, CreateProductDTO } from '../types';
import { useEffect } from 'react';
import type { Category } from '../types';

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
    categoryService.getAll().then(setCategories);
  }, []);

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
      });
    }
    setErrors({});
  }, [product, open]);

  const set = (field: string, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())    e.name  = 'El nombre es requerido';
    if (form.price <= 0)      e.price = 'El precio debe ser mayor a 0';
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
    } catch (err) {
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Imágenes */}
        <div>
          <p className="text-sm font-medium text-fg mb-2">Imágenes</p>
          <div className="flex flex-wrap gap-2">
            {(form.images ?? []).map(url => (
              <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute top-0.5 right-0.5 bg-red-500 text-white
                             rounded-full p-0.5 hover:bg-red-600"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingImg}
              className="w-20 h-20 border-2 border-dashed border-border rounded-lg
                         flex flex-col items-center justify-center gap-1
                         text-fg-muted hover:border-accent hover:text-accent transition-colors"
            >
              {uploadingImg
                ? <span className="text-xs">Subiendo...</span>
                : <><ImagePlus size={18}/><span className="text-xs">Agregar</span></>
              }
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImage}
            />
          </div>
        </div>

        {/* Nombre + categoría */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
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
        </div>

        {/* Descripción */}
        <Textarea
          label="Descripción"
          value={form.description ?? ''}
          onChange={e => set('description', e.target.value)}
          placeholder="Describe el producto, dimensiones, usos..."
          rows={3}
        />

        {/* Precio + costo + stock */}
        <div className="grid grid-cols-3 gap-3">
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

        {/* Detalles técnicos */}
        <div className="grid grid-cols-3 gap-3">
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

        {/* Toggles */}
        <div className="flex gap-6">
          {[
            { field: 'is_available',    label: 'Disponible en catálogo' },
            { field: 'is_customizable', label: 'Acepta personalización' },
          ].map(({ field, label }) => (
            <label key={field} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(form[field as keyof typeof form])}
                onChange={e => set(field, e.target.checked)}
                className="w-4 h-4 accent-accent"
              />
              <span className="text-sm text-fg">{label}</span>
            </label>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
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

  const openNew  = () => { setEditing(null);    setModalOpen(true); };
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
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-fg">Productos</h1>
          <p className="text-sm text-fg-muted mt-0.5">{products.length} en total</p>
        </div>
        <Button icon={<Plus size={16}/>} onClick={openNew}>Nuevo producto</Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre..."
          className="w-full max-w-xs px-3 py-2 text-sm border border-border rounded-lg
                     bg-bg text-fg outline-none focus:border-accent placeholder:text-fg-muted"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-surface border border-border rounded-xl animate-pulse"/>
          ))}
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
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg border-b border-border">
              <tr>
                {['Producto', 'Precio', 'Stock', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold
                                         text-fg-muted uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0
                                           hover:bg-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images[0] ? (
                        <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0"/>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-bg border border-border
                                        flex items-center justify-center flex-shrink-0">
                          <Package size={16} className="text-fg-muted"/>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-fg">{p.name}</p>
                        <p className="text-xs text-fg-muted">{p.material ?? '—'} · {p.color ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-fg">
                    {productService.formatPrice(p.price)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={p.stock > 0 ? 'green' : 'red'}>{p.stock} uds</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={p.is_available ? 'green' : 'gray'}>
                      {p.is_available ? 'Disponible' : 'Oculto'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleAvail(p)}
                        title={p.is_available ? 'Ocultar del catálogo' : 'Mostrar en catálogo'}
                        className="p-1.5 rounded-lg hover:bg-bg text-fg-muted hover:text-fg transition-colors"
                      >
                        {p.is_available ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg hover:bg-bg text-fg-muted hover:text-accent transition-colors"
                      >
                        <Pencil size={15}/>
                      </button>
                      <button
                        onClick={() => setDeleting(p)}
                        className="p-1.5 rounded-lg hover:bg-bg text-fg-muted hover:text-red-500 transition-colors"
                      >
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
