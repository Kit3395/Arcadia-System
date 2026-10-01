import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  ShieldAlert,
  GitBranch,
  TrendingUp,
  CheckCircle2,
  Clock,
  RotateCcw,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Hash,
  AlertTriangle,
  Lightbulb,
  FileCheck,
  Award,
  Layers,
  Activity,
  ArrowRight,
  ShieldCheck,
  Ban
} from 'lucide-react';
import {
  Project,
  User,
  OrganizationalMemory,
  DetectedPattern,
  LearningMetricSnapshot,
  EvolutionProposal,
  LearningOverviewMetrics,
  MemoryType,
  PatternCategory
} from '../types/index.ts';

interface LearningViewProps {
  project: Project;
  currentUser: User;
  onRefreshProjectData: () => void;
}

export const LearningView: React.FC<LearningViewProps> = ({
  project,
  currentUser,
  onRefreshProjectData
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'memories' | 'patterns' | 'evolution'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [overview, setOverview] = useState<LearningOverviewMetrics | null>(null);
  const [memories, setMemories] = useState<OrganizationalMemory[]>([]);
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);
  const [metrics, setMetrics] = useState<LearningMetricSnapshot[]>([]);
  const [proposals, setProposals] = useState<EvolutionProposal[]>([]);

  // Filter & Search states
  const [memoryFilter, setMemoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Propose Memory Modal
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [newMemory, setNewMemory] = useState({
    title: '',
    type: 'REUSABLE_BLUEPRINT' as MemoryType,
    category: 'GOVERNANCE_PATTERNS',
    summary: '',
    detailedContent: '',
    applicableContexts: 'TYPESCRIPT, ARCHITECTURE'
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { 'x-user-id': currentUser.id };

      const [resOverview, resMemories, resPatterns, resMetrics, resProposals] = await Promise.all([
        fetch(`/api/projects/${project.id}/learning/overview`, { credentials: 'include', headers }),
        fetch(`/api/projects/${project.id}/learning/memories`, { credentials: 'include', headers }),
        fetch(`/api/projects/${project.id}/learning/patterns`, { credentials: 'include', headers }),
        fetch(`/api/projects/${project.id}/learning/metrics`, { credentials: 'include', headers }),
        fetch(`/api/projects/${project.id}/learning/evolution/proposals`, { credentials: 'include', headers })
      ]);

      if (resOverview.ok) setOverview(await resOverview.json());
      if (resMemories.ok) setMemories(await resMemories.json());
      if (resPatterns.ok) setPatterns(await resPatterns.json());
      if (resMetrics.ok) setMetrics(await resMetrics.json());
      if (resProposals.ok) setProposals(await resProposals.json());
    } catch (err: any) {
      setError(err.message || 'Failed to load learning telemetry.');
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

  // Verify memory
  const handleVerifyMemory = async (memId: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/learning/memories/${memId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
        body: JSON.stringify({ method: 'MANUAL_HUMAN' })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Verification rejected.');
      }
      showNotification('Organizational memory verified with cryptographic seal.');
      fetchData();
      onRefreshProjectData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Propose memory
  const handleProposeMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.title || !newMemory.summary) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/learning/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
        body: JSON.stringify({
          ...newMemory,
          applicableContexts: newMemory.applicableContexts.split(',').map(s => s.trim()).filter(Boolean)
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to propose memory.');
      }
      setShowProposeModal(false);
      setNewMemory({
        title: '',
        type: 'REUSABLE_BLUEPRINT',
        category: 'GOVERNANCE_PATTERNS',
        summary: '',
        detailedContent: '',
        applicableContexts: 'TYPESCRIPT, ARCHITECTURE'
      });
      showNotification('Memory proposed and logged in controlled provenance store.');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Resolve pattern
  const handleResolvePattern = async (patId: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/learning/patterns/${patId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id }
      });
      if (!res.ok) throw new Error('Failed to resolve pattern.');
      showNotification('System pattern marked as mitigated and resolved.');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Synthesize proposals
  const handleSynthesizeProposals = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}/learning/evolution/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Synthesis failed.');
      }
      showNotification('Synthesized new evolution proposals governed by Constitution.');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Apply proposal
  const handleApplyProposal = async (propId: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/learning/evolution/proposals/${propId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Application rejected.');
      }
      showNotification('Evolution proposal applied with recorded reversible rollback trail.');
      fetchData();
      onRefreshProjectData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Rollback proposal
  const handleRollbackProposal = async (propId: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/learning/evolution/proposals/${propId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Rollback rejected.');
      }
      showNotification('Evolution mutation successfully rolled back to verified prior state.');
      fetchData();
      onRefreshProjectData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredMemories = memories.filter(m => {
    const matchesType = memoryFilter === 'ALL' || m.type === memoryFilter;
    const matchesSearch = searchQuery === '' ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.applicableContexts.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <span>Continuous Learning, Organizational Memory & System Evolution</span>
            </h1>
            <span className="text-xs font-mono text-purple-400 bg-purple-950/40 border border-purple-800/40 px-2 py-0.5 rounded">
              PHASE 9 • AUTONOMOUS EVOLUTION
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-resistant institutional memory, multi-dimensional learning metrics, automated pattern detection, and constitutionally governed reversible policy evolution.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Telemetry</span>
          </button>
          <button
            onClick={() => setShowProposeModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded bg-purple-600 hover:bg-purple-500 text-white transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Propose Memory</span>
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>System Resilience</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-purple-300">
              {overview?.systemResilienceScore ?? 85}/100
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">GOVERNED</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${overview?.systemResilienceScore ?? 85}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Verified Memories</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {overview?.verifiedMemoriesCount ?? 0}
            </span>
            <span className="text-xs text-slate-500">/ {overview?.totalMemoriesCount ?? 0} total</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Immutable Provenance Sealed</p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Patterns</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {overview?.activePatternsCount ?? 0}
            </span>
            {overview?.antiPatternsIdentified ? (
              <span className="text-xs text-rose-400 font-mono">({overview.antiPatternsIdentified} anti-patterns)</span>
            ) : null}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Telemetry Correlation Engine</p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>System Evolution</span>
            <GitBranch className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-cyan-300">
              {overview?.appliedMutationsCount ?? 0} Applied
            </span>
            <span className="text-xs text-slate-500">/ {overview?.evolutionProposalsCount ?? 0}</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 font-mono flex items-center space-x-1">
            <RotateCcw className="w-3 h-3" />
            <span>100% Reversible Rollbacks</span>
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-2 border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 px-3 font-medium transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'overview'
              ? 'border-purple-400 text-purple-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Learning Metrics & Trends</span>
        </button>

        <button
          onClick={() => setActiveTab('memories')}
          className={`pb-2.5 px-3 font-medium transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'memories'
              ? 'border-purple-400 text-purple-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Organizational Memory Bank</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {memories.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('patterns')}
          className={`pb-2.5 px-3 font-medium transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'patterns'
              ? 'border-purple-400 text-purple-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Detected Patterns & Anti-Patterns</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {patterns.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('evolution')}
          className={`pb-2.5 px-3 font-medium transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'evolution'
              ? 'border-purple-400 text-purple-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Governed System Evolution</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/40 font-mono">
            {proposals.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Overview & Metrics */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.map(metric => (
              <div key={metric.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">{metric.metricName}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    metric.trend === 'IMPROVING'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : metric.trend === 'DEGRADING'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {metric.trend}
                  </span>
                </div>

                <div className="flex items-baseline space-x-3">
                  <span className="text-2xl font-bold font-mono text-slate-100">
                    {metric.value}{metric.unit}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Baseline: {metric.baselineValue}{metric.unit}
                  </span>
                  <span className={`text-xs font-mono font-medium ${
                    metric.changePercent >= 0 ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    {metric.changePercent > 0 ? `+${metric.changePercent}%` : `${metric.changePercent}%`}
                  </span>
                </div>

                {metric.regressionAlert && (
                  <div className="p-2 bg-rose-950/40 border border-rose-800/50 rounded flex items-center space-x-2 text-[11px] text-rose-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{metric.alertMessage || 'Regression Alert: Exceeded anomaly threshold.'}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-slate-800/60">
                  <span>Confidence: {metric.confidence}</span>
                  <span>Sample Size: {metric.sampleSize} tasks</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Organizational Memory Bank */}
      {activeTab === 'memories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search memories or contexts..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-64 font-mono"
                />
              </div>

              <select
                value={memoryFilter}
                onChange={e => setMemoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-300 focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Memory Types</option>
                <option value="REUSABLE_BLUEPRINT">Reusable Blueprints</option>
                <option value="LESSON_LEARNED">Lessons Learned</option>
                <option value="ARCHITECTURAL_DECISION">ADRs</option>
                <option value="POST_MORTEM">Post-Mortems</option>
                <option value="FAILURE_TAXONOMY">Failure Taxonomy</option>
              </select>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Showing {filteredMemories.length} of {memories.length} entries
            </span>
          </div>

          <div className="space-y-3">
            {filteredMemories.map(mem => (
              <div key={mem.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      mem.type === 'REUSABLE_BLUEPRINT' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' :
                      mem.type === 'LESSON_LEARNED' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                      mem.type === 'ARCHITECTURAL_DECISION' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' :
                      'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}>
                      {mem.type}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100">{mem.title}</h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      mem.status === 'VERIFIED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                      mem.status === 'ACTIVE' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' :
                      'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {mem.status}
                    </span>

                    {mem.status === 'PROPOSED' && (currentUser.role === 'PROJECT_LEAD' || currentUser.role === 'ARCHITECT') && (
                      <button
                        onClick={() => handleVerifyMemory(mem.id)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded transition flex items-center space-x-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verify Seal</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{mem.summary}</p>
                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded font-mono text-[11px] text-slate-400 whitespace-pre-wrap">
                  {mem.detailedContent}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {mem.applicableContexts.map(c => (
                    <span key={c} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
                      {c}
                    </span>
                  ))}
                </div>

                {/* Provenance Box */}
                <div className="p-2.5 bg-slate-950/40 border border-slate-800/60 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                  <div className="flex items-center space-x-3">
                    <span>Author: {mem.provenance.authorId} ({mem.provenance.authorRole})</span>
                    {mem.provenance.verifiedBy && (
                      <span className="text-emerald-400">Verified by: {mem.provenance.verifiedBy}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-slate-400">
                    <Hash className="w-3 h-3 text-slate-500" />
                    <span className="truncate max-w-xs">{mem.provenance.immutableHash}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Pattern Engine */}
      {activeTab === 'patterns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Autonomous pattern detection across validation failure contracts, execution logs, and workflow queues.
            </p>
            <span className="text-xs font-mono text-slate-400">
              {patterns.filter(p => !p.resolved).length} Unresolved Patterns
            </span>
          </div>

          <div className="space-y-3">
            {patterns.map(pat => (
              <div key={pat.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      pat.category === 'ANTI_PATTERN' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
                      pat.category === 'REPEATED_FAILURE' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                      pat.category === 'SUCCESS_PATTERN' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                      'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                    }`}>
                      {pat.category}
                    </span>
                    <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {pat.signature}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100">{pat.title}</h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      pat.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-700' :
                      pat.severity === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                      'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {pat.severity}
                    </span>

                    {!pat.resolved ? (
                      <button
                        onClick={() => handleResolvePattern(pat.id)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
                      >
                        Resolve
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mitigated</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded space-y-1">
                    <span className="text-slate-400 font-medium">Root Cause Hypothesis:</span>
                    <p className="text-slate-300">{pat.rootCauseHypothesis}</p>
                  </div>
                  <div className="p-3 bg-purple-950/20 border border-purple-900/40 rounded space-y-1">
                    <span className="text-purple-300 font-medium">Actionable Mitigation:</span>
                    <p className="text-slate-300">{pat.actionableMitigation}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800/60">
                  <div className="flex items-center space-x-3">
                    <span>Occurrences: {pat.occurrenceCount}</span>
                    <span>Correlation: {(pat.correlationScore * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span>Affected: {pat.affectedComponents.join(', ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Governed System Evolution */}
      {activeTab === 'evolution' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 p-4 border border-slate-800 rounded-lg">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Autonomous Policy Synthesis & Mutation Engine</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Synthesize and evolve system rules based on organizational memories and detected patterns. Constitution is supreme and unwaiverable.
              </p>
            </div>
            <button
              onClick={handleSynthesizeProposals}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium transition shadow-sm flex items-center space-x-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Synthesize Proposals</span>
            </button>
          </div>

          <div className="space-y-3">
            {proposals.map(prop => (
              <div key={prop.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold">
                      {prop.targetDomain}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100">{prop.title}</h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      prop.status === 'APPLIED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                      prop.status === 'ROLLED_BACK' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                      prop.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
                      'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {prop.status}
                    </span>

                    {prop.status === 'PROPOSED' && (
                      <button
                        onClick={() => handleApplyProposal(prop.id)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded transition flex items-center space-x-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Apply Mutation</span>
                      </button>
                    )}

                    {prop.status === 'APPLIED' && (
                      <button
                        onClick={() => handleRollbackProposal(prop.id)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 rounded transition flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Rollback</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300">{prop.rationale}</p>

                {/* Proposed Mutation Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded space-y-1">
                    <span className="text-slate-500 text-[10px]">CURRENT BEHAVIOR:</span>
                    <p className="text-slate-300">{prop.currentValue}</p>
                  </div>
                  <div className="p-3 bg-cyan-950/30 border border-cyan-900/40 rounded space-y-1">
                    <span className="text-cyan-400 text-[10px]">PROPOSED ADAPTIVE RULE:</span>
                    <p className="text-cyan-200">{prop.proposedValue}</p>
                  </div>
                </div>

                {/* Simulation & Safeguards */}
                <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-mono">
                  <div className="flex items-center space-x-4">
                    <span className="text-emerald-400 font-semibold">
                      +{prop.simulatedImpact.predictedImprovementPercent}% Predicted Gain
                    </span>
                    <span className="text-slate-400">Risk: {prop.simulatedImpact.riskRating}</span>
                    <span className="text-slate-500">Authority: {prop.requiredAuthority}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-400">
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Rollback: {prop.rollbackAction || 'None'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Propose Memory Modal */}
      {showProposeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span>Propose Institutional Memory</span>
              </h2>
              <button onClick={() => setShowProposeModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <form onSubmit={handleProposeMemory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fine-Grained AST Dependency Extraction"
                  value={newMemory.title}
                  onChange={e => setNewMemory({ ...newMemory, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Memory Type</label>
                  <select
                    value={newMemory.type}
                    onChange={e => setNewMemory({ ...newMemory, type: e.target.value as MemoryType })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="REUSABLE_BLUEPRINT">Reusable Blueprint</option>
                    <option value="LESSON_LEARNED">Lesson Learned</option>
                    <option value="ARCHITECTURAL_DECISION">ADR</option>
                    <option value="POST_MORTEM">Post-Mortem</option>
                    <option value="FAILURE_TAXONOMY">Failure Taxonomy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Applicable Contexts (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="TYPESCRIPT, AST, PROMPT"
                    value={newMemory.applicableContexts}
                    onChange={e => setNewMemory({ ...newMemory, applicableContexts: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Summary</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Brief synopsis of what was learned or designed..."
                  value={newMemory.summary}
                  onChange={e => setNewMemory({ ...newMemory, summary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Detailed Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="In-depth technical specification, rationale, and implementation guidelines..."
                  value={newMemory.detailedContent}
                  onChange={e => setNewMemory({ ...newMemory, detailedContent: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProposeModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium transition shadow-sm"
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
