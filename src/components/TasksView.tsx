import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  FileCode,
  Ban,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { UniversalTaskSpecification, TaskState, User } from '../types/index.ts';

interface TasksViewProps {
  tasks: UniversalTaskSpecification[];
  currentUser: User | null;
  onUpdateTaskState: (taskId: string, newState: TaskState) => Promise<void>;
  onCreateTask: (data: any) => Promise<void>;
  onVerifyScope: (taskId: string, filesModified: string[], action: string) => Promise<{ allowed: boolean; violationReason?: string }>;
}

const TASK_STATES: TaskState[] = [
  'DRAFT',
  'READY',
  'ASSIGNED',
  'RUNNING',
  'VALIDATING',
  'PASSED',
  'FAILED',
  'BLOCKED'
];

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  currentUser,
  onUpdateTaskState,
  onCreateTask,
  onVerifyScope
}) => {
  const [selectedTask, setSelectedTask] = useState<UniversalTaskSpecification | null>(tasks[0] || null);
  const [showModal, setShowModal] = useState(false);
  const [testFilePath, setTestFilePath] = useState('');
  const [testAction, setTestAction] = useState('FILE_EDIT');
  const [scopeResult, setScopeResult] = useState<{ allowed: boolean; violationReason?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state for creating a new task
  const [identifier, setIdentifier] = useState('');
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [editableFiles, setEditableFiles] = useState('src/server/auth.ts');
  const [prohibitedAction, setProhibitedAction] = useState('DROP_TABLE');

  const handleTestScope = async () => {
    if (!selectedTask || !testFilePath.trim()) return;
    const res = await onVerifyScope(selectedTask.taskId, [testFilePath.trim()], testAction);
    setScopeResult(res);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !title.trim() || !objective.trim()) {
      setErrorMsg('Identifier, title, and objective are required.');
      return;
    }

    try {
      await onCreateTask({
        taskIdentifier: identifier,
        title,
        objective,
        complexity: 'MEDIUM',
        relevantFiles: editableFiles.split(',').map(p => ({ path: p.trim(), readOnly: false })),
        prohibitedActions: [prohibitedAction]
      });
      setShowModal(false);
      setIdentifier('');
      setTitle('');
      setObjective('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create task.');
    }
  };

  const getTaskStateColor = (state: TaskState) => {
    switch (state) {
      case 'PASSED': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'RUNNING': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse';
      case 'VALIDATING': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'FAILED': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'BLOCKED': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'READY': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-cyan-400" />
              <span>Universal Task Specifications & Scope Lock</span>
            </h1>
            <span className="text-xs font-mono text-slate-400">
              {tasks.length} active tasks
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Universal task definitions with mathematical Scope Locks preventing agent hallucinations or unauthorized file touches.
          </p>
        </div>

        {currentUser?.role === 'PROJECT_LEAD' || currentUser?.role === 'ARCHITECT' ? (
          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-2 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/40 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task Specification</span>
          </button>
        ) : (
          <div className="text-[11px] text-slate-500 font-mono italic">
            Task creation reserved for Technical Leads
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Task List and Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Task Selector */}
        <div className="lg:col-span-5 space-y-2.5">
          {tasks.map((task) => {
            const isSelected = selectedTask?.taskId === task.taskId;
            return (
              <div
                key={task.taskId}
                onClick={() => {
                  setSelectedTask(task);
                  setScopeResult(null);
                }}
                className={`p-4 rounded-lg border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'border-cyan-500/60 bg-slate-900/90 ring-1 ring-cyan-500/30'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-200">
                    {task.taskIdentifier}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getTaskStateColor(task.state)}`}>
                    {task.state}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-100">{task.title}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">{task.objective}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500">
                  <span>Scope: {task.relevantFiles.length} files bound</span>
                  <span>Agent: {task.assignedAgentId || 'Unassigned'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Task Details & Interactive Scope Lock Tester */}
        {selectedTask ? (
          <div className="lg:col-span-7 space-y-5 rounded-lg border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-bold text-slate-100">{selectedTask.title}</span>
                  <span className="font-mono text-xs text-slate-400">({selectedTask.taskIdentifier})</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedTask.objective}</p>
              </div>

              {/* State Transition Action */}
              <div className="flex items-center space-x-2">
                <select
                  value={selectedTask.state}
                  onChange={(e) => onUpdateTaskState(selectedTask.taskId, e.target.value as TaskState)}
                  className={`px-2 py-1 rounded text-xs font-mono font-bold border outline-none bg-slate-900 ${getTaskStateColor(selectedTask.state)}`}
                >
                  {TASK_STATES.map((s) => (
                    <option key={s} value={s} className="bg-slate-950 text-slate-200">
                      State: {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scope Lock Specification Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="font-bold text-slate-300 flex items-center space-x-1.5">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Bound Scope Files (relevantFiles)</span>
                </div>
                <div className="space-y-1">
                  {selectedTask.relevantFiles.map((f, i) => (
                    <div key={i} className="flex justify-between font-mono text-[11px] text-slate-400">
                      <span className="truncate">{f.path}</span>
                      <span className={f.readOnly ? 'text-amber-400' : 'text-emerald-400'}>
                        {f.readOnly ? 'READ_ONLY' : 'WRITABLE'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="font-bold text-slate-300 flex items-center space-x-1.5">
                  <Ban className="w-3.5 h-3.5 text-rose-400" />
                  <span>Prohibited Actions</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedTask.prohibitedActions.map((act, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/30 text-rose-300 border border-rose-800/40">
                      {act}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Acceptance Criteria & Validation Requirements */}
            <div className="p-3.5 rounded bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
              <div className="font-bold text-slate-300 flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Acceptance Criteria</span>
              </div>
              <ul className="space-y-1 text-slate-400 pl-4 list-disc">
                {selectedTask.acceptanceCriteria.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            {/* Interactive Scope Lock Simulator */}
            <div className="p-4 rounded-lg border border-cyan-950/60 bg-cyan-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-200">Interactive Scope Lock Verification Test</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400">Agent Boundary Sandbox</span>
              </div>

              <p className="text-[11px] text-slate-400">
                Simulate an agent attempting to write to a path or perform an action to verify mathematical enforcement.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={testFilePath}
                    onChange={(e) => setTestFilePath(e.target.value)}
                    placeholder="e.g. src/server/auth.ts or sensitive/config.env"
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-mono outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <select
                    value={testAction}
                    onChange={(e) => setTestAction(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-mono outline-none"
                  >
                    <option value="FILE_EDIT">FILE_EDIT</option>
                    <option value="DROP_TABLE">DROP_TABLE (Prohibited)</option>
                    <option value="DISABLE_SECURITY">DISABLE_SECURITY</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTestFilePath('src/server/auth.ts');
                      setTestAction('FILE_EDIT');
                    }}
                    className="text-[10px] font-mono text-emerald-400 hover:underline cursor-pointer"
                  >
                    [Test Valid File]
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTestFilePath('unauthorized/config.json');
                      setTestAction('FILE_EDIT');
                    }}
                    className="text-[10px] font-mono text-rose-400 hover:underline cursor-pointer"
                  >
                    [Test Scope Violation]
                  </button>
                </div>

                <button
                  onClick={handleTestScope}
                  className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-semibold text-xs transition-colors"
                >
                  Verify Enforcement
                </button>
              </div>

              {scopeResult && (
                <div className={`p-3 rounded text-xs flex items-center space-x-2 font-mono ${
                  scopeResult.allowed
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}>
                  {scopeResult.allowed ? (
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>
                    {scopeResult.allowed 
                      ? 'PERMITTED: Path is strictly within allowed Scope Lock boundary.' 
                      : scopeResult.violationReason}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 p-8 text-center text-slate-500 text-xs font-mono">
            Select a task to inspect its Universal Task Specification.
          </div>
        )}
      </div>

      {/* Task Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-cyan-400" />
                <span>Create Universal Task Specification</span>
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300 text-xs">
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Task Identifier *</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. TSK-API-03"
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 font-mono outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement Rate Limiter Middleware"
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Bound Writable Files (comma separated) *</label>
                <input
                  type="text"
                  value={editableFiles}
                  onChange={(e) => setEditableFiles(e.target.value)}
                  placeholder="src/server/rate-limit.ts, src/server/api.ts"
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 font-mono outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Prohibited Action *</label>
                <input
                  type="text"
                  value={prohibitedAction}
                  onChange={(e) => setProhibitedAction(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 font-mono outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Objective & Scope *</label>
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Precise objective to be carried out..."
                  rows={3}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Lock Task Specification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
