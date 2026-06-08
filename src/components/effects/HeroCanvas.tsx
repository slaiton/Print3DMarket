import { useEffect, useRef, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────
interface Vec3 { x: number; y: number; z: number; }
interface Particle { x:number; y:number; z:number; vx:number; vy:number; vz:number; r:number; opacity:number; color:string; }
interface Shape {
  pos:   Vec3;
  rot:   Vec3;
  vel:   Vec3;
  rvel:  Vec3;
  scale: number;
  type:  'cube' | 'diamond' | 'ring';
  hue:   number;
  alpha: number;
  parallax: number;
}

// ── Palette  (naranja → púrpura → cian de marca) ──────────────
const PALETTE = [
  '#e85d04', '#fb923c', '#f97316',   // naranjas
  '#7c3aed', '#a78bfa', '#8b5cf6',   // púrpuras
  '#06b6d4', '#22d3ee',              // cianes
  '#ec4899', '#f43f5e',              // rosas
];

// ── Geometría: vértices y aristas ─────────────────────────────
const CUBE_V: Vec3[] = [
  {x:-1,y:-1,z:-1},{x:1,y:-1,z:-1},{x:1,y:1,z:-1},{x:-1,y:1,z:-1},
  {x:-1,y:-1,z:1}, {x:1,y:-1,z:1}, {x:1,y:1,z:1}, {x:-1,y:1,z:1},
];
const CUBE_E = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];

const DIAMOND_V: Vec3[] = [
  {x:0,y:-1.4,z:0},
  {x:1,y:0,z:0},{x:-1,y:0,z:0},{x:0,y:0,z:1},{x:0,y:0,z:-1},
  {x:0,y:1.4,z:0},
];
const DIAMOND_E = [
  [0,1],[0,2],[0,3],[0,4],
  [1,3],[3,2],[2,4],[4,1],
  [5,1],[5,2],[5,3],[5,4],
];

// ── Helpers ───────────────────────────────────────────────────
function rotateX(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: v.x, y: v.y*c - v.z*s, z: v.y*s + v.z*c };
}
function rotateY(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: v.x*c + v.z*s, y: v.y, z: -v.x*s + v.z*c };
}
function rotateZ(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: v.x*c - v.y*s, y: v.x*s + v.y*c, z: v.z };
}
function project(v: Vec3, fov: number, cx: number, cy: number): [number,number,number] {
  const depth = fov / (fov + v.z);
  return [v.x * depth + cx, v.y * depth + cy, depth];
}
function rand(a: number, b: number) { return a + Math.random() * (b - a); }
function randFrom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Crear escena ──────────────────────────────────────────────
function createShapes(count: number): Shape[] {
  return Array.from({ length: count }, () => ({
    pos:  { x: rand(-400,400), y: rand(-250,250), z: rand(-200,400) },
    rot:  { x: rand(0,Math.PI*2), y: rand(0,Math.PI*2), z: rand(0,Math.PI*2) },
    vel:  { x: rand(-0.15,0.15), y: rand(-0.1,0.1), z: rand(-0.08,0.08) },
    rvel: { x: rand(-0.005,0.005), y: rand(-0.008,0.008), z: rand(-0.003,0.003) },
    scale: rand(18, 55),
    type:  Math.random() < 0.5 ? 'cube' : 'diamond',
    hue:   Math.random(),
    alpha: rand(0.12, 0.55),
    parallax: rand(0.02, 0.12),
  }));
}

function createParticles(count: number, W: number, H: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: rand(0, W), y: rand(0, H), z: rand(0, 300),
    vx: rand(-0.3,0.3), vy: rand(-0.3,0.3), vz: rand(-0.1,0.1),
    r: rand(1, 2.5),
    opacity: rand(0.2, 0.7),
    color: randFrom(PALETTE),
  }));
}

