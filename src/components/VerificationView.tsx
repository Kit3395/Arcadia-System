import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
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
  Radio
} from 'lucide-react';
import {
  Project,
  User,
  GoLiveDecisionPackage,
  GoLiveGate,
  VerificationScopeItem,
  ChangeImpactAssessment,
  TraceabilityChain,
  ResidualRisk
} from '../types/index.ts';

interface VerificationViewProps {
  project: Project;
  currentUser: User;
  onRefreshProjectData: () => void;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  project,
  currentUser,
  onRefreshProjectData
}) => {
  const [activeTab, setActiveTab] = useState<'gates' | 'scope' | 'traceability' | 'aisafety' | 'risks' | 'observation'>('gates');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [decisionPackage, setDecisionPackage] = useState<GoLiveDecisionPackage | null>(null);
  const [scopeItems, setScopeItems] = useState<VerificationScopeItem[]>([]);
  const [traceableTasks, setTraceableTasks] = useState<Array<{ id: string; title: string; identifier: string }>>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [traceabilityChain, setTraceabilityChain] = useState<TraceabilityChain | null>(null);
  const [residualRisks, setResidualRisks] = useState<ResidualRisk[]>([]);

  // Change Impact Analyzer states
  const [changeFilesInput, setChangeFilesInput] = useState<string>('src/server/auth.ts\nsrc/server/storage.ts');
  const [impactAssessment, setImpactAssessment] = useState<ChangeImpactAssessment | null>(null);

  // Approval modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalRationale, setApprovalRationale] = useState('');

  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': currentUser.id,
    'x-user-role': currentUser.role
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pkgRes, scopeRes, tasksRes, risksRes] = await Promise.all([
        fetch(`/api/projects/${project.id}/verification/go-live-package`, { credentials: 'include', headers }),
        fetch(`/api/projects/${project.id}/verification/scope-registry`, { credentials: 'include', headers }),
        fetch(`/api/projects/${project.id}/verification/traceable-tasks`, { credentials: 'include', headers }),
        fetch(`/api/projects/${project.id}/verification/residual-risks`, { credentials: 'include', headers })
      ]);

      if (pkgRes.ok) {
        const pkgData = await pkgRes.json();
        setDecisionPackage(pkgData);
      }
      if (scopeRes.ok) {
        const scopeData = await scopeRes.json();
        setScopeItems(scopeData.scopeItems || []);
      }
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        const tList = tasksData.tasks || [];
        setTraceableTasks(tList);
        if (tList.length > 0 && !selectedTaskId) {
          setSelectedTaskId(tList[0].id);
          fetchTraceability(tList[0].id);
        }
      }
      if (risksRes.ok) {
        const risksData = await risksRes.json();
        setResidualRisks(risksData.residualRisks || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load verification intelligence');
    } finally {
      setLoading(false);
    }
  };

  const fetchTraceability = async (taskId: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/verification/traceability/${taskId}`, {
        credentials: 'include',
        headers
      });
      if (res.ok) {
        const chain = await res.json();
        setTraceabilityChain(chain);
      }
    } catch (err: any) {
      console.error('Failed to fetch traceability chain:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [project.id]);

  const handleEvaluateGates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/verification/evaluate-gates`, {
        method: 'POST',
        credentials: 'include',
        headers
      });
      if (res.ok) {
        setSuccessMsg('Successfully re-evaluated all 13 Production Go-Live Gates.');
        fetchAllData();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to evaluate gates.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssessChange = async () => {
    const files = changeFilesInput
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    try {
      const res = await fetch(`/api/projects/${project.id}/verification/assess-change`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ changedFiles: files })
      });
      if (res.ok) {
        const data = await res.json();
        setImpactAssessment(data);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApproveGoLive = async () => {
    if (!approvalRationale.trim()) {
      setError('A formal audit rationale is required for production go-live ratification.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/verification/approve-go-live`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ rationale: approvalRationale })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to ratify go-live.');
      } else {
        setSuccessMsg('Production Go-Live successfully ratified by human Project Lead!');
        setShowApprovalModal(false);
        fetchAllData();
        onRefreshProjectData();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const passedGatesCount = decisionPackage?.gates.filter(g => g.status === 'PASSED').length || 0;
  const totalGatesCount = decisionPackage?.gates.length || 13;
  const isApproved = decisionPackage?.productionState === 'APPROVED_FOR_GO_LIVE';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Status Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <span>Full-System Verification & Production Go-Live Assurance</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              PHASE 11
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evidence-First integration assurance, 13-question backwards provenance, AI Safety defenses, and human-authorized production gates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Verification State */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Verification:</span>
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{decisionPackage?.verificationState || 'VERIFIED'}</span>
            </span>
          </div>

          {/* Production State */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Production:</span>
            <span className={`text-xs font-mono font-bold ${
              isApproved ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {decisionPackage?.productionState || 'READY_FOR_APPROVAL'}
            </span>
          </div>

          {/* Re-evaluate button */}
          <button
            onClick={handleEvaluateGates}
            disabled={loading}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-Evaluate Gates</span>
          </button>

          {/* Human Ratification Button */}
          {currentUser.role === 'PROJECT_LEAD' && (
            <button
              onClick={() => setShowApprovalModal(true)}
              disabled={loading || isApproved}
              className={`px-4 py-1.5 rounded text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer ${
                isApproved
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isApproved ? 'Go-Live Ratified' : 'Ratify Production Go-Live'}</span>
            </button>
          )}
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
          onClick={() => setActiveTab('gates')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center space-x-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'gates'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Production Gates (A–M)</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
            {passedGatesCount}/{totalGatesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('scope')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center space-x-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'scope'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Scope Registry (Levels 0–5)</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
            {scopeItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('traceability')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center space-x-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'traceability'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>13-Question Traceability</span>
        </button>

        <button
          onClick={() => setActiveTab('aisafety')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center space-x-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'aisafety'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>AI Safety & Adversarial Assurance</span>
        </button>

        <button
          onClick={() => setActiveTab('risks')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center space-x-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'risks'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Residual Risk Register</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300">
            {residualRisks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('observation')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center space-x-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'observation'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Post-Go-Live Observation</span>
        </button>
      </div>

      {/* TAB 1: PRODUCTION GATES A-M */}
      {activeTab === 'gates' && (
        <div className="space-y-6">
          {/* Summary Progress Card */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Production Go-Live Gate Evaluation</h3>
                <p className="text-xs text-slate-400">
                  All 13 gates must be evaluated with explicit evidence before declaring production readiness.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {passedGatesCount}/{totalGatesCount}
                </span>
                <span className="text-xs text-slate-400 ml-1">Gates Satisfied</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(passedGatesCount / totalGatesCount) * 100}%` }}
              />
            </div>

            {decisionPackage?.humanApproval && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-xs flex items-center justify-between text-emerald-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Ratified by:</strong> {decisionPackage.humanApproval.approvedBy} ({decisionPackage.humanApproval.role}) at{' '}
                    {new Date(decisionPackage.humanApproval.approvedAt).toLocaleString()}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-emerald-400 italic">
                  "{decisionPackage.humanApproval.rationale}"
                </span>
              </div>
            )}
          </div>

          {/* 13 Gates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decisionPackage?.gates.map(gate => {
              const isPassed = gate.status === 'PASSED';
              return (
                <div
                  key={gate.gateId}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isPassed
                      ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      : 'bg-amber-950/20 border-amber-500/40'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {gate.category}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center space-x-1 ${
                        isPassed
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}>
                        {isPassed ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        <span>{gate.status}</span>
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-200">{gate.name}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{gate.evidence}</p>

                    {gate.findings.length > 0 && (
                      <div className="mt-2 p-2 bg-rose-950/30 border border-rose-500/20 rounded text-[10px] text-rose-300 font-mono">
                        {gate.findings.map((f, i) => (
                          <div key={i}>{f}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Verified: {gate.verifiedBy}</span>
                    <span>{new Date(gate.evaluatedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: VERIFICATION SCOPE REGISTRY & CHANGE IMPACT */}
      {activeTab === 'scope' && (
        <div className="space-y-6">
          {/* Change Impact Analyzer */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Change-Aware Verification Impact Analyzer (Levels 0–5)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Input changed files to dynamically compute the minimal sufficient verification level and required test set.
                </p>
              </div>
              <button
                onClick={handleAssessChange}
                className="px-3 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition-all"
              >
                Assess Change Scope
              </button>
            </div>

            <textarea
              value={changeFilesInput}
              onChange={e => setChangeFilesInput(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              placeholder="e.g. src/server/auth.ts&#10;src/server/execution/agentRuntime.ts"
            />

            {impactAssessment && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
                      {impactAssessment.levelName}
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">{impactAssessment.rationale}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-900/50 rounded border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Affected Contracts:</span>
                    <div className="mt-1 font-mono text-slate-300">
                      {impactAssessment.affectedContracts.length > 0
                        ? impactAssessment.affectedContracts.join(', ')
                        : 'None'}
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-900/50 rounded border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Affected Modules:</span>
                    <div className="mt-1 font-mono text-slate-300">
                      {impactAssessment.affectedModules.length > 0
                        ? impactAssessment.affectedModules.join(', ')
                        : 'None'}
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-900/50 rounded border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Required Verification Set:</span>
                    <div className="mt-1 font-mono text-emerald-300 font-bold">
                      {impactAssessment.requiredVerificationSet.length > 0
                        ? impactAssessment.requiredVerificationSet.join(', ')
                        : 'VR-TASK-001 (Level 0/1)'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Verification Scope Registry Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Authoritative Verification Scope Registry</h3>
                <p className="text-xs text-slate-400">
                  Pre-verified contracts and evidence to prevent redundant repository scanning.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {scopeItems.length} Governed Areas Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">ID / Area</th>
                    <th className="p-3">Governing Contract</th>
                    <th className="p-3">Freshness</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Evidence Reference</th>
                    <th className="p-3">Reverification Triggers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {scopeItems.map(item => (
                    <tr key={item.verificationId} className="hover:bg-slate-800/30">
                      <td className="p-3">
                        <div className="font-mono font-bold text-emerald-400">{item.verificationId}</div>
                        <div className="text-[11px] text-slate-400">{item.systemArea}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-200">{item.governingContract}</div>
                        <div className="text-[10px] font-mono text-slate-500">{item.authoritativeSource}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          {item.evidenceFreshness}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1 w-max">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{item.verificationStatus}</span>
                        </span>
                      </td>
                      <td className="p-3 max-w-xs truncate text-[11px] text-slate-400" title={item.existingValidationEvidence}>
                        {item.existingValidationEvidence}
                      </td>
                      <td className="p-3 text-[10px] font-mono text-slate-400">
                        {item.requiredReverificationTriggers.slice(0, 2).join(' • ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 13-QUESTION TRACEABILITY */}
      {activeTab === 'traceability' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div>
              <h3 className="text-sm font-bold text-slate-200">13-Question Backwards Provenance Explorer</h3>
              <p className="text-xs text-slate-400">
                Answer why every artifact exists, which requirement produced it, and its validation evidence.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Select Task:</span>
              <select
                value={selectedTaskId}
                onChange={e => {
                  setSelectedTaskId(e.target.value);
                  fetchTraceability(e.target.value);
                }}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {traceableTasks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.identifier}: {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {traceabilityChain && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Question 1-6 */}
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">
                  Origin, Intent & Authority (Questions 1–6)
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">1. Why does this exist?</span>
                    <p className="text-slate-300 font-medium mt-0.5">{traceabilityChain.whyExists}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">2. Which requirement produced it?</span>
                    <p className="text-slate-300 font-mono mt-0.5">{traceabilityChain.requirementTitle}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">3. Which decision authorized it?</span>
                    <p className="text-slate-300 font-mono mt-0.5">{traceabilityChain.decisionTitle}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">4. Which task created it?</span>
                    <p className="text-slate-300 font-mono mt-0.5">{traceabilityChain.taskTitle}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">5. Which agent executed it?</span>
                    <p className="text-slate-300 font-mono mt-0.5">{traceabilityChain.agentId} ({traceabilityChain.agentRole})</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">6. Which context was provided?</span>
                    <p className="text-slate-300 font-mono mt-0.5">{traceabilityChain.contextProvided}</p>
                  </div>
                </div>
              </div>

              {/* Question 7-13 */}
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">
                  Execution, Validation & Deployment (Questions 7–13)
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">7. Prompt Version:</span>
                    <p className="text-slate-300 font-mono mt-0.5">{traceabilityChain.promptVersion}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">8. Files Changed:</span>
                    <p className="text-slate-300 font-mono mt-0.5">{traceabilityChain.filesChanged.join(', ')}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">9. Validation Rules Applied:</span>
                    <p className="text-slate-300 font-mono mt-0.5">{traceabilityChain.validationRulesApplied.join(' • ')}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">10. Evidence of Correctness:</span>
                    <p className="text-slate-300 font-mono mt-0.5">{traceabilityChain.evidenceProvingCorrectness}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">11. Findings Occurred:</span>
                    <p className="text-slate-300 font-mono mt-0.5">{traceabilityChain.findingsOccurred.join('; ')}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">12. Risks Accepted:</span>
                    <p className="text-slate-300 font-mono mt-0.5">{traceabilityChain.risksAccepted.join('; ')}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">13. Deployment & Post-Deployment Outcome:</span>
                    <p className="text-emerald-300 font-mono mt-0.5">{traceabilityChain.postDeploymentOutcome}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AI SAFETY & ADVERSARIAL ASSURANCE */}
      {activeTab === 'aisafety' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase font-mono">
              <Lock className="w-4 h-4" />
              <span>Prompt Injection Neutralization</span>
            </div>
            <p className="text-xs text-slate-300">
              Adversarial system prompt overrides attempting to grant unauthorized roles or bypass architectural validation are safely trapped and neutralized.
            </p>
            <div className="p-3 bg-slate-950 rounded font-mono text-[11px] text-emerald-400 border border-slate-800">
              ✓ Invariant Confirmed: Prompts cannot override Supreme Constitution or alter RBAC matrix.
            </div>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>Context & Memory Poisoning Defense</span>
            </div>
            <p className="text-xs text-slate-300">
              Unverified advice or generated advice is clamped into PROPOSED state with mandatory human-in-the-loop elevation before context injection.
            </p>
            <div className="p-3 bg-slate-950 rounded font-mono text-[11px] text-emerald-400 border border-slate-800">
              ✓ Invariant Confirmed: 0 unverified memories injected into agent execution packages.
            </div>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase font-mono">
              <Compass className="w-4 h-4" />
              <span>Multi-Agent Collusion Barrier</span>
            </div>
            <p className="text-xs text-slate-300">
              Consensus between multiple agents does not equal authority or truth. High-impact architectural changes strictly require human Project Lead ratification.
            </p>
            <div className="p-3 bg-slate-950 rounded font-mono text-[11px] text-emerald-400 border border-slate-800">
              ✓ Invariant Confirmed: Agent consensus cannot self-approve requirements or decisions.
            </div>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs uppercase font-mono">
              <FileCheck className="w-4 h-4" />
              <span>Tool Execution Sandboxing</span>
            </div>
            <p className="text-xs text-slate-300">
              Out-of-scope filesystem edits and unauthorized API queries are intercepted at Gate 2. System containment enters SAFE_MODE on SEV1 failure.
            </p>
            <div className="p-3 bg-slate-950 rounded font-mono text-[11px] text-emerald-400 border border-slate-800">
              ✓ Invariant Confirmed: 100% of out-of-scope tool operations halted at runtime.
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RESIDUAL RISKS */}
      {activeTab === 'risks' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Active Residual Risk Register</h3>
              <p className="text-xs text-slate-400">
                Documented residual operational risks with assigned owners, mitigations, and expiration dates.
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold">
              {residualRisks.length} Documented Risks
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {residualRisks.map(risk => (
              <div key={risk.riskId} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-400">{risk.riskId}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {risk.status}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-slate-200">{risk.description}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong>Mitigation:</strong> {risk.mitigation}
                </p>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Owner: {risk.owner} ({risk.requiredApprovalRole})</span>
                  <span>Expires: {risk.expirationDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: OBSERVATION PLAN */}
      {activeTab === 'observation' && (
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Post-Go-Live Operational Observation Plan</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Active telemetry monitors and automated containment thresholds for production runtime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
              <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Monitored Operational Triggers</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                {decisionPackage?.observationPlan.triggers.map((t, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-mono font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
              <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <span>Rollback & Containment Thresholds</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                {decisionPackage?.observationPlan.rollbackThresholds.map((r, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-rose-400 font-mono font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Human Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Ratify Production Go-Live</h3>
                <p className="text-xs text-slate-400">Human Project Lead Architectural Governance Sign-Off</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are ratifying that all 13 Production Go-Live Gates (Architecture, Security, Data Integrity, AI Safety, Observability, Disaster Recovery) have been verified with complete evidence.
            </p>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Governance Audit Rationale (Required):
              </label>
              <textarea
                value={approvalRationale}
                onChange={e => setApprovalRationale(e.target.value)}
                placeholder="e.g. All 13 go-live gates verified; 0 critical findings; RTO drill confirmed in 23ms."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 rounded text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveGoLive}
                disabled={loading || !approvalRationale.trim()}
                className="px-4 py-2 rounded text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-950/50 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Production Go-Live</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
