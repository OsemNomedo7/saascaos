'use client';
import { useEffect, useRef } from 'react';

interface MatrixRainProps {
  opacity?: number;
}

export default function MatrixRain({ opacity = 0.15 }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const katakana = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const symbols = '@#$%&<>{}[]|/\\~^_';
    const chars = katakana + latin + nums + symbols;

    const fontSize = 14;
    let cols = Math.floor(canvas.width / fontSize);
    let drops: number[] = new Array(cols).fill(0).map(() => Math.random() * -50);

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 10, 5, 0.055)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const y = drops[i] * fontSize;

        if (y < fontSize * 3) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 8;
        } else if (y < fontSize * 6) {
          ctx.fillStyle = '#88ffaa';
          ctx.shadowColor = '#00ff41';
          ctx.shadowBlur = 4;
        } else {
          ctx.fillStyle = '#00ff41';
          ctx.shadowColor = '#00ff41';
          ctx.shadowBlur = 2;
        }

        ctx.font = `${fontSize}px monospace`;
        ctx.fillText(char, i * fontSize, y);
        ctx.shadowBlur = 0;

        if (y > canvas.height && Math.random() > 0.972) {
          drops[i] = 0;
        }
        drops[i] += 0.5;
      }
    };

    const interval = setInterval(draw, 45);

    const handleResize = () => {
      resize();
      cols = Math.floor(canvas.width / fontSize);
      drops = new Array(cols).fill(0).map(() => Math.random() * -50);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ opacity, zIndex: 0 }}
    />
  );
}
