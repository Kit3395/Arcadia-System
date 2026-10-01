import React, { useState } from 'react';
import { History, Search, Shield, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { AuditLogEntry } from '../types/index.ts';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    const q = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actorId.toLowerCase().includes(q) ||
      log.actorRole.toLowerCase().includes(q) ||
      log.targetEntity.toLowerCase().includes(q) ||
      log.correlationId.toLowerCase().includes(q)
    );
  });

  const handleCopyCorr = (corrId: string) => {
    navigator.clipboard.writeText(corrId);
    setCopiedId(corrId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <History className="w-5 h-5 text-amber-400" />
              <span>Immutable Audit Trail</span>
            </h1>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
              APPEND-ONLY STREAM
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident record of all state transitions, approvals, RBAC checks, and configuration mutations.
          </p>
        </div>

        {/* Search / Filter bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter action, actor, correlation..."
            className="w-full pl-9 pr-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-amber-500 font-mono"
          />
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="divide-y divide-slate-800/60">
          {filteredLogs.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const hasDiff = entry.beforeState || entry.afterState;

            return (
              <div key={entry.id} className="p-4 hover:bg-slate-850/40 transition-colors space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2.5">
                    {hasDiff && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        className="text-slate-500 hover:text-slate-300 p-0.5"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    )}
                    <span className="font-mono font-bold text-amber-300">
                      {entry.action}
                    </span>
                    <span className="text-slate-500 font-mono">•</span>
                    <span className="text-slate-300 font-medium">
                      {entry.targetEntity} [{entry.targetId}]
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-500">
                    <span className="text-slate-400">
                      by <strong className="text-slate-300">{entry.actorRole}</strong> ({entry.actorId})
                    </span>
                    <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pl-6">
                  <div
                    onClick={() => handleCopyCorr(entry.correlationId)}
                    className="flex items-center space-x-1 hover:text-slate-300 cursor-pointer"
                    title="Click to copy correlation ID"
                  >
                    <span>corr: {entry.correlationId}</span>
                    {copiedId === entry.correlationId ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                  <span>seq: {entry.id}</span>
                </div>

                {/* Expanded Before/After State Inspection */}
                {isExpanded && hasDiff && (
                  <div className="pl-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    {entry.beforeState && (
                      <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase text-rose-400 font-bold block">Previous State</span>
                        <pre className="text-slate-400 text-[11px] overflow-x-auto">
                          {JSON.stringify(entry.beforeState, null, 2)}
                        </pre>
                      </div>
                    )}
                    {entry.afterState && (
                      <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase text-emerald-400 font-bold block">New State</span>
                        <pre className="text-slate-300 text-[11px] overflow-x-auto">
                          {JSON.stringify(entry.afterState, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              No audit records matching search filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
