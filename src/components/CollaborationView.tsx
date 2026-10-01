import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Play,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Scale,
  RefreshCw,
  Award,
  GitMerge,
  Ban,
  Radio,
  Sliders,
  History,
  Bot
} from 'lucide-react';
import {
  Project,
  UniversalTaskSpecification,
  User,
  AgentProfile,
  CollaborationContract,
  CollaborationResult,
  AgentRole,
  CollaborationStrategy,
  TaskAgentCompatibility,
  AgentFailureSignature
} from '../types/index.ts';

interface CollaborationViewProps {
  project: Project | null;
  tasks: UniversalTaskSpecification[];
  currentUser: User | null;
  onRefreshProjectData: () => void;
  onNavigateToQueue?: () => void;
}

export const CollaborationView: React.FC<CollaborationViewProps> = ({
  project,
  tasks,
  currentUser,
  onRefreshProjectData,
  onNavigateToQueue
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.taskId || '');
  const [activeTab, setActiveTab] = useState<'orchestrate' | 'agents' | 'compatibility' | 'failures' | 'history'>('orchestrate');

  // Agent profiles and failure signatures
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [failureSignatures, setFailureSignatures] = useState<AgentFailureSignature[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  // Compatibility evaluation state
  const [compatibility, setCompatibility] = useState<TaskAgentCompatibility | null>(null);
  const [isEvaluatingCompat, setIsEvaluatingCompat] = useState(false);

  // Strategy recommendation & contract creation
  const [recommendedStrategy, setRecommendedStrategy] = useState<{
    strategy: CollaborationStrategy;
    confidence: number;
    reasoning: string;
    participants: Array<{ role: AgentRole; agentId: string; modelName: string; isIndependentReviewer?: boolean }>;
    riskFactors: string[];
  } | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<CollaborationStrategy>('EXECUTOR_CRITIC');

  // Collaboration state
  const [collaborations, setCollaborations] = useState<Array<{ contract: CollaborationContract; result: CollaborationResult }>>([]);
  const [activeContract, setActiveContract] = useState<CollaborationContract | null>(null);
  const [activeResult, setActiveResult] = useState<CollaborationResult | null>(null);

  // Execution & Simulation states
  const [isExecuting, setIsExecuting] = useState(false);
  const [simMode, setSimMode] = useState<'NORMAL' | 'SCOPE_BREACH' | 'DISAGREEMENT' | 'CRITIC_REJECT'>('NORMAL');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Human Lead Override modal/input
  const [overrideType, setOverrideType] = useState<'STOP' | 'REJECT' | 'REPLACE_AGENT' | 'CHANGE_STRATEGY' | 'FORCE_PASS'>('STOP');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);

  const selectedTask = tasks.find(t => t.taskId === selectedTaskId) || tasks[0] || null;

  // 1. Fetch Agents and Failure Signatures
  const fetchAgentsAndSignatures = useCallback(async () => {
    try {
      const [resAgents, resSigs] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/agents-meta/failure-signatures')
      ]);

      if (resAgents.ok) {
        const data: AgentProfile[] = await resAgents.json();
        setAgents(data);
        if (data.length > 0 && !selectedAgentId) {
          setSelectedAgentId(data[0].agentId);
        }
      }

      if (resSigs.ok) {
        const sigs: AgentFailureSignature[] = await resSigs.json();
        setFailureSignatures(sigs);
      }
    } catch (err) {
      console.error('Failed to load agent metadata:', err);
    }
  }, [selectedAgentId]);

  // 2. Fetch Project Collaborations
  const fetchProjectCollaborations = useCallback(async () => {
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/collaborations`);
      if (res.ok) {
        const list = await res.json();
        setCollaborations(list);
        if (list.length > 0 && !activeResult) {
          setActiveContract(list[0].contract);
          setActiveResult(list[0].result);
        }
      }
    } catch (err) {
      console.error('Failed to load project collaborations:', err);
    }
  }, [project, activeResult]);

  // 3. Fetch Strategy Recommendation for Selected Task
  const fetchStrategyRecommendation = useCallback(async () => {
    if (!project || !selectedTask) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/tasks/${selectedTask.taskId}/collaborations/recommend-strategy`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendedStrategy(data);
        setSelectedStrategy(data.strategy);
      }
    } catch (err) {
      console.error('Failed to fetch strategy recommendation:', err);
    }
  }, [project, selectedTask]);

  useEffect(() => {
    fetchAgentsAndSignatures();
  }, [fetchAgentsAndSignatures]);

  useEffect(() => {
    if (project) {
      fetchProjectCollaborations();
    }
  }, [project, fetchProjectCollaborations]);

  useEffect(() => {
    if (project && selectedTask) {
      fetchStrategyRecommendation();
    }
  }, [project, selectedTask, fetchStrategyRecommendation]);

  // Run Compatibility Check
  const handleEvaluateCompatibility = async (agentId: string) => {
    if (!project || !selectedTask) return;
    setIsEvaluatingCompat(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/compatibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: selectedTask.taskId, projectId: project.id })
      });
      if (res.ok) {
        const data = await res.json();
        setCompatibility(data);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Compatibility check failed' });
    } finally {
      setIsEvaluatingCompat(false);
    }
  };

  // Create Collaboration Contract
  const handleCreateContract = async () => {
    if (!project || !selectedTask) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/tasks/${selectedTask.taskId}/collaborations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: selectedStrategy })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to assemble collaboration contract');
      }

      const contract: CollaborationContract = await res.json();
      setActiveContract(contract);
      setActiveResult(null);
      setStatusMessage({
        type: 'success',
        text: `Collaboration Contract ${contract.id} assembled with Constitution as Supreme Authority.`
      });
      fetchProjectCollaborations();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  // Run Multi-Agent Collaboration Workflow
  const handleRunCollaboration = async () => {
    if (!activeContract) {
      setStatusMessage({ type: 'info', text: 'Assemble a Collaboration Contract first.' });
      return;
    }

    setIsExecuting(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/collaborations/${activeContract.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulateScopeBreach: simMode === 'SCOPE_BREACH',
          simulateAgentDisagreement: simMode === 'DISAGREEMENT',
          simulateReviewerRejection: simMode === 'CRITIC_REJECT'
        })
      });

      const data: CollaborationResult = await res.json();

      if (!res.ok) {
        throw new Error((data as any).message || 'Collaboration workflow halted');
      }

      setActiveResult(data);
      fetchProjectCollaborations();
      fetchAgentsAndSignatures();

      if (data.status === 'HALTED') {
        setStatusMessage({
          type: 'error',
          text: `Collaboration HALTED: Scope Lock violation trapped! Escalated to Decision Queue.`
        });
      } else if (data.validationStatus === 'PASSED') {
        setStatusMessage({
          type: 'success',
          text: `Collaboration completed successfully! Critic approved. Ready for Project Lead promotion.`
        });
      } else {
        setStatusMessage({
          type: 'info',
          text: `Collaboration ended with status ${data.status} and validation ${data.validationStatus}.`
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsExecuting(false);
    }
  };

  // Apply Human Lead Override
  const handleApplyOverride = async () => {
    if (!activeResult && !activeContract) return;
    const targetId = activeResult?.id || activeContract?.id;
    if (!targetId) return;

    try {
      const res = await fetch(`/api/collaborations/${targetId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrideType, reason: overrideReason })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Override rejected by RBAC');
      }

      const updated = await res.json();
      setActiveResult(updated);
      setShowOverrideDialog(false);
      setOverrideReason('');
      setStatusMessage({
        type: 'info',
        text: `Human Lead override (${overrideType}) recorded in immutable audit log.`
      });
      fetchProjectCollaborations();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  // Promote Staged Evidence to Authoritative State
  const handlePromoteEvidence = async () => {
    if (!activeResult) return;
    try {
      const res = await fetch(`/api/collaborations/${activeResult.id}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Evidence promotion failed');
      }

      setStatusMessage({
        type: 'success',
        text: `Evidence promoted to Authoritative State! Task ${selectedTask?.taskIdentifier} transitioned to PASSED.`
      });
      onRefreshProjectData();
      fetchProjectCollaborations();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const selectedAgent = agents.find(a => a.agentId === selectedAgentId) || agents[0];
  const isLead = currentUser?.role === 'PROJECT_LEAD';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Invariant Warning */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-semibold text-slate-100">
                  Agent Intelligence & Multi-Agent Collaboration
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  PHASE 6
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Invariant: Agents collaborate with each other, but the Project Constitution remains supreme authority.
              </p>
            </div>
          </div>
        </div>

        {/* Task Selector */}
        <div className="flex items-center space-x-3">
          <label className="text-xs font-mono text-slate-400">Target Task:</label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-3 py-1.5 font-mono focus:outline-none focus:border-indigo-500"
          >
            {tasks.map(t => (
              <option key={t.taskId} value={t.taskId}>
                {t.taskIdentifier} - {t.title.slice(0, 30)} ({t.complexity})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Banners */}
      {statusMessage && (
        <div
          className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMessage.type === 'success' ? (
              <ShieldCheck className="w-4 h-4 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <ShieldAlert className="w-4 h-4 shrink-0" />
            ) : (
              <Scale className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-200 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-800 text-xs font-mono">
        <button
          onClick={() => setActiveTab('orchestrate')}
          className={`px-4 py-2 border-b-2 font-medium flex items-center space-x-2 ${
            activeTab === 'orchestrate'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitMerge className="w-3.5 h-3.5" />
          <span>Active Collaboration</span>
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-2 border-b-2 font-medium flex items-center space-x-2 ${
            activeTab === 'agents'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Agent Behavioral Profiling</span>
        </button>

        <button
          onClick={() => setActiveTab('compatibility')}
          className={`px-4 py-2 border-b-2 font-medium flex items-center space-x-2 ${
            activeTab === 'compatibility'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Task Compatibility Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('failures')}
          className={`px-4 py-2 border-b-2 font-medium flex items-center space-x-2 ${
            activeTab === 'failures'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Failure Signatures ({failureSignatures.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 border-b-2 font-medium flex items-center space-x-2 ${
            activeTab === 'history'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Collaboration Audit ({collaborations.length})</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: ACTIVE COLLABORATION ORCHESTRATION                            */}
      {/* ==================================================================== */}
      {activeTab === 'orchestrate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Contract Assembly & Strategy */}
          <div className="lg:col-span-1 space-y-5">
            {/* Strategy Selection Card */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Collaboration Strategy</span>
                </span>
                {recommendedStrategy && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Recommended: {recommendedStrategy.strategy}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {(['EXECUTOR_CRITIC', 'SEQUENTIAL_REVIEW', 'PARALLEL_SPECIALISTS', 'PLANNER_EXECUTOR', 'SINGLE_AGENT'] as CollaborationStrategy[]).map(strat => (
                  <label
                    key={strat}
                    className={`flex items-start space-x-2.5 p-2.5 rounded border cursor-pointer text-xs font-mono transition-colors ${
                      selectedStrategy === strat
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="strategy"
                      value={strat}
                      checked={selectedStrategy === strat}
                      onChange={() => setSelectedStrategy(strat)}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-200">{strat}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {strat === 'EXECUTOR_CRITIC' && 'Primary executor draft + independent adversarial critic inspection.'}
                        {strat === 'SEQUENTIAL_REVIEW' && 'Architectural design -> Code execution -> Security audit pipeline.'}
                        {strat === 'PARALLEL_SPECIALISTS' && 'Domain specialized agents with distinct context partitions.'}
                        {strat === 'PLANNER_EXECUTOR' && 'Strategic step-decomposition before tool-enabled implementation.'}
                        {strat === 'SINGLE_AGENT' && 'Direct isolated execution with strict runtime sandbox.'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Simulation Mode Selector */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
                  <Radio className="w-3 h-3 text-amber-400" />
                  <span>Execution & Verification Mode:</span>
                </span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <button
                    onClick={() => setSimMode('NORMAL')}
                    className={`p-2 rounded border text-left ${
                      simMode === 'NORMAL'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Standard Verification
                  </button>
                  <button
                    onClick={() => setSimMode('SCOPE_BREACH')}
                    className={`p-2 rounded border text-left ${
                      simMode === 'SCOPE_BREACH'
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Simulate Scope Breach
                  </button>
                  <button
                    onClick={() => setSimMode('DISAGREEMENT')}
                    className={`p-2 rounded border text-left ${
                      simMode === 'DISAGREEMENT'
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Simulate Agent Conflict
                  </button>
                  <button
                    onClick={() => setSimMode('CRITIC_REJECT')}
                    className={`p-2 rounded border text-left ${
                      simMode === 'CRITIC_REJECT'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Simulate Critic Rejection
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleCreateContract}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-mono font-medium flex items-center justify-center space-x-2 transition-colors shadow"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>Assemble Collaboration Contract</span>
                </button>

                <button
                  onClick={handleRunCollaboration}
                  disabled={!activeContract || isExecuting}
                  className={`w-full py-2 rounded text-xs font-mono font-semibold flex items-center justify-center space-x-2 transition-colors ${
                    !activeContract || isExecuting
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                  }`}
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Running Multi-Agent Protocol...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Execute Collaboration Protocol</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Authority Boundary Card */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
              <span className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                <span>Authority Boundary Hierarchy</span>
              </span>
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="p-2 bg-slate-950 border border-indigo-500/40 rounded flex items-center justify-between text-indigo-300">
                  <span>1. Project Constitution</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 rounded">SUPREME</span>
                </div>
                <div className="p-2 bg-slate-950 border border-slate-800 rounded flex items-center justify-between text-slate-300">
                  <span>2. Governance Policies</span>
                  <span className="text-[10px] text-slate-400">Binding</span>
                </div>
                <div className="p-2 bg-slate-950 border border-slate-800 rounded flex items-center justify-between text-slate-300">
                  <span>3. Project State & Tasks</span>
                  <span className="text-[10px] text-slate-400">Scope Lock</span>
                </div>
                <div className="p-2 bg-slate-950 border border-slate-800 rounded flex items-center justify-between text-slate-400">
                  <span>4. Agent Claims & Evidence</span>
                  <span className="text-[10px] text-amber-400">Never Authority</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Execution Dashboard & Handoff Inspector */}
          <div className="lg:col-span-2 space-y-5">
            {/* Active Contract & Participants Banner */}
            {activeContract ? (
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-semibold text-indigo-300">
                      Contract: {activeContract.id}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {activeContract.strategy}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      activeContract.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : activeContract.status === 'HALTED'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    STATUS: {activeContract.status}
                  </span>
                </div>

                {/* Participants Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  {activeContract.participants.map(p => (
                    <div
                      key={p.agentId}
                      className={`p-2.5 rounded border ${
                        p.isIndependentReviewer
                          ? 'bg-purple-950/20 border-purple-500/30 text-purple-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{p.role}</span>
                        {p.isIndependentReviewer && (
                          <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/40">
                            INDEPENDENT
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">{p.agentId}</div>
                      <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-1">
                        {p.toolsAllowed.map(tool => (
                          <span key={tool} className="bg-slate-900 px-1 py-0.2 rounded border border-slate-800">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 border border-dashed border-slate-800 rounded-lg text-center font-mono text-slate-500 text-xs">
                No active collaboration contract loaded. Select strategy and click &quot;Assemble Collaboration Contract&quot; to begin.
              </div>
            )}

            {/* Active Execution Outcome / Timeline */}
            {activeResult && (
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-200">Protocol Execution Results</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        activeResult.validationStatus === 'PASSED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : activeResult.validationStatus === 'FAILED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      VALIDATION: {activeResult.validationStatus}
                    </span>
                  </div>

                  {/* Actions for Lead: Override & Promotion */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowOverrideDialog(true)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono flex items-center space-x-1"
                    >
                      <Ban className="w-3 h-3 text-amber-400" />
                      <span>Human Override</span>
                    </button>

                    {activeResult.validationStatus === 'PASSED' && !activeResult.isAuthoritativeStateUpdated && (
                      <button
                        onClick={handlePromoteEvidence}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-mono font-semibold flex items-center space-x-1 shadow"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Promote Evidence (Lead)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Conflicts & Resolutions */}
                {activeResult.conflicts.length > 0 && (
                  <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-lg space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-purple-300">
                      <Scale className="w-3.5 h-3.5 text-purple-400" />
                      <span>Constitutional Conflict Trapped & Resolved</span>
                    </div>
                    {activeResult.conflicts.map(c => (
                      <div key={c.id} className="text-[11px] font-mono text-slate-300 space-y-1">
                        <div>
                          <span className="text-amber-400 font-semibold">{c.agentARole} Proposal:</span> {c.claimA.statement}
                        </div>
                        <div>
                          <span className="text-purple-400 font-semibold">{c.agentBRole} Counter-claim:</span> {c.claimB.statement}
                        </div>
                        <div className="p-2 bg-slate-950 rounded border border-purple-500/40 text-purple-200">
                          <span className="font-semibold text-emerald-400">Resolution ({c.resolvedByAuthority || c.resolutionMethod}):</span> {c.resolvedOutcome || c.justification}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Critic Review Findings */}
                {activeResult.reviews.length > 0 && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Independent Critic Review ({activeResult.reviews[0].criticAgentId})</span>
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          activeResult.reviews[0].verdict === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {activeResult.reviews[0].verdict}
                      </span>
                    </div>

                    {activeResult.reviews[0].findings.map(f => (
                      <div key={f.id} className="p-2 bg-slate-900 rounded border border-slate-800 text-[11px] font-mono space-y-1">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="font-semibold">{f.category}</span>
                          <span className="text-amber-400 font-bold">{f.severity}</span>
                        </div>
                        <p className="text-slate-400">{f.finding}</p>
                        <p className="text-indigo-400">Fix: {f.recommendation}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Controlled Handoff Package */}
                {activeResult.handoffs.length > 0 && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                        <GitMerge className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Controlled Handoff Package ({activeResult.handoffs[0].fromAgentId} → {activeResult.handoffs[0].toAgentId})</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{activeResult.handoffs[0].timestamp.slice(11, 19)}</span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-300 space-y-1.5">
                      <div><span className="text-slate-500">Completed Work:</span> {activeResult.handoffs[0].completedWork.join(', ')}</div>
                      <div><span className="text-slate-500">Remaining Tasks:</span> {activeResult.handoffs[0].remainingWork.join(', ') || 'None (Completed)'}</div>
                      <div><span className="text-slate-500">Modified Files:</span> {activeResult.handoffs[0].filesChanged.join(', ')}</div>
                    </div>
                  </div>
                )}

                {/* Audit Timeline */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">Collaboration Event Timeline:</span>
                  <div className="space-y-1 max-h-48 overflow-y-auto font-mono text-[11px]">
                    {activeResult.timeline.map(evt => (
                      <div key={evt.id} className="p-1.5 bg-slate-950 rounded border border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-slate-300">
                          <span className="text-[10px] text-slate-500">{evt.timestamp.slice(11, 19)}</span>
                          <span className="text-indigo-400 font-semibold">{evt.event}</span>
                          <span className="text-slate-400 truncate max-w-md">{evt.details}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: AGENT BEHAVIORAL PROFILING                                    */}
      {/* ==================================================================== */}
      {activeTab === 'agents' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent List */}
          <div className="lg:col-span-1 space-y-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Registered Agent Profiles</span>
            <div className="space-y-2">
              {agents.map(a => (
                <div
                  key={a.agentId}
                  onClick={() => setSelectedAgentId(a.agentId)}
                  className={`p-3 rounded-lg border cursor-pointer font-mono text-xs transition-colors ${
                    selectedAgentId === a.agentId
                      ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{a.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">
                      {(a.reliabilityScore * 100).toFixed(0)}% REL
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{a.agentId}</div>
                  <div className="flex items-center space-x-1 mt-2">
                    {a.supportedRoles.map(r => (
                      <span key={r} className="px-1.5 py-0.2 rounded text-[9px] bg-slate-950 text-slate-300 border border-slate-800">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Behavior Dimensions & Radar Metrics */}
          {selectedAgent && (
            <div className="lg:col-span-2 space-y-5">
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-100">{selectedAgent.name}</h2>
                    <span className="text-xs font-mono text-slate-400">Security Clearance: {selectedAgent.securityClassification}</span>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                    Max Context: {(selectedAgent.maxContextTokens / 1000).toFixed(0)}k tokens
                  </span>
                </div>

                {/* 9-Axis Behavior Dimensions */}
                <div>
                  <span className="text-xs font-semibold text-slate-300 uppercase font-mono tracking-wider">
                    Behavior Dimensions (9-Axis Profile)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 font-mono text-xs">
                    {selectedAgent.behaviorDimensions &&
                      Object.entries(selectedAgent.behaviorDimensions).map(([key, val]) => {
                        const numVal = typeof val === 'number' ? val : 0;
                        return (
                          <div key={key} className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-1.5">
                            <div className="flex justify-between text-slate-300 text-[11px]">
                              <span>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
                              <span className="font-bold text-indigo-400">{(numVal * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-500 h-full rounded-full"
                                style={{ width: `${numVal * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Strengths & Limitations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-xs">
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded">
                    <span className="font-semibold text-emerald-300">Known Strengths:</span>
                    <ul className="mt-1.5 space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                      {(selectedAgent.knownStrengths || []).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded">
                    <span className="font-semibold text-rose-300">Known Limitations:</span>
                    <ul className="mt-1.5 space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                      {(selectedAgent.knownLimitations || []).map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Performance History Segment */}
                {selectedAgent.performanceHistory && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-xs">
                    <span className="font-semibold text-slate-300">Historical Track Record:</span>
                    <div className="grid grid-cols-4 gap-2 mt-2 text-[11px]">
                      <div className="p-2 bg-slate-900 rounded">
                        <div className="text-slate-500">Total Tasks</div>
                        <div className="text-slate-200 font-bold">{selectedAgent.performanceHistory.totalTasks}</div>
                      </div>
                      <div className="p-2 bg-slate-900 rounded">
                        <div className="text-slate-500">Success Rate</div>
                        <div className="text-emerald-400 font-bold">
                          {((selectedAgent.performanceHistory.successfulTasks / (selectedAgent.performanceHistory.totalTasks || 1)) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="p-2 bg-slate-900 rounded">
                        <div className="text-slate-500">Scope Violations</div>
                        <div className="text-rose-400 font-bold">{selectedAgent.performanceHistory.scopeViolations}</div>
                      </div>
                      <div className="p-2 bg-slate-900 rounded">
                        <div className="text-slate-500">Avg Duration</div>
                        <div className="text-indigo-300 font-bold">{selectedAgent.performanceHistory.averageDurationMs}ms</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: TASK-AGENT COMPATIBILITY MATRIX                              */}
      {/* ==================================================================== */}
      {activeTab === 'compatibility' && (
        <div className="space-y-4 font-mono">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200">
                  Target Task Evaluation: {selectedTask?.taskIdentifier} - {selectedTask?.title}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Complexity: {selectedTask?.complexity} | Classification: {project?.securityClassification || 'REGULATED'}
                </p>
              </div>
              <span className="text-[10px] text-slate-500">
                Tests compatibility against required capabilities, security boundaries, and historical defect rates.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map(a => (
              <div key={a.agentId} className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">{a.name}</span>
                  <button
                    onClick={() => handleEvaluateCompatibility(a.agentId)}
                    disabled={isEvaluatingCompat}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] rounded"
                  >
                    Evaluate
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1">
                  <div>Security: {a.securityClassification}</div>
                  <div>Supported Roles: {a.supportedRoles.join(', ')}</div>
                </div>

                {compatibility && compatibility.agentId === a.agentId && (
                  <div
                    className={`p-3 rounded border text-xs space-y-2 ${
                      compatibility.status === 'COMPATIBLE'
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : compatibility.status === 'PARTIALLY_COMPATIBLE'
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                        : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="flex justify-between font-semibold">
                      <span>Status: {compatibility.status}</span>
                      <span>Score: {compatibility.compatibilityScore}/100</span>
                    </div>
                    <p className="text-[11px] text-slate-300">{compatibility.reasoning}</p>
                    {compatibility.risks.length > 0 && (
                      <div className="text-[10px] text-rose-400">
                        Risks: {compatibility.risks.join('; ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: HISTORICAL FAILURE SIGNATURES                                */}
      {/* ==================================================================== */}
      {activeTab === 'failures' && (
        <div className="space-y-4 font-mono">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-200">
                Agent Failure Signature Registry ({failureSignatures.length})
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Every scope breach or false claim writes a permanent failure signature, lowering agent reliability score.
              </p>
            </div>
            <button
              onClick={fetchAgentsAndSignatures}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-2">
            {failureSignatures.map(sig => (
              <div
                key={sig.id}
                className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-rose-400 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{sig.signatureType}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">{sig.timestamp.slice(0, 19)}</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  <span className="text-slate-500">Agent:</span> {sig.agentId} | <span className="text-slate-500">Task:</span> {sig.taskId}
                </div>
                <p className="text-[11px] text-slate-400">{sig.evidence}</p>
                <div className="text-[10px] text-indigo-400 pt-1 border-t border-slate-800/80">
                  Resolution: {sig.resolution}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: COLLABORATION AUDIT HISTORY                                  */}
      {/* ==================================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4 font-mono">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
            <span className="text-xs font-semibold text-slate-200">
              Project Collaboration History ({collaborations.length})
            </span>
          </div>

          <div className="space-y-3">
            {collaborations.map(({ contract, result }) => (
              <div
                key={contract.id}
                onClick={() => {
                  setActiveContract(contract);
                  setActiveResult(result);
                  setActiveTab('orchestrate');
                }}
                className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-semibold text-slate-200">
                    <span>{contract.id}</span>
                    <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                      {contract.strategy}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded ${
                      result?.validationStatus === 'PASSED'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {result?.validationStatus || contract.status}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Task: {contract.taskId}</span>
                  <span>Participants: {contract.participants.length} agents</span>
                  <span>Authoritative Promoted: {result?.isAuthoritativeStateUpdated ? 'YES' : 'NO'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Human Override Dialog Modal */}
      {showOverrideDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 font-mono">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                <Ban className="w-4 h-4 text-amber-400" />
                <span>Enforce Human Lead Override</span>
              </span>
              <button
                onClick={() => setShowOverrideDialog(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {!isLead && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded text-xs">
                Warning: Only PROJECT_LEAD can execute overrides. Active user role is {currentUser?.role}.
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Override Action:</label>
                <select
                  value={overrideType}
                  onChange={(e) => setOverrideType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded p-2 text-xs"
                >
                  <option value="STOP">STOP (Halt Collaboration)</option>
                  <option value="REJECT">REJECT (Reject Evidence)</option>
                  <option value="REPLACE_AGENT">REPLACE_AGENT (Swap Model)</option>
                  <option value="CHANGE_STRATEGY">CHANGE_STRATEGY (Reroute Strategy)</option>
                  <option value="FORCE_PASS">FORCE_PASS (Manual Override Sign-off)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Justification Reason (Logged to Audit):</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explain why this human override was required..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowOverrideDialog(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyOverride}
                disabled={!overrideReason.trim()}
                className={`px-4 py-1.5 rounded text-xs font-semibold ${
                  !overrideReason.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                Apply Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
