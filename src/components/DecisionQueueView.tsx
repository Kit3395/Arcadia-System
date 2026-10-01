import React, { useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  HelpCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import { DecisionQueueItem, DecisionQueueCategory, DecisionQueuePriority, User } from '../types/index.ts';

interface DecisionQueueViewProps {
  items: DecisionQueueItem[];
  currentUser: User | null;
  onResolveItem: (itemId: string, action: 'APPROVED' | 'REJECTED' | 'DEFERRED', notes: string) => Promise<void>;
}

export const DecisionQueueView: React.FC<DecisionQueueViewProps> = ({
  items,
  currentUser,
  onResolveItem
}) => {
  const [selectedItem, setSelectedItem] = useState<DecisionQueueItem | null>(items[0] || null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canResolve = currentUser?.role === 'PROJECT_LEAD' || currentUser?.role === 'ARCHITECT' || currentUser?.role === 'SECURITY';

  const handleAction = async (action: 'APPROVED' | 'REJECTED' | 'DEFERRED') => {
    if (!selectedItem) return;
    setIsResolving(true);
    setStatusMsg(null);
    try {
      await onResolveItem(selectedItem.id, action, resolutionNotes);
      setStatusMsg({ type: 'success', text: `Item ${selectedItem.id} marked as ${action}.` });
      setResolutionNotes('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to resolve item.' });
    } finally {
      setIsResolving(false);
    }
  };

  const getPriorityBadge = (priority: DecisionQueuePriority) => {
    switch (priority) {
      case 'BLOCKER': return 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold';
      case 'HIGH': return 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
      case 'MEDIUM': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'LOW': return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getCategoryBadge = (category: DecisionQueueCategory) => {
    switch (category) {
      case 'RECOMMENDATION': return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'EXCEPTION': return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'DRIFT': return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
      case 'ESCALATION': return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <AlertOctagon className="w-5 h-5 text-amber-400" />
              <span>Human Decision Queue</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {items.filter(i => i.status === 'PENDING').length} PENDING
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative human control point. AI recommendations, scope lock alerts, and architectural escalations stop here.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded text-xs flex items-center space-x-2 ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Decision Queue Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Queue Items */}
        <div className="lg:col-span-5 space-y-2.5">
          {items.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-4 rounded-lg border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'border-amber-500/60 bg-slate-900/90 ring-1 ring-amber-500/30'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getPriorityBadge(item.priority)}`}>
                      {item.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getCategoryBadge(item.category)}`}>
                      {item.category}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${
                    item.status === 'PENDING' ? 'text-amber-400' : 'text-slate-500'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-100">{item.title}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">{item.description}</p>

                <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80 flex justify-between">
                  <span>ID: {item.id}</span>
                  <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs font-mono">
              Decision Queue is empty.
            </div>
          )}
        </div>

        {/* Right Column: Active Item Details & Resolution Action */}
        {selectedItem ? (
          <div className="lg:col-span-7 rounded-lg border border-slate-800 bg-slate-900/40 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getPriorityBadge(selectedItem.priority)}`}>
                    {selectedItem.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getCategoryBadge(selectedItem.category)}`}>
                    {selectedItem.category}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-slate-100 mt-2">{selectedItem.title}</h2>
              </div>
              <span className="text-xs font-mono text-slate-500">{selectedItem.id}</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded border border-slate-800">
              {selectedItem.description}
            </p>

            {/* Impact Analysis Card */}
            {selectedItem.impactAnalysis && (
              <div className="rounded border border-slate-800 bg-slate-950/70 p-3.5 space-y-2 text-xs">
                <div className="font-bold text-slate-300 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Impact & Risk Analysis</span>
                </div>
                <div className="space-y-1 text-slate-400">
                  <div className="flex justify-between">
                    <span>Scope Delta:</span>
                    <span className="text-slate-200 font-mono">{selectedItem.impactAnalysis.scopeDelta}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Score:</span>
                    <span className="text-amber-400 font-mono">{selectedItem.impactAnalysis.riskScore} / 1.0</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payload Inspection */}
            {selectedItem.contextPayload && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Context Payload</span>
                <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                  {JSON.stringify(selectedItem.contextPayload, null, 2)}
                </pre>
              </div>
            )}

            {/* Resolution Form or Completed Status */}
            {selectedItem.status === 'PENDING' ? (
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Human Resolution Notes</label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Provide authoritative reasoning for this resolution..."
                    rows={2}
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 text-xs outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 font-mono">
                    Authority: {currentUser?.role}
                  </div>

                  {canResolve ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAction('DEFERRED')}
                        disabled={isResolving}
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-1"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Defer</span>
                      </button>
                      <button
                        onClick={() => handleAction('REJECTED')}
                        disabled={isResolving}
                        className="px-3 py-1.5 rounded bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-medium flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleAction('APPROVED')}
                        disabled={isResolving}
                        className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sign-off & Approve</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-amber-400/80 font-mono">
                      Requires PROJECT_LEAD, ARCHITECT, or SECURITY role to resolve
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Resolved as: <strong className="text-slate-200">{selectedItem.status}</strong></span>
                  <span>At: {selectedItem.resolvedAt ? new Date(selectedItem.resolvedAt).toLocaleString() : 'N/A'}</span>
                </div>
                {selectedItem.resolutionNotes && (
                  <p className="text-slate-300 italic">"{selectedItem.resolutionNotes}"</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-7 p-8 text-center text-slate-500 text-xs font-mono">
            Select an item from the Decision Queue to view impact analysis and execute resolution.
          </div>
        )}
      </div>
    </div>
  );
};
