// src/pages/CatalogPage.tsx
// Catálogo público — visible sin login
// Diseño: editorial industrial, tipografía bold, tarjetas de alta densidad

import { useState } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown, Layers, Zap, Tag } from 'lucide-react';
import { useCatalog } from '../hooks/useCatalog';
import { productService } from '../services/productService';
import type { Product } from '../types';

// ──────────────────────────────────────────────────────────────
// ProductCard
// ──────────────────────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  const [imgError, setImgError] = useState(false);
  const image = product.images[0] ?? null;

  return (
    <article className="product-card">
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
          <button className="btn-contact" onClick={() => {
            const msg = `Hola! Me interesa: *${product.name}* (${productService.formatPrice(product.price)})`;
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
          }}>
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
      {/* Búsqueda */}
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

      {/* Categorías */}
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

      {/* Filtros avanzados */}
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

// ──────────────────────────────────────────────────────────────
// CatalogPage
// ──────────────────────────────────────────────────────────────
export default function CatalogPage() {
  const catalog = useCatalog();
  const { products, loading, error } = catalog;

  return (
    <>
      <style>{`
        /* ── Reset mínimo ──────────────────────────────── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Variables ─────────────────────────────────── */
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

        /* ── Layout ────────────────────────────────────── */
        .catalog-root { min-height: 100vh; }

        /* ── Header ────────────────────────────────────── */
        .catalog-header {
          background: var(--accent2);
          color: #fff;
          padding: 48px 5vw 40px;
          position: relative;
          overflow: hidden;
        }
        .catalog-header::before {
          content: '◈◈◈';
          position: absolute;
          right: 4vw; top: 50%;
          transform: translateY(-50%);
          font-size: 88px;
          opacity: 0.07;
          letter-spacing: 12px;
          pointer-events: none;
        }
        .header-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 10px;
        }
        .header-title {
          font-size: clamp(28px, 5vw, 52px);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -1px;
        }
        .header-sub {
          margin-top: 10px;
          font-size: 15px;
          opacity: 0.65;
          max-width: 440px;
        }

        /* ── Filter bar ────────────────────────────────── */
        .filter-bar {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 16px 5vw;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: sticky;
          top: 0;
          z-index: 20;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .search-wrap {
          position: relative;
          max-width: 480px;
        }
        .search-icon {
          position: absolute;
          left: 12px; top: 50%;
          transform: translateY(-50%);
          color: var(--fg-muted);
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 10px 36px 10px 36px;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          font-size: 14px;
          background: var(--bg);
          color: var(--fg);
          outline: none;
          transition: border-color .15s;
        }
        .search-input:focus { border-color: var(--accent); }
        .clear-btn {
          position: absolute;
          right: 10px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; color: var(--fg-muted);
          display: flex; align-items: center;
        }

        /* Categorías */
        .cats-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }
        .cats-scroll::-webkit-scrollbar { display: none; }
        .cat-chip {
          flex-shrink: 0;
          padding: 6px 14px;
          border-radius: 99px;
          border: 1.5px solid var(--border);
          background: none;
          font-size: 13px;
          cursor: pointer;
          color: var(--fg-muted);
          white-space: nowrap;
          transition: all .15s;
        }
        .cat-chip:hover { border-color: var(--accent); color: var(--accent); }
        .cat-chip.active {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
          font-weight: 600;
        }

        /* Filtros avanzados */
        .advanced-wrap { position: relative; }
        .filter-toggle {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; background: none; border: 1.5px solid var(--border);
          border-radius: var(--radius); padding: 7px 14px;
          cursor: pointer; color: var(--fg-muted);
          transition: border-color .15s;
        }
        .filter-toggle:hover { border-color: var(--accent); color: var(--accent); }
        .filter-toggle .rotate { transform: rotate(180deg); }
        .filter-count {
          background: var(--accent); color: #fff;
          border-radius: 99px; font-size: 10px;
          padding: 0 6px; font-weight: 700;
        }
        .filter-panel {
          position: absolute;
          top: calc(100% + 8px); left: 0;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          display: flex; flex-direction: column; gap: 12px;
          min-width: 260px;
          box-shadow: var(--shadow);
          z-index: 30;
        }
        .filter-row { display: flex; align-items: center; gap: 12px; }
        .filter-label { font-size: 13px; color: var(--fg-muted); min-width: 90px; }
        .filter-select, .filter-input {
          flex: 1; padding: 7px 10px; border: 1.5px solid var(--border);
          border-radius: 7px; font-size: 13px; background: var(--bg);
          color: var(--fg); outline: none;
        }
        .filter-select:focus, .filter-input:focus { border-color: var(--accent); }
        .filter-check { accent-color: var(--accent); width: 16px; height: 16px; }
        .clear-all {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: var(--accent);
          background: none; border: none; cursor: pointer;
          padding: 4px 0; align-self: flex-start;
        }

        /* ── Content area ──────────────────────────────── */
        .catalog-content { padding: 32px 5vw 64px; }

        .results-meta {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .results-count {
          font-size: 13px; color: var(--fg-muted);
        }
        .results-count strong { color: var(--fg); }

        /* ── Grid ──────────────────────────────────────── */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }

        /* ── Card ──────────────────────────────────────── */
        .product-card {
          background: var(--surface);
          border-radius: 14px;
          border: 1px solid var(--border);
          overflow: hidden;
          transition: transform .2s, box-shadow .2s;
          display: flex; flex-direction: column;
        }
        .product-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.11);
        }

        .card-image-wrap {
          position: relative;
          aspect-ratio: 1 / 1;
          background: var(--bg);
          overflow: hidden;
        }
        .card-image {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform .3s;
        }
        .product-card:hover .card-image { transform: scale(1.04); }
        .card-image-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }
        .placeholder-icon {
          font-size: 52px;
          color: var(--border);
        }

        .badge {
          position: absolute;
          top: 10px; right: 10px;
          font-size: 10px; font-weight: 700;
          letter-spacing: .5px; text-transform: uppercase;
          padding: 4px 9px; border-radius: 99px;
        }
        .badge-custom { background: var(--accent); color: #fff; }
        .badge-stock  { background: #fde8e8; color: #c0392b; }

        .card-body {
          padding: 16px;
          display: flex; flex-direction: column; gap: 6px;
          flex: 1;
        }
        .card-category {
          font-size: 11px; font-weight: 600;
          color: var(--accent); text-transform: uppercase;
          letter-spacing: .5px;
        }
        .card-title {
          font-size: 16px; font-weight: 700;
          line-height: 1.25; color: var(--fg);
        }
        .card-desc {
          font-size: 13px; color: var(--fg-muted);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-meta {
          display: flex; flex-wrap: wrap; gap: 6px;
          margin-top: 4px;
        }
        .meta-pill {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; color: var(--fg-muted);
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 99px;
          padding: 3px 9px;
        }

        .card-footer {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-top: auto; padding-top: 14px;
          border-top: 1px solid var(--border);
        }
        .card-price {
          font-size: 18px; font-weight: 800;
          color: var(--fg); letter-spacing: -.5px;
        }
        .btn-contact {
          background: var(--accent2);
          color: #fff;
          border: none; border-radius: 8px;
          padding: 8px 16px; font-size: 13px;
          font-weight: 600; cursor: pointer;
          transition: background .15s, transform .1s;
        }
        .btn-contact:hover { background: var(--accent); transform: scale(1.03); }

        /* ── States ────────────────────────────────────── */
        .state-wrap {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 80px 20px; gap: 12px; text-align: center;
        }
        .state-icon { font-size: 48px; opacity: .25; }
        .state-title { font-size: 20px; font-weight: 700; }
        .state-sub { font-size: 14px; color: var(--fg-muted); }

        /* Loading skeleton */
        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }
        .skeleton-card {
          border-radius: 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          overflow: hidden;
        }
        .skeleton-img {
          aspect-ratio: 1/1;
          background: linear-gradient(90deg, var(--bg) 25%, var(--border) 50%, var(--bg) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        .skeleton-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .skeleton-line {
          height: 12px; border-radius: 6px;
          background: linear-gradient(90deg, var(--bg) 25%, var(--border) 50%, var(--bg) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Footer ────────────────────────────────────── */
        .catalog-footer {
          text-align: center;
          padding: 24px;
          font-size: 12px;
          color: var(--fg-muted);
          border-top: 1px solid var(--border);
        }

        @media (max-width: 600px) {
          .products-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
          .card-price { font-size: 15px; }
          .header-title { font-size: 28px; }
        }
      `}</style>

      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap"
      />

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

          {/* Loading */}
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

          {/* Error */}
          {!loading && error && (
            <div className="state-wrap">
              <p className="state-icon">⚠️</p>
              <p className="state-title">Error al cargar</p>
              <p className="state-sub">{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && products.length === 0 && (
            <div className="state-wrap">
              <p className="state-icon">◈</p>
              <p className="state-title">Sin resultados</p>
              <p className="state-sub">Intenta con otros filtros o términos de búsqueda.</p>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && products.length > 0 && (
            <div className="products-grid">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>

        <footer className="catalog-footer">
          Impresiones 3D · Hecho con ♥ · {new Date().getFullYear()}
        </footer>
      </div>
    </>
  );
}
