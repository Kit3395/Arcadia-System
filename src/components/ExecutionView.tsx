import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Play,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileCode,
  CheckCircle2,
  XCircle,
  FileText,
  Lock,
  ArrowRight,
  RefreshCw,
  Layers,
  Award
} from 'lucide-react';
import {
  Project,
  UniversalTaskSpecification,
  User,
  AgentProfile,
  ExecutionRecord,
  TaskReadinessGateResult,
  ContextPackage,
  PromptVersion
} from '../types/index.ts';

interface ExecutionViewProps {
  project: Project | null;
  tasks: UniversalTaskSpecification[];
  currentUser: User | null;
  onRefreshProjectData: () => void;
  onNavigateToTask?: (taskId: string) => void;
}

export const ExecutionView: React.FC<ExecutionViewProps> = ({
  project,
  tasks,
  currentUser,
  onRefreshProjectData,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.taskId || '');
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<ExecutionRecord | null>(null);

  // Inspection states
  const [readinessResult, setReadinessResult] = useState<TaskReadinessGateResult | null>(null);
  const [contextPackage, setContextPackage] = useState<ContextPackage | null>(null);
  const [promptVersion, setPromptVersion] = useState<PromptVersion | null>(null);

  // Action / loading states
  const [activeTab, setActiveTab] = useState<'run' | 'agents' | 'context' | 'prompt' | 'history'>('run');
  const [isRunning, setIsRunning] = useState(false);
  const [isSimulatingViolation, setIsSimulatingViolation] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const selectedTask = tasks.find(t => t.taskId === selectedTaskId) || tasks[0] || null;

  // 1. Fetch Agents
  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents');
      if (res.ok) {
        const data: AgentProfile[] = await res.json();
        setAgents(data);
        if (data.length > 0 && !selectedAgentId) {
          setSelectedAgentId(data[0].agentId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  }, [selectedAgentId]);

  // 2. Fetch Project Executions
  const fetchExecutions = useCallback(async () => {
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/executions`);
      if (res.ok) {
        const data: ExecutionRecord[] = await res.json();
        setExecutions(data);
        if (data.length > 0 && !selectedExecution) {
          setSelectedExecution(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch executions:', err);
    }
  }, [project, selectedExecution]);

  // 3. Run Task Readiness Gate Check
  const evaluateReadiness = useCallback(async (taskId: string) => {
    if (!project || !taskId) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/tasks/${taskId}/readiness`);
      if (res.ok) {
        const data: TaskReadinessGateResult = await res.json();
        setReadinessResult(data);
      }
    } catch (err) {
      console.error('Failed to evaluate task readiness:', err);
    }
  }, [project]);

  // 4. Assemble Context Package Preview
  const inspectContext = useCallback(async (taskId: string) => {
    if (!project || !taskId) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/tasks/${taskId}/context`);
      if (res.ok) {
        const data: ContextPackage = await res.json();
        setContextPackage(data);
      }
    } catch (err) {
      console.error('Failed to assemble context package:', err);
    }
  }, [project]);

  // 5. Compile Prompt Preview
  const inspectPrompt = useCallback(async (taskId: string, agentId?: string) => {
    if (!project || !taskId) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/tasks/${taskId}/compile-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agentId || selectedAgentId })
      });
      if (res.ok) {
        const raw = await res.json();
        const data: PromptVersion = raw.promptVersion ? raw.promptVersion : raw;
        setPromptVersion(data);
      }
    } catch (err) {
      console.error('Failed to compile prompt:', err);
    }
  }, [project, selectedAgentId]);

  useEffect(() => {
    fetchAgents();
    fetchExecutions();
  }, [fetchAgents, fetchExecutions]);

  useEffect(() => {
    if (selectedTask && project) {
      evaluateReadiness(selectedTask.taskId);
      inspectContext(selectedTask.taskId);
      inspectPrompt(selectedTask.taskId);
    }
  }, [selectedTask, project, evaluateReadiness, inspectContext, inspectPrompt]);

  // Execute Task
  const handleExecute = async (simulateViolation = false) => {
    if (!project || !selectedTask) return;
    setIsRunning(true);
    setIsSimulatingViolation(simulateViolation);
    setStatusMessage({ type: 'info', text: simulateViolation ? 'Simulating agent out-of-scope breach...' : 'Dispatching task to execution engine...' });

    try {
      const res = await fetch(`/api/projects/${project.id}/tasks/${selectedTask.taskId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          simulateScopeViolation: simulateViolation
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: 'Execution completed successfully. Structured evidence captured for human review.'
        });
        setSelectedExecution(data.executionRecord);
        fetchExecutions();
        onRefreshProjectData();
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Execution halted due to policy or scope violation.'
        });
        if (data.executionRecord) {
          setSelectedExecution(data.executionRecord);
          fetchExecutions();
          onRefreshProjectData();
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Execution failed.' });
    } finally {
      setIsRunning(false);
      setIsSimulatingViolation(false);
    }
  };

  // Promote Evidence to Authoritative State
  const handlePromoteEvidence = async (executionId: string) => {
    if (!project) return;
    setIsPromoting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/executions/${executionId}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: 'Evidence ratified and promoted to authoritative project state! Task state updated to PASSED.'
        });
        fetchExecutions();
        onRefreshProjectData();
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Promotion rejected by governance policy.'
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Promotion failed.' });
    } finally {
      setIsPromoting(false);
    }
  };

  if (!project) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Cpu className="w-12 h-12 mx-auto mb-3 text-slate-600 animate-pulse" />
        <p className="text-sm font-medium">Select an active project to access the Execution Layer.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              PHASE 5 EXECUTION LAYER
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300">
              Adaptive Complexity: {project.complexityLevel}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
              Evidence != Authoritative Truth
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-2 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            Execution Orchestrator & Agent Governance
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Controlled agent execution with automated readiness gates, minimal context orchestration, deterministic prompt compilation,
            strict Scope Lock interception, and human-verified authoritative state promotion.
          </p>
        </div>

        {/* Global Action Stats */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded text-right">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Registered Agents</div>
            <div className="text-sm font-mono font-bold text-slate-200">{agents.length} Models</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded text-right">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Execution Records</div>
            <div className="text-sm font-mono font-bold text-emerald-400">{executions.length} Runs</div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div
          className={`p-3 rounded border text-xs font-mono flex items-center justify-between transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              : 'bg-blue-950/40 border-blue-500/40 text-blue-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {statusMessage.type === 'error' && <XCircle className="w-4 h-4 text-rose-400" />}
            {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-200 text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Pipeline Architecture Progress Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>Architectural Execution Pipeline (Strict Linear Invariant)</span>
          <span className="text-emerald-400 font-semibold">Self-Governing Engine</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
            <div className="font-mono text-[10px] text-slate-400">STAGE 1</div>
            <div className="font-semibold text-slate-200 mt-1 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Readiness Gate
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">8 Invariants</div>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
            <div className="font-mono text-[10px] text-slate-400">STAGE 2</div>
            <div className="font-semibold text-slate-200 mt-1 flex items-center justify-center gap-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Context Assembly
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Authority Hierarchy</div>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
            <div className="font-mono text-[10px] text-slate-400">STAGE 3</div>
            <div className="font-semibold text-slate-200 mt-1 flex items-center justify-center gap-1">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              Prompt Compiler
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">SHA-256 Versioned</div>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
            <div className="font-mono text-[10px] text-slate-400">STAGE 4</div>
            <div className="font-semibold text-slate-200 mt-1 flex items-center justify-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              Agent Adapter
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Sandboxed Tool Calls</div>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
            <div className="font-mono text-[10px] text-slate-400">STAGE 5</div>
            <div className="font-semibold text-slate-200 mt-1 flex items-center justify-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Scope Lock Check
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Boundary Trap</div>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
            <div className="font-mono text-[10px] text-slate-400">STAGE 6</div>
            <div className="font-semibold text-slate-200 mt-1 flex items-center justify-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              State Promotion
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Lead Verification</div>
          </div>
        </div>
      </div>

      {/* Task Selection & Agent Selection Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Task Selector */}
        <div>
          <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
            Target Task Specification
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            {tasks.map(t => (
              <option key={t.taskId} value={t.taskId}>
                {t.taskIdentifier} - {t.title ? (t.title.length > 36 ? t.title.slice(0, 36) + '...' : t.title) : t.taskId} [{t.state}]
              </option>
            ))}
          </select>
        </div>

        {/* Assigned Agent Selector */}
        <div>
          <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
            Assigned Execution Agent
          </label>
          <select
            value={selectedAgentId}
            onChange={(e) => {
              setSelectedAgentId(e.target.value);
              if (selectedTask) inspectPrompt(selectedTask.taskId, e.target.value);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            {agents.map(a => (
              <option key={a.agentId} value={a.agentId}>
                {a.name} ({a.provider}) - Reliability: {Math.round(a.reliabilityScore * 100)}%
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-end gap-2">
          <button
            onClick={() => handleExecute(false)}
            disabled={isRunning || isPromoting || (readinessResult ? !readinessResult.passed : false)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium py-2 px-3 rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {isRunning && !isSimulatingViolation ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Run Execution
          </button>

          <button
            onClick={() => handleExecute(true)}
            disabled={isRunning || isPromoting}
            title="Simulates an agent attempting to write to out-of-scope files to verify Scope Lock halts and escalations."
            className="bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-mono py-2 px-3 rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {isRunning && isSimulatingViolation ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            )}
            Test Breach Trap
          </button>
        </div>
      </div>

      {/* Secondary Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-xs font-mono">
        <button
          onClick={() => setActiveTab('run')}
          className={`pb-2 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'run'
              ? 'border-emerald-400 text-emerald-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Execution & Evidence
        </button>
        <button
          onClick={() => setActiveTab('context')}
          className={`pb-2 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'context'
              ? 'border-emerald-400 text-emerald-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Context Orchestrator ({contextPackage?.items.length || 0} Items)
        </button>
        <button
          onClick={() => setActiveTab('prompt')}
          className={`pb-2 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'prompt'
              ? 'border-emerald-400 text-emerald-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Compiled Prompt ({promptVersion?.promptHash ? promptVersion.promptHash.slice(0, 8) : 'Pending'})
        </button>
        <button
          onClick={() => setActiveTab('agents')}
          className={`pb-2 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'agents'
              ? 'border-emerald-400 text-emerald-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Agent Registry ({agents.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'history'
              ? 'border-emerald-400 text-emerald-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Execution History ({executions.length})
        </button>
      </div>

      {/* TAB 1: RUN / ACTIVE EXECUTION & EVIDENCE */}
      {activeTab === 'run' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Task Details & Readiness Gate */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Summary Card */}
            {selectedTask && (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {selectedTask.taskIdentifier}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {selectedTask.complexity}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/30">
                      {selectedTask.state}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Max Allowed: {selectedTask.validationRequirements.maxExecutionTimeMs}ms
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-100">{selectedTask.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{selectedTask.objective}</p>

                {/* Scope Lock Summary */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1 mb-1">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      Allowed Writable Files ({selectedTask.relevantFiles.filter(f => !f.readOnly).length})
                    </div>
                    <ul className="space-y-1 font-mono text-[11px] text-slate-300">
                      {selectedTask.relevantFiles.map((f, i) => (
                        <li key={i} className="truncate">
                          {f.path} {f.readOnly && <span className="text-slate-400">(RO)</span>}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1 mb-1">
                      <ShieldAlert className="w-3 h-3 text-rose-400" />
                      Prohibited Actions
                    </div>
                    <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                      {selectedTask.prohibitedActions.map((p, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 8-Step Task Readiness Gate Details */}
            {readinessResult && (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                      Task Readiness Gate Evaluation
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                      readinessResult.passed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {readinessResult.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {readinessResult.checks.map((chk, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded border flex items-start space-x-2 ${
                        chk.passed
                          ? 'bg-slate-950 border-slate-800 text-slate-300'
                          : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                      }`}
                    >
                      {chk.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-mono text-[11px] font-medium">{chk.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{chk.message}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {readinessResult.blockingReasons.length > 0 && (
                  <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded text-xs text-rose-200 space-y-1">
                    <div className="font-mono font-bold uppercase text-[10px]">Blocking Impediments Detected:</div>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      {readinessResult.blockingReasons.map((b: string, i: number) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Col: Captured Evidence & Promotion Card */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Latest Captured Evidence
                </h3>
                {selectedExecution && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                      selectedExecution.state === 'PASSED'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : selectedExecution.state === 'SCOPE_VIOLATION'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {selectedExecution.state}
                  </span>
                )}
              </div>

              {!selectedExecution ? (
                <div className="p-6 text-center text-slate-400 font-mono text-xs">
                  No execution evidence generated yet. Run the task to capture evidence.
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Execution ID:</span>
                      <span className="text-slate-200">{selectedExecution.id ? (selectedExecution.id.length > 16 ? selectedExecution.id.slice(0, 16) + '...' : selectedExecution.id) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Agent ID:</span>
                      <span className="text-slate-200">{selectedExecution.contract.agentId}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Authoritative State Updated:</span>
                      <span
                        className={
                          selectedExecution.isAuthoritativeStateUpdated
                            ? 'text-emerald-400 font-bold'
                            : 'text-amber-400 font-bold'
                        }
                      >
                        {selectedExecution.isAuthoritativeStateUpdated ? 'YES (Promoted)' : 'NO (Staged Evidence)'}
                      </span>
                    </div>
                  </div>

                  {/* Scope Lock Violations Alert */}
                  {selectedExecution.scopeViolations && selectedExecution.scopeViolations.length > 0 && (
                    <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded space-y-1.5">
                      <div className="font-mono font-bold text-rose-300 flex items-center gap-1 text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        Scope Lock Breach Trapped!
                      </div>
                      <p className="text-[11px] text-rose-200">
                        The agent attempted to edit files outside of the authorized Scope Lock boundary. Task transitioned to BLOCKED and escalated to Human Decision Queue.
                      </p>
                      <ul className="text-[10px] font-mono text-rose-300 pl-4 list-disc">
                        {selectedExecution.scopeViolations.map((v, i) => (
                          <li key={i}>{v.attemptedPath} - {v.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Changed Files Diffs */}
                  {selectedExecution.evidence && (
                    <div className="space-y-2">
                      <div className="font-mono text-[10px] text-slate-400 uppercase">
                        File Diffs ({selectedExecution.evidence.changedFiles.length})
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {selectedExecution.evidence.changedFiles.map((f, i) => (
                          <div key={i} className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px]">
                            <div className="flex items-center justify-between font-mono text-slate-300">
                              <span className="truncate">{f.path}</span>
                              <span
                                className={`text-[10px] px-1 rounded ${
                                  f.scopeStatus === 'IN_SCOPE'
                                    ? 'text-emerald-400 bg-emerald-500/10'
                                    : 'text-rose-400 bg-rose-500/10'
                                }`}
                              >
                                {f.scopeStatus}
                              </span>
                            </div>
                            <pre className="mt-1 font-mono text-[10px] text-slate-400 bg-slate-900 p-1.5 rounded overflow-x-auto">
                              {f.diff ? (f.diff.length > 180 ? f.diff.slice(0, 180) + '...' : f.diff) : ''}
                            </pre>
                          </div>
                        ))}
                      </div>

                      {/* Test Results */}
                      <div className="font-mono text-[10px] text-slate-400 uppercase pt-2">
                        Validation Test Outcomes
                      </div>
                      <div className="space-y-1">
                        {selectedExecution.evidence.testResults.map((t, i) => (
                          <div key={i} className="flex items-center justify-between p-1.5 rounded bg-slate-950 border border-slate-800 text-[11px]">
                            <span className="text-slate-300">{t.testName}</span>
                            <span className={t.passed ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                              {t.passed ? 'PASS' : 'FAIL'} ({t.durationMs}ms)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Promotion Button for Lead */}
                  {selectedExecution.state === 'PASSED' && !selectedExecution.isAuthoritativeStateUpdated && (
                    <div className="pt-3 border-t border-slate-800">
                      <button
                        onClick={() => handlePromoteEvidence(selectedExecution.id)}
                        disabled={isPromoting || currentUser?.role !== 'PROJECT_LEAD'}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium py-2 px-3 rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {isPromoting ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Award className="w-3.5 h-3.5" />
                        )}
                        Promote to Authoritative State (Lead Sign-off)
                      </button>
                      {currentUser?.role !== 'PROJECT_LEAD' && (
                        <p className="text-[10px] text-slate-400 text-center mt-1">
                          Requires PROJECT_LEAD role (Switch user in top-right menu).
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTEXT ORCHESTRATOR */}
      {activeTab === 'context' && contextPackage && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Context Orchestration Package ({contextPackage.id ? (contextPackage.id.length > 16 ? contextPackage.id.slice(0, 16) + '...' : contextPackage.id) : 'N/A'})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Authority-ranked knowledge slice filtered strictly to what the task requires.
                </p>
              </div>
              <div className="text-right font-mono text-xs">
                <span className="text-slate-400">Token Budget: </span>
                <span className="text-emerald-400 font-bold">
                  {contextPackage.tokenBudget.totalEstimatedTokens} / {contextPackage.tokenBudget.maxBudget}
                </span>
              </div>
            </div>

            {/* Authority Hierarchy Distribution */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-1">
              <div className="font-mono text-[10px] text-slate-400 uppercase">
                Authority Resolution Hierarchy (Constitution Supreme)
              </div>
              <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold">
                  Level 1: CONSTITUTION
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 mt-1" />
                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  Level 2: GOVERNANCE
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 mt-1" />
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
                  Level 3: PROJECT_STATE
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 mt-1" />
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  Level 4: DECISIONS
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 mt-1" />
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Level 5: TASKS
                </span>
              </div>
            </div>
          </div>

          {/* Explainability Manifest Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-slate-800 bg-slate-950 font-mono text-xs text-slate-300 font-semibold flex items-center justify-between">
              <span>Explainability Manifest (Inclusion / Exclusion Audit)</span>
              <span className="text-[10px] text-slate-400">{contextPackage.manifest.length} Evaluated Items</span>
            </div>
            <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
              {contextPackage.manifest.map((m, i) => (
                <div key={i} className="p-3 flex items-start justify-between text-xs hover:bg-slate-800/30">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 font-mono">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          m.status === 'INCLUDED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {m.status}
                      </span>
                      <span className="text-slate-300 font-medium">{m.sourceId}</span>
                      <span className="text-slate-400 text-[10px]">({m.sourceType})</span>
                    </div>
                    <p className="text-slate-400 text-[11px] pl-2">{m.reason}</p>
                  </div>
                  <div className="text-right font-mono text-[10px] text-slate-400 shrink-0 ml-4">
                    {m.sourceType}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROMPT COMPILER */}
      {activeTab === 'prompt' && promptVersion && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  Deterministic Compiled Prompt Specification
                </h3>
                <div className="font-mono text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>SHA-256:</span>
                  <span className="text-emerald-400 font-bold">{promptVersion.promptHash}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 font-mono text-xs">
                <span
                  className={`px-2 py-0.5 rounded font-semibold ${
                    promptVersion.healthCheck.status === 'HEALTHY'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  Health: {promptVersion.healthCheck.status}
                </span>
              </div>
            </div>

            {/* Prompt Scope Boundaries */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="font-mono text-[10px] text-slate-400 uppercase">Input Objective</div>
                <div className="font-mono text-[11px] text-slate-300 mt-1 truncate">
                  {promptVersion.structure.objective}
                </div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="font-mono text-[10px] text-slate-400 uppercase">Output Contract</div>
                <div className="font-mono text-[11px] text-slate-300 mt-1">
                  Unified Diff + Verification Tests
                </div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="font-mono text-[10px] text-slate-400 uppercase">Security Boundary</div>
                <div className="font-mono text-[11px] text-rose-300 mt-1">
                  Strict Scope Lock Intercept Active
                </div>
              </div>
            </div>
          </div>

          {/* Full Compiled Prompt Raw Output */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-slate-800 bg-slate-950 font-mono text-xs text-slate-300 font-semibold flex items-center justify-between">
              <span>Raw Compiled Prompt Payload</span>
              <span className="text-[10px] text-slate-400">Immutable Artifact</span>
            </div>
            <pre className="p-4 font-mono text-xs text-slate-300 bg-slate-950 overflow-x-auto max-h-[500px] whitespace-pre-wrap leading-relaxed">
              {promptVersion.promptContent}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: AGENT REGISTRY */}
      {activeTab === 'agents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map(a => (
            <div
              key={a.agentId}
              className={`p-4 rounded-lg border transition-all ${
                selectedAgentId === a.agentId
                  ? 'bg-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-semibold text-slate-100">{a.name}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {a.provider}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{a.model} (v{a.version})</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {Math.round(a.reliabilityScore * 100)}%
                  </span>
                  <div className="text-[10px] font-mono text-slate-400">Reliability</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="bg-slate-950 p-1.5 rounded border border-slate-800/60">
                  <div className="text-[10px] text-slate-400">Max Context</div>
                  <div className="text-slate-200 mt-0.5">{a.maxContextTokens.toLocaleString()}</div>
                </div>
                <div className="bg-slate-950 p-1.5 rounded border border-slate-800/60">
                  <div className="text-[10px] text-slate-400">Cost/1k</div>
                  <div className="text-slate-200 mt-0.5">${a.costPer1kTokens}</div>
                </div>
                <div className="bg-slate-950 p-1.5 rounded border border-slate-800/60">
                  <div className="text-[10px] text-slate-400">Classification</div>
                  <div className="text-slate-200 mt-0.5">{a.securityClassification}</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {a.capabilities.map((c, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {c}
                  </span>
                ))}
              </div>

              <button
                onClick={() => {
                  setSelectedAgentId(a.agentId);
                  setActiveTab('run');
                }}
                className="w-full mt-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition-colors cursor-pointer"
              >
                Select for Task Execution
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: EXECUTION HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-950 font-mono text-xs text-slate-300 font-semibold flex items-center justify-between">
            <span>Execution Audit Records for Project</span>
            <span className="text-[10px] text-slate-400">{executions.length} Total Runs</span>
          </div>

          {executions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-mono">
              No executions logged yet for this project.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {executions.map(e => (
                <div
                  key={e.id}
                  onClick={() => {
                    setSelectedExecution(e);
                    setActiveTab('run');
                  }}
                  className="p-3 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer text-xs transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        e.state === 'PASSED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : e.state === 'SCOPE_VIOLATION'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {e.state}
                    </span>
                    <div>
                      <div className="font-mono text-slate-200 font-medium">Task: {e.taskId}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Agent: {e.contract.agentId}</span>
                        <span>•</span>
                        <span>{new Date(e.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        e.isAuthoritativeStateUpdated
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {e.isAuthoritativeStateUpdated ? 'PROMOTED' : 'EVIDENCE ONLY'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
