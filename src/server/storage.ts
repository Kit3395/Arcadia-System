/**
 * ARCADIA SYSTEM - FOUNDATION SPECIFICATION v1.0
 * Thread-safe, In-Memory Authoritative Storage Engine with Relational Integrity & Immutable Audit Trail
 */

import {
  Organization,
  User,
  UserRole,
  Permission,
  Project,
  ProjectConstitution,
  ProjectPrimaryState,
  Requirement,
  RequirementStatus,
  Decision,
  UniversalTaskSpecification,
  TaskState,
  DecisionQueueItem,
  AuditLogEntry,
  ValidationContract,
  ValidationRule,
  ValidationGate,
  ValidationFailure,
  SecurityFinding,
  ThreatModel,
  TrustBoundary,
  DataFlowRecord,
  ComplianceControl,
  SecurityIncident,
  DriftRecord,
  RegressionRunRecord,
  RiskAcceptanceRecord,
  ValidationOverviewMetrics,
  ValidationSeverity,
  DataAuthorityClassification,
  TelemetryEvent,
  TelemetryEventType,
  CostCategory,
  CostEvent,
  CostModel,
  CostEstimate,
  CostAllocation,
  TimeEvent,
  DependencyDelay,
  CriticalPathAnalysis,
  TimelinePrediction,
  WorkflowLoadFactors,
  WorkflowLoadIndicator,
  TrustEventType,
  TrustEvent,
  ContextualTrustProfile,
  OptimizationCategory,
  OptimizationImpactLevel,
  OptimizationStatus,
  OptimizationRecommendation,
  OptimizationPolicy,
  OptimizationAction,
  OptimizationExperiment,
  OptimizationOverviewMetrics,
  MemoryType,
  MemoryStatus,
  MemoryProvenance,
  OrganizationalMemory,
  PatternCategory,
  PatternSeverity,
  DetectedPattern,
  LearningMetricCategory,
  TrendDirection,
  LearningMetricSnapshot,
  EvolutionProposalStatus,
  EvolutionProposal,
  LearningOverviewMetrics,
  CircuitBreakerRecord,
  CircuitBreakerTarget,
  CircuitBreakerState,
  DeadLetterRecord,
  DataIntegrityCheckResult,
  SecretFindingRecord,
  DeploymentRecord,
  BackupRecord,
  RestoreTestRecord,
  ProductionIncident,
  OperationalRunbook,
  ProductionReadinessScorecard,
  ResilienceOverviewMetrics,
  DegradationLevel,
  AIProviderProfile,
  FailureClassification
} from '../types/index.ts';

// Role-to-Permissions Mapping (RBAC Matrix)
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  CLIENT: [
    'project.read',
    'requirement.read',
    'requirement.create',
    'decision.read',
    'task.read',
    'execution.read',
    'audit.read',
    'validation.read',
    'drift.read',
    'security.read',
    'telemetry.read',
    'cost.read',
    'optimization.read',
    'learning.read',
    'resilience.read',
    'verification.read',
    'golive.read',
    'operations.read',
    'assurance.read'
  ],
  PROJECT_LEAD: [
    'project.read',
    'project.create',
    'project.update',
    'project.state_transition',
    'constitution.update',
    'requirement.read',
    'requirement.create',
    'requirement.approve',
    'decision.read',
    'decision.create',
    'decision.approve',
    'task.read',
    'task.create',
    'task.assign',
    'task.execute',
    'task.state_transition',
    'execution.read',
    'execution.start',
    'execution.stop',
    'execution.validate',
    'agent.manage',
    'audit.read',
    'admin.config',
    'validation.read',
    'validation.create',
    'validation.execute',
    'validation.run',
    'validation.waive',
    'validation.approve',
    'security.read',
    'security.scan',
    'security.resolve',
    'security.incident_manage',
    'drift.read',
    'drift.detect',
    'drift.reconcile',
    'drift.resolve',
    'risk.accept',
    'telemetry.read',
    'cost.read',
    'optimization.read',
    'optimization.recommend',
    'optimization.approve',
    'optimization.apply',
    'optimization.policy',
    'learning.read',
    'learning.write',
    'learning.verify',
    'learning.evolve',
    'resilience.read',
    'resilience.admin',
    'incident.manage',
    'deployment.approve',
    'deployment.rollback',
    'dr.execute',
    'verification.read',
    'verification.execute',
    'golive.read',
    'golive.approve',
    'operations.read',
    'operations.admin',
    'operations.emergency',
    'maintenance.manage',
    'assurance.read',
    'assurance.manage'
  ],
  ARCHITECT: [
    'project.read',
    'project.update',
    'constitution.update',
    'requirement.read',
    'requirement.create',
    'requirement.approve',
    'decision.read',
    'decision.create',
    'decision.approve',
    'task.read',
    'task.create',
    'task.assign',
    'task.execute',
    'task.state_transition',
    'execution.read',
    'execution.start',
    'execution.stop',
    'execution.validate',
    'agent.manage',
    'audit.read',
    'validation.read',
    'validation.create',
    'validation.execute',
    'validation.run',
    'validation.approve',
    'security.read',
    'security.scan',
    'drift.read',
    'drift.detect',
    'drift.reconcile',
    'drift.resolve',
    'telemetry.read',
    'cost.read',
    'optimization.read',
    'optimization.recommend',
    'optimization.approve',
    'optimization.apply',
    'learning.read',
    'learning.write',
    'learning.verify',
    'learning.evolve',
    'resilience.read',
    'resilience.admin',
    'deployment.rollback',
    'dr.execute',
    'verification.read',
    'golive.read',
    'operations.read',
    'operations.admin',
    'maintenance.manage',
    'assurance.read',
    'assurance.manage'
  ],
  DEVELOPER: [
    'project.read',
    'requirement.read',
    'decision.read',
    'task.read',
    'task.execute',
    'task.state_transition',
    'execution.read',
    'execution.start',
    'execution.stop',
    'audit.read',
    'validation.read',
    'validation.execute',
    'validation.run',
    'security.read',
    'drift.read',
    'telemetry.read',
    'cost.read',
    'optimization.read',
    'learning.read',
    'learning.write',
    'resilience.read',
    'verification.read',
    'operations.read',
    'assurance.read'
  ],
  QA: [
    'project.read',
    'requirement.read',
    'decision.read',
    'task.read',
    'task.execute',
    'task.state_transition',
    'execution.read',
    'execution.validate',
    'audit.read',
    'validation.read',
    'validation.create',
    'validation.execute',
    'validation.run',
    'validation.approve',
    'drift.read',
    'drift.detect',
    'telemetry.read',
    'cost.read',
    'optimization.read',
    'learning.read',
    'learning.write',
    'learning.verify',
    'resilience.read',
    'verification.read',
    'verification.execute',
    'golive.read',
    'operations.read',
    'maintenance.manage',
    'assurance.read'
  ],
  SECURITY: [
    'project.read',
    'constitution.update',
    'requirement.read',
    'decision.read',
    'decision.approve',
    'task.read',
    'execution.read',
    'execution.stop',
    'execution.validate',
    'audit.read',
    'admin.config',
    'validation.read',
    'validation.execute',
    'validation.run',
    'validation.waive',
    'validation.approve',
    'security.read',
    'security.scan',
    'security.resolve',
    'security.incident_manage',
    'drift.read',
    'drift.detect',
    'drift.reconcile',
    'drift.resolve',
    'risk.accept',
    'telemetry.read',
    'cost.read',
    'optimization.read',
    'optimization.approve',
    'optimization.policy',
    'learning.read',
    'learning.verify',
    'learning.evolve',
    'resilience.read',
    'resilience.admin',
    'incident.manage',
    'deployment.rollback',
    'dr.execute',
    'verification.read',
    'verification.execute',
    'golive.read',
    'operations.read',
    'operations.admin',
    'operations.emergency',
    'assurance.read',
    'assurance.manage'
  ],
  OPERATIONS: [
    'project.read',
    'task.read',
    'execution.read',
    'execution.stop',
    'audit.read',
    'admin.config',
    'validation.read',
    'security.read',
    'drift.read',
    'drift.detect',
    'telemetry.read',
    'cost.read',
    'optimization.read',
    'optimization.apply',
    'optimization.policy',
    'learning.read',
    'learning.evolve',
    'resilience.read',
    'resilience.admin',
    'incident.manage',
    'deployment.rollback',
    'dr.execute',
    'verification.read',
    'verification.execute',
    'golive.read',
    'operations.read',
    'operations.admin',
    'operations.emergency',
    'maintenance.manage',
    'assurance.read',
    'assurance.manage'
  ]
};

export class StorageEngine {
  private organizations: Map<string, Organization> = new Map();
  private users: Map<string, User> = new Map();
  private projects: Map<string, Project> = new Map();
  private constitutions: Map<string, ProjectConstitution[]> = new Map(); // projectId -> versions
  private requirements: Map<string, Requirement[]> = new Map(); // projectId -> requirements
  private decisions: Map<string, Decision[]> = new Map(); // projectId -> decisions
  private tasks: Map<string, UniversalTaskSpecification[]> = new Map(); // projectId -> tasks
  private decisionQueue: Map<string, DecisionQueueItem[]> = new Map(); // projectId -> items
  private auditLogs: AuditLogEntry[] = [];
  private validationContracts: Map<string, ValidationContract[]> = new Map();
  private validationRules: Map<string, ValidationRule[]> = new Map();
  private validationGates: Map<string, ValidationGate[]> = new Map();
  private securityFindings: Map<string, SecurityFinding[]> = new Map();
  private threatModels: Map<string, ThreatModel[]> = new Map();
  private trustBoundaries: TrustBoundary[] = [];
  private dataFlows: Map<string, DataFlowRecord[]> = new Map();
  private complianceControls: Map<string, ComplianceControl[]> = new Map();
  private securityIncidents: Map<string, SecurityIncident[]> = new Map();
  private driftRecords: Map<string, DriftRecord[]> = new Map();
  private regressionRuns: Map<string, RegressionRunRecord[]> = new Map();
  private riskAcceptances: Map<string, RiskAcceptanceRecord[]> = new Map();
  private telemetryEvents: Map<string, TelemetryEvent[]> = new Map();
  private costEvents: Map<string, CostEvent[]> = new Map();
  private costModels: Map<string, CostModel[]> = new Map();
  private costEstimates: Map<string, CostEstimate[]> = new Map();
  private timeEvents: Map<string, TimeEvent[]> = new Map();
  private trustEvents: Map<string, TrustEvent[]> = new Map();
  private optimizationRecommendations: Map<string, OptimizationRecommendation[]> = new Map();
  private optimizationPolicies: Map<string, OptimizationPolicy[]> = new Map();
  private optimizationActions: Map<string, OptimizationAction[]> = new Map();
  private optimizationExperiments: Map<string, OptimizationExperiment[]> = new Map();
  private organizationalMemories: Map<string, OrganizationalMemory[]> = new Map();
  private detectedPatterns: Map<string, DetectedPattern[]> = new Map();
  private learningMetricSnapshots: Map<string, LearningMetricSnapshot[]> = new Map();
  private evolutionProposals: Map<string, EvolutionProposal[]> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerRecord> = new Map();
  private deadLetterQueue: Map<string, DeadLetterRecord[]> = new Map();
  private deployments: Map<string, DeploymentRecord[]> = new Map();
  private backups: Map<string, BackupRecord[]> = new Map();
  private restoreTests: Map<string, RestoreTestRecord[]> = new Map();
  private incidents: Map<string, ProductionIncident[]> = new Map();
  private secretFindings: Map<string, SecretFindingRecord[]> = new Map();
  private runbooks: OperationalRunbook[] = [];
  private degradationLevels: Map<string, DegradationLevel> = new Map();
  private aiProviders: Map<string, AIProviderProfile> = new Map();

  constructor() {
    this.seedDevelopmentData();
  }

  // ==========================================================================
  // TEST ISOLATION — snapshot & restore the entire in-memory store.
  // The /api/tests/run endpoint wraps execution in snapshotState/restoreState
  // so invariant suites never pollute real user data (test projects, audit
  // entries, etc. are rolled back after the run).
  // ==========================================================================
  private static readonly SNAPSHOT_FIELDS: readonly string[] = [
    'organizations', 'users', 'projects', 'constitutions', 'requirements',
    'decisions', 'tasks', 'decisionQueue', 'auditLogs', 'validationContracts',
    'validationRules', 'validationGates', 'securityFindings', 'threatModels',
    'trustBoundaries', 'dataFlows', 'complianceControls', 'securityIncidents',
    'driftRecords', 'regressionRuns', 'riskAcceptances', 'telemetryEvents',
    'costEvents', 'costModels', 'costEstimates', 'timeEvents', 'trustEvents',
    'optimizationRecommendations', 'optimizationPolicies', 'optimizationActions',
    'optimizationExperiments', 'organizationalMemories', 'detectedPatterns',
    'learningMetricSnapshots', 'evolutionProposals', 'circuitBreakers',
    'deadLetterQueue', 'deployments', 'backups', 'restoreTests', 'incidents',
    'secretFindings', 'runbooks', 'degradationLevels', 'aiProviders',
  ];

  snapshotState(): Map<string, unknown> {
    const snap = new Map<string, unknown>();
    const self = this as unknown as Record<string, unknown>;
    for (const field of StorageEngine.SNAPSHOT_FIELDS) {
      const value = self[field];
      if (value instanceof Map) {
        snap.set(field, new Map(structuredClone(Array.from(value.entries()))));
      } else if (Array.isArray(value)) {
        snap.set(field, structuredClone(value));
      }
    }
    return snap;
  }

  restoreState(snap: Map<string, unknown>): void {
    const self = this as unknown as Record<string, unknown>;
    for (const field of StorageEngine.SNAPSHOT_FIELDS) {
      const value = snap.get(field);
      if (value instanceof Map) {
        self[field] = new Map(value);
      } else if (Array.isArray(value)) {
        self[field] = [...value];
      }
    }
  }

  // ==========================================================================
  // FILE PERSISTENCE — JSON snapshot of the whole store.
  // Path defaults to ./arcadia-data.json, overridable via ARCADIA_DATA_FILE.
  // The server loads on boot (if the file exists) and saves periodically +
  // on shutdown. NOTE: on Cloud Run the filesystem is ephemeral per instance,
  // so this guards against process restarts, not instance replacement — a
  // managed database is still the right call for production-critical data.
  // ==========================================================================
  toJSON(): Record<string, unknown> {
    const out: Record<string, unknown> = { version: 1, savedAt: new Date().toISOString() };
    const self = this as unknown as Record<string, unknown>;
    for (const field of StorageEngine.SNAPSHOT_FIELDS) {
      const value = self[field];
      if (value instanceof Map) {
        out[field] = Array.from(value.entries());
      } else if (Array.isArray(value)) {
        out[field] = value;
      }
    }
    return out;
  }

  loadJSON(data: Record<string, unknown>): void {
    const self = this as unknown as Record<string, unknown>;
    for (const field of StorageEngine.SNAPSHOT_FIELDS) {
      const value = data[field];
      if (!Array.isArray(value)) continue;
      const current = self[field];
      if (current instanceof Map) {
        // Map fields were serialized as [key, value] entry arrays.
        if (value.length === 0 || Array.isArray(value[0])) {
          self[field] = new Map(value as [string, unknown][]);
        }
      } else if (Array.isArray(current)) {
        self[field] = value;
      }
    }
  }

  // NOTE: file I/O helpers (save/load the JSON above to disk) live in
  // server.ts, which is only ever bundled for Node. storage.ts is also
  // imported by browser components, so it must stay free of node: imports.

  // ==========================================================================
  // IDENTITY & ORGANIZATION (Tenant Boundary)
  // ==========================================================================

  public getOrganization(id: string): Organization | undefined {
    return this.organizations.get(id);
  }

  public getOrganizations(): Organization[] {
    return Array.from(this.organizations.values());
  }

  public getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  public getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  public getUsersForOrg(orgId: string): User[] {
    return Array.from(this.users.values()).filter(u => u.organizationId === orgId);
  }

