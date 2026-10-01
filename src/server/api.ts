/**
 * ARCADIA SYSTEM - FOUNDATION SPECIFICATION v1.0
 * Core API Router implementing Domain Rules, RBAC, and State Transitions
 */

import { Router, Response } from 'express';
import { storage } from './storage.ts';
import {
  AuthenticatedRequest,
  requireAuth,
  requirePermission,
  getActiveUserId,
  setActiveUserId,
  createSessionToken,
  revokeSessionToken,
  setSystemLockdown,
  isSystemLockdownActive
} from './auth.ts';
import { ProjectPrimaryState, RequirementStatus, TaskState, UserRole } from '../types/index.ts';
import { executionEngine } from './execution/executionEngine.ts';
import { taskReadinessGate } from './execution/taskReadiness.ts';
import { contextOrchestrator } from './execution/contextOrchestrator.ts';
import { promptCompiler } from './execution/promptCompiler.ts';
import { agentRegistry, REGISTERED_AGENTS } from './execution/agentRegistry.ts';
import { adaptivePipeline } from './execution/adaptivePipeline.ts';
import { collaborationEngine } from './execution/collaborationEngine.ts';
import { validationEngine } from './validation/validationEngine.ts';
import { securityEngine } from './validation/securityEngine.ts';
import { driftEngine } from './validation/driftEngine.ts';
import { regressionEngine } from './validation/regressionEngine.ts';
import { telemetryEngine } from './optimization/telemetryEngine.ts';
import { costEngine } from './optimization/costEngine.ts';
import { temporalEngine } from './optimization/temporalEngine.ts';
import { cognitiveLoadEngine } from './optimization/cognitiveLoadEngine.ts';
import { trustEngine } from './optimization/trustEngine.ts';
import { optimizationEngine } from './optimization/optimizationEngine.ts';
import { learningEngine } from './learning/learningEngine.ts';
import { resilienceEngine } from './resilience/resilienceEngine.ts';
import { scopeRegistry } from './verification/scopeRegistry.ts';
import { traceabilityEngine } from './verification/traceabilityEngine.ts';
import { goLiveEngine } from './verification/goLiveEngine.ts';
import { operationsEngine } from './operations/operationsEngine.ts';
import { assuranceEngine } from './assurance/assuranceEngine.ts';

export const apiRouter = Router();

// ============================================================================
// SYSTEM & AUTHENTICATION
// ============================================================================

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Arcadia System',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Corporate Allowed Users Metadata & Credentials
export interface CorporatePersonnel {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  title: string;
  clearanceLevel: string;
  department: string;
}

const ALLOWED_CORPORATE_PERSONNEL: CorporatePersonnel[] = [
  {
    id: 'usr-lead',
    email: 'lead@arcadia.dev',
    fullName: 'Dr. Evelyn Vance',
    role: 'PROJECT_LEAD',
    title: 'Executive Project Lead & Governance Director',
    clearanceLevel: 'LEVEL 5 (ALPHA-GOVERNANCE)',
    department: 'Executive Governance Council'
  },
  {
    id: 'usr-arch',
    email: 'architect@arcadia.dev',
    fullName: 'Marcus Chen',
    role: 'ARCHITECT',
    title: 'Principal Enterprise Systems Architect',
    clearanceLevel: 'LEVEL 4 (ARCHITECTURE-CORE)',
    department: 'Core Infrastructure & Architecture'
  },
  {
    id: 'usr-sec',
    email: 'security@arcadia.dev',
    fullName: 'Agent Ward',
    role: 'SECURITY',
    title: 'Chief Information Security Officer',
    clearanceLevel: 'LEVEL 5 (CYBER-CONTAINMENT)',
    department: 'Security & Threat Containment'
  },
  {
    id: 'usr-dev',
    email: 'dev@arcadia.dev',
    fullName: 'Sarah Connor',
    role: 'DEVELOPER',
    title: 'Staff Platform Systems Engineer',
    clearanceLevel: 'LEVEL 3 (PLATFORM-EXECUTION)',
    department: 'Platform Engineering & Runtime'
  },
  {
    id: 'usr-ops',
    email: 'ops@arcadia.dev',
    fullName: 'Elena Rostova',
    role: 'OPERATIONS',
    title: 'Site Reliability & Operations Director',
    clearanceLevel: 'LEVEL 4 (OPERATIONS-SRE)',
    department: 'Autonomous Operations & SRE'
  },
  {
    id: 'usr-client',
    email: 'auditor@arcadia.dev',
    fullName: 'Arthur Pendelton',
    role: 'CLIENT',
    title: 'Lead Compliance & Audit Officer',
    clearanceLevel: 'LEVEL 3 (INSPECTION-AUDIT)',
    department: 'Regulatory Compliance & Audit'
  }
];

apiRouter.get('/auth/allowed-users', (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    personnel: ALLOWED_CORPORATE_PERSONNEL,
    systemLockdown: isSystemLockdownActive()
  });
});

apiRouter.post('/auth/login', (req: AuthenticatedRequest, res: Response) => {
  const { email, userId, accessKey, mfaToken } = req.body;
  
  // Find matching authorized personnel
  const candidate = ALLOWED_CORPORATE_PERSONNEL.find(
    p => (email && p.email.toLowerCase() === email.toLowerCase()) || (userId && p.id === userId)
  );

  if (!candidate) {
    storage.recordAudit({
      actorId: 'anonymous',
      actorRole: 'ANONYMOUS' as any,
      action: 'UNAUTHORIZED_LOGIN_ATTEMPT',
      targetEntity: 'Authentication',
      targetId: email || userId || 'unknown',
      afterState: { attemptedIdentifier: email || userId, ip: req.ip },
      correlationId: req.correlationId || 'unknown'
    });

    res.status(401).json({
      error: 'ACCESS_DENIED',
      message: 'Access denied: Identity not recognized among authorized corporate personnel for Arcadia System.'
    });
    return;
  }

  // Issue session token and bind user
  const token = createSessionToken(candidate.id);
  const user = storage.getUser(candidate.id);
  const org = user ? storage.getOrganization(user.organizationId) : undefined;
  const availableUsers = user ? storage.getUsersForOrg(user.organizationId) : [];

  storage.recordAudit({
    actorId: candidate.id,
    actorRole: candidate.role,
    action: 'USER_AUTHENTICATED',
    targetEntity: 'User',
    targetId: candidate.id,
    afterState: {
      email: candidate.email,
      clearanceLevel: candidate.clearanceLevel,
      mfaVerified: Boolean(mfaToken)
    },
    correlationId: req.correlationId || 'unknown'
  });

  res.json({
    success: true,
    token,
    user,
    personnel: candidate,
    organization: org,
    availableUsers,
    correlationId: req.correlationId
  });
});

apiRouter.post('/auth/logout', (req: AuthenticatedRequest, res: Response) => {
  if (req.sessionToken) {
    revokeSessionToken(req.sessionToken);
  }
  setActiveUserId(null);

  if (req.user) {
    storage.recordAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'USER_LOGGED_OUT',
      targetEntity: 'User',
      targetId: req.user.id,
      correlationId: req.correlationId || 'unknown'
    });
  }

  res.json({ success: true, message: 'Logged out successfully.' });
});

apiRouter.post('/auth/lockdown', (req: AuthenticatedRequest, res: Response) => {
  setSystemLockdown(true);

  storage.recordAudit({
    actorId: req.user?.id || 'security-console',
    actorRole: req.user?.role || ('SECURITY' as any),
    action: 'FULL_SYSTEM_LOCKDOWN_ENACTED',
    targetEntity: 'SystemSecurity',
    targetId: 'arcadia-lockdown',
    afterState: { lockdownActive: true, timestamp: new Date().toISOString() },
    correlationId: req.correlationId || 'unknown'
  });

  res.json({
    success: true,
    locked: true,
    message: 'Full system lockdown enacted. All active sessions invalidated.'
  });
});

apiRouter.get('/auth/session', (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id || getActiveUserId();
  const user = currentUserId ? storage.getUser(currentUserId) : null;
  const org = user ? storage.getOrganization(user.organizationId) : undefined;
  const availableUsers = user ? storage.getUsersForOrg(user.organizationId) : [];
  const personnel = user ? ALLOWED_CORPORATE_PERSONNEL.find(p => p.id === user.id) : null;

  res.json({
    authenticated: Boolean(user && !isSystemLockdownActive()),
    isLocked: isSystemLockdownActive(),
    user: isSystemLockdownActive() ? null : user,
    personnel: isSystemLockdownActive() ? null : personnel,
    organization: isSystemLockdownActive() ? null : org,
    availableUsers: isSystemLockdownActive() ? [] : availableUsers,
    correlationId: req.correlationId
  });
});

apiRouter.post('/auth/switch-role', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'MISSING_USER_ID', message: 'userId is required' });
    return;
  }

  const switched = setActiveUserId(userId);
  if (!switched) {
    res.status(404).json({ error: 'USER_NOT_FOUND', message: `User ${userId} does not exist.` });
    return;
  }

  const user = storage.getUser(userId);
  storage.recordAudit({
    actorId: userId,
    actorRole: user!.role,
    action: 'SESSION_ROLE_SWITCHED',
    targetEntity: 'User',
    targetId: userId,
    afterState: { role: user!.role },
    correlationId: req.correlationId || 'unknown'
  });

  res.json({
    success: true,
    user,
    message: `Switched active preview role to ${user?.role} (${user?.fullName})`
  });
});

