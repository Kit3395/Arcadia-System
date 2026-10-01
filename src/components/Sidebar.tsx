import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  AlertOctagon,
  Scroll,
  FileCheck,
  CheckSquare,
  History,
  FileCode2,
  Beaker,
  Cpu,
  Users,
  ShieldCheck,
  Zap,
  Brain,
  ShieldAlert,
  Award,
  Radio,
  Scale
} from 'lucide-react';
import { Project } from '../types/index.ts';

export type ViewTab =
  | 'dashboard'
  | 'projects'
  | 'decision-queue'
  | 'constitution'
  | 'requirements'
  | 'tasks'
  | 'executions'
  | 'collaboration'
  | 'validation'
  | 'optimization'
  | 'learning'
  | 'resilience'
  | 'verification'
  | 'operations'
  | 'assurance'
  | 'decisions'
  | 'audit-log'
  | 'test-runner';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  currentProject: Project | null;
  pendingDecisionsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentProject,
  pendingDecisionsCount
}) => {
  const navItemClass = (tab: ViewTab) =>
    `w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
      currentTab === tab
        ? 'bg-emerald-500/10 text-emerald-300 border-l-2 border-emerald-400 pl-2.5 font-semibold'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
    }`;

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950 flex flex-col justify-between py-4 select-none shrink-0 overflow-y-auto">
      <div className="space-y-6 px-3">
        {/* Core Management */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
            Governance & Strategy
          </div>
          <div className="space-y-1">
            <button onClick={() => onSelectTab('dashboard')} className={navItemClass('dashboard')}>
              <div className="flex items-center space-x-2.5">
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                <span>Executive Dashboard</span>
              </div>
            </button>

            <button onClick={() => onSelectTab('projects')} className={navItemClass('projects')}>
              <div className="flex items-center space-x-2.5">
                <FolderGit2 className="w-4 h-4 text-slate-400" />
                <span>Project Portfolio</span>
              </div>
            </button>

            <button onClick={() => onSelectTab('decision-queue')} className={navItemClass('decision-queue')}>
              <div className="flex items-center space-x-2.5">
                <AlertOctagon className="w-4 h-4 text-amber-400" />
                <span>Decision Queue</span>
              </div>
              {pendingDecisionsCount > 0 && (
                <span className="text-[11px] font-mono text-amber-300 font-semibold">
                  {pendingDecisionsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Project Architecture & Engineering */}
        {currentProject && (
          <div>
            <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span className="truncate max-w-[140px]">{currentProject.name}</span>
              <span className="text-emerald-400 font-semibold">{currentProject.complexityLevel}</span>
            </div>
            <div className="space-y-1">
              <button onClick={() => onSelectTab('constitution')} className={navItemClass('constitution')}>
                <div className="flex items-center space-x-2.5">
                  <Scroll className="w-4 h-4 text-indigo-400" />
                  <span>Constitution & Tech</span>
                </div>
              </button>

              <button onClick={() => onSelectTab('requirements')} className={navItemClass('requirements')}>
                <div className="flex items-center space-x-2.5">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Requirements & Provenance</span>
                </div>
              </button>

              <button onClick={() => onSelectTab('tasks')} className={navItemClass('tasks')}>
                <div className="flex items-center space-x-2.5">
                  <CheckSquare className="w-4 h-4 text-cyan-400" />
                  <span>Tasks & Scope Lock</span>
                </div>
              </button>

              <button onClick={() => onSelectTab('executions')} className={navItemClass('executions')}>
                <div className="flex items-center space-x-2.5">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Autonomous Execution</span>
                </div>
              </button>

              <button onClick={() => onSelectTab('collaboration')} className={navItemClass('collaboration')}>
                <div className="flex items-center space-x-2.5">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Multi-Agent Consensus</span>
                </div>
              </button>

              <button onClick={() => onSelectTab('optimization')} className={navItemClass('optimization')}>
                <div className="flex items-center space-x-2.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Cost & Telemetry</span>
                </div>
              </button>

              <button onClick={() => onSelectTab('learning')} className={navItemClass('learning')}>
                <div className="flex items-center space-x-2.5">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span>Organizational Memory</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Assurance & Operations */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
            Assurance & Reliability
          </div>
          <div className="space-y-1">
            <button onClick={() => onSelectTab('validation')} className={navItemClass('validation')}>
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Validation & Drift</span>
              </div>
            </button>

            <button onClick={() => onSelectTab('resilience')} className={navItemClass('resilience')}>
              <div className="flex items-center space-x-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Resilience & Hardening</span>
              </div>
            </button>

            <button onClick={() => onSelectTab('verification')} className={navItemClass('verification')}>
              <div className="flex items-center space-x-2.5">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Production Go-Live</span>
              </div>
            </button>

            <button onClick={() => onSelectTab('operations')} className={navItemClass('operations')}>
              <div className="flex items-center space-x-2.5">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Operations & Runtime</span>
              </div>
            </button>

            <button onClick={() => onSelectTab('assurance')} className={navItemClass('assurance')}>
              <div className="flex items-center space-x-2.5">
                <Scale className="w-4 h-4 text-indigo-400" />
                <span>Continuous Assurance</span>
              </div>
            </button>

            <button onClick={() => onSelectTab('decisions')} className={navItemClass('decisions')}>
              <div className="flex items-center space-x-2.5">
                <FileCode2 className="w-4 h-4 text-purple-400" />
                <span>Approved Decisions</span>
              </div>
            </button>

            <button onClick={() => onSelectTab('audit-log')} className={navItemClass('audit-log')}>
              <div className="flex items-center space-x-2.5">
                <History className="w-4 h-4 text-amber-300" />
                <span>Immutable Audit Log</span>
              </div>
            </button>
          </div>
        </div>

        {/* Verification Engine */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
            System Verification
          </div>
          <div className="space-y-1">
            <button onClick={() => onSelectTab('test-runner')} className={navItemClass('test-runner')}>
              <div className="flex items-center space-x-2.5">
                <Beaker className="w-4 h-4 text-rose-400" />
                <span>Automated Invariants</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">10 SUITES</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-3 border-t border-slate-900 text-[11px] text-slate-500 font-mono flex flex-col space-y-1">
        <div className="flex justify-between">
          <span>Architecture:</span>
          <span className="text-slate-300">Modular Monolith</span>
        </div>
        <div className="flex justify-between">
          <span>Operating State:</span>
          <span className="text-emerald-400">OPERATIONAL</span>
        </div>
      </div>
    </aside>
  );
};
