import React, { useState } from 'react';
import { Beaker, Play, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';
import { TestResult } from '../types/index.ts';

interface TestRunnerViewProps {
  onRunTests: () => Promise<{ passed: boolean; results: TestResult[]; summary: { total: number; passed: number; failed: number } }>;
}

export const TestRunnerView: React.FC<TestRunnerViewProps> = ({ onRunTests }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<{ passed: boolean; results: TestResult[]; summary: { total: number; passed: number; failed: number } } | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const data = await onRunTests();
      setReport(data);
    } catch (err) {
      console.error('Test execution failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const getCategoryBadge = (category: TestResult['category']) => {
    switch (category) {
      case 'EXECUTION': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'CONTEXT': return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'PROMPT': return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'AGENT': return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'SCOPE_LOCK': return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'RBAC': return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'TENANT': return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'AUDIT': return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'DOMAIN': return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
      case 'VALIDATION': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'DRIFT': return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'REGRESSION': return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'FUNCTIONAL': return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'OPTIMIZATION': return 'bg-amber-400/15 text-amber-300 border-amber-400/30';
      case 'LEARNING': return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'RESILIENCE': return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'INTEGRATION': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'VERIFICATION': return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'OPERATIONS': return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'ASSURANCE': return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <Beaker className="w-5 h-5 text-rose-400" />
              <span>Full System Architectural & Invariant Test Harness</span>
            </h1>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
              10 SUITES • CI AUTOMATION
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated verification across all 10 architectural domains: RBAC Security, Autonomous Execution, Multi-Agent Collaboration, Validation & Drift, Optimization Intelligence, Organizational Memory, Resilience & Containment, Production Go-Live Gates, Operations & Runtime, and Continuous Assurance.
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning}
          className="px-4 py-2 rounded text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-rose-950/50 disabled:opacity-50 shrink-0"
        >
          <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Running Verification Suite...' : 'Execute Invariant Tests'}</span>
        </button>
      </div>

      {/* Summary Card if run */}
      {report && (
        <div className={`p-5 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-4 ${
          report.passed
            ? 'bg-emerald-950/20 border-emerald-500/40'
            : 'bg-rose-950/20 border-rose-500/40'
        }`}>
          <div className="flex items-center space-x-3">
            {report.passed ? (
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-rose-400" />
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                {report.passed ? 'All Architectural Invariants Ratified & Passed' : 'Test Suite Reported Failures'}
              </h2>
              <p className="text-xs text-slate-400">
                {report.summary.passed} of {report.summary.total} verification checks succeeded.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 font-mono text-xs">
            <div className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500">Passed: </span>
              <strong className="text-emerald-400">{report.summary.passed}</strong>
            </div>
            <div className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500">Failed: </span>
              <strong className={report.summary.failed > 0 ? 'text-rose-400' : 'text-slate-400'}>
                {report.summary.failed}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Test List */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="divide-y divide-slate-800/60">
          {report ? (
            report.results.map((r, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-850/40 transition-colors text-xs">
                <div className="flex items-center space-x-3">
                  {r.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100">{r.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${getCategoryBadge(r.category)}`}>
                        {r.category}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">{r.message}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>{r.durationMs}ms</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-500 font-mono text-xs space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto" />
              <p>Click "Execute Invariant Tests" to run the automated foundation verification harness.</p>
              <p className="text-[11px] text-slate-600">
                Covers: RBAC matrix, Tenant scoping, Scope lock boundaries, Lifecycle state prerequisites, and Audit trails.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