// ============================================================================
// ORGANIZATIONS & PROJECTS
// ============================================================================

apiRouter.get('/organizations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json(storage.getOrganizations());
});

apiRouter.get('/projects', requireAuth, requirePermission('project.read'), (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const projects = storage.getProjects(orgId);
  res.json(projects);
});

apiRouter.get('/projects/:id', requireAuth, requirePermission('project.read'), (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const project = storage.getProject(req.params.id, orgId);
  if (!project) {
    res.status(404).json({ error: 'PROJECT_NOT_FOUND', message: 'Project not found under active organization' });
    return;
  }
  res.json(project);
});

apiRouter.post('/projects', requireAuth, requirePermission('project.create'), (req: AuthenticatedRequest, res: Response) => {
  const { name, slug, description, complexityLevel } = req.body;
  if (!name || !slug || !description) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Name, slug, and description are required.' });
    return;
  }

  const project = storage.createProject(
    {
      organizationId: req.user!.organizationId,
      name,
      slug,
      description,
      complexityLevel: complexityLevel || 'L2',
      primaryState: 'INTAKE',
      governanceState: 'CLEAR',
      securityState: 'CLEAR',
      driftState: 'ALIGNED',
      timelineState: 'ON_TRACK',
      cognitiveLoadState: 'NORMAL',
      ownerId: req.user!.id
    },
    req.user!,
    req.correlationId!
  );

  res.status(201).json(project);
});

apiRouter.patch('/projects/:id/state', requireAuth, requirePermission('project.state_transition'), (req: AuthenticatedRequest, res: Response) => {
  const { newState } = req.body as { newState: ProjectPrimaryState };
  if (!newState) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'newState is required' });
    return;
  }

  const result = storage.updateProjectState(
    req.params.id,
    req.user!.organizationId,
    newState,
    req.user!,
    req.correlationId!
  );

  if (!result.success) {
    res.status(400).json({ error: 'STATE_TRANSITION_REJECTED', message: result.error });
    return;
  }

  res.json(result.project);
});

// ============================================================================
// CONSTITUTION
// ============================================================================

apiRouter.get('/projects/:id/constitution', requireAuth, requirePermission('project.read'), (req: AuthenticatedRequest, res: Response) => {
  const constitution = storage.getCurrentConstitution(req.params.id);
  if (!constitution) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'No current Project Constitution found' });
    return;
  }
  res.json(constitution);
});

apiRouter.put('/projects/:id/constitution', requireAuth, requirePermission('constitution.update'), (req: AuthenticatedRequest, res: Response) => {
  const result = storage.updateConstitution(
    req.params.id,
    req.user!.organizationId,
    req.body,
    req.user!,
    req.correlationId!
  );

  if (!result.success) {
    res.status(400).json({ error: 'CONSTITUTION_UPDATE_FAILED', message: result.error });
    return;
  }

  res.json(result.constitution);
});

// ============================================================================
// REQUIREMENTS & PROVENANCE
// ============================================================================

apiRouter.get('/projects/:id/requirements', requireAuth, requirePermission('requirement.read'), (req: AuthenticatedRequest, res: Response) => {
  const reqs = storage.getRequirements(req.params.id);
  res.json(reqs);
});

apiRouter.post('/projects/:id/requirements', requireAuth, requirePermission('requirement.create'), (req: AuthenticatedRequest, res: Response) => {
  const { reqIdentifier, description, source, sourceReference, classification, affectedComponents } = req.body;
  if (!reqIdentifier || !description || !source) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'reqIdentifier, description, and source are required.' });
    return;
  }

  const result = storage.createRequirement(
    req.params.id,
    req.user!.organizationId,
    {
      reqIdentifier,
      description,
      source,
      sourceReference,
      classification: classification || 'REQUEST',
      status: 'PROPOSED',
      confidenceScore: 1.0,
      affectedComponents: affectedComponents || []
    },
    req.user!,
    req.correlationId!
  );

  if (!result.success) {
    res.status(400).json({ error: 'REQUIREMENT_CREATE_FAILED', message: result.error });
    return;
  }

  res.status(201).json(result.requirement);
});

apiRouter.patch('/projects/:id/requirements/:reqId/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body as { status: RequirementStatus };
  if (!status) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'status is required' });
    return;
  }

  const result = storage.updateRequirementStatus(
    req.params.id,
    req.params.reqId,
    req.user!.organizationId,
    status,
    req.user!,
    req.correlationId!
  );

  if (!result.success) {
    res.status(403).json({ error: 'REQUIREMENT_UPDATE_REJECTED', message: result.error });
    return;
  }

  res.json(result.requirement);
});

// ============================================================================
// DECISIONS & DECISION QUEUE
// ============================================================================

apiRouter.get('/projects/:id/decisions', requireAuth, requirePermission('decision.read'), (req: AuthenticatedRequest, res: Response) => {
  res.json(storage.getDecisions(req.params.id));
});

apiRouter.post('/projects/:id/decisions', requireAuth, requirePermission('decision.create'), (req: AuthenticatedRequest, res: Response) => {
  const { decisionIdentifier, title, description, context, options, selectedOption, authority, evidence } = req.body;
  if (!decisionIdentifier || !title || !selectedOption) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'decisionIdentifier, title, and selectedOption are required.' });
    return;
  }

  const result = storage.createDecision(
    req.params.id,
    req.user!.organizationId,
    {
      decisionIdentifier,
      title,
      description: description || '',
      context: context || '',
      options: options || [selectedOption],
      selectedOption,
      authority: authority || 'Technical Lead',
      evidence: evidence || '',
      status: 'PROPOSED'
    },
    req.user!,
    req.correlationId!
  );

  if (!result.success) {
    res.status(400).json({ error: 'DECISION_CREATE_FAILED', message: result.error });
    return;
  }

  res.status(201).json(result.decision);
});

apiRouter.patch('/projects/:id/decisions/:decId/approve', requireAuth, requirePermission('decision.approve'), (req: AuthenticatedRequest, res: Response) => {
  const result = storage.approveDecision(
    req.params.id,
    req.params.decId,
    req.user!.organizationId,
    req.user!,
    req.correlationId!
  );

  if (!result.success) {
    res.status(403).json({ error: 'DECISION_APPROVAL_FAILED', message: result.error });
    return;
  }

  res.json(result.decision);
});

apiRouter.get('/projects/:id/decision-queue', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json(storage.getDecisionQueueItems(req.params.id));
});

apiRouter.post('/projects/:id/decision-queue/:itemId/resolve', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { action, notes } = req.body;
  if (!action || !['APPROVED', 'REJECTED', 'DEFERRED'].includes(action)) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Valid action (APPROVED, REJECTED, DEFERRED) is required.' });
    return;
  }

  const result = storage.resolveDecisionQueueItem(
    req.params.id,
    req.params.itemId,
    req.user!.organizationId,
    action,
    req.user!,
    notes || '',
    req.correlationId!
  );

  if (!result.success) {
    res.status(400).json({ error: 'RESOLUTION_FAILED', message: result.error });
    return;
  }

  res.json(result.item);
});

// ============================================================================
// TASKS & SCOPE LOCK
// ============================================================================

apiRouter.get('/projects/:id/tasks', requireAuth, requirePermission('task.read'), (req: AuthenticatedRequest, res: Response) => {
  res.json(storage.getTasks(req.params.id));
});

apiRouter.post('/projects/:id/tasks', requireAuth, requirePermission('task.create'), (req: AuthenticatedRequest, res: Response) => {
  const { taskIdentifier, title, objective, complexity, requirementsSatisfied, dependencies, allowedActions, prohibitedActions, architectureSlice, relevantFiles, acceptanceCriteria, validationRequirements, stopConditions, escalationConditions } = req.body;

  if (!taskIdentifier || !title || !objective) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'taskIdentifier, title, and objective are required.' });
    return;
  }

  const result = storage.createTask(
    req.params.id,
    req.user!.organizationId,
    {
      taskIdentifier,
      title,
      objective,
      complexity: complexity || 'MEDIUM',
      state: 'READY',
      requirementsSatisfied: requirementsSatisfied || [],
      dependencies: dependencies || [],
      allowedActions: allowedActions || ['FILE_EDIT', 'RUN_TEST'],
      prohibitedActions: prohibitedActions || ['DISABLE_SECURITY'],
      architectureSlice: architectureSlice || { relevantModules: [], contractsToPreserve: [] },
      relevantFiles: relevantFiles || [],
      acceptanceCriteria: acceptanceCriteria || [],
      validationRequirements: validationRequirements || { mandatoryTests: [], staticChecks: [], maxExecutionTimeMs: 10000 },
      stopConditions: stopConditions || [],
      escalationConditions: escalationConditions || []
    },
    req.user!,
    req.correlationId!
  );

  if (!result.success) {
    res.status(400).json({ error: 'TASK_CREATE_FAILED', message: result.error });
    return;
  }

  res.status(201).json(result.task);
});

apiRouter.patch('/projects/:id/tasks/:taskId/state', requireAuth, requirePermission('task.state_transition'), (req: AuthenticatedRequest, res: Response) => {
  const { newState } = req.body as { newState: TaskState };
  if (!newState) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'newState is required.' });
    return;
  }

  const result = storage.updateTaskState(
    req.params.id,
    req.params.taskId,
    req.user!.organizationId,
    newState,
    req.user!,
    req.correlationId!
  );

  if (!result.success) {
    res.status(400).json({ error: 'TASK_TRANSITION_FAILED', message: result.error });
    return;
  }

  res.json(result.task);
});

