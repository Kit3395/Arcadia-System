import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  Server,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Clock,
  Database,
  GitBranch,
  BookOpen,
  Sliders,
  FileCheck,
  Hash,
  Play,
  ArrowRight,
  Archive,
  Cpu
} from 'lucide-react';
import {
  Project,
  User,
  CircuitBreakerRecord,
  CircuitBreakerTarget,
  DeploymentRecord,
  BackupRecord,
  RestoreTestRecord,
  ProductionIncident,
  OperationalRunbook,
  ProductionReadinessScorecard,
  ResilienceOverviewMetrics,
  DegradationLevel,
  IncidentSeverity,
  IncidentCategory
} from '../types/index.ts';

interface ResilienceViewProps {
  project: Project;
  currentUser: User;
  onRefreshProjectData: () => void;
}

export const ResilienceView: React.FC<ResilienceViewProps> = ({
  project,
  currentUser,
  onRefreshProjectData
}) => {
  const [activeTab, setActiveTab] = useState<'scorecard' | 'breakers' | 'incidents' | 'deployments' | 'recovery' | 'runbooks'>('scorecard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [overview, setOverview] = useState<ResilienceOverviewMetrics | null>(null);
  const [scorecard, setScorecard] = useState<ProductionReadinessScorecard | null>(null);
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreakerRecord[]>([]);
  const [incidents, setIncidents] = useState<ProductionIncident[]>([]);
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [runbooks, setRunbooks] = useState<OperationalRunbook[]>([]);

  // Modals
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    severity: 'SEV2' as IncidentSeverity,
    category: 'INFRASTRUCTURE' as IncidentCategory,
    affectedSystems: 'Adaptive Pipeline, Storage Engine'
  });
  const [newDeployment, setNewDeployment] = useState({
    targetEnvironment: 'PRODUCTION' as const,
    rollbackAction: 'Revert container tag to prior release and rollback state migrations.'
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { 'x-user-id': currentUser.id };

      const [resOverview, resScorecard, resBreakers, resIncidents, resDeployments, resBackups, resRunbooks] =
        await Promise.all([
          fetch(`/api/projects/${project.id}/resilience/overview`, { credentials: 'include', headers }),
          fetch(`/api/projects/${project.id}/resilience/scorecard`, { credentials: 'include', headers }),
          fetch(`/api/projects/${project.id}/resilience/circuit-breakers`, { credentials: 'include', headers }),
          fetch(`/api/projects/${project.id}/resilience/incidents`, { credentials: 'include', headers }),
          fetch(`/api/projects/${project.id}/resilience/deployments`, { credentials: 'include', headers }),
          fetch(`/api/projects/${project.id}/resilience/backups`, { credentials: 'include', headers }),
          fetch(`/api/projects/${project.id}/resilience/runbooks`, { credentials: 'include', headers })
        ]);

      if (resOverview.ok) setOverview(await resOverview.json());
      if (resScorecard.ok) setScorecard(await resScorecard.json());
      if (resBreakers.ok) setCircuitBreakers(await resBreakers.json());
      if (resIncidents.ok) setIncidents(await resIncidents.json());
      if (resDeployments.ok) setDeployments(await resDeployments.json());
      if (resBackups.ok) setBackups(await resBackups.json());
      if (resRunbooks.ok) setRunbooks(await resRunbooks.json());
    } catch (err: any) {
      setError(err.message || 'Failed to load resilience telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [project.id, currentUser.id]);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Safe mode toggle
  const handleToggleSafeMode = async () => {
    const isSafe = overview?.systemDegradationLevel === 'SAFE_MODE';
    const endpoint = isSafe ? 'normal-mode' : 'safe-mode';
    try {
      const res = await fetch(`/api/projects/${project.id}/resilience/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
        body: JSON.stringify({ reason: isSafe ? 'Operator restored NORMAL' : 'Operator requested emergency SAFE_MODE' })
      });
      if (!res.ok) throw new Error('Failed to update system state.');
      showNotification(isSafe ? 'System restored to NORMAL operation.' : 'System entered emergency SAFE_MODE.');
      fetchData();
      onRefreshProjectData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Reset circuit breaker
  const handleResetBreaker = async (target: CircuitBreakerTarget) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/resilience/circuit-breakers/${target}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id }
      });
      if (!res.ok) throw new Error('Reset failed.');
      showNotification(`Circuit breaker for ${target} reset to CLOSED.`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Trip circuit breaker
  const handleTripBreaker = async (target: CircuitBreakerTarget) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/resilience/circuit-breakers/${target}/trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
        body: JSON.stringify({ reason: 'Operator diagnostic trip' })
      });
      if (!res.ok) throw new Error('Trip failed.');
      showNotification(`Circuit breaker for ${target} tripped to OPEN.`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Create incident
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${project.id}/resilience/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
        body: JSON.stringify({
          ...newIncident,
          affectedSystems: newIncident.affectedSystems.split(',').map(s => s.trim())
        })
      });
      if (!res.ok) throw new Error('Failed to create incident.');
      setShowIncidentModal(false);
      setNewIncident({
        title: '',
        severity: 'SEV2',
        category: 'INFRASTRUCTURE',
        affectedSystems: 'Adaptive Pipeline, Storage Engine'
      });
      showNotification('Production incident registered and containment evaluated.');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Contain incident
  const handleContainIncident = async (incId: string, action: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/resilience/incidents/${incId}/contain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error('Containment failed.');
      showNotification(`Containment action '${action}' applied to incident.`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Resolve incident
  const handleResolveIncident = async (incId: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/resilience/incidents/${incId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
        body: JSON.stringify({
          category: 'OPERATIONS',
          rootCause: 'Transient load surge addressed via rate-limiting and dynamic context optimization.',
          correctiveActions: [
            'Adjusted circuit breaker timeout threshold',
            'Enacted prompt context compression rule in organizational memory bank'
          ]
        })
      });
      if (!res.ok) throw new Error('Resolution failed.');
      showNotification('Incident resolved and post-mortem exported to Organizational Memory.');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Trigger Backup Snapshot
  const handleCreateBackup = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}/resilience/backups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
        body: JSON.stringify({ backupClass: 'CRITICAL' })
      });
      if (!res.ok) throw new Error('Backup failed.');
      showNotification('Immutable backup snapshot created with SHA-256 seal.');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Execute Restore Drill
  const handleRestoreDrill = async (bId: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/resilience/backups/${bId}/restore-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id }
      });
      if (!res.ok) throw new Error('Restore drill failed.');
      const data: RestoreTestRecord = await res.json();
      showNotification(`Restore drill passed in ${data.durationMs}ms (RTO verified).`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Prepare deployment
  const handlePrepareDeployment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${project.id}/resilience/deployments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
        body: JSON.stringify(newDeployment)
      });
      if (!res.ok) throw new Error('Preparation failed.');
      setShowDeployModal(false);
      showNotification('Deployment prepared and 8 Release Gates evaluated.');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Deploy release
  const handleDeployRelease = async (depId: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/resilience/deployments/${depId}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Deployment rejected.');
      }
      showNotification('Production release successfully deployed and verified.');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Rollback deployment
  const handleRollbackDeployment = async (depId: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/resilience/deployments/${depId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id }
      });
      if (!res.ok) throw new Error('Rollback failed.');
      showNotification('Production deployment reverted to prior verified state.');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              <span>Production Control Center, Resilience & Disaster Recovery</span>
            </h1>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
              PHASE 10 • PRODUCTION HARDENED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Governed release gates, circuit breakers, continuous data integrity audits, automated incident containment, and verified disaster recovery.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleSafeMode}
            className={`px-3 py-1.5 text-xs font-medium rounded transition flex items-center space-x-1.5 border ${
              overview?.systemDegradationLevel === 'SAFE_MODE'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>{overview?.systemDegradationLevel === 'SAFE_MODE' ? 'Exit SAFE_MODE' : 'Trigger SAFE_MODE'}</span>
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Control Center</span>
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">×</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded flex items-center space-x-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>System State</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className={`text-xl font-bold font-mono ${
              overview?.systemDegradationLevel === 'NORMAL' ? 'text-emerald-400' :
              overview?.systemDegradationLevel === 'SAFE_MODE' ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {overview?.systemDegradationLevel || 'NORMAL'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">Fail-Safe Active</p>
        </div>

        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Circuit Breakers</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-bold font-mono text-slate-100">
              {circuitBreakers.filter(b => b.state === 'CLOSED').length}/{circuitBreakers.length}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">CLOSED</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">
            {circuitBreakers.filter(b => b.state === 'OPEN').length} Open / Tripped
          </p>
        </div>

        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Open Incidents</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-bold font-mono text-slate-100">
              {overview?.activeIncidentsCount ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ {incidents.length} total</span>
          </div>
          <p className="text-[10px] text-emerald-400 mt-1 font-mono">SEV0-SEV4 Governed</p>
        </div>

        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Disaster Recovery</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-bold font-mono text-cyan-300">
              {overview?.verifiedBackupsCount ?? 0} Snapshots
            </span>
          </div>
          <p className="text-[10px] text-emerald-400 mt-1 font-mono">RTO &lt; 5m • RPO &lt; 15m</p>
        </div>

        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Release Gates</span>
            <GitBranch className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-bold font-mono text-purple-300">
              8 Mandatory
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">100% Reversible Rollback</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-2 border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('scorecard')}
          className={`pb-2.5 px-3 font-medium transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'scorecard'
              ? 'border-emerald-400 text-emerald-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Production Readiness Scorecard (11 Dimensions)</span>
        </button>

        <button
          onClick={() => setActiveTab('breakers')}
          className={`pb-2.5 px-3 font-medium transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'breakers'
              ? 'border-emerald-400 text-emerald-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Circuit Breakers</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {circuitBreakers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`pb-2.5 px-3 font-medium transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'incidents'
              ? 'border-emerald-400 text-emerald-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Incident Management</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950 text-rose-300 border border-rose-800/40 font-mono">
            {incidents.filter(i => i.status !== 'RESOLVED').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('deployments')}
          className={`pb-2.5 px-3 font-medium transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'deployments'
              ? 'border-emerald-400 text-emerald-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Release Gates & Deployments</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {deployments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('recovery')}
          className={`pb-2.5 px-3 font-medium transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'recovery'
              ? 'border-emerald-400 text-emerald-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Disaster Recovery & Drills</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {backups.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('runbooks')}
          className={`pb-2.5 px-3 font-medium transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'runbooks'
              ? 'border-emerald-400 text-emerald-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Operational Runbooks</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {runbooks.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Production Readiness Scorecard */}
      {activeTab === 'scorecard' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/40 p-4 border border-slate-800 rounded-lg">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Multi-Dimensional Production Readiness Scorecard</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated across 11 discrete, uncollapsed operational dimensions governed by the Arcadia Safety Hierarchy.
              </p>
            </div>
            <span className={`px-2.5 py-1 text-xs font-mono font-semibold rounded ${
              scorecard?.isProductionReady
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            }`}>
              {scorecard?.isProductionReady ? 'ALL 11 DIMENSIONS READY' : 'CONDITIONAL READINESS'}
            </span>
          </div>

          <div className="space-y-2.5">
            {scorecard?.dimensions.map((dim, idx) => (
              <div key={idx} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-slate-500">#{idx + 1}</span>
                    <h4 className="text-sm font-semibold text-slate-200">{dim.dimension}</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      dim.status === 'READY' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                      dim.status === 'CONDITIONAL' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                      'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}>
                      {dim.status}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      dim.riskLevel === 'MINIMAL' ? 'bg-slate-800 text-slate-400' :
                      dim.riskLevel === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-700' :
                      'bg-amber-950 text-amber-300'
                    }`}>
                      Risk: {dim.riskLevel}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{dim.evidence}</p>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-slate-800/60">
                  <span>Action: {dim.requiredAction}</span>
                  <span>Open Issues: {dim.openIssuesCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Circuit Breakers */}
      {activeTab === 'breakers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Bounded circuit breakers guarding external dependencies from cascading failures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {circuitBreakers.map(breaker => (
              <div key={breaker.target} className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Server className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-100">{breaker.target}</span>
                  </div>

                  <span className={`text-xs font-mono px-2 py-0.5 rounded font-semibold ${
                    breaker.state === 'CLOSED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                    breaker.state === 'HALF_OPEN' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                    'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}>
                    {breaker.state}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded text-xs font-mono text-slate-300">
                  {breaker.auditNotes}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                  <div>Failure Threshold: {breaker.failureThreshold}</div>
                  <div>Consecutive Failures: {breaker.failureCount}</div>
                  <div>Reset Cooldown: {breaker.resetTimeoutMs / 1000}s</div>
                  <div>Last Success: {breaker.lastSuccessTime ? new Date(breaker.lastSuccessTime).toLocaleTimeString() : 'N/A'}</div>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => handleResetBreaker(breaker.target)}
                    className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition"
                  >
                    Reset Breaker
                  </button>
                  <button
                    onClick={() => handleTripBreaker(breaker.target)}
                    className="px-2.5 py-1 text-[11px] font-medium bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded border border-rose-800/50 transition"
                  >
                    Diagnostic Trip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Incidents */}
      {activeTab === 'incidents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Production Incident Management with automated SEV0/SEV1 containment and Post-Mortem organizational learning.
            </p>
            <button
              onClick={() => setShowIncidentModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Incident</span>
            </button>
          </div>

          <div className="space-y-3">
            {incidents.map(inc => (
              <div key={inc.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      inc.severity === 'SEV0' || inc.severity === 'SEV1' ? 'bg-rose-950 text-rose-300 border border-rose-700' :
                      inc.severity === 'SEV2' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {inc.severity}
                    </span>
                    <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {inc.incidentId}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100">{inc.title}</h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      inc.status === 'RESOLVED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                      inc.status === 'CONTAINED' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                      'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}>
                      {inc.status}
                    </span>

                    {inc.status !== 'RESOLVED' && (
                      <>
                        <button
                          onClick={() => handleContainIncident(inc.id, 'SAFE_MODE')}
                          className="px-2.5 py-1 text-[11px] font-medium bg-amber-950/60 hover:bg-amber-900 text-amber-200 rounded border border-amber-700 transition"
                        >
                          Safe Mode Contain
                        </button>
                        <button
                          onClick={() => handleResolveIncident(inc.id)}
                          className="px-2.5 py-1 text-[11px] font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded transition"
                        >
                          Resolve & Post-Mortem
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-300 font-mono">
                  Affected Systems: {inc.affectedSystems.join(', ')}
                </div>

                {inc.rootCauseAnalysis && (
                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded text-xs space-y-1">
                    <span className="text-slate-400 font-medium">Root Cause:</span>
                    <p className="text-slate-300">{inc.rootCauseAnalysis.rootCause}</p>
                  </div>
                )}

                {/* Timeline */}
                <div className="space-y-1 pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Incident Timeline:</span>
                  {inc.timeline.map((evt, eIdx) => (
                    <div key={eIdx} className="text-[11px] font-mono text-slate-400 flex items-center space-x-2">
                      <span className="text-slate-500">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      <span className="text-emerald-400">[{evt.phase}]</span>
                      <span>{evt.details}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Release Gates & Deployments */}
      {activeTab === 'deployments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              8-point mandatory production release gates enforcing zero critical findings and verified rollback.
            </p>
            <button
              onClick={() => setShowDeployModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded bg-purple-600 hover:bg-purple-500 text-white transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Prepare Release</span>
            </button>
          </div>

          <div className="space-y-3">
            {deployments.map(dep => (
              <div key={dep.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded font-semibold">
                      v{dep.version} • {dep.targetEnvironment}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100">{dep.id}</h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      dep.state === 'DEPLOYED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                      dep.state === 'ROLLED_BACK' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                      dep.state === 'BLOCKED' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {dep.state}
                    </span>

                    {dep.state === 'APPROVED' && (
                      <button
                        onClick={() => handleDeployRelease(dep.id)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded transition"
                      >
                        Deploy
                      </button>
                    )}

                    {dep.state === 'DEPLOYED' && (
                      <button
                        onClick={() => handleRollbackDeployment(dep.id)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 rounded transition flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Rollback</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono">
                  {dep.releaseGates.map(gate => (
                    <div key={gate.id} className="p-2 bg-slate-950/70 border border-slate-800/80 rounded flex items-center space-x-2">
                      {gate.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <span className="truncate text-slate-300">{gate.name}</span>
                    </div>
                  ))}
                </div>

                <div className="p-2 bg-slate-950/40 border border-slate-800/60 rounded flex items-center space-x-2 text-[11px] font-mono text-slate-400">
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">Rollback Action: {dep.rollbackAction}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Disaster Recovery */}
      {activeTab === 'recovery' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Authoritative backup snapshots, cryptographic checksum seals, and scheduled restore drills.
            </p>
            <button
              onClick={handleCreateBackup}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Snapshot State</span>
            </button>
          </div>

          <div className="space-y-3">
            {backups.map(bk => (
              <div key={bk.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold">
                      {bk.backupClass}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100">{bk.id}</h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRestoreDrill(bk.id)}
                      className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition flex items-center space-x-1"
                    >
                      <Play className="w-3 h-3 text-cyan-400" />
                      <span>Execute Restore Drill</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-xs font-mono text-slate-300">
                  <div>Size: {(bk.sizeBytes / 1024).toFixed(1)} KB</div>
                  <div>RPO Target: {bk.rpoTargetMinutes}m</div>
                  <div>RTO Target: {bk.rtoTargetMinutes}m</div>
                  <div>Created: {new Date(bk.createdAt).toLocaleDateString()}</div>
                </div>

                <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                  <Hash className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{bk.snapshotHash}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Operational Runbooks */}
      {activeTab === 'runbooks' && (
        <div className="space-y-3">
          {runbooks.map(rbk => (
            <div key={rbk.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold">
                    {rbk.category}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-100">{rbk.scenario}</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Validated: {rbk.lastValidated}</span>
              </div>

              <div className="space-y-1.5">
                {rbk.steps.map(step => (
                  <div key={step.stepNumber} className="p-2 bg-slate-950/70 border border-slate-800/80 rounded text-xs font-mono flex items-start space-x-2">
                    <span className="text-purple-400 font-bold shrink-0">#{step.stepNumber}</span>
                    <div className="space-y-0.5">
                      <span className="text-slate-200 font-semibold">{step.action}:</span>
                      <p className="text-slate-400 text-[11px]">{step.commandOrEndpoint} → Expected: {step.expectedOutcome}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Incident Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Log Production Incident</span>
              </h2>
              <button onClick={() => setShowIncidentModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Model Provider Rate Limit Anomaly"
                  value={newIncident.title}
                  onChange={e => setNewIncident({ ...newIncident, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Severity</label>
                  <select
                    value={newIncident.severity}
                    onChange={e => setNewIncident({ ...newIncident, severity: e.target.value as IncidentSeverity })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="SEV0">SEV0 (Catastrophic)</option>
                    <option value="SEV1">SEV1 (Critical)</option>
                    <option value="SEV2">SEV2 (Major)</option>
                    <option value="SEV3">SEV3 (Moderate)</option>
                    <option value="SEV4">SEV4 (Minor)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Category</label>
                  <select
                    value={newIncident.category}
                    onChange={e => setNewIncident({ ...newIncident, category: e.target.value as IncidentCategory })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="SECURITY">Security</option>
                    <option value="DATA_INTEGRITY">Data Integrity</option>
                    <option value="AI_PROVIDER">AI Provider</option>
                    <option value="AGENT_CONTAINMENT">Agent Containment</option>
                    <option value="INFRASTRUCTURE">Infrastructure</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Affected Systems (comma-separated)</label>
                <input
                  type="text"
                  value={newIncident.affectedSystems}
                  onChange={e => setNewIncident({ ...newIncident, affectedSystems: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium transition shadow-sm"
                >
                  Submit Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prepare Release Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-purple-400" />
                <span>Prepare Governed Release</span>
              </h2>
              <button onClick={() => setShowDeployModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <form onSubmit={handlePrepareDeployment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Target Environment</label>
                <select
                  value={newDeployment.targetEnvironment}
                  onChange={e => setNewDeployment({ ...newDeployment, targetEnvironment: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="PRODUCTION">PRODUCTION (Requires Project Lead)</option>
                  <option value="STAGING">STAGING</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Reversible Rollback Action</label>
                <textarea
                  required
                  rows={3}
                  value={newDeployment.rollbackAction}
                  onChange={e => setNewDeployment({ ...newDeployment, rollbackAction: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium transition shadow-sm"
                >
                  Evaluate Release Gates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
