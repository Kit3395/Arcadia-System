import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  Clock,
  Brain,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Filter,
  Play,
  Layers,
  ChevronDown,
  ChevronRight,
  Check,
  RefreshCw,
  Cpu,
  BarChart3,
  Sliders,
  Sparkles,
  ShieldCheck,
  Lock,
  Eye,
  Info
} from 'lucide-react';
import {
  Project,
  User,
  OptimizationRecommendation,
  OptimizationAction,
  OptimizationPolicy,
  CostEstimate,
  DurationBreakdown,
  CriticalPathAnalysis,
  WorkflowLoadIndicator,
  ContextualTrustProfile,
  TrustEvent,
  OptimizationCategory,
  OptimizationStatus
} from '../types/index.ts';

interface OptimizationViewProps {
  project: Project | null;
  currentUser: User | null;
  onRefreshProjectData: () => void;
}

type OptimizationSubTab = 'overview' | 'recommendations' | 'cost' | 'temporal' | 'workflow-load' | 'trust' | 'policies';

export const OptimizationView: React.FC<OptimizationViewProps> = ({
  project,
  currentUser,
  onRefreshProjectData
}) => {
  const [activeTab, setActiveTab] = useState<OptimizationSubTab>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Phase 8 State
  const [overviewMetrics, setOverviewMetrics] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [costData, setCostData] = useState<any>(null);
  const [temporalData, setTemporalData] = useState<{
    durations?: DurationBreakdown;
    criticalPath?: CriticalPathAnalysis;
    prediction?: any;
  }>({});
  const [workflowLoad, setWorkflowLoad] = useState<WorkflowLoadIndicator | null>(null);
  const [trustData, setTrustData] = useState<{
    trustEvents: TrustEvent[];
    profiles: ContextualTrustProfile[];
  }>({ trustEvents: [], profiles: [] });
  const [policies, setPolicies] = useState<OptimizationPolicy[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);

  // Interactive Tools State
  const [selectedTaskIdForCost, setSelectedTaskIdForCost] = useState('tsk-001');
  const [costEstimateResult, setCostEstimateResult] = useState<CostEstimate | null>(null);
  const [delayTaskInput, setDelayTaskInput] = useState('tsk-001');
  const [delayMinutesInput, setDelayMinutesInput] = useState(30);
  const [delaySimResult, setDelaySimResult] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Progressive Disclosure / Blocker First UI Simulation
  const [blockerFirstMode, setBlockerFirstMode] = useState(false);

  const fetchOptimizationData = useCallback(async () => {
    if (!project) return;
    setIsLoading(true);
    try {
      const [ovRes, recRes, costRes, timeRes, loadRes, trustRes, polRes, expRes] = await Promise.all([
        fetch(`/api/projects/${project.id}/optimization/overview`),
        fetch(`/api/projects/${project.id}/optimization/recommendations`),
        fetch(`/api/projects/${project.id}/optimization/cost`),
        fetch(`/api/projects/${project.id}/optimization/temporal`),
        fetch(`/api/projects/${project.id}/optimization/workflow-load`),
        fetch(`/api/projects/${project.id}/optimization/trust`),
        fetch(`/api/projects/${project.id}/optimization/policies`),
        fetch(`/api/projects/${project.id}/optimization/experiments`)
      ]);

      if (ovRes.ok) setOverviewMetrics(await ovRes.json());
      if (recRes.ok) setRecommendations(await recRes.json());
      if (costRes.ok) setCostData(await costRes.json());
      if (timeRes.ok) setTemporalData(await timeRes.json());
      if (loadRes.ok) setWorkflowLoad(await loadRes.json());
      if (trustRes.ok) setTrustData(await trustRes.json());
      if (polRes.ok) setPolicies(await polRes.json());
      if (expRes.ok) setExperiments(await expRes.json());
    } catch (err) {
      console.error('Failed to fetch optimization data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [project]);

  useEffect(() => {
    fetchOptimizationData();
  }, [fetchOptimizationData]);

  const handleApplyRecommendation = async (recId: string) => {
    if (!project) return;
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/optimization/recommendations/${recId}/apply`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to apply recommendation');
      }
      setFeedbackMessage({
        type: 'success',
        text: `Intervention Applied! Action ID: ${data.action?.id}. Strategy applied through governed safety gates.`
      });
      fetchOptimizationData();
      onRefreshProjectData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (recId: string, status: OptimizationStatus) => {
    if (!project) return;
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/optimization/recommendations/${recId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: `Status updated to ${status} by ${currentUser?.role}` })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to update status');
      }
      setFeedbackMessage({ type: 'success', text: `Recommendation marked as ${status}.` });
      fetchOptimizationData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEstimateTaskCost = async () => {
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/optimization/cost/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: selectedTaskIdForCost })
      });
      if (res.ok) {
        setCostEstimateResult(await res.json());
      }
    } catch (err) {
      console.error('Estimate error:', err);
    }
  };

  const handleSimulateDelay = async () => {
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/optimization/temporal/delay-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: delayTaskInput, delaySeconds: delayMinutesInput * 60 })
      });
      if (res.ok) {
        setDelaySimResult(await res.json());
      }
    } catch (err) {
      console.error('Delay sim error:', err);
    }
  };

  if (!project) {
    return (
      <div className="p-8 text-center text-slate-400">
        Please select a project to view Optimization Intelligence.
      </div>
    );
  }

  const filteredRecs = recommendations.filter(r => {
    if (filterCategory === 'ALL') return true;
    return r.category === filterCategory;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                <span>Optimization & Cost Telemetry</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-normal">
                  TELEMETRY & ADAPTATION
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Telemetry Ingestion • Cost Modeling • Critical Path Dynamics • Ergonomic Workflow Complexity • Trust Calibration
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchOptimizationData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-200 text-xs font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'overview'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'recommendations'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Recommendations</span>
          {recommendations.filter(r => r.status === 'PROPOSED').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300">
              {recommendations.filter(r => r.status === 'PROPOSED').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cost')}
          className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'cost'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Cost Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('temporal')}
          className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'temporal'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Temporal & Critical Path</span>
        </button>

        <button
          onClick={() => setActiveTab('workflow-load')}
          className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'workflow-load'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Workflow Complexity</span>
        </button>

        <button
          onClick={() => setActiveTab('trust')}
          className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'trust'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Trust Calibration</span>
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'policies'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Policies & Guardrails</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. OVERVIEW SUBTAB */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Observed Cost</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold font-mono text-slate-100">
                  ${overviewMetrics?.totalCost?.toFixed(2) || '0.58'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  est. $0.40 - $0.75
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-2">
                <span>Budget Variance:</span>
                <span className="text-emerald-400 font-mono font-medium">-18% below cap</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Critical Path Duration</span>
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold font-mono text-slate-100">
                  {overviewMetrics?.criticalPathDurationHours ? `${overviewMetrics.criticalPathDurationHours}h` : '4.0h'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {temporalData.criticalPath?.blockingTasks.length || 0} blockers
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-2">
                <span>Schedule Risk:</span>
                <span className="text-amber-400 font-mono font-medium">LOW (On Track)</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Workflow Complexity</span>
                <Brain className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold font-mono text-slate-100">
                  {workflowLoad?.derivedScore ?? 28}
                  <span className="text-xs text-slate-500 font-normal">/100</span>
                </span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                  workflowLoad?.loadLevel === 'NORMAL' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {workflowLoad?.loadLevel || 'NORMAL'}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-2">
                <span>Cognitive Invariant:</span>
                <span className="text-slate-400">Operational Only</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Trust & Interventions</span>
                <ShieldCheck className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold font-mono text-slate-100">
                  {overviewMetrics?.appliedInterventionsCount ?? 1}
                </span>
                <span className="text-[11px] text-slate-400">
                  applied / {overviewMetrics?.activeRecommendationsCount ?? recommendations.length} proposed
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-2">
                <span>Total Savings:</span>
                <span className="text-emerald-400 font-mono font-medium">${overviewMetrics?.savingsGenerated?.toFixed(2) || '0.12'}</span>
              </div>
            </div>
          </div>

          {/* Quick Intervention Recommendation Banner */}
          {recommendations.filter(r => r.status === 'PROPOSED').length > 0 && (
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-slate-900 border border-emerald-500/30 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                      Primary Optimization Opportunity
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      HIGH CONFIDENCE
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-100">
                    {recommendations[0]?.proposedStrategy}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                    <span className="text-slate-400 font-medium">Observed: </span>
                    {recommendations[0]?.observedProblem}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-400">
                    <span className="font-mono text-emerald-300">Benefit: {recommendations[0]?.expectedBenefit}</span>
                    <span>•</span>
                    <span>Reversibility: {recommendations[0]?.reversibility}</span>
                    <span>•</span>
                    <span>Required Authority: <strong className="text-slate-200">{recommendations[0]?.requiredAuthority}</strong></span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center space-x-2.5">
                  <button
                    onClick={() => handleApplyRecommendation(recommendations[0]?.id)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Apply Intervention</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('recommendations')}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                  >
                    Inspect Details
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dual Analytics Row: Cost Breakdown & Critical Path Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Breakdown */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Cost Distribution by Category</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Total: ${costData?.actuals?.total?.toFixed(2) || '0.58'}
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {costData?.actuals?.byCategory && Object.entries(costData.actuals.byCategory).map(([cat, amount]: any) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-mono text-slate-300">{cat}</span>
                      <span className="font-mono text-emerald-400">${Number(amount).toFixed(3)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, (Number(amount) / (costData.actuals.total || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Path & Timeline Summary */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Execution Duration Breakdown</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Elapsed: {temporalData.durations?.TOTAL_ELAPSED ? `${Math.round(temporalData.durations.TOTAL_ELAPSED / 60)}m` : '240m'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] font-mono uppercase text-slate-500">Active Execution</div>
                  <div className="text-lg font-mono font-semibold text-slate-200 mt-0.5">
                    {Math.round((temporalData.durations?.ACTIVE || 3600) / 60)}m
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1">Value-Add</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] font-mono uppercase text-slate-500">Review & Gates</div>
                  <div className="text-lg font-mono font-semibold text-slate-200 mt-0.5">
                    {Math.round((temporalData.durations?.REVIEW || 900) / 60)}m
                  </div>
                  <div className="text-[10px] text-indigo-400 mt-1">Governance</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] font-mono uppercase text-slate-500">Rework / Retries</div>
                  <div className="text-lg font-mono font-semibold text-slate-200 mt-0.5">
                    {Math.round((temporalData.durations?.REWORK || 300) / 60)}m
                  </div>
                  <div className="text-[10px] text-amber-400 mt-1">Waste Elimination</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1 text-xs">
                <div className="text-slate-400 font-medium">Critical Bottlenecks:</div>
                <div className="text-slate-300 font-mono text-[11px]">
                  {temporalData.criticalPath?.bottlenecks?.[0] || 'No critical path stalls detected.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RECOMMENDATIONS SUBTAB (Strict 8-Point Information Hierarchy) */}
      {/* ========================================================================= */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-300">Category Filter:</span>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs font-mono"
              >
                <option value="ALL">All Categories</option>
                <option value="CONTEXT_OPTIMIZATION">Context Optimization</option>
                <option value="RETRY_OPTIMIZATION">Retry Optimization</option>
                <option value="TEMPORAL_OPTIMIZATION">Temporal Optimization</option>
                <option value="WORKFLOW_OPTIMIZATION">Workflow Optimization</option>
                <option value="COST_OPTIMIZATION">Cost Optimization</option>
                <option value="AGENT_SELECTION">Agent Selection</option>
              </select>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Showing {filteredRecs.length} of {recommendations.length} recommendations
            </div>
          </div>

          {/* Recommendations List */}
          <div className="space-y-5">
            {filteredRecs.map(rec => (
              <div
                key={rec.id}
                className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition"
              >
                {/* Header Badge Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {rec.category}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Scope: {rec.scope}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      rec.status === 'APPLIED'
                        ? 'bg-purple-500/20 text-purple-300'
                        : rec.status === 'APPROVED'
                        ? 'bg-blue-500/20 text-blue-300'
                        : rec.status === 'REJECTED'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      STATUS: {rec.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
                    <span>Reversibility: <strong className="text-slate-300">{rec.reversibility}</strong></span>
                    <span>•</span>
                    <span>Confidence: <strong className="text-emerald-400">{rec.confidence}</strong></span>
                  </div>
                </div>

                {/* 8-Point Structured Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Point 1: What needs attention */}
                  <div className="space-y-1">
                    <div className="font-mono text-[10px] text-amber-400 uppercase tracking-wider font-semibold">
                      1. What Needs Attention?
                    </div>
                    <div className="text-slate-200 font-medium leading-relaxed">
                      {rec.observedProblem}
                    </div>
                  </div>

                  {/* Point 2: Why? (Evidence) */}
                  <div className="space-y-1">
                    <div className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      2. Why? (Evidence)
                    </div>
                    <div className="text-slate-300 font-mono text-[11px] bg-slate-950/60 p-2 rounded border border-slate-800">
                      {rec.evidence}
                    </div>
                  </div>

                  {/* Point 3: What does Arcadia recommend? */}
                  <div className="space-y-1">
                    <div className="font-mono text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">
                      3. What Does Arcadia Recommend?
                    </div>
                    <div className="text-emerald-300 font-medium leading-relaxed">
                      {rec.proposedStrategy}
                    </div>
                  </div>

                  {/* Point 4: What will change? */}
                  <div className="space-y-1">
                    <div className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      4. What Will Change?
                    </div>
                    <div className="text-slate-300">
                      Current: <span className="line-through text-slate-500">{rec.currentStrategy}</span>
                      <div className="mt-0.5 text-slate-400">
                        Affected Tasks: {rec.affectedTasks.join(', ') || 'All execution tasks'}
                      </div>
                    </div>
                  </div>

                  {/* Point 5: What could improve? */}
                  <div className="space-y-1">
                    <div className="font-mono text-[10px] text-cyan-400 uppercase tracking-wider font-semibold">
                      5. What Could Improve?
                    </div>
                    <div className="text-slate-200">
                      {rec.expectedBenefit} (Estimated Net Cost: {rec.expectedCost})
                    </div>
                  </div>

                  {/* Point 6: What could go wrong? */}
                  <div className="space-y-1">
                    <div className="font-mono text-[10px] text-rose-400 uppercase tracking-wider font-semibold">
                      6. What Could Go Wrong? (Risks & Impacts)
                    </div>
                    <div className="text-slate-300">
                      {rec.risks.join('; ')}
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Security Impact: {rec.securityImpact} • Governance: {rec.governanceImpact}
                      </div>
                    </div>
                  </div>

                  {/* Point 7: Who must approve? */}
                  <div className="space-y-1">
                    <div className="font-mono text-[10px] text-purple-400 uppercase tracking-wider font-semibold">
                      7. Who Must Approve?
                    </div>
                    <div className="text-slate-200 font-medium">
                      Required Authority: <span className="font-mono text-purple-300">{rec.requiredAuthority}</span>
                      {rec.securityImpact === 'HIGH' && (
                        <span className="ml-2 text-rose-400 font-mono">(Strict Security Sign-off Required)</span>
                      )}
                    </div>
                  </div>

                  {/* Point 8: How will success be measured? */}
                  <div className="space-y-1">
                    <div className="font-mono text-[10px] text-indigo-400 uppercase tracking-wider font-semibold">
                      8. How Will Success Be Measured?
                    </div>
                    <div className="text-slate-300 font-mono text-[11px]">
                      {rec.validationRequirements.join('; ') || 'Standard gate contract validation'}
                    </div>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-500 font-mono">
                    ID: {rec.id} • Expires: {new Date(rec.expiration).toLocaleDateString()}
                  </div>

                  <div className="flex items-center space-x-2">
                    {rec.status === 'PROPOSED' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(rec.id, 'APPROVED')}
                          className="px-3 py-1.5 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApplyRecommendation(rec.id)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Apply Intervention</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(rec.id, 'REJECTED')}
                          className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-medium border border-slate-700 transition"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {rec.status === 'APPROVED' && (
                      <button
                        onClick={() => handleApplyRecommendation(rec.id)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Execute Approved Intervention</span>
                      </button>
                    )}

                    {rec.status === 'APPLIED' && (
                      <span className="text-xs text-purple-400 font-mono flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Governed in Production</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. COST ENGINE SUBTAB */}
      {/* ========================================================================= */}
      {activeTab === 'cost' && (
        <div className="space-y-6">
          {/* Top Banner: Observed vs Estimated Range */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Cost Model & Observed Expenditure
                </h3>
                <p className="text-xs text-slate-400">
                  Rates configured for Gemini 2.5 Pro ($0.00125/1k tokens), GPT-4o, Claude 3.5 Sonnet, and local validation runtime.
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 font-mono uppercase">Cumulative Project Spend</div>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  ${costData?.actuals?.total?.toFixed(3) || '0.582'}
                </div>
              </div>
            </div>

            {/* Anomaly Alerts */}
            {costData?.anomalies && costData.anomalies.length > 0 && (
              <div className="space-y-2 pt-2">
                {costData.anomalies.map((anom: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        <strong>Cost Anomaly Detected:</strong> {anom.category} cost (${anom.observed}) exceeded anomaly threshold of ${anom.threshold}. {anom.message}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      FLAGGED FOR REVIEW
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Tool: Task Cost Estimator */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Interactive Task Cost Estimator</span>
            </h3>
            <p className="text-xs text-slate-400">
              Arcadia estimates task execution costs as expected ranges with explicit confidence intervals, preventing artificial precision.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <select
                value={selectedTaskIdForCost}
                onChange={e => setSelectedTaskIdForCost(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-3 py-1.5 text-xs font-mono"
              >
                <option value="tsk-001">Task 1: Core Foundation Scaffold</option>
                <option value="tsk-002">Task 2: RBAC Policy Engine</option>
                <option value="tsk-003">Task 3: Security AST Boundary Validator</option>
              </select>

              <button
                onClick={handleEstimateTaskCost}
                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
              >
                Compute Range Estimate
              </button>
            </div>

            {costEstimateResult && (
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3 mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">
                    Estimated Range for Task ({costEstimateResult.taskId}):
                  </span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    ${costEstimateResult.minCost.toFixed(3)} – ${costEstimateResult.maxCost.toFixed(3)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-slate-900">Expected: ${costEstimateResult.expectedCost.toFixed(3)}</div>
                  <div className="p-2 rounded bg-slate-900">Confidence: {costEstimateResult.confidence}</div>
                  <div className="p-2 rounded bg-slate-900">Classification: {costEstimateResult.classification}</div>
                </div>
                <div className="text-[11px] text-slate-400">
                  Includes expected token consumption, multi-pass validation runs, and estimated recovery retry buffer.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TEMPORAL & CRITICAL PATH SUBTAB */}
      {/* ========================================================================= */}
      {activeTab === 'temporal' && (
        <div className="space-y-6">
          {/* Critical Path Map */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Critical Path Sequence & Timeline Risk</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Evaluates dependency chains to determine true completion bottlenecks and total path duration.
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 font-mono">Predicted Window</div>
                <div className="text-sm font-mono font-bold text-cyan-400">
                  {temporalData.prediction?.expectedCompletionWindow || 'Today 18:00 – Tomorrow 10:00'}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs text-slate-300 font-medium">Critical Tasks on Governing Path:</div>
              <div className="flex flex-wrap gap-2">
                {temporalData.criticalPath?.criticalTasks && temporalData.criticalPath.criticalTasks.length > 0 ? (
                  temporalData.criticalPath.criticalTasks.map((tId: string) => (
                    <span
                      key={tId}
                      className="px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs"
                    >
                      {tId}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 font-mono">tsk-001 (Core Scaffold) → tsk-002 (RBAC Engine)</span>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Tool: Delay Propagation Simulator */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Delay Propagation Simulator</span>
            </h3>
            <p className="text-xs text-slate-400">
              Simulate the impact of upstream stalls or validation re-runs on downstream project milestones.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <select
                value={delayTaskInput}
                onChange={e => setDelayTaskInput(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-3 py-1.5 text-xs font-mono"
              >
                <option value="tsk-001">Task 1: Core Foundation Scaffold</option>
                <option value="tsk-002">Task 2: RBAC Policy Engine</option>
              </select>

              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-400 font-mono">Delay (min):</span>
                <input
                  type="number"
                  value={delayMinutesInput}
                  onChange={e => setDelayMinutesInput(Number(e.target.value))}
                  className="w-20 bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-1.5 text-xs font-mono"
                />
              </div>

              <button
                onClick={handleSimulateDelay}
                className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition"
              >
                Simulate Propagation
              </button>
            </div>

            {delaySimResult && (
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 mt-3 text-xs">
                <div className="font-mono text-cyan-300 font-semibold">
                  Delay Propagation Analysis:
                </div>
                <div className="text-slate-300">
                  {delaySimResult.propagationImpact}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Downstream Tasks Delayed: {delaySimResult.delayedTasks?.join(', ') || 'None directly impacted'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. WORKFLOW COMPLEXITY SUBTAB (Anti-Psychological Strict Invariant) */}
      {/* ========================================================================= */}
      {activeTab === 'workflow-load' && (
        <div className="space-y-6">
          {/* Safeguard Invariant Banner */}
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs">
              <Info className="w-4 h-4" />
              <span className="font-mono uppercase tracking-wider">
                Strict Architectural Invariant: Non-Psychological Workflow Measurement
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Arcadia’s Cognitive Load Engine measures operational workflow complexity and the ergonomics of human-system interaction. It <strong>never</strong> attempts to diagnose, infer, or track human psychological, mental-health, or emotional conditions. It strictly observes unresolved decisions, concurrent tasks, context switches, and review backlog.
            </p>
          </div>

          {/* Operational Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="text-xs font-mono uppercase text-slate-500">Operational Complexity Score</div>
              <div className="text-3xl font-bold font-mono text-slate-100">
                {workflowLoad?.derivedScore ?? 28}
                <span className="text-sm font-normal text-slate-500">/100</span>
              </div>
              <div className="text-xs text-slate-400">
                Level: <strong className="text-emerald-400 font-mono">{workflowLoad?.loadLevel || 'NORMAL'}</strong>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="text-xs font-mono uppercase text-slate-500">Primary Workflow Drivers</div>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                {workflowLoad?.primaryDrivers?.map((driver, idx) => (
                  <li key={idx}>{driver}</li>
                )) || <li>Workflow running within normal thresholds.</li>}
              </ul>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="text-xs font-mono uppercase text-slate-500">Safe UI Presentation</div>
              <div className="text-xs text-slate-300 space-y-1">
                {workflowLoad?.recommendedUIAdaptations?.map((adap, idx) => (
                  <div key={idx} className="font-mono text-[11px] text-cyan-300 bg-slate-950 p-1.5 rounded">
                    {adap}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Raw Operational Factors Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-100">
              15 Raw Operational Complexity Factors
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono">
                <span className="text-slate-500 block text-[10px]">Unresolved Decisions</span>
                <span className="text-slate-200 text-sm font-bold">{workflowLoad?.rawFactors?.unresolvedDecisions ?? 0}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono">
                <span className="text-slate-500 block text-[10px]">Active Blockers</span>
                <span className="text-slate-200 text-sm font-bold">{workflowLoad?.rawFactors?.blockers ?? 0}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono">
                <span className="text-slate-500 block text-[10px]">Context Switches</span>
                <span className="text-slate-200 text-sm font-bold">{workflowLoad?.rawFactors?.contextSwitches ?? 1}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono">
                <span className="text-slate-500 block text-[10px]">Pending Approvals</span>
                <span className="text-slate-200 text-sm font-bold">{workflowLoad?.rawFactors?.pendingApprovals ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TRUST CALIBRATION SUBTAB */}
      {/* ========================================================================= */}
      {activeTab === 'trust' && (
        <div className="space-y-6">
          {/* Trust Invariant Banner */}
          <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-2">
            <div className="flex items-center space-x-2 text-purple-400 font-semibold text-xs">
              <Shield className="w-4 h-4" />
              <span className="font-mono uppercase tracking-wider">
                Governing Invariant: Contextual Reliability, Not Universal Agent Authority
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Arcadia does not score agents on a generic, permanent global slider. Trust is computed strictly in context: <code>(agentId, taskType, complexity, strategy)</code>. High trust <strong>never</strong> allows an agent to bypass validation gates, auto-approve scope expansion, or modify the Project Constitution.
            </p>
          </div>

          {/* Contextual Profiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trustData.profiles.map(p => (
              <div
                key={p.agentId}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="font-mono font-semibold text-slate-200 text-xs">
                    {p.agentId}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    Sample: {p.sampleSize} runs
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono py-1">
                  <div className="p-2 rounded bg-slate-950">
                    <span className="text-[10px] text-slate-500 block">Acceptance</span>
                    <span className="text-emerald-400 font-bold">{p.acceptanceRate}%</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950">
                    <span className="text-[10px] text-slate-500 block">Override</span>
                    <span className="text-amber-400 font-bold">{p.overrideRate}%</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950">
                    <span className="text-[10px] text-slate-500 block">Correction</span>
                    <span className="text-cyan-400 font-bold">{p.correctionRate}%</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-[11px] font-mono text-slate-400">Observed Strengths:</div>
                  <ul className="text-slate-300 list-disc list-inside text-[11px] space-y-0.5">
                    {p.observedStrengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>

                <div className="text-[11px] font-mono text-purple-300 bg-purple-500/10 p-2 rounded border border-purple-500/20">
                  Required Control: {p.recommendedControls.join('; ')}
                </div>
              </div>
            ))}
          </div>

          {/* Recent Trust Events Audit Trail */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-100">
              Authoritative Trust Events Audit Trail
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto font-mono text-xs">
              {trustData.trustEvents.map(ev => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      ev.outcome === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {ev.eventType}
                    </span>
                    <span className="text-slate-300">{ev.agentId}</span>
                    <span className="text-slate-500">• {ev.contextDetails}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. POLICIES & GUARDRAILS SUBTAB */}
      {/* ========================================================================= */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-100">
              Active Optimization Guardrails & Policies
            </h3>
            <p className="text-xs text-slate-400">
              Governs allowable automated adaptations, required role sign-offs, and strictly prohibited interventions.
            </p>

            <div className="space-y-4 pt-2">
              {policies.map(pol => (
                <div
                  key={pol.id}
                  className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-sm">{pol.name}</span>
                    <span className="font-mono text-emerald-400 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                      STATUS: {pol.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
                    <div>
                      <span className="font-mono text-[10px] text-emerald-400 uppercase block font-semibold">
                        Permitted Interventions
                      </span>
                      <ul className="list-disc list-inside mt-1 text-[11px] space-y-0.5">
                        {pol.allowedInterventions.map((ai, i) => <li key={i}>{ai}</li>)}
                      </ul>
                    </div>

                    <div>
                      <span className="font-mono text-[10px] text-rose-400 uppercase block font-semibold">
                        Strictly Prohibited Interventions
                      </span>
                      <ul className="list-disc list-inside mt-1 text-[11px] space-y-0.5 text-rose-300">
                        {pol.prohibitedInterventions.map((pi, i) => <li key={i}>{pi}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