apiRouter.post('/projects/:id/tasks/:taskId/verify-scope', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { filesModified, actionRequested } = req.body;
  if (!filesModified || !Array.isArray(filesModified)) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'filesModified array is required.' });
    return;
  }

  const verification = storage.verifyTaskScope(
    req.params.taskId,
    req.params.id,
    filesModified,
    actionRequested || 'FILE_EDIT'
  );

  res.json(verification);
});

// ============================================================================
// AUDIT LOGS (Immutable History)
// ============================================================================

apiRouter.get('/projects/:id/audit-logs', requireAuth, requirePermission('audit.read'), (req: AuthenticatedRequest, res: Response) => {
  res.json(storage.getAuditLogs(req.params.id));
});

apiRouter.get('/audit-logs', requireAuth, requirePermission('audit.read'), (req: AuthenticatedRequest, res: Response) => {
  res.json(storage.getAuditLogs());
});

// ============================================================================
// PHASE 5: EXECUTION LAYER & AGENT ORCHESTRATION
// ============================================================================

// Agent Registry
apiRouter.get('/agents', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json(agentRegistry.listAgents());
});

// Project Execution History & Metrics
apiRouter.get('/projects/:id/executions', requireAuth, requirePermission('execution.read'), (req: AuthenticatedRequest, res: Response) => {
  const records = executionEngine.getExecutionsForProject(req.params.id);
  res.json(records);
});

apiRouter.get('/projects/:id/executions/metrics', requireAuth, requirePermission('execution.read'), (req: AuthenticatedRequest, res: Response) => {
  const metrics = executionEngine.getMetricsSummary(req.params.id);
  res.json(metrics);
});

apiRouter.get('/projects/:id/executions/:executionId', requireAuth, requirePermission('execution.read'), (req: AuthenticatedRequest, res: Response) => {
  const record = executionEngine.getExecution(req.params.executionId);
  if (!record || record.projectId !== req.params.id) {
    res.status(404).json({ error: 'EXECUTION_NOT_FOUND', message: 'Execution record not found' });
    return;
  }
  res.json(record);
});

// Task Readiness Gate Check (Supports GET and POST)
const handleTaskReadiness = (req: AuthenticatedRequest, res: Response) => {
  const project = storage.getProject(req.params.id, req.user!.organizationId);
  if (!project) {
    res.status(404).json({ error: 'PROJECT_NOT_FOUND', message: 'Project not found' });
    return;
  }
  const task = storage.getTask(req.params.taskId, req.params.id);
  if (!task) {
    res.status(404).json({ error: 'TASK_NOT_FOUND', message: 'Task not found' });
    return;
  }

  const allTasks = storage.getTasks(req.params.id);
  const requirements = storage.getRequirements(req.params.id);
  const result = taskReadinessGate.evaluateTaskReadiness(task, project, allTasks, requirements);
  res.json(result);
};
apiRouter.get('/projects/:id/tasks/:taskId/readiness', requireAuth, handleTaskReadiness);
apiRouter.post('/projects/:id/tasks/:taskId/readiness', requireAuth, handleTaskReadiness);

// Context Orchestration Preview (Supports GET and POST on both /context and /assemble-context)
const handleTaskContext = (req: AuthenticatedRequest, res: Response) => {
  const project = storage.getProject(req.params.id, req.user!.organizationId);
  if (!project) {
    res.status(404).json({ error: 'PROJECT_NOT_FOUND', message: 'Project not found' });
    return;
  }
  const task = storage.getTask(req.params.taskId, req.params.id);
  if (!task) {
    res.status(404).json({ error: 'TASK_NOT_FOUND', message: 'Task not found' });
    return;
  }

  const constitution = storage.getConstitution(req.params.id);
  const requirements = storage.getRequirements(req.params.id);
  const decisions = storage.getDecisions(req.params.id);
  const allTasks = storage.getTasks(req.params.id);

  const contextPackage = contextOrchestrator.assembleContextPackage(
    task,
    project,
    constitution,
    requirements,
    decisions,
    allTasks
  );

  res.json(contextPackage);
};
apiRouter.get('/projects/:id/tasks/:taskId/context', requireAuth, handleTaskContext);
apiRouter.post('/projects/:id/tasks/:taskId/context', requireAuth, handleTaskContext);
apiRouter.get('/projects/:id/tasks/:taskId/assemble-context', requireAuth, handleTaskContext);
apiRouter.post('/projects/:id/tasks/:taskId/assemble-context', requireAuth, handleTaskContext);

// Prompt Compiler Preview
apiRouter.post('/projects/:id/tasks/:taskId/compile-prompt', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const targetAgentId = req.body?.targetAgentId || req.body?.agentId;
  const project = storage.getProject(req.params.id, req.user!.organizationId);
  if (!project) {
    res.status(404).json({ error: 'PROJECT_NOT_FOUND', message: 'Project not found' });
    return;
  }
  const task = storage.getTask(req.params.taskId, req.params.id);
  if (!task) {
    res.status(404).json({ error: 'TASK_NOT_FOUND', message: 'Task not found' });
    return;
  }

  const constitution = storage.getConstitution(req.params.id);
  const requirements = storage.getRequirements(req.params.id);
  const decisions = storage.getDecisions(req.params.id);
  const allTasks = storage.getTasks(req.params.id);

  const contextPackage = contextOrchestrator.assembleContextPackage(
    task,
    project,
    constitution,
    requirements,
    decisions,
    allTasks
  );

  const agent = targetAgentId 
    ? agentRegistry.getAgent(targetAgentId) || agentRegistry.selectBestAgentForTask(task, 'INTERNAL')
    : agentRegistry.selectBestAgentForTask(task, 'INTERNAL');

  const policy = adaptivePipeline.getExecutionPolicy(project, task);
  const promptVersion = promptCompiler.compilePrompt(task, contextPackage, agent, policy);

  res.json({
    ...promptVersion,
    promptVersion,
    agent,
    contextPackage
  });
});

// Controlled Task Execution
apiRouter.post('/projects/:id/tasks/:taskId/execute', requireAuth, requirePermission('execution.start'), async (req: AuthenticatedRequest, res: Response) => {
  const targetAgentId = req.body?.targetAgentId || req.body?.agentId;
  const simulateScopeViolation = Boolean(req.body?.simulateScopeViolation);
  const result = await executionEngine.executeTask(
    req.params.taskId,
    req.params.id,
    req.user!.organizationId,
    req.user!,
    req.correlationId!,
    targetAgentId,
    simulateScopeViolation
  );

  if (!result.success) {
    res.status(400).json(result);
    return;
  }

  res.json(result);
});

// Promote Evidence to Authoritative State
apiRouter.post('/projects/:id/executions/:executionId/promote', requireAuth, requirePermission('execution.validate'), (req: AuthenticatedRequest, res: Response) => {
  const { reviewNotes } = req.body;
  const result = executionEngine.promoteEvidenceToAuthoritativeState(
    req.params.executionId,
    req.params.id,
    req.user!.organizationId,
    req.user!,
    req.correlationId!,
    reviewNotes
  );

  if (!result.success) {
    res.status(400).json(result);
    return;
  }

  res.json(result);
});

// ============================================================================
// PHASE 6: AGENT INTELLIGENCE & MULTI-AGENT COLLABORATION API
// ============================================================================

// List Agents with Phase 6 Behavior Dimensions, Failure Signatures, and History
apiRouter.get('/agents', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const agents = agentRegistry.listAgents();
  res.json(agents);
});

// Get Specific Agent Detail
apiRouter.get('/agents/:agentId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const agent = agentRegistry.getAgent(req.params.agentId);
  if (!agent) {
    res.status(404).json({ error: 'AGENT_NOT_FOUND', message: 'Agent not found' });
    return;
  }
  const failureSignatures = agentRegistry.getFailureSignatures(agent.agentId);
  res.json({
    ...agent,
    failureSignatures
  });
});

// Evaluate Agent-Task Compatibility
apiRouter.post('/agents/:agentId/compatibility', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { taskId, projectId } = req.body;
  if (!taskId || !projectId) {
    res.status(400).json({ error: 'MISSING_PARAMS', message: 'taskId and projectId are required.' });
    return;
  }
  const project = storage.getProject(projectId, req.user!.organizationId);
  if (!project) {
    res.status(404).json({ error: 'PROJECT_NOT_FOUND', message: 'Project not found.' });
    return;
  }
  const task = storage.getTask(taskId, projectId);
  if (!task) {
    res.status(404).json({ error: 'TASK_NOT_FOUND', message: 'Task not found.' });
    return;
  }

  const constitution = storage.getCurrentConstitution(project.id);
  const secClass = constitution?.securityClassification || project.securityClassification || 'REGULATED';

  const compatibility = agentRegistry.evaluateTaskAgentCompatibility(
    req.params.agentId,
    task,
    secClass
  );
  res.json(compatibility);
});

// List Failure Signatures across Registry
apiRouter.get('/agents-meta/failure-signatures', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const agentId = req.query.agentId as string | undefined;
  const signatures = agentRegistry.getFailureSignatures(agentId);
  res.json(signatures);
});

