
import React, { useEffect, useRef } from 'react';

interface LiveAudioWaveProps {
  status: 'idle' | 'listening' | 'thinking' | 'speaking';
  analyser?: AnalyserNode | null;
}

const LiveAudioWave: React.FC<LiveAudioWaveProps> = ({ status, analyser }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const W = () => canvas.getBoundingClientRect().width;
    const H = () => canvas.getBoundingClientRect().height;

    const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const colors: Record<string, string[]> = {
      idle: ['rgba(148,163,184,0.3)', 'rgba(148,163,184,0.1)'],
      listening: ['rgba(52,211,153,0.8)', 'rgba(16,185,129,0.4)'],
      thinking: ['rgba(251,191,36,0.8)', 'rgba(245,158,11,0.4)'],
      speaking: ['rgba(96,165,250,0.8)', 'rgba(59,130,246,0.4)'],
    };

    const glowColors: Record<string, string> = {
      idle: 'rgba(148,163,184,0.05)',
      listening: 'rgba(52,211,153,0.15)',
      thinking: 'rgba(251,191,36,0.15)',
      speaking: 'rgba(96,165,250,0.15)',
    };

    let t = 0;
    const draw = () => {
      const w = W();
      const h = H();
      ctx.clearRect(0, 0, w, h);
      t += 0.03;

      let amplitude = 0.15;
      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        amplitude = Math.max(0.08, Math.min(0.7, avg / 120));
      } else if (status === 'thinking') {
        amplitude = 0.2 + Math.sin(t * 2) * 0.1;
      } else if (status === 'speaking') {
        amplitude = 0.25 + Math.sin(t * 3) * 0.15;
      } else if (status === 'idle') {
        amplitude = 0.05 + Math.sin(t) * 0.03;
      }

      // Glow background
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.4);
      grad.addColorStop(0, glowColors[status]);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Draw multiple wave layers
      const [c1, c2] = colors[status];
      for (let layer = 0; layer < 3; layer++) {
        const layerAmp = amplitude * (1 - layer * 0.25);
        const freq = 3 + layer;
        const phase = t + layer * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        for (let x = 0; x <= w; x += 2) {
          const norm = x / w;
          // Envelope: fade edges
          const env = Math.sin(norm * Math.PI);
          const y = h / 2 + Math.sin(norm * freq * Math.PI + phase) * env * h * layerAmp * 0.4;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = layer === 0 ? c1 : c2;
        ctx.lineWidth = 2.5 - layer * 0.7;
        ctx.stroke();
      }

      // Center orb
      const orbRadius = 6 + amplitude * 20;
      const orbGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, orbRadius);
      orbGrad.addColorStop(0, colors[status][0]);
      orbGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, orbRadius, 0, Math.PI * 2);
      ctx.fillStyle = orbGrad;
      ctx.fill();

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, analyser]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  );
};

export default LiveAudioWave;
