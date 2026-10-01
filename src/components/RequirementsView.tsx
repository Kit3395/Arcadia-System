import React, { useState } from 'react';
import { FileCheck, Plus, CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Requirement, RequirementStatus, RequirementSource, RequirementClassification, User } from '../types/index.ts';

interface RequirementsViewProps {
  requirements: Requirement[];
  currentUser: User | null;
  onCreateRequirement: (data: any) => Promise<void>;
  onUpdateStatus: (reqId: string, status: RequirementStatus) => Promise<void>;
}

export const RequirementsView: React.FC<RequirementsViewProps> = ({
  requirements,
  currentUser,
  onCreateRequirement,
  onUpdateStatus
}) => {
  const [showModal, setShowModal] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState<RequirementSource>('USER_REQUEST');
  const [sourceReference, setSourceReference] = useState('');
  const [classification, setClassification] = useState<RequirementClassification>('FACT');
  const [affectedComponent, setAffectedComponent] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canApprove = currentUser?.role === 'PROJECT_LEAD' || currentUser?.role === 'ARCHITECT';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !description.trim()) {
      setErrorMsg('Identifier and description are required.');
      return;
    }

    setErrorMsg(null);
    try {
      await onCreateRequirement({
        reqIdentifier: identifier,
        description,
        source,
        sourceReference: sourceReference || 'Direct input',
        classification,
        affectedComponents: affectedComponent ? [affectedComponent] : []
      });
      setShowModal(false);
      setIdentifier('');
      setDescription('');
      setSourceReference('');
      setAffectedComponent('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record requirement.');
    }
  };

  const getStatusBadge = (status: RequirementStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'PROPOSED':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'REJECTED':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'IMPLEMENTED':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'VERIFIED':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getClassificationBadge = (cls: RequirementClassification) => {
    switch (cls) {
      case 'FACT':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'RECOMMENDATION':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'ASSUMPTION':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <span>Requirements & Provenance (Layer 2)</span>
            </h1>
            <span className="text-xs font-mono text-slate-400">
              {requirements.length} canonical records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative source of truth. AI inferences and prompt outputs cannot modify these without human sign-off.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/40 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Governed Requirement</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Requirements Table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Classification & Source</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">Components</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Governance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {requirements.map((req) => (
                <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-200 whitespace-nowrap">
                    {req.reqIdentifier}
                  </td>
                  <td className="p-3.5 whitespace-nowrap space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getClassificationBadge(req.classification)}`}>
                        {req.classification}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      src: {req.source}
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-300 max-w-md leading-relaxed">
                    <p>{req.description}</p>
                    {req.sourceReference && (
                      <span className="text-[10px] text-slate-500 italic block mt-0.5">
                        Ref: {req.sourceReference}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1">
                      {req.affectedComponents.map((c) => (
                        <span key={c} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getStatusBadge(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    {req.status === 'PROPOSED' && (
                      <div className="flex items-center justify-end space-x-1.5">
                        {canApprove ? (
                          <>
                            <button
                              onClick={() => onUpdateStatus(req.id, 'APPROVED')}
                              title="Sign-off and Ratify"
                              className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 font-mono flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => onUpdateStatus(req.id, 'REJECTED')}
                              title="Reject Requirement"
                              className="px-2 py-1 rounded bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 font-mono flex items-center space-x-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Requires Lead/Architect Approval
                          </span>
                        )}
                      </div>
                    )}
                    {req.status === 'APPROVED' && (
                      <div className="flex items-center justify-end space-x-1 text-emerald-400 font-mono text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Ratified</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Requirement Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Create Authoritative Requirement</span>
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300 text-xs">
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Requirement Identifier *</label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. REQ-DATA-01"
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 outline-none font-mono focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Classification *</label>
                  <select
                    value={classification}
                    onChange={(e) => setClassification(e.target.value as any)}
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 outline-none font-mono"
                  >
                    <option value="FACT">FACT (Verified Truth)</option>
                    <option value="ASSUMPTION">ASSUMPTION (Unverified)</option>
                    <option value="REQUEST">REQUEST (Client / Product)</option>
                    <option value="PROPOSAL">PROPOSAL (Engineering)</option>
                    <option value="RECOMMENDATION">RECOMMENDATION (AI/Tool)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Source Type *</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as any)}
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 outline-none font-mono"
                  >
                    <option value="USER_REQUEST">USER_REQUEST</option>
                    <option value="CONTRACT">CONTRACT / SOW</option>
                    <option value="LEGAL_REGULATORY">LEGAL / REGULATORY</option>
                    <option value="TEAM_DECISION">TEAM_DECISION</option>
                    <option value="AI_RECOMMENDATION">AI_RECOMMENDATION (Quarantined)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Source Reference Document</label>
                  <input
                    type="text"
                    value={sourceReference}
                    onChange={(e) => setSourceReference(e.target.value)}
                    placeholder="e.g. SOC2 Section 4.1"
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Affected Component</label>
                <input
                  type="text"
                  value={affectedComponent}
                  onChange={(e) => setAffectedComponent(e.target.value)}
                  placeholder="e.g. auth-service, database"
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Requirement Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the functional requirement precisely and unambiguously..."
                  rows={3}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 outline-none focus:border-emerald-500"
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
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Record Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