// Recommend Multi-Agent Collaboration Strategy for Task
apiRouter.post('/projects/:id/tasks/:taskId/collaborations/recommend-strategy', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const project = storage.getProject(req.params.id, req.user!.organizationId);
  if (!project) {
    res.status(404).json({ error: 'PROJECT_NOT_FOUND', message: 'Project not found' });
    return;
  }
  const task = storage.getTask(req.params.taskId, req.params.id);
  if (!task) {
    res.status(404).json({ error: 'TASK_NOT_FOUND', message: 'Task not found' });
    return;
  }

  const constitution = storage.getCurrentConstitution(project.id);
  const secClass = constitution?.securityClassification || project.securityClassification || 'REGULATED';

  const recommendation = agentRegistry.recommendCollaborationStrategy(task, secClass);
  res.json(recommendation);
});

// Create Collaboration Contract
apiRouter.post('/projects/:id/tasks/:taskId/collaborations', requireAuth, requirePermission('execution.start'), (req: AuthenticatedRequest, res: Response) => {
  const project = storage.getProject(req.params.id, req.user!.organizationId);
  if (!project) {
    res.status(404).json({ error: 'PROJECT_NOT_FOUND', message: 'Project not found' });
    return;
  }
  const task = storage.getTask(req.params.taskId, req.params.id);
  if (!task) {
    res.status(404).json({ error: 'TASK_NOT_FOUND', message: 'Task not found' });
    return;
  }

  try {
    const strategy = req.body?.strategy || 'EXECUTOR_CRITIC';
    const participants = req.body?.participants;
    const contract = collaborationEngine.createCollaborationContract(
      task,
      project,
      strategy,
      req.user!,
      participants
    );
    res.json(contract);
  } catch (err: any) {
    res.status(400).json({ error: 'CONTRACT_CREATION_FAILED', message: err.message });
  }
});

// List Collaborations for a Project
apiRouter.get('/projects/:id/collaborations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const list = collaborationEngine.listCollaborations(req.params.id);
  res.json(list);
});

// Get Specific Collaboration Result
apiRouter.get('/collaborations/:collaborationId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const result = collaborationEngine.getCollaborationResult(req.params.collaborationId);
  const contract = collaborationEngine.getCollaborationContract(req.params.collaborationId);
  if (!result && !contract) {
    res.status(404).json({ error: 'COLLABORATION_NOT_FOUND', message: 'Collaboration not found' });
    return;
  }
  res.json({ contract, result });
});

// Run Collaboration Workflow
apiRouter.post('/collaborations/:collaborationId/run', requireAuth, requirePermission('execution.start'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { simulateScopeBreach, simulateAgentDisagreement, simulateReviewerRejection } = req.body || {};
    const result = await collaborationEngine.runCollaboration(
      req.params.collaborationId,
      req.user!,
      req.correlationId!,
      {
        simulateScopeBreach: Boolean(simulateScopeBreach),
        simulateAgentDisagreement: Boolean(simulateAgentDisagreement),
        simulateReviewerRejection: Boolean(simulateReviewerRejection)
      }
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: 'COLLABORATION_EXECUTION_FAILED', message: err.message });
  }
});

// Human Lead Override on Collaboration
apiRouter.post('/collaborations/:collaborationId/override', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { overrideType, reason } = req.body;
  if (!overrideType || !reason) {
    res.status(400).json({ error: 'MISSING_PARAMS', message: 'overrideType and reason are required.' });
    return;
  }

  try {
    const result = collaborationEngine.applyHumanOverride(
      req.params.collaborationId,
      overrideType,
      reason,
      req.user!
    );
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: 'OVERRIDE_FAILED', message: err.message });
  }
});

// Promote Collaboration Evidence to Authoritative State
apiRouter.post('/collaborations/:collaborationId/promote', requireAuth, requirePermission('execution.validate'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const outcome = collaborationEngine.promoteCollaborationEvidence(
      req.params.collaborationId,
      req.user!,
      req.correlationId!
    );
    res.json(outcome);
  } catch (err: any) {
    res.status(400).json({ error: 'PROMOTION_FAILED', message: err.message });
  }
});

// ============================================================================
// PHASE 7: VALIDATION, SECURITY & DRIFT INTELLIGENCE ENDPOINTS
// ============================================================================

// 1. Validation Contracts & Gates
apiRouter.get('/projects/:id/validation/contracts', requireAuth, requirePermission('validation.read'), (req: AuthenticatedRequest, res: Response) => {
  const contracts = storage.getValidationContracts(req.params.id);
  res.json(contracts);
});

apiRouter.get('/validation/contracts/:id', requireAuth, requirePermission('validation.read'), (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.query.projectId as string;
  const contract = storage.getValidationContract(req.params.id, projectId);
  if (!contract) {
    res.status(404).json({ error: 'CONTRACT_NOT_FOUND', message: 'Validation contract not found' });
    return;
  }
  res.json(contract);
});

apiRouter.get('/projects/:id/validation/rules', requireAuth, requirePermission('validation.read'), (req: AuthenticatedRequest, res: Response) => {
  const rules = storage.getValidationRules(req.params.id);
  res.json(rules);
});

apiRouter.get('/projects/:id/validation/gates', requireAuth, requirePermission('validation.read'), (req: AuthenticatedRequest, res: Response) => {
  const gates = storage.getValidationGates(req.params.id);
  res.json(gates);
});

apiRouter.post('/projects/:id/validation/run', requireAuth, requirePermission('validation.run'), (req: AuthenticatedRequest, res: Response) => {
  const { taskId, contractId, evidence } = req.body;
  const project = storage.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'PROJECT_NOT_FOUND', message: 'Project not found' });
    return;
  }

  const tasks = storage.getTasks(req.params.id);
  const task = tasks.find(t => t.taskId === taskId);
  if (!task) {
    res.status(404).json({ error: 'TASK_NOT_FOUND', message: `Task ${taskId} not found` });
    return;
  }

  try {
    const validatedContract = validationEngine.runValidationPipeline(
      project,
      task,
      contractId,
      evidence,
      req.user!.id,
      req.user!.role
    );
    res.json(validatedContract);
  } catch (err: any) {
    res.status(400).json({ error: 'VALIDATION_FAILED', message: err.message });
  }
});

apiRouter.post('/validation/contracts/:id/waive', requireAuth, requirePermission('validation.waive'), (req: AuthenticatedRequest, res: Response) => {
  const { projectId, failureId, reason, expirationDate } = req.body;
  if (!failureId || !reason) {
    res.status(400).json({ error: 'MISSING_PARAMS', message: 'failureId and reason are required for waiver.' });
    return;
  }

  try {
    const updatedContract = storage.waiveValidation(
      req.params.id,
      projectId,
      failureId,
      req.user!,
      reason,
      expirationDate
    );
    res.json(updatedContract);
  } catch (err: any) {
    res.status(403).json({ error: 'WAIVER_REJECTED', message: err.message });
  }
});

apiRouter.post('/projects/:id/validation/promote', requireAuth, requirePermission('validation.run'), (req: AuthenticatedRequest, res: Response) => {
  const { taskId } = req.body;
  if (!taskId) {
    res.status(400).json({ error: 'MISSING_TASK_ID', message: 'taskId is required for promotion.' });
    return;
  }

  try {
    const outcome = validationEngine.promoteTaskState(
      req.params.id,
      taskId,
      req.user!.id,
      req.user!.role
    );
    res.json(outcome);
  } catch (err: any) {
    res.status(400).json({ error: 'PROMOTION_FAILED', message: err.message });
  }
});

// 2. Security Findings & Threat Intelligence
apiRouter.get('/projects/:id/security/findings', requireAuth, requirePermission('security.read'), (req: AuthenticatedRequest, res: Response) => {
  const findings = storage.getSecurityFindings(req.params.id);
  res.json(findings);
});

apiRouter.post('/projects/:id/security/scan', requireAuth, requirePermission('security.scan'), (req: AuthenticatedRequest, res: Response) => {
  const { taskId, evidence } = req.body;
  const project = storage.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'PROJECT_NOT_FOUND', message: 'Project not found' });
    return;
  }

  const tasks = storage.getTasks(req.params.id);
  const task = tasks.find(t => t.taskId === taskId) || tasks[0];
  if (!task) {
    res.status(404).json({ error: 'NO_TASK', message: 'No task available to scan' });
    return;
  }

  const result = securityEngine.scanExecution(
    project,
    task,
    evidence,
    project.securityState === 'RESTRICTED' ? 'REGULATED' : 'STANDARD'
  );
  res.json(result);
});

apiRouter.patch('/security/findings/:findingId', requireAuth, requirePermission('security.resolve'), (req: AuthenticatedRequest, res: Response) => {
  const { projectId, status, resolutionNotes } = req.body;
  if (!projectId || !status) {
    res.status(400).json({ error: 'MISSING_PARAMS', message: 'projectId and status are required.' });
    return;
  }

  try {
    const updated = storage.updateSecurityFindingStatus(
      req.params.findingId,
      projectId,
      status,
      req.user!,
      resolutionNotes
    );
    res.json(updated);
  } catch (err: any) {
    res.status(403).json({ error: 'STATUS_UPDATE_DENIED', message: err.message });
  }
});

apiRouter.get('/projects/:id/security/threat-models', requireAuth, requirePermission('security.read'), (req: AuthenticatedRequest, res: Response) => {
  const models = storage.getThreatModels(req.params.id);
  res.json(models);
});

