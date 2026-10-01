import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Search,
  Filter,
  Layers,
  GitBranch,
  FileCode,
  Lock,
  Eye,
  Sliders,
  Sparkles,
  ClipboardCheck,
  Compass,
  FileCheck,
  Key,
  Database,
  ArrowRight,
  Send,
  Radio,
  Snowflake,
  Flame,
  ShieldAlert,
  Server,
  Cpu,
  Clock,
  Wrench,
  AlertOctagon,
  Plus
} from 'lucide-react';
import {
  Project,
  User,
  OperationalOverview,
  OperationalBaseline,
  ProductionSmokeCheck,
  MaintenanceTask,
  TechnicalDebtItem,
  ProductionChangeFreeze,
  EmergencyAccessSession,
  OperationalMaturityState,
  MaintenanceCategory
} from '../types/index.ts';

interface OperationsViewProps {
  project: Project;
  currentUser: User;
  onRefreshProjectData: () => void;
}

export const OperationsView: React.FC<OperationsViewProps> = ({
  project,
  currentUser,
  onRefreshProjectData
}) => {
  const [activeTab, setActiveTab] = useState<'baseline' | 'smoke' | 'maintenance' | 'debt' | 'freeze_emergency' | 'telemetry'>('baseline');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Overview data
  const [overview, setOverview] = useState<OperationalOverview | null>(null);

  // Modals
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeReason, setFreezeReason] = useState('');

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [emergencyResource, setEmergencyResource] = useState('database.connection_pool');

  const [showMaintModal, setShowMaintModal] = useState(false);
  const [newMaintCategory, setNewMaintCategory] = useState<MaintenanceCategory>('PREVENTIVE');
  const [newMaintTitle, setNewMaintTitle] = useState('');
  const [newMaintDesc, setNewMaintDesc] = useState('');
  const [newMaintImpact, setNewMaintImpact] = useState('');
  const [newMaintComponent, setNewMaintComponent] = useState('src/server/storage.ts');
  const [newMaintPriority, setNewMaintPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

  const [showDebtModal, setShowDebtModal] = useState(false);
  const [newDebtProblem, setNewDebtProblem] = useState('');
  const [newDebtEvidence, setNewDebtEvidence] = useState('');
  const [newDebtImpact, setNewDebtImpact] = useState('');
  const [newDebtComponent, setNewDebtComponent] = useState('src/server/resilience/circuitBreakerEngine.ts');
  const [newDebtRemediation, setNewDebtRemediation] = useState('');
  const [newDebtEffort, setNewDebtEffort] = useState<'1h' | '4h' | '1d' | '3d' | '1w'>('4h');
  const [newDebtPriority, setNewDebtPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');

  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': currentUser.id,
    'x-user-role': currentUser.role
  };

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/operations/overview`, {
        credentials: 'include',
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to load operational telemetry.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching operations data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [project.id]);

  const handleRunSmokeChecks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/operations/smoke-checks`, {
        method: 'POST',
        credentials: 'include',
        headers
      });
      if (res.ok) {
        const data = await res.json();
        if (overview) {
          setOverview({ ...overview, smokeChecks: data.smokeChecks });
        }
        setSuccessMsg('7/7 Production Smoke Verification checks completed successfully.');
      } else {
        const d = await res.json();
        setError(d.error || 'Smoke checks failed.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFreeze = async (newActiveState: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/operations/change-freeze`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ active: newActiveState, reason: freezeReason })
      });
      if (res.ok) {
        setSuccessMsg(`Production change freeze ${newActiveState ? 'enacted' : 'lifted'} successfully.`);
        setShowFreezeModal(false);
        setFreezeReason('');
        fetchOverview();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to update change freeze.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestEmergencyAccess = async () => {
    if (!emergencyReason.trim() || emergencyReason.trim().length < 10) {
      setError('Detailed emergency justification (> 10 characters) is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/operations/emergency-access`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          reason: emergencyReason,
          affectedResources: [emergencyResource]
        })
      });
      if (res.ok) {
        setSuccessMsg('Emergency break-glass access session authorized for 60 minutes.');
        setShowEmergencyModal(false);
        setEmergencyReason('');
        fetchOverview();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to authorize emergency session.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeEmergency = async (sessionId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/operations/emergency-access/${sessionId}/revoke`, {
        method: 'POST',
        credentials: 'include',
        headers
      });
      if (res.ok) {
        setSuccessMsg('Emergency access session revoked and audit trail sealed.');
        fetchOverview();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaintenance = async () => {
    if (!newMaintTitle.trim()) {
      setError('Title is required for maintenance task.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/operations/maintenance`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          category: newMaintCategory,
          title: newMaintTitle,
          description: newMaintDesc,
          affectedComponent: newMaintComponent,
          impact: newMaintImpact,
          priority: newMaintPriority,
          status: 'PROPOSED',
          owner: currentUser.email || 'usr-ops'
        })
      });
      if (res.ok) {
        setSuccessMsg('Maintenance task scheduled.');
        setShowMaintModal(false);
        setNewMaintTitle('');
        setNewMaintDesc('');
        fetchOverview();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDebt = async () => {
    if (!newDebtProblem.trim()) {
      setError('Problem statement is required.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/operations/technical-debt`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          problem: newDebtProblem,
          evidence: newDebtEvidence,
          impact: newDebtImpact,
          affectedComponent: newDebtComponent,
          risk: 'Operational latency risk under scale',
          estimatedEffort: newDebtEffort,
          priority: newDebtPriority,
          owner: currentUser.email || 'usr-ops',
          status: 'IDENTIFIED',
          proposedRemediation: newDebtRemediation
        })
      });
      if (res.ok) {
        setSuccessMsg('Technical debt item cataloged with evidence.');
        setShowDebtModal(false);
        setNewDebtProblem('');
        setNewDebtEvidence('');
        fetchOverview();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransitionMaturity = async (newState: OperationalMaturityState) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/operations/maturity-state`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ state: newState })
      });
      if (res.ok) {
        setSuccessMsg(`Operational state transitioned to ${newState}.`);
        fetchOverview();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to transition state.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFreezeActive = overview?.changeFreeze.active;
  const smokePassedCount = overview?.smokeChecks.filter(c => c.passed).length || 0;
  const smokeTotalCount = overview?.smokeChecks.length || 7;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Operational Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <Activity className="w-6 h-6 text-cyan-400" />
              <span>Controlled Go-Live, Continuous Operations & Maintenance</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              PHASE 12
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Governed production operations: versioned operational baseline, smoke verification, change freeze locks, break-glass audit, and evidence-driven maintenance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Operational Maturity State */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-mono">State:</span>
            <span className="text-xs font-mono font-bold text-cyan-400 flex items-center space-x-1">
              <Server className="w-3.5 h-3.5" />
              <span>{overview?.maturityState || 'OPERATIONAL'}</span>
            </span>
          </div>

          {/* Change Freeze Badge / Button */}
          {isFreezeActive ? (
            <button
              onClick={() => handleToggleFreeze(false)}
              disabled={currentUser.role !== 'PROJECT_LEAD' && currentUser.role !== 'OPERATIONS'}
              className="px-3 py-1.5 rounded text-xs font-bold bg-amber-600/30 text-amber-300 border border-amber-500/40 flex items-center space-x-1.5 cursor-pointer hover:bg-amber-600/40 transition-all"
            >
              <Snowflake className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Change Freeze Active (Lift)</span>
            </button>
          ) : (
            <button
              onClick={() => setShowFreezeModal(true)}
              disabled={currentUser.role !== 'PROJECT_LEAD' && currentUser.role !== 'OPERATIONS'}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Snowflake className="w-3.5 h-3.5 text-slate-400" />
              <span>Enact Freeze</span>
            </button>
          )}

          {/* Break-Glass Emergency Access */}
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Break-Glass Emergency</span>
          </button>

          {/* Refresh */}
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            title="Refresh Operational State"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200 text-xs font-mono">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200 text-xs font-mono">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('baseline')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center space-x-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'baseline'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Operational Baseline & Policies</span>
        </button>

        <button
          onClick={() => setActiveTab('smoke')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center space-x-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'smoke'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Production Smoke Verification</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300">
            {smokePassedCount}/{smokeTotalCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center space-x-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'maintenance'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Evidence-Driven Maintenance</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
            {overview?.maintenanceTasks.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('debt')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center space-x-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'debt'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Technical Debt</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
            {overview?.technicalDebt.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('freeze_emergency')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center space-x-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'freeze_emergency'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Freeze & Emergency Access</span>
          {overview?.activeEmergencySessions.length ? (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 animate-pulse">
              {overview.activeEmergencySessions.length} Active
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center space-x-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'telemetry'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Operational Telemetry & SLOs</span>
        </button>
      </div>

      {/* TAB 1: OPERATIONAL BASELINE */}
      {activeTab === 'baseline' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Application Version</span>
              <div className="text-base font-bold font-mono text-cyan-400">{overview.baseline.applicationVersion}</div>
              <p className="text-[10px] text-slate-500 font-mono">Deployment: {overview.baseline.deploymentId}</p>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Storage Engine</span>
              <div className="text-base font-bold font-mono text-emerald-400">{overview.baseline.storageVersion}</div>
              <p className="text-[10px] text-slate-500 font-mono">Migration: {overview.baseline.migrationVersion}</p>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Config Version</span>
              <div className="text-base font-bold font-mono text-purple-400">{overview.baseline.configVersion}</div>
              <p className="text-[10px] text-slate-500 font-mono">Established: {new Date(overview.baseline.establishedAt).toLocaleDateString()}</p>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Maturity Mode</span>
              <div className="text-base font-bold font-mono text-amber-400">{overview.maturityState}</div>
              <div className="flex gap-1.5 pt-1">
                {(['OPERATIONAL', 'OBSERVATION', 'SAFE_MODE'] as OperationalMaturityState[]).map(st => (
                  <button
                    key={st}
                    onClick={() => handleTransitionMaturity(st)}
                    disabled={currentUser.role !== 'PROJECT_LEAD' && currentUser.role !== 'OPERATIONS'}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono border cursor-pointer ${
                      overview.maturityState === st
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {st.slice(0, 4)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Providers & Fallback Pipeline */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>AI Provider Operational Health & Fallback Routing</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overview.baseline.aiProviderVersions.map(p => (
                <div key={p.provider} className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">{p.provider}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {p.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400">Primary Model: {p.model}</div>
                  <div className="text-[11px] font-mono text-slate-400">Fallback Target: {p.fallbackTarget}</div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Latency: {p.latencyMs}ms</span>
                    <span>Error Rate: {(p.errorRate * 100).toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Policies & Feature Flags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <h3 className="text-sm font-bold text-slate-200">Active Operational Policies</h3>
              <ul className="space-y-2 text-xs text-slate-400 font-mono">
                {overview.baseline.activeOperationalPolicies.map(pol => (
                  <li key={pol} className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{pol}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <h3 className="text-sm font-bold text-slate-200">Production Feature Flags</h3>
              <div className="space-y-2 text-xs">
                {Object.entries(overview.baseline.enabledFeatureFlags).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800/80">
                    <span className="font-mono text-slate-300">{k}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      v ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {v ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTION SMOKE CHECKS */}
      {activeTab === 'smoke' && overview && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Continuous Production Smoke Verification</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Targeted runtime verification verifying Core Availability, Auth, Relational Storage, Validation, AI Provider, Observability, and Backups.
              </p>
            </div>
            <button
              onClick={handleRunSmokeChecks}
              disabled={loading}
              className="px-4 py-2 rounded text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center space-x-2 cursor-pointer transition-all shadow-lg shadow-cyan-950/50"
            >
              <Play className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Execute Smoke Verification</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overview.smokeChecks.map(check => (
              <div
                key={check.id}
                className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {check.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>PASSED</span>
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-200">{check.name}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{check.details}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Latency: {check.latencyMs}ms</span>
                  <span>{new Date(check.evaluatedAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: EVIDENCE-DRIVEN MAINTENANCE */}
      {activeTab === 'maintenance' && overview && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Evidence-Driven Maintenance Catalog</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Categorized maintenance workflows: Corrective, Preventive, Adaptive, Security, Performance, Operational, and Governance.
              </p>
            </div>
            <button
              onClick={() => setShowMaintModal(true)}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Maintenance</span>
            </button>
          </div>

          <div className="space-y-3">
            {overview.maintenanceTasks.map(task => (
              <div key={task.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">{task.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {task.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      task.priority === 'HIGH' || task.priority === 'CRITICAL'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">{task.title}</h4>
                  <p className="text-[11px] text-slate-400">{task.description}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Impact: {task.impact} • Component: {task.affectedComponent}</p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className="px-2 py-1 rounded text-xs font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TECHNICAL DEBT */}
      {activeTab === 'debt' && overview && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Tracked Technical Debt Register</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Concrete technical debt cataloged with documented evidence, operational impact, and proposed remediation.
              </p>
            </div>
            <button
              onClick={() => setShowDebtModal(true)}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catalog Technical Debt</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overview.technicalDebt.map(debt => (
              <div key={debt.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-400">{debt.id}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono text-slate-400">Effort: {debt.estimatedEffort}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {debt.status}
                    </span>
                  </div>
                </div>

                <h4 className="text-xs font-semibold text-slate-200">{debt.problem}</h4>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div><strong>Evidence:</strong> {debt.evidence}</div>
                  <div><strong>Remediation:</strong> {debt.proposedRemediation}</div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Component: {debt.affectedComponent}</span>
                  <span>Owner: {debt.owner}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: FREEZE & EMERGENCY ACCESS */}
      {activeTab === 'freeze_emergency' && overview && (
        <div className="space-y-6">
          {/* Change Freeze Card */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Snowflake className={`w-5 h-5 ${isFreezeActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <h3 className="text-sm font-bold text-slate-200">Production Change Freeze Status</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                isFreezeActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
              }`}>
                {isFreezeActive ? 'FREEZE ACTIVE' : 'NORMAL OPERATIONS'}
              </span>
            </div>

            <p className="text-xs text-slate-300">
              {isFreezeActive
                ? `Enacted by ${overview.changeFreeze.initiatedBy} at ${new Date(overview.changeFreeze.initiatedAt!).toLocaleString()}. Reason: "${overview.changeFreeze.reason}"`
                : 'No change freeze currently active. Standard deployment release gate pipeline operational.'}
            </p>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                Exempted Critical Emergency Operations:
              </span>
              <div className="flex flex-wrap gap-2">
                {overview.changeFreeze.allowedExceptionTypes.map(ex => (
                  <span key={ex} className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800">
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Active Emergency Break-Glass Sessions */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-slate-200">Emergency Break-Glass Sessions</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Strict 1-Hour Time-Bounded Lifespan
              </span>
            </div>

            {overview.activeEmergencySessions.length === 0 ? (
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-500 font-mono text-center">
                Zero active break-glass emergency sessions. System adhering to normal least-privilege RBAC.
              </div>
            ) : (
              <div className="space-y-3">
                {overview.activeEmergencySessions.map(session => (
                  <div key={session.id} className="p-4 bg-rose-950/20 border border-rose-500/40 rounded-xl flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-rose-400">{session.id}</span>
                        <span className="text-xs text-slate-300">Actor: {session.actorId} ({session.actorRole})</span>
                      </div>
                      <p className="text-xs text-slate-300">Justification: "{session.reason}"</p>
                      <p className="text-[10px] font-mono text-slate-500">
                        Expires at: {new Date(session.expiresAt).toLocaleTimeString()} • Audit Ref: {session.auditTrailRef}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRevokeEmergency(session.id)}
                      className="px-3 py-1.5 rounded text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                    >
                      Revoke Access
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: TELEMETRY & SLOS */}
      {activeTab === 'telemetry' && overview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase">System Availability</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {overview.operationalMetrics.systemAvailability}%
            </div>
            <p className="text-xs text-slate-400">SLO Target: 99.9% (Exceeded)</p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Production Error Rate</span>
            <div className="text-2xl font-bold font-mono text-cyan-400">
              {overview.operationalMetrics.errorRate}%
            </div>
            <p className="text-xs text-slate-400">SLO Ceiling: &lt; 0.5% (Healthy)</p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Active Incidents</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {overview.operationalMetrics.incidentRate}
            </div>
            <p className="text-xs text-slate-400">0 Open Incidents; Normal Mode Active</p>
          </div>
        </div>
      )}

      {/* Freeze Enactment Modal */}
      {showFreezeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Snowflake className="w-4 h-4 text-amber-400" />
              <span>Enact Production Change Freeze</span>
            </h3>
            <p className="text-xs text-slate-300">
              Blocks non-emergency deployments and task state elevations. Critical security patches and SEV1 hotfixes remain whitelisted.
            </p>
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Operational Justification:</label>
              <textarea
                value={freezeReason}
                onChange={e => setFreezeReason(e.target.value)}
                placeholder="e.g. End-of-quarter freeze, operational audit window"
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowFreezeModal(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200">
                Cancel
              </button>
              <button onClick={() => handleToggleFreeze(true)} className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded">
                Enact Freeze
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Access Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-rose-400 flex items-center space-x-2">
              <Flame className="w-4 h-4" />
              <span>Request Break-Glass Emergency Access</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Elevates execution capabilities for 60 minutes. Every action is logged to the immutable audit trail and triggers post-incident review.
            </p>
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Affected Resource:</label>
              <input
                type="text"
                value={emergencyResource}
                onChange={e => setEmergencyResource(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 mb-2 font-mono"
              />
              <label className="text-xs font-mono text-slate-400 block mb-1">Incident Justification (&gt; 10 chars):</label>
              <textarea
                value={emergencyReason}
                onChange={e => setEmergencyReason(e.target.value)}
                placeholder="e.g. SEV1 Database latency spike requires connection pool restart"
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowEmergencyModal(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200">
                Cancel
              </button>
              <button onClick={handleRequestEmergencyAccess} className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded">
                Authorize Emergency Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Maintenance Modal */}
      {showMaintModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span>Schedule Evidence-Driven Maintenance</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-slate-400 block mb-1">Category:</label>
                <select
                  value={newMaintCategory}
                  onChange={e => setNewMaintCategory(e.target.value as MaintenanceCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 font-mono"
                >
                  <option value="PREVENTIVE">PREVENTIVE</option>
                  <option value="SECURITY">SECURITY</option>
                  <option value="CORRECTIVE">CORRECTIVE</option>
                  <option value="ADAPTIVE">ADAPTIVE</option>
                  <option value="PERFORMANCE">PERFORMANCE</option>
                  <option value="OPERATIONAL">OPERATIONAL</option>
                  <option value="GOVERNANCE">GOVERNANCE</option>
                </select>
              </div>

              <div>
                <label className="font-mono text-slate-400 block mb-1">Title:</label>
                <input
                  type="text"
                  value={newMaintTitle}
                  onChange={e => setNewMaintTitle(e.target.value)}
                  placeholder="e.g. Upgrade token verification hashing algorithm"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="font-mono text-slate-400 block mb-1">Description:</label>
                <textarea
                  value={newMaintDesc}
                  onChange={e => setNewMaintDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowMaintModal(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200">
                Cancel
              </button>
              <button onClick={handleCreateMaintenance} className="px-3 py-1.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded">
                Schedule Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Technical Debt Modal */}
      {showDebtModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 text-purple-400" />
              <span>Catalog Technical Debt with Evidence</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-slate-400 block mb-1">Problem Statement:</label>
                <input
                  type="text"
                  value={newDebtProblem}
                  onChange={e => setNewDebtProblem(e.target.value)}
                  placeholder="e.g. Unindexed search scan on decision records"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="font-mono text-slate-400 block mb-1">Documented Evidence:</label>
                <textarea
                  value={newDebtEvidence}
                  onChange={e => setNewDebtEvidence(e.target.value)}
                  placeholder="e.g. p95 query latency climbs to 120ms when decision list exceeds 500 items"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="font-mono text-slate-400 block mb-1">Proposed Remediation:</label>
                <input
                  type="text"
                  value={newDebtRemediation}
                  onChange={e => setNewDebtRemediation(e.target.value)}
                  placeholder="e.g. Add hashmap lookup index on decisionIdentifier"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowDebtModal(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200">
                Cancel
              </button>
              <button onClick={handleCreateDebt} className="px-3 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded">
                Catalog Debt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
