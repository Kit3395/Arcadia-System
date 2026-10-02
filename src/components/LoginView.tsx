import React, { useState, Suspense, lazy } from 'react';
const Arcadia3DScene = lazy(() => import('./Arcadia3DScene.tsx').then(m => ({ default: m.Arcadia3DScene })));
import { Shield, Lock, Key, ArrowRight, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { User, Organization } from '../types/index.ts';

interface CorporatePersonnel {
  id: string;
  email: string;
  fullName: string;
  role: string;
  title: string;
  clearanceLevel: string;
  department: string;
}

interface LoginViewProps {
  onLoginSuccess: (user: User, token: string, organization?: Organization) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>('usr-lead');
  // Access keys are never prefilled — each operator enters their own key.
  const [accessKey, setAccessKey] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const corporatePersonnelList: CorporatePersonnel[] = [
    {
      id: 'usr-lead',
      email: 'lead@arcadia.dev',
      fullName: 'Dr. Evelyn Vance',
      role: 'PROJECT_LEAD',
      title: 'Executive Project Lead & Governance Director',
      clearanceLevel: 'LEVEL 5 (ALPHA-GOVERNANCE)',
      department: 'Executive Governance Council'
    },
    {
      id: 'usr-arch',
      email: 'architect@arcadia.dev',
      fullName: 'Marcus Chen',
      role: 'ARCHITECT',
      title: 'Principal Enterprise Systems Architect',
      clearanceLevel: 'LEVEL 4 (ARCHITECTURE-CORE)',
      department: 'Core Infrastructure & Architecture'
    },
    {
      id: 'usr-sec',
      email: 'security@arcadia.dev',
      fullName: 'Agent Ward',
      role: 'SECURITY',
      title: 'Chief Information Security Officer',
      clearanceLevel: 'LEVEL 5 (CYBER-CONTAINMENT)',
      department: 'Security & Threat Containment'
    },
    {
      id: 'usr-dev',
      email: 'dev@arcadia.dev',
      fullName: 'Sarah Connor',
      role: 'DEVELOPER',
      title: 'Staff Platform Systems Engineer',
      clearanceLevel: 'LEVEL 3 (PLATFORM-EXECUTION)',
      department: 'Platform Engineering & Runtime'
    },
    {
      id: 'usr-ops',
      email: 'ops@arcadia.dev',
      fullName: 'Elena Rostova',
      role: 'OPERATIONS',
      title: 'Site Reliability & Operations Director',
      clearanceLevel: 'LEVEL 4 (OPERATIONS-SRE)',
      department: 'Autonomous Operations & SRE'
    },
    {
      id: 'usr-client',
      email: 'auditor@arcadia.dev',
      fullName: 'Arthur Pendelton',
      role: 'CLIENT',
      title: 'Lead Compliance & Audit Officer',
      clearanceLevel: 'LEVEL 3 (INSPECTION-AUDIT)',
      department: 'Regulatory Compliance & Audit'
    }
  ];

  const activePersonnel = corporatePersonnelList.find(p => p.id === selectedPersonnelId) || corporatePersonnelList[0];

  const handlePersonnelSelect = (personnel: CorporatePersonnel) => {
    setSelectedPersonnelId(personnel.id);
    setErrorMessage(null);
    // Never auto-fill access keys — the operator must enter their own.
    setAccessKey('');
  };

  const handleAuthenticate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAuthenticating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activePersonnel.id,
          email: activePersonnel.email,
          accessKey
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Authentication rejected by security policy.');
        setIsAuthenticating(false);
        return;
      }

      // Store token and notify parent
      localStorage.setItem('arcadia_session_token', data.token);
      localStorage.setItem('arcadia_user_id', data.user.id);
      onLoginSuccess(data.user, data.token, data.organization);
    } catch {
      setErrorMessage('Network connection to Arcadia Security Gateway failed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col lg:flex-row bg-[#060911] text-slate-100 overflow-hidden select-none">
      {/* LEFT PANE: Interactive 3D Arcadia Lattice Visualization */}
      <div className="relative w-full lg:w-7/12 h-[38vh] lg:h-full border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-950 flex flex-col">
        {/* Top Header Watermark */}
        <div className="absolute top-4 left-6 z-20 flex items-center space-x-3 pointer-events-none">
          <div className="w-9 h-9 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center backdrop-blur-sm">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-wider text-slate-100 leading-tight">ARCADIA</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">Autonomous Orchestration Platform</div>
          </div>
        </div>

        {/* 3D Scene Viewport — lazy-loaded so the login form renders instantly */}
        <div className="flex-1 w-full h-full relative">
          <Suspense fallback={<div className="w-full h-full bg-slate-950 animate-pulse" />}>
            <Arcadia3DScene className="w-full h-full" />
          </Suspense>
        </div>

        {/* Bottom Explanatory Strip */}
        <div className="hidden lg:flex px-6 py-3 border-t border-slate-900 bg-slate-950/80 backdrop-blur-sm items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive 3D Spatial Geometry · Authoritative Core & Governance Rings</span>
          </div>
          <div className="flex items-center space-x-3 font-mono text-[11px] text-slate-500">
            <span>SOC2 TYPE II</span>
            <span>·</span>
            <span>PCI-DSS</span>
            <span>·</span>
            <span>EVIDENCE FIRST</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Enterprise Access Gateway Form */}
      <div className="w-full lg:w-5/12 flex-1 h-[62vh] lg:h-full overflow-y-auto bg-[#0a0f1d] flex flex-col justify-between p-6 sm:p-10">
        <div className="max-w-md w-full mx-auto space-y-6">
          {/* Insignia & Security Classification */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="/src/assets/images/arcadia_corporate_insignia_1790869554298.jpg"
                alt="Arcadia Insignia"
                className="w-10 h-10 rounded border border-slate-700/80 object-cover shadow-lg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-xl font-bold text-slate-100 tracking-tight">Access Gateway</h1>
                <p className="text-xs text-slate-400">Authorized Personnel Authentication</p>
              </div>
            </div>

            <div className="px-2.5 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] font-mono uppercase tracking-wider flex items-center space-x-1.5">
              <Lock className="w-3 h-3" />
              <span>LOCKDOWN ACTIVE</span>
            </div>
          </div>

          {/* Security Advisory Notice */}
          <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs text-slate-300 space-y-1">
            <div className="flex items-center space-x-1.5 text-amber-400 font-medium">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>Restricted Corporate Production Boundary</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Access restricted to verified team members. All session actions, task authorizations, and state transitions are cryptographically signed and stored in the immutable audit ledger.
            </p>
          </div>

          {/* Authorized Personnel Switcher */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Select Authorized Personnel</span>
              <span className="text-emerald-400 font-normal">Active RBAC Matrix</span>
            </label>

            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {corporatePersonnelList.map(personnel => {
                const isSelected = personnel.id === selectedPersonnelId;
                return (
                  <button
                    key={personnel.id}
                    type="button"
                    onClick={() => handlePersonnelSelect(personnel)}
                    className={`p-2.5 rounded-lg border text-left transition-all relative ${
                      isSelected
                        ? 'border-emerald-500/60 bg-emerald-950/30 text-slate-100 shadow-sm'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs truncate">{personnel.fullName}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{personnel.title}</div>
                    <div className="text-[9px] font-mono text-emerald-400/80 mt-1">{personnel.role}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Persona Details */}
          <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-900/40 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Target Account:</span>
              <span className="font-mono text-slate-200">{activePersonnel.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Clearance:</span>
              <span className="font-mono text-amber-300 text-[11px]">{activePersonnel.clearanceLevel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Department:</span>
              <span className="text-slate-300 truncate">{activePersonnel.department}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAuthenticate} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Corporate Access Key / Secret
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500/60 transition-colors pr-10"
                  placeholder="Enter corporate access key..."
                  required
                />
                <Key className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isAuthenticating ? (
                <span>Verifying Security Clearance...</span>
              ) : (
                <>
                  <span>Authenticate & Enter Arcadia</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Security Badges */}
        <div className="mt-6 pt-4 border-t border-slate-900/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>ARCADIA CORE v12.0.0</span>
          <span>STRICT LEAST PRIVILEGE</span>
          <span>100% VERIFIED</span>
        </div>
      </div>
    </div>
  );
};