apiRouter.get('/projects/:id/security/trust-boundaries', requireAuth, requirePermission('security.read'), (req: AuthenticatedRequest, res: Response) => {
  const boundaries = storage.getTrustBoundaries();
  res.json(boundaries);
});

apiRouter.get('/projects/:id/security/data-flows', requireAuth, requirePermission('security.read'), (req: AuthenticatedRequest, res: Response) => {
  const flows = storage.getDataFlows(req.params.id);
  res.json(flows);
});

apiRouter.get('/projects/:id/security/compliance-controls', requireAuth, requirePermission('security.read'), (req: AuthenticatedRequest, res: Response) => {
  const controls = storage.getComplianceControls(req.params.id);
  res.json(controls);
});

// 3. Drift Detection & Intelligence
apiRouter.get('/projects/:id/drift/records', requireAuth, requirePermission('drift.read'), (req: AuthenticatedRequest, res: Response) => {
  const records = storage.getDriftRecords(req.params.id);
  res.json(records);
});

apiRouter.post('/projects/:id/drift/detect', requireAuth, requirePermission('drift.detect'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const outcome = driftEngine.runDriftDetection(
      req.params.id,
      req.user!.id,
      req.user!.role
    );
    res.json(outcome);
  } catch (err: any) {
    res.status(400).json({ error: 'DRIFT_DETECTION_FAILED', message: err.message });
  }
});

apiRouter.post('/drift/records/:driftId/classify', requireAuth, requirePermission('drift.reconcile'), (req: AuthenticatedRequest, res: Response) => {
  const { projectId, classification, recommendedAction } = req.body;
  if (!projectId || !classification || !recommendedAction) {
    res.status(400).json({ error: 'MISSING_PARAMS', message: 'projectId, classification, and recommendedAction are required.' });
    return;
  }

  try {
    const classified = driftEngine.classifyDrift(
      req.params.driftId,
      projectId,
      classification,
      recommendedAction,
      req.user!.id,
      req.user!.role
    );
    res.json(classified);
  } catch (err: any) {
    res.status(403).json({ error: 'CLASSIFY_FAILED', message: err.message });
  }
});

apiRouter.post('/drift/records/:driftId/resolve', requireAuth, requirePermission('drift.reconcile'), (req: AuthenticatedRequest, res: Response) => {
  const { projectId, resolutionAction, resolutionNotes } = req.body;
  if (!projectId || !resolutionAction) {
    res.status(400).json({ error: 'MISSING_PARAMS', message: 'projectId and resolutionAction are required.' });
    return;
  }

  try {
    const resolved = driftEngine.resolveDrift(
      req.params.driftId,
      projectId,
      resolutionAction,
      resolutionNotes || 'Resolved through Phase 7 Governance console.',
      req.user!.id,
      req.user!.role
    );
    res.json(resolved);
  } catch (err: any) {
    res.status(403).json({ error: 'RESOLVE_FAILED', message: err.message });
  }
});

// 4. Regression Runs & Impact Analysis
apiRouter.get('/projects/:id/regression/runs', requireAuth, requirePermission('validation.read'), (req: AuthenticatedRequest, res: Response) => {
  const runs = storage.getRegressionRuns(req.params.id);
  res.json(runs);
});

apiRouter.post('/projects/:id/regression/impact', requireAuth, requirePermission('validation.read'), (req: AuthenticatedRequest, res: Response) => {
  const { changedFiles } = req.body;
  const analysis = regressionEngine.analyzeImpact(changedFiles || []);
  res.json(analysis);
});

// ============================================================================
// PHASE 8: OPTIMIZATION INTELLIGENCE ROUTES
// ============================================================================

// 1. Overview & Health
apiRouter.get('/projects/:id/optimization/overview', requireAuth, requirePermission('optimization.read'), (req: AuthenticatedRequest, res: Response) => {
  const metrics = storage.getOptimizationOverviewMetrics(req.params.id);
  res.json(metrics);
});

// 2. Recommendations
apiRouter.get('/projects/:id/optimization/recommendations', requireAuth, requirePermission('optimization.read'), (req: AuthenticatedRequest, res: Response) => {
  const recs = optimizationEngine.generateRecommendations(req.params.id);
  res.json(recs);
});

apiRouter.post('/projects/:id/optimization/recommendations', requireAuth, requirePermission('optimization.recommend'), (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.params.id;
  const project = storage.getProject(projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const rec = storage.createOptimizationRecommendation(
    {
      ...req.body,
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      organizationId: project.organizationId,
      createdAt: new Date().toISOString(),
      status: req.body.status || 'PROPOSED'
    },
    req.user!.id,
    req.user!.role
  );
  res.status(201).json(rec);
});

apiRouter.patch('/projects/:id/optimization/recommendations/:recId/status', requireAuth, requirePermission('optimization.approve'), (req: AuthenticatedRequest, res: Response) => {
  const { status, note } = req.body;
  const result = storage.updateOptimizationRecommendationStatus(
    req.params.recId,
    req.params.id,
    status,
    req.user!.id,
    req.user!.role,
    note
  );
  if (!result.success) {
    return res.status(403).json({ error: 'UPDATE_FAILED', message: result.error });
  }
  res.json(result.recommendation);
});

apiRouter.post('/projects/:id/optimization/recommendations/:recId/apply', requireAuth, requirePermission('optimization.apply'), (req: AuthenticatedRequest, res: Response) => {
  const result = optimizationEngine.applyIntervention(
    req.params.recId,
    req.params.id,
    req.user!.id,
    req.user!.role
  );
  if (!result.success) {
    return res.status(403).json({ error: 'APPLY_FAILED', message: result.error });
  }
  res.json(result);
});

apiRouter.post('/projects/:id/optimization/actions/:actId/rollback', requireAuth, requirePermission('optimization.apply'), (req: AuthenticatedRequest, res: Response) => {
  const result = optimizationEngine.rollbackIntervention(
    req.params.actId,
    req.params.id,
    req.user!.id,
    req.user!.role
  );
  if (!result.success) {
    return res.status(403).json({ error: 'ROLLBACK_FAILED', message: result.error });
  }
  res.json(result);
});

// 3. Cost Engine
apiRouter.get('/projects/:id/optimization/cost', requireAuth, requirePermission('cost.read'), (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.params.id;
  const actuals = costEngine.getActualCosts(projectId);
  const estimates = storage.getCostEstimates(projectId);
  const anomalies = costEngine.detectAnomalies(projectId);
  const allocations = costEngine.getAllocations(projectId);
  const project = storage.getProject(projectId);
  const model = storage.getCostModel(project?.organizationId || 'org-arcadia-demo');

  res.json({
    actuals,
    estimates,
    anomalies,
    allocations,
    model
  });
});

apiRouter.post('/projects/:id/optimization/cost/estimate', requireAuth, requirePermission('cost.read'), (req: AuthenticatedRequest, res: Response) => {
  const { taskId } = req.body;
  const estimate = costEngine.estimateTaskCost(req.params.id, taskId);
  res.json(estimate);
});

// 4. Temporal Engine
apiRouter.get('/projects/:id/optimization/temporal', requireAuth, requirePermission('optimization.read'), (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.params.id;
  const durations = temporalEngine.getDurationBreakdown(projectId);
  const criticalPath = temporalEngine.calculateCriticalPath(projectId);
  const prediction = temporalEngine.predictTimeline(projectId);

  res.json({
    durations,
    criticalPath,
    prediction
  });
});

apiRouter.post('/projects/:id/optimization/temporal/delay-analysis', requireAuth, requirePermission('optimization.read'), (req: AuthenticatedRequest, res: Response) => {
  const { taskId, delaySeconds } = req.body;
  const analysis = temporalEngine.analyzeDelayPropagation(req.params.id, taskId, delaySeconds || 3600);
  res.json(analysis);
});

// 5. Cognitive Load & Workflow Engine
apiRouter.get('/projects/:id/optimization/workflow-load', requireAuth, requirePermission('optimization.read'), (req: AuthenticatedRequest, res: Response) => {
  const load = cognitiveLoadEngine.measureWorkflowLoad(req.params.id);
  res.json(load);
});

// 6. Trust Calibration Engine
apiRouter.get('/projects/:id/optimization/trust', requireAuth, requirePermission('optimization.read'), (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.params.id;
  const trustEvents = storage.getTrustEvents(projectId);
  const profiles = REGISTERED_AGENTS.map(a => trustEngine.getContextualProfile(projectId, a.agentId, 'STANDARD_EXECUTION'));

  res.json({
    trustEvents,
    profiles
  });
});

apiRouter.post('/projects/:id/optimization/trust/verify', requireAuth, requirePermission('optimization.read'), (req: AuthenticatedRequest, res: Response) => {
  const { agentId, selfReportedPass, contractId } = req.body;
  const result = trustEngine.verifySelfReportedMetric(req.params.id, agentId, selfReportedPass, contractId);
  res.json(result);
});

// 7. Policies & Experiments
apiRouter.get('/projects/:id/optimization/policies', requireAuth, requirePermission('optimization.read'), (req: AuthenticatedRequest, res: Response) => {
  const project = storage.getProject(req.params.id);
  const policies = storage.getOptimizationPolicies(project?.organizationId || 'org-arcadia-demo', req.params.id);
  res.json(policies);
});

apiRouter.post('/projects/:id/optimization/policies', requireAuth, requirePermission('optimization.policy'), (req: AuthenticatedRequest, res: Response) => {
  const project = storage.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const policy = storage.saveOptimizationPolicy(
    {
      ...req.body,
      organizationId: project.organizationId,
      projectId: req.params.id
    },
    req.user!.id,
    req.user!.role
  );
  res.json(policy);
});

apiRouter.get('/projects/:id/optimization/experiments', requireAuth, requirePermission('optimization.read'), (req: AuthenticatedRequest, res: Response) => {
  const experiments = storage.getOptimizationExperiments(req.params.id);
  res.json(experiments);
});

apiRouter.post('/projects/:id/optimization/experiments', requireAuth, requirePermission('optimization.recommend'), (req: AuthenticatedRequest, res: Response) => {
  const exp = storage.createOptimizationExperiment({
    ...req.body,
    id: `exp-${Date.now()}`,
    projectId: req.params.id,
    status: req.body.status || 'RUNNING'
  });
  res.status(201).json(exp);
});

// 8. Telemetry
apiRouter.get('/projects/:id/optimization/telemetry', requireAuth, requirePermission('telemetry.read'), (req: AuthenticatedRequest, res: Response) => {
  const project = storage.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  try {
    const events = telemetryEngine.query(project.organizationId, req.params.id, req.query.eventType as any);
    const aggregates = telemetryEngine.getAggregates(project.organizationId, req.params.id);
    res.json({ events, aggregates });
  } catch (err: any) {
    res.status(403).json({ error: 'ACCESS_DENIED', message: err.message });
  }
});

apiRouter.post('/projects/:id/optimization/telemetry', requireAuth, requirePermission('telemetry.read'), (req: AuthenticatedRequest, res: Response) => {
  const project = storage.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  try {
    const event = telemetryEngine.ingest({
      ...req.body,
      projectId: req.params.id,
      organizationId: project.organizationId
    });
    res.status(201).json(event);
  } catch (err: any) {
    res.status(400).json({ error: 'INGEST_FAILED', message: err.message });
  }
});

// ============================================================================
// PHASE 9: CONTINUOUS LEARNING, ORGANIZATIONAL MEMORY & SYSTEM EVOLUTION
// ============================================================================

apiRouter.get('/projects/:id/learning/overview', requireAuth, requirePermission('learning.read'), (req: AuthenticatedRequest, res: Response) => {
  const project = storage.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'NOT_FOUND', message: 'Project not found' });
  const overview = learningEngine.getOverview(req.params.id);
  res.json(overview);
});

