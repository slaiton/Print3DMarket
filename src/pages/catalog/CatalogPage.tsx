import { useState } from 'react';
import {
  Search, SlidersHorizontal, X, ChevronDown, Layers, Zap, Tag,
  Clock, Weight, ChevronLeft, ChevronRight, MessageCircle,
  CheckCircle, AlertCircle, Sparkles
} from 'lucide-react';
import { useCatalog } from '../../hooks/useCatalog';
import { productService } from '../../services/productService';
import type { Product } from '../../types';
import './CatalogPage.css';

// ── WhatsApp helper ───────────────────────────────────────────
const WA_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER ?? '').replace(/\D/g, '');

function openWhatsApp(product: Product) {
  const price = productService.formatPrice(product.price);
  const msg = `Hola! Me interesa el producto: *${product.name}* — ${price}. ¿Tienen disponibilidad?`;
  const url = WA_NUMBER
    ? `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ── Product Drawer ────────────────────────────────────────────
function ProductDrawer({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = product?.images ?? [];

  if (!product) return null;

  const prev = () => setImgIdx(i => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setImgIdx(i => (i === images.length - 1 ? 0 : i + 1));

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer-panel">
        <button className="drawer-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>

        <div className="drawer-gallery">
          {images.length > 0 ? (
            <>
              <img
                key={imgIdx}
                src={images[imgIdx]}
                alt={product.name}
                className="drawer-main-img"
              />
              {images.length > 1 && (
                <>
                  <button className="gallery-nav left"  onClick={prev}><ChevronLeft  size={18}/></button>
                  <button className="gallery-nav right" onClick={next}><ChevronRight size={18}/></button>
                  <div className="gallery-dots">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        className={`gallery-dot${i === imgIdx ? ' active' : ''}`}
                        onClick={() => setImgIdx(i)}
                      />
                    ))}
                  </div>
                  <div className="gallery-thumbs">
                    {images.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className={`gallery-thumb${i === imgIdx ? ' active' : ''}`}
                        onClick={() => setImgIdx(i)}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="drawer-gallery-placeholder">
              <span style={{ fontSize: 64, color: 'var(--border)' }}>◈</span>
            </div>
          )}
        </div>

        <div className="drawer-content">
          <div className="drawer-top-row">
            {product.category && (
              <span className="drawer-category">
                {product.category.icon} {product.category.name}
              </span>
            )}
            <div className="drawer-badges">
              {product.is_customizable && (
                <span className="drawer-badge custom">
                  <Sparkles size={11}/> A pedido
                </span>
              )}
              {product.stock > 0 ? (
                <span className="drawer-badge instock">
                  <CheckCircle size={11}/> En stock ({product.stock})
                </span>
              ) : (
                <span className="drawer-badge nostock">
                  <AlertCircle size={11}/> Sin stock
                </span>
              )}
            </div>
          </div>

          <h2 className="drawer-name">{product.name}</h2>
          <p className="drawer-price">{productService.formatPrice(product.price)}</p>

          {product.description && (
            <p className="drawer-desc">{product.description}</p>
          )}

          <div className="drawer-divider" />

          <p className="drawer-section-title">Especificaciones</p>
          <div className="drawer-specs">
            {product.material && (
              <div className="spec-item">
                <div className="spec-icon"><Layers size={15}/></div>
                <div>
                  <p className="spec-label">Material</p>
                  <p className="spec-value">{product.material}</p>
                </div>
              </div>
            )}
            {product.color && (
              <div className="spec-item">
                <div className="spec-icon"><Tag size={15}/></div>
                <div>
                  <p className="spec-label">Color</p>
                  <p className="spec-value">{product.color}</p>
                </div>
              </div>
            )}
            {product.print_time_hrs != null && (
              <div className="spec-item">
                <div className="spec-icon"><Clock size={15}/></div>
                <div>
                  <p className="spec-label">Tiempo impresión</p>
                  <p className="spec-value">{product.print_time_hrs} horas</p>
                </div>
              </div>
            )}
            {product.weight_grams != null && (
              <div className="spec-item">
                <div className="spec-icon"><Weight size={15}/></div>
                <div>
                  <p className="spec-label">Peso</p>
                  <p className="spec-value">{product.weight_grams} g</p>
                </div>
              </div>
            )}
            {product.print_time_hrs == null && product.weight_grams == null &&
             !product.material && !product.color && (
              <p style={{ fontSize: 13, color: 'var(--fg-muted)', gridColumn: '1/-1' }}>
                Sin especificaciones adicionales.
              </p>
            )}
          </div>

          {product.seller && (
            <>
              <div className="drawer-divider" />
              <div className="drawer-seller">
                <div className="seller-avatar">{product.seller.full_name.charAt(0)}</div>
                <div>
                  <p className="seller-label">Vendedor</p>
                  <p className="seller-name">{product.seller.full_name}</p>
                </div>
              </div>
            </>
          )}

          <button className="drawer-cta" onClick={() => openWhatsApp(product)}>
            <MessageCircle size={19}/>
            Consultar por WhatsApp
          </button>

          {!WA_NUMBER && (
            <p className="drawer-wa-warn">
              ⚠️ Configura <code>VITE_WHATSAPP_NUMBER</code> en el .env para habilitar el número de contacto.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}

// ── Product Card ──────────────────────────────────────────────
function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);
  const image = product.images[0] ?? null;

  return (
    <article
      className="product-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      <div className="card-image-wrap">
        {image && !imgError ? (
          <img
            src={image}
            alt={product.name}
            onError={() => setImgError(true)}
            className="card-image"
          />
        ) : (
          <div className="card-image-placeholder">
            <span className="placeholder-icon">◈</span>
          </div>
        )}
        {product.is_customizable && <span className="badge badge-custom">A pedido</span>}
        {product.stock === 0       && <span className="badge badge-stock">Sin stock</span>}
        <div className="card-hover-overlay">
          <span className="card-hover-label">Ver detalle</span>
        </div>
      </div>

      <div className="card-body">
        {product.category && (
          <p className="card-category">{product.category.icon} {product.category.name}</p>
        )}
        <h3 className="card-title">{product.name}</h3>
        {product.description && (
          <p className="card-desc">{product.description}</p>
        )}
        <div className="card-meta">
          {product.material && (
            <span className="meta-pill"><Layers size={11} /> {product.material}</span>
          )}
          {product.color && (
            <span className="meta-pill"><Tag size={11} /> {product.color}</span>
          )}
          {product.print_time_hrs && (
            <span className="meta-pill"><Zap size={11} /> {product.print_time_hrs}h</span>
          )}
        </div>
        <div className="card-footer">
          <p className="card-price">{productService.formatPrice(product.price)}</p>
          <button
            className="btn-contact"
            onClick={e => { e.stopPropagation(); openWhatsApp(product); }}
          >
            Consultar
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Filter Bar ────────────────────────────────────────────────
function FilterBar({ catalog }: { catalog: ReturnType<typeof useCatalog> }) {
  const { filters, categories, updateFilters, clearFilters } = catalog;
  const [open, setOpen] = useState(false);
  const materials = productService.getMaterials();
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="filter-bar">
      <div className="search-wrap">
        <Search size={16} className="search-icon" />
        <input
          className="search-input"
          placeholder="Buscar productos..."
          value={filters.search ?? ''}
          onChange={e => updateFilters({ search: e.target.value || undefined })}
        />
        {filters.search && (
          <button className="clear-btn" onClick={() => updateFilters({ search: undefined })}>
            <X size={14} />
          </button>
        )}
      </div>

      <div className="cats-scroll">
        <button
          className={`cat-chip${!filters.category_id ? ' active' : ''}`}
          onClick={() => updateFilters({ category_id: undefined })}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`cat-chip${filters.category_id === cat.id ? ' active' : ''}`}
            onClick={() => updateFilters({ category_id: cat.id })}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      <div className="advanced-wrap">
        <button className="filter-toggle" onClick={() => setOpen(!open)}>
          <SlidersHorizontal size={15} />
          Filtros {activeCount > 1 && <span className="filter-count">{activeCount - 1}</span>}
          <ChevronDown size={14} className={open ? 'rotate' : ''} />
        </button>

        {open && (
          <div className="filter-panel">
            <div className="filter-row">
              <label className="filter-label">Material</label>
              <select
                className="filter-select"
                value={filters.material ?? ''}
                onChange={e => updateFilters({ material: e.target.value || undefined })}
              >
                <option value="">Todos</option>
                {materials.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="filter-row">
              <label className="filter-label">Precio mín.</label>
              <input
                type="number"
                className="filter-input"
                placeholder="0"
                value={filters.min_price ?? ''}
                onChange={e => updateFilters({ min_price: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="filter-row">
              <label className="filter-label">Precio máx.</label>
              <input
                type="number"
                className="filter-input"
                placeholder="∞"
                value={filters.max_price ?? ''}
                onChange={e => updateFilters({ max_price: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="filter-row">
              <label className="filter-label">Personalizable</label>
              <input
                type="checkbox"
                className="filter-check"
                checked={filters.is_customizable ?? false}
                onChange={e => updateFilters({ is_customizable: e.target.checked || undefined })}
              />
            </div>
            {activeCount > 0 && (
              <button className="clear-all" onClick={clearFilters}>
                <X size={13} /> Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function CatalogPage() {
  const catalog = useCatalog();
  const { products, loading, error } = catalog;
  const [selected, setSelected] = useState<Product | null>(null);

  return (
    <div className="catalog-root">
      <header className="catalog-header">
        <p className="header-label">Catálogo 3D</p>
        <h1 className="header-title">Impresiones 3D<br />a tu medida</h1>
        <p className="header-sub">Explora nuestro catálogo. Personaliza, ordena y recibe.</p>
      </header>

      <FilterBar catalog={catalog} />

      <main className="catalog-content">
        <div className="results-meta">
          <p className="results-count">
            {loading ? 'Cargando...' : (
              <><strong>{products.length}</strong> {products.length === 1 ? 'producto' : 'productos'}</>
            )}
          </p>
        </div>

        {loading && (
          <div className="skeleton-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-img" />
                <div className="skeleton-body">
                  <div className="skeleton-line" style={{ width: '40%' }} />
                  <div className="skeleton-line" style={{ width: '80%' }} />
                  <div className="skeleton-line" style={{ width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="state-wrap">
            <p className="state-icon">⚠️</p>
            <p className="state-title">Error al cargar</p>
            <p className="state-sub">{error}</p>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="state-wrap">
            <p className="state-icon">◈</p>
            <p className="state-title">Sin resultados</p>
            <p className="state-sub">Intenta con otros filtros o términos de búsqueda.</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="products-grid">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelected(product)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="catalog-footer">
        Impresiones 3D · Hecho con ♥ · {new Date().getFullYear()}
      </footer>

      {selected && (
        <ProductDrawer product={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
