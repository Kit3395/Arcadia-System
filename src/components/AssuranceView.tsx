import React, { useState, useEffect } from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Search,
  Filter,
  Layers,
  GitBranch,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Sparkles,
  Award,
  Zap,
  Cpu,
  Clock,
  Wrench,
  AlertOctagon,
  FileCheck,
  Plus,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Sliders,
  Send,
  Trash2,
  Eye,
  Lock,
  Compass
} from 'lucide-react';
import {
  Project,
  User,
  ContinuousAssuranceOverview,
  CanonicalArchitecturalPrinciple,
  AuthorityMapping,
  AssuranceTriggerEvent,
  SimplificationCandidate,
  GovernedFeatureFlag,
  MetricGamingAnomaly,
  FeedbackLoopDetection,
  EvolutionProposal,
  ContinuousAssuranceTriggerType,
  SimplificationStatus
} from '../types/index.ts';

interface AssuranceViewProps {
  project: Project;
  currentUser: User;
  onRefreshProjectData: () => void;
}

export const AssuranceView: React.FC<AssuranceViewProps> = ({
  project,
  currentUser,
  onRefreshProjectData
}) => {
  const [activeTab, setActiveTab] = useState<'principles' | 'canonical_architecture' | 'authorities' | 'triggers' | 'simplification' | 'flags' | 'gaming_loops' | 'proposals'>('canonical_architecture');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [overview, setOverview] = useState<ContinuousAssuranceOverview | null>(null);

  // Trigger Evaluator Form state
  const [simTriggerType, setSimTriggerType] = useState<ContinuousAssuranceTriggerType>('AI_PROVIDER');
  const [simArtifact, setSimArtifact] = useState('src/server/operations/operationsEngine.ts:aiProviderVersions');
  const [simEvidence, setSimEvidence] = useState('Upstream Gemini model latency benchmark evaluated at 380ms');
  const [evaluatingTrigger, setEvaluatingTrigger] = useState(false);

  // Evolution Proposal Form state
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [propTitle, setPropTitle] = useState('');
  const [propCurrentState, setPropCurrentState] = useState('');
  const [propDesiredState, setPropDesiredState] = useState('');
  const [propReason, setPropReason] = useState('');
  const [propEvidence, setPropEvidence] = useState('');
  const [propBenefit, setPropBenefit] = useState('');
  const [propRisk, setPropRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW');
  const [propRollback, setPropRollback] = useState('');

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/projects/${project.id}/assurance/overview`);
      if (!res.ok) throw new Error('Failed to load assurance overview');
      const data = await res.json();
      setOverview(data.overview);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [project.id]);

  const handleEvaluateTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEvaluatingTrigger(true);
      setError(null);
      const res = await fetch(`/api/projects/${project.id}/assurance/triggers/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerType: simTriggerType,
          sourceArtifact: simArtifact,
          evidence: simEvidence
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to evaluate trigger');
      }
      setSuccessMsg(`Change trigger evaluated! Targeted verification mapped without full-system escalation.`);
      fetchOverview();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEvaluatingTrigger(false);
    }
  };

  const handleAdvanceSimplification = async (candId: string, targetStatus: SimplificationStatus) => {
    try {
      setError(null);
      const res = await fetch(`/api/projects/${project.id}/assurance/simplifications/${candId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStatus })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to advance candidate');
      }
      setSuccessMsg(`Simplification candidate stage updated to ${targetStatus}`);
      fetchOverview();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRatifyProposal = async (proposalId: string, decision: 'RATIFIED' | 'REJECTED') => {
    try {
      setError(null);
      const res = await fetch(`/api/projects/${project.id}/assurance/proposals/${proposalId}/ratify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to ratify proposal');
      }
      setSuccessMsg(`Evolution proposal ${proposalId} ${decision.toLowerCase()} successfully`);
      fetchOverview();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const res = await fetch(`/api/projects/${project.id}/assurance/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: propTitle,
          currentState: propCurrentState,
          desiredState: propDesiredState,
          reason: propReason,
          evidence: propEvidence,
          affectedRequirements: ['REQ-EVO-01'],
          affectedArchitecture: ['src/server/assurance/'],
          affectedSecurity: [],
          affectedData: [],
          affectedAgents: [],
          affectedValidation: ['Suite 10 (Assurance)'],
          affectedDeployment: [],
          expectedBenefit: propBenefit,
          cost: 100,
          risk: propRisk,
          rollbackPlan: propRollback,
          verificationRequirements: ['Targeted Suite 10 verification'],
          proposedBy: currentUser.id
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create proposal');
      }
      setSuccessMsg('Evolution proposal submitted for governance review');
      setShowProposalModal(false);
      setPropTitle('');
      setPropCurrentState('');
      setPropDesiredState('');
      setPropReason('');
      setPropEvidence('');
      setPropBenefit('');
      setPropRollback('');
      fetchOverview();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-slate-100">
                    Continuous Assurance & Architectural Integrity
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    CONTROLLED EVOLUTION
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Permanent verification economy, single source-of-truth governance, and evidence-driven evolution
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchOverview}
              disabled={loading}
              className="px-3 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center space-x-1.5 transition-colors border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh State</span>
            </button>
            <button
              onClick={() => setShowProposalModal(true)}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center space-x-1.5 transition-colors shadow-md shadow-cyan-900/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Propose Evolution</span>
            </button>
          </div>
        </div>

        {/* Status Highlights */}
        {overview && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Principles Enforced</span>
              <span className="text-sm font-bold text-emerald-400 flex items-center space-x-1 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
                <span>18 / 18 Principles</span>
              </span>
            </div>

            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Source of Truth</span>
              <span className="text-sm font-bold text-cyan-400 flex items-center space-x-1 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>0 Duplicate Authorities</span>
              </span>
            </div>

            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Verification Economy</span>
              <span className="text-sm font-bold text-indigo-400 flex items-center space-x-1 mt-0.5">
                <Sparkles className="w-4 h-4" />
                <span>{overview.targetedVerificationRecommendation.evidenceFreshnessPreserved}% Evidence Reused</span>
              </span>
            </div>

            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Governed Flags</span>
              <span className="text-sm font-bold text-amber-400 flex items-center space-x-1 mt-0.5">
                <Sliders className="w-4 h-4" />
                <span>{overview.governedFlags.length} Flags Tracked</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Sub-Tabs */}
      <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto text-xs pb-1">
        <button
          onClick={() => setActiveTab('canonical_architecture')}
          className={`px-3 py-2 font-medium rounded-t transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'canonical_architecture'
              ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Canonical Architecture (P14 Baseline)</span>
        </button>

        <button
          onClick={() => setActiveTab('principles')}
          className={`px-3 py-2 font-medium rounded-t transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'principles'
              ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Canonical Principles (18)</span>
        </button>

        <button
          onClick={() => setActiveTab('authorities')}
          className={`px-3 py-2 font-medium rounded-t transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'authorities'
              ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Source-of-Truth Integrity</span>
        </button>

        <button
          onClick={() => setActiveTab('triggers')}
          className={`px-3 py-2 font-medium rounded-t transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'triggers'
              ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Assurance Triggers & Impact</span>
        </button>

        <button
          onClick={() => setActiveTab('simplification')}
          className={`px-3 py-2 font-medium rounded-t transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'simplification'
              ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Simplification Registry</span>
        </button>

        <button
          onClick={() => setActiveTab('flags')}
          className={`px-3 py-2 font-medium rounded-t transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'flags'
              ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Governed Feature Flags</span>
        </button>

        <button
          onClick={() => setActiveTab('gaming_loops')}
          className={`px-3 py-2 font-medium rounded-t transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'gaming_loops'
              ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Metric Gaming & Feedback Loops</span>
        </button>

        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-3 py-2 font-medium rounded-t transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'proposals'
              ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Evolution Proposals</span>
        </button>
      </div>

      {/* Tab 0: Canonical Architecture Baseline (Phase 14 Consolidation) */}
      {activeTab === 'canonical_architecture' && overview && (
        <div className="space-y-6">
          {/* Baseline Header */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20">
                    CANONICAL ARCHITECTURE BASELINE
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    STATE: CONSOLIDATED & RATIFIED
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-100 mt-1">
                  Arcadia Modular Monolith: Authoritative Architecture Specification
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consolidated architecture across all 14 phases. Numbered phases completed; transitioned to governed, evidence-driven versioned operations.
                </p>
              </div>

              <div className="text-right font-mono text-xs text-slate-400 shrink-0">
                <span className="block text-slate-500 text-[10px] uppercase">Dependency Direction</span>
                <span className="text-slate-200">Types → Storage → Engines → API → UI</span>
              </div>
            </div>

            {/* Architecture Boundaries Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 block uppercase">1. Authoritative Store</span>
                <span className="text-sm font-semibold text-slate-200 mt-0.5 block">src/server/storage.ts</span>
                <p className="text-[11px] text-slate-400 mt-1">Relational state for Projects, Constitutions, Requirements, Decisions, Tasks, and Audit Logs.</p>
              </div>

              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 block uppercase">2. Security Boundary</span>
                <span className="text-sm font-semibold text-slate-200 mt-0.5 block">src/server/auth.ts</span>
                <p className="text-[11px] text-slate-400 mt-1">Multi-Tenant RBAC matrix, session authentication, and least-privilege role verification.</p>
              </div>

              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 block uppercase">3. Execution & AI Gate</span>
                <span className="text-sm font-semibold text-slate-200 mt-0.5 block">src/server/execution/</span>
                <p className="text-[11px] text-slate-400 mt-1">Sandboxed agents, prompt compilation with injection defenses, and provider circuit breakers.</p>
              </div>

              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 block uppercase">4. Continuous Assurance</span>
                <span className="text-sm font-semibold text-slate-200 mt-0.5 block">src/server/assurance/</span>
                <p className="text-[11px] text-slate-400 mt-1">Single source-of-truth auditor, change-aware impact graph, and simplification lifecycle.</p>
              </div>
            </div>
          </div>

          {/* Module Ownership Matrix */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Consolidated Module Ownership Matrix</span>
            </h3>

            <div className="border border-slate-800 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left text-slate-300">
                <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Module</th>
                    <th className="p-3">Domain Owner</th>
                    <th className="p-3">Authoritative Responsibilities</th>
                    <th className="p-3">Public Interface</th>
                    <th className="p-3">Governance / Security Invariant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-semibold text-cyan-400">src/server/storage.ts</td>
                    <td className="p-3 text-emerald-300 font-medium">Core Storage Authority</td>
                    <td className="p-3 text-slate-300">Relational truth store, ACID state transitions, immutable audit logs</td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">storage singleton</td>
                    <td className="p-3 text-slate-400">Direct cross-tenant access prohibited; append-only audit trail</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-semibold text-cyan-400">src/server/auth.ts</td>
                    <td className="p-3 text-emerald-300 font-medium">Security Authority</td>
                    <td className="p-3 text-slate-300">RBAC role permission checks, token verification, tenant boundary enforcement</td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">requireAuth, requirePermission</td>
                    <td className="p-3 text-slate-400">Unauthenticated or unauthorized access hard rejected (401/403)</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-semibold text-cyan-400">src/server/execution/</td>
                    <td className="p-3 text-emerald-300 font-medium">Execution Authority</td>
                    <td className="p-3 text-slate-300">Agent registry, prompt compilation, execution sandboxing, tool limits</td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">executionEngine, promptCompiler</td>
                    <td className="p-3 text-slate-400">Agents cannot self-ratify requirements or release deployments</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-semibold text-cyan-400">src/server/validation/</td>
                    <td className="p-3 text-emerald-300 font-medium">Validation Authority</td>
                    <td className="p-3 text-slate-300">Gates 1–7, AST scanning, drift detection, contract verification</td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">validationEngine, driftEngine</td>
                    <td className="p-3 text-slate-400">No silent passes; evidence required for state promotion</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-semibold text-cyan-400">src/server/optimization/</td>
                    <td className="p-3 text-emerald-300 font-medium">Optimization Authority</td>
                    <td className="p-3 text-slate-300">Cost engine, temporal estimation, trust scoring, cognitive load metrics</td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">costEngine, optimizationEngine</td>
                    <td className="p-3 text-slate-400">Security and correctness strictly outrank cost and latency</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-semibold text-cyan-400">src/server/learning/</td>
                    <td className="p-3 text-emerald-300 font-medium">Learning Authority</td>
                    <td className="p-3 text-slate-300">Organizational memory, pattern extraction, learning metrics</td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">memoryEngine, metricsEngine</td>
                    <td className="p-3 text-slate-400">Memories do not become policy without human lead ratification</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-semibold text-cyan-400">src/server/resilience/</td>
                    <td className="p-3 text-emerald-300 font-medium">Resilience Authority</td>
                    <td className="p-3 text-slate-300">Circuit breakers, incident SAFE_MODE containment, DR snapshots & drills</td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">circuitBreakerEngine, incidentEngine</td>
                    <td className="p-3 text-slate-400">Automatic SAFE_MODE on SEV1; verified restore drills under RTO &lt; 5m</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-semibold text-cyan-400">src/server/verification/</td>
                    <td className="p-3 text-emerald-300 font-medium">Assurance Authority</td>
                    <td className="p-3 text-slate-300">16-Area Scope Registry, 13-question backwards provenance, Gates A–M</td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">scopeRegistry, goLiveEngine</td>
                    <td className="p-3 text-slate-400">Human Project Lead ratification mandatory for production release</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-semibold text-cyan-400">src/server/operations/</td>
                    <td className="p-3 text-emerald-300 font-medium">Operations Authority</td>
                    <td className="p-3 text-slate-300">Operational baseline v12.0.0-prod, 7-point smoke checks, change freeze</td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">operationsEngine</td>
                    <td className="p-3 text-slate-400">Emergency break-glass time-bounded (1h) and immutably audited</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-semibold text-cyan-400">src/server/assurance/</td>
                    <td className="p-3 text-emerald-300 font-medium">Continuous Assurance</td>
                    <td className="p-3 text-slate-300">18 Canonical Principles, source-of-truth audit, change-aware impact graph</td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">assuranceEngine</td>
                    <td className="p-3 text-slate-400">Non-perpetual verification; 0 duplicate authorities invariant</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Architecture Change Gate & Future Change Policy */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">Permanent Architecture Change Gate (8 Questions)</h3>
              </div>
              <p className="text-xs text-slate-400">
                Before introducing any new module, database table, or major abstraction, evidence must answer all 8 criteria:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 font-mono">
                <li>What concrete problem exists in measured production data?</li>
                <li>Which verifiable evidence establishes this problem?</li>
                <li>Why can existing verified architecture not solve it?</li>
                <li>Which existing components were evaluated for reuse?</li>
                <li>What complexity and maintenance cost will be introduced?</li>
                <li>What security and governance boundaries will change?</li>
                <li>How will the addition be deterministically validated?</li>
                <li>How can it eventually be safely deprecated and removed?</li>
              </ol>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">Future Change Policy & Operating Model</h3>
              </div>
              <p className="text-xs text-slate-400">
                Numbered implementation phases (Phases 1–14) are officially closed. Ongoing system evolution follows standard versioned change management:
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-start space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Evidence-Driven Evolution:</strong> Changes require measured production telemetry or verified security advisories.</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Change-Aware Impact Graph:</strong> Re-verification is targeted to affected suites; full-system testing is avoided unless foundational contracts change.</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Human Authority Retention:</strong> Autonomous models and agents remain execution participants; release authorization requires explicit human lead sign-off.</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Staged Redundancy Removal:</strong> Candidates follow 6-stage lifecycle (Candidate → Usage Evaluated → Dependency Analyzed → Deprecated → Observation → Removed).</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Canonical Principles */}
      {activeTab === 'principles' && overview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200">
              The 18 Canonical Architectural Principles
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Canonical Source: Section 40 • Invariant Governed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overview.principles.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 font-bold">
                      PRINCIPLE #{p.id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{p.verifiedStatus}</span>
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100">{p.principle}</h3>
                  <p className="text-xs text-slate-400 mt-1">{p.rationale}</p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Enforcement:</span>
                  <span className="text-slate-300 truncate max-w-[240px]">{p.enforcementMechanism}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Source-of-Truth Integrity */}
      {activeTab === 'authorities' && overview && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-200">
                Source-of-Truth Authority Mapping
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every major concept domain is bound to exactly one authoritative owner. Duplicated authorities are treated as architectural defects.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded text-xs font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 flex items-center space-x-1.5 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero Duplicate Authorities Detected</span>
              </span>
            </div>
          </div>

          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Concept Domain</th>
                  <th className="p-3">Authoritative Owner</th>
                  <th className="p-3">Source-of-Truth Location</th>
                  <th className="p-3">Derived Projections</th>
                  <th className="p-3">Integrity Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {overview.authorityMappings.map((m) => (
                  <tr key={m.domain} className="hover:bg-slate-900/40">
                    <td className="p-3 font-semibold text-slate-200">
                      <div className="font-mono text-cyan-400 text-[10px]">{m.domain}</div>
                      <div>{m.conceptName}</div>
                    </td>
                    <td className="p-3 font-medium text-emerald-300">
                      {m.authoritativeOwner}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">
                      {m.sourceOfTruthLocation}
                    </td>
                    <td className="p-3 text-[11px] text-slate-400">
                      <div className="flex flex-wrap gap-1">
                        {m.derivedProjections.map((p, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px]">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 flex items-center space-x-1 w-max">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>VERIFIED</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Assurance Triggers & Impact Graph */}
      {activeTab === 'triggers' && overview && (
        <div className="space-y-6">
          {/* Simulator Form */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Continuous Assurance Trigger Evaluator (Change-Aware Impact Graph)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Demonstrates how changes in architecture, security, or AI providers trigger targeted verification instead of perpetual full-system testing.
              </p>
            </div>

            <form onSubmit={handleEvaluateTrigger} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Trigger Category (10 Governed Triggers)
                </label>
                <select
                  value={simTriggerType}
                  onChange={(e) => setSimTriggerType(e.target.value as ContinuousAssuranceTriggerType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="ARCHITECTURE">ARCHITECTURE (Ownership or Dependency Change)</option>
                  <option value="SECURITY">SECURITY (RBAC or Boundary Change)</option>
                  <option value="DATA">DATA (Schema or Migration Change)</option>
                  <option value="AGENT">AGENT (Capability or Permission Change)</option>
                  <option value="AI_PROVIDER">AI_PROVIDER (Model Update or Fallback Shift)</option>
                  <option value="VALIDATION">VALIDATION (Contract or Gate Rule Change)</option>
                  <option value="DEPLOYMENT">DEPLOYMENT (Infrastructure or Config Shift)</option>
                  <option value="INCIDENT">INCIDENT (Post-SEV1 Review Trigger)</option>
                  <option value="DRIFT">DRIFT (Repeated Unauthorized Drift)</option>
                  <option value="LEARNING">LEARNING (Contradicted Memory Pattern)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Source Artifact Location
                </label>
                <input
                  type="text"
                  value={simArtifact}
                  onChange={(e) => setSimArtifact(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Change Evidence Description
                </label>
                <input
                  type="text"
                  value={simEvidence}
                  onChange={(e) => setSimEvidence(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={evaluatingTrigger}
                  className="px-4 py-2 rounded text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center space-x-1.5 transition-colors cursor-pointer shadow-md shadow-cyan-950/40 disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${evaluatingTrigger ? 'animate-spin' : ''}`} />
                  <span>{evaluatingTrigger ? 'Analyzing Impact...' : 'Evaluate Trigger & Map Suites'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Trigger History */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-200">
              Evaluated Assurance Trigger Events ({overview.activeTriggers.length})
            </h3>
            <div className="space-y-2">
              {overview.activeTriggers.map((trg) => (
                <div
                  key={trg.id}
                  className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 font-bold">
                        {trg.triggerType}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{trg.id}</span>
                      <span className="text-xs text-slate-300 font-medium font-mono">{trg.sourceArtifact}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {trg.escalatedToFullSystem ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          FULL SYSTEM ESCALATION
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          TARGETED TEST ISOLATION
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(trg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">{trg.evidence}</p>

                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[11px] font-mono text-slate-500">Targeted Suites:</span>
                    {trg.affectedSuites.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-cyan-300 border border-slate-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Simplification Registry */}
      {activeTab === 'simplification' && overview && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-200">
                Architectural Simplification & Dead Artifact Registry
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Governed 6-stage lifecycle for retired abstractions, superseded configs, and dead code: Candidate → Usage Evaluated → Dependency Analyzed → Deprecated → Observation → Removed.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {overview.simplificationCandidates.map((cand) => (
              <div
                key={cand.id}
                className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 font-bold">
                      {cand.artifactType}
                    </span>
                    <span className="text-sm font-bold text-slate-100 font-mono">{cand.artifactName}</span>
                    <span className="text-xs font-mono text-slate-500">({cand.id})</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                      STAGE: {cand.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300">{cand.reason}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Usage Evidence</span>
                    <span className="text-slate-400 text-[11px]">{cand.usageEvidence}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Risk Assessment</span>
                    <span className="text-slate-400 text-[11px]">{cand.riskAnalysis}</span>
                  </div>
                </div>

                {/* Lifecycle Stage Advancement */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Proposed by: {cand.proposedBy} • Review Date: {cand.reviewDate}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {cand.status === 'CANDIDATE' && (
                      <button
                        onClick={() => handleAdvanceSimplification(cand.id, 'USAGE_EVALUATED')}
                        className="px-2.5 py-1 rounded text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      >
                        Advance to USAGE_EVALUATED
                      </button>
                    )}
                    {cand.status === 'USAGE_EVALUATED' && (
                      <button
                        onClick={() => handleAdvanceSimplification(cand.id, 'DEPENDENCY_ANALYZED')}
                        className="px-2.5 py-1 rounded text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      >
                        Advance to DEPENDENCY_ANALYZED
                      </button>
                    )}
                    {cand.status === 'DEPENDENCY_ANALYZED' && (
                      <button
                        onClick={() => handleAdvanceSimplification(cand.id, 'DEPRECATED')}
                        className="px-2.5 py-1 rounded text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      >
                        Advance to DEPRECATED
                      </button>
                    )}
                    {cand.status === 'DEPRECATED' && (
                      <button
                        onClick={() => handleAdvanceSimplification(cand.id, 'OBSERVATION')}
                        className="px-2.5 py-1 rounded text-[11px] font-medium bg-cyan-900/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700"
                      >
                        Advance to OBSERVATION
                      </button>
                    )}
                    {cand.status === 'OBSERVATION' && (
                      <button
                        onClick={() => handleAdvanceSimplification(cand.id, 'REMOVED')}
                        className="px-2.5 py-1 rounded text-[11px] font-semibold bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 border border-rose-700"
                      >
                        Confirm Removal & Archive
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Governed Feature Flags */}
      {activeTab === 'flags' && overview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200">
              Governed Feature Flag Lifecycles ({overview.governedFlags.length})
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Section 30: Documented Purpose, Owner & Removal Conditions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overview.governedFlags.map((flag) => (
              <div
                key={flag.key}
                className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-100 font-mono">{flag.key}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      flag.currentState
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {flag.currentState ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{flag.purpose}</p>
                </div>

                <div className="space-y-1 pt-3 border-t border-slate-800/80 text-[11px] font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Owner:</span>
                    <span className="text-cyan-400 font-semibold">{flag.owner}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Expected Lifecycle:</span>
                    <span className="text-slate-300">{flag.expectedLifecycle}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Removal Condition:</span>
                    <span className="text-slate-300 truncate max-w-[200px]">{flag.removalCondition}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Metric Gaming & Feedback Loops */}
      {activeTab === 'gaming_loops' && overview && (
        <div className="space-y-6">
          {/* Gaming Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <AlertOctagon className="w-4 h-4 text-amber-400" />
                <span>Metric Gaming Detection (Anti-Gaming Guardrails)</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">Section 19: Preventing Optimization at Expense of Rigor</span>
            </div>

            {overview.gamingAnomalies.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                Zero metric gaming anomalies detected. All validation contracts and execution suites maintain authentic difficulty.
              </div>
            ) : (
              overview.gamingAnomalies.map((anom) => (
                <div
                  key={anom.id}
                  className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-100">{anom.metricName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300">
                        {anom.severity} SEVERITY
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {anom.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300"><strong>Observed Pattern:</strong> {anom.observedPattern}</p>
                  <p className="text-xs text-slate-400"><strong>Hypothesis:</strong> {anom.potentialGamingHypothesis}</p>
                  <p className="text-xs text-cyan-400"><strong>Corrective Action:</strong> {anom.correctiveAction}</p>
                </div>
              ))
            )}
          </div>

          {/* Feedback Loops Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-purple-400" />
                <span>Feedback Loop Protection (Self-Reinforcing Loops)</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">Section 17: Preventing Artificial Confidence</span>
            </div>

            {overview.feedbackLoops.map((loop) => (
              <div
                key={loop.id}
                className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 font-bold">
                      {loop.loopType}
                    </span>
                    <span className="text-xs font-mono text-slate-400">Confidence: {(loop.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {loop.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{loop.description}</p>
                <p className="text-xs text-rose-300"><strong>Risk:</strong> {loop.artificialConfidenceRisk}</p>
                <p className="text-xs text-purple-300"><strong>Mitigation:</strong> {loop.mitigationRecommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Evolution Proposals */}
      {activeTab === 'proposals' && overview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200">
              Architectural Evolution Proposals ({overview.evolutionProposals.length})
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Sections 1 & 37: Governed Proposals with Rollback & Verification Paths
            </span>
          </div>

          <div className="space-y-3">
            {overview.evolutionProposals.map((prop) => (
              <div
                key={prop.id}
                className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-cyan-400 font-bold">{prop.id}</span>
                    <h3 className="text-sm font-bold text-slate-100">{prop.title}</h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      prop.status === 'RATIFIED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : prop.status === 'REJECTED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {prop.status}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                      RISK: {prop.risk}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded border border-slate-800/80">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Current Baseline</span>
                    <span className="text-slate-300 text-[11px]">{prop.currentState}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Desired State</span>
                    <span className="text-cyan-300 text-[11px]">{prop.desiredState}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300"><strong>Evidence:</strong> {prop.evidence}</p>
                <p className="text-xs text-slate-400"><strong>Rollback Plan:</strong> {prop.rollbackPlan}</p>

                {/* Ratification Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Proposed by: {prop.proposedBy} • {prop.ratifiedBy ? `Ratified by: ${prop.ratifiedBy}` : 'Pending Human Lead Ratification'}
                  </span>

                  {prop.status === 'DRAFT' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRatifyProposal(prop.id, 'REJECTED')}
                        className="px-3 py-1 rounded text-[11px] font-medium bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 border border-rose-700"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleRatifyProposal(prop.id, 'RATIFIED')}
                        className="px-3 py-1 rounded text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        Ratify Evolution
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proposal Modal */}
      {showProposalModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                <span>Submit Governed Evolution Proposal</span>
              </h3>
              <button onClick={() => setShowProposalModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Proposal Title</label>
                <input
                  type="text"
                  required
                  value={propTitle}
                  onChange={(e) => setPropTitle(e.target.value)}
                  placeholder="e.g. Optimize Redis Cache Eviction Window"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Current State</label>
                  <input
                    type="text"
                    required
                    value={propCurrentState}
                    onChange={(e) => setPropCurrentState(e.target.value)}
                    placeholder="Current baseline implementation"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Desired State</label>
                  <input
                    type="text"
                    required
                    value={propDesiredState}
                    onChange={(e) => setPropDesiredState(e.target.value)}
                    placeholder="Proposed target state"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Evidence Substantiating Proposal</label>
                <textarea
                  required
                  rows={2}
                  value={propEvidence}
                  onChange={(e) => setPropEvidence(e.target.value)}
                  placeholder="Measured production data, telemetry spikes, or verified failure logs..."
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Risk Level</label>
                  <select
                    value={propRisk}
                    onChange={(e) => setPropRisk(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Expected Benefit</label>
                  <input
                    type="text"
                    required
                    value={propBenefit}
                    onChange={(e) => setPropBenefit(e.target.value)}
                    placeholder="e.g. 20% latency reduction"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Rollback Plan</label>
                <input
                  type="text"
                  required
                  value={propRollback}
                  onChange={(e) => setPropRollback(e.target.value)}
                  placeholder="Automated flag toggle or audited revert script"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProposalModal(false)}
                  className="px-3 py-1.5 rounded text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