apiRouter.get('/projects/:id/learning/memories', requireAuth, requirePermission('learning.read'), (req: AuthenticatedRequest, res: Response) => {
  const project = storage.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'NOT_FOUND', message: 'Project not found' });
  const memories = storage.getMemories(req.params.id, project.organizationId);
  res.json(memories);
});

apiRouter.post('/projects/:id/learning/memories', requireAuth, requirePermission('learning.write'), (req: AuthenticatedRequest, res: Response) => {
  const project = storage.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'NOT_FOUND', message: 'Project not found' });
  const user = req.user!;

  const memory = learningEngine.memory.proposeMemory({
    projectId: req.params.id,
    organizationId: project.organizationId,
    title: req.body.title,
    type: req.body.type || 'LESSON_LEARNED',
    category: req.body.category || 'GENERAL',
    summary: req.body.summary,
    detailedContent: req.body.detailedContent || req.body.summary,
    authorId: user.id,
    authorRole: user.role,
    applicableContexts: req.body.applicableContexts,
    relatedTaskIds: req.body.relatedTaskIds,
    relatedRequirementIds: req.body.relatedRequirementIds,
    relatedConstitutionalArticles: req.body.relatedConstitutionalArticles,
    sourceTaskId: req.body.sourceTaskId,
    sourceDecisionId: req.body.sourceDecisionId,
    verifiedDirectly: req.body.verifiedDirectly
  });

  res.status(201).json(memory);
});

apiRouter.post('/projects/:id/learning/memories/:memId/verify', requireAuth, requirePermission('learning.verify'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const result = learningEngine.memory.verifyMemory(
    req.params.memId,
    user.id,
    user.role,
    req.body.method || 'MANUAL_HUMAN'
  );
  if (!result.success) {
    return res.status(403).json({ error: 'VERIFICATION_REJECTED', message: result.error });
  }
  res.json(result.memory);
});

apiRouter.get('/projects/:id/learning/patterns', requireAuth, requirePermission('learning.read'), (req: AuthenticatedRequest, res: Response) => {
  const project = storage.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'NOT_FOUND', message: 'Project not found' });
  const patterns = learningEngine.patterns.detectPatterns(req.params.id);
  res.json(patterns);
});

apiRouter.post('/projects/:id/learning/patterns/:patId/resolve', requireAuth, requirePermission('learning.write'), (req: AuthenticatedRequest, res: Response) => {
  const resolved = learningEngine.patterns.resolvePattern(req.params.patId);
  if (!resolved) return res.status(404).json({ error: 'NOT_FOUND', message: 'Pattern not found' });
  res.json({ success: true, resolvedId: req.params.patId });
});

apiRouter.get('/projects/:id/learning/metrics', requireAuth, requirePermission('learning.read'), (req: AuthenticatedRequest, res: Response) => {
  const project = storage.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'NOT_FOUND', message: 'Project not found' });
  let snapshots = storage.getLearningMetricSnapshots(req.params.id);
  if (snapshots.length === 0) {
    snapshots = learningEngine.metrics.computeSnapshots(req.params.id);
  }
  res.json(snapshots);
});

apiRouter.post('/projects/:id/learning/metrics/snapshot', requireAuth, requirePermission('learning.write'), (req: AuthenticatedRequest, res: Response) => {
  const project = storage.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'NOT_FOUND', message: 'Project not found' });
  const snapshots = learningEngine.metrics.computeSnapshots(req.params.id);
  res.json(snapshots);
});

apiRouter.get('/projects/:id/learning/evolution/proposals', requireAuth, requirePermission('learning.read'), (req: AuthenticatedRequest, res: Response) => {
  const project = storage.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'NOT_FOUND', message: 'Project not found' });
  let proposals = storage.getEvolutionProposals(req.params.id);
  if (proposals.length === 0) {
    proposals = learningEngine.evolution.synthesizeProposals(req.params.id);
  }
  res.json(proposals);
});

apiRouter.post('/projects/:id/learning/evolution/proposals', requireAuth, requirePermission('learning.evolve'), (req: AuthenticatedRequest, res: Response) => {
  const project = storage.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'NOT_FOUND', message: 'Project not found' });
  const proposals = learningEngine.evolution.synthesizeProposals(req.params.id);
  res.json(proposals);
});

apiRouter.post('/projects/:id/learning/evolution/proposals/:propId/apply', requireAuth, requirePermission('learning.evolve'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const result = learningEngine.evolution.applyProposal(req.params.propId, user.id, user.role);
  if (!result.success) {
    return res.status(403).json({ error: 'APPLY_REJECTED', message: result.error });
  }
  res.json(result.proposal);
});

apiRouter.post('/projects/:id/learning/evolution/proposals/:propId/rollback', requireAuth, requirePermission('learning.evolve'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const result = learningEngine.evolution.rollbackProposal(req.params.propId, user.id, user.role);
  if (!result.success) {
    return res.status(403).json({ error: 'ROLLBACK_REJECTED', message: result.error });
  }
  res.json(result.proposal);
});

// ============================================================================
// PHASE 10: ADVANCED GOVERNANCE, RESILIENCE & PRODUCTION HARDENING
// ============================================================================

apiRouter.get('/projects/:id/resilience/overview', requireAuth, requirePermission('resilience.read'), (req: AuthenticatedRequest, res: Response) => {
  const metrics = storage.getResilienceOverviewMetrics(req.params.id);
  res.json(metrics);
});

apiRouter.get('/projects/:id/resilience/circuit-breakers', requireAuth, requirePermission('resilience.read'), (req: AuthenticatedRequest, res: Response) => {
  const breakers = storage.getCircuitBreakers(req.params.id);
  res.json(breakers);
});

apiRouter.post('/projects/:id/resilience/circuit-breakers/:target/reset', requireAuth, requirePermission('resilience.admin'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const breaker = resilienceEngine.circuitBreaker.resetBreaker(req.params.target as any, user.id, user.role);
  res.json(breaker);
});

apiRouter.post('/projects/:id/resilience/circuit-breakers/:target/trip', requireAuth, requirePermission('resilience.admin'), (req: AuthenticatedRequest, res: Response) => {
  const breaker = resilienceEngine.circuitBreaker.tripBreaker(req.params.target as any, req.body.reason || 'Manual test trip');
  res.json(breaker);
});

apiRouter.get('/projects/:id/resilience/dead-letter', requireAuth, requirePermission('resilience.read'), (req: AuthenticatedRequest, res: Response) => {
  const records = storage.getDeadLetterRecords(req.params.id);
  res.json(records);
});

apiRouter.post('/projects/:id/resilience/dead-letter/:dlqId/replay', requireAuth, requirePermission('resilience.admin'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const result = storage.replayDeadLetterRecord(req.params.dlqId, req.params.id, user.id);
  if (!result.success) {
    return res.status(404).json({ error: 'NOT_FOUND', message: result.error });
  }
  res.json(result.record);
});

