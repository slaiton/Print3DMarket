# Print3D Sales — Sistema de Ventas para Impresiones 3D

Sistema para gestión de catálogo y ventas con vendedores remotos.

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Deploy**: Vercel (frontend) + Supabase Cloud (backend)

## Estructura del proyecto

```
print3d/
├── supabase/
│   └── migrations/          # SQL de creación y seed
│       ├── 001_schema.sql   # Tablas principales
│       ├── 002_rls.sql      # Row Level Security
│       └── 003_seed.sql     # Datos de ejemplo
├── src/
│   ├── types/               # TypeScript interfaces
│   ├── lib/                 # Cliente Supabase
│   ├── services/            # Lógica de negocio
│   ├── hooks/               # React hooks (estado)
│   ├── store/               # Zustand stores
│   ├── components/
│   │   ├── ui/              # Botones, inputs, cards genéricos
│   │   ├── catalog/         # Componentes del catálogo
│   │   ├── sales/           # Formularios de venta
│   │   └── auth/            # Login / registro
│   └── pages/               # Páginas de la app
├── .env.example
├── package.json
└── vite.config.ts
```

## Setup rápido

### 1. Clonar y dependencias
```bash
git clone <tu-repo>
cd print3d
npm install
```

### 2. Configurar Supabase
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar en orden:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/migrations/003_seed.sql` (opcional, datos de ejemplo)
3. En **Storage** → crear bucket llamado `product-images` (público)

### 3. Variables de entorno
```bash
cp .env.example .env
# Completar con tus keys de Supabase (Settings → API)
```

### 4. Correr en local
```bash
npm run dev
```

### 5. Deploy en Vercel
```bash
npx vercel --prod
# Agregar las variables de entorno en el dashboard de Vercel
```

## Roles de usuario
- **admin** — acceso total, puede ver ventas de todos
- **seller** — gestiona sus propios productos y ventas
- **public** — solo ve el catálogo (sin login)
