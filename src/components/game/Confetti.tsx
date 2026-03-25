import { useEffect, useRef } from 'react';

const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#FF8C42', '#98D8C8'];

interface Particle {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  vx: number;
  vy: number;
  rot: number;
  rotSpeed: number;
  opacity: number;
}

const Confetti = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();

    const spawn = (): Particle => ({
      x: Math.random() * canvas.offsetWidth,
      y: -10 - Math.random() * 40,
      w: 4 + Math.random() * 6,
      h: 6 + Math.random() * 10,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 2,
      vy: 1.5 + Math.random() * 2.5,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.15,
      opacity: 0.85 + Math.random() * 0.15,
    });

    // Initial burst
    for (let i = 0; i < 60; i++) {
      const p = spawn();
      p.y = Math.random() * canvas.offsetHeight * 0.6;
      particles.push(p);
    }

    const loop = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Continuously spawn
      if (particles.length < 80 && Math.random() < 0.4) {
        particles.push(spawn());
      }

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        p.vx += (Math.random() - 0.5) * 0.1;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      // Remove off-screen, recycle
      particles = particles.filter((p) => p.y < canvas.offsetHeight + 20);

      animId = requestAnimationFrame(loop);
    };

    loop();

    const onResize = () => {
      ctx.resetTransform();
      resize();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default Confetti;