apiRouter.get('/projects/:id/resilience/integrity/check', requireAuth, requirePermission('resilience.read'), (req: AuthenticatedRequest, res: Response) => {
  const results = resilienceEngine.dataIntegrity.runIntegrityAudit(req.params.id);
  res.json(results);
});

apiRouter.get('/projects/:id/resilience/deployments', requireAuth, requirePermission('resilience.read'), (req: AuthenticatedRequest, res: Response) => {
  const deployments = storage.getDeployments(req.params.id);
  res.json(deployments);
});

apiRouter.post('/projects/:id/resilience/deployments', requireAuth, requirePermission('deployment.approve'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const deployment = resilienceEngine.deployment.prepareDeployment(
    req.params.id,
    req.body.targetEnvironment || 'PRODUCTION',
    req.body.rollbackAction || 'Revert release and rollback state',
    user.id,
    user.role
  );
  res.status(201).json(deployment);
});

apiRouter.post('/projects/:id/resilience/deployments/:depId/deploy', requireAuth, requirePermission('deployment.approve'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const result = resilienceEngine.deployment.deployRelease(req.params.depId, user.id, user.role);
  if (!result.success) {
    return res.status(403).json({ error: 'DEPLOY_REJECTED', message: result.error });
  }
  res.json(result.deployment);
});

apiRouter.post('/projects/:id/resilience/deployments/:depId/rollback', requireAuth, requirePermission('deployment.rollback'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const result = resilienceEngine.deployment.rollbackDeployment(req.params.depId, user.id, user.role);
  if (!result.success) {
    return res.status(403).json({ error: 'ROLLBACK_REJECTED', message: result.error });
  }
  res.json(result.deployment);
});

apiRouter.get('/projects/:id/resilience/backups', requireAuth, requirePermission('resilience.read'), (req: AuthenticatedRequest, res: Response) => {
  const backups = storage.getBackups(req.params.id);
  res.json(backups);
});

apiRouter.post('/projects/:id/resilience/backups', requireAuth, requirePermission('dr.execute'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const backup = resilienceEngine.disasterRecovery.createSnapshot(
    req.params.id,
    req.body.backupClass || 'CRITICAL',
    user.id,
    user.role
  );
  res.status(201).json(backup);
});

apiRouter.post('/projects/:id/resilience/backups/:bId/restore-test', requireAuth, requirePermission('dr.execute'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const testRecord = resilienceEngine.disasterRecovery.executeRestoreDrill(req.params.bId, user.id, user.role);
  res.json(testRecord);
});

apiRouter.get('/projects/:id/resilience/incidents', requireAuth, requirePermission('resilience.read'), (req: AuthenticatedRequest, res: Response) => {
  const incidents = storage.getIncidents(req.params.id);
  res.json(incidents);
});

apiRouter.post('/projects/:id/resilience/incidents', requireAuth, requirePermission('incident.manage'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const incident = resilienceEngine.incident.createIncident(
    {
      projectId: req.params.id,
      title: req.body.title || 'Untitled Operational Incident',
      severity: req.body.severity || 'SEV2',
      category: req.body.category || 'INFRASTRUCTURE',
      affectedSystems: req.body.affectedSystems || ['System'],
      owner: req.body.owner || user.id
    },
    user.id,
    user.role
  );
  res.status(201).json(incident);
});

apiRouter.post('/projects/:id/resilience/incidents/:incId/contain', requireAuth, requirePermission('incident.manage'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const incident = resilienceEngine.incident.executeContainment(
    req.params.incId,
    req.body.action || 'SAFE_MODE',
    user.id,
    user.role
  );
  res.json(incident);
});

apiRouter.post('/projects/:id/resilience/incidents/:incId/resolve', requireAuth, requirePermission('incident.manage'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const result = resilienceEngine.incident.resolveIncident(
    req.params.incId,
    {
      category: req.body.category || 'SYSTEM',
      rootCause: req.body.rootCause || 'Root cause identified and addressed.',
      correctiveActions: req.body.correctiveActions || ['Applied operational fix.']
    },
    user.id,
    user.role
  );
  res.json(result);
});

apiRouter.get('/projects/:id/resilience/scorecard', requireAuth, requirePermission('resilience.read'), (req: AuthenticatedRequest, res: Response) => {
  const scorecard = resilienceEngine.observability.generateScorecard(req.params.id);
  res.json(scorecard);
});

apiRouter.get('/projects/:id/resilience/runbooks', requireAuth, requirePermission('resilience.read'), (req: AuthenticatedRequest, res: Response) => {
  const runbooks = storage.getRunbooks();
  res.json(runbooks);
});

apiRouter.post('/projects/:id/resilience/safe-mode', requireAuth, requirePermission('resilience.admin'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const level = storage.setDegradationLevel(req.params.id, 'SAFE_MODE', req.body.reason || 'Manual safe mode transition', user.id, user.role);
  res.json({ degradationLevel: level });
});

apiRouter.post('/projects/:id/resilience/normal-mode', requireAuth, requirePermission('resilience.admin'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const level = storage.setDegradationLevel(req.params.id, 'NORMAL', 'Restored to normal operation', user.id, user.role);
  res.json({ degradationLevel: level });
});

// ============================================================================
// PHASE 11: FULL-SYSTEM VERIFICATION, INTEGRATION ASSURANCE & GO-LIVE
// ============================================================================

apiRouter.get('/projects/:id/verification/scope-registry', requireAuth, requirePermission('verification.read'), (req: AuthenticatedRequest, res: Response) => {
  const items = scopeRegistry.getAllScopeItems();
  res.json({ scopeItems: items });
});

apiRouter.post('/projects/:id/verification/assess-change', requireAuth, requirePermission('verification.read'), (req: AuthenticatedRequest, res: Response) => {
  const changedFiles = req.body.changedFiles || [];
  const assessment = scopeRegistry.evaluateVerificationLevel(changedFiles);
  res.json(assessment);
});

apiRouter.get('/projects/:id/verification/traceability/:targetId', requireAuth, requirePermission('verification.read'), (req: AuthenticatedRequest, res: Response) => {
  const chain = traceabilityEngine.generateTraceabilityChain(req.params.id, req.params.targetId);
  if (!chain) {
    return res.status(404).json({ error: 'Target entity not found for provenance tracking.' });
  }
  res.json(chain);
});

apiRouter.get('/projects/:id/verification/traceable-tasks', requireAuth, requirePermission('verification.read'), (req: AuthenticatedRequest, res: Response) => {
  const tasks = traceabilityEngine.getTraceableTasks(req.params.id);
  res.json({ tasks });
});

apiRouter.get('/projects/:id/verification/go-live-package', requireAuth, requirePermission('golive.read'), (req: AuthenticatedRequest, res: Response) => {
  const pkg = goLiveEngine.generateGoLiveDecisionPackage(req.params.id);
  res.json(pkg);
});

apiRouter.post('/projects/:id/verification/evaluate-gates', requireAuth, requirePermission('verification.execute'), (req: AuthenticatedRequest, res: Response) => {
  const gates = goLiveEngine.evaluateGoLiveGates(req.params.id);
  res.json({ gates });
});

apiRouter.post('/projects/:id/verification/approve-go-live', requireAuth, requirePermission('golive.approve'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const rationale = req.body.rationale || 'Authorized production release ratification.';
  const result = goLiveEngine.approveGoLive(req.params.id, user.id, user.role, rationale);
  if (!result.success) {
    return res.status(403).json({ error: result.error });
  }
  res.json(result);
});

apiRouter.get('/projects/:id/verification/residual-risks', requireAuth, requirePermission('verification.read'), (req: AuthenticatedRequest, res: Response) => {
  const risks = goLiveEngine.getResidualRisks(req.params.id);
  res.json({ residualRisks: risks });
});

// ============================================================================
// PHASE 12: CONTROLLED GO-LIVE, CONTINUOUS OPERATIONS & MAINTENANCE
// ============================================================================

apiRouter.get('/projects/:id/operations/overview', requireAuth, requirePermission('operations.read'), (req: AuthenticatedRequest, res: Response) => {
  const overview = operationsEngine.getOperationalOverview(req.params.id);
  res.json(overview);
});

apiRouter.get('/projects/:id/operations/baseline', requireAuth, requirePermission('operations.read'), (req: AuthenticatedRequest, res: Response) => {
  const baseline = operationsEngine.getOperationalBaseline(req.params.id);
  res.json({ baseline });
});

apiRouter.post('/projects/:id/operations/smoke-checks', requireAuth, requirePermission('operations.read'), (req: AuthenticatedRequest, res: Response) => {
  const smokeChecks = operationsEngine.runProductionSmokeChecks(req.params.id);
  res.json({ smokeChecks });
});

apiRouter.get('/projects/:id/operations/change-freeze', requireAuth, requirePermission('operations.read'), (req: AuthenticatedRequest, res: Response) => {
  const changeFreeze = operationsEngine.getChangeFreeze(req.params.id);
  res.json({ changeFreeze });
});

apiRouter.post('/projects/:id/operations/change-freeze', requireAuth, requirePermission('operations.admin'), (req: AuthenticatedRequest, res: Response) => {
  const { active, reason } = req.body;
  const result = operationsEngine.toggleChangeFreeze(req.params.id, req.user!.id, req.user!.role, Boolean(active), reason);
  if (!result.success) {
    return res.status(403).json({ error: result.error });
  }
  res.json(result);
});

