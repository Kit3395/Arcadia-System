import React, { useState } from 'react';
import { Shield, Users, Check, Copy, RefreshCw, Lock, LogOut } from 'lucide-react';
import { User, Organization, UserRole } from '../types/index.ts';

interface HeaderProps {
  user: User | null;
  organization: Organization | null;
  availableUsers: User[];
  onSwitchUser: (userId: string) => void;
  correlationId?: string;
  onRefresh: () => void;
  isLoading: boolean;
  onLockdown?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  organization,
  availableUsers,
  onSwitchUser,
  correlationId,
  onRefresh,
  isLoading,
  onLockdown,
  onLogout
}) => {
  const [copied, setCopied] = useState(false);

  const copyCorrelationId = () => {
    if (correlationId) {
      navigator.clipboard.writeText(correlationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRoleBadgeColor = (role?: UserRole) => {
    switch (role) {
      case 'PROJECT_LEAD': return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'ARCHITECT': return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      case 'SECURITY': return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'DEVELOPER': return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'OPERATIONS': return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'CLIENT': return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950 px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand & Organization */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="leading-tight">
            <span className="font-bold text-slate-100 tracking-wider text-base">ARCADIA</span>
            <span className="text-[11px] text-slate-400 ml-2 font-mono">ENTERPRISE</span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
          <span className="text-slate-500">Domain:</span>
          <span className="text-slate-200 font-medium px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            {organization?.name || 'Arcadia Enterprise Group'}
          </span>
        </div>
      </div>

      {/* Right controls: Role switcher, Correlation ID, Lockdown, Logout */}
      <div className="flex items-center space-x-3">
        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh state from backend"
          className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>

        {/* Correlation ID */}
        {correlationId && (
          <div 
            onClick={copyCorrelationId}
            title="Click to copy trace Correlation ID"
            className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400 hover:border-slate-700 cursor-pointer transition-colors"
          >
            <span className="text-slate-500">trace:</span>
            <span className="text-slate-300">{correlationId.slice(0, 14)}...</span>
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
          </div>
        )}

        {/* Live RBAC Role Switcher (admin roles only — mirrors server's admin.config gate) */}
        {['PROJECT_LEAD', 'SECURITY', 'OPERATIONS'].includes(user?.role || '') && (
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <Users className="w-4 h-4 text-slate-500" />
          <div className="flex flex-col">
            <label className="text-[9px] font-mono uppercase tracking-wider text-slate-500">Active Persona</label>
            <select
              value={user?.id || ''}
              onChange={(e) => onSwitchUser(e.target.value)}
              className={`text-xs font-medium px-2 py-1 rounded border outline-none cursor-pointer bg-slate-900 ${getRoleBadgeColor(user?.role)}`}
            >
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id} className="bg-slate-950 text-slate-200">
                  {u.role} — {u.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>
        )}

        {/* Emergency Full-System Lockdown (admin roles only) */}
        {onLockdown && ['PROJECT_LEAD', 'SECURITY', 'OPERATIONS'].includes(user?.role || '') && (
          <button
            onClick={onLockdown}
            title="Enact Full System Lockdown (Revokes all active sessions immediately)"
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-mono transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden lg:inline">LOCKDOWN</span>
          </button>
        )}

        {/* Sign Out Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign out of current authorized session"
            className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>
    </header>
  );
};
