import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Shield } from 'lucide-react';

interface Arcadia3DSceneProps {
  interactive?: boolean;
  className?: string;
  onSelectFocus?: (focus: 'core' | 'governance' | 'mesh') => void;
}

interface NodePoint {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  label?: string;
  tier: number; // 1: Core, 2: Governance, 3: Mesh
}

export const Arcadia3DScene: React.FC<Arcadia3DSceneProps> = ({
  className = '',
  onSelectFocus
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });
  const [activeFocus, setActiveFocus] = useState<'core' | 'governance' | 'mesh'>('governance');
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleFocusChange = (focus: 'core' | 'governance' | 'mesh') => {
    setActiveFocus(focus);
    if (onSelectFocus) onSelectFocus(focus);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseRef.current = { x, y, active: true };

    // Subtle 3D tilt for the central emblem (minimal & hardware accelerated)
    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;
    setTilt({
      x: -normY * 12,
      y: normX * 14
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.active = false;
    setTilt({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = container.clientWidth);
    let height = (canvas.height = container.clientHeight);

    // Initialize structured architectural nodes
    const nodes: NodePoint[] = [];
    const centerX = width / 2;
    const centerY = height / 2;

    // Rings layout
    const rings = [
      { radius: 70, count: 6, color: '#10b981', tier: 1 },    // Core Truth
      { radius: 140, count: 12, color: '#38bdf8', tier: 2 },  // Governance
      { radius: 220, count: 18, color: '#818cf8', tier: 3 },  // Assurance
      { radius: 300, count: 24, color: '#64748b', tier: 3 }   // Agent Mesh
    ];

    rings.forEach(({ radius, count, color, tier }) => {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const ox = centerX + Math.cos(angle) * radius;
        const oy = centerY + Math.sin(angle) * radius;
        nodes.push({
          x: ox,
          y: oy,
          originX: ox,
          originY: oy,
          vx: 0,
          vy: 0,
          radius: tier === 1 ? 2.8 : tier === 2 ? 2.2 : 1.8,
          color,
          tier
        });
      }
    });

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const curCenterX = width / 2;
      const curCenterY = height / 2;

      // Draw subtle orbital guide circles
      ctx.lineWidth = 1;
      rings.forEach(({ radius }) => {
        ctx.beginPath();
        ctx.arc(curCenterX, curCenterY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.stroke();
      });

      // Update and draw node positions reacting to cursor
      nodes.forEach((node) => {
        // Distance to cursor
        if (mouse.active) {
          const dx = mouse.x - node.x;
          const dy = mouse.y - node.y;
          const dist = Math.sqrt(dx * dy + dy * dy);
          const maxDist = 180;

          if (dist < maxDist && dist > 1) {
            // Gentle magnetic attraction towards cursor
            const force = (1 - dist / maxDist) * 1.8;
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }
        }

        // Spring return to origin position
        const homeDx = node.originX - node.x;
        const homeDy = node.originY - node.y;
        node.vx += homeDx * 0.04;
        node.vy += homeDy * 0.04;

        // Damping / friction
        node.vx *= 0.82;
        node.vy *= 0.82;

        node.x += node.vx;
        node.y += node.vy;
      });

      // Draw connections between nodes in proximity
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 85) {
            const alpha = (1 - dist / 85) * 0.18;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.stroke();
          }
        }
      }

      // Draw interactive cursor rays to closest nodes
      if (mouse.active) {
        nodes.forEach((node) => {
          const dx = mouse.x - node.x;
          const dy = mouse.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.4;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(node.x, node.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
            ctx.stroke();
          }
        });

        // Subtle cursor aura
        const aura = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 120);
        aura.addColorStop(0, 'rgba(16, 185, 129, 0.08)');
        aura.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 120, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render node dots
      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
      });

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    const handleResize = () => {
      if (!container) return;
      width = canvas.width = container.clientWidth;
      height = canvas.height = container.clientHeight;
      const ncx = width / 2;
      const ncy = height / 2;

      let idx = 0;
      rings.forEach(({ radius, count }) => {
        for (let i = 0; i < count; i++) {
          if (idx < nodes.length) {
            const angle = (i / count) * Math.PI * 2;
            nodes[idx].originX = ncx + Math.cos(angle) * radius;
            nodes[idx].originY = ncy + Math.sin(angle) * radius;
            nodes[idx].x = nodes[idx].originX;
            nodes[idx].y = nodes[idx].originY;
            nodes[idx].vx = 0;
            nodes[idx].vy = 0;
            idx++;
          }
        }
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-full overflow-hidden select-none bg-[#070b14] flex items-center justify-center ${className}`}
    >
      {/* Reactive 2D Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Central Emblem with Subtle Cursor Parallax Tilt (Hardware Accelerated, Zero Lag) */}
      <div
        className="relative z-10 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 shadow-2xl transition-transform duration-150 ease-out pointer-events-none"
        style={{
          transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
        }}
      >
        <div className="relative w-20 h-20 flex items-center justify-center mb-3">
          {/* Subtle Outer Concentric Ring */}
          <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-pulse" />
          <div className="absolute -inset-2 rounded-full border border-cyan-500/20 border-dashed" />
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/40 flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 text-emerald-400" />
          </div>
        </div>

        <div className="text-center">
          <div className="font-bold tracking-wider text-slate-100 text-sm">ARCADIA CORE</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">AUTONOMOUS ORCHESTRATION</div>
        </div>

        <div className="mt-3 flex items-center space-x-1.5 text-[9px] font-mono text-emerald-400/90 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>INVARIANTS ACTIVE</span>
        </div>
      </div>

      {/* Perspective / Domain Focus Controls */}
      <div className="absolute bottom-4 left-4 right-4 sm:right-auto z-10 pointer-events-auto flex items-center space-x-1.5 p-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => handleFocusChange('core')}
          className={`px-3 py-1.5 rounded font-medium transition-colors ${
            activeFocus === 'core'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Core State
        </button>

        <button
          type="button"
          onClick={() => handleFocusChange('governance')}
          className={`px-3 py-1.5 rounded font-medium transition-colors ${
            activeFocus === 'governance'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Governance
        </button>

        <button
          type="button"
          onClick={() => handleFocusChange('mesh')}
          className={`px-3 py-1.5 rounded font-medium transition-colors ${
            activeFocus === 'mesh'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Agent Mesh
        </button>
      </div>

      {/* Interactive Telemetry Indicator */}
      <div className="hidden sm:flex absolute bottom-4 right-4 z-10 pointer-events-none items-center space-x-2 text-[10px] font-mono text-slate-500">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        <span>REACTIVE CURSOR FIELD · ZERO LATENCY</span>
      </div>
    </div>
  );
};
