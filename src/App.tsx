import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from './lib/api.ts';
import { Header } from './components/Header.tsx';
import { Sidebar, ViewTab } from './components/Sidebar.tsx';
import { LoginView } from './components/LoginView.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ProjectsView } from './components/ProjectsView.tsx';
import { ConstitutionView } from './components/ConstitutionView.tsx';
import { RequirementsView } from './components/RequirementsView.tsx';
import { TasksView } from './components/TasksView.tsx';
import { ExecutionView } from './components/ExecutionView.tsx';
import { CollaborationView } from './components/CollaborationView.tsx';
import { ValidationView } from './components/ValidationView.tsx';
import { OptimizationView } from './components/OptimizationView.tsx';
import { LearningView } from './components/LearningView.tsx';
import { ResilienceView } from './components/ResilienceView.tsx';
import { VerificationView } from './components/VerificationView.tsx';
import { OperationsView } from './components/OperationsView.tsx';
import { AssuranceView } from './components/AssuranceView.tsx';
import { DecisionsView } from './components/DecisionsView.tsx';
import { DecisionQueueView } from './components/DecisionQueueView.tsx';
import { AuditLogView } from './components/AuditLogView.tsx';
import { TestRunnerView } from './components/TestRunnerView.tsx';
import {
  User,
  Organization,
  Project,
  ProjectConstitution,
  Requirement,
  Decision,
  UniversalTaskSpecification,
  DecisionQueueItem,
  AuditLogEntry,
  ProjectPrimaryState,
  RequirementStatus,
  TaskState,
  ProjectComplexity
} from './types/index.ts';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [correlationId, setCorrelationId] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const [constitution, setConstitution] = useState<ProjectConstitution | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [tasks, setTasks] = useState<UniversalTaskSpecification[]>([]);
  const [decisionQueue, setDecisionQueue] = useState<DecisionQueueItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // 1. Fetch Session & Core Context
  const fetchSession = useCallback(async () => {
    try {
      const token = localStorage.getItem('arcadia_session_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/session', { headers });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setIsAuthenticated(true);
        setIsLocked(false);
        setCurrentUser(data.user);
        setOrganization(data.organization);
        setAvailableUsers(data.availableUsers);
        setCorrelationId(data.correlationId || '');
      } else {
        setIsAuthenticated(false);
        setIsLocked(data.isLocked || false);
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch session:', err);
      setIsAuthenticated(false);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  // 2. Fetch Projects
  const fetchProjects = useCallback(async () => {
    try {
      const res = await apiFetch('/api/projects');
      if (!res.ok) return;
      const data: Project[] = await res.json();
      setProjects(data);
      if (!currentProjectId && data.length > 0) {
        setCurrentProjectId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  }, [currentProjectId]);

  // 3. Fetch Selected Project Details & Sub-resources
  const fetchProjectData = useCallback(async (projId: string) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [constRes, reqRes, decRes, taskRes, queueRes, auditRes] = await Promise.all([
        fetch(`/api/projects/${projId}/constitution`),
        fetch(`/api/projects/${projId}/requirements`),
        fetch(`/api/projects/${projId}/decisions`),
        fetch(`/api/projects/${projId}/tasks`),
        fetch(`/api/projects/${projId}/decision-queue`),
        fetch(`/api/projects/${projId}/audit-logs`)
      ]);

      if (constRes.ok) setConstitution(await constRes.json());
      if (reqRes.ok) setRequirements(await reqRes.json());
      if (decRes.ok) setDecisions(await decRes.json());
      if (taskRes.ok) setTasks(await taskRes.json());
      if (queueRes.ok) setDecisionQueue(await queueRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
    } catch (err: any) {
      console.error('Failed to load project details:', err);
      setApiError('Failed to load project details.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
    fetchProjects();
  }, [fetchSession, fetchProjects]);

  useEffect(() => {
    if (currentProjectId) {
      fetchProjectData(currentProjectId);
    }
  }, [currentProjectId, fetchProjectData]);

  // --- Handlers ---

  const handleLoginSuccess = (user: User, _token: string, org?: Organization) => {
    setIsAuthenticated(true);
    setIsLocked(false);
    setCurrentUser(user);
    if (org) setOrganization(org);
    fetchSession();
    fetchProjects();
  };

  const handleLockdown = async () => {
    try {
      const token = localStorage.getItem('arcadia_session_token');
      await fetch('/api/auth/lockdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
    } catch (err) {
      console.error('Lockdown request failed:', err);
    } finally {
      localStorage.removeItem('arcadia_session_token');
      localStorage.removeItem('arcadia_user_id');
      setIsAuthenticated(false);
      setIsLocked(true);
      setCurrentUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('arcadia_session_token');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('arcadia_session_token');
      localStorage.removeItem('arcadia_user_id');
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  };

  const handleSwitchUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('arcadia_session_token');
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.success) {
        if (data.token) localStorage.setItem('arcadia_session_token', data.token);
        setCurrentUser(data.user);
        if (currentProjectId) fetchProjectData(currentProjectId);
      }
    } catch (err) {
      console.error('Failed to switch user role:', err);
    }
  };

  const handleCreateProject = async (data: { name: string; slug: string; description: string; complexityLevel: ProjectComplexity }) => {
    const res = await apiFetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Project creation rejected');
    }

    const newProj = await res.json();
    setProjects(prev => [...prev, newProj]);
    setCurrentProjectId(newProj.id);
    setCurrentTab('dashboard');
  };

  const handleAdvanceProjectState = async (newState: ProjectPrimaryState) => {
    if (!currentProjectId) return;
    const res = await fetch(`/api/projects/${currentProjectId}/state`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newState })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'State transition rejected');
    }

    const updated = await res.json();
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    fetchProjectData(currentProjectId);
  };

  const handleUpdateConstitution = async (newConfig: any) => {
    if (!currentProjectId) return;
    const res = await fetch(`/api/projects/${currentProjectId}/constitution`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Constitution update rejected');
    }

    const updated = await res.json();
    setConstitution(updated);
    fetchProjectData(currentProjectId);
  };

  const handleCreateRequirement = async (data: any) => {
    if (!currentProjectId) return;
    const res = await fetch(`/api/projects/${currentProjectId}/requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Requirement creation failed');
    }

    fetchProjectData(currentProjectId);
  };

  const handleUpdateRequirementStatus = async (reqId: string, status: RequirementStatus) => {
    if (!currentProjectId) return;
    const res = await fetch(`/api/projects/${currentProjectId}/requirements/${reqId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Requirement status update failed');
    }

    fetchProjectData(currentProjectId);
  };

  const handleCreateDecision = async (data: any) => {
    if (!currentProjectId) return;
    const res = await fetch(`/api/projects/${currentProjectId}/decisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Decision creation failed');
    }

    fetchProjectData(currentProjectId);
  };

  const handleApproveDecision = async (decId: string) => {
    if (!currentProjectId) return;
    const res = await fetch(`/api/projects/${currentProjectId}/decisions/${decId}/approve`, {
      method: 'PATCH'
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Decision approval failed');
    }

    fetchProjectData(currentProjectId);
  };

  const handleCreateTask = async (data: any) => {
    if (!currentProjectId) return;
    const res = await fetch(`/api/projects/${currentProjectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Task creation failed');
    }

    fetchProjectData(currentProjectId);
  };

  const handleUpdateTaskState = async (taskId: string, newState: TaskState) => {
    if (!currentProjectId) return;
    const res = await fetch(`/api/projects/${currentProjectId}/tasks/${taskId}/state`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newState })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Task state update failed');
    }

    fetchProjectData(currentProjectId);
  };

  const handleVerifyScope = async (taskId: string, filesModified: string[], action: string) => {
    if (!currentProjectId) return { allowed: false, violationReason: 'No project selected' };
    const res = await fetch(`/api/projects/${currentProjectId}/tasks/${taskId}/verify-scope`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filesModified, actionRequested: action })
    });

    return await res.json();
  };

  const handleResolveDecisionQueueItem = async (itemId: string, action: 'APPROVED' | 'REJECTED' | 'DEFERRED', notes: string) => {
    if (!currentProjectId) return;
    const res = await fetch(`/api/projects/${currentProjectId}/decision-queue/${itemId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, notes })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Resolution failed');
    }

    fetchProjectData(currentProjectId);
  };

  const handleRunTests = async () => {
    const res = await apiFetch('/api/tests/run', { method: 'POST' });
    return await res.json();
  };

  const activeProject = projects.find(p => p.id === currentProjectId) || null;
  const pendingDecisionsCount = decisionQueue.filter(i => i.status === 'PENDING').length;

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-mono text-xs select-none">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">VERIFYING ARCADIA ENTERPRISE CREDENTIALS...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || isLocked) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        user={currentUser}
        organization={organization}
        availableUsers={availableUsers}
        onSwitchUser={handleSwitchUser}
        correlationId={correlationId}
        onRefresh={() => currentProjectId && fetchProjectData(currentProjectId)}
        isLoading={isLoading}
        onLockdown={handleLockdown}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          currentProject={activeProject}
          pendingDecisionsCount={pendingDecisionsCount}
        />

        <main className="flex-1 overflow-y-auto bg-slate-950">
          {currentTab === 'dashboard' && (
            <DashboardView
              project={activeProject}
              requirements={requirements}
              tasks={tasks}
              decisionQueue={decisionQueue}
              currentUser={currentUser}
              onAdvanceState={handleAdvanceProjectState}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'projects' && (
            <ProjectsView
              projects={projects}
              currentProjectId={currentProjectId}
              onSelectProject={(id) => {
                setCurrentProjectId(id);
                setCurrentTab('dashboard');
              }}
              onCreateProject={handleCreateProject}
              currentUser={currentUser}
            />
          )}

          {currentTab === 'constitution' && (
            <ConstitutionView
              project={activeProject}
              constitution={constitution}
              onUpdateConstitution={handleUpdateConstitution}
              currentUser={currentUser}
            />
          )}

          {currentTab === 'requirements' && (
            <RequirementsView
              requirements={requirements}
              currentUser={currentUser}
              onCreateRequirement={handleCreateRequirement}
              onUpdateStatus={handleUpdateRequirementStatus}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              currentUser={currentUser}
              onUpdateTaskState={handleUpdateTaskState}
              onCreateTask={handleCreateTask}
              onVerifyScope={handleVerifyScope}
            />
          )}

          {currentTab === 'executions' && (
            <ExecutionView
              project={activeProject}
              tasks={tasks}
              currentUser={currentUser}
              onRefreshProjectData={() => currentProjectId && fetchProjectData(currentProjectId)}
              onNavigateToTask={() => setCurrentTab('tasks')}
            />
          )}

          {currentTab === 'collaboration' && (
            <CollaborationView
              project={activeProject}
              tasks={tasks}
              currentUser={currentUser}
              onRefreshProjectData={() => currentProjectId && fetchProjectData(currentProjectId)}
              onNavigateToQueue={() => setCurrentTab('decision-queue')}
            />
          )}

          {currentTab === 'validation' && (
            <ValidationView
              project={activeProject}
              tasks={tasks}
              currentUser={currentUser}
              onRefreshProjectData={() => currentProjectId && fetchProjectData(currentProjectId)}
            />
          )}

          {currentTab === 'optimization' && (
            <OptimizationView
              project={activeProject}
              currentUser={currentUser}
              onRefreshProjectData={() => currentProjectId && fetchProjectData(currentProjectId)}
            />
          )}

          {currentTab === 'learning' && activeProject && currentUser && (
            <LearningView
              project={activeProject}
              currentUser={currentUser}
              onRefreshProjectData={() => currentProjectId && fetchProjectData(currentProjectId)}
            />
          )}

          {currentTab === 'resilience' && activeProject && currentUser && (
            <ResilienceView
              project={activeProject}
              currentUser={currentUser}
              onRefreshProjectData={() => currentProjectId && fetchProjectData(currentProjectId)}
            />
          )}

          {currentTab === 'verification' && activeProject && currentUser && (
            <VerificationView
              project={activeProject}
              currentUser={currentUser}
              onRefreshProjectData={() => currentProjectId && fetchProjectData(currentProjectId)}
            />
          )}

          {currentTab === 'operations' && activeProject && currentUser && (
            <OperationsView
              project={activeProject}
              currentUser={currentUser}
              onRefreshProjectData={() => currentProjectId && fetchProjectData(currentProjectId)}
            />
          )}

          {currentTab === 'assurance' && activeProject && currentUser && (
            <AssuranceView
              project={activeProject}
              currentUser={currentUser}
              onRefreshProjectData={() => currentProjectId && fetchProjectData(currentProjectId)}
            />
          )}

          {currentTab === 'decisions' && (
            <DecisionsView
              decisions={decisions}
              currentUser={currentUser}
              onCreateDecision={handleCreateDecision}
              onApproveDecision={handleApproveDecision}
            />
          )}

          {currentTab === 'decision-queue' && (
            <DecisionQueueView
              items={decisionQueue}
              currentUser={currentUser}
              onResolveItem={handleResolveDecisionQueueItem}
            />
          )}

          {currentTab === 'audit-log' && (
            <AuditLogView logs={auditLogs} />
          )}

          {currentTab === 'test-runner' && (
            <TestRunnerView onRunTests={handleRunTests} />
          )}
        </main>
      </div>
    </div>
  );
}
export default App;
