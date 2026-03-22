import { useEffect, useRef, useCallback } from "react";

interface Dot {
  x: number;
  y: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
}

export default function MagneticGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number>(0);

  const SPACING = 35;
  const RADIUS = 150;
  const SPRING = 0.08;
  const DAMPING = 0.85;
  const DOT_SIZE = 1.5;

  const initDots = useCallback((w: number, h: number) => {
    const dots: Dot[] = [];
    // Calculate full grid including slight overflow to ensure coverage during resizes
    for (let x = 0; x < w + SPACING; x += SPACING) {
      for (let y = 0; y < h + SPACING; y += SPACING) {
        dots.push({ x, y, ox: x, oy: y, vx: 0, vy: 0 });
      }
    }
    dotsRef.current = dots;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initDots(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = mouseRef.current;

      for (const dot of dotsRef.current) {
        const dx = mx - dot.ox;
        const dy = my - dot.oy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Calculate magnetic repulsion
        if (dist < RADIUS) {
          const force = (RADIUS - dist) / RADIUS;
          const angle = Math.atan2(dy, dx);
          dot.vx -= Math.cos(angle) * force * 5;
          dot.vy -= Math.sin(angle) * force * 5;
        }

        // Apply spring physics to return to origin
        dot.vx += (dot.ox - dot.x) * SPRING;
        dot.vy += (dot.oy - dot.y) * SPRING;
        dot.vx *= DAMPING;
        dot.vy *= DAMPING;
        dot.x += dot.vx;
        dot.y += dot.vy;

        const displacement = Math.sqrt((dot.x - dot.ox) ** 2 + (dot.y - dot.oy) ** 2);
        const alpha = Math.min(0.15 + displacement / 30, 1);

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_SIZE + displacement * 0.05, 0, Math.PI * 2);
        
        // Neon lime glow when heavily displaced, soft white otherwise
        ctx.fillStyle = displacement > 3
          ? `hsla(73, 100%, 50%, ${alpha})`
          : `hsla(0, 0%, 100%, ${alpha * 0.5})`;
          
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [initDots]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0 opacity-80" 
    />
  );
}
