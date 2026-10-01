import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Eye, Shield, Cpu, RefreshCw } from 'lucide-react';

interface Arcadia3DSceneProps {
  interactive?: boolean;
  className?: string;
  onSelectFocus?: (focus: 'core' | 'governance' | 'mesh') => void;
}

export const Arcadia3DScene: React.FC<Arcadia3DSceneProps> = ({
  className = '',
  onSelectFocus
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeFocus, setActiveFocus] = useState<'core' | 'governance' | 'mesh'>('governance');
  const [webglError, setWebglError] = useState(false);
  const [fps, setFps] = useState(60);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch {
      setWebglError(true);
      return;
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060911, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 5.8);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 3.0);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    const coreLight = new THREE.PointLight(0x10b981, 4.0, 12, 1.5);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    // --- Master Group ---
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 1. Central Crystalline Polyhedron (Authoritative State Core)
    const coreGeometry = new THREE.IcosahedronGeometry(0.85, 0);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      emissive: 0x064e3b,
      emissiveIntensity: 0.6,
      metalness: 0.85,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      wireframe: false
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    masterGroup.add(coreMesh);

    // Wireframe overlay on core for crisp architectural facets
    const coreWireGeo = new THREE.WireframeGeometry(coreGeometry);
    const coreWireMat = new THREE.LineBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.45,
      linewidth: 1
    });
    const coreWire = new THREE.LineSegments(coreWireGeo, coreWireMat);
    coreMesh.add(coreWire);

    // Inner Glowing Singularity
    const innerGeo = new THREE.OctahedronGeometry(0.4, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x6ee7b7,
      wireframe: true
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    coreMesh.add(innerMesh);

    // 2. Concentric Kinetic Gimbal Rings
    // Ring 1: Constitutional Governance & RBAC Shield
    const ring1Geo = new THREE.TorusGeometry(1.65, 0.022, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.2
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    masterGroup.add(ring1);

    // Ring 2: Continuous Assurance & Verification Scope
    const ring2Geo = new THREE.TorusGeometry(2.15, 0.018, 16, 120);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.35,
      metalness: 0.9,
      roughness: 0.25
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 3;
    masterGroup.add(ring2);

    // Ring 3: Autonomous Execution & Immutable Audit Outbox
    const ring3Geo = new THREE.TorusGeometry(2.65, 0.014, 16, 140);
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x059669,
      emissiveIntensity: 0.3,
      metalness: 0.95,
      roughness: 0.15
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.y = Math.PI / 4;
    masterGroup.add(ring3);

    // 3. Orbital Satellites / Verification Nodes on Rings
    const satGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const satMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const satMatGold = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const satMatEmerald = new THREE.MeshBasicMaterial({ color: 0x10b981 });

    const sat1 = new THREE.Mesh(satGeo, satMat);
    sat1.position.set(1.65, 0, 0);
    ring1.add(sat1);

    const sat2 = new THREE.Mesh(satGeo, satMatGold);
    sat2.position.set(0, 2.15, 0);
    ring2.add(sat2);

    const sat3 = new THREE.Mesh(satGeo, satMatEmerald);
    sat3.position.set(0, 0, 2.65);
    ring3.add(sat3);

    // 4. Distributed Constellation Nodes (Traceability & Agent Mesh)
    const particleCount = 280;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 2.4 + Math.random() * 2.2;
      particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = r * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.035,
      transparent: true,
      opacity: 0.65
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    masterGroup.add(particles);

    // Outer Geodesic Bounding Grid (The Arcadia Architectural Envelope)
    const boundsGeo = new THREE.IcosahedronGeometry(3.6, 1);
    const boundsWire = new THREE.WireframeGeometry(boundsGeo);
    const boundsMat = new THREE.LineBasicMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.18
    });
    const boundsMesh = new THREE.LineSegments(boundsWire, boundsMat);
    masterGroup.add(boundsMesh);

    // --- Mouse & Touch Interaction ---
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = nx;
      mouseY = ny;

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        targetRotationY += deltaX * 0.005;
        targetRotationX += deltaY * 0.005;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Target Camera Targets based on focus
    const targetCameraPos = new THREE.Vector3(0, 1.2, 5.8);
    const updateFocusCamera = (focus: 'core' | 'governance' | 'mesh') => {
      if (focus === 'core') {
        targetCameraPos.set(0, 0.4, 2.9);
      } else if (focus === 'governance') {
        targetCameraPos.set(0, 1.2, 5.8);
      } else if (focus === 'mesh') {
        targetCameraPos.set(2.2, 2.4, 6.4);
      }
    };

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth || 800;
      const nh = container.clientHeight || 600;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      // FPS Calculation
      frameCount++;
      if (currentTime - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = currentTime;
      }

      const delta = (currentTime - lastTime) * 0.001;
      lastTime = currentTime;

      // Base Rotations
      coreMesh.rotation.y += delta * 0.35;
      coreMesh.rotation.x += delta * 0.15;
      innerMesh.rotation.y -= delta * 0.7;

      ring1.rotation.z += delta * 0.45;
      ring1.rotation.y += delta * 0.2;

      ring2.rotation.z -= delta * 0.35;
      ring2.rotation.x += delta * 0.25;

      ring3.rotation.y += delta * 0.5;
      ring3.rotation.z += delta * 0.15;

      particles.rotation.y += delta * 0.05;
      boundsMesh.rotation.y -= delta * 0.08;

      // Core Breathing Light
      coreLight.intensity = 3.2 + Math.sin(currentTime * 0.003) * 1.0;

      // Smooth Mouse Parallax / Drag Lerp
      masterGroup.rotation.y += (targetRotationY + mouseX * 0.3 - masterGroup.rotation.y) * 0.05;
      masterGroup.rotation.x += (targetRotationX - mouseY * 0.2 - masterGroup.rotation.x) * 0.05;

      // Smooth Camera Lerp
      camera.position.lerp(targetCameraPos, 0.04);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Store update function on DOM element for trigger
    (container as any).__updateFocus = updateFocusCamera;

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animationFrameId);

      renderer.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      ring3Geo.dispose();
      ring3Mat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      boundsGeo.dispose();
      boundsMat.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleFocusChange = (focus: 'core' | 'governance' | 'mesh') => {
    setActiveFocus(focus);
    if (onSelectFocus) onSelectFocus(focus);
    if (mountRef.current && (mountRef.current as any).__updateFocus) {
      (mountRef.current as any).__updateFocus(focus);
    }
  };

  return (
    <div className={`relative overflow-hidden select-none bg-slate-950 ${className}`}>
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Fallback if WebGL fails */}
      {webglError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950 p-6 text-center">
          <div className="max-w-md p-6 rounded border border-slate-800 bg-slate-900/90 text-slate-300">
            <Shield className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <div className="font-semibold text-slate-100 mb-1">Arcadia Architectural Visualizer</div>
            <div className="text-xs text-slate-400">Hardware WebGL acceleration disabled. Spatial lattice active in headless deterministic mode.</div>
          </div>
        </div>
      )}

      {/* Spatial HUD Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-auto">
        <div className="px-3 py-1.5 rounded bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-100">ARCADIA LATTICE</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">{fps} FPS</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400">18 INVARIANTS ACTIVE</span>
        </div>
      </div>

      {/* Perspective / Spatial Focus Controls */}
      <div className="absolute bottom-4 left-4 right-4 sm:right-auto z-10 pointer-events-auto flex items-center space-x-1.5 p-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-800">
        <button
          type="button"
          onClick={() => handleFocusChange('core')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeFocus === 'core'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Core State</span>
        </button>

        <button
          type="button"
          onClick={() => handleFocusChange('governance')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeFocus === 'governance'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Governance Rings</span>
        </button>

        <button
          type="button"
          onClick={() => handleFocusChange('mesh')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeFocus === 'mesh'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Agent Mesh</span>
        </button>
      </div>

      {/* Interactive Helper Text */}
      <div className="hidden md:flex absolute bottom-4 right-4 z-10 pointer-events-none items-center space-x-2 text-[10px] font-mono text-slate-500">
        <RefreshCw className="w-3 h-3 animate-spin text-slate-600" />
        <span>Click & drag to inspect 3D lattice geometry</span>
      </div>
    </div>
  );
};