apiRouter.post('/projects/:id/operations/emergency-access', requireAuth, requirePermission('operations.emergency'), (req: AuthenticatedRequest, res: Response) => {
  const { reason, affectedResources } = req.body;
  const result = operationsEngine.requestEmergencyAccess(req.params.id, req.user!.id, req.user!.role, reason, affectedResources || ['*']);
  if (!result.success) {
    return res.status(403).json({ error: result.error });
  }
  res.json(result);
});

apiRouter.post('/projects/:id/operations/emergency-access/:sessionId/revoke', requireAuth, requirePermission('operations.emergency'), (req: AuthenticatedRequest, res: Response) => {
  const result = operationsEngine.revokeEmergencyAccess(req.params.id, req.params.sessionId, req.user!.id, req.user!.role);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

apiRouter.get('/projects/:id/operations/maintenance', requireAuth, requirePermission('operations.read'), (req: AuthenticatedRequest, res: Response) => {
  const tasks = operationsEngine.getMaintenanceTasks(req.params.id);
  res.json({ maintenanceTasks: tasks });
});

apiRouter.post('/projects/:id/operations/maintenance', requireAuth, requirePermission('maintenance.manage'), (req: AuthenticatedRequest, res: Response) => {
  const task = operationsEngine.createMaintenanceTask(req.params.id, req.body);
  res.status(201).json({ task });
});

apiRouter.get('/projects/:id/operations/technical-debt', requireAuth, requirePermission('operations.read'), (req: AuthenticatedRequest, res: Response) => {
  const debt = operationsEngine.getTechnicalDebt(req.params.id);
  res.json({ technicalDebt: debt });
});

apiRouter.post('/projects/:id/operations/technical-debt', requireAuth, requirePermission('maintenance.manage'), (req: AuthenticatedRequest, res: Response) => {
  const item = operationsEngine.createTechnicalDebt(req.params.id, req.body);
  res.status(201).json({ item });
});

apiRouter.post('/projects/:id/operations/maturity-state', requireAuth, requirePermission('operations.admin'), (req: AuthenticatedRequest, res: Response) => {
  const { state } = req.body;
  const result = operationsEngine.setOperationalMaturityState(req.params.id, state, req.user!.id, req.user!.role);
  if (!result.success) {
    return res.status(403).json({ error: result.error });
  }
  res.json(result);
});

// ============================================================================
// PHASE 13: CONTINUOUS ASSURANCE, CONTROLLED EVOLUTION & ARCHITECTURAL INTEGRITY
// ============================================================================

apiRouter.get('/projects/:id/assurance/overview', requireAuth, requirePermission('assurance.read'), (req: AuthenticatedRequest, res: Response) => {
  const overview = assuranceEngine.getOverview(req.params.id);
  res.json({ overview });
});

apiRouter.get('/projects/:id/assurance/principles', requireAuth, requirePermission('assurance.read'), (req: AuthenticatedRequest, res: Response) => {
  const principles = assuranceEngine.getCanonicalPrinciples();
  res.json({ principles });
});

apiRouter.get('/projects/:id/assurance/authorities', requireAuth, requirePermission('assurance.read'), (req: AuthenticatedRequest, res: Response) => {
  const data = assuranceEngine.getAuthorityMappings(req.params.id);
  res.json(data);
});

apiRouter.post('/projects/:id/assurance/triggers/evaluate', requireAuth, requirePermission('assurance.read'), (req: AuthenticatedRequest, res: Response) => {
  const { triggerType, sourceArtifact, evidence } = req.body;
  const triggerEvent = assuranceEngine.evaluateAssuranceTrigger(req.params.id, triggerType, sourceArtifact, evidence);
  res.status(201).json({ triggerEvent });
});

apiRouter.get('/projects/:id/assurance/simplifications', requireAuth, requirePermission('assurance.read'), (req: AuthenticatedRequest, res: Response) => {
  const candidates = assuranceEngine.getSimplificationCandidates(req.params.id);
  res.json({ simplificationCandidates: candidates });
});

apiRouter.post('/projects/:id/assurance/simplifications/:candId/advance', requireAuth, requirePermission('assurance.manage'), (req: AuthenticatedRequest, res: Response) => {
  const { targetStatus } = req.body;
  try {
    const updated = assuranceEngine.advanceSimplificationStage(req.params.id, req.params.candId, targetStatus, req.user!.id, req.user!.role);
    res.json({ candidate: updated });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

apiRouter.get('/projects/:id/assurance/flags', requireAuth, requirePermission('assurance.read'), (req: AuthenticatedRequest, res: Response) => {
  const flags = assuranceEngine.getGovernedFeatureFlags(req.params.id);
  res.json({ featureFlags: flags });
});

apiRouter.get('/projects/:id/assurance/proposals', requireAuth, requirePermission('assurance.read'), (req: AuthenticatedRequest, res: Response) => {
  const proposals = assuranceEngine.getEvolutionProposals(req.params.id);
  res.json({ evolutionProposals: proposals });
});

apiRouter.post('/projects/:id/assurance/proposals', requireAuth, requirePermission('assurance.manage'), (req: AuthenticatedRequest, res: Response) => {
  const proposal = assuranceEngine.createEvolutionProposal(req.params.id, req.body, req.user!.role);
  res.status(201).json({ proposal });
});

apiRouter.post('/projects/:id/assurance/proposals/:propId/ratify', requireAuth, requirePermission('assurance.manage'), (req: AuthenticatedRequest, res: Response) => {
  const { decision } = req.body;
  try {
    const ratified = assuranceEngine.ratifyEvolutionProposal(req.params.id, req.params.propId, req.user!.id, req.user!.role, decision);
    res.json({ proposal: ratified });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// ============================================================================
// AUTOMATED TEST SUITE RUNNER (Foundation + Execution + Collaboration + Validation + Optimization + Learning + Resilience + Integration + Operations + Assurance)
// ============================================================================

apiRouter.post('/tests/run', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { runFoundationTests } = await import('../tests/foundation.test.ts');
  const { runExecutionTests } = await import('../tests/execution.test.ts');
  const { runCollaborationTests } = await import('../tests/collaboration.test.ts');
  const { runValidationTests } = await import('../tests/validation.test.ts');
  const { runOptimizationTests } = await import('../tests/optimization.test.ts');
  const { runLearningTests } = await import('../tests/learning.test.ts');
  const { runResilienceTests } = await import('../tests/resilience.test.ts');
  const { runIntegrationTests } = await import('../tests/integration.test.ts');
  const { runOperationsTests } = await import('../tests/operations.test.ts');
  const { runAssuranceTests } = await import('../tests/assurance.test.ts');
  
  const foundation = await runFoundationTests();
  const execution = await runExecutionTests();
  const collaboration = await runCollaborationTests();
  const validation = await runValidationTests();
  const optimization = await runOptimizationTests();
  const learning = await runLearningTests();
  const resilience = await runResilienceTests();
  const integration = await runIntegrationTests();
  const operations = await runOperationsTests();
  const assurance = await runAssuranceTests();
  
  const allResults = [
    ...foundation.results,
    ...execution.results,
    ...collaboration.results.map((r: any) => ({
      name: r.name,
      category: 'AGENT' as const,
      passed: Boolean(r.passed),
      message: r.details || r.error || (r.passed ? 'PASSED: Multi-agent collaboration invariant verified' : 'FAILED'),
      durationMs: 8
    })),
    ...validation.results.map((r: any) => ({
      name: r.name,
      category: 'VALIDATION' as const,
      passed: Boolean(r.passed),
      message: r.details || r.error || (r.passed ? 'PASSED: Verification contract confirmed' : 'FAILED'),
      durationMs: 12
    })),
    ...optimization.results.map((r: any) => ({
      name: r.testName || r.name,
      category: 'OPTIMIZATION' as const,
      passed: Boolean(r.passed),
      message: r.message,
      durationMs: 14
    })),
    ...learning.results.map((r: any) => ({
      name: r.testName || r.name,
      category: 'LEARNING' as const,
      passed: Boolean(r.passed),
      message: r.message,
      durationMs: 10
    })),
    ...resilience.results.map((r: any) => ({
      name: r.testName || r.name,
      category: 'RESILIENCE' as const,
      passed: Boolean(r.passed),
      message: r.message,
      durationMs: 12
    })),
    ...integration.results.map((r: any) => ({
      name: r.name,
      category: 'INTEGRATION' as const,
      passed: Boolean(r.passed),
      message: r.message,
      durationMs: 10
    })),
    ...operations.results.map((r: any) => ({
      name: r.name,
      category: 'OPERATIONS' as const,
      passed: Boolean(r.passed),
      message: r.message,
      durationMs: 8
    })),
    ...assurance.results.map((r: any) => ({
      name: r.name,
      category: 'ASSURANCE' as const,
      passed: Boolean(r.passed),
      message: r.message,
      durationMs: 6
    }))
  ];
  const passed = foundation.passed && execution.passed && collaboration.passed && validation.passed && optimization.passed && learning.passed && resilience.passed && integration.passed && operations.passed && assurance.passed;
  
  res.json({
    passed,
    results: allResults,
    summary: {
      total: allResults.length,
      passed: allResults.filter(r => r.passed).length,
      failed: allResults.filter(r => !r.passed).length
    }
  });
});
