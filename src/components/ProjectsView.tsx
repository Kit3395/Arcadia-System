import React, { useState } from 'react';
import { FolderPlus, Layers, Calendar, UserCheck } from 'lucide-react';
import { Project, ProjectComplexity, User } from '../types/index.ts';

interface ProjectsViewProps {
  projects: Project[];
  currentProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (data: { name: string; slug: string; description: string; complexityLevel: ProjectComplexity }) => Promise<void>;
  currentUser: User | null;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  currentProjectId,
  onSelectProject,
  onCreateProject,
  currentUser
}) => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [complexityLevel, setComplexityLevel] = useState<ProjectComplexity>('L2');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !description.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onCreateProject({ name, slug, description, complexityLevel });
      setShowModal(false);
      setName('');
      setSlug('');
      setDescription('');
      setComplexityLevel('L2');
    } catch (err: any) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Projects Directory</h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative, isolated project environments governed by the Arcadia Constitution.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/40 shrink-0"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Governed Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((proj) => {
          const isSelected = proj.id === currentProjectId;
          return (
            <div
              key={proj.id}
              onClick={() => onSelectProject(proj.id)}
              className={`rounded-lg border p-5 transition-all cursor-pointer space-y-3 ${
                isSelected
                  ? 'border-emerald-500/60 bg-slate-900/90 ring-1 ring-emerald-500/30'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{proj.name}</h3>
                  <span className="text-[10px] font-mono text-slate-500">{proj.slug}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    {proj.complexityLevel}
                  </span>
                  {isSelected && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      ACTIVE
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {proj.description}
              </p>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <div className="flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>{proj.primaryState}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>v{proj.currentVersion}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <FolderPlus className="w-4 h-4 text-emerald-400" />
                <span>Initialize Governed Project</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Project Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Ledger Transaction Service"
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Project Slug (Machine ID) *</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="ledger-transaction-service"
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 focus:border-emerald-500 outline-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Complexity Tier *</label>
                <select
                  value={complexityLevel}
                  onChange={(e) => setComplexityLevel(e.target.value as ProjectComplexity)}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 focus:border-emerald-500 outline-none font-mono"
                >
                  <option value="L0">L0 — Static Page / Landing</option>
                  <option value="L1">L1 — Business Site</option>
                  <option value="L2">L2 — Interactive Web Application</option>
                  <option value="L3">L3 — Full Web Application with Auth & DB</option>
                  <option value="L4">L4 — Business System with Financial/Sensitive Flows</option>
                  <option value="L5">L5 — Enterprise / Regulated Distributed Platform</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Description & Objective *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the core business scope and boundaries..."
                  rows={3}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Provisioning...' : 'Provision Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
