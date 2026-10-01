import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RefreshCw,
  Lock,
  Unlock,
  GitBranch,
  Layers,
  FileCode,
  FileText,
  Activity,
  ArrowRight,
  Filter,
  Check,
  AlertOctagon,
  Eye,
  Sliders,
  Database,
  Cpu,
  Clock
} from 'lucide-react';
import {
  Project,
  User,
  UniversalTaskSpecification,
  ValidationContract,
  ValidationGate,
  ValidationFailure,
  ValidationRule,
  SecurityFinding,
  ThreatModel,
  TrustBoundary,
  DataFlowRecord,
  ComplianceControl,
  DriftRecord,
  RegressionRunRecord,
  ValidationSeverity
} from '../types/index.ts';

interface ValidationViewProps {
  project: Project | null;
  tasks: UniversalTaskSpecification[];
  currentUser: User | null;
  onRefreshProjectData: () => void;
}

type SubTab = 'lifecycle' | 'security' | 'drift' | 'regression';

export const ValidationView: React.FC<ValidationViewProps> = ({
  project,
  tasks,
  currentUser,
  onRefreshProjectData
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('lifecycle');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selected Task for Validation / Scans
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  // 1. Validation Lifecycle State
  const [contract, setContract] = useState<ValidationContract | null>(null);
  const [gates, setGates] = useState<ValidationGate[]>([]);
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [waiveModalFailure, setWaiveModalFailure] = useState<ValidationFailure | null>(null);
  const [waiverReason, setWaiverReason] = useState<string>('');
  const [isWaiving, setIsWaiving] = useState<boolean>(false);

  // 2. Security & Threat State
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [threatModels, setThreatModels] = useState<ThreatModel[]>([]);
  const [trustBoundaries, setTrustBoundaries] = useState<TrustBoundary[]>([]);
  const [dataFlows, setDataFlows] = useState<DataFlowRecord[]>([]);
  const [complianceControls, setComplianceControls] = useState<ComplianceControl[]>([]);
  const [securityFilter, setSecurityFilter] = useState<'ALL' | 'OPEN' | 'STOP_CONDITIONS'>('ALL');
  const [resolveFindingModal, setResolveFindingModal] = useState<SecurityFinding | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [resolutionStatus, setResolutionStatus] = useState<'RESOLVED' | 'RISK_ACCEPTED' | 'MITIGATED'>('RESOLVED');

  // 3. Drift State
  const [driftRecords, setDriftRecords] = useState<DriftRecord[]>([]);
  const [driftFilter, setDriftFilter] = useState<'ALL' | 'DETECTED' | 'UNAUTHORIZED'>('ALL');
  const [driftModalRecord, setDriftModalRecord] = useState<DriftRecord | null>(null);
  const [driftAction, setDriftAction] = useState<'REVERT_CHANGES' | 'UPDATE_TRUTH' | 'BLOCK_TASK' | 'RETRY_CONSTRAINED'>('REVERT_CHANGES');
  const [driftNotes, setDriftNotes] = useState<string>('');

  // 4. Regression Simulator State
  const [regressionRuns, setRegressionRuns] = useState<RegressionRunRecord[]>([]);
  const [simulatedFiles, setSimulatedFiles] = useState<string>('src/server/validation/validationEngine.ts\nsrc/server/storage.ts');
  const [impactAnalysis, setImpactAnalysis] = useState<{
    affectedComponents: string[];
    affectedRequirements: string[];
    requiredTestSuites: string[];
    riskLevel: string;
    recommendedOrder: string[];
  } | null>(null);

  // Auto-select first task if none selected
  useEffect(() => {
    if (!selectedTaskId && tasks.length > 0) {
      setSelectedTaskId(tasks[0].taskId);
    }
  }, [tasks, selectedTaskId]);

  // Fetch all Phase 7 sub-resources for current project
  const fetchValidationData = useCallback(async () => {
    if (!project) return;
    setIsLoading(true);
    try {
      const [
        gatesRes,
        rulesRes,
        findingsRes,
        threatsRes,
        boundariesRes,
        flowsRes,
        controlsRes,
        driftRes,
        regressionRes
      ] = await Promise.all([
        fetch(`/api/projects/${project.id}/validation/gates`),
        fetch(`/api/projects/${project.id}/validation/rules`),
        fetch(`/api/projects/${project.id}/security/findings`),
        fetch(`/api/projects/${project.id}/security/threat-models`),
        fetch(`/api/projects/${project.id}/security/trust-boundaries`),
        fetch(`/api/projects/${project.id}/security/data-flows`),
        fetch(`/api/projects/${project.id}/security/compliance-controls`),
        fetch(`/api/projects/${project.id}/drift/records`),
        fetch(`/api/projects/${project.id}/regression/runs`)
      ]);

      if (gatesRes.ok) setGates(await gatesRes.json());
      if (rulesRes.ok) setRules(await rulesRes.json());
      if (findingsRes.ok) setFindings(await findingsRes.json());
      if (threatsRes.ok) setThreatModels(await threatsRes.json());
      if (boundariesRes.ok) setTrustBoundaries(await boundariesRes.json());
      if (flowsRes.ok) setDataFlows(await flowsRes.json());
      if (controlsRes.ok) setComplianceControls(await controlsRes.json());
      if (driftRes.ok) setDriftRecords(await driftRes.json());
      if (regressionRes.ok) setRegressionRuns(await regressionRes.json());
    } catch (err: any) {
      console.error('Failed to fetch validation data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [project]);

  useEffect(() => {
    fetchValidationData();
  }, [fetchValidationData]);

  // Run initial regression analysis on default simulated files
  useEffect(() => {
    if (!project) return;
    const fileList = simulatedFiles.split('\n').map(s => s.trim()).filter(Boolean);
    fetch(`/api/projects/${project.id}/regression/impact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changedFiles: fileList })
    })
      .then(res => res.json())
      .then(data => setImpactAnalysis(data))
      .catch(() => {});
  }, [project, simulatedFiles]);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 5000);
  };

  // ==========================================================================
  // ACTION HANDLERS
  // ==========================================================================

  // 1. Run 7-Gate Validation Pipeline
  const handleRunValidation = async () => {
    if (!project || !selectedTaskId) return;
    setIsLoading(true);
    try {
      const task = tasks.find(t => t.taskId === selectedTaskId);
      const res = await fetch(`/api/projects/${project.id}/validation/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: selectedTaskId,
          evidence: {
            changedFiles: task?.relevantFiles || [
              { path: 'src/server/validation/validationEngine.ts', action: 'MODIFY', diffSnippet: '// Gate implementation' }
            ],
            testRuns: [{ suite: 'validation.test.ts', passed: true, durationMs: 420 }],
            lintPassed: true,
            securityScanPassed: true
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification('error', data.message || 'Validation pipeline execution failed.');
      } else {
        setContract(data);
        if (data.gates) setGates(data.gates);
        showNotification(
          data.status === 'PASSED' ? 'success' : 'error',
          `Validation Pipeline executed: Result is ${data.status} with ${data.failures?.length || 0} failure(s).`
        );
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Execution error');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Waive Validation Failure (Governed)
  const handleWaiveFailure = async () => {
    if (!contract || !waiveModalFailure || !project) return;
    if (waiveModalFailure.severity === 'CRITICAL') {
      showNotification('error', 'CRITICAL severity validation failures are strictly prohibited from waiver under Project Governance.');
      return;
    }

    if (currentUser?.role !== 'PROJECT_LEAD' && currentUser?.role !== 'SECURITY') {
      showNotification('error', `Role '${currentUser?.role}' lacks authority to waive validation failures. Requires Project Lead or Security.`);
      return;
    }

    setIsWaiving(true);
    try {
      const res = await fetch(`/api/validation/contracts/${contract.id}/waive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          failureId: waiveModalFailure.id,
          reason: waiverReason
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification('error', data.message || 'Failed to waive failure.');
      } else {
        setContract(data);
        setWaiveModalFailure(null);
        setWaiverReason('');
        showNotification('success', `Validation failure ${waiveModalFailure.id} successfully waived under Governance authority.`);
        fetchValidationData();
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Waiver network error.');
    } finally {
      setIsWaiving(false);
    }
  };

  // 3. Promote Task State (Gate 7 Authoritative Promotion)
  const handlePromoteTask = async () => {
    if (!project || !selectedTaskId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/validation/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: selectedTaskId })
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification('error', data.message || 'State promotion rejected by Gate 7.');
      } else {
        showNotification('success', `Task ${selectedTaskId} successfully PROMOTED to Authoritative State!`);
        onRefreshProjectData();
        fetchValidationData();
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Promotion network error.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Run Security Scan
  const handleRunSecurityScan = async () => {
    if (!project || !selectedTaskId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/security/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: selectedTaskId,
          evidence: {
            diff: 'const apiKey = process.env.SERVICE_TOKEN;\nconst sanitized = sanitizeInput(query);',
            filesChanged: ['src/server/api.ts']
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification('error', data.message || 'Security scan failed.');
      } else {
        showNotification(
          data.isStopConditionTriggered ? 'error' : 'success',
          `Security Scan Completed. Stop condition: ${data.isStopConditionTriggered ? 'TRIGGERED' : 'CLEAR'}. Findings: ${data.findings?.length || 0}.`
        );
        fetchValidationData();
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Scan error');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Resolve Security Finding
  const handleResolveFinding = async () => {
    if (!resolveFindingModal || !project) return;
    if (currentUser?.role === 'DEVELOPER' && resolutionStatus === 'RESOLVED') {
      showNotification('error', 'Invariant violation: Developers cannot self-certify resolution of Security Findings without Project Lead or Security review.');
      return;
    }

    try {
      const res = await fetch(`/api/security/findings/${resolveFindingModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          status: resolutionStatus,
          resolutionNotes: resolutionNotes || 'Formal sign-off in Security & Governance console.'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification('error', data.message || 'Resolution failed.');
      } else {
        showNotification('success', `Security finding marked as ${resolutionStatus}.`);
        setResolveFindingModal(null);
        setResolutionNotes('');
        fetchValidationData();
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Resolution network error.');
    }
  };

  // 6. Run Drift Detection
  const handleRunDriftDetection = async () => {
    if (!project) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/drift/detect`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        showNotification('error', data.message || 'Drift detection failed.');
      } else {
        showNotification('success', `Drift detection complete: ${data.totalDriftsDetected} drift issue(s) detected.`);
        fetchValidationData();
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Drift error');
    } finally {
      setIsLoading(false);
    }
  };

  // 7. Resolve / Reconcile Drift
  const handleResolveDrift = async () => {
    if (!driftModalRecord || !project) return;
    try {
      const res = await fetch(`/api/drift/records/${driftModalRecord.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          resolutionAction: driftAction,
          resolutionNotes: driftNotes || 'Reconciliation approved via Drift Governance Console.'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification('error', data.message || 'Reconciliation failed.');
      } else {
        showNotification('success', `Drift ${driftModalRecord.id} reconciled via ${driftAction}.`);
        setDriftModalRecord(null);
        setDriftNotes('');
        fetchValidationData();
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Drift resolve error');
    }
  };

  // Helper styles
  const getSeverityBadge = (severity: ValidationSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'LOW':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getGateStatusIcon = (status: ValidationGate['status']) => {
    switch (status) {
      case 'PASSED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'WAIVED':
        return <Unlock className="w-4 h-4 text-amber-400" />;
      case 'BLOCKED':
        return <AlertOctagon className="w-4 h-4 text-rose-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const selectedTask = tasks.find(t => t.taskId === selectedTaskId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-100">
                  Validation, Security & Drift Intelligence
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                  PHASE 7 ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Continuous 7-gate invariant pipeline, multi-tenant threat modeling, stop condition traps, and authoritative state promotion.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="text-slate-500">Active Role:</span>
            <span className={`font-semibold ${
              currentUser?.role === 'PROJECT_LEAD'
                ? 'text-purple-400'
                : currentUser?.role === 'SECURITY'
                ? 'text-rose-400'
                : 'text-cyan-400'
            }`}>
              {currentUser?.role || 'ANONYMOUS'}
            </span>
          </div>

          <button
            onClick={() => fetchValidationData()}
            disabled={isLoading}
            className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global Notifications */}
      {actionMessage && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-medium space-x-1">
        <button
          onClick={() => setActiveSubTab('lifecycle')}
          className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
            activeSubTab === 'lifecycle'
              ? 'border-emerald-400 text-emerald-300 font-semibold bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>7-Gate Operational Lifecycle</span>
          {contract && (
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${
              contract.status === 'PASSED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}>
              {contract.status}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
            activeSubTab === 'security'
              ? 'border-emerald-400 text-emerald-300 font-semibold bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Security & Threat Intelligence</span>
          {findings.filter(f => f.status === 'OPEN').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
              {findings.filter(f => f.status === 'OPEN').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('drift')}
          className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
            activeSubTab === 'drift'
              ? 'border-emerald-400 text-emerald-300 font-semibold bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Drift Intelligence & Reconciliation</span>
          {driftRecords.filter(d => d.status === 'DETECTED').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {driftRecords.filter(d => d.status === 'DETECTED').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('regression')}
          className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
            activeSubTab === 'regression'
              ? 'border-emerald-400 text-emerald-300 font-semibold bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Selective Regression Simulator</span>
        </button>
      </div>

      {/* Target Task Control Strip */}
      <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-xs font-mono text-slate-400 shrink-0">
            Target Execution Task:
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
          >
            {tasks.map(t => (
              <option key={t.taskId} value={t.taskId}>
                [{t.state}] {t.taskId} — {t.title.slice(0, 40)}
              </option>
            ))}
          </select>
          {selectedTask && (
            <span className="text-[11px] font-mono text-slate-500">
              Files in Lock: {selectedTask.relevantFiles.length} | Satisfies: {selectedTask.requirementsSatisfied.join(', ')}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleRunValidation}
            disabled={isLoading || !selectedTaskId}
            className="px-3.5 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-950/40 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Run 7-Gate Pipeline</span>
          </button>

          <button
            onClick={handleRunSecurityScan}
            disabled={isLoading || !selectedTaskId}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Security Scan</span>
          </button>

          <button
            onClick={handlePromoteTask}
            disabled={isLoading || !selectedTaskId || (contract?.status !== 'PASSED' && contract?.status !== 'WAIVED')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              contract?.status === 'PASSED' || contract?.status === 'WAIVED'
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/50'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
            title={contract?.status === 'PASSED' || contract?.status === 'WAIVED' ? 'Promote to Authoritative State' : 'Requires all 7 gates to pass or be waived'}
          >
            <Lock className="w-3.5 h-3.5 text-purple-300" />
            <span>Gate 7: Promote State</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SUBTAB 1: 7-GATE OPERATIONAL LIFECYCLE */}
      {/* ===================================================================== */}
      {activeSubTab === 'lifecycle' && (
        <div className="space-y-6">
          {/* 7 Gates Visual Pipeline Progress */}
          <div className="p-5 rounded-lg border border-slate-800 bg-slate-900/40 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>The 7-Gate Validation Pipeline</span>
              </h2>
              <span className="text-xs font-mono text-slate-400">
                Gate Status: {contract ? contract.status : 'AWAITING RUN'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
              {gates.map((gate) => {
                const isPassed = gate.status === 'PASSED';
                const isFailed = gate.status === 'FAILED';
                const isWaived = gate.status === 'WAIVED';

                return (
                  <div
                    key={gate.id}
                    className={`p-3 rounded border flex flex-col justify-between space-y-2 transition-all ${
                      isPassed
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                        : isFailed
                        ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                        : isWaived
                        ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        GATE {gate.order}
                      </span>
                      {getGateStatusIcon(gate.status)}
                    </div>

                    <div className="text-xs font-bold text-slate-100 line-clamp-2">
                      {gate.name.split('—')[1]?.trim() || gate.name}
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 line-clamp-2">
                      {gate.evidenceNotes || gate.failureBehavior}
                    </div>

                    <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[9px] font-mono text-slate-500">
                      <span>{gate.waiverPolicy === 'STRICT_NO_WAIVER' ? 'NO WAIVER' : 'WAIVABLE'}</span>
                      <span className="uppercase">{gate.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Validation Contract Summary & Failures */}
          {contract ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-mono">Contract ID: </span>
                  <span className="font-mono text-slate-200">{contract.id}</span>
                  <div className="mt-1 flex items-center space-x-3 text-slate-400">
                    <span>Task: <strong className="text-slate-200">{contract.taskId}</strong></span>
                    <span>Method: <strong className="text-slate-200">{contract.validationMethod}</strong></span>
                    <span>Validator: <strong className="text-slate-200">{contract.validator}</strong></span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="px-3 py-1.5 rounded bg-slate-950 border border-slate-800 font-mono text-xs">
                    <span className="text-slate-500">Failures: </span>
                    <strong className={contract.failures.length > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                      {contract.failures.length}
                    </strong>
                  </div>
                  <div className="px-3 py-1.5 rounded bg-slate-950 border border-slate-800 font-mono text-xs">
                    <span className="text-slate-500">Authoritative Approved: </span>
                    <strong className={contract.isAuthoritativeApproved ? 'text-emerald-400' : 'text-slate-400'}>
                      {contract.isAuthoritativeApproved ? 'YES' : 'PENDING'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Failures List */}
              {contract.failures.length > 0 ? (
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                      <AlertOctagon className="w-4 h-4 text-rose-400" />
                      <span>Validation Invariant Failures ({contract.failures.length})</span>
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">
                      CRITICAL failures cannot be waived under Project Governance.
                    </span>
                  </div>

                  <div className="divide-y divide-slate-800/60">
                    {contract.failures.map((f) => (
                      <div key={f.id} className="p-4 space-y-2 hover:bg-slate-850/40 transition-colors text-xs">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-bold ${getSeverityBadge(f.severity)}`}>
                                {f.severity}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                                {f.category}
                              </span>
                              <span className="font-bold text-slate-100">{f.whatFailed}</span>
                            </div>
                            <p className="text-slate-300 text-xs">
                              <span className="text-slate-500">Observed: </span>{f.observedBehavior}
                            </p>
                            <p className="text-slate-400 text-[11px]">
                              <span className="text-slate-500">Expected: </span>{f.expectedBehavior}
                            </p>
                            {f.evidence && (
                              <div className="p-2 rounded bg-slate-950 font-mono text-[10px] text-slate-400 border border-slate-800">
                                {f.evidence}
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 flex flex-col items-end space-y-2">
                            {f.waived ? (
                              <div className="p-2 rounded bg-amber-950/30 border border-amber-500/40 text-right">
                                <span className="text-[10px] font-mono text-amber-300 flex items-center space-x-1">
                                  <Unlock className="w-3 h-3" />
                                  <span>WAIVED BY GOVERNANCE</span>
                                </span>
                                <p className="text-[10px] text-slate-400 mt-0.5">{f.waiverReason}</p>
                                <span className="text-[9px] font-mono text-slate-500">{f.waivedBy}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setWaiveModalFailure(f);
                                  setWaiverReason('');
                                }}
                                disabled={f.severity === 'CRITICAL'}
                                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer ${
                                  f.severity === 'CRITICAL'
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950/40'
                                }`}
                                title={f.severity === 'CRITICAL' ? 'CRITICAL failures cannot be waived' : 'Submit formal waiver request'}
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>{f.severity === 'CRITICAL' ? 'Waiver Prohibited' : 'Waive Failure'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-emerald-400 border border-emerald-500/30 bg-emerald-950/10 rounded-lg space-y-2">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-100">All 7 Operational Validation Gates Satisfied</h3>
                  <p className="text-xs text-slate-400">
                    No invariant failures observed. Task is qualified for Authoritative State Promotion.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-lg space-y-2">
              <Layers className="w-8 h-8 text-slate-600 mx-auto" />
              <p>Select a task and click "Run 7-Gate Pipeline" to execute the full operational validation contract.</p>
              <p className="text-[11px] text-slate-600">
                Asserts Requirements Provenance, Scope Lock, Deterministic Logic, Stop Condition Security, and Regressions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 2: SECURITY & THREAT INTELLIGENCE */}
      {/* ===================================================================== */}
      {activeSubTab === 'security' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Active Findings</span>
              <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">
                {findings.length}
              </div>
              <span className="text-[10px] text-slate-400">Total detected vulnerabilities</span>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Critical / Stop Conditions</span>
              <div className="text-2xl font-bold text-rose-400 mt-1 font-mono">
                {findings.filter(f => f.severity === 'CRITICAL' || f.isStopConditionTriggered).length}
              </div>
              <span className="text-[10px] text-rose-400/80">Blocks pipeline promotion</span>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Threat Models Mapped</span>
              <div className="text-2xl font-bold text-indigo-400 mt-1 font-mono">
                {threatModels.length}
              </div>
              <span className="text-[10px] text-slate-400">STRIDE boundary mitigations</span>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Compliance Controls</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
                {complianceControls.filter(c => c.implementationNotes.includes('PASS') || c.implementationNotes.includes('Compliant')).length} / {complianceControls.length}
              </div>
              <span className="text-[10px] text-slate-400">SOC2 & NIST alignment</span>
            </div>
          </div>

          {/* Security Findings Table */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold text-slate-200">
                  Security Findings & Vulnerability Register
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSecurityFilter('ALL')}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    securityFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({findings.length})
                </button>
                <button
                  onClick={() => setSecurityFilter('OPEN')}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    securityFilter === 'OPEN' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Open ({findings.filter(f => f.status === 'OPEN').length})
                </button>
                <button
                  onClick={() => setSecurityFilter('STOP_CONDITIONS')}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    securityFilter === 'STOP_CONDITIONS' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Stop Conditions ({findings.filter(f => f.isStopConditionTriggered).length})
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-800/60">
              {findings
                .filter(f => {
                  if (securityFilter === 'OPEN') return f.status === 'OPEN';
                  if (securityFilter === 'STOP_CONDITIONS') return f.isStopConditionTriggered;
                  return true;
                })
                .map((f) => (
                  <div key={f.id} className="p-4 space-y-2 hover:bg-slate-850/40 transition-colors text-xs">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-bold ${getSeverityBadge(f.severity)}`}>
                            {f.severity}
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">[{f.category}]</span>
                          <span className="font-bold text-slate-100">{f.description}</span>
                          {f.isStopConditionTriggered && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                              STOP CONDITION TRIGGERED
                            </span>
                          )}
                        </div>

                        <p className="text-slate-400 text-xs">
                          <span className="text-slate-500">Component: </span>
                          <code className="text-slate-300 font-mono">{f.affectedComponent}</code>
                          <span className="text-slate-500 ml-3">Exploitability: </span>
                          <strong className="text-amber-300">{f.exploitability}</strong>
                          <span className="text-slate-500 ml-3">Control: </span>
                          <span className="font-mono text-slate-300">{f.controlReference}</span>
                        </p>

                        <div className="p-2 rounded bg-slate-950 font-mono text-[10px] text-slate-400 border border-slate-800">
                          <span className="text-slate-500">Remediation: </span>{f.recommendedRemediation}
                        </div>

                        {f.resolutionNotes && (
                          <div className="text-[11px] text-emerald-400/90 font-mono">
                            Resolution: {f.resolutionNotes} ({f.resolvedAt})
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex flex-col items-end space-y-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                          f.status === 'RESOLVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : (f.status === 'ACCEPTED_RISK' || f.status === 'RISK_ACCEPTED')
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}>
                          {f.status}
                        </span>

                        {f.status === 'OPEN' && (
                          <button
                            onClick={() => {
                              setResolveFindingModal(f);
                              setResolutionNotes('');
                              setResolutionStatus('RESOLVED');
                            }}
                            className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                          >
                            Resolve / Sign-off
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Architecture Threat Models & Trust Boundaries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Threat Models */}
            <div className="p-5 rounded-lg border border-slate-800 bg-slate-900/40 space-y-3">
              <h3 className="text-xs font-bold text-slate-100 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>STRIDE Threat Models & Controls</span>
              </h3>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {threatModels.map(tm => (
                  <div key={tm.id} className="p-3 rounded bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{tm.threat}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${getSeverityBadge(tm.residualRisk)}`}>
                        {tm.residualRisk} RISK
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">Asset: {tm.asset} | Vector: {tm.attackSurface}</p>
                    <p className="text-emerald-400 text-[11px]">Mitigation: {tm.control}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Boundaries & Data Flows */}
            <div className="p-5 rounded-lg border border-slate-800 bg-slate-900/40 space-y-3">
              <h3 className="text-xs font-bold text-slate-100 flex items-center space-x-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>System Trust Boundaries & Flows</span>
              </h3>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {trustBoundaries.map(tb => (
                  <div key={tb.id} className="p-3 rounded bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-slate-200">{tb.source} ➔ {tb.target}</span>
                      <span className="text-cyan-400">{tb.protocol}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Auth: {tb.authRequired ? 'ENFORCED' : 'NONE'}</span>
                      <span>Classification: {tb.dataClassification}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 3: DRIFT INTELLIGENCE & RECONCILIATION */}
      {/* ===================================================================== */}
      {activeSubTab === 'drift' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-amber-400" />
                <span>Multi-Dimensional Drift Intelligence</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Detects divergence between Layer 2 Approved Truth (requirements/constitution) and actual code or runtime states.
              </p>
            </div>

            <button
              onClick={handleRunDriftDetection}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white flex items-center space-x-1.5 transition-all cursor-pointer shadow-lg shadow-amber-950/40 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Detect Project Drift</span>
            </button>
          </div>

          {/* Drift Records List */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                Identified Drift Records ({driftRecords.length})
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setDriftFilter('ALL')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    driftFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDriftFilter('DETECTED')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    driftFilter === 'DETECTED' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Active Detected
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-800/60">
              {driftRecords
                .filter(d => driftFilter === 'ALL' || d.status === 'DETECTED')
                .map((d) => (
                  <div key={d.id} className="p-4 space-y-2 hover:bg-slate-850/40 transition-colors text-xs">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-bold ${getSeverityBadge(d.severity)}`}>
                            {d.severity}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                            {d.type} DRIFT
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                            d.classification === 'UNAUTHORIZED'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}>
                            {d.classification}
                          </span>
                          <span className="font-bold text-slate-100">{d.difference}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                          <div className="p-2 rounded bg-slate-950 border border-slate-800">
                            <span className="text-slate-500 block">Approved Truth:</span>
                            <span className="text-slate-300">{d.sourceState}</span>
                          </div>
                          <div className="p-2 rounded bg-slate-950 border border-slate-800">
                            <span className="text-slate-500 block">Observed State:</span>
                            <span className="text-rose-300">{d.actualState}</span>
                          </div>
                        </div>

                        <p className="text-slate-400 text-xs">
                          <span className="text-slate-500">Impact: </span>{d.impact}
                        </p>

                        {d.resolution && (
                          <div className="text-[11px] text-emerald-400 font-mono">
                            Reconciled: {d.resolution} ({d.authority})
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex flex-col items-end space-y-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                          d.status === 'RESOLVED' || d.status === 'AUTHORIZED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {d.status}
                        </span>

                        {d.status === 'DETECTED' && (
                          <button
                            onClick={() => {
                              setDriftModalRecord(d);
                              setDriftAction((d.recommendedAction as any) || 'REVERT_CHANGES');
                              setDriftNotes('');
                            }}
                            className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                          >
                            Reconcile Drift
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              {driftRecords.length === 0 && (
                <div className="p-8 text-center text-slate-500 font-mono text-xs">
                  No drift detected. System state is currently 100% aligned with Approved Truth.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 4: SELECTIVE REGRESSION SIMULATOR */}
      {/* ===================================================================== */}
      {activeSubTab === 'regression' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-rose-400" />
              <span>Dependency-Aware Selective Regression Analysis</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Maps changed files to affected components, requirements, and required test suites to prevent full-suite execution overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Simulator */}
            <div className="p-5 rounded-lg border border-slate-800 bg-slate-900/40 space-y-4">
              <label className="text-xs font-bold text-slate-200 block">
                Changed File Paths (one per line):
              </label>
              <textarea
                value={simulatedFiles}
                onChange={(e) => setSimulatedFiles(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                placeholder="src/server/storage.ts&#10;src/server/api.ts"
              />

              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="text-slate-500 self-center">Quick Presets:</span>
                <button
                  onClick={() => setSimulatedFiles('src/server/storage.ts')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  storage.ts
                </button>
                <button
                  onClick={() => setSimulatedFiles('src/server/api.ts\nsrc/server/auth.ts')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  api.ts + auth.ts
                </button>
                <button
                  onClick={() => setSimulatedFiles('src/server/validation/validationEngine.ts\nsrc/server/validation/securityEngine.ts')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  validation engines
                </button>
              </div>
            </div>

            {/* Impact Calculation Outcome */}
            <div className="p-5 rounded-lg border border-slate-800 bg-slate-900/40 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Calculated Blast Radius</span>
                {impactAnalysis && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-bold ${getSeverityBadge(impactAnalysis.riskLevel as ValidationSeverity)}`}>
                    {impactAnalysis.riskLevel} RISK
                  </span>
                )}
              </h3>

              {impactAnalysis ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-mono text-[11px] block">Directly Affected Components:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {impactAnalysis.affectedComponents.map(c => (
                        <span key={c} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 font-mono text-[11px] block">Impacted Layer 2 Requirements:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {impactAnalysis.affectedRequirements.map(r => (
                        <span key={r} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 font-mono text-[11px] block">Mandatory Targeted Test Suites:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {impactAnalysis.requiredTestSuites.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded bg-rose-950/40 border border-rose-500/40 font-mono text-[11px] text-rose-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 font-mono text-xs">Calculating regression impact...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: GOVERNED WAIVER DIALOG */}
      {/* ===================================================================== */}
      {waiveModalFailure && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Unlock className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">Governed Validation Waiver</h3>
              </div>
              <button
                onClick={() => setWaiveModalFailure(null)}
                className="text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500">Failure Item: </span>
                <strong className="text-slate-200">{waiveModalFailure.whatFailed}</strong>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-500">Severity: </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-bold ${getSeverityBadge(waiveModalFailure.severity)}`}>
                  {waiveModalFailure.severity}
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">{waiveModalFailure.observedBehavior}</p>
            </div>

            {waiveModalFailure.severity === 'CRITICAL' ? (
              <div className="p-3 rounded bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                <strong>CRITICAL Invariant Violation:</strong> Critical failures cannot be waived under Project Governance. You must modify the code or task specification to resolve this issue.
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Formal Waiver Reason (Mandatory for Audit Trail):
                </label>
                <textarea
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-amber-500 focus:outline-none"
                  placeholder="Explain why this validation failure is safely waived for this release cycle..."
                />
                <span className="text-[10px] font-mono text-slate-500">
                  Signed as: {currentUser?.id} ({currentUser?.role})
                </span>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setWaiveModalFailure(null)}
                className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              {waiveModalFailure.severity !== 'CRITICAL' && (
                <button
                  onClick={handleWaiveFailure}
                  disabled={isWaiving || !waiverReason.trim()}
                  className="px-3.5 py-1.5 rounded text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer disabled:opacity-50"
                >
                  {isWaiving ? 'Submitting Waiver...' : 'Authorize Waiver'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: SECURITY FINDING RESOLUTION */}
      {/* ===================================================================== */}
      {resolveFindingModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">Sign-off Security Finding</h3>
              </div>
              <button
                onClick={() => setResolveFindingModal(null)}
                className="text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-200 font-bold">{resolveFindingModal.description}</p>
              <p className="text-slate-400 text-[11px] font-mono">Component: {resolveFindingModal.affectedComponent}</p>
            </div>

            {currentUser?.role === 'DEVELOPER' && (
              <div className="p-3 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs">
                <strong>Non-Developer Self-Certification Invariant:</strong> Developers cannot self-certify security findings as RESOLVED. Sign-off requires Project Lead or Security role.
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Target Resolution Status:
                </label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono"
                >
                  <option value="RESOLVED">RESOLVED (Remediation Validated)</option>
                  <option value="RISK_ACCEPTED">RISK_ACCEPTED (Formal Exemption)</option>
                  <option value="MITIGATED">MITIGATED (Compensating Controls Active)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Resolution Notes:
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                  placeholder="Detail remediation evidence, code changes, or compensating controls..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setResolveFindingModal(null)}
                className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveFinding}
                className="px-3.5 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
              >
                Submit Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: DRIFT RECONCILIATION */}
      {/* ===================================================================== */}
      {driftModalRecord && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <GitBranch className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">Reconcile Architectural Drift</h3>
              </div>
              <button
                onClick={() => setDriftModalRecord(null)}
                className="text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-200 font-bold">{driftModalRecord.difference}</p>
              <div className="p-2 rounded bg-slate-950 font-mono text-[10px] text-slate-400 border border-slate-800">
                Impact: {driftModalRecord.impact}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Reconciliation Action:
                </label>
                <select
                  value={driftAction}
                  onChange={(e) => setDriftAction(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono"
                >
                  <option value="REVERT_CHANGES">REVERT_CHANGES (Rollback rogue implementation)</option>
                  <option value="UPDATE_TRUTH">UPDATE_TRUTH (Submit Change Request to update Layer 2)</option>
                  <option value="BLOCK_TASK">BLOCK_TASK (Halt task execution immediately)</option>
                  <option value="RETRY_CONSTRAINED">RETRY_CONSTRAINED (Re-run task with tighter prompt constraints)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Reconciliation Notes:
                </label>
                <textarea
                  value={driftNotes}
                  onChange={(e) => setDriftNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-amber-500 focus:outline-none"
                  placeholder="Record governance rationale for reconciliation decision..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDriftModalRecord(null)}
                className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveDrift}
                className="px-3.5 py-1.5 rounded text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer"
              >
                Execute Reconciliation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ValidationView;
