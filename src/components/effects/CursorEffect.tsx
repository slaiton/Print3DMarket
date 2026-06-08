import { useEffect, useRef, useState } from 'react';
import './CursorEffect.css';

interface TrailDot { x: number; y: number; id: number; }

export function CursorEffect() {
  const dotRef    = useRef<HTMLDivElement>(null);
  const ringRef   = useRef<HTMLDivElement>(null);
  const posRef    = useRef({ x: -100, y: -100 });
  const ringPos   = useRef({ x: -100, y: -100 });
  const frameRef  = useRef(0);
  const trailId   = useRef(0);
  const [trail, setTrail] = useState<TrailDot[]>([]);
  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    // Animar el anillo con spring
    const animate = () => {
      const ring = ringRef.current;
      if (ring) {
        ringPos.current.x += (posRef.current.x - ringPos.current.x) * 0.12;
        ringPos.current.y += (posRef.current.y - ringPos.current.y) * 0.12;
        ring.style.transform = `translate(${ringPos.current.x}px, ${ringPos.current.y}px)`;
      }
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const { clientX: x, clientY: y } = e;
      posRef.current = { x, y };

      // Mover punto central
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${x}px,${y}px)`;
      }

      // Trail: agregar punto y limpiar después
      const id = ++trailId.current;
      setTrail(prev => [...prev.slice(-12), { x, y, id }]);
      setTimeout(() => {
        setTrail(prev => prev.filter(d => d.id !== id));
      }, 500);

      // Detectar hover sobre elementos interactivos
      const el = document.elementFromPoint(x, y);
      const isHover = !!(el?.closest('a, button, [role="button"], input, select, textarea, [tabindex]'));
      setHovering(isHover);
    };

    const onDown = () => setClicking(true);
    const onUp   = () => setClicking(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup',   onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup',   onUp);
    };
  }, []);

  return (
    <div className="cursor-root" aria-hidden="true">
      {/* Trail de partículas */}
      {trail.map((dot, i) => (
        <span
          key={dot.id}
          className="cursor-trail"
          style={{
            transform: `translate(${dot.x}px,${dot.y}px)`,
            opacity: (i + 1) / trail.length,
            width:  `${4 + (i / trail.length) * 6}px`,
            height: `${4 + (i / trail.length) * 6}px`,
          }}
        />
      ))}

      {/* Anillo exterior (sigue con lag) */}
      <div
        ref={ringRef}
        className={`cursor-ring ${hovering ? 'cursor-hover' : ''} ${clicking ? 'cursor-click' : ''}`}
      />

      {/* Punto central (inmediato) */}
      <div
        ref={dotRef}
        className={`cursor-dot ${clicking ? 'cursor-click' : ''}`}
      />
    </div>
  );
}
