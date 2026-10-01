import React, { useState } from 'react';
import { FileCode2, Plus, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';
import { Decision, User } from '../types/index.ts';

interface DecisionsViewProps {
  decisions: Decision[];
  currentUser: User | null;
  onCreateDecision: (data: any) => Promise<void>;
  onApproveDecision: (decId: string) => Promise<void>;
}

export const DecisionsView: React.FC<DecisionsViewProps> = ({
  decisions,
  currentUser,
  onCreateDecision,
  onApproveDecision
}) => {
  const [showModal, setShowModal] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [options, setOptions] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [authority, setAuthority] = useState('Architectural Authority');
  const [evidence, setEvidence] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canApprove = currentUser?.role === 'PROJECT_LEAD' || currentUser?.role === 'ARCHITECT' || currentUser?.role === 'SECURITY';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !title.trim() || !selectedOption.trim()) {
      setErrorMsg('Identifier, title, and selected option are required.');
      return;
    }

    try {
      await onCreateDecision({
        decisionIdentifier: identifier,
        title,
        context,
        options: options.split(',').map(o => o.trim()).filter(Boolean),
        selectedOption,
        authority,
        evidence
      });
      setShowModal(false);
      setIdentifier('');
      setTitle('');
      setContext('');
      setOptions('');
      setSelectedOption('');
      setEvidence('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create decision record.');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <FileCode2 className="w-5 h-5 text-purple-400" />
              <span>Architectural Decision Records (ADR)</span>
            </h1>
            <span className="text-xs font-mono text-slate-400">
              {decisions.length} recorded decisions
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Governed decisions with recorded context, evaluated alternatives, and authority evidence.
          </p>
        </div>

        {currentUser?.role === 'PROJECT_LEAD' || currentUser?.role === 'ARCHITECT' ? (
          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-2 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/40 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Record ADR Decision</span>
          </button>
        ) : (
          <div className="text-[11px] text-slate-500 font-mono italic">
            Decision creation restricted to Architects
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Decisions Cards */}
      <div className="space-y-4">
        {decisions.map((dec) => (
          <div
            key={dec.id}
            className="rounded-lg border border-slate-800 bg-slate-900/40 p-5 space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <span className="font-mono text-xs font-bold text-purple-300 px-2 py-0.5 rounded bg-purple-950/40 border border-purple-800/40">
                  {dec.decisionIdentifier}
                </span>
                <h3 className="text-sm font-bold text-slate-100">{dec.title}</h3>
                <span className="text-[10px] font-mono text-slate-500">v{dec.version}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  dec.status === 'APPROVED'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}>
                  {dec.status}
                </span>

                {dec.status === 'PROPOSED' && canApprove && (
                  <button
                    onClick={() => onApproveDecision(dec.id)}
                    className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-xs font-mono flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Decision</span>
                  </button>
                )}
              </div>
            </div>

            {dec.context && (
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded border border-slate-800/80">
                <strong className="text-slate-400 block mb-1">Context:</strong>
                {dec.context}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">Selected Option</span>
                <span className="font-semibold text-emerald-300">{dec.selectedOption}</span>
              </div>

              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">Authority & Evidence</span>
                <span className="text-slate-300">{dec.authority} {dec.evidence ? `(${dec.evidence})` : ''}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Decision Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <FileCode2 className="w-4 h-4 text-purple-400" />
                <span>Record Architectural Decision</span>
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300 text-xs">
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Decision Identifier *</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. DEC-CACHE-02"
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
                  placeholder="e.g. Caching Strategy for Prompt AST"
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Context & Drivers</label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="What problem or trade-off necessitated this decision?"
                  rows={2}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Options Considered (comma separated)</label>
                <input
                  type="text"
                  value={options}
                  onChange={(e) => setOptions(e.target.value)}
                  placeholder="In-memory LRU, Redis Cluster, No Cache"
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Selected Option *</label>
                <input
                  type="text"
                  value={selectedOption}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  placeholder="In-memory LRU with TTL"
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 outline-none font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Authority</label>
                <input
                  type="text"
                  value={authority}
                  onChange={(e) => setAuthority(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 outline-none"
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
                  className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                >
                  Commit Decision Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