// ── Componente ────────────────────────────────────────────────
export function HeroCanvas() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const mouseRef   = useRef({ x: 0, y: 0, lerpX: 0, lerpY: 0 });
  const frameRef   = useRef(0);
  const shapesRef  = useRef<Shape[]>([]);
  const partsRef   = useRef<Particle[]>([]);
  const timeRef    = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const FOV = 600;
    const t = (timeRef.current += 0.008);

    // Lerpear mouse
    const m = mouseRef.current;
    m.lerpX += (m.x - m.lerpX) * 0.04;
    m.lerpY += (m.y - m.lerpY) * 0.04;
    const mx = (m.lerpX - cx) / W;   // -0.5 … 0.5
    const my = (m.lerpY - cy) / H;

    // ── Fondo degradado animado ──
    const bg = ctx.createRadialGradient(
      cx + Math.sin(t*0.3)*80, cy + Math.cos(t*0.2)*40, 60,
      cx, cy, Math.max(W, H) * 0.85,
    );
    bg.addColorStop(0, `hsla(${220 + Math.sin(t*0.15)*20},60%,12%,1)`);
    bg.addColorStop(0.5,`hsla(${260 + Math.cos(t*0.1)*15},55%,8%,1)`);
    bg.addColorStop(1, `hsla(${200 + Math.sin(t*0.2)*10},50%,5%,1)`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── Neblina central de color ──
    const nebula = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.6);
    nebula.addColorStop(0, `hsla(${20 + Math.sin(t*0.2)*15},90%,55%,0.07)`);
    nebula.addColorStop(0.4, `hsla(${270+Math.cos(t*0.15)*20},80%,55%,0.05)`);
    nebula.addColorStop(1, 'transparent');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, W, H);

    // ── Partículas flotantes ──────────────────────────────────
    const parts = partsRef.current;
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
    }

    // Líneas de conexión
    ctx.lineWidth = 0.5;
    for (let i = 0; i < parts.length; i++) {
      for (let j = i+1; j < parts.length; j++) {
        const dx = parts[i].x - parts[j].x;
        const dy = parts[i].y - parts[j].y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < 110) {
          const a = (1 - d/110) * 0.18;
          ctx.strokeStyle = `rgba(200,150,255,${a})`;
          ctx.beginPath();
          ctx.moveTo(parts[i].x, parts[i].y);
          ctx.lineTo(parts[j].x, parts[j].y);
          ctx.stroke();
        }
      }
    }

    // Puntos
    for (const p of parts) {
      const pulse = 0.7 + 0.3 * Math.sin(t * 1.5 + p.x * 0.01);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI*2);
      ctx.fillStyle = p.color + Math.round(p.opacity * pulse * 255).toString(16).padStart(2,'0');
      ctx.fill();
    }

    // ── Formas 3D ────────────────────────────────────────────
    const shapes = shapesRef.current;
    for (const s of shapes) {
      // Movimiento
      s.pos.x += s.vel.x + mx * s.parallax * 60;
      s.pos.y += s.vel.y + my * s.parallax * 60;
      s.pos.z += s.vel.z;
      s.rot.x += s.rvel.x; s.rot.y += s.rvel.y; s.rot.z += s.rvel.z;

      // Wrap around
      const lim = 500;
      if (s.pos.x > lim) s.pos.x = -lim;
      if (s.pos.x <-lim) s.pos.x = lim;
      if (s.pos.y > lim * 0.7) s.pos.y = -lim * 0.7;
      if (s.pos.y <-lim * 0.7) s.pos.y = lim * 0.7;
      if (s.pos.z > 500) s.pos.z = -200;
      if (s.pos.z <-200) s.pos.z = 500;

      // Color pulsante
      const hueShift = (s.hue * 360 + t * 15) % 360;
      const colorA = `hsla(${hueShift},90%,65%,`;
      const colorB = `hsla(${(hueShift+60)%360},80%,70%,`;
      const alpha = s.alpha * (0.7 + 0.3 * Math.sin(t + s.pos.x * 0.01));

      const verts = s.type === 'cube' ? CUBE_V : DIAMOND_V;
      const edges = s.type === 'cube' ? CUBE_E : DIAMOND_E;

      // Transformar vértices
      const transformed = verts.map(v => {
        let u: Vec3 = { x: v.x * s.scale, y: v.y * s.scale, z: v.z * s.scale };
        u = rotateX(u, s.rot.x);
        u = rotateY(u, s.rot.y);
        u = rotateZ(u, s.rot.z);
        return { x: u.x + s.pos.x, y: u.y + s.pos.y, z: u.z + s.pos.z };
      });

      // Proyectar
      const projected = transformed.map(v => project(v, FOV, cx, cy));

      // Dibujar aristas con gradiente
      for (const [a, b] of edges) {
        const [ax, ay, ad] = projected[a];
        const [bx, by]     = projected[b];
        const grad = ctx.createLinearGradient(ax, ay, bx, by);
        grad.addColorStop(0, colorA + (alpha * ad).toFixed(2) + ')');
        grad.addColorStop(1, colorB + (alpha * ad * 0.7).toFixed(2) + ')');
        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(0.4, 1.5 * ad);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }

      // Glow en vértices
      for (const [px, py, pd] of projected) {
        const glowR = 2 * pd;
        const glow = ctx.createRadialGradient(px, py, 0, px, py, glowR * 3);
        glow.addColorStop(0, colorA + (alpha * pd * 0.9).toFixed(2) + ')');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, glowR * 3, 0, Math.PI*2);
        ctx.fill();
      }
    }

    // ── Scanlines sutil ──────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for (let y = 0; y < H; y += 4) {
      ctx.fillRect(0, y, W, 1);
    }

    frameRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement!;
      canvas.width  = parent.clientWidth;
      canvas.height = parent.clientHeight;
      // Reiniciar partículas al redimensionar
      partsRef.current = createParticles(70, canvas.width, canvas.height);
    };

    resize();
    shapesRef.current  = createShapes(14);
    partsRef.current   = createParticles(70, canvas.width, canvas.height);

    const onMouse = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    const onTouch = (e: TouchEvent) => {
      mouseRef.current.x = e.touches[0].clientX;
      mouseRef.current.y = e.touches[0].clientY;
    };

    window.addEventListener('mousemove', onMouse);
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('resize', resize);

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('resize', resize);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