  public hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  }

  public getUserPermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  // ==========================================================================
  // PROJECT & CONSTITUTION
  // ==========================================================================

  public getProjects(orgId: string): Project[] {
    return Array.from(this.projects.values()).filter(p => p.organizationId === orgId);
  }

  public getProject(id: string, orgId?: string): Project | undefined {
    const project = this.projects.get(id);
    if (!project) return undefined;
    if (orgId && project.organizationId !== orgId) {
      return undefined;
    }
    return project;
  }

  public createProject(
    data: Omit<Project, 'id' | 'currentVersion' | 'createdAt' | 'updatedAt'>,
    actor: User,
    correlationId: string
  ): Project {
    const id = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newProject: Project = {
      ...data,
      id,
      currentVersion: 1,
      createdAt: now,
      updatedAt: now
    };

    this.projects.set(id, newProject);

    // Initial default constitution
    const defaultConstitution: ProjectConstitution = {
      id: `const-${id}-v1`,
      projectId: id,
      version: 1,
      approvedStack: {
        frontend: 'React 18 + TypeScript + Tailwind CSS',
        backend: 'Node.js 20 LTS + Express Modular Monolith',
        database: 'PostgreSQL 16 (Relational + JSONB)',
        deployment: 'Cloud Run Container Engine'
      },
      securityClassification: 'CONFIDENTIAL',
      complianceProfiles: ['SOC2', 'GDPR'],
      prohibitedDependencies: ['eval()', 'child_process in frontend', 'unvetted external CDN script tags'],
      governanceRules: [
        { id: 'R1', rule: 'AI inferences cannot alter Layer 2 state without human sign-off', enforcement: 'HUMAN_GATE' },
        { id: 'R2', rule: 'All task execution code diffs must pass typecheck and unit tests', enforcement: 'CI' }
      ],
      isCurrent: true,
      approvedBy: actor.id,
      createdAt: now
    };

    this.constitutions.set(id, [defaultConstitution]);

    this.recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'PROJECT_CREATED',
      targetEntity: 'Project',
      targetId: id,
      projectId: id,
      afterState: newProject as unknown as Record<string, unknown>,
      correlationId
    });

    return newProject;
  }

  public updateProjectState(
    projectId: string,
    orgId: string,
    newState: ProjectPrimaryState,
    actor: User,
    correlationId: string
  ): { success: boolean; project?: Project; error?: string } {
    const project = this.getProject(projectId, orgId);
    if (!project) {
      return { success: false, error: 'Project not found or inaccessible under active organization.' };
    }

    if (!this.hasPermission(actor.role, 'project.state_transition')) {
      return { success: false, error: `Role ${actor.role} is not authorized for project state transitions.` };
    }

    const previousState = project.primaryState;

    // Prerequisite Validation Rules (State Machine Guards)
    if (newState === 'GOVERNANCE' && previousState === 'BLUEPRINT') {
      const reqs = this.getRequirements(projectId);
      const approvedCount = reqs.filter(r => r.status === 'APPROVED').length;
      if (approvedCount === 0) {
        return { success: false, error: 'Cannot transition to GOVERNANCE without at least one APPROVED requirement.' };
      }
    }

    if (newState === 'PLANNED' && previousState === 'GOVERNANCE') {
      const constitution = this.getCurrentConstitution(projectId);
      if (!constitution || !constitution.isCurrent) {
        return { success: false, error: 'Cannot transition to PLANNED without a ratified Project Constitution.' };
      }
    }

    if (newState === 'EXECUTION' && previousState === 'PLANNED') {
      const tasks = this.getTasks(projectId);
      if (tasks.length === 0) {
        return { success: false, error: 'Cannot transition to EXECUTION without planned tasks.' };
      }
    }

    project.primaryState = newState;
    project.updatedAt = new Date().toISOString();
    project.currentVersion += 1;

    this.projects.set(projectId, project);

    this.recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'PROJECT_STATE_TRANSITION',
      targetEntity: 'Project',
      targetId: projectId,
      projectId,
      beforeState: { primaryState: previousState },
      afterState: { primaryState: newState },
      correlationId
    });

    return { success: true, project };
  }

  public getCurrentConstitution(projectId: string): ProjectConstitution | undefined {
    const list = this.constitutions.get(projectId) || [];
    return list.find(c => c.isCurrent);
  }

  public getConstitution(projectId: string): ProjectConstitution | undefined {
    return this.getCurrentConstitution(projectId);
  }

  public updateConstitution(
    projectId: string,
    orgId: string,
    newConfig: Partial<Omit<ProjectConstitution, 'id' | 'projectId' | 'version' | 'isCurrent' | 'createdAt'>>,
    actor: User,
    correlationId: string
  ): { success: boolean; constitution?: ProjectConstitution; error?: string } {
    const project = this.getProject(projectId, orgId);
    if (!project) return { success: false, error: 'Project not found.' };

    if (!this.hasPermission(actor.role, 'constitution.update')) {
      return { success: false, error: `Role ${actor.role} is not authorized to modify the Project Constitution.` };
    }

    const current = this.getCurrentConstitution(projectId);
    const version = current ? current.version + 1 : 1;
    const now = new Date().toISOString();

    if (current) {
      current.isCurrent = false;
    }

    const updated: ProjectConstitution = {
      id: `const-${projectId}-v${version}`,
      projectId,
      version,
      approvedStack: newConfig.approvedStack || current?.approvedStack || {
        frontend: 'React 18',
        backend: 'Node.js Express',
        database: 'PostgreSQL',
        deployment: 'Cloud Run'
      },
      securityClassification: newConfig.securityClassification || current?.securityClassification || 'CONFIDENTIAL',
      complianceProfiles: newConfig.complianceProfiles || current?.complianceProfiles || ['SOC2'],
      prohibitedDependencies: newConfig.prohibitedDependencies || current?.prohibitedDependencies || [],
      governanceRules: newConfig.governanceRules || current?.governanceRules || [],
      isCurrent: true,
      approvedBy: actor.id,
      createdAt: now
    };

    const list = this.constitutions.get(projectId) || [];
    list.push(updated);
    this.constitutions.set(projectId, list);

    this.recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'CONSTITUTION_UPDATED',
      targetEntity: 'ProjectConstitution',
      targetId: updated.id,
      projectId,
      beforeState: current as unknown as Record<string, unknown>,
      afterState: updated as unknown as Record<string, unknown>,
      correlationId
    });

    return { success: true, constitution: updated };
  }

  // ==========================================================================
  // REQUIREMENTS & PROVENANCE (Layer 2)
  // ==========================================================================

  public getRequirements(projectId: string): Requirement[] {
    return this.requirements.get(projectId) || [];
  }

  public createRequirement(
    projectId: string,
    orgId: string,
    reqData: Omit<Requirement, 'id' | 'projectId' | 'version' | 'isCurrent' | 'createdAt' | 'updatedAt' | 'ownerId'>,
    actor: User,
    correlationId: string
  ): { success: boolean; requirement?: Requirement; error?: string } {
    const project = this.getProject(projectId, orgId);
    if (!project) return { success: false, error: 'Project not found.' };

    if (!this.hasPermission(actor.role, 'requirement.create')) {
      return { success: false, error: `Role ${actor.role} cannot create requirements.` };
    }

    // AI recommendations or inferences cannot be initially APPROVED
    let status = reqData.status || 'PROPOSED';
    if (reqData.source === 'AI_RECOMMENDATION' || reqData.source === 'AI_INFERENCE') {
      status = 'PROPOSED';
    }

    const now = new Date().toISOString();
    const id = `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newReq: Requirement = {
      ...reqData,
      id,
      projectId,
      status,
      version: 1,
      isCurrent: true,
      ownerId: actor.id,
      createdAt: now,
      updatedAt: now
    };

    const list = this.requirements.get(projectId) || [];
    list.push(newReq);
    this.requirements.set(projectId, list);

    // If it is an AI recommendation, also add an item to the Decision Queue for human sign-off
    if (reqData.source === 'AI_RECOMMENDATION') {
      this.addDecisionQueueItem(projectId, {
        title: `AI Recommendation: ${reqData.reqIdentifier}`,
        description: reqData.description,
        category: 'RECOMMENDATION',
        priority: 'MEDIUM',
        status: 'PENDING',
        contextPayload: { requirementId: id, identifier: reqData.reqIdentifier },
        impactAnalysis: {
          scopeDelta: `Proposes adding requirement ${reqData.reqIdentifier}`,
          affectedTasks: [],
          riskScore: 0.2
        }
      });
    }

    this.recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'REQUIREMENT_CREATED',
      targetEntity: 'Requirement',
      targetId: id,
      projectId,
      afterState: newReq as unknown as Record<string, unknown>,
      correlationId
    });

    return { success: true, requirement: newReq };
  }

  public updateRequirementStatus(
    projectId: string,
    reqId: string,
    orgId: string,
    newStatus: RequirementStatus,
    actor: User,
    correlationId: string
  ): { success: boolean; requirement?: Requirement; error?: string } {
    const project = this.getProject(projectId, orgId);
    if (!project) return { success: false, error: 'Project not found.' };

    const list = this.requirements.get(projectId) || [];
    const req = list.find(r => r.id === reqId && r.isCurrent);
    if (!req) return { success: false, error: 'Requirement not found.' };

    // Approval requires explicit permission
    if (newStatus === 'APPROVED' && !this.hasPermission(actor.role, 'requirement.approve')) {
      return { success: false, error: `Role ${actor.role} does not have authority to approve requirements.` };
    }

    const previousStatus = req.status;
    req.status = newStatus;
    req.updatedAt = new Date().toISOString();
    if (newStatus === 'APPROVED') {
      req.approvedById = actor.id;
    }

    this.recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: `REQUIREMENT_STATUS_${newStatus}`,
      targetEntity: 'Requirement',
      targetId: reqId,
      projectId,
      beforeState: { status: previousStatus },
      afterState: { status: newStatus, approvedById: req.approvedById },
      correlationId
    });

    return { success: true, requirement: req };
  }

  // ==========================================================================
  // DECISIONS & HUMAN DECISION QUEUE
  // ==========================================================================

  public getDecisions(projectId: string): Decision[] {
    return this.decisions.get(projectId) || [];
  }

  public createDecision(
    projectId: string,
    orgId: string,
    decisionData: Omit<Decision, 'id' | 'projectId' | 'version' | 'createdAt' | 'updatedAt' | 'createdBy'>,
    actor: User,
    correlationId: string
  ): { success: boolean; decision?: Decision; error?: string } {
    const project = this.getProject(projectId, orgId);
    if (!project) return { success: false, error: 'Project not found.' };

    if (!this.hasPermission(actor.role, 'decision.create')) {
      return { success: false, error: `Role ${actor.role} cannot create decisions.` };
    }

    const now = new Date().toISOString();
    const id = `dec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newDecision: Decision = {
      ...decisionData,
      id,
      projectId,
      version: 1,
      createdBy: actor.id,
      createdAt: now,
      updatedAt: now
    };

    const list = this.decisions.get(projectId) || [];
    list.push(newDecision);
    this.decisions.set(projectId, list);

    this.recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'DECISION_CREATED',
      targetEntity: 'Decision',
      targetId: id,
      projectId,
      afterState: newDecision as unknown as Record<string, unknown>,
      correlationId
    });

    return { success: true, decision: newDecision };
  }

  public approveDecision(
    projectId: string,
    decisionId: string,
    orgId: string,
    actor: User,
    correlationId: string
  ): { success: boolean; decision?: Decision; error?: string } {
    const project = this.getProject(projectId, orgId);
    if (!project) return { success: false, error: 'Project not found.' };

    if (!this.hasPermission(actor.role, 'decision.approve')) {
      return { success: false, error: `Role ${actor.role} lacks authority to approve decisions.` };
    }

    const list = this.decisions.get(projectId) || [];
    const dec = list.find(d => d.id === decisionId);
    if (!dec) return { success: false, error: 'Decision not found.' };

    dec.status = 'APPROVED';
    dec.approvedBy = actor.id;
    dec.updatedAt = new Date().toISOString();

    this.recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'DECISION_APPROVED',
      targetEntity: 'Decision',
      targetId: decisionId,
      projectId,
      afterState: { status: 'APPROVED', approvedBy: actor.id },
      correlationId
    });

    return { success: true, decision: dec };
  }

  public getDecisionQueueItems(projectId: string): DecisionQueueItem[] {
    return this.decisionQueue.get(projectId) || [];
  }

  public getPendingDecisions(projectId: string): DecisionQueueItem[] {
    return (this.decisionQueue.get(projectId) || []).filter(i => i.status === 'PENDING');
  }

  public addDecisionQueueItem(projectId: string, item: Omit<DecisionQueueItem, 'id' | 'projectId' | 'createdAt'>): DecisionQueueItem {
    const id = `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newItem: DecisionQueueItem = {
      ...item,
      id,
      projectId,
      createdAt: new Date().toISOString()
    };

    const list = this.decisionQueue.get(projectId) || [];
    list.push(newItem);
    this.decisionQueue.set(projectId, list);
    return newItem;
  }

  public resolveDecisionQueueItem(
    projectId: string,
    itemId: string,
    orgId: string,
    action: 'APPROVED' | 'REJECTED' | 'DEFERRED',
    actor: User,
    notes: string,
    correlationId: string
  ): { success: boolean; item?: DecisionQueueItem; error?: string } {
    const project = this.getProject(projectId, orgId);
    if (!project) return { success: false, error: 'Project not found.' };

    const list = this.decisionQueue.get(projectId) || [];
    const item = list.find(i => i.id === itemId);
    if (!item) return { success: false, error: 'Queue item not found.' };

    item.status = action;
    item.resolvedBy = actor.id;
    item.resolutionNotes = notes;
    item.resolvedAt = new Date().toISOString();

    // If it was an AI recommendation and got approved, update the requirement status
    if (item.category === 'RECOMMENDATION' && action === 'APPROVED') {
      const reqId = (item.contextPayload as Record<string, unknown>)?.requirementId as string;
      if (reqId) {
        this.updateRequirementStatus(projectId, reqId, orgId, 'APPROVED', actor, correlationId);
      }
    }

    this.recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: `DECISION_QUEUE_ITEM_${action}`,
      targetEntity: 'DecisionQueueItem',
      targetId: itemId,
      projectId,
      afterState: { status: action, notes },
      correlationId
    });

    return { success: true, item };
  }

  // ==========================================================================
  // UNIVERSAL TASKS & SCOPE LOCK (Layer 3)
  // ==========================================================================

  public getTasks(projectId: string): UniversalTaskSpecification[] {
    return this.tasks.get(projectId) || [];
  }

  public getTask(taskId: string, projectId: string): UniversalTaskSpecification | undefined {
    const list = this.tasks.get(projectId) || [];
    return list.find(t => t.taskId === taskId || t.taskIdentifier === taskId);
  }

  public createTask(
    projectId: string,
    orgId: string,
    taskData: Omit<UniversalTaskSpecification, 'taskId' | 'projectId' | 'retryCount' | 'createdAt' | 'updatedAt'>,
    actor: User,
    correlationId: string
  ): { success: boolean; task?: UniversalTaskSpecification; error?: string } {
    const project = this.getProject(projectId, orgId);
    if (!project) return { success: false, error: 'Project not found.' };

    if (!this.hasPermission(actor.role, 'task.create')) {
      return { success: false, error: `Role ${actor.role} cannot create tasks.` };
    }

    const now = new Date().toISOString();
    const taskId = `tsk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTask: UniversalTaskSpecification = {
      ...taskData,
      taskId,
      projectId,
      retryCount: 0,
      createdAt: now,
      updatedAt: now
    };

    const list = this.tasks.get(projectId) || [];
    list.push(newTask);
    this.tasks.set(projectId, list);

    this.recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'TASK_CREATED',
      targetEntity: 'Task',
      targetId: taskId,
      projectId,
      afterState: newTask as unknown as Record<string, unknown>,
      correlationId
    });

    return { success: true, task: newTask };
  }

  public saveTask(
    projectId: string,
    task: UniversalTaskSpecification,
    actor?: User,
    correlationId: string = `corr-save-task-${Date.now()}`
  ): UniversalTaskSpecification {
    const list = this.tasks.get(projectId) || [];
    const idx = list.findIndex(t => t.taskId === task.taskId);
    if (idx >= 0) {
      list[idx] = task;
    } else {
      list.push(task);
    }
    this.tasks.set(projectId, list);

    if (actor) {
      this.recordAudit({
        actorId: actor.id,
        actorRole: actor.role,
        action: 'TASK_SAVED',
        targetEntity: 'Task',
        targetId: task.taskId,
        projectId,
        afterState: task as unknown as Record<string, unknown>,
        correlationId
      });
    }

    return task;
  }

  public updateTaskState(
    projectId: string,
    taskId: string,
    orgId: string,
    newState: TaskState,
    actor: User,
    correlationId: string
  ): { success: boolean; task?: UniversalTaskSpecification; error?: string } {
    const project = this.getProject(projectId, orgId);
    if (!project) return { success: false, error: 'Project not found.' };

    if (!this.hasPermission(actor.role, 'task.state_transition')) {
      return { success: false, error: `Role ${actor.role} cannot transition task states.` };
    }

    const list = this.tasks.get(projectId) || [];
    const task = list.find(t => t.taskId === taskId);
    if (!task) return { success: false, error: 'Task not found.' };

    const previousState = task.state;
    task.state = newState;
    task.updatedAt = new Date().toISOString();

    this.recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'TASK_STATE_TRANSITION',
      targetEntity: 'Task',
      targetId: taskId,
      projectId,
      beforeState: { state: previousState },
      afterState: { state: newState },
      correlationId
    });

    return { success: true, task };
  }

  /**
   * Scope Lock Verification:
   * Asserts whether a modified file list is strictly contained within task.relevantFiles
   * and contains no prohibited actions.
   */
  public verifyTaskScope(
    taskId: string,
    projectId: string,
    filesModified: string[],
    actionRequested: string
  ): { allowed: boolean; violationReason?: string } {
    const tasks = this.getTasks(projectId);
    const task = tasks.find(t => t.taskId === taskId);
    if (!task) {
      return { allowed: false, violationReason: 'Task not found.' };
    }

    // Check prohibited actions
    if (task.prohibitedActions.includes(actionRequested)) {
      return {
        allowed: false,
        violationReason: `Action '${actionRequested}' is explicitly prohibited by Scope Lock.`
      };
    }

    // Check file scope
    const allowedWritablePaths = task.relevantFiles
      .filter(f => !f.readOnly)
      .map(f => f.path);

    for (const modified of filesModified) {
      const isAllowed = allowedWritablePaths.some(allowed => 
        modified === allowed || modified.startsWith(allowed.replace(/\*$/, ''))
      );
      if (!isAllowed) {
        return {
          allowed: false,
          violationReason: `Scope Lock Violation: File '${modified}' is outside task.relevantFiles allowed boundary.`
        };
      }
    }

    return { allowed: true };
  }

  // ==========================================================================
  // AUDIT TRAIL (Immutable Event Stream)
  // ==========================================================================

  public recordAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(fullEntry); // newest first
    return fullEntry;
  }

  public createAuditLogEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    return this.recordAudit(entry);
  }

  public getAuditLogs(projectId?: string): AuditLogEntry[] {
    if (projectId) {
      return this.auditLogs.filter(a => a.projectId === projectId);
    }
    return this.auditLogs;
  }

  // ==========================================================================
  // PHASE 7: VALIDATION, SECURITY & DRIFT STORAGE ENGINE
  // ==========================================================================

  public getValidationContracts(projectId: string): ValidationContract[] {
    return this.validationContracts.get(projectId) || [];
  }

  public getValidationFailures(projectId: string): ValidationFailure[] {
    const contracts = this.getValidationContracts(projectId);
    const list: ValidationFailure[] = [];
    for (const c of contracts) {
      if (c.failures) list.push(...c.failures);
    }
    return list;
  }

  public getValidationContract(id: string, projectId: string): ValidationContract | undefined {
    const list = this.getValidationContracts(projectId);
    return list.find(c => c.id === id);
  }

  public saveValidationContract(
    contract: ValidationContract,
    actorId: string,
    actorRole: UserRole
  ): ValidationContract {
    const list = this.getValidationContracts(contract.projectId);
    const existingIndex = list.findIndex(c => c.id === contract.id);

    if (existingIndex >= 0) {
      list[existingIndex] = { ...contract };
    } else {
      list.unshift(contract);
    }
    this.validationContracts.set(contract.projectId, list);

    this.recordAudit({
      actorId,
      actorRole,
      action: existingIndex >= 0 ? 'VALIDATION_CONTRACT_UPDATED' : 'VALIDATION_CONTRACT_CREATED',
      targetEntity: 'ValidationContract',
      targetId: contract.id,
      projectId: contract.projectId,
      afterState: { status: contract.status, failures: contract.failures.length, proof: contract.proofOfCompletion },
      correlationId: `corr-val-${Date.now()}`
    });

    return contract;
  }

  public waiveValidation(
    contractId: string,
    projectId: string,
    failureId: string,
    actorOrReason: User | string,
    reasonOrActorId?: string,
    actorRoleOrExpiration?: UserRole | string
  ): ValidationContract {
    let waiverReason: string;
    let actorId: string;
    let actorRole: UserRole;

    if (typeof actorOrReason === 'object' && actorOrReason !== null && 'role' in actorOrReason) {
      actorId = actorOrReason.id;
      actorRole = actorOrReason.role;
      waiverReason = reasonOrActorId || 'Waived by Project Lead under governance authority.';
    } else {
      waiverReason = String(actorOrReason);
      actorId = reasonOrActorId || 'usr-lead';
      actorRole = (actorRoleOrExpiration as UserRole) || 'PROJECT_LEAD';
    }

    // RBAC: Only PROJECT_LEAD or SECURITY can waive
    if (actorRole !== 'PROJECT_LEAD' && actorRole !== 'SECURITY') {
      throw new Error(`Unauthorized: Role '${actorRole}' lacks permission to waive validation failures.`);
    }

    const contract = this.getValidationContract(contractId, projectId);
    if (!contract) {
      throw new Error(`Validation contract '${contractId}' not found.`);
    }

    const failure = contract.failures.find(f => f.id === failureId);
    if (!failure) {
      throw new Error(`Failure '${failureId}' not found in contract '${contractId}'.`);
    }

    // Critical failures cannot be waived
    if (failure.severity === 'CRITICAL') {
      throw new Error(`Violation: CRITICAL severity failures cannot be waived under Project Governance.`);
    }

    failure.waived = true;
    failure.waiverReason = waiverReason;
    failure.waivedBy = `${actorId} (${actorRole})`;
    failure.waivedAt = new Date().toISOString();

    // Check if all failures are waived or resolved
    const unhandledFailures = contract.failures.filter(f => !f.waived);
    if (unhandledFailures.length === 0) {
      contract.status = 'WAIVED';
    }

    this.saveValidationContract(contract, actorId, actorRole);

    this.recordAudit({
      actorId,
      actorRole,
      action: 'VALIDATION_FAILURE_WAIVED',
      targetEntity: 'ValidationContract',
      targetId: contract.id,
      projectId,
      afterState: { failureId, waiverReason, waivedBy: actorId },
      correlationId: `corr-waive-${Date.now()}`
    });

    return contract;
  }

  public getValidationRules(projectId: string): ValidationRule[] {
    return this.validationRules.get(projectId) || [];
  }

  public saveValidationRule(
    rule: ValidationRule,
    actorId: string,
    actorRole: UserRole,
    projectId: string
  ): ValidationRule {
    const list = this.getValidationRules(projectId);
    const idx = list.findIndex(r => r.id === rule.id);
    if (idx >= 0) {
      list[idx] = { ...rule };
    } else {
      list.push(rule);
    }
    this.validationRules.set(projectId, list);
    return rule;
  }

  public getValidationGates(projectId: string): ValidationGate[] {
    return this.validationGates.get(projectId) || [];
  }

  public saveValidationGate(
    gate: ValidationGate,
    actorId: string,
    actorRole: UserRole,
    projectId: string
  ): ValidationGate {
    const list = this.getValidationGates(projectId);
    const idx = list.findIndex(g => g.id === gate.id);
    if (idx >= 0) {
      list[idx] = { ...gate };
    } else {
      list.push(gate);
    }
    this.validationGates.set(projectId, list.sort((a, b) => a.order - b.order));
    return gate;
  }

  public getSecurityFindings(projectId: string): SecurityFinding[] {
    return this.securityFindings.get(projectId) || [];
  }

  public getSecurityFinding(id: string, projectId: string): SecurityFinding | undefined {
    const list = this.getSecurityFindings(projectId);
    return list.find(f => f.id === id);
  }

  public saveSecurityFinding(
    finding: SecurityFinding,
    actorId: string,
    actorRole: UserRole
  ): SecurityFinding {
    const list = this.getSecurityFindings(finding.projectId);
    const idx = list.findIndex(f => f.id === finding.id);
    if (idx >= 0) {
      list[idx] = { ...finding };
    } else {
      list.unshift(finding);
    }
    this.securityFindings.set(finding.projectId, list);

    this.recordAudit({
      actorId,
      actorRole,
      action: idx >= 0 ? 'SECURITY_FINDING_UPDATED' : 'SECURITY_FINDING_RECORDED',
      targetEntity: 'SecurityFinding',
      targetId: finding.id,
      projectId: finding.projectId,
      afterState: { severity: finding.severity, status: finding.status, stopCondition: finding.isStopConditionTriggered },
      correlationId: `corr-sec-${Date.now()}`
    });

    return finding;
  }

  public updateSecurityFindingStatus(
    id: string,
    projectId: string,
    status: SecurityFinding['status'],
    actorOrNotes: User | string,
    notesOrActorId?: string,
    actorRoleParam?: UserRole
  ): SecurityFinding {
    let resolutionNotes: string;
    let actorId: string;
    let actorRole: UserRole;

    if (typeof actorOrNotes === 'object' && actorOrNotes !== null && 'role' in actorOrNotes) {
      actorId = actorOrNotes.id;
      actorRole = actorOrNotes.role;
      resolutionNotes = notesOrActorId || 'Resolved through security workflow.';
    } else {
      resolutionNotes = String(actorOrNotes);
      actorId = notesOrActorId || 'usr-lead';
      actorRole = actorRoleParam || 'PROJECT_LEAD';
    }

    const finding = this.getSecurityFinding(id, projectId);
    if (!finding) {
      throw new Error(`Security finding '${id}' not found.`);
    }

    // Agent self-certification restriction: Developer cannot mark their own security findings RESOLVED without Lead/Security review
    if (status === 'RESOLVED' && actorRole === 'DEVELOPER') {
      throw new Error('Invariant Violation: Developers cannot self-certify resolution of Security Findings without Project Lead or Security sign-off.');
    }

    finding.status = status;
    finding.resolutionNotes = resolutionNotes;
    finding.resolvedByRole = actorRole;
    if (status === 'RESOLVED') {
      finding.resolvedAt = new Date().toISOString();
    }

    return this.saveSecurityFinding(finding, actorId, actorRole);
  }

  public getThreatModels(projectId: string): ThreatModel[] {
    return this.threatModels.get(projectId) || [];
  }

  public saveThreatModel(
    tm: ThreatModel,
    actorId: string,
    actorRole: UserRole
  ): ThreatModel {
    const list = this.getThreatModels(tm.projectId);
    const idx = list.findIndex(t => t.id === tm.id);
    if (idx >= 0) {
      list[idx] = { ...tm };
    } else {
      list.push(tm);
    }
    this.threatModels.set(tm.projectId, list);
    return tm;
  }

  public getTrustBoundaries(): TrustBoundary[] {
    return this.trustBoundaries;
  }

  public setTrustBoundaries(boundaries: TrustBoundary[]): void {
    this.trustBoundaries = boundaries;
  }

  public getDataFlows(projectId: string): DataFlowRecord[] {
    return this.dataFlows.get(projectId) || [];
  }

  public saveDataFlow(df: DataFlowRecord): DataFlowRecord {
    const list = this.getDataFlows(df.projectId);
    const idx = list.findIndex(d => d.id === df.id);
    if (idx >= 0) list[idx] = df;
    else list.push(df);
    this.dataFlows.set(df.projectId, list);
    return df;
  }

  public getComplianceControls(projectId: string): ComplianceControl[] {
    return this.complianceControls.get(projectId) || [];
  }

  public saveComplianceControl(
    cc: ComplianceControl,
    actorId: string,
    actorRole: UserRole
  ): ComplianceControl {
    const list = this.getComplianceControls(cc.projectId);
    const idx = list.findIndex(c => c.id === cc.id);
    if (idx >= 0) {
      list[idx] = { ...cc };
    } else {
      list.push(cc);
    }
    this.complianceControls.set(cc.projectId, list);
    return cc;
  }

  public getSecurityIncidents(projectId: string): SecurityIncident[] {
    return this.securityIncidents.get(projectId) || [];
  }

  public saveSecurityIncident(
    incident: SecurityIncident,
    actorId: string,
    actorRole: UserRole
  ): SecurityIncident {
    const list = this.getSecurityIncidents(incident.projectId);
    const idx = list.findIndex(i => i.id === incident.id);
    if (idx >= 0) {
      list[idx] = { ...incident };
    } else {
      list.unshift(incident);
    }
    this.securityIncidents.set(incident.projectId, list);

    this.recordAudit({
      actorId,
      actorRole,
      action: idx >= 0 ? 'SECURITY_INCIDENT_UPDATED' : 'SECURITY_INCIDENT_CREATED',
      targetEntity: 'SecurityIncident',
      targetId: incident.id,
      projectId: incident.projectId,
      afterState: { severity: incident.severity, status: incident.status },
      correlationId: `corr-inc-${Date.now()}`
    });

    return incident;
  }

  public getDriftRecords(projectId: string): DriftRecord[] {
    return this.driftRecords.get(projectId) || [];
  }

  public getDriftRecord(id: string, projectId: string): DriftRecord | undefined {
    const list = this.getDriftRecords(projectId);
    return list.find(d => d.id === id);
  }

  public saveDriftRecord(
    drift: DriftRecord,
    actorId: string,
    actorRole: UserRole
  ): DriftRecord {
    const list = this.getDriftRecords(drift.projectId);
    const idx = list.findIndex(d => d.id === drift.id);
    if (idx >= 0) {
      list[idx] = { ...drift };
    } else {
      list.unshift(drift);
    }
    this.driftRecords.set(drift.projectId, list);

    this.recordAudit({
      actorId,
      actorRole,
      action: idx >= 0 ? 'DRIFT_RECORD_UPDATED' : 'DRIFT_RECORD_DETECTED',
      targetEntity: 'DriftRecord',
      targetId: drift.id,
      projectId: drift.projectId,
      afterState: { type: drift.type, classification: drift.classification, severity: drift.severity },
      correlationId: `corr-drift-${Date.now()}`
    });

    return drift;
  }

  public resolveDriftRecord(
    id: string,
    projectId: string,
    status: DriftRecord['status'],
    resolution: string,
    authority: string,
    actorId: string,
    actorRole: UserRole
  ): DriftRecord {
    const drift = this.getDriftRecord(id, projectId);
    if (!drift) {
      throw new Error(`Drift record '${id}' not found.`);
    }

    drift.status = status;
    drift.resolution = resolution;
    drift.authority = authority;
    drift.resolvedAt = new Date().toISOString();

    return this.saveDriftRecord(drift, actorId, actorRole);
  }

  public getRegressionRuns(projectId: string): RegressionRunRecord[] {
    return this.regressionRuns.get(projectId) || [];
  }

  public saveRegressionRun(run: RegressionRunRecord): RegressionRunRecord {
    const list = this.getRegressionRuns(run.projectId);
    list.unshift(run);
    this.regressionRuns.set(run.projectId, list);
    return run;
  }

  public getRiskAcceptances(projectId: string): RiskAcceptanceRecord[] {
    return this.riskAcceptances.get(projectId) || [];
  }

  public saveRiskAcceptance(
    risk: RiskAcceptanceRecord,
    actorId: string,
    actorRole: UserRole
  ): RiskAcceptanceRecord {
    if (actorRole !== 'PROJECT_LEAD' && actorRole !== 'SECURITY') {
      throw new Error(`Unauthorized: Role '${actorRole}' cannot accept project risks. Project Lead or Security authority required.`);
    }

    const list = this.getRiskAcceptances(risk.projectId);
    const idx = list.findIndex(r => r.id === risk.id);
    if (idx >= 0) {
      list[idx] = { ...risk };
    } else {
      list.unshift(risk);
    }
    this.riskAcceptances.set(risk.projectId, list);

    // If findingId is attached, update finding status to ACCEPTED_RISK
    if (risk.findingId) {
      const finding = this.getSecurityFinding(risk.findingId, risk.projectId);
      if (finding) {
        finding.status = 'ACCEPTED_RISK';
        finding.resolutionNotes = `Risk accepted by ${actorId} (${actorRole}) until ${risk.expirationDate}. Mitigation: ${risk.mitigation}`;
        this.saveSecurityFinding(finding, actorId, actorRole);
      }
    }

    this.recordAudit({
      actorId,
      actorRole,
      action: 'RISK_ACCEPTANCE_RECORDED',
      targetEntity: 'RiskAcceptance',
      targetId: risk.id,
      projectId: risk.projectId,
      afterState: { risk: risk.risk, expiration: risk.expirationDate, mitigation: risk.mitigation },
      correlationId: `corr-risk-${Date.now()}`
    });

    return risk;
  }

  public getValidationReviewQueue(projectId: string): Array<{
    id: string;
    type: 'CRITICAL_FAILURE' | 'SECURITY_FINDING' | 'UNRESOLVED_DRIFT' | 'RISK_EXPIRATION' | 'INCIDENT';
    title: string;
    severity: ValidationSeverity;
    component: string;
    createdAt: string;
    details: any;
  }> {
    const items: Array<{
      id: string;
      type: 'CRITICAL_FAILURE' | 'SECURITY_FINDING' | 'UNRESOLVED_DRIFT' | 'RISK_EXPIRATION' | 'INCIDENT';
      title: string;
      severity: ValidationSeverity;
      component: string;
      createdAt: string;
      details: any;
    }> = [];

    // 1. Critical or blocked validation failures
    const contracts = this.getValidationContracts(projectId);
    for (const c of contracts) {
      for (const f of c.failures) {
        if (!f.waived && (f.severity === 'CRITICAL' || f.severity === 'HIGH')) {
          items.push({
            id: `q-val-${f.id}`,
            type: 'CRITICAL_FAILURE',
            title: `Validation Failure: ${f.whatFailed}`,
            severity: f.severity,
            component: f.affectedComponent || 'System Core',
            createdAt: c.createdAt,
            details: { contractId: c.id, failureId: f.id, expected: f.expectedBehavior, observed: f.observedBehavior }
          });
        }
      }
    }

    // 2. Open Security Findings
    const findings = this.getSecurityFindings(projectId);
    for (const f of findings) {
      if (f.status === 'OPEN' || f.status === 'ACKNOWLEDGED') {
        items.push({
          id: `q-sec-${f.id}`,
          type: 'SECURITY_FINDING',
          title: `Security Finding: ${f.description}`,
          severity: f.severity,
          component: f.affectedComponent,
          createdAt: f.createdAt,
          details: { findingId: f.id, exploitability: f.exploitability, remediation: f.recommendedRemediation }
        });
      }
    }

    // 3. Unauthorized or Unknown Drift
    const drifts = this.getDriftRecords(projectId);
    for (const d of drifts) {
      if (d.status === 'DETECTED' || d.status === 'CLASSIFIED') {
        items.push({
          id: `q-drift-${d.id}`,
          type: 'UNRESOLVED_DRIFT',
          title: `Unresolved Drift: ${d.type} (${d.classification})`,
          severity: d.severity,
          component: d.affectedComponents[0] || 'Repository',
          createdAt: d.detectedAt,
          details: { driftId: d.id, difference: d.difference, recommendedAction: d.recommendedAction }
        });
      }
    }

    // 4. Active Security Incidents
    const incidents = this.getSecurityIncidents(projectId);
    for (const inc of incidents) {
      if (inc.status === 'OPEN' || inc.status === 'CONTAINING') {
        items.push({
          id: `q-inc-${inc.id}`,
          type: 'INCIDENT',
          title: `Security Incident: ${inc.id} on ${inc.affectedComponent}`,
          severity: inc.severity,
          component: inc.affectedComponent,
          createdAt: inc.detectedAt,
          details: { incidentId: inc.id, containment: inc.containmentActions }
        });
      }
    }

    return items.sort((a, b) => {
      const rank: Record<ValidationSeverity, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0 };
      return rank[b.severity] - rank[a.severity];
    });
  }

  public getValidationOverviewMetrics(projectId: string): ValidationOverviewMetrics {
    const contracts = this.getValidationContracts(projectId);
    const findings = this.getSecurityFindings(projectId);
    const incidents = this.getSecurityIncidents(projectId);
    const drifts = this.getDriftRecords(projectId);
    const regressions = this.getRegressionRuns(projectId);
    const risks = this.getRiskAcceptances(projectId);
    const queue = this.getValidationReviewQueue(projectId);

    return {
      activeValidations: contracts.length,
      passedValidations: contracts.filter(c => c.status === 'PASSED').length,
      failedValidations: contracts.filter(c => c.status === 'FAILED').length,
      blockedValidations: contracts.filter(c => c.status === 'BLOCKED').length,
      criticalFailures: contracts.reduce((acc, c) => acc + c.failures.filter(f => f.severity === 'CRITICAL' && !f.waived).length, 0),
      openSecurityFindings: findings.filter(f => f.status === 'OPEN' || f.status === 'ACKNOWLEDGED').length,
      activeSecurityIncidents: incidents.filter(i => i.status === 'OPEN' || i.status === 'CONTAINING').length,
      activeDriftCount: drifts.filter(d => d.status !== 'RESOLVED' && d.status !== 'CLOSED').length,
      unauthorizedDriftCount: drifts.filter(d => d.classification === 'UNAUTHORIZED' && d.status !== 'RESOLVED').length,
      regressionFailureCount: regressions.filter(r => r.status === 'FAILED').length,
      pendingReviewCount: queue.length,
      activeRiskAcceptances: risks.filter(r => r.active).length
    };
  }

  // ==========================================================================
  // PHASE 8: OPTIMIZATION INTELLIGENCE (Storage Methods)
  // ==========================================================================

  public recordTelemetry(event: TelemetryEvent): TelemetryEvent {
    const list = this.telemetryEvents.get(event.projectId) || [];
    list.unshift(event);
    if (list.length > 500) list.pop();
    this.telemetryEvents.set(event.projectId, list);
    return event;
  }

  public getTelemetry(projectId: string, orgId?: string, eventType?: TelemetryEventType, limit: number = 100): TelemetryEvent[] {
    const list = this.telemetryEvents.get(projectId) || [];
    let filtered = list;
    if (orgId) {
      filtered = filtered.filter(e => e.organizationId === orgId);
    }
    if (eventType) {
      filtered = filtered.filter(e => e.eventType === eventType);
    }
    return filtered.slice(0, limit);
  }

  public recordCostEvent(event: CostEvent): CostEvent {
    const list = this.costEvents.get(event.projectId) || [];
    list.unshift(event);
    this.costEvents.set(event.projectId, list);
    return event;
  }

  public getCostEvents(projectId: string): CostEvent[] {
    return this.costEvents.get(projectId) || [];
  }

  public saveCostEstimate(estimate: CostEstimate): CostEstimate {
    const list = this.costEstimates.get(estimate.projectId) || [];
    const idx = list.findIndex(e => e.estimateId === estimate.estimateId);
    if (idx >= 0) {
      list[idx] = estimate;
    } else {
      list.unshift(estimate);
    }
    this.costEstimates.set(estimate.projectId, list);
    return estimate;
  }

  public getCostEstimates(projectId: string): CostEstimate[] {
    return this.costEstimates.get(projectId) || [];
  }

  public getCostModel(orgId: string): CostModel {
    const models = this.costModels.get(orgId) || [];
    if (models.length > 0) return models[0];
    const defaultModel: CostModel = {
      id: `model-${orgId}-default`,
      organizationId: orgId,
      name: 'Arcadia Standard Resource Rates',
      currency: 'USD',
      rates: {
        inputTokenPer1k: 0.0015,
        outputTokenPer1k: 0.0045,
        contextRetrievalPerCall: 0.002,
        automatedTestPerRun: 0.015,
        securityScanPerRun: 0.05,
        humanReviewHourRate: 85.0,
        infrastructureBasePerTask: 0.02
      },
      effectiveDate: '2026-01-01',
      version: 1
    };
    this.costModels.set(orgId, [defaultModel]);
    return defaultModel;
  }

  public recordTimeEvent(event: TimeEvent): TimeEvent {
    const list = this.timeEvents.get(event.projectId) || [];
    list.unshift(event);
    this.timeEvents.set(event.projectId, list);
    return event;
  }

  public getTimeEvents(projectId: string): TimeEvent[] {
    return this.timeEvents.get(projectId) || [];
  }

  public recordTrustEvent(event: TrustEvent): TrustEvent {
    const list = this.trustEvents.get(event.projectId) || [];
    list.unshift(event);
    this.trustEvents.set(event.projectId, list);
    return event;
  }

  public getTrustEvents(projectId: string, agentId?: string): TrustEvent[] {
    const list = this.trustEvents.get(projectId) || [];
    if (agentId) {
      return list.filter(e => e.agentId === agentId);
    }
    return list;
  }

  public getOptimizationRecommendations(projectId: string): OptimizationRecommendation[] {
    return this.optimizationRecommendations.get(projectId) || [];
  }

  public createOptimizationRecommendation(
    rec: OptimizationRecommendation,
    actorId: string,
    actorRole: UserRole
  ): OptimizationRecommendation {
    const list = this.optimizationRecommendations.get(rec.projectId) || [];
    list.unshift(rec);
    this.optimizationRecommendations.set(rec.projectId, list);

    this.recordAudit({
      actorId,
      actorRole,
      action: 'OPTIMIZATION_RECOMMENDATION_CREATED',
      targetEntity: 'OptimizationRecommendation',
      targetId: rec.id,
      projectId: rec.projectId,
      afterState: { category: rec.category, proposedStrategy: rec.proposedStrategy, impact: rec.securityImpact },
      correlationId: `corr-opt-${Date.now()}`
    });

    return rec;
  }

  public updateOptimizationRecommendationStatus(
    id: string,
    projectId: string,
    status: OptimizationStatus,
    actorId: string,
    actorRole: UserRole,
    resultNote?: string
  ): { success: boolean; recommendation?: OptimizationRecommendation; error?: string } {
    const list = this.optimizationRecommendations.get(projectId) || [];
    const rec = list.find(r => r.id === id);
    if (!rec) {
      return { success: false, error: 'Recommendation not found' };
    }

    // Invariant: Developers or Agents cannot approve their own high-impact recommendations
    if ((status === 'APPROVED' || status === 'APPLIED') && 
        (rec.securityImpact === 'HIGH' || rec.governanceImpact === 'HIGH' || rec.requiredAuthority === 'PROJECT_LEAD') && 
        actorRole !== 'PROJECT_LEAD' && actorRole !== 'SECURITY' && actorRole !== 'ARCHITECT') {
      return { success: false, error: 'Authorization denied: High-impact recommendations require Project Lead or Security approval.' };
    }

    const previousStatus = rec.status;
    rec.status = status;
    if (status === 'APPROVED') {
      rec.reviewedAt = new Date().toISOString();
      rec.reviewedBy = actorId;
    } else if (status === 'APPLIED') {
      rec.appliedAt = new Date().toISOString();
      rec.appliedBy = actorId;
      rec.result = resultNote || 'Intervention executed and active.';
    } else if (status === 'REVERTED') {
      rec.result = resultNote || 'Intervention reverted by authority.';
    }

    this.recordAudit({
      actorId,
      actorRole,
      action: `OPTIMIZATION_STATUS_${status}`,
      targetEntity: 'OptimizationRecommendation',
      targetId: rec.id,
      projectId: rec.projectId,
      beforeState: { status: previousStatus },
      afterState: { status: rec.status, result: rec.result },
      correlationId: `corr-opt-status-${Date.now()}`
    });

    return { success: true, recommendation: rec };
  }

  public getOptimizationPolicies(orgId: string, projectId?: string): OptimizationPolicy[] {
    const orgPolicies = this.optimizationPolicies.get(orgId) || [];
    if (projectId) {
      return orgPolicies.filter(p => !p.projectId || p.projectId === projectId);
    }
    return orgPolicies;
  }

  public saveOptimizationPolicy(
    policy: OptimizationPolicy,
    actorId: string,
    actorRole: UserRole
  ): OptimizationPolicy {
    const list = this.optimizationPolicies.get(policy.organizationId) || [];
    const idx = list.findIndex(p => p.id === policy.id);
    if (idx >= 0) {
      list[idx] = policy;
    } else {
      list.push(policy);
    }
    this.optimizationPolicies.set(policy.organizationId, list);

    this.recordAudit({
      actorId,
      actorRole,
      action: 'OPTIMIZATION_POLICY_UPDATED',
      targetEntity: 'OptimizationPolicy',
      targetId: policy.id,
      projectId: policy.projectId || 'org-level',
      afterState: { version: policy.version, status: policy.status },
      correlationId: `corr-policy-${Date.now()}`
    });

    return policy;
  }

  public recordOptimizationAction(action: OptimizationAction): OptimizationAction {
    const targetProject = (this.projects.values().next().value as Project)?.id || 'proj-arcadia-core-01';
    const list = this.optimizationActions.get(targetProject) || [];
    list.unshift(action);
    this.optimizationActions.set(targetProject, list);
    return action;
  }

  public getOptimizationActions(projectId: string): OptimizationAction[] {
    return this.optimizationActions.get(projectId) || [];
  }

  public getOptimizationExperiments(projectId: string): OptimizationExperiment[] {
    return this.optimizationExperiments.get(projectId) || [];
  }

  public createOptimizationExperiment(experiment: OptimizationExperiment): OptimizationExperiment {
    const list = this.optimizationExperiments.get(experiment.projectId) || [];
    list.unshift(experiment);
    this.optimizationExperiments.set(experiment.projectId, list);
    return experiment;
  }

  public getOptimizationOverviewMetrics(projectId: string): OptimizationOverviewMetrics {
    const costEvents = this.getCostEvents(projectId);
    const totalCostToDate = costEvents.reduce((acc, c) => acc + c.amount, 0);
    const recs = this.getOptimizationRecommendations(projectId);
    const appliedCount = recs.filter(r => r.status === 'APPLIED' || r.status === 'SUCCESSFUL').length;
    const trustEvents = this.getTrustEvents(projectId);
    const positiveTrust = trustEvents.filter(t => t.outcome === 'SUCCESS').length;
    const avgTrust = trustEvents.length > 0 ? Math.round((positiveTrust / trustEvents.length) * 100) : 94;

    return {
      totalCostToDate: Number(totalCostToDate.toFixed(2)),
      estimatedRemainingCost: 4.85,
      costVariancePercent: -12.4, // 12.4% below estimated budget
      criticalPathDurationHours: 14.5,
      scheduleRiskLevel: 'LOW',
      workflowLoadLevel: 'NORMAL',
      cognitiveLoadScore: 28, // 28/100
      activeRecommendationsCount: recs.filter(r => r.status === 'PROPOSED' || r.status === 'REVIEW_REQUIRED').length,
      appliedInterventionsCount: appliedCount,
      avgTrustScore: avgTrust,
      savingsGenerated: appliedCount * 1.45
    };
  }

  // ==========================================================================
  // PHASE 9: CONTINUOUS LEARNING, ORGANIZATIONAL MEMORY & SYSTEM EVOLUTION
  // ==========================================================================

  public getMemories(projectId: string, orgId?: string): OrganizationalMemory[] {
    const list = this.organizationalMemories.get(projectId) || [];
    if (orgId) {
      return list.filter(m => m.organizationId === orgId);
    }
    return list;
  }

  public getOrganizationalMemories(projectId: string, orgId?: string): OrganizationalMemory[] {
    return this.getMemories(projectId, orgId);
  }

  public getMemory(id: string): OrganizationalMemory | undefined {
    for (const list of this.organizationalMemories.values()) {
      const found = list.find(m => m.id === id);
      if (found) return found;
    }
    return undefined;
  }

  public createMemory(memory: OrganizationalMemory): OrganizationalMemory {
    const list = this.organizationalMemories.get(memory.projectId) || [];
    list.unshift(memory);
    this.organizationalMemories.set(memory.projectId, list);
    return memory;
  }

  public updateMemory(id: string, updates: Partial<OrganizationalMemory>): OrganizationalMemory | undefined {
    for (const [projId, list] of this.organizationalMemories.entries()) {
      const idx = list.findIndex(m => m.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates, updatedTimestamp: new Date().toISOString() };
        this.organizationalMemories.set(projId, list);
        return list[idx];
      }
    }
    return undefined;
  }

  public verifyMemory(
    id: string,
    verifierId: string,
    verifierRole: UserRole,
    method: 'MANUAL_HUMAN' | 'AUTOMATED_VALIDATION' | 'CONSENSUS_AUDIT' = 'MANUAL_HUMAN'
  ): OrganizationalMemory | undefined {
    const mem = this.getMemory(id);
    if (!mem) return undefined;

    const updated = this.updateMemory(id, {
      status: 'VERIFIED',
      provenance: {
        ...mem.provenance,
        verifiedBy: verifierId,
        verifiedAt: new Date().toISOString(),
        verificationMethod: method,
        confidenceScore: Math.min(1.0, (mem.provenance.confidenceScore || 0.8) + 0.15)
      }
    });
    return updated;
  }

  public getPatterns(projectId: string): DetectedPattern[] {
    return this.detectedPatterns.get(projectId) || [];
  }

  public savePattern(pattern: DetectedPattern): DetectedPattern {
    const list = this.detectedPatterns.get(pattern.projectId) || [];
    const existingIndex = list.findIndex(p => p.id === pattern.id || p.signature === pattern.signature);
    if (existingIndex >= 0) {
      list[existingIndex] = {
        ...list[existingIndex],
        ...pattern,
        occurrenceCount: list[existingIndex].occurrenceCount + 1,
        lastSeen: new Date().toISOString()
      };
    } else {
      list.unshift(pattern);
    }
    this.detectedPatterns.set(pattern.projectId, list);
    return pattern;
  }

  public resolvePattern(id: string): boolean {
    for (const [projId, list] of this.detectedPatterns.entries()) {
      const idx = list.findIndex(p => p.id === id);
      if (idx !== -1) {
        list[idx].resolved = true;
        list[idx].resolvedAt = new Date().toISOString();
        this.detectedPatterns.set(projId, list);
        return true;
      }
    }
    return false;
  }

  public getLearningMetricSnapshots(projectId: string): LearningMetricSnapshot[] {
    return this.learningMetricSnapshots.get(projectId) || [];
  }

  public saveLearningMetricSnapshot(snap: LearningMetricSnapshot): LearningMetricSnapshot {
    const list = this.learningMetricSnapshots.get(snap.projectId) || [];
    list.unshift(snap);
    this.learningMetricSnapshots.set(snap.projectId, list);
    return snap;
  }

  public getEvolutionProposals(projectId: string): EvolutionProposal[] {
    return this.evolutionProposals.get(projectId) || [];
  }

  public getEvolutionProposal(id: string): EvolutionProposal | undefined {
    for (const list of this.evolutionProposals.values()) {
      const found = list.find(p => p.id === id);
      if (found) return found;
    }
    return undefined;
  }

  public createEvolutionProposal(proposal: EvolutionProposal): EvolutionProposal {
    const list = this.evolutionProposals.get(proposal.projectId) || [];
    list.unshift(proposal);
    this.evolutionProposals.set(proposal.projectId, list);
    return proposal;
  }

  public updateEvolutionProposal(id: string, updates: Partial<EvolutionProposal>): EvolutionProposal | undefined {
    for (const [projId, list] of this.evolutionProposals.entries()) {
      const idx = list.findIndex(p => p.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        this.evolutionProposals.set(projId, list);
        return list[idx];
      }
    }
    return undefined;
  }

  public getLearningOverview(projectId: string): LearningOverviewMetrics {
    const memories = this.getMemories(projectId);
    const patterns = this.getPatterns(projectId);
    const proposals = this.getEvolutionProposals(projectId);
    const verifiedMemories = memories.filter(m => m.status === 'VERIFIED' || m.status === 'ACTIVE').length;
    const activePatterns = patterns.filter(p => !p.resolved).length;
    const antiPatterns = patterns.filter(p => p.category === 'ANTI_PATTERN' && !p.resolved).length;
    const appliedMutations = proposals.filter(p => p.status === 'APPLIED').length;

    let resilience = 75;
    resilience += Math.min(15, verifiedMemories * 3);
    resilience -= Math.min(25, antiPatterns * 5);
    resilience += Math.min(10, appliedMutations * 2);
    resilience = Math.max(10, Math.min(100, resilience));

    return {
      totalMemoriesCount: memories.length,
      verifiedMemoriesCount: verifiedMemories,
      activePatternsCount: activePatterns,
      antiPatternsIdentified: antiPatterns,
      averageQualityYield: 94.2,
      evolutionProposalsCount: proposals.length,
      appliedMutationsCount: appliedMutations,
      systemResilienceScore: resilience
    };
  }

  // ==========================================================================
  // PHASE 10: ADVANCED GOVERNANCE, RESILIENCE & PRODUCTION HARDENING
  // ==========================================================================

  public getCircuitBreakers(projectId?: string): CircuitBreakerRecord[] {
    return Array.from(this.circuitBreakers.values());
  }

  public getCircuitBreaker(target: CircuitBreakerTarget): CircuitBreakerRecord | undefined {
    return this.circuitBreakers.get(target);
  }

  public updateCircuitBreaker(record: CircuitBreakerRecord): CircuitBreakerRecord {
    this.circuitBreakers.set(record.target, record);
    return record;
  }

  public getDeadLetterRecords(projectId: string): DeadLetterRecord[] {
    return this.deadLetterQueue.get(projectId) || [];
  }

  public addDeadLetterRecord(record: DeadLetterRecord): DeadLetterRecord {
    const list = this.getDeadLetterRecords(record.projectId);
    list.unshift(record);
    this.deadLetterQueue.set(record.projectId, list);
    return record;
  }

  public replayDeadLetterRecord(
    id: string,
    projectId: string,
    actorId: string = 'system-operator'
  ): { success: boolean; record?: DeadLetterRecord; error?: string } {
    const list = this.getDeadLetterRecords(projectId);
    const item = list.find(r => r.id === id);
    if (!item) {
      return { success: false, error: 'Dead-letter record not found.' };
    }
    item.status = 'REPLAYED';
    item.resolution = `Replayed by ${actorId} at ${new Date().toISOString()}`;
    this.deadLetterQueue.set(projectId, list);

    this.recordAudit({
      actorId,
      actorRole: 'OPERATIONS',
      action: 'DEAD_LETTER_EVENT_REPLAYED',
      targetEntity: 'DeadLetterRecord',
      targetId: id,
      projectId,
      afterState: { status: 'REPLAYED', eventId: item.eventId },
      correlationId: `corr-dlq-${Date.now()}`
    });

    return { success: true, record: item };
  }

  public getDeployments(projectId: string): DeploymentRecord[] {
    return this.deployments.get(projectId) || [];
  }

  public getDeployment(id: string): DeploymentRecord | undefined {
    for (const list of this.deployments.values()) {
      const found = list.find(d => d.id === id);
      if (found) return found;
    }
    return undefined;
  }

  public createDeployment(record: DeploymentRecord): DeploymentRecord {
    const list = this.deployments.get(record.projectId) || [];
    list.unshift(record);
    this.deployments.set(record.projectId, list);
    return record;
  }

  public updateDeployment(id: string, updates: Partial<DeploymentRecord>): DeploymentRecord | undefined {
    for (const [projId, list] of this.deployments.entries()) {
      const idx = list.findIndex(d => d.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        this.deployments.set(projId, list);
        return list[idx];
      }
    }
    return undefined;
  }

  public getBackups(projectId: string): BackupRecord[] {
    return this.backups.get(projectId) || [];
  }

  public getBackup(id: string): BackupRecord | undefined {
    for (const list of this.backups.values()) {
      const found = list.find(b => b.id === id);
      if (found) return found;
    }
    return undefined;
  }

  public createBackup(record: BackupRecord): BackupRecord {
    const list = this.backups.get(record.projectId) || [];
    list.unshift(record);
    this.backups.set(record.projectId, list);
    return record;
  }

  public getRestoreTests(backupId: string): RestoreTestRecord[] {
    return this.restoreTests.get(backupId) || [];
  }

  public recordRestoreTest(testRecord: RestoreTestRecord): RestoreTestRecord {
    const list = this.restoreTests.get(testRecord.backupId) || [];
    list.unshift(testRecord);
    this.restoreTests.set(testRecord.backupId, list);
    return testRecord;
  }

  public getIncidents(projectId: string): ProductionIncident[] {
    return this.incidents.get(projectId) || [];
  }

  public getIncident(id: string): ProductionIncident | undefined {
    for (const list of this.incidents.values()) {
      const found = list.find(i => i.id === id || i.incidentId === id);
      if (found) return found;
    }
    return undefined;
  }

  public createIncident(record: ProductionIncident): ProductionIncident {
    const list = this.incidents.get(record.projectId) || [];
    list.unshift(record);
    this.incidents.set(record.projectId, list);
    return record;
  }

  public updateIncident(id: string, updates: Partial<ProductionIncident>): ProductionIncident | undefined {
    for (const [projId, list] of this.incidents.entries()) {
      const idx = list.findIndex(i => i.id === id || i.incidentId === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        this.incidents.set(projId, list);
        return list[idx];
      }
    }
    return undefined;
  }

  public getSecretFindings(projectId: string): SecretFindingRecord[] {
    return this.secretFindings.get(projectId) || [];
  }

  public recordSecretFinding(finding: SecretFindingRecord): SecretFindingRecord {
    const list = this.secretFindings.get(finding.projectId) || [];
    list.unshift(finding);
    this.secretFindings.set(finding.projectId, list);
    return finding;
  }

  public getRunbooks(): OperationalRunbook[] {
    return this.runbooks;
  }

  public setRunbooks(runbooks: OperationalRunbook[]): void {
    this.runbooks = runbooks;
  }

  public getDegradationLevel(projectId: string): DegradationLevel {
    return this.degradationLevels.get(projectId) || 'NORMAL';
  }

  public setDegradationLevel(
    projectId: string,
    level: DegradationLevel,
    reason: string,
    actorId: string,
    actorRole: UserRole
  ): DegradationLevel {
    const previous = this.getDegradationLevel(projectId);
    this.degradationLevels.set(projectId, level);

    this.recordAudit({
      actorId,
      actorRole,
      action: `SYSTEM_DEGRADATION_LEVEL_CHANGED`,
      targetEntity: 'SystemResilience',
      targetId: projectId,
      projectId,
      beforeState: { level: previous },
      afterState: { level, reason },
      correlationId: `corr-degrade-${Date.now()}`
    });

    return level;
  }

  public getResilienceOverviewMetrics(projectId: string): ResilienceOverviewMetrics {
    const incidents = this.getIncidents(projectId);
    const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'POST_INCIDENT_REVIEW').length;
    const breakers = this.getCircuitBreakers(projectId);
    const openBreakers = breakers.filter(b => b.state === 'OPEN').length;
    const dlq = this.getDeadLetterRecords(projectId);
    const backups = this.getBackups(projectId);
    const verifiedBackups = backups.filter(b => b.status === 'VERIFIED').length;
    const deployments = this.getDeployments(projectId);
    const prodDeployments = deployments.filter(d => d.targetEnvironment === 'PRODUCTION').length;
    const level = this.getDegradationLevel(projectId);

    return {
      systemDegradationLevel: level,
      activeIncidentsCount: activeIncidents,
      circuitBreakersOpenCount: openBreakers,
      deadLetterQueueCount: dlq.filter(d => d.status === 'QUEUED').length,
      verifiedBackupsCount: verifiedBackups,
      productionDeploymentsCount: prodDeployments,
      productionReadinessStatus: openBreakers === 0 && activeIncidents === 0 && level === 'NORMAL' ? 'READY' : 'RESTRICTED'
    };
  }

  // ==========================================================================
  // PRODUCTION INITIALIZATION (Arcadia Enterprise Core & Authorized Personnel)
  // ==========================================================================

  private seedDevelopmentData(): void {
    const orgId = 'org-arcadia-demo';
    const org: Organization = {
      id: orgId,
      name: 'Arcadia Enterprise Group',
      slug: 'arcadia-enterprise',
      createdAt: new Date().toISOString()
    };
    this.organizations.set(orgId, org);

    // Authorized Enterprise Personnel with Explicit RBAC Clearances
    const demoUsers: User[] = [
      { id: 'usr-lead', organizationId: orgId, email: 'lead@arcadia.dev', fullName: 'Dr. Evelyn Vance', role: 'PROJECT_LEAD', createdAt: new Date().toISOString() },
      { id: 'usr-arch', organizationId: orgId, email: 'architect@arcadia.dev', fullName: 'Marcus Chen', role: 'ARCHITECT', createdAt: new Date().toISOString() },
      { id: 'usr-sec', organizationId: orgId, email: 'security@arcadia.dev', fullName: 'Agent Ward', role: 'SECURITY', createdAt: new Date().toISOString() },
      { id: 'usr-dev', organizationId: orgId, email: 'dev@arcadia.dev', fullName: 'Sarah Connor', role: 'DEVELOPER', createdAt: new Date().toISOString() },
      { id: 'usr-ops', organizationId: orgId, email: 'ops@arcadia.dev', fullName: 'Elena Rostova', role: 'OPERATIONS', createdAt: new Date().toISOString() },
      { id: 'usr-client', organizationId: orgId, email: 'auditor@arcadia.dev', fullName: 'Arthur Pendelton', role: 'CLIENT', createdAt: new Date().toISOString() }
    ];

    demoUsers.forEach(u => this.users.set(u.id, u));

    // Authoritative Enterprise Project
    const projId = 'proj-core-os';
    const project: Project = {
      id: projId,
      organizationId: orgId,
      name: 'Project Sovereign Core',
      slug: 'project-sovereign-core',
      description: 'Core financial telemetry and transaction orchestration engine with strict provenance and audit constraints.',
      complexityLevel: 'L4',
      primaryState: 'EXECUTION',
      governanceState: 'CLEAR',
      securityState: 'CLEAR',
      driftState: 'ALIGNED',
      timelineState: 'ON_TRACK',
      cognitiveLoadState: 'NORMAL',
      currentVersion: 3,
      ownerId: 'usr-lead',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.projects.set(projId, project);

    // Seed Project Constitution
    const constitution: ProjectConstitution = {
      id: `const-${projId}-v1`,
      projectId: projId,
      version: 1,
      approvedStack: {
        frontend: 'React 18 + Vite + Tailwind CSS',
        backend: 'Express 4.21 Modular Monolith (TypeScript)',
        database: 'PostgreSQL 16 with Relational ACID & JSONB',
        deployment: 'Hardened Container Sandbox'
      },
      securityClassification: 'REGULATED',
      complianceProfiles: ['SOC2', 'PCI_DSS', 'GDPR'],
      prohibitedDependencies: ['eval', 'unvetted-crypto', 'plaintext-session-store'],
      governanceRules: [
        { id: 'RULE-01', rule: 'Project truth has explicit authority.', enforcement: 'HUMAN_GATE' },
        { id: 'RULE-02', rule: 'Prompts are execution artifacts, not sources of truth.', enforcement: 'CI' },
        { id: 'RULE-03', rule: 'Agents are controlled execution participants.', enforcement: 'HUMAN_GATE' },
        { id: 'RULE-04', rule: 'Historical information cannot automatically override current state.', enforcement: 'CI' },
        { id: 'RULE-05', rule: 'AI recommendations require the appropriate decision authority.', enforcement: 'HUMAN_GATE' },
        { id: 'RULE-06', rule: 'Learning does not silently become policy.', enforcement: 'HUMAN_GATE' },
        { id: 'RULE-07', rule: 'Validation requires evidence.', enforcement: 'CI' },
        { id: 'RULE-08', rule: 'Security outranks cost and convenience.', enforcement: 'CI' },
        { id: 'RULE-09', rule: 'Correctness outranks execution speed.', enforcement: 'CI' },
        { id: 'RULE-10', rule: 'Scope and architecture changes follow governance.', enforcement: 'HUMAN_GATE' },
        { id: 'RULE-11', rule: 'Every important action is traceable.', enforcement: 'CI' },
        { id: 'RULE-12', rule: 'Authoritative state must be recoverable.', enforcement: 'CI' },
        { id: 'RULE-13', rule: 'Existing verified capabilities are reused before new ones are created.', enforcement: 'HUMAN_GATE' },
        { id: 'RULE-14', rule: 'Verification is dependency-aware and change-aware.', enforcement: 'CI' },
        { id: 'RULE-15', rule: 'Risky actions require the appropriate approval.', enforcement: 'HUMAN_GATE' },
        { id: 'RULE-16', rule: 'Production incidents generate evidence, not automatic policy changes.', enforcement: 'HUMAN_GATE' },
        { id: 'RULE-17', rule: 'Architectural complexity requires justification.', enforcement: 'HUMAN_GATE' },
        { id: 'RULE-18', rule: 'Human authority remains explicit and enforceable.', enforcement: 'HUMAN_GATE' }
      ],
      isCurrent: true,
      approvedBy: 'usr-arch',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
    };
    this.constitutions.set(projId, [constitution]);

    // Seed Requirements (Approved + Proposed AI recommendation)
    const req1: Requirement = {
      id: 'req-001',
      projectId: projId,
      reqIdentifier: 'REQ-SEC-01',
      description: 'System must enforce role-based access control (RBAC) and reject unauthorized API calls at the domain layer.',
      source: 'CONTRACT',
      sourceReference: 'SOW Appendix B - Security Mandate',
      classification: 'FACT',
      status: 'APPROVED',
      confidenceScore: 1.0,
      version: 1,
      isCurrent: true,
      ownerId: 'usr-lead',
      approvedById: 'usr-lead',
      affectedComponents: ['auth-service', 'api-gateway'],
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
    };

    const req2: Requirement = {
      id: 'req-002',
      projectId: projId,
      reqIdentifier: 'REQ-AUD-02',
      description: 'Every state transition and approval must write an immutable audit log entry containing actor and correlation ID.',
      source: 'TEAM_DECISION',
      sourceReference: 'Architecture Review Meeting 2026-09',
      classification: 'DECISION',
      status: 'APPROVED',
      confidenceScore: 0.98,
      version: 1,
      isCurrent: true,
      ownerId: 'usr-arch',
      approvedById: 'usr-arch',
      affectedComponents: ['storage-engine', 'audit-logger'],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    };

    const req3: Requirement = {
      id: 'req-003',
      projectId: projId,
      reqIdentifier: 'REQ-AI-OPT-03',
      description: 'AI model suggests caching compiled prompt hashes in Redis to reduce redundant token compilation latency.',
      source: 'AI_RECOMMENDATION',
      sourceReference: 'Prompt Compiler Analysis Engine',
      classification: 'RECOMMENDATION',
      status: 'PROPOSED', // Cannot be approved silently!
      confidenceScore: 0.85,
      version: 1,
      isCurrent: true,
      ownerId: 'usr-arch',
      affectedComponents: ['prompt-compiler'],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    };

    this.requirements.set(projId, [req1, req2, req3]);

    // Seed Decision
    const dec1: Decision = {
      id: 'dec-001',
      projectId: projId,
      decisionIdentifier: 'DEC-ARCH-01',
      title: 'Adoption of Modular Monolith Pattern',
      description: 'Consolidate 20 logical engines into 6 in-process domain modules rather than deploying 20 microservices.',
      context: 'Microservices would introduce distributed transaction risk and network latency without serving higher scale.',
      options: ['20 Independent Microservices', 'Secure Modular Monolith with Event Outbox', 'Serverless Functions Only'],
      selectedOption: 'Secure Modular Monolith with Event Outbox',
      authority: 'Architectural Authority',
      evidence: 'Foundation Readiness Analysis Section 2.2',
      status: 'APPROVED',
      version: 1,
      createdBy: 'usr-arch',
      approvedBy: 'usr-lead',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
    };
    this.decisions.set(projId, [dec1]);

    // Seed Tasks with Universal Task Specification & Scope Lock
    const task1: UniversalTaskSpecification = {
      taskId: 'tsk-001',
      projectId: projId,
      taskIdentifier: 'TSK-AUTH-01',
      title: 'Implement Tenant Scoping and RBAC Middleware',
      objective: 'Enforce organization isolation and role permissions across all /api endpoints.',
      complexity: 'MEDIUM',
      state: 'PASSED',
      requirementsSatisfied: ['REQ-SEC-01'],
      dependencies: [],
      allowedActions: ['FILE_CREATE', 'FILE_EDIT', 'RUN_TEST'],
      prohibitedActions: ['DISABLE_AUTH', 'DROP_TABLE', 'DIRECT_DB_MUTATION'],
      architectureSlice: {
        relevantModules: ['auth', 'api'],
        contractsToPreserve: ['UserRole', 'Permission']
      },
      relevantFiles: [
        { path: 'src/server/auth.ts', readOnly: false },
        { path: 'src/types/index.ts', readOnly: true }
      ],
      acceptanceCriteria: [
        'Requests without tenant header return 401/403',
        'CLIENT role cannot access project.update endpoint'
      ],
      validationRequirements: {
        mandatoryTests: ['src/tests/foundation.test.ts'],
        staticChecks: ['TYPESCRIPT', 'SCOPE_LOCK'],
        maxExecutionTimeMs: 15000
      },
      stopConditions: ['Scope Lock violation', 'Authentication bypass detected'],
      escalationConditions: ['Missing user session'],
      assignedAgentId: 'agent-gemini-2.5-pro',
      retryCount: 0,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString()
    };

    const task2: UniversalTaskSpecification = {
      taskId: 'tsk-002',
      projectId: projId,
      taskIdentifier: 'TSK-AUD-02',
      title: 'Enforce Immutable Audit Log Triggers',
      objective: 'Implement append-only audit trail capturing actor, correlation ID, and before/after states.',
      complexity: 'MEDIUM',
      state: 'RUNNING',
      requirementsSatisfied: ['REQ-AUD-02'],
      dependencies: ['tsk-001'],
      allowedActions: ['FILE_EDIT', 'RUN_TEST'],
      prohibitedActions: ['TRUNCATE_AUDIT', 'UPDATE_AUDIT_ENTRY'],
      architectureSlice: {
        relevantModules: ['storage', 'audit'],
        contractsToPreserve: ['AuditLogEntry']
      },
      relevantFiles: [
        { path: 'src/server/storage.ts', readOnly: false },
        { path: 'src/types/index.ts', readOnly: true }
      ],
      acceptanceCriteria: [
        'Audit logs cannot be updated or deleted',
        'State transitions append audit records'
      ],
      validationRequirements: {
        mandatoryTests: ['src/tests/foundation.test.ts'],
        staticChecks: ['TYPESCRIPT'],
        maxExecutionTimeMs: 15000
      },
      stopConditions: ['Audit tampering attempt'],
      escalationConditions: ['Audit write failure'],
      assignedAgentId: 'agent-gemini-2.5-pro',
      retryCount: 0,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.tasks.set(projId, [task1, task2]);

    // Seed Human Decision Queue Items
    const queueItem1: DecisionQueueItem = {
      id: 'queue-001',
      projectId: projId,
      title: 'AI Recommendation Pending Approval: REQ-AI-OPT-03',
      description: 'Model recommended prompt hash caching in Redis. Requires human verification before merging into Layer 2 Approved Requirements.',
      category: 'RECOMMENDATION',
      priority: 'MEDIUM',
      status: 'PENDING',
      impactAnalysis: {
        scopeDelta: 'Introduces Redis dependency into Task Execution cache.',
        affectedTasks: ['tsk-002'],
        riskScore: 0.25
      },
      contextPayload: {
        requirementId: 'req-003',
        source: 'AI_RECOMMENDATION'
      },
      createdAt: new Date(Date.now() - 86400000).toISOString()
    };

    const queueItem2: DecisionQueueItem = {
      id: 'queue-002',
      projectId: projId,
      title: 'Scope Lock Alert: Task TSK-AUD-02 Attempted Write to Unlisted File',
      description: 'Worker reported agent attempted to write to /src/config/redis.json which is outside task.relevantFiles boundary.',
      category: 'EXCEPTION',
      priority: 'HIGH',
      status: 'PENDING',
      impactAnalysis: {
        scopeDelta: 'Unauthorized file modification prevented.',
        affectedTasks: ['tsk-002'],
        riskScore: 0.7
      },
      contextPayload: {
        violatingFile: '/src/config/redis.json',
        taskId: 'tsk-002'
      },
      createdAt: new Date(Date.now() - 1800000).toISOString()
    };

    this.decisionQueue.set(projId, [queueItem1, queueItem2]);

    // ==========================================
    // Seed Phase 7: Validation, Security & Drift Data
    // ==========================================

    // 1. Validation Gates
    const gates: ValidationGate[] = [
      {
        id: 'gate-01',
        name: 'Gate 1 — Approved Requirements & Preconditions',
        order: 1,
        requiredConditions: ['Requirements Approved', 'State != REJECTED'],
        categories: ['REQUIREMENT'],
        minimumEvidence: ['Approved Requirement Reference'],
        requiredAuthority: 'AUTOMATED',
        failureBehavior: 'BLOCK',
        waiverPolicy: 'ALLOWED_WITH_GOVERNANCE',
        blockingSeverity: 'HIGH',
        status: 'PASSED',
        passed: true,
        evidenceNotes: 'Prerequisites validated against Layer 2 Requirements.'
      },
      {
        id: 'gate-02',
        name: 'Gate 2 — Scope Lock Boundary',
        order: 2,
        requiredConditions: ['Only declared relevantFiles modified', 'No prohibited actions'],
        categories: ['SCOPE'],
        minimumEvidence: ['File Diff Manifest', 'Prohibited Actions Check'],
        requiredAuthority: 'AUTOMATED',
        failureBehavior: 'BLOCK',
        waiverPolicy: 'STRICT_NO_WAIVER',
        blockingSeverity: 'CRITICAL',
        status: 'PASSED',
        passed: true,
        evidenceNotes: 'Scope Lock asserted against task specification.'
      },
      {
        id: 'gate-03',
        name: 'Gate 3 — Functional & Technical Correctness',
        order: 3,
        requiredConditions: ['Automated tests pass', 'TypeScript types check', 'Lint clean'],
        categories: ['FUNCTIONAL', 'ARCHITECTURE'],
        minimumEvidence: ['Test Execution Output', 'Static Analysis Output'],
        requiredAuthority: 'AUTOMATED',
        failureBehavior: 'BLOCK',
        waiverPolicy: 'ALLOWED_WITH_GOVERNANCE',
        blockingSeverity: 'HIGH',
        status: 'PASSED',
        passed: true,
        evidenceNotes: 'Compilation and unit assertions green.'
      },
      {
        id: 'gate-04',
        name: 'Gate 4 — Security Profile & Stop Conditions',
        order: 4,
        requiredConditions: ['Zero critical vulnerabilities', 'Zero stop condition triggers', 'Tenant isolation verified'],
        categories: ['SECURITY'],
        minimumEvidence: ['Security Scan Result', 'Tenant Boundary Assertion'],
        requiredAuthority: 'SECURITY_APPROVED',
        failureBehavior: 'BLOCK',
        waiverPolicy: 'SECURITY_LEAD_ONLY',
        blockingSeverity: 'CRITICAL',
        status: 'PASSED',
        passed: true,
        evidenceNotes: 'Security profile STANDARD validated.'
      },
      {
        id: 'gate-05',
        name: 'Gate 5 — Regression & Blast Radius Check',
        order: 5,
        requiredConditions: ['Dependency-aware regression tests pass', 'Existing workflows unimpacted'],
        categories: ['REGRESSION'],
        minimumEvidence: ['Regression Test Suite Run'],
        requiredAuthority: 'AUTOMATED',
        failureBehavior: 'WARN',
        waiverPolicy: 'ALLOWED_WITH_GOVERNANCE',
        blockingSeverity: 'HIGH',
        status: 'PASSED',
        passed: true,
        evidenceNotes: 'Zero regression defects detected.'
      },
      {
        id: 'gate-06',
        name: 'Gate 6 — Human Review & Governance Sign-off',
        order: 6,
        requiredConditions: ['Project Lead or Architect review completed for sensitive changes'],
        categories: ['COMPLIANCE'],
        minimumEvidence: ['Audited Human Review Stamp'],
        requiredAuthority: 'HUMAN_REVIEWED',
        failureBehavior: 'ESCALATE',
        waiverPolicy: 'ALLOWED_WITH_GOVERNANCE',
        blockingSeverity: 'HIGH',
        status: 'PASSED',
        passed: true,
        evidenceNotes: 'Lead verification recorded in immutable audit log.'
      },
      {
        id: 'gate-07',
        name: 'Gate 7 — Authoritative State Promotion',
        order: 7,
        requiredConditions: ['All preceding gates passed or waived with governance authority'],
        categories: ['DEPLOYMENT'],
        minimumEvidence: ['Consolidated Validation Contract'],
        requiredAuthority: 'GOVERNANCE_APPROVED',
        failureBehavior: 'BLOCK',
        waiverPolicy: 'STRICT_NO_WAIVER',
        blockingSeverity: 'CRITICAL',
        status: 'PASSED',
        passed: true,
        evidenceNotes: 'Authoritative state promotion unlocked.'
      }
    ];
    this.validationGates.set(projId, gates);

    // 2. Validation Rules
    const rules: ValidationRule[] = [
      {
        id: 'rule-sec-01',
        name: 'Enforce Authorization on All Endpoints',
        description: 'All state-mutating and sensitive read endpoints must enforce RBAC permission checks.',
        category: 'SECURITY',
        severity: 'CRITICAL',
        appliesTo: ['api', 'server', 'controllers'],
        source: 'CONSTITUTION',
        version: '1.0.0',
        active: true
      },
      {
        id: 'rule-sec-02',
        name: 'Zero Secret Exposure in Logs or Diffs',
        description: 'API keys, credentials, or sensitive auth tokens must never be written to plaintext logs or evidence.',
        category: 'SECURITY',
        severity: 'CRITICAL',
        appliesTo: ['storage', 'execution', 'audit'],
        source: 'SECURITY_POLICY',
        version: '1.0.0',
        active: true
      },
      {
        id: 'rule-scope-01',
        name: 'Strict Scope Lock Boundary Verification',
        description: 'Agent executions cannot write to any file path unlisted in the relevantFiles contract.',
        category: 'SCOPE',
        severity: 'CRITICAL',
        appliesTo: ['execution', 'sandbox'],
        source: 'CONSTITUTION',
        version: '1.0.0',
        active: true
      },
      {
        id: 'rule-tenant-01',
        name: 'Multi-Tenant Isolation Invariant',
        description: 'Cross-tenant resource lookups must return 403 or undefined, never leaking existence or data.',
        category: 'SECURITY',
        severity: 'CRITICAL',
        appliesTo: ['storage', 'tenant', 'query'],
        source: 'CONSTITUTION',
        version: '1.0.0',
        active: true
      },
      {
        id: 'rule-drift-01',
        name: 'Architecture Drift Prohibition',
        description: 'Unauthorized external dependencies or database engines cannot be added without Change Request.',
        category: 'ARCHITECTURE',
        severity: 'HIGH',
        appliesTo: ['package.json', 'imports'],
        source: 'GOVERNANCE_POLICY',
        version: '1.0.0',
        active: true
      }
    ];
    this.validationRules.set(projId, rules);

    // 3. Threat Models
    const threatModels: ThreatModel[] = [
      {
        id: 'tm-001',
        projectId: projId,
        asset: 'Tenant Data & Core Workflows',
        actor: 'Malicious Authenticated User / Multi-Tenant Neighbor',
        threat: 'Cross-Tenant Data Exposure via ID manipulation or wildcard parameters',
        attackSurface: 'REST API Endpoints (/api/projects/:id)',
        trustBoundary: 'User -> Frontend -> Backend',
        control: 'Mandatory tenant header validation and storage-level organization filter',
        residualRisk: 'LOW',
        evidence: 'Automated Tenant Isolation Tests in foundation.test.ts',
        owner: 'usr-lead',
        status: 'MITIGATED'
      },
      {
        id: 'tm-002',
        projectId: projId,
        asset: 'Gemini API Keys & Cloud Run Environment Secrets',
        actor: 'Prompt Injection / Malicious Agent',
        threat: 'Extraction of server environment secrets via prompt reflection or error dumps',
        attackSurface: 'Agent Prompt Compilation & Execution Context',
        trustBoundary: 'Backend -> AI Provider / Agent Sandbox',
        control: 'Strict server-side secret isolation; GEMINI_API_KEY never passed to client or prompt compiler',
        residualRisk: 'LOW',
        evidence: 'Prompt Compiler context sanitizer test suite',
        owner: 'usr-lead',
        status: 'MITIGATED'
      },
      {
        id: 'tm-003',
        projectId: projId,
        asset: 'Codebase & Authoritative State',
        actor: 'Hallucinating or Compromised Agent',
        threat: 'Unauthorized arbitrary code insertion or scope escape',
        attackSurface: 'File Modification Tool Calls',
        trustBoundary: 'Execution Sandbox -> Authoritative Storage',
        control: 'Scope Lock AST path enforcement & Project Lead Promotion Gate',
        residualRisk: 'LOW',
        evidence: 'Scope Lock Adversarial Test Cases (SCOPE-01, SCOPE-02)',
        owner: 'usr-lead',
        status: 'MITIGATED'
      }
    ];
    this.threatModels.set(projId, threatModels);

    // 4. Trust Boundaries
    this.trustBoundaries = [
      { id: 'tb-01', source: 'End User / Client', target: 'Arcadia Web UI', protocol: 'HTTPS', authRequired: true, dataClassification: 'INTERNAL' },
      { id: 'tb-02', source: 'Arcadia Web UI', target: 'Express Backend API', protocol: 'Local REST / JSON', authRequired: true, dataClassification: 'INTERNAL' },
      { id: 'tb-03', source: 'Express Backend API', target: 'Authoritative Storage', protocol: 'In-Memory Relational Engine', authRequired: true, dataClassification: 'CONFIDENTIAL' },
      { id: 'tb-04', source: 'Execution Engine', target: 'Google Gemini 2.5 API', protocol: 'Encrypted HTTPS / TLS 1.3', authRequired: true, dataClassification: 'CONFIDENTIAL' }
    ];

    // 5. Data Flow Records
    const dataFlows: DataFlowRecord[] = [
      {
        id: 'df-001',
        projectId: projId,
        dataOrigin: 'Client Intake & Lead Requirements',
        storageLocation: 'Authoritative Storage (Map Collections)',
        transformations: ['Markdown Sanitization', 'SHA-256 Hashing', 'Prompt Context Compaction'],
        transmissionEndpoints: ['POST /api/requirements', 'POST /api/executions/start'],
        authorizedAgents: ['agent-gemini-2.5-pro', 'agent-gemini-2.5-flash'],
        externalProviders: ['Google Gemini API'],
        authorizedRoles: ['CLIENT', 'PROJECT_LEAD', 'ARCHITECT', 'SECURITY'],
        isCompliant: true,
        notes: 'Compliant with Layer 1 Data Privacy mandate.'
      }
    ];
    this.dataFlows.set(projId, dataFlows);

    // 6. Compliance Controls
    const complianceControls: ComplianceControl[] = [
      {
        id: 'comp-01',
        projectId: projId,
        framework: 'SOC2',
        requirementId: 'CC6.1',
        controlCode: 'AC-1',
        title: 'Logical Access Controls & RBAC Enforcement',
        description: 'System restricts access to data and execution operations based on explicit role assignments.',
        implementationNotes: 'Implemented via ROLE_PERMISSIONS matrix and tenant boundary middleware.',
        evidenceRef: 'src/tests/foundation.test.ts (RBAC-01..03)',
        status: 'IMPLEMENTED',
        lastAssessed: new Date().toISOString()
      },
      {
        id: 'comp-02',
        projectId: projId,
        framework: 'SOC2',
        requirementId: 'CC6.6',
        controlCode: 'SC-7',
        title: 'Boundary Protection & Network Encryption',
        description: 'Communication across trust boundaries requires authenticated TLS and server-side secret handling.',
        implementationNotes: 'All third-party tokens kept server-side; TLS 1.3 transport enforced.',
        evidenceRef: 'src/server/storage.ts & server.ts',
        status: 'IMPLEMENTED',
        lastAssessed: new Date().toISOString()
      },
      {
        id: 'comp-03',
        projectId: projId,
        framework: 'ISO27001',
        requirementId: 'A.12.1.2',
        controlCode: 'CHG-1',
        title: 'Change Governance & Authoritative Promotion',
        description: 'Changes to operational state require structured evidence, automated gate verification, and lead approval.',
        implementationNotes: 'Enforced via Phase 7 Validation Pipeline and 7-gate lifecycle.',
        evidenceRef: 'ValidationEngine Gate 7',
        status: 'IMPLEMENTED',
        lastAssessed: new Date().toISOString()
      }
    ];
    this.complianceControls.set(projId, complianceControls);

    // 7. Security Findings
    const securityFindings: SecurityFinding[] = [
      {
        id: 'sec-find-001',
        projectId: projId,
        category: 'Input Validation',
        severity: 'LOW',
        description: 'Query parameter parsing in task filter lacks explicit integer bounds checking.',
        evidence: 'GET /api/tasks?limit=abc handled gracefully but triggers NaN fallback.',
        affectedComponent: 'src/server/api.ts',
        exploitability: 'LOW',
        controlReference: 'RULE-SEC-01',
        recommendedRemediation: 'Add parseInt validation with fallback cap of 100.',
        status: 'RESOLVED',
        owner: 'usr-lead',
        createdAt: new Date(Date.now() - 43200000).toISOString(),
        resolvedAt: new Date(Date.now() - 3600000).toISOString(),
        resolutionNotes: 'Added Math.min(100, Math.max(1, parseInt(limit))) sanitization.',
        isStopConditionTriggered: false
      }
    ];
    this.securityFindings.set(projId, securityFindings);

    // 8. Drift Records
    const driftRecords: DriftRecord[] = [
      {
        id: 'drift-001',
        projectId: projId,
        type: 'CONFIGURATION',
        sourceState: 'Production Logging: INFO',
        actualState: 'Runtime Logging: DEBUG (Verbose Dev Server)',
        difference: 'Development runtime environment runs with verbose tracing enabled.',
        classification: 'EXPECTED',
        severity: 'INFO',
        evidence: 'process.env.NODE_ENV !== "production"',
        affectedComponents: ['server.ts'],
        impact: 'No security impact; expected during active development.',
        recommendedAction: 'IGNORE_WITH_AUDIT',
        status: 'CLOSED',
        detectedAt: new Date(Date.now() - 172800000).toISOString(),
        resolvedAt: new Date(Date.now() - 86400000).toISOString(),
        resolution: 'Acknowledged as expected in active local container environment.',
        authority: 'usr-lead'
      },
      {
        id: 'drift-002',
        projectId: projId,
        type: 'ARCHITECTURE',
        sourceState: 'Approved Architecture: Single authoritative storage instance',
        actualState: 'Observed Architecture: Clean single in-memory StorageEngine instance',
        difference: 'Zero architectural drift detected.',
        classification: 'AUTHORIZED',
        severity: 'INFO',
        evidence: 'AST import scan across src/server/',
        affectedComponents: ['src/server/storage.ts'],
        impact: 'System is fully aligned with approved modular monolith architecture.',
        recommendedAction: 'IGNORE_WITH_AUDIT',
        status: 'RESOLVED',
        detectedAt: new Date(Date.now() - 86400000).toISOString(),
        resolvedAt: new Date().toISOString(),
        resolution: 'Verified against Architecture Document.',
        authority: 'SYSTEM'
      }
    ];
    this.driftRecords.set(projId, driftRecords);

    // 9. Risk Acceptances
    const riskAcceptances: RiskAcceptanceRecord[] = [
      {
        id: 'risk-001',
        projectId: projId,
        risk: 'Non-blocking dependency audit warnings in devDependencies',
        affectedComponent: 'package.json (dev tooling)',
        reason: 'Build tooling plugins have upstream warnings that do not affect runtime server security.',
        knownImpact: 'Zero runtime exposure; isolated to developer compile phase.',
        mitigation: 'Build bundle strips devDependencies during production compilation.',
        expirationDate: '2026-12-31',
        approverId: 'usr-lead',
        approverRole: 'PROJECT_LEAD',
        timestamp: new Date().toISOString(),
        evidence: 'npm audit summary during container boot',
        active: true
      }
    ];
    this.riskAcceptances.set(projId, riskAcceptances);

    // 10. Phase 8 Telemetry & Cost Events
    const costEvents: CostEvent[] = [
      {
        costEventId: 'cost-ev-001',
        organizationId: orgId,
        projectId: projId,
        taskId: 'tsk-001',
        provider: 'Google Gemini 2.5 Pro',
        agentId: 'agent-gemini-2.5-pro',
        costCategory: 'AI_EXECUTION',
        amount: 0.042,
        currency: 'USD',
        source: 'TASK_EXECUTION',
        observedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        classification: 'OBSERVED',
        metadata: { inputTokens: 4200, outputTokens: 850 }
      },
      {
        costEventId: 'cost-ev-002',
        organizationId: orgId,
        projectId: projId,
        taskId: 'tsk-001',
        provider: 'Arcadia AST Validator',
        costCategory: 'VALIDATION',
        amount: 0.015,
        currency: 'USD',
        source: 'GATE_4_AUTOMATED_TESTS',
        observedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        classification: 'OBSERVED',
        metadata: { testSuiteCount: 4, durationMs: 1420 }
      },
      {
        costEventId: 'cost-ev-003',
        organizationId: orgId,
        projectId: projId,
        provider: 'Project Lead Review',
        costCategory: 'HUMAN_REVIEW',
        amount: 0.85,
        currency: 'USD',
        source: 'GATE_6_GOVERNANCE_SIGN_OFF',
        observedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        classification: 'OBSERVED',
        metadata: { durationMinutes: 10, role: 'PROJECT_LEAD' }
      },
      {
        costEventId: 'cost-ev-004',
        organizationId: orgId,
        projectId: projId,
        provider: 'Container Runtime',
        costCategory: 'INFRASTRUCTURE',
        amount: 0.02,
        currency: 'USD',
        source: 'CONTAINER_COMPUTE',
        observedAt: new Date(Date.now() - 3600000).toISOString(),
        classification: 'OBSERVED',
        metadata: { memoryMb: 512, cpuCores: 1 }
      }
    ];
    this.costEvents.set(projId, costEvents);

    // 11. Phase 8 Time Events
    const timeEvents: TimeEvent[] = [
      {
        timeEventId: 'time-ev-001',
        organizationId: orgId,
        projectId: projId,
        taskId: 'tsk-001',
        category: 'ACTIVE',
        durationSeconds: 145,
        startedAt: new Date(Date.now() - 7200000).toISOString(),
        endedAt: new Date(Date.now() - 7055000).toISOString(),
        classification: 'OBSERVED',
        reason: 'Autonomous Agent Execution'
      },
      {
        timeEventId: 'time-ev-002',
        organizationId: orgId,
        projectId: projId,
        taskId: 'tsk-001',
        category: 'REVIEW',
        durationSeconds: 320,
        startedAt: new Date(Date.now() - 7000000).toISOString(),
        endedAt: new Date(Date.now() - 6680000).toISOString(),
        classification: 'OBSERVED',
        reason: 'Architect & Lead Governance Review'
      }
    ];
    this.timeEvents.set(projId, timeEvents);

    // 12. Phase 8 Trust Events
    const trustEvents: TrustEvent[] = [
      {
        id: 'trust-001',
        projectId: projId,
        agentId: 'agent-gemini-2.5-pro',
        eventType: 'SUCCESSFUL_RECOMMENDATION',
        taskType: 'FOUNDATION_ARCHITECTURE',
        complexity: 'HIGH',
        strategy: 'EXECUTOR_WITH_AUDIT',
        securityLevel: 'RESTRICTED',
        outcome: 'SUCCESS',
        validationResult: 'PASSED',
        contextDetails: 'Implemented in-memory thread-safe store with zero regressions.',
        timestamp: new Date(Date.now() - 14400000).toISOString()
      },
      {
        id: 'trust-002',
        projectId: projId,
        agentId: 'agent-gemini-2.5-pro',
        eventType: 'HUMAN_APPROVAL',
        taskType: 'SECURITY_HARDENING',
        complexity: 'MEDIUM',
        strategy: 'SPECIALIST',
        securityLevel: 'RESTRICTED',
        outcome: 'SUCCESS',
        validationResult: 'PASSED',
        contextDetails: 'Enforced RBAC and unwaiverable critical security rules.',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      }
    ];
    this.trustEvents.set(projId, trustEvents);

    // 13. Phase 8 Optimization Recommendations
    const recommendations: OptimizationRecommendation[] = [
      {
        id: 'rec-opt-001',
        organizationId: orgId,
        projectId: projId,
        scope: 'PROJECT',
        category: 'CONTEXT_OPTIMIZATION',
        observedProblem: 'Historical test runner logs are repeatedly compiled into task context packages, consuming 35% unnecessary input tokens.',
        evidence: 'Telemetry logs show average prompt token size of 8.2k tokens with 3.1k consisting of raw test outputs.',
        currentStrategy: 'Full historical log retention in active context packages.',
        proposedStrategy: 'Compress prior execution logs into cryptographic hashes + AST delta summaries, omitting redundant verbose traces.',
        expectedBenefit: 'Reduces prompt token consumption by 32% (~$1.40/day savings) without losing verification fidelity.',
        expectedCost: '$0.00 (Software logic change)',
        risks: ['None; full traces remain indexed in immutable audit storage.'],
        securityImpact: 'NONE',
        governanceImpact: 'LOW',
        timelineImpact: 'Improves agent inference response time by ~400ms.',
        workflowImpact: 'Zero human friction; transparent context compression.',
        confidence: 'HIGH',
        reversibility: 'REVERSIBLE',
        requiredAuthority: 'SYSTEM_AUTONOMOUS',
        affectedTasks: ['All execution tasks'],
        affectedAgents: ['agent-gemini-2.5-pro', 'agent-gemini-2.5-flash'],
        validationRequirements: ['Verification that task acceptance criteria remain 100% visible.'],
        expiration: new Date(Date.now() + 86400000 * 14).toISOString(),
        status: 'PROPOSED',
        createdAt: new Date().toISOString()
      },
      {
        id: 'rec-opt-002',
        organizationId: orgId,
        projectId: projId,
        scope: 'WORKFLOW',
        category: 'TEMPORAL_OPTIMIZATION',
        observedProblem: 'Independent automated test suites (Foundation, Execution, Collaboration) are currently executed sequentially, extending validation latency.',
        evidence: 'Temporal telemetry indicates total Gate 4 time is 4.8s (sum of 3 separate passes of ~1.6s).',
        proposedStrategy: 'Execute non-conflicting test suites in parallel worker threads.',
        currentStrategy: 'Synchronous sequential execution.',
        expectedBenefit: 'Reduces Gate 4 validation wall-clock duration from 4.8s to ~1.7s (64% latency reduction).',
        expectedCost: 'Negligible compute overhead.',
        risks: ['Thread-safety must be strictly maintained across the in-memory store.'],
        securityImpact: 'NONE',
        governanceImpact: 'LOW',
        timelineImpact: 'Direct critical-path reduction for all subsequent task promotions.',
        workflowImpact: 'Faster developer/agent feedback loop.',
        confidence: 'HIGH',
        reversibility: 'REVERSIBLE',
        requiredAuthority: 'ARCHITECT',
        affectedTasks: ['Validation Pipeline'],
        affectedAgents: ['ValidationEngine'],
        validationRequirements: ['Ensure zero race conditions during parallel test execution.'],
        expiration: new Date(Date.now() + 86400000 * 30).toISOString(),
        status: 'REVIEW_REQUIRED',
        createdAt: new Date().toISOString()
      },
      {
        id: 'rec-opt-003',
        organizationId: orgId,
        projectId: projId,
        scope: 'TASK',
        category: 'RETRY_OPTIMIZATION',
        observedProblem: 'Identical prompt retry on validation failure leads to repeated failure in 68% of retry attempts.',
        evidence: 'Task execution history demonstrates prompt repetition without error-guidance causes circular failures.',
        currentStrategy: 'Static retry with identical parameters.',
        proposedStrategy: 'Dynamic failure-conditioned reflection: append explicit ValidationFailure diff into retry prompt.',
        expectedBenefit: 'Increases second-attempt task recovery rate from 32% to 81%.',
        expectedCost: '+$0.01 per retry token expansion, offset by avoided 3rd retries.',
        risks: ['Slightly larger retry prompt context.'],
        securityImpact: 'NONE',
        governanceImpact: 'LOW',
        timelineImpact: 'Prevents multi-minute retry stalls.',
        workflowImpact: 'Fewer human escalations for transient agent errors.',
        confidence: 'HIGH',
        reversibility: 'REVERSIBLE',
        requiredAuthority: 'PROJECT_LEAD',
        affectedTasks: ['All complex tasks'],
        affectedAgents: ['agent-gemini-2.5-pro'],
        validationRequirements: ['Lint and static check verification.'],
        expiration: new Date(Date.now() + 86400000 * 7).toISOString(),
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'usr-lead'
      }
    ];
    this.optimizationRecommendations.set(projId, recommendations);

    // 14. Phase 8 Optimization Policies
    const defaultPolicy: OptimizationPolicy = {
      id: `policy-${orgId}-default`,
      organizationId: orgId,
      projectId: projId,
      name: 'Default Governed Optimization Policy',
      description: 'Enforces strict adherence to Correctness & Security Before Cost, requiring Lead review for high impact.',
      allowedInterventions: [
        'CONTEXT_COMPRESSION',
        'NOTIFICATION_GROUPING',
        'EVIDENCE_CACHE_REUSE',
        'RETRY_BACKOFF_ADJUSTMENT'
      ],
      prohibitedInterventions: [
        'BYPASS_SECURITY_VALIDATION',
        'REDUCE_MANDATORY_TESTING',
        'AUTONOMOUS_CONSTITUTION_CHANGE',
        'SELF_APPROVAL_BY_AGENT'
      ],
      approvalRequirements: {
        CONTEXT_OPTIMIZATION: 'PROJECT_LEAD',
        PROMPT_OPTIMIZATION: 'DEVELOPER',
        AGENT_OPTIMIZATION: 'ARCHITECT',
        COLLABORATION_OPTIMIZATION: 'ARCHITECT',
        VALIDATION_OPTIMIZATION: 'PROJECT_LEAD',
        RETRY_OPTIMIZATION: 'PROJECT_LEAD',
        TASK_DECOMPOSITION: 'PROJECT_LEAD',
        WORKFLOW_OPTIMIZATION: 'PROJECT_LEAD',
        TEMPORAL_OPTIMIZATION: 'ARCHITECT',
        COST_OPTIMIZATION: 'PROJECT_LEAD'
      },
      securityConstraints: [
        'Zero reduction in mandatory encryption or access control checks.',
        'No telemetry leakage across tenant boundaries.'
      ],
      costConstraints: {
        maxAutoInterventionCost: 5.0,
        currency: 'USD'
      },
      validationConstraints: [
        'All 7 validation gates remain mandatory in chronological sequence.'
      ],
      humanReviewConstraints: [
        'Human review cannot be disabled for CRITICAL security findings or Constitution amendments.'
      ],
      version: 1,
      status: 'ACTIVE',
      effectiveDate: '2026-01-01',
      owner: 'usr-lead'
    };
    this.optimizationPolicies.set(orgId, [defaultPolicy]);

    // 15. Phase 8 Optimization Action Record
    const initialAction: OptimizationAction = {
      id: 'act-opt-001',
      recommendationId: 'rec-opt-003',
      policyId: defaultPolicy.id,
      trigger: 'Automated policy check on task retry failure frequency',
      action: 'Enabled failure-conditioned prompt reflection for retry iterations',
      previousState: 'STATIC_PROMPT_RETRY',
      newState: 'DYNAMIC_FAILURE_REFLECTION',
      actor: 'usr-lead',
      automationStatus: 'HUMAN_APPROVED',
      validationResult: 'PASSED',
      reversibility: 'REVERSIBLE',
      evidence: 'Observed 3 task retries restored without human intervention.',
      timestamp: new Date().toISOString()
    };
    this.optimizationActions.set(projId, [initialAction]);

    // 16. Phase 8 Controlled Experiment
    const initialExperiment: OptimizationExperiment = {
      id: 'exp-opt-001',
      projectId: projId,
      title: 'Context Scope: Monolithic Context vs Selective AST Slices',
      strategyA: {
        name: 'Monolithic Context',
        description: 'Provide entire file tree and complete historical logs',
        config: { contextDepth: 'FULL', tokenLimit: 32000 }
      },
      strategyB: {
        name: 'Selective AST Slices',
        description: 'Provide only symbols and direct dependencies with summaries',
        config: { contextDepth: 'AST_SELECTIVE', tokenLimit: 8000 }
      },
      metricsToCompare: ['ExecutionCost', 'ValidationPassRate', 'DurationSeconds', 'RetryCount'],
      resultsA: {
        ExecutionCost: 0.12,
        ValidationPassRate: 88,
        DurationSeconds: 42,
        RetryCount: 1
      },
      resultsB: {
        ExecutionCost: 0.04,
        ValidationPassRate: 94,
        DurationSeconds: 18,
        RetryCount: 0
      },
      status: 'CONCLUDED',
      conclusion: 'Strategy B (Selective AST Slices) achieved 66% cost savings and improved first-pass validation from 88% to 94%.'
    };
    this.optimizationExperiments.set(projId, [initialExperiment]);

    // 17. Phase 9 Organizational Memories
    const initialMemories: OrganizationalMemory[] = [
      {
        id: 'mem-001',
        organizationId: orgId,
        projectId: projId,
        title: 'Strict Scope-Locked File Boundary Architecture',
        type: 'REUSABLE_BLUEPRINT',
        category: 'GOVERNANCE_PATTERNS',
        summary: 'Enforce explicit declaration of modified files and prohibited actions in task readiness contracts.',
        detailedContent: 'By explicitly enumerating relevantFiles and prohibitedActions before execution begins, Gate 2 can mathematically guarantee that no unauthorized files are touched or modified. Diffs outside declared boundaries trigger immediate hard abort.',
        status: 'VERIFIED',
        provenance: {
          sourceTaskId: 'tsk-001',
          authorId: 'usr-arch',
          authorRole: 'ARCHITECT',
          organizationId: orgId,
          projectId: projId,
          verifiedBy: 'usr-lead',
          verifiedAt: '2026-09-20T10:00:00.000Z',
          confidenceScore: 0.98,
          verificationMethod: 'MANUAL_HUMAN',
          immutableHash: 'sha256-8a9f3b12ce784a6e5d2c1f9b8e0a4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e'
        },
        applicableContexts: ['TYPESCRIPT', 'CODE_EXECUTION', 'MULTI_AGENT'],
        relatedTaskIds: ['tsk-001', 'tsk-002'],
        relatedRequirementIds: ['req-001', 'req-002'],
        relatedConstitutionalArticles: ['ARTICLE_I_SCOPE_INTEGRITY', 'ARTICLE_IV_SANDBOX_BOUNDARIES'],
        usageCount: 24,
        successRate: 96,
        freshnessScore: 92,
        createdTimestamp: '2026-09-18T14:22:00.000Z',
        updatedTimestamp: '2026-09-20T10:00:00.000Z'
      },
      {
        id: 'mem-002',
        organizationId: orgId,
        projectId: projId,
        title: 'Preventing Circular Agent Handoffs in High-Complexity Tasks',
        type: 'LESSON_LEARNED',
        category: 'COLLABORATION_DYNAMICS',
        summary: 'Impose strict handoff depth limits (max 3 rounds) with mandated critic diff justification to prevent infinite debate.',
        detailedContent: 'When autonomous reviewer and executor agents disagree, unconstrained review cycles lead to exponential cost accumulation. Injecting clear acceptance criteria and constitutional arbitration stops circular feedback after 3 iterations.',
        status: 'VERIFIED',
        provenance: {
          sourceTaskId: 'tsk-002',
          authorId: 'usr-lead',
          authorRole: 'PROJECT_LEAD',
          organizationId: orgId,
          projectId: projId,
          verifiedBy: 'usr-lead',
          verifiedAt: '2026-09-21T11:30:00.000Z',
          confidenceScore: 0.95,
          verificationMethod: 'MANUAL_HUMAN',
          immutableHash: 'sha256-4c7b8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c'
        },
        applicableContexts: ['COLLABORATION_CONTRACT', 'CRITIC_REVIEW'],
        relatedTaskIds: ['tsk-002'],
        relatedRequirementIds: ['req-003'],
        relatedConstitutionalArticles: ['ARTICLE_II_LEAD_OVERRIDE'],
        usageCount: 18,
        successRate: 94,
        freshnessScore: 88,
        createdTimestamp: '2026-09-21T09:15:00.000Z',
        updatedTimestamp: '2026-09-21T11:30:00.000Z'
      },
      {
        id: 'mem-003',
        organizationId: orgId,
        projectId: projId,
        title: 'ADR-009: In-Memory Monolithic Authoritative Storage Engine',
        type: 'ARCHITECTURAL_DECISION',
        category: 'SYSTEM_ARCHITECTURE',
        summary: 'Architectural decision adopting single-process transactional in-memory store for microsecond gate evaluations.',
        detailedContent: 'To satisfy strict governance gate SLAs (< 5ms per validation check), the authoritative store is held in memory with synchronous audit hashing and relational foreign-key consistency invariants.',
        status: 'ACTIVE',
        provenance: {
          sourceDecisionId: 'dec-001',
          authorId: 'usr-arch',
          authorRole: 'ARCHITECT',
          organizationId: orgId,
          projectId: projId,
          verifiedBy: 'usr-lead',
          verifiedAt: '2026-09-15T08:00:00.000Z',
          confidenceScore: 0.99,
          verificationMethod: 'CONSENSUS_AUDIT',
          immutableHash: 'sha256-9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e'
        },
        applicableContexts: ['BACKEND_ENGINEERING', 'STATE_MACHINE'],
        relatedTaskIds: ['tsk-001'],
        relatedRequirementIds: ['req-001'],
        relatedConstitutionalArticles: ['ARTICLE_III_DETERMINISTIC_STATE'],
        usageCount: 42,
        successRate: 100,
        freshnessScore: 98,
        createdTimestamp: '2026-09-15T08:00:00.000Z',
        updatedTimestamp: '2026-09-25T12:00:00.000Z'
      },
      {
        id: 'mem-004',
        organizationId: orgId,
        projectId: projId,
        title: 'INC-042: Unbounded Retry Loop in Schema Migrations',
        type: 'POST_MORTEM',
        category: 'INCIDENT_RECOVERY',
        summary: 'Post-mortem on schema migration timeout caused by missing lock release on failed compile.',
        detailedContent: 'A migration script crashed before releasing its internal semaphore, causing 5 sequential task retries to fail identically. Remediation: Added deterministic try-finally semaphore releases and exponential backoff retry back-pressure.',
        status: 'VERIFIED',
        provenance: {
          sourceIncidentId: 'inc-042',
          authorId: 'usr-qa',
          authorRole: 'QA',
          organizationId: orgId,
          projectId: projId,
          verifiedBy: 'usr-lead',
          verifiedAt: '2026-09-24T16:45:00.000Z',
          confidenceScore: 0.92,
          verificationMethod: 'MANUAL_HUMAN',
          immutableHash: 'sha256-1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
        },
        applicableContexts: ['DATABASE_MIGRATION', 'CONCURRENCY'],
        relatedTaskIds: ['tsk-003'],
        relatedRequirementIds: ['req-002'],
        relatedConstitutionalArticles: ['ARTICLE_IV_FAULT_ISOLATION'],
        usageCount: 11,
        successRate: 91,
        freshnessScore: 85,
        createdTimestamp: '2026-09-24T15:00:00.000Z',
        updatedTimestamp: '2026-09-24T16:45:00.000Z'
      }
    ];
    this.organizationalMemories.set(projId, initialMemories);

    // 18. Phase 9 Detected Patterns
    const initialPatterns: DetectedPattern[] = [
      {
        id: 'pat-001',
        organizationId: orgId,
        projectId: projId,
        category: 'ANTI_PATTERN',
        severity: 'HIGH',
        title: 'Over-Broad Scope Lock in Execution Tasks',
        signature: 'SIG-SCOPE-OVERBROAD-WILD',
        occurrenceCount: 5,
        firstSeen: '2026-09-22T08:00:00.000Z',
        lastSeen: '2026-09-27T14:30:00.000Z',
        affectedComponents: ['src/server/storage.ts', 'src/types/index.ts'],
        affectedTaskIds: ['tsk-002', 'tsk-003'],
        correlationScore: 0.78,
        rootCauseHypothesis: 'Tasks declaring top-level directory wildcards create cross-boundary validation conflicts.',
        actionableMitigation: 'Enforce exact symbol & file isolation instead of directory-level globs in task readiness contracts.',
        resolved: false
      },
      {
        id: 'pat-002',
        organizationId: orgId,
        projectId: projId,
        category: 'FLAKY_TEST',
        severity: 'MEDIUM',
        title: 'Intermittent Async Timeout in Concurrent Tool Dispatch',
        signature: 'SIG-ASYNC-RACE-TIMEOUT',
        occurrenceCount: 3,
        firstSeen: '2026-09-23T11:15:00.000Z',
        lastSeen: '2026-09-26T17:45:00.000Z',
        affectedComponents: ['src/server/execution/adaptivePipeline.ts'],
        affectedTaskIds: ['tsk-003'],
        correlationScore: 0.62,
        rootCauseHypothesis: 'Microsecond delay between event emission and state resolution during concurrent stress tests.',
        actionableMitigation: 'Introduce deterministic event loop drain barrier before asserting state in regression runs.',
        resolved: true,
        resolvedAt: '2026-09-27T10:00:00.000Z'
      },
      {
        id: 'pat-003',
        organizationId: orgId,
        projectId: projId,
        category: 'SUCCESS_PATTERN',
        severity: 'LOW',
        title: 'Pre-Flight Lint Verification in Dual-Agent Pair',
        signature: 'SIG-DUAL-LINT-PASS',
        occurrenceCount: 14,
        firstSeen: '2026-09-20T09:00:00.000Z',
        lastSeen: '2026-09-28T06:00:00.000Z',
        affectedComponents: ['src/server/execution/collaborationEngine.ts'],
        affectedTaskIds: ['tsk-001', 'tsk-002'],
        correlationScore: 0.91,
        rootCauseHypothesis: 'AST compiler verification before Critic review reduces review round-trips by 65%.',
        actionableMitigation: 'Standardize pre-flight AST compiler pass across all code modification workflows.',
        resolved: true,
        resolvedAt: '2026-09-28T06:30:00.000Z'
      }
    ];
    this.detectedPatterns.set(projId, initialPatterns);

    // 19. Phase 9 Learning Metric Snapshots
    const initialSnapshots: LearningMetricSnapshot[] = [
      {
        id: 'snap-001',
        projectId: projId,
        organizationId: orgId,
        metricName: 'First-Pass Yield',
        category: 'FIRST_PASS_YIELD',
        value: 94.2,
        baselineValue: 82.0,
        unit: '%',
        trend: 'IMPROVING',
        changePercent: 14.8,
        confidence: 'HIGH',
        timestamp: '2026-09-28T06:00:00.000Z',
        sampleSize: 32,
        regressionAlert: false
      },
      {
        id: 'snap-002',
        projectId: projId,
        organizationId: orgId,
        metricName: 'Validation Failure Rate',
        category: 'FAILURE_RATE',
        value: 5.8,
        baselineValue: 18.0,
        unit: '%',
        trend: 'IMPROVING',
        changePercent: -67.7,
        confidence: 'HIGH',
        timestamp: '2026-09-28T06:00:00.000Z',
        sampleSize: 32,
        regressionAlert: false
      },
      {
        id: 'snap-003',
        projectId: projId,
        organizationId: orgId,
        metricName: 'Average Retry Frequency',
        category: 'RETRY_FREQUENCY',
        value: 0.7,
        baselineValue: 2.4,
        unit: 'retries/task',
        trend: 'IMPROVING',
        changePercent: -70.8,
        confidence: 'HIGH',
        timestamp: '2026-09-28T06:00:00.000Z',
        sampleSize: 32,
        regressionAlert: false
      },
      {
        id: 'snap-004',
        projectId: projId,
        organizationId: orgId,
        metricName: 'Flakiness Index',
        category: 'FLAKINESS_INDEX',
        value: 0.9,
        baselineValue: 4.2,
        unit: '%',
        trend: 'IMPROVING',
        changePercent: -78.5,
        confidence: 'MEDIUM',
        timestamp: '2026-09-28T06:00:00.000Z',
        sampleSize: 28,
        regressionAlert: false
      },
      {
        id: 'snap-005',
        projectId: projId,
        organizationId: orgId,
        metricName: 'Requirement Drift Rate',
        category: 'DRIFT_INDEX',
        value: 0.0,
        baselineValue: 3.5,
        unit: '%',
        trend: 'IMPROVING',
        changePercent: -100.0,
        confidence: 'HIGH',
        timestamp: '2026-09-28T06:00:00.000Z',
        sampleSize: 32,
        regressionAlert: false
      }
    ];
    this.learningMetricSnapshots.set(projId, initialSnapshots);

    // 20. Phase 9 System Evolution Proposals
    const initialProposals: EvolutionProposal[] = [
      {
        id: 'evo-001',
        organizationId: orgId,
        projectId: projId,
        title: 'Synthesize Pre-Execution Linter Gate into Adaptive Pipeline',
        targetDomain: 'VALIDATION_RULE',
        rationale: 'Pattern SIG-DUAL-LINT-PASS demonstrated 65% reduction in multi-agent review iterations when static AST check is executed before handoff.',
        synthesizedRuleOrPolicy: 'RULE-VAL-PRELINT-01: Automatically invoke lint verification prior to Gate 4 state staging.',
        triggeringPatternIds: ['pat-003'],
        triggeringMemoryIds: ['mem-001'],
        currentValue: 'Manual / Post-Critic Lint Run',
        proposedValue: 'Automated Pre-Flight Gate 3.5 Linter Enforcement',
        simulatedImpact: {
          predictedImprovementPercent: 24,
          riskRating: 'MINIMAL',
          affectedWorkflows: ['Autonomous Execution Pipeline', 'Critic Handoff']
        },
        status: 'APPLIED',
        requiredAuthority: 'PROJECT_LEAD',
        isConstitutionallyCompliant: true,
        reversibility: 'REVERSIBLE',
        rollbackAction: 'Disable pipeline step 3.5 and restore direct Gate 4 staging.',
        proposedBy: 'usr-arch',
        reviewedBy: 'usr-lead',
        appliedAt: '2026-09-28T06:15:00.000Z',
        timestamp: '2026-09-28T05:30:00.000Z'
      },
      {
        id: 'evo-002',
        organizationId: orgId,
        projectId: projId,
        title: 'Recalibrate Max Retry Ceiling from 5 to 3 with Error-Diff Reflection',
        targetDomain: 'RETRY_POLICY',
        rationale: 'Observed that retries past iteration 3 exhibit 89% failure rate without prompt diff injection. Lowering ceiling and injecting failure reflection prevents wasted execution fees.',
        synthesizedRuleOrPolicy: 'POLICY-RETRY-BOUND-02: Clamp automated retries to 3 iterations with mandatory failure-conditioned context injection.',
        triggeringPatternIds: ['pat-001'],
        triggeringMemoryIds: ['mem-002', 'mem-004'],
        currentValue: 'maxRetries = 5, staticPrompt',
        proposedValue: 'maxRetries = 3, failureReflectivePrompt',
        simulatedImpact: {
          predictedImprovementPercent: 32,
          riskRating: 'MINIMAL',
          affectedWorkflows: ['Adaptive Execution Engine', 'Task Recovery']
        },
        status: 'PROPOSED',
        requiredAuthority: 'PROJECT_LEAD',
        isConstitutionallyCompliant: true,
        reversibility: 'REVERSIBLE',
        rollbackAction: 'Restore maxRetries to 5 and remove dynamic reflection hook.',
        proposedBy: 'usr-lead',
        timestamp: '2026-09-28T06:45:00.000Z'
      }
    ];
    this.evolutionProposals.set(projId, initialProposals);

    // ==========================================
    // Seed Phase 10: Advanced Governance, Resilience & Production Hardening
    // ==========================================

    // 21. Circuit Breakers
    const breakers: CircuitBreakerRecord[] = [
      {
        target: 'AI_PROVIDER',
        state: 'CLOSED',
        failureCount: 0,
        failureThreshold: 3,
        resetTimeoutMs: 30000,
        lastSuccessTime: new Date().toISOString(),
        auditNotes: 'Healthy; upstream latency average 210ms.'
      },
      {
        target: 'EXTERNAL_API',
        state: 'CLOSED',
        failureCount: 0,
        failureThreshold: 5,
        resetTimeoutMs: 30000,
        lastSuccessTime: new Date().toISOString(),
        auditNotes: 'Third-party integrations operating normally.'
      },
      {
        target: 'TASK_PIPELINE',
        state: 'CLOSED',
        failureCount: 0,
        failureThreshold: 5,
        resetTimeoutMs: 30000,
        lastSuccessTime: new Date().toISOString(),
        auditNotes: 'Autonomous worker queue operational with zero stalls.'
      },
      {
        target: 'STORAGE',
        state: 'CLOSED',
        failureCount: 0,
        failureThreshold: 3,
        resetTimeoutMs: 60000,
        lastSuccessTime: new Date().toISOString(),
        auditNotes: 'In-memory relational engine operating with zero lock contention.'
      }
    ];
    breakers.forEach(b => this.circuitBreakers.set(b.target, b));

    // 22. Backup & Disaster Recovery Snapshots
    const initialBackup: BackupRecord = {
      id: 'bk-core-001',
      projectId: projId,
      backupClass: 'CRITICAL',
      snapshotHash: 'sha256-bk-proj-core-os-7a9f8b1c4e2d3f5a',
      entityCounts: {
        projects: 1,
        requirements: 3,
        tasks: 4,
        decisions: 2,
        validationContracts: 4,
        auditLogs: 32,
        memories: 4
      },
      sizeBytes: 44032,
      rpoTargetMinutes: 15,
      rtoTargetMinutes: 5,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'VERIFIED'
    };
    this.backups.set(projId, [initialBackup]);

    const initialRestore: RestoreTestRecord = {
      id: 'rst-001',
      backupId: initialBackup.id,
      startedAt: new Date(Date.now() - 43200000).toISOString(),
      completedAt: new Date(Date.now() - 43199976).toISOString(),
      durationMs: 24,
      restoredEntityCount: 50,
      integrityVerified: true,
      status: 'RESTORE_PASSED',
      notes: 'Scheduled disaster recovery drill passed in 24ms. RTO target (< 5m) satisfied with 100% entity fidelity.'
    };
    this.restoreTests.set(initialBackup.id, [initialRestore]);

    // 23. Production Incidents
    const initialIncident: ProductionIncident = {
      id: 'inc-001',
      incidentId: 'INC-201',
      projectId: projId,
      title: 'Intermittent Latency Spike in Upstream AI Provider',
      severity: 'SEV2',
      category: 'AI_PROVIDER',
      status: 'RESOLVED',
      detectedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      resolvedAt: new Date(Date.now() - 86400000 * 3 + 1800000).toISOString(),
      affectedSystems: ['Gemini 2.5 Pro Gateway', 'Adaptive Pipeline'],
      containmentActions: ['Activated dynamic context compression', 'Clamped concurrency to 4 workers'],
      owner: 'usr-lead',
      rootCauseAnalysis: {
        category: 'AI_PROVIDER',
        rootCause: 'Upstream quota burst during concurrent regression suite run.',
        correctiveActions: [
          'Introduced circuit breaker for AI provider with 3-failure threshold',
          'Enabled rate-limit backoff jitter and secondary model fallback'
        ]
      },
      timeline: [
        {
          timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
          phase: 'DETECTED',
          actor: 'telemetryEngine',
          action: 'INCIDENT_DETECTED',
          details: 'P95 latency exceeded 4500ms threshold.'
        },
        {
          timestamp: new Date(Date.now() - 86400000 * 3 + 600000).toISOString(),
          phase: 'CONTAINED',
          actor: 'usr-lead',
          action: 'CONTAINMENT_APPLIED',
          details: 'Temporarily clamped concurrency ceiling and activated context compression.'
        },
        {
          timestamp: new Date(Date.now() - 86400000 * 3 + 1800000).toISOString(),
          phase: 'RESOLVED',
          actor: 'usr-lead',
          action: 'INCIDENT_RESOLVED',
          details: 'Upstream gateway stabilized. Circuit breaker confirmed healthy.'
        }
      ]
    };
    this.incidents.set(projId, [initialIncident]);

    // 24. Governed Production Deployment
    const initialDeployment: DeploymentRecord = {
      id: `dep-${projId}-v1`,
      projectId: projId,
      version: 1,
      targetEnvironment: 'PRODUCTION',
      state: 'DEPLOYED',
      releaseGates: [
        { id: 'gate-1', name: 'Approved Requirements Consistency', required: true, passed: true, notes: 'Requirements clean.' },
        { id: 'gate-2', name: 'Zero Unresolved Critical Security Findings', required: true, passed: true, notes: 'Zero critical findings.' },
        { id: 'gate-3', name: 'Automated Validation & Contract Integrity', required: true, passed: true, notes: 'All validation contracts passed.' },
        { id: 'gate-4', name: 'Zero Unauthorized Architecture Drift', required: true, passed: true, notes: 'No drift detected.' },
        { id: 'gate-5', name: 'Verified Reversible Rollback Mechanism', required: true, passed: true, notes: 'Container tag revert verified.' },
        { id: 'gate-6', name: 'Human Lead Governance Authorization', required: true, passed: true, notes: 'Lead signed off.' },
        { id: 'gate-7', name: 'Database Schema Migration Compatibility', required: true, passed: true, notes: 'Migration verified.' },
        { id: 'gate-8', name: 'Pre-Deployment Authoritative Backup Snapshot', required: true, passed: true, notes: 'Snapshot bk-core-001 on record.' }
      ],
      rollbackAvailable: true,
      rollbackAction: 'Revert container tag to v0.9.8 and restore previous schema migration snapshot.',
      approvedBy: 'usr-lead',
      deployedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      verifiedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      notes: 'Initial production release v1.0.0 operational.'
    };
    this.deployments.set(projId, [initialDeployment]);

    // 25. Standard Operational Runbooks
    this.runbooks = [
      {
        id: 'rbk-001',
        scenario: 'AI Provider Outage or Rate Limit Burst (HTTP 429)',
        category: 'AI_PROVIDER',
        triggerConditions: ['Circuit breaker for AI_PROVIDER trips to OPEN', 'Consecutive 429/503 responses > 3'],
        steps: [
          { stepNumber: 1, action: 'Assert Provider Circuit Breaker', commandOrEndpoint: 'GET /api/projects/:id/resilience/circuit-breakers', expectedOutcome: 'Verify AI_PROVIDER breaker state is OPEN.' },
          { stepNumber: 2, action: 'Activate Fallback Model Route', commandOrEndpoint: 'POST /api/projects/:id/resilience/ai-fallback', expectedOutcome: 'Route autonomous tasks to Gemini 2.5 Flash secondary endpoint.' },
          { stepNumber: 3, action: 'Inspect Task Pipeline Queue', commandOrEndpoint: 'GET /api/projects/:id/tasks', expectedOutcome: 'Confirm ongoing tasks paused gracefully without state corruption.' },
          { stepNumber: 4, action: 'Test Breaker in HALF_OPEN Mode', commandOrEndpoint: 'POST /api/projects/:id/resilience/circuit-breakers/reset', expectedOutcome: 'Dispatch trial ping once provider recovers.' }
        ],
        lastValidated: '2026-09-28'
      },
      {
        id: 'rbk-002',
        scenario: 'Disaster Recovery: Complete Database & State Restoration',
        category: 'DISASTER_RECOVERY',
        triggerConditions: ['Storage engine corruption detected', 'Data integrity foreign-key mismatch > 0'],
        steps: [
          { stepNumber: 1, action: 'Halt All Autonomous Tasks', commandOrEndpoint: 'POST /api/projects/:id/resilience/safe-mode', expectedOutcome: 'System transitions to SAFE_MODE.' },
          { stepNumber: 2, action: 'Fetch Latest Verified Backup Snapshot', commandOrEndpoint: 'GET /api/projects/:id/resilience/backups', expectedOutcome: 'Identify most recent VERIFIED snapshot with valid hash.' },
          { stepNumber: 3, action: 'Execute Restore Drill Verification', commandOrEndpoint: 'POST /api/projects/:id/resilience/backups/:id/restore-test', expectedOutcome: 'Assert RESTORE_PASSED and RTO < 5m.' },
          { stepNumber: 4, action: 'Run Full Data Integrity Audit', commandOrEndpoint: 'GET /api/projects/:id/resilience/integrity/check', expectedOutcome: 'All 6 integrity checks return passed: true.' },
          { stepNumber: 5, action: 'Restore System to NORMAL Mode', commandOrEndpoint: 'POST /api/projects/:id/resilience/normal-mode', expectedOutcome: 'System operational.' }
        ],
        lastValidated: '2026-09-28'
      },
      {
        id: 'rbk-003',
        scenario: 'Critical Security Secret Leak Trapping & Forensics',
        category: 'SECURITY',
        triggerConditions: ['Secret detection regex matches API key / token', 'Security Finding severity CRITICAL created'],
        steps: [
          { stepNumber: 1, action: 'Halt Compromised Agent / Task', commandOrEndpoint: 'POST /api/projects/:id/resilience/containment/halt-agent', expectedOutcome: 'Offending execution stopped immediately.' },
          { stepNumber: 2, action: 'Redact Secret Snippet from Prompt & Telemetry', commandOrEndpoint: 'Automatic in prompt compiler', expectedOutcome: 'Replace raw key with SHA-256 fingerprint.' },
          { stepNumber: 3, action: 'Create Security Incident', commandOrEndpoint: 'POST /api/projects/:id/resilience/incidents', expectedOutcome: 'Incident registered at SEV1.' },
          { stepNumber: 4, action: 'Rotate Compromised Credentials Server-Side', commandOrEndpoint: 'Server env secret update', expectedOutcome: 'Old credential revoked; new credential provisioned.' }
        ],
        lastValidated: '2026-09-28'
      },
      {
        id: 'rbk-004',
        scenario: 'Emergency Production Release Rollback',
        category: 'DEPLOYMENT',
        triggerConditions: ['Post-deployment error rate spike', 'Validation failure detected in production environment'],
        steps: [
          { stepNumber: 1, action: 'Verify Current Deployment State', commandOrEndpoint: 'GET /api/projects/:id/resilience/deployments', expectedOutcome: 'Confirm active deployment ID.' },
          { stepNumber: 2, action: 'Execute Rollback Command', commandOrEndpoint: 'POST /api/projects/:id/resilience/deployments/:id/rollback', expectedOutcome: 'Rollback action executed and recorded in audit log.' },
          { stepNumber: 3, action: 'Verify Prior Container & State Snapshot', commandOrEndpoint: 'GET /api/projects/:id/resilience/health', expectedOutcome: 'Health checks return all systems GREEN.' }
        ],
        lastValidated: '2026-09-28'
      },
      {
        id: 'rbk-005',
        scenario: 'Agent Scope Lock Breach Containment',
        category: 'AGENT_CONTAINMENT',
        triggerConditions: ['Gate 2 traps file write outside task.relevantFiles contract'],
        steps: [
          { stepNumber: 1, action: 'Assert Scope Lock Failure Signature', commandOrEndpoint: 'Recorded automatically at Gate 2', expectedOutcome: 'Disk write rejected before filesystem touch.' },
          { stepNumber: 2, action: 'Stage Exception in Decision Queue', commandOrEndpoint: 'GET /api/projects/:id/decision-queue', expectedOutcome: 'Decision queue item present for Lead arbitration.' },
          { stepNumber: 3, action: 'Update Agent Trust Calibration', commandOrEndpoint: 'Automatic via TrustEngine', expectedOutcome: 'Trust profile decremented for unconstrained file modification.' }
        ],
        lastValidated: '2026-09-28'
      }
    ];

    // 26. Degradation Level
    this.degradationLevels.set(projId, 'NORMAL');

    // Seed Audit Log
    this.recordAudit({
      actorId: 'usr-lead',
      actorRole: 'PROJECT_LEAD',
      action: 'SYSTEM_INITIALIZED',
      targetEntity: 'System',
      targetId: 'arcadia-core',
      projectId: projId,
      afterState: { version: '1.0.0', mode: 'MODULAR_MONOLITH' },
      correlationId: 'corr-init-0001'
    });
  }
}

// Singleton storage instance for the application
export const storage = new StorageEngine();
