import React, { useState } from 'react';
import { Scroll, Shield, Layers, Ban, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProjectConstitution, Project, User } from '../types/index.ts';

interface ConstitutionViewProps {
  project: Project | null;
  constitution: ProjectConstitution | null;
  onUpdateConstitution: (newConfig: any) => Promise<void>;
  currentUser: User | null;
}

export const ConstitutionView: React.FC<ConstitutionViewProps> = ({
  project,
  constitution,
  onUpdateConstitution,
  currentUser
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [frontend, setFrontend] = useState(constitution?.approvedStack.frontend || '');
  const [backend, setBackend] = useState(constitution?.approvedStack.backend || '');
  const [database, setDatabase] = useState(constitution?.approvedStack.database || '');
  const [securityClassification, setSecurityClassification] = useState(constitution?.securityClassification || 'CONFIDENTIAL');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!constitution || !project) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        No active Project Constitution found for this project.
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    try {
      await onUpdateConstitution({
        approvedStack: {
          frontend,
          backend,
          database,
          deployment: constitution.approvedStack.deployment
        },
        securityClassification
      });
      setIsEditing(false);
      setStatusMsg({ type: 'success', text: `Project Constitution successfully updated to version v${constitution.version + 1}.` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update constitution.' });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <Scroll className="w-5 h-5 text-indigo-400" />
              <span>Project Constitution</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              v{constitution.version}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40">
              RATIFIED & AUTHORITATIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Governing rules, approved technology stack, and security classifications for {project.name}.
          </p>
        </div>

        {currentUser?.role === 'PROJECT_LEAD' || currentUser?.role === 'ARCHITECT' ? (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3.5 py-1.5 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            {isEditing ? 'Cancel Edit' : 'Propose Constitution Amendment'}
          </button>
        ) : (
          <div className="text-[11px] text-slate-500 font-mono italic">
            Read-only (Requires PROJECT_LEAD or ARCHITECT role to amend)
          </div>
        )}
      </div>

      {statusMsg && (
        <div className={`p-3 rounded text-xs flex items-center space-x-2 ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSave} className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-200">Amend Technical Boundaries</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Approved Frontend</label>
              <input
                type="text"
                value={frontend}
                onChange={(e) => setFrontend(e.target.value)}
                className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Approved Backend</label>
              <input
                type="text"
                value={backend}
                onChange={(e) => setBackend(e.target.value)}
                className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Approved Database</label>
              <input
                type="text"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="text-slate-300 font-semibold">Security Classification Tier</label>
            <select
              value={securityClassification}
              onChange={(e) => setSecurityClassification(e.target.value as any)}
              className="w-full md:w-64 px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 outline-none font-mono"
            >
              <option value="PUBLIC">PUBLIC</option>
              <option value="INTERNAL">INTERNAL</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL</option>
              <option value="SENSITIVE">SENSITIVE</option>
              <option value="REGULATED">REGULATED</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
            >
              Commit Constitution v{constitution.version + 1}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Approved Tech Stack */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5 space-y-3">
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-200">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Approved Technology Stack</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Frontend Core:</span>
                <span className="text-slate-200 font-mono font-medium">{constitution.approvedStack.frontend}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Backend Architecture:</span>
                <span className="text-slate-200 font-mono font-medium">{constitution.approvedStack.backend}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Database & Persistence:</span>
                <span className="text-slate-200 font-mono font-medium">{constitution.approvedStack.database}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Deployment Engine:</span>
                <span className="text-slate-200 font-mono font-medium">{constitution.approvedStack.deployment}</span>
              </div>
            </div>
          </div>

          {/* Security & Compliance Tiers */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5 space-y-3">
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-200">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Security & Compliance Framework</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Security Classification:</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  {constitution.securityClassification}
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Compliance Profiles:</span>
                <div className="flex space-x-1">
                  {constitution.complianceProfiles.map(p => (
                    <span key={p} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Prohibited Dependencies:</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {constitution.prohibitedDependencies.map(dep => (
                    <span key={dep} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-950/40 text-rose-300 border border-rose-800/40 flex items-center space-x-1">
                      <Ban className="w-2.5 h-2.5" />
                      <span>{dep}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Governance Rules & Scope Locks */}
          <div className="lg:col-span-2 rounded-lg border border-slate-800 bg-slate-900/40 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
              Ratified Governance Rules
            </h3>
            <div className="space-y-2">
              {constitution.governanceRules.map((rule) => (
                <div key={rule.id} className="p-3 rounded border border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-indigo-400 font-bold">{rule.id}</span>
                    <span className="text-slate-200">{rule.rule}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                    Enforcement: {rule.enforcement}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
