import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  Sparkles,
  GitBranch,
  Layers,
  Lock,
  ChevronRight
} from 'lucide-react';
import {
  Project,
  Requirement,
  UniversalTaskSpecification,
  DecisionQueueItem,
  ProjectPrimaryState,
  User
} from '../types/index.ts';

interface DashboardViewProps {
  project: Project | null;
  requirements: Requirement[];
  tasks: UniversalTaskSpecification[];
  decisionQueue: DecisionQueueItem[];
  currentUser: User | null;
  onAdvanceState: (newState: ProjectPrimaryState) => Promise<void>;
  onNavigate: (tab: any) => void;
}

const LIFECYCLE_STATES: ProjectPrimaryState[] = [
  'INTAKE',
  'INTELLIGENCE',
  'CLARIFICATION',
  'BLUEPRINT',
  'GOVERNANCE',
  'PLANNED',
  'EXECUTION',
  'VALIDATION',
  'COMPLETED'
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  requirements,
  tasks,
  decisionQueue,
  currentUser,
  onAdvanceState,
  onNavigate
}) => {
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  if (!project) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>No project selected. Create or select a project from the Projects directory.</p>
      </div>
    );
  }

  const approvedReqCount = requirements.filter(r => r.status === 'APPROVED').length;
  const pendingReqCount = requirements.filter(r => r.status === 'PROPOSED').length;
  const passedTaskCount = tasks.filter(t => t.state === 'PASSED').length;
  const runningTaskCount = tasks.filter(t => t.state === 'RUNNING').length;
  const pendingBlockers = decisionQueue.filter(d => d.status === 'PENDING' && (d.priority === 'HIGH' || d.priority === 'BLOCKER')).length;

  const currentLifecycleIndex = LIFECYCLE_STATES.indexOf(project.primaryState);
  const nextLifecycleState = currentLifecycleIndex < LIFECYCLE_STATES.length - 1 
    ? LIFECYCLE_STATES[currentLifecycleIndex + 1] 
    : null;

  const handleAdvance = async () => {
    if (!nextLifecycleState) return;
    setTransitionError(null);
    setIsTransitioning(true);
    try {
      await onAdvanceState(nextLifecycleState);
    } catch (err: any) {
      setTransitionError(err.message || 'State transition rejected.');
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Project Banner & Lifecycle Stepper */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-slate-100">{project.name}</h1>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Tier {project.complexityLevel}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40">
                v{project.currentVersion}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Action to advance state */}
          {nextLifecycleState && (
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={handleAdvance}
                disabled={isTransitioning}
                className="px-3.5 py-2 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-950/50"
              >
                <span>Advance to {nextLifecycleState}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {transitionError && (
          <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span><strong>Prerequisite Guard:</strong> {transitionError}</span>
          </div>
        )}

        {/* Lifecycle Stepper Track */}
        <div className="pt-3 border-t border-slate-800">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
            <span>Authoritative Lifecycle State Machine</span>
            <span className="text-slate-400">Step {currentLifecycleIndex + 1} of {LIFECYCLE_STATES.length}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
            {LIFECYCLE_STATES.map((state, idx) => {
              const isPast = idx < currentLifecycleIndex;
              const isCurrent = idx === currentLifecycleIndex;
              return (
                <div
                  key={state}
                  className={`px-2 py-1.5 rounded text-center text-[10px] font-mono tracking-tight transition-all border ${
                    isCurrent
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold ring-1 ring-emerald-500/30'
                      : isPast
                      ? 'bg-slate-800/80 text-slate-300 border-slate-700/60'
                      : 'bg-slate-950/40 text-slate-600 border-slate-850'
                  }`}
                >
                  <div className="truncate">{state}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Primary Authoritative Metrics (Real DB State Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigate('requirements')}
          className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 hover:border-slate-700 cursor-pointer transition-colors space-y-1"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Approved Requirements</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">{approvedReqCount}</div>
          <div className="text-[11px] text-slate-500 flex items-center space-x-1">
            <span>{pendingReqCount} proposed / in triage</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('tasks')}
          className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 hover:border-slate-700 cursor-pointer transition-colors space-y-1"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Tasks (Universal)</span>
            <GitBranch className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">{tasks.length}</div>
          <div className="text-[11px] text-slate-500 flex items-center space-x-1">
            <span className="text-emerald-400">{passedTaskCount} passed</span>
            <span>•</span>
            <span className="text-cyan-400">{runningTaskCount} running</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('decision-queue')}
          className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 hover:border-slate-700 cursor-pointer transition-colors space-y-1"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Decision Queue</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {decisionQueue.filter(d => d.status === 'PENDING').length}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center space-x-1">
            <span className={pendingBlockers > 0 ? 'text-rose-400 font-semibold' : 'text-slate-500'}>
              {pendingBlockers} blocking / high priority
            </span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('validation')}
          className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 hover:border-emerald-500/50 cursor-pointer transition-colors space-y-1"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Validation & Security</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">{project.securityState}</div>
          <div className="text-[11px] text-slate-500">
            <span>Drift: {project.driftState}</span>
          </div>
        </div>
      </div>

      {/* Decision Queue Quick Triage & Active State Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Decision Queue Spotlight */}
        <div className="lg:col-span-2 rounded-lg border border-slate-800 bg-slate-900/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                Human Decision Queue Spotlight
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Action Required
              </span>
            </div>
            <button
              onClick={() => onNavigate('decision-queue')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>View Full Queue ({decisionQueue.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {decisionQueue.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-colors flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      item.priority === 'BLOCKER' || item.priority === 'HIGH'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {item.priority}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">{item.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                </div>
                <button
                  onClick={() => onNavigate('decision-queue')}
                  className="px-2.5 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0"
                >
                  Inspect
                </button>
              </div>
            ))}
            {decisionQueue.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500 font-mono">
                No items in the Decision Queue. All governance requirements are currently satisfied.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Governance Invariants & System Posture */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
            Governance Authority Status
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Authoritative Store:</span>
              <span className="text-slate-200 font-mono">Layer 2 (PostgreSQL Relational)</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Inference Firewall:</span>
              <span className="text-emerald-400 font-mono">ENFORCED (Quarantined)</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Prompt State:</span>
              <span className="text-slate-200 font-mono">Disposable Ephemeral Artifacts</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Active Actor Authority:</span>
              <span className="text-amber-300 font-mono">{currentUser?.role || 'PROJECT_LEAD'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Audit Trail:</span>
              <span className="text-emerald-400 font-mono">Immutable Append-Only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
