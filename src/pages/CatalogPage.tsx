// src/pages/CatalogPage.tsx
// Catálogo público — visible sin login

import { useState } from 'react';
import {
  Search, SlidersHorizontal, X, ChevronDown, Layers, Zap, Tag,
  Clock, Weight, ChevronLeft, ChevronRight, MessageCircle,
  CheckCircle, AlertCircle, Sparkles
} from 'lucide-react';
import { useCatalog } from '../hooks/useCatalog';
import { productService } from '../services/productService';
import type { Product } from '../types';

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
      {/* Overlay */}
      <div className="drawer-overlay" onClick={onClose} />

      {/* Panel */}
      <aside className="drawer-panel">
        {/* Close */}
        <button className="drawer-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>

        {/* Gallery */}
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
                  {/* Thumbnails */}
                  {images.length > 1 && (
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
                  )}
                </>
              )}
            </>
          ) : (
            <div className="drawer-gallery-placeholder">
              <span style={{ fontSize: 64, color: 'var(--border)' }}>◈</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="drawer-content">

          {/* Category + badges */}
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

          {/* Name */}
          <h2 className="drawer-name">{product.name}</h2>

          {/* Price */}
          <p className="drawer-price">{productService.formatPrice(product.price)}</p>

          {/* Description */}
          {product.description && (
            <p className="drawer-desc">{product.description}</p>
          )}

          {/* Divider */}
          <div className="drawer-divider" />

          {/* Specs grid */}
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

          {/* Seller */}
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

          {/* CTA */}
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

// ──────────────────────────────────────────────────────────────
// ProductCard
// ──────────────────────────────────────────────────────────────
function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);
  const image = product.images[0] ?? null;

  return (
    <article className="product-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
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

        {product.is_customizable && (
          <span className="badge badge-custom">A pedido</span>
        )}
        {product.stock === 0 && (
          <span className="badge badge-stock">Sin stock</span>
        )}

        {/* Hover overlay */}
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
            <span className="meta-pill">
              <Layers size={11} /> {product.material}
            </span>
          )}
          {product.color && (
            <span className="meta-pill">
              <Tag size={11} /> {product.color}
            </span>
          )}
          {product.print_time_hrs && (
            <span className="meta-pill">
              <Zap size={11} /> {product.print_time_hrs}h
            </span>
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

// ──────────────────────────────────────────────────────────────
// FilterBar
// ──────────────────────────────────────────────────────────────
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
          className={`cat-chip ${!filters.category_id ? 'active' : ''}`}
          onClick={() => updateFilters({ category_id: undefined })}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`cat-chip ${filters.category_id === cat.id ? 'active' : ''}`}
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
              <input type="number" className="filter-input" placeholder="0"
                value={filters.min_price ?? ''}
                onChange={e => updateFilters({ min_price: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="filter-row">
              <label className="filter-label">Precio máx.</label>
              <input type="number" className="filter-input" placeholder="∞"
                value={filters.max_price ?? ''}
                onChange={e => updateFilters({ max_price: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="filter-row">
              <label className="filter-label">Personalizable</label>
              <input type="checkbox" className="filter-check"
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

// ──────────────────────────────────────────────────────────────
// CatalogPage
// ──────────────────────────────────────────────────────────────
export default function CatalogPage() {
  const catalog = useCatalog();
  const { products, loading, error } = catalog;
  const [selected, setSelected] = useState<Product | null>(null);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --fg:      #0f0f0f;
          --fg-muted:#5a5a5a;
          --bg:      #f7f5f0;
          --surface: #ffffff;
          --accent:  #e85d04;
          --accent2: #1a1a2e;
          --border:  #e0ddd8;
          --radius:  10px;
          --shadow:  0 2px 12px rgba(0,0,0,0.07);
        }

        body { background: var(--bg); color: var(--fg); font-family: 'DM Sans', 'Helvetica Neue', sans-serif; }

        .catalog-root { min-height: 100vh; }

        /* ── Header ── */
        .catalog-header {
          background: var(--accent2); color: #fff;
          padding: 48px 5vw 40px; position: relative; overflow: hidden;
        }
        .catalog-header::before {
          content: '◈◈◈'; position: absolute; right: 4vw; top: 50%;
          transform: translateY(-50%); font-size: 88px; opacity: 0.07;
          letter-spacing: 12px; pointer-events: none;
        }
        .header-label {
          font-size: 11px; font-weight: 600; letter-spacing: 3px;
          text-transform: uppercase; color: var(--accent); margin-bottom: 10px;
        }
        .header-title {
          font-size: clamp(28px, 5vw, 52px); font-weight: 800;
          line-height: 1.08; letter-spacing: -1px;
        }
        .header-sub { margin-top: 10px; font-size: 15px; opacity: 0.65; max-width: 440px; }

        /* ── Filter bar ── */
        .filter-bar {
          background: var(--surface); border-bottom: 1px solid var(--border);
          padding: 16px 5vw; display: flex; flex-direction: column; gap: 12px;
          position: sticky; top: 0; z-index: 20;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .search-wrap { position: relative; max-width: 480px; }
        .search-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          color: var(--fg-muted); pointer-events: none;
        }
        .search-input {
          width: 100%; padding: 10px 36px; border: 1.5px solid var(--border);
          border-radius: var(--radius); font-size: 14px;
          background: var(--bg); color: var(--fg); outline: none; transition: border-color .15s;
        }
        .search-input:focus { border-color: var(--accent); }
        .clear-btn {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: var(--fg-muted);
          display: flex; align-items: center;
        }
        .cats-scroll {
          display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none;
        }
        .cats-scroll::-webkit-scrollbar { display: none; }
        .cat-chip {
          flex-shrink: 0; padding: 6px 14px; border-radius: 99px;
          border: 1.5px solid var(--border); background: none; font-size: 13px;
          cursor: pointer; color: var(--fg-muted); white-space: nowrap; transition: all .15s;
        }
        .cat-chip:hover { border-color: var(--accent); color: var(--accent); }
        .cat-chip.active { background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 600; }
        .advanced-wrap { position: relative; }
        .filter-toggle {
          display: flex; align-items: center; gap: 6px; font-size: 13px;
          background: none; border: 1.5px solid var(--border); border-radius: var(--radius);
          padding: 7px 14px; cursor: pointer; color: var(--fg-muted); transition: border-color .15s;
        }
        .filter-toggle:hover { border-color: var(--accent); color: var(--accent); }
        .filter-toggle .rotate { transform: rotate(180deg); }
        .filter-count {
          background: var(--accent); color: #fff; border-radius: 99px;
          font-size: 10px; padding: 0 6px; font-weight: 700;
        }
        .filter-panel {
          position: absolute; top: calc(100% + 8px); left: 0;
          background: var(--surface); border: 1.5px solid var(--border);
          border-radius: var(--radius); padding: 16px;
          display: flex; flex-direction: column; gap: 12px;
          min-width: 260px; box-shadow: var(--shadow); z-index: 30;
        }
        .filter-row { display: flex; align-items: center; gap: 12px; }
        .filter-label { font-size: 13px; color: var(--fg-muted); min-width: 90px; }
        .filter-select, .filter-input {
          flex: 1; padding: 7px 10px; border: 1.5px solid var(--border);
          border-radius: 7px; font-size: 13px; background: var(--bg); color: var(--fg); outline: none;
        }
        .filter-select:focus, .filter-input:focus { border-color: var(--accent); }
        .filter-check { accent-color: var(--accent); width: 16px; height: 16px; }
        .clear-all {
          display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--accent);
          background: none; border: none; cursor: pointer; padding: 4px 0; align-self: flex-start;
        }

        /* ── Content ── */
        .catalog-content { padding: 32px 5vw 64px; }
        .results-meta {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;
        }
        .results-count { font-size: 13px; color: var(--fg-muted); }
        .results-count strong { color: var(--fg); }

        /* ── Grid ── */
        .products-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px;
        }

        /* ── Card ── */
        .product-card {
          background: var(--surface); border-radius: 14px; border: 1px solid var(--border);
          overflow: hidden; transition: transform .2s, box-shadow .2s;
          display: flex; flex-direction: column; cursor: pointer;
        }
        .product-card:hover {
          transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.13);
        }
        .card-image-wrap {
          position: relative; aspect-ratio: 1/1; background: var(--bg); overflow: hidden;
        }
        .card-image {
          width: 100%; height: 100%; object-fit: cover; transition: transform .35s;
        }
        .product-card:hover .card-image { transform: scale(1.06); }
        .card-image-placeholder {
          width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
        }
        .placeholder-icon { font-size: 52px; color: var(--border); }
        .badge {
          position: absolute; top: 10px; right: 10px; font-size: 10px; font-weight: 700;
          letter-spacing: .5px; text-transform: uppercase; padding: 4px 9px; border-radius: 99px;
        }
        .badge-custom { background: var(--accent); color: #fff; }
        .badge-stock  { background: #fde8e8; color: #c0392b; }

        /* Card hover overlay */
        .card-hover-overlay {
          position: absolute; inset: 0;
          background: rgba(26,26,46,0.55);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity .2s;
        }
        .product-card:hover .card-hover-overlay { opacity: 1; }
        .card-hover-label {
          color: #fff; font-size: 14px; font-weight: 700;
          border: 2px solid rgba(255,255,255,.7); border-radius: 8px;
          padding: 8px 18px; letter-spacing: .5px;
        }

        .card-body {
          padding: 16px; display: flex; flex-direction: column; gap: 6px; flex: 1;
        }
        .card-category {
          font-size: 11px; font-weight: 600; color: var(--accent);
          text-transform: uppercase; letter-spacing: .5px;
        }
        .card-title { font-size: 16px; font-weight: 700; line-height: 1.25; color: var(--fg); }
        .card-desc {
          font-size: 13px; color: var(--fg-muted); line-height: 1.5;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .card-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
        .meta-pill {
          display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--fg-muted);
          background: var(--bg); border: 1px solid var(--border); border-radius: 99px; padding: 3px 9px;
        }
        .card-footer {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border);
        }
        .card-price { font-size: 18px; font-weight: 800; color: var(--fg); letter-spacing: -.5px; }
        .btn-contact {
          background: var(--accent2); color: #fff; border: none; border-radius: 8px;
          padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer;
          transition: background .15s, transform .1s;
        }
        .btn-contact:hover { background: var(--accent); transform: scale(1.03); }

        /* ── States ── */
        .state-wrap {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 80px 20px; gap: 12px; text-align: center;
        }
        .state-icon { font-size: 48px; opacity: .25; }
        .state-title { font-size: 20px; font-weight: 700; }
        .state-sub { font-size: 14px; color: var(--fg-muted); }

        /* ── Skeleton ── */
        .skeleton-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px;
        }
        .skeleton-card {
          border-radius: 14px; background: var(--surface); border: 1px solid var(--border); overflow: hidden;
        }
        .skeleton-img {
          aspect-ratio: 1/1;
          background: linear-gradient(90deg, var(--bg) 25%, var(--border) 50%, var(--bg) 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite;
        }
        .skeleton-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .skeleton-line {
          height: 12px; border-radius: 6px;
          background: linear-gradient(90deg, var(--bg) 25%, var(--border) 50%, var(--bg) 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* ── Footer ── */
        .catalog-footer {
          text-align: center; padding: 24px; font-size: 12px;
          color: var(--fg-muted); border-top: 1px solid var(--border);
        }

        /* ── Drawer ── */
        .drawer-overlay {
          position: fixed; inset: 0; z-index: 40;
          background: rgba(15,23,42,.45);
          backdrop-filter: blur(4px);
          animation: fade-in .2s ease;
        }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

        .drawer-panel {
          position: fixed; top: 0; right: 0; bottom: 0; z-index: 50;
          width: min(520px, 100vw);
          background: #fff;
          box-shadow: -8px 0 48px rgba(0,0,0,.18);
          overflow-y: auto;
          animation: slide-in .28s cubic-bezier(.22,1,.36,1);
          display: flex; flex-direction: column;
        }
        @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }

        .drawer-close {
          position: absolute; top: 14px; right: 14px; z-index: 10;
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(255,255,255,.9); border: 1px solid #e5e7eb;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #374151; transition: all .15s;
          box-shadow: 0 2px 8px rgba(0,0,0,.1);
        }
        .drawer-close:hover { background: #1a1a2e; color: #fff; }

        /* Gallery */
        .drawer-gallery {
          position: relative; aspect-ratio: 4/3;
          background: var(--bg); overflow: hidden; flex-shrink: 0;
        }
        .drawer-gallery-placeholder {
          width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
        }
        .drawer-main-img {
          width: 100%; height: 100%; object-fit: cover;
          animation: img-fade .25s ease;
        }
        @keyframes img-fade { from { opacity: 0; } to { opacity: 1; } }

        .gallery-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255,255,255,.9); border: 1px solid #e5e7eb;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #374151; transition: all .15s;
          box-shadow: 0 2px 8px rgba(0,0,0,.1);
        }
        .gallery-nav:hover { background: var(--accent2); color: #fff; }
        .gallery-nav.left  { left: 10px; }
        .gallery-nav.right { right: 10px; }

        .gallery-dots {
          position: absolute; bottom: 44px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 6px;
        }
        .gallery-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: rgba(255,255,255,.5); border: none; cursor: pointer; padding: 0;
          transition: background .15s;
        }
        .gallery-dot.active { background: #fff; }

        .gallery-thumbs {
          position: absolute; bottom: 0; left: 0; right: 0;
          display: flex; gap: 4px; padding: 6px 10px;
          background: rgba(15,23,46,.55); backdrop-filter: blur(4px);
          overflow-x: auto; scrollbar-width: none;
        }
        .gallery-thumbs::-webkit-scrollbar { display: none; }
        .gallery-thumb {
          width: 44px; height: 44px; border-radius: 6px;
          object-fit: cover; cursor: pointer; flex-shrink: 0;
          opacity: .55; border: 2px solid transparent; transition: all .15s;
        }
        .gallery-thumb.active { opacity: 1; border-color: var(--accent); }
        .gallery-thumb:hover { opacity: .9; }

        /* Content */
        .drawer-content { padding: 22px 24px 32px; flex: 1; }

        .drawer-top-row {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 8px; margin-bottom: 10px;
        }
        .drawer-category {
          font-size: 11px; font-weight: 700; color: var(--accent);
          text-transform: uppercase; letter-spacing: .8px;
        }
        .drawer-badges { display: flex; gap: 6px; flex-wrap: wrap; }
        .drawer-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 99px;
        }
        .drawer-badge.custom { background: #fff4ed; color: #c2410c; }
        .drawer-badge.instock { background: #f0fdf4; color: #15803d; }
        .drawer-badge.nostock { background: #fef2f2; color: #b91c1c; }

        .drawer-name {
          font-size: 1.5rem; font-weight: 800; color: var(--fg);
          line-height: 1.2; letter-spacing: -.4px; margin-bottom: 8px;
        }
        .drawer-price {
          font-size: 1.75rem; font-weight: 800; color: var(--accent);
          letter-spacing: -1px; margin-bottom: 14px;
        }
        .drawer-desc {
          font-size: 14px; color: var(--fg-muted); line-height: 1.7; margin-bottom: 4px;
        }
        .drawer-divider {
          height: 1px; background: #f3f4f6; margin: 18px 0;
        }
        .drawer-section-title {
          font-size: .75rem; font-weight: 700; color: #9ca3af;
          text-transform: uppercase; letter-spacing: .1em; margin-bottom: 14px;
        }

        /* Specs */
        .drawer-specs {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 4px;
        }
        .spec-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 14px; border-radius: 10px;
          background: var(--bg); border: 1px solid var(--border);
        }
        .spec-icon {
          width: 30px; height: 30px; border-radius: 8px;
          background: var(--surface); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          color: var(--fg-muted); flex-shrink: 0;
        }
        .spec-label { font-size: .72rem; color: #9ca3af; margin-bottom: 2px; }
        .spec-value { font-size: .875rem; font-weight: 600; color: var(--fg); }

        /* Seller */
        .drawer-seller {
          display: flex; align-items: center; gap: 12px; padding: 12px 14px;
          background: var(--bg); border-radius: 10px; margin-bottom: 4px;
        }
        .seller-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--accent2); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: .875rem; flex-shrink: 0;
        }
        .seller-label { font-size: .72rem; color: #9ca3af; }
        .seller-name { font-size: .875rem; font-weight: 600; color: var(--fg); }

        /* CTA */
        .drawer-cta {
          width: 100%; margin-top: 20px; padding: 16px;
          background: #25d366; color: #fff; border: none; border-radius: 12px;
          font-size: 1rem; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: filter .15s, transform .1s;
          box-shadow: 0 4px 14px rgba(37,211,102,.35);
        }
        .drawer-cta:hover { filter: brightness(1.07); transform: translateY(-1px); }
        .drawer-cta:active { transform: translateY(0); }

        .drawer-wa-warn {
          margin-top: 10px; font-size: .78rem; color: #92400e;
          background: #fffbeb; border: 1px solid #fde68a;
          border-radius: 8px; padding: 8px 12px; text-align: center;
        }
        .drawer-wa-warn code { font-family: monospace; background: #fef3c7; padding: 1px 4px; border-radius: 4px; }

        /* ── Responsive ── */
        @media (max-width: 600px) {
          .products-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
          .card-price { font-size: 15px; }
          .header-title { font-size: 28px; }
          .drawer-specs { grid-template-columns: 1fr; }
          .drawer-name { font-size: 1.25rem; }
          .drawer-price { font-size: 1.4rem; }
        }
      `}</style>

      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" />

      <div className="catalog-root">
        {/* Header */}
        <header className="catalog-header">
          <p className="header-label">Catálogo 3D</p>
          <h1 className="header-title">Impresiones 3D<br />a tu medida</h1>
          <p className="header-sub">Explora nuestro catálogo. Personaliza, ordena y recibe.</p>
        </header>

        {/* Filters */}
        <FilterBar catalog={catalog} />

        {/* Content */}
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
      </div>

      {/* Product detail drawer */}
      {selected && (
        <ProductDrawer product={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
