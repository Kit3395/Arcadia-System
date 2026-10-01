/**
 * ARCADIA SYSTEM - FOUNDATION SPECIFICATION v1.0
 * Canonical Type Definitions
 */

export type UserRole = 
  | 'CLIENT' 
  | 'PROJECT_LEAD' 
  | 'ARCHITECT' 
  | 'DEVELOPER' 
  | 'QA' 
  | 'SECURITY' 
  | 'OPERATIONS';

export type Permission = 
  | 'project.read'
  | 'project.create'
  | 'project.update'
  | 'project.state_transition'
  | 'constitution.update'
  | 'requirement.read'
  | 'requirement.create'
  | 'requirement.approve'
  | 'decision.read'
  | 'decision.create'
  | 'decision.approve'
  | 'task.read'
  | 'task.create'
  | 'task.assign'
  | 'task.execute'
  | 'task.state_transition'
  | 'execution.read'
  | 'execution.start'
  | 'execution.stop'
  | 'execution.validate'
  | 'agent.manage'
  | 'audit.read'
  | 'admin.config'
  | 'validation.read'
  | 'validation.create'
  | 'validation.execute'
  | 'validation.run'
  | 'validation.waive'
  | 'validation.approve'
  | 'security.read'
  | 'security.scan'
  | 'security.resolve'
  | 'security.incident_manage'
  | 'drift.read'
  | 'drift.detect'
  | 'drift.reconcile'
  | 'drift.resolve'
  | 'risk.accept'
  | 'optimization.read'
  | 'optimization.recommend'
  | 'optimization.approve'
  | 'optimization.apply'
  | 'optimization.policy'
  | 'telemetry.read'
  | 'cost.read'
  | 'learning.read'
  | 'learning.write'
  | 'learning.verify'
  | 'learning.evolve'
  | 'resilience.read'
  | 'resilience.admin'
  | 'incident.manage'
  | 'deployment.approve'
  | 'deployment.rollback'
  | 'dr.execute'
  | 'verification.read'
  | 'verification.execute'
  | 'golive.read'
  | 'golive.approve'
  | 'operations.read'
  | 'operations.admin'
  | 'operations.emergency'
  | 'maintenance.manage'
  | 'assurance.read'
  | 'assurance.manage';

export interface User {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export type ProjectComplexity = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export type ProjectPrimaryState = 
  | 'INTAKE'
  | 'INTELLIGENCE'
  | 'CLARIFICATION'
  | 'BLUEPRINT'
  | 'GOVERNANCE'
  | 'PLANNED'
  | 'EXECUTION'
  | 'VALIDATION'
  | 'COMPLETED';

export type GovernanceState = 'CLEAR' | 'DECISION_REQUIRED' | 'OVERDUE' | 'ESCALATED' | 'RESOLVED';
export type SecurityState = 'CLEAR' | 'REVIEW_REQUIRED' | 'RESTRICTED' | 'ESCALATED' | 'BLOCKED' | 'RESOLVED';
export type DriftState = 'ALIGNED' | 'DRIFT_DETECTED' | 'CLASSIFIED' | 'CORRECTING';
export type TimelineState = 'ON_TRACK' | 'AT_RISK' | 'DELAYED' | 'CRITICAL_PATH' | 'BLOCKED';
export type CognitiveLoadState = 'NORMAL' | 'ELEVATED' | 'HIGH' | 'ATTENTION_REQUIRED';

export type SecurityClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'SENSITIVE' | 'REGULATED';

export interface ProjectConstitution {
  id: string;
  projectId: string;
  version: number;
  approvedStack: {
    frontend: string;
    backend: string;
    database: string;
    deployment: string;
  };
  securityClassification: SecurityClassification;
  complianceProfiles: string[];
  prohibitedDependencies: string[];
  governanceRules: Array<{
    id: string;
    rule: string;
    enforcement: 'LINTER' | 'CI' | 'HUMAN_GATE';
  }>;
  isCurrent: boolean;
  approvedBy: string;
  createdAt: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string;
  complexityLevel: ProjectComplexity;
  primaryState: ProjectPrimaryState;
  governanceState: GovernanceState;
  securityState: SecurityState;
  driftState: DriftState;
  timelineState: TimelineState;
  cognitiveLoadState: CognitiveLoadState;
  securityClassification?: SecurityClassification;
  currentVersion: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export type RequirementSource = 
  | 'CLIENT_REQUEST'
  | 'USER_REQUEST'
  | 'CLIENT_DOCUMENT'
  | 'CONTRACT'
  | 'TEAM_DECISION'
  | 'SYSTEM_RULE'
  | 'LEGAL_REGULATORY'
  | 'AI_RECOMMENDATION'
  | 'AI_INFERENCE'
  | 'ASSUMPTION'
  | 'EXTERNAL_REFERENCE';

export type RequirementClassification = 
  | 'FACT'
  | 'REQUEST'
  | 'DECISION'
  | 'INFERENCE'
  | 'ASSUMPTION'
  | 'RECOMMENDATION'
  | 'PROPOSAL';

export type RequirementStatus = 
  | 'PROPOSED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DEFERRED'
  | 'SUPERSEDED'
  | 'IMPLEMENTED'
  | 'VALIDATED'
  | 'VERIFIED';

export interface Requirement {
  id: string;
  projectId: string;
  reqIdentifier: string; // e.g. "REQ-AUTH-01"
  description: string;
  source: RequirementSource;
  sourceReference?: string;
  classification: RequirementClassification;
  status: RequirementStatus;
  confidenceScore: number;
  version: number;
  isCurrent: boolean;
  ownerId: string;
  approvedById?: string;
  affectedComponents: string[];
  createdAt: string;
  updatedAt: string;
}

export type DecisionStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';

export interface Decision {
  id: string;
  projectId: string;
  decisionIdentifier: string; // e.g. "DEC-ARCH-01"
  title: string;
  description: string;
  context: string;
  options: string[];
  selectedOption: string;
  authority: string;
  evidence: string;
  status: DecisionStatus;
  version: number;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskState = 'DRAFT' | 'READY' | 'ASSIGNED' | 'RUNNING' | 'VALIDATING' | 'PASSED' | 'FAILED' | 'BLOCKED';
export type TaskComplexity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface UniversalTaskSpecification {
  taskId: string;
  projectId: string;
  taskIdentifier: string;
  title: string;
  objective: string;
  complexity: TaskComplexity;
  state: TaskState;
  requirementsSatisfied: string[]; // List of reqIdentifiers
  dependencies: string[]; // List of taskIds required
  allowedActions: string[];
  prohibitedActions: string[];
  architectureSlice: {
    relevantModules: string[];
    contractsToPreserve: string[];
  };
  relevantFiles: Array<{
    path: string;
    readOnly: boolean;
  }>;
  acceptanceCriteria: string[];
  validationRequirements: {
    mandatoryTests: string[];
    staticChecks: string[];
    maxExecutionTimeMs: number;
  };
  stopConditions: string[];
  escalationConditions: string[];
  assignedAgentId?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export type DecisionQueueCategory = 
  | 'APPROVAL'
  | 'EXCEPTION'
  | 'VALIDATION_FAILURE'
  | 'SECURITY_ALERT'
  | 'RECOMMENDATION'
  | 'DRIFT'
  | 'ESCALATION'
  | 'AMBIGUITY';

export type DecisionQueuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKER';
export type DecisionQueueStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DEFERRED';

export interface DecisionQueueItem {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: DecisionQueueCategory;
  priority: DecisionQueuePriority;
  status: DecisionQueueStatus;
  impactAnalysis?: {
    scopeDelta: string;
    affectedTasks: string[];
    riskScore: number;
  };
  contextPayload: Record<string, unknown>;
  resolvedBy?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  projectId?: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  targetEntity: string;
  targetId: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  correlationId: string;
  timestamp: string;
}

export interface TestResult {
  name: string;
  category: 'DOMAIN' | 'SECURITY' | 'RBAC' | 'TENANT' | 'SCOPE_LOCK' | 'AUDIT' | 'EXECUTION' | 'CONTEXT' | 'PROMPT' | 'AGENT' | 'VALIDATION' | 'DRIFT' | 'REGRESSION' | 'FUNCTIONAL' | 'OPTIMIZATION' | 'LEARNING' | 'RESILIENCE' | 'INTEGRATION' | 'VERIFICATION' | 'OPERATIONS' | 'MAINTENANCE' | 'ASSURANCE';
  passed: boolean;
  message: string;
  durationMs: number;
}

// ============================================================================
// PHASE 5: EXECUTION LAYER DOMAIN TYPES
// ============================================================================

export type ExecutionState =
  | 'READY'
  | 'CONTEXT_ASSEMBLED'
  | 'PROMPT_VALIDATED'
  | 'AGENT_ASSIGNED'
  | 'RUNNING'
  | 'EVIDENCE_CAPTURE'
  | 'VALIDATING'
  | 'PASSED'
  | 'FAILED'
  | 'RETRYING'
  | 'FALLBACK'
  | 'BLOCKED'
  | 'CANCELLED'
  | 'STOPPED'
  | 'SECURITY_BLOCKED'
  | 'SCOPE_VIOLATION'
  | 'ESCALATED';

export type TaskReadinessStatus =
  | 'READY'
  | 'NOT_READY'
  | 'BLOCKED'
  | 'REQUIRES_DECISION'
  | 'REQUIRES_APPROVAL'
  | 'SECURITY_REVIEW_REQUIRED'
  | 'DEPENDENCY_BLOCKED';

export interface TaskReadinessGateCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
}

export interface TaskReadinessGateResult {
  status: TaskReadinessStatus;
  passed: boolean;
  checks: TaskReadinessGateCheck[];
  blockingReasons: string[];
  missingPrerequisites: {
    dependencies?: string[];
    requirements?: string[];
    decisions?: string[];
    approvals?: string[];
  };
}

export type ContextSourceType =
  | 'PROJECT_CONSTITUTION'
  | 'REQUIREMENT'
  | 'DECISION'
  | 'ARCHITECTURE'
  | 'UX_SPECIFICATION'
  | 'UI_SPECIFICATION'
  | 'TASK'
  | 'TASK_DEPENDENCY'
  | 'SECURITY_POLICY'
  | 'COMPLIANCE_POLICY'
  | 'PROJECT_STATE'
  | 'EXECUTION_STATE'
  | 'FILE'
  | 'DOCUMENT'
  | 'VALIDATION_RULE'
  | 'CHANGE_REQUEST'
  | 'CHANGE_IMPACT'
  | 'OTHER_APPROVED_SOURCE';

export type ContextAuthorityLevel =
  | 'CONSTITUTION'
  | 'GOVERNANCE'
  | 'PROJECT_STATE'
  | 'DECISION_INTELLIGENCE'
  | 'ORCHESTRATION'
  | 'EXECUTION'
  | 'VALIDATION'
  | 'LEARNING';

export interface ContextItem {
  id: string;
  projectId: string;
  sourceType: ContextSourceType;
  sourceId: string;
  contentReference: string;
  authorityLevel: ContextAuthorityLevel;
  status: string;
  provenance: string;
  confidence: number;
  sensitivity: SecurityClassification;
  relevanceScore: number;
  dependencyRelationship?: string;
  version: number;
  createdAt: string;
  inclusionReason?: string;
  exclusionReason?: string;
  content: Record<string, unknown> | string;
}

export interface ContextConflict {
  itemAId: string;
  itemBId: string;
  conflictDescription: string;
  resolution: 'RESOLVED_BY_AUTHORITY' | 'UNRESOLVED_BLOCKING' | 'UNRESOLVED_WARNING';
  winnerId?: string;
  resolutionNotes: string;
}

export interface ContextManifestEntry {
  id: string;
  sourceType: ContextSourceType;
  sourceId: string;
  status: 'INCLUDED' | 'EXCLUDED';
  reason: string;
  authority: ContextAuthorityLevel;
  sensitivity: SecurityClassification;
}

export interface ContextPackage {
  id: string;
  projectId: string;
  taskId: string;
  version: number;
  generatedAt: string;
  items: ContextItem[];
  includedSourceIds: string[];
  excludedSourceIds: string[];
  conflicts: ContextConflict[];
  dependencies: string[];
  securityRestrictions: string[];
  tokenBudget: {
    totalEstimatedTokens: number;
    maxBudget: number;
  };
  compressionMetadata: {
    originalItemCount: number;
    compressedItemCount: number;
    compressionRatio: number;
  };
  manifest: ContextManifestEntry[];
}

export interface PromptHealthCheckItem {
  category: string;
  test: string;
  passed: boolean;
  message: string;
  blocking: boolean;
}

export interface PromptHealthCheck {
  status: 'HEALTHY' | 'WARNING' | 'BLOCKED';
  checks: PromptHealthCheckItem[];
  blockingIssues: string[];
  warnings: string[];
}

export interface PromptStructure {
  role: string;
  objective: string;
  scope: {
    allowedActions: string[];
    prohibitedActions: string[];
    relevantFiles: string[];
  };
  requirements: string[];
  contextSummary: string;
  acceptanceCriteria: string[];
  stopConditions: string[];
  escalationConditions: string[];
  formatInstructions: string;
}

export interface PromptVersion {
  id: string;
  projectId: string;
  taskId: string;
  contextPackageId: string;
  agentId: string;
  agentVersion: string;
  compilerVersion: string;
  executionPolicyVersion: string;
  generatedAt: string;
  promptHash: string;
  promptContent: string;
  healthCheck: PromptHealthCheck;
  structure: PromptStructure;
}

export type AgentCapability =
  | 'TEXT_GENERATION'
  | 'CODE_GENERATION'
  | 'CODE_MODIFICATION'
  | 'REFACTORING'
  | 'ANALYSIS'
  | 'RESEARCH'
  | 'DESIGN_ANALYSIS'
  | 'DOCUMENTATION'
  | 'TEST_GENERATION'
  | 'TEST_EXECUTION'
  | 'IMAGE_ANALYSIS'
  | 'FILE_ANALYSIS'
  | 'TOOL_USE'
  | 'WEB_ACCESS'
  | 'REPOSITORY_ACCESS';

export interface AgentProfile {
  agentId: string;
  name: string;
  provider: 'GOOGLE_GEMINI' | 'ANTHROPIC' | 'OPENAI' | 'LOCAL_SANDBOX' | 'SECURITY_ANALYZER';
  model: string;
  version: string;
  capabilities: AgentCapability[];
  supportedRoles: AgentRole[];
  supportedTaskTypes: string[];
  maxContextTokens: number;
  inputTypes: string[];
  outputTypes: string[];
  toolCapabilities: string[];
  fileCapabilities: string[];
  executionRestrictions: string[];
  securityClassification: SecurityClassification;
  costPer1kTokens: number;
  averageExecutionTimeMs: number;
  reliabilityScore: number;
  status: 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE';
  behaviorDimensions?: AgentBehaviorDimensions;
  failurePatterns?: AgentFailureSignature[];
  performanceHistory?: AgentPerformanceHistory;
  knownStrengths?: string[];
  knownLimitations?: string[];
  policyRestrictions?: string[];
}

export interface ExecutionPolicy {
  maxRetries: number;
  timeoutMs: number;
  allowFallback: boolean;
  fallbackAgentId?: string;
  autoEscalateOnViolation: boolean;
}

export interface ExecutionContract {
  executionId: string;
  taskId: string;
  projectId: string;
  agentId: string;
  agentVersion: string;
  promptId: string;
  contextPackageId: string;
  executionPolicy: ExecutionPolicy;
  allowedActions: string[];
  prohibitedActions: string[];
  stopConditions: string[];
  escalationConditions: string[];
  validationRequirements: {
    mandatoryTests: string[];
    staticChecks: string[];
    maxExecutionTimeMs: number;
  };
  startedAt: string;
  completedAt?: string;
  status: ExecutionState;
}

export interface ChangedFileEvidence {
  path: string;
  beforeState?: string;
  afterState?: string;
  diff?: string;
  scopeStatus?: 'IN_SCOPE' | 'OUT_OF_SCOPE';
  validationStatus?: 'PENDING' | 'PASSED' | 'FAILED';
  action?: 'CREATE' | 'MODIFY' | 'DELETE';
  diffSnippet?: string;
  astVerified?: boolean;
}

export interface ToolCallEvidence {
  toolName: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  durationMs: number;
  status: 'SUCCESS' | 'ERROR';
}

export interface TestResultEvidence {
  testName?: string;
  suite?: string;
  passed: boolean;
  output?: string;
  errorMessage?: string;
  durationMs?: number;
}

export interface ValidationSummaryEvidence {
  passed: boolean;
  status: 'PASSED' | 'FAILED' | 'PARTIALLY_PASSED' | 'REQUIRES_HUMAN_REVIEW';
  checks: Array<{
    check: string;
    passed: boolean;
    message: string;
  }>;
}

export interface ExecutionEvidence {
  executionId: string;
  agentId?: string;
  timestamp?: string;
  agentOutput?: string;
  changedFiles: ChangedFileEvidence[];
  createdFiles?: string[];
  deletedFiles?: string[];
  toolCalls?: ToolCallEvidence[];
  testResults: TestResultEvidence[];
  lintResults?: { clean: boolean; errorCount: number; warningCount: number };
  validationSummary?: ValidationSummaryEvidence;
  agentReasoningSummary?: string;
  capturedAt?: string;
}

export interface ScopeViolationRecord {
  attemptedPath: string;
  attemptedAction: string;
  reason: string;
  timestamp: string;
}

export interface ExecutionEscalationRecord {
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedComponents: string[];
  requiredAuthority: string;
  recommendedAction: string;
  escalatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ExecutionRecord {
  id: string;
  projectId: string;
  taskId: string;
  contract: ExecutionContract;
  contextPackage: ContextPackage;
  promptVersion: PromptVersion;
  evidence?: ExecutionEvidence;
  state: ExecutionState;
  retries: Array<{
    retryNumber: number;
    reason: string;
    timestamp: string;
    previousExecutionId?: string;
  }>;
  fallbackOccurred?: {
    fromAgentId: string;
    toAgentId: string;
    reason: string;
    timestamp: string;
  };
  scopeViolations: ScopeViolationRecord[];
  escalation?: ExecutionEscalationRecord;
  isAuthoritativeStateUpdated: boolean;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionMetricsSummary {
  readyTasks: number;
  runningExecutions: number;
  blockedExecutions: number;
  failedExecutions: number;
  escalatedExecutions: number;
  pendingValidation: number;
  completedExecutions: number;
  totalRetries: number;
  totalFallbacks: number;
  scopeViolations: number;
  averageDurationMs: number;
}

// ==========================================
// PHASE 6: AGENT INTELLIGENCE & MULTI-AGENT COLLABORATION
// ==========================================

export type AgentRole =
  | 'EXECUTOR'
  | 'ANALYST'
  | 'RESEARCHER'
  | 'ARCHITECT'
  | 'DESIGNER'
  | 'DEVELOPER'
  | 'TESTER'
  | 'SECURITY_REVIEWER'
  | 'CODE_REVIEWER'
  | 'VALIDATOR'
  | 'CRITIC'
  | 'SUMMARIZER'
  | 'PLANNER';

export interface AgentBehaviorDimensions {
  scopeDiscipline: number;        // 0.0 to 1.0 (boundary adherence)
  requirementAdherence: number;   // 0.0 to 1.0 (satisfies approved specs)
  architectureAdherence: number;  // 0.0 to 1.0 (respects architecture slice)
  validationDiscipline: number;   // 0.0 to 1.0 (survives automated tests)
  securityDiscipline: number;     // 0.0 to 1.0 (avoids secret leaks / bypasses)
  efficiency: number;             // 0.0 to 1.0 (minimal token/time bloat)
  reliability: number;            // 0.0 to 1.0 (historical consistency)
  escalationBehavior: number;     // 0.0 to 1.0 (properly halts when blocked)
  changeDiscipline: number;       // 0.0 to 1.0 (zero unauthorized files)
}

export type FailureSignatureType =
  | 'SCOPE_EXPANSION'
  | 'REQUIREMENT_OMISSION'
  | 'ARCHITECTURE_DEVIATION'
  | 'UNAUTHORIZED_FILE_CHANGE'
  | 'INSUFFICIENT_VALIDATION'
  | 'OVER_ENGINEERING'
  | 'UNDER_SPECIFICATION'
  | 'CONTEXT_MISUSE'
  | 'TOOL_MISUSE'
  | 'SECURITY_VIOLATION'
  | 'REPEATED_FAILURE'
  | 'FALSE_COMPLETION';

export interface AgentFailureSignature {
  id: string;
  signatureType: FailureSignatureType;
  executionId?: string;
  collaborationId?: string;
  taskId: string;
  agentId: string;
  evidence: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectionSource: string;
  validationResult: string;
  resolution: string;
  recurrenceCount: number;
  timestamp: string;
}

export interface AgentPerformanceHistory {
  totalTasks: number;
  successfulTasks: number;
  defectsDetected: number;
  scopeViolations: number;
  unauthorizedChanges: number;
  retries: number;
  escalations: number;
  averageDurationMs: number;
  taskTypeBreakdown: Record<string, { total: number; success: number; avgDurationMs: number }>;
}

export type AgentCompatibilityStatus = 'COMPATIBLE' | 'PARTIALLY_COMPATIBLE' | 'INCOMPATIBLE';

export interface TaskAgentCompatibility {
  agentId: string;
  taskId: string;
  status: AgentCompatibilityStatus;
  compatibilityScore: number;
  supportedRole: AgentRole;
  reasoning: string;
  risks: string[];
  recommendedControls: string[];
  secondaryRecommendations?: Array<{
    agentId: string;
    role: AgentRole;
    reason: string;
  }>;
}

export type CollaborationStrategy =
  | 'SINGLE_AGENT'
  | 'SEQUENTIAL_REVIEW'
  | 'PARALLEL_SPECIALISTS'
  | 'EXECUTOR_CRITIC'
  | 'PLANNER_EXECUTOR';

export interface CollaborationParticipant {
  agentId: string;
  role: AgentRole;
  assignedContextSlice: string[];
  toolsAllowed: string[];
  isIndependentReviewer?: boolean;
}

export interface CollaborationPolicy {
  maxRounds: number;
  maxParticipants: number;
  maxDurationMs: number;
  timeoutMs: number;
  autoEscalateOnConflict: boolean;
  requireHumanApproval: boolean;
}

export interface CollaborationContract {
  id: string;
  projectId: string;
  taskId: string;
  strategy: CollaborationStrategy;
  participants: CollaborationParticipant[];
  sharedContextPackageId: string;
  individualContextSlices: Record<string, string[]>;
  authorityBoundary: {
    supremeAuthority: 'CONSTITUTION';
    authorityHierarchy: ContextAuthorityLevel[];
  };
  allowedCommunication: string[];
  expectedOutputs: string[];
  reviewRequirements: string[];
  validationRequirements: string[];
  stopConditions: string[];
  escalationConditions: string[];
  policy: CollaborationPolicy;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'HALTED' | 'ESCALATED' | 'OVERRIDDEN';
  createdAt: string;
  completedAt?: string;
}

export type ClaimClassification =
  | 'FACT'
  | 'REQUEST'
  | 'DECISION'
  | 'INFERENCE'
  | 'ASSUMPTION'
  | 'RECOMMENDATION'
  | 'FINDING'
  | 'PROPOSAL';

export interface AgentClaim {
  statement: string;
  classification: ClaimClassification;
  confidence: number;
  sourceReferences: string[];
  evidenceRef?: string;
}

export type AgentMessageType =
  | 'OBSERVATION'
  | 'FINDING'
  | 'QUESTION'
  | 'PROPOSAL'
  | 'CHALLENGE'
  | 'REVIEW'
  | 'REJECTION'
  | 'APPROVAL_RECOMMENDATION'
  | 'VALIDATION_RESULT'
  | 'ESCALATION';

export interface AgentMessage {
  id: string;
  collaborationId: string;
  senderAgentId: string;
  senderRole: AgentRole;
  recipientAgentId: string | 'BROADCAST';
  messageType: AgentMessageType;
  claim: AgentClaim;
  evidence: string;
  requestedAction?: string;
  timestamp: string;
}

export interface AgentHandoffPackage {
  id: string;
  collaborationId: string;
  taskId: string;
  fromAgentId: string;
  toAgentId: string;
  currentState: string;
  completedWork: string[];
  remainingWork: string[];
  evidenceRef: string;
  knownIssues: string[];
  openQuestions: string[];
  constraints: string[];
  filesChanged: string[];
  validationStatus: string;
  timestamp: string;
}

export interface CriticFinding {
  id: string;
  category: 'REQUIREMENTS' | 'ARCHITECTURE' | 'SCOPE' | 'SECURITY' | 'ACCEPTANCE_CRITERIA' | 'CODE_QUALITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  finding: string;
  evidence: string;
  recommendation: string;
  violatesRule?: string;
}

export interface AgentCriticReview {
  id: string;
  collaborationId: string;
  criticAgentId: string;
  criticRole: AgentRole;
  targetAgentId: string;
  findings: CriticFinding[];
  verdict: 'APPROVED' | 'REVISE_REQUIRED' | 'BLOCKED_ESCALATE';
  reviewSummary: string;
  timestamp: string;
}

export type ConflictResolutionMethod =
  | 'AUTHORITY_RESOLVES'
  | 'EVIDENCE_RESOLVES'
  | 'VALIDATION_RESOLVES'
  | 'ADDITIONAL_RESEARCH_RESOLVES'
  | 'HUMAN_DECISION_REQUIRED';

export interface AgentConflict {
  id: string;
  collaborationId: string;
  taskId: string;
  agentAId: string;
  agentARole: AgentRole;
  claimA: AgentClaim;
  agentBId: string;
  agentBRole: AgentRole;
  claimB: AgentClaim;
  sourceOfDisagreement: string;
  resolutionMethod: ConflictResolutionMethod;
  resolutionStatus: 'RESOLVED' | 'UNRESOLVED';
  resolvedByAuthority?: string;
  resolvedOutcome?: string;
  justification?: string;
  timestamp: string;
}

export interface CollaborationTimelineEvent {
  id: string;
  timestamp: string;
  actorAgentId?: string;
  actorRole?: AgentRole;
  event: string;
  details: string;
  evidenceRef?: string;
}

export interface CollaborationResult {
  id: string;
  collaborationId: string;
  projectId: string;
  taskId: string;
  strategy: CollaborationStrategy;
  participants: CollaborationParticipant[];
  agentContributions: Array<{
    agentId: string;
    role: AgentRole;
    contributionSummary: string;
    filesProposed: string[];
    toolCallsCount: number;
  }>;
  sharedFindings: string[];
  conflicts: AgentConflict[];
  resolvedFindings: string[];
  unresolvedFindings: string[];
  reviews: AgentCriticReview[];
  handoffs: AgentHandoffPackage[];
  messages: AgentMessage[];
  recommendations: string[];
  mergedEvidence: ExecutionEvidence;
  validationStatus: 'PASSED' | 'FAILED' | 'REQUIRES_HUMAN_DECISION';
  humanDecisionRequired: boolean;
  humanOverrideApplied?: {
    overrideType: 'STOP' | 'REJECT' | 'REPLACE_AGENT' | 'CHANGE_STRATEGY' | 'FORCE_PASS';
    actorId: string;
    reason: string;
    timestamp: string;
  };
  timeline: CollaborationTimelineEvent[];
  isAuthoritativeStateUpdated: boolean;
  status: 'COMPLETED' | 'HALTED' | 'ESCALATED' | 'OVERRIDDEN';
  createdAt: string;
  completedAt: string;
}

// ==========================================
// PHASE 7: VALIDATION, SECURITY & DRIFT INTELLIGENCE
// ==========================================

export type ValidationCategory =
  | 'REQUIREMENT'
  | 'FUNCTIONAL'
  | 'ARCHITECTURE'
  | 'UX'
  | 'UI'
  | 'SECURITY'
  | 'DATA'
  | 'INTEGRATION'
  | 'PERFORMANCE'
  | 'ACCESSIBILITY'
  | 'SCOPE'
  | 'REGRESSION'
  | 'DEPLOYMENT'
  | 'COMPLIANCE';

export type ValidationStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'PASSED'
  | 'FAILED'
  | 'PARTIALLY_PASSED'
  | 'BLOCKED'
  | 'WAIVED'
  | 'REQUIRES_HUMAN_REVIEW';

export type ValidationSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ValidationAuthority =
  | 'AUTOMATED'
  | 'AI_ASSISTED'
  | 'HUMAN_REVIEWED'
  | 'SECURITY_APPROVED'
  | 'GOVERNANCE_APPROVED';

export type ValidationMethod =
  | 'AUTOMATED_TEST'
  | 'UNIT_TEST'
  | 'INTEGRATION_TEST'
  | 'E2E_TEST'
  | 'STATIC_ANALYSIS'
  | 'TYPE_CHECK'
  | 'LINT'
  | 'SECURITY_SCAN'
  | 'DEPENDENCY_SCAN'
  | 'DATABASE_TEST'
  | 'API_RESPONSE'
  | 'DIFF_CHECK'
  | 'MANUAL_REVIEW'
  | 'AI_ASSISTED_REVIEW';

export interface ValidationEvidenceItem {
  id: string;
  type: ValidationMethod;
  summary: string;
  details: string;
  artifactRef?: string;
  hash?: string;
  timestamp: string;
}

export interface ValidationFailure {
  id: string;
  category: ValidationCategory;
  whatFailed: string;
  expectedBehavior: string;
  observedBehavior: string;
  evidence: string;
  affectedRequirementId?: string;
  affectedComponent?: string;
  severity: ValidationSeverity;
  securityImpact?: string;
  scopeImpact?: string;
  regressionImpact?: string;
  recommendedAction: string;
  requiredAuthority: ValidationAuthority;
  waived?: boolean;
  waiverReason?: string;
  waivedBy?: string;
  waivedAt?: string;
}

export type ValidationRuleSource =
  | 'CONSTITUTION'
  | 'GOVERNANCE_POLICY'
  | 'REQUIREMENT'
  | 'ARCHITECTURE'
  | 'SECURITY_POLICY'
  | 'COMPLIANCE_PROFILE'
  | 'ACCEPTANCE_CRITERIA'
  | 'ORGANIZATION_STANDARD';

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: ValidationCategory;
  severity: ValidationSeverity;
  appliesTo: string[];
  source: ValidationRuleSource;
  version: string;
  active: boolean;
}

export type GateFailureBehavior = 'BLOCK' | 'ESCALATE' | 'WARN';
export type GateWaiverPolicy = 'ALLOWED_WITH_GOVERNANCE' | 'SECURITY_LEAD_ONLY' | 'STRICT_NO_WAIVER';

export interface ValidationGate {
  id: string;
  name: string;
  order: number;
  requiredConditions: string[];
  categories: ValidationCategory[];
  minimumEvidence: string[];
  requiredAuthority: ValidationAuthority;
  failureBehavior: GateFailureBehavior;
  waiverPolicy: GateWaiverPolicy;
  blockingSeverity: ValidationSeverity;
  status: 'PENDING' | 'PASSED' | 'FAILED' | 'WAIVED' | 'BLOCKED';
  passed: boolean;
  evidenceNotes?: string;
}

export type ProofOfCompletionState =
  | 'IMPLEMENTED'
  | 'VALIDATED'
  | 'APPROVED'
  | 'DEPLOYED'
  | 'OPERATIONAL';

export interface ValidationContract {
  id: string;
  projectId: string;
  taskId: string;
  executionId?: string;
  requirementReferences: string[];
  acceptanceCriteria: string[];
  validationCategories: ValidationCategory[];
  validationRules: string[];
  expectedResults: string[];
  observedResults: string[];
  evidence: ValidationEvidenceItem[];
  validator: string;
  validationMethod: ValidationMethod;
  gates: ValidationGate[];
  failures: ValidationFailure[];
  status: ValidationStatus;
  severity: ValidationSeverity;
  proofOfCompletion: ProofOfCompletionState;
  isAuthoritativeApproved: boolean;
  createdAt: string;
  completedAt?: string;
}

export type SecurityProfile =
  | 'STANDARD'
  | 'HIGH_SECURITY'
  | 'FINANCIAL'
  | 'HEALTHCARE'
  | 'PAYMENT'
  | 'REGULATED'
  | 'CUSTOM';

export type SecurityStopCondition =
  | 'AUTH_BYPASS'
  | 'CREDENTIAL_EXPOSURE'
  | 'SECRET_LEAKAGE'
  | 'UNAUTHORIZED_DATA_ACCESS'
  | 'CROSS_TENANT_EXPOSURE'
  | 'MANDATORY_ENCRYPTION_FAILURE'
  | 'UNSAFE_DESTRUCTIVE_OPERATION'
  | 'CRITICAL_INJECTION'
  | 'SECURITY_CONTROL_DISABLED'
  | 'AUDIT_CONTROL_MISSING'
  | 'UNAPPROVED_DATA_FLOW';

export type SecurityFindingStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'REMEDIATING'
  | 'RESOLVED'
  | 'ACCEPTED_RISK'
  | 'RISK_ACCEPTED'
  | 'MITIGATED'
  | 'FALSE_POSITIVE';

export interface SecurityFinding {
  id: string;
  projectId: string;
  taskId?: string;
  category: string;
  severity: ValidationSeverity;
  description: string;
  evidence: string;
  affectedComponent: string;
  affectedData?: string;
  exploitability: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  controlReference: string;
  recommendedRemediation: string;
  status: SecurityFindingStatus;
  owner: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolvedByRole?: string;
  resolutionNotes?: string;
  isStopConditionTriggered: boolean;
  stopConditionType?: SecurityStopCondition;
}

export interface ThreatModel {
  id: string;
  projectId: string;
  asset: string;
  actor: string;
  threat: string;
  attackSurface: string;
  trustBoundary: string;
  control: string;
  residualRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: string;
  owner: string;
  status: 'ACTIVE' | 'MITIGATED' | 'ACCEPTED';
}

export interface TrustBoundary {
  id: string;
  source: string;
  target: string;
  protocol: string;
  authRequired: boolean;
  dataClassification: string;
}

export interface DataFlowRecord {
  id: string;
  projectId: string;
  dataOrigin: string;
  storageLocation: string;
  transformations: string[];
  transmissionEndpoints: string[];
  authorizedAgents: string[];
  externalProviders: string[];
  authorizedRoles: UserRole[];
  isCompliant: boolean;
  notes: string;
}

export type ComplianceFramework = 'SOC2' | 'HIPAA' | 'PCI_DSS' | 'ISO27001' | 'INTERNAL';

export type ComplianceControlStatus =
  | 'NOT_ASSESSED'
  | 'IMPLEMENTED'
  | 'PARTIALLY_IMPLEMENTED'
  | 'FAILED'
  | 'WAIVED'
  | 'NOT_APPLICABLE';

export interface ComplianceControl {
  id: string;
  projectId: string;
  framework: ComplianceFramework;
  requirementId: string;
  controlCode: string;
  title: string;
  description: string;
  implementationNotes: string;
  evidenceRef: string;
  validationId?: string;
  status: ComplianceControlStatus;
  lastAssessed: string;
}

export type SecurityIncidentStatus =
  | 'OPEN'
  | 'CONTAINING'
  | 'CONTAINED'
  | 'REMEDIATING'
  | 'RESOLVED'
  | 'ACCEPTED_RISK';

export interface SecurityIncident {
  id: string;
  findingId?: string;
  severity: ValidationSeverity;
  projectId: string;
  affectedComponent: string;
  detectedAt: string;
  evidence: string;
  containmentActions: string[];
  remediationSteps: string[];
  owner: string;
  status: SecurityIncidentStatus;
  resolutionNotes?: string;
  resolvedAt?: string;
}

export type DriftType =
  | 'REQUIREMENT'
  | 'ARCHITECTURE'
  | 'UX'
  | 'UI'
  | 'CODE'
  | 'DATABASE'
  | 'CONFIGURATION'
  | 'SECURITY'
  | 'SCOPE'
  | 'AGENT_BEHAVIOR'
  | 'PROMPT'
  | 'CONTEXT'
  | 'DEPLOYMENT'
  | 'DOCUMENTATION';

export type DriftClassification =
  | 'AUTHORIZED'
  | 'UNAUTHORIZED'
  | 'UNKNOWN'
  | 'EXPECTED'
  | 'SUPERSEDED'
  | 'PENDING_APPROVAL';

export type DriftResponseAction =
  | 'AUTO_CORRECT'
  | 'CREATE_CHANGE_REQUEST'
  | 'BLOCK_TASK'
  | 'REQUIRE_REVIEW'
  | 'ESCALATE'
  | 'ACCEPT_AS_AUTHORIZED'
  | 'IGNORE_WITH_AUDIT';

export type DriftRecordStatus =
  | 'DETECTED'
  | 'CLASSIFIED'
  | 'IMPACT_ANALYSIS'
  | 'CORRECTING'
  | 'VALIDATING'
  | 'RESOLVED'
  | 'AUTHORIZED'
  | 'CLOSED'
  | 'ESCALATED';

export interface DriftRecord {
  id: string;
  projectId: string;
  type: DriftType;
  sourceState: string;
  actualState: string;
  difference: string;
  classification: DriftClassification;
  severity: ValidationSeverity;
  evidence: string;
  affectedComponents: string[];
  impact: string;
  recommendedAction: DriftResponseAction;
  status: DriftRecordStatus;
  changeRequestId?: string;
  detectedAt: string;
  resolvedAt?: string;
  resolution?: string;
  authority?: string;
}

export interface RegressionRunRecord {
  id: string;
  projectId: string;
  triggerType: 'CHANGE_REQUEST' | 'TASK_EXECUTION' | 'SCHEDULED';
  triggerId: string;
  changedComponents: string[];
  affectedRequirements: string[];
  testsSelected: string[];
  testsExecuted: number;
  testsPassed: number;
  testsFailed: number;
  failures: string[];
  status: 'PASSED' | 'FAILED';
  timestamp: string;
  durationMs: number;
}

export interface RiskAcceptanceRecord {
  id: string;
  projectId: string;
  risk: string;
  findingId?: string;
  affectedComponent: string;
  reason: string;
  knownImpact: string;
  mitigation: string;
  expirationDate: string;
  approverId: string;
  approverRole: UserRole;
  timestamp: string;
  evidence: string;
  active: boolean;
}

export interface ValidationOverviewMetrics {
  activeValidations: number;
  passedValidations: number;
  failedValidations: number;
  blockedValidations: number;
  criticalFailures: number;
  openSecurityFindings: number;
  activeSecurityIncidents: number;
  activeDriftCount: number;
  unauthorizedDriftCount: number;
  regressionFailureCount: number;
  pendingReviewCount: number;
  activeRiskAcceptances: number;
}

// ==========================================
// PHASE 8: OPTIMIZATION INTELLIGENCE TYPES
// ==========================================

export type DataAuthorityClassification = 
  | 'OBSERVED' 
  | 'ESTIMATED' 
  | 'DERIVED' 
  | 'RECOMMENDED' 
  | 'APPROVED' 
  | 'HISTORICAL' 
  | 'SUPERSEDED';

export type TelemetryEventType = 
  | 'TASK' 
  | 'EXECUTION' 
  | 'AGENT' 
  | 'PROMPT' 
  | 'CONTEXT' 
  | 'VALIDATION' 
  | 'RETRY' 
  | 'FALLBACK' 
  | 'COLLABORATION' 
  | 'HUMAN_REVIEW' 
  | 'CHANGE_REQUEST' 
  | 'SECURITY_REVIEW' 
  | 'DECISION' 
  | 'DEPLOYMENT' 
  | 'FAILURE' 
  | 'REWORK' 
  | 'WORKFLOW' 
  | 'SYSTEM';

export interface TelemetryEvent {
  eventId: string;
  organizationId: string;
  projectId: string;
  taskId?: string;
  executionId?: string;
  agentId?: string;
  correlationId: string;
  eventType: TelemetryEventType;
  timestamp: string;
  source: string;
  classification: DataAuthorityClassification;
  measurement: number;
  unit: string;
  confidence?: number;
  metadata: Record<string, unknown>;
  privacyClassification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  retentionDays: number;
  createdAt: string;
}

export type CostCategory = 
  | 'AI_EXECUTION' 
  | 'CONTEXT' 
  | 'VALIDATION' 
  | 'EXECUTION_RECOVERY' 
  | 'HUMAN_REVIEW' 
  | 'INFRASTRUCTURE' 
  | 'REWORK' 
  | 'CHANGE_COST';

export interface CostEvent {
  costEventId: string;
  organizationId: string;
  projectId: string;
  taskId?: string;
  executionId?: string;
  provider: string;
  agentId?: string;
  costCategory: CostCategory;
  amount: number;
  currency: string;
  source: string;
  observedAt: string;
  classification: DataAuthorityClassification;
  metadata: Record<string, unknown>;
}

export interface CostModel {
  id: string;
  organizationId: string;
  name: string;
  currency: string;
  rates: {
    inputTokenPer1k: number;
    outputTokenPer1k: number;
    contextRetrievalPerCall: number;
    automatedTestPerRun: number;
    securityScanPerRun: number;
    humanReviewHourRate: number;
    infrastructureBasePerTask: number;
  };
  effectiveDate: string;
  version: number;
}

export interface CostEstimate {
  estimateId: string;
  projectId: string;
  taskId?: string;
  minCost: number;
  maxCost: number;
  expectedCost: number;
  currency: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  primaryUncertainty: string;
  breakdown: Record<CostCategory, { min: number; max: number; expected: number }>;
  classification: DataAuthorityClassification;
  calculatedAt: string;
}

export interface CostAllocation {
  id: string;
  projectId: string;
  dimension: 'TASK' | 'AGENT' | 'VALIDATION' | 'REWORK' | 'CHANGE_REQUEST';
  dimensionId: string;
  totalAmount: number;
  currency: string;
  percentage: number;
}

export interface TimeEvent {
  timeEventId: string;
  organizationId: string;
  projectId: string;
  taskId?: string;
  executionId?: string;
  category: 'ACTIVE' | 'WAIT' | 'BLOCKED' | 'REVIEW' | 'REWORK' | 'TOTAL_ELAPSED';
  durationSeconds: number;
  startedAt: string;
  endedAt?: string;
  classification: DataAuthorityClassification;
  reason?: string;
}

export type DurationBreakdown = Record<'ACTIVE' | 'WAIT' | 'BLOCKED' | 'REVIEW' | 'REWORK' | 'TOTAL_ELAPSED', number>;

export interface DependencyDelay {
  dependencyId: string;
  blockingTaskId: string;
  delayedTaskIds: string[];
  delaySeconds: number;
  propagationImpact: string;
}

export interface CriticalPathAnalysis {
  projectId: string;
  criticalTasks: string[];
  blockingTasks: string[];
  bottlenecks: string[];
  totalPathDurationSeconds: number;
  calculatedAt: string;
}

export interface TimelinePrediction {
  projectId: string;
  expectedStartWindow: string;
  expectedCompletionWindow: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  primaryRisk: string;
  scheduleRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  calculatedAt: string;
}

export interface WorkflowLoadFactors {
  activeDecisions: number;
  unresolvedDecisions: number;
  informationVolume: number;
  contextSwitches: number;
  activeProjects: number;
  concurrentTasks: number;
  exceptions: number;
  blockers: number;
  reviewComplexity: number;
  pendingApprovals: number;
  notificationVolume: number;
  dependencyComplexity: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timePressure: 'LOW' | 'MEDIUM' | 'HIGH';
  openChangeRequests: number;
}

export interface WorkflowLoadIndicator {
  projectId: string;
  rawFactors: WorkflowLoadFactors;
  derivedScore: number;
  loadLevel: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'ATTENTION_REQUIRED';
  primaryDrivers: string[];
  explanation: string;
  recommendedUIAdaptations: string[];
  calculatedAt: string;
}

export type TrustEventType = 
  | 'RECOMMENDATION_ACCEPTED' 
  | 'RECOMMENDATION_REJECTED' 
  | 'RECOMMENDATION_DEFERRED' 
  | 'RECOMMENDATION_MODIFIED' 
  | 'HUMAN_OVERRIDE' 
  | 'EXPLANATION_REQUESTED' 
  | 'MANUAL_VERIFICATION' 
  | 'CORRECTION_REQUIRED' 
  | 'FALSE_POSITIVE' 
  | 'FALSE_NEGATIVE' 
  | 'SUCCESSFUL_RECOMMENDATION' 
  | 'FAILED_RECOMMENDATION' 
  | 'VALIDATION_DISAGREEMENT' 
  | 'ESCALATION' 
  | 'HUMAN_APPROVAL' 
  | 'HUMAN_REJECTION';

export interface TrustEvent {
  id: string;
  projectId: string;
  agentId: string;
  eventType: TrustEventType;
  taskType: string;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  strategy: string;
  securityLevel: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'NEUTRAL';
  validationResult?: 'PASSED' | 'FAILED';
  contextDetails: string;
  timestamp: string;
}

export interface ContextualTrustProfile {
  agentId: string;
  taskType: string;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  strategy: string;
  sampleSize: number;
  acceptanceRate: number;
  overrideRate: number;
  correctionRate: number;
  observedStrengths: string[];
  observedWeaknesses: string[];
  recommendedControls: string[];
  evidenceRequirementLevel: 'STANDARD' | 'ELEVATED' | 'MANDATORY_REVIEW';
}

export type OptimizationCategory = 
  | 'CONTEXT_OPTIMIZATION' 
  | 'PROMPT_OPTIMIZATION' 
  | 'AGENT_OPTIMIZATION' 
  | 'COLLABORATION_OPTIMIZATION' 
  | 'VALIDATION_OPTIMIZATION' 
  | 'RETRY_OPTIMIZATION' 
  | 'TASK_DECOMPOSITION' 
  | 'WORKFLOW_OPTIMIZATION' 
  | 'TEMPORAL_OPTIMIZATION' 
  | 'COST_OPTIMIZATION';

export type OptimizationImpactLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type OptimizationStatus = 
  | 'PROPOSED' 
  | 'REVIEW_REQUIRED' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'DEFERRED' 
  | 'APPLIED' 
  | 'VALIDATING' 
  | 'SUCCESSFUL' 
  | 'UNSUCCESSFUL' 
  | 'REVERTED' 
  | 'EXPIRED' 
  | 'SUPERSEDED';

export interface OptimizationRecommendation {
  id: string;
  organizationId: string;
  projectId: string;
  scope: 'TASK' | 'PROJECT' | 'WORKFLOW' | 'AGENT';
  category: OptimizationCategory;
  observedProblem: string;
  evidence: string;
  currentStrategy: string;
  proposedStrategy: string;
  expectedBenefit: string;
  expectedCost: string;
  risks: string[];
  securityImpact: OptimizationImpactLevel;
  governanceImpact: OptimizationImpactLevel;
  timelineImpact: string;
  workflowImpact: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  reversibility: 'REVERSIBLE' | 'PARTIALLY_REVERSIBLE' | 'IRREVERSIBLE';
  requiredAuthority: 'SYSTEM_AUTONOMOUS' | 'PROJECT_LEAD' | 'ARCHITECT' | 'SECURITY' | 'GOVERNANCE_BOARD';
  affectedTasks: string[];
  affectedAgents: string[];
  validationRequirements: string[];
  expiration: string;
  status: OptimizationStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  appliedAt?: string;
  appliedBy?: string;
  result?: string;
}

export interface OptimizationPolicy {
  id: string;
  organizationId: string;
  projectId?: string;
  name: string;
  description: string;
  allowedInterventions: string[];
  prohibitedInterventions: string[];
  approvalRequirements: Partial<Record<OptimizationCategory, UserRole>>;
  securityConstraints: string[];
  costConstraints: { maxAutoInterventionCost: number; currency: string };
  validationConstraints: string[];
  humanReviewConstraints: string[];
  version: number;
  status: 'DRAFT' | 'PROPOSED' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'RETIRED';
  effectiveDate: string;
  owner: string;
}

export interface OptimizationAction {
  id: string;
  recommendationId?: string;
  policyId?: string;
  trigger: string;
  action: string;
  previousState: string;
  newState: string;
  actor: string;
  automationStatus: 'AUTONOMOUS' | 'HUMAN_APPROVED';
  approvalId?: string;
  validationResult?: 'PASSED' | 'FAILED' | 'PENDING';
  reversibility: 'REVERSIBLE' | 'IRREVERSIBLE';
  rollbackAction?: string;
  evidence: string;
  timestamp: string;
}

export interface OptimizationExperiment {
  id: string;
  projectId: string;
  title: string;
  strategyA: { name: string; description: string; config: Record<string, unknown> };
  strategyB: { name: string; description: string; config: Record<string, unknown> };
  metricsToCompare: string[];
  resultsA?: Record<string, number>;
  resultsB?: Record<string, number>;
  status: 'RUNNING' | 'CONCLUDED' | 'ABORTED';
  conclusion?: string;
}

export interface OptimizationOverviewMetrics {
  totalCostToDate: number;
  estimatedRemainingCost: number;
  costVariancePercent: number;
  criticalPathDurationHours: number;
  scheduleRiskLevel: string;
  workflowLoadLevel: string;
  cognitiveLoadScore: number;
  activeRecommendationsCount: number;
  appliedInterventionsCount: number;
  avgTrustScore: number;
  savingsGenerated: number;
}

// ============================================================================
// PHASE 9: CONTINUOUS LEARNING, ORGANIZATIONAL MEMORY & SYSTEM EVOLUTION
// ============================================================================

export type MemoryType = 
  | 'LESSON_LEARNED'
  | 'BEST_PRACTICE'
  | 'ARCHITECTURAL_DECISION'
  | 'REUSABLE_BLUEPRINT'
  | 'POST_MORTEM';

export type MemoryStatus = 
  | 'DRAFT'
  | 'PROPOSED'
  | 'VERIFIED'
  | 'ACTIVE'
  | 'DEPRECATED'
  | 'RETIRED';

export interface MemoryProvenance {
  sourceTaskId?: string;
  sourceDecisionId?: string;
  sourceIncidentId?: string;
  authorId: string;
  authorRole: UserRole;
  organizationId: string;
  projectId: string;
  verifiedBy?: string;
  verifiedAt?: string;
  confidenceScore: number; // 0.0 - 1.0
  verificationMethod: 'MANUAL_HUMAN' | 'AUTOMATED_VALIDATION' | 'CONSENSUS_AUDIT';
  immutableHash: string; // Cryptographic integrity checksum
}

export interface OrganizationalMemory {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  type: MemoryType;
  category: string;
  summary: string;
  detailedContent: string;
  status: MemoryStatus;
  provenance: MemoryProvenance;
  applicableContexts: string[];
  relatedTaskIds: string[];
  relatedRequirementIds: string[];
  relatedConstitutionalArticles: string[];
  usageCount: number;
  successRate: number; // Percentage (0-100)
  freshnessScore: number; // Decays over time if not verified/used (0-100)
  createdTimestamp: string;
  updatedTimestamp: string;
}

export type PatternCategory = 
  | 'REPEATED_FAILURE'
  | 'FLAKY_TEST'
  | 'WORKFLOW_BOTTLENECK'
  | 'GOVERNANCE_ANOMALY'
  | 'ANTI_PATTERN'
  | 'SUCCESS_PATTERN';

export type PatternSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DetectedPattern {
  id: string;
  organizationId: string;
  projectId: string;
  category: PatternCategory;
  severity: PatternSeverity;
  title: string;
  signature: string;
  occurrenceCount: number;
  firstSeen: string;
  lastSeen: string;
  affectedComponents: string[];
  affectedTaskIds: string[];
  correlationScore: number; // 0.0 - 1.0 correlation with failures or delays
  rootCauseHypothesis: string;
  actionableMitigation: string;
  resolved: boolean;
  resolvedAt?: string;
}

export type LearningMetricCategory = 
  | 'FAILURE_RATE'
  | 'VELOCITY'
  | 'QUALITY_SCORE'
  | 'DRIFT_INDEX'
  | 'FLAKINESS_INDEX'
  | 'RETRY_FREQUENCY'
  | 'FIRST_PASS_YIELD';

export type TrendDirection = 'IMPROVING' | 'STABLE' | 'DEGRADING';

export interface LearningMetricSnapshot {
  id: string;
  projectId: string;
  organizationId: string;
  metricName: string;
  category: LearningMetricCategory;
  value: number;
  baselineValue: number;
  unit: string;
  trend: TrendDirection;
  changePercent: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: string;
  sampleSize: number;
  regressionAlert: boolean;
  alertMessage?: string;
}

export type EvolutionProposalStatus = 
  | 'PROPOSED'
  | 'SIMULATED'
  | 'APPROVED'
  | 'APPLIED'
  | 'REJECTED'
  | 'ROLLED_BACK'
  | 'DRAFT'
  | 'SUBMITTED'
  | 'RATIFIED'
  | 'IMPLEMENTED';

export interface EvolutionProposal {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  targetDomain?: 'VALIDATION_RULE' | 'RETRY_POLICY' | 'AGENT_ASSIGNMENT' | 'COGNITIVE_THRESHOLD' | 'WORKFLOW_STEP';
  rationale?: string;
  synthesizedRuleOrPolicy?: string;
  triggeringPatternIds: string[];
  triggeringMemoryIds: string[];
  currentValue?: string;
  proposedValue?: string;
  simulatedImpact: {
    predictedImprovementPercent: number;
    riskRating: 'MINIMAL' | 'MODERATE' | 'ELEVATED';
    affectedWorkflows: string[];
  };
  status: EvolutionProposalStatus;
  requiredAuthority?: UserRole;
  isConstitutionallyCompliant?: boolean;
  reversibility?: 'REVERSIBLE' | 'IRREVERSIBLE';
  rollbackAction?: string;
  proposedBy: string;
  reviewedBy?: string;
  appliedAt?: string;
  rolledBackAt?: string;
  timestamp?: string;
  createdAt?: string;

  // Phase 13 Continuous Assurance additions
  currentState?: string;
  desiredState?: string;
  reason?: string;
  evidence?: string;
  affectedRequirements?: string[];
  affectedArchitecture?: string[];
  affectedSecurity?: string[];
  affectedData?: string[];
  affectedAgents?: string[];
  affectedValidation?: string[];
  affectedDeployment?: string[];
  expectedBenefit?: string;
  cost?: number;
  risk?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  rollbackPlan?: string;
  verificationRequirements?: string[];
  ratifiedBy?: string;
  ratifiedAt?: string;
}

export interface LearningOverviewMetrics {
  totalMemoriesCount: number;
  verifiedMemoriesCount: number;
  activePatternsCount: number;
  antiPatternsIdentified: number;
  averageQualityYield: number;
  evolutionProposalsCount: number;
  appliedMutationsCount: number;
  systemResilienceScore: number;
}

// ============================================================================
// PHASE 10: ADVANCED GOVERNANCE, RESILIENCE & PRODUCTION HARDENING
// ============================================================================

export type FailureClassification =
  | 'TRANSIENT'
  | 'RETRYABLE'
  | 'NON_RETRYABLE'
  | 'DEGRADED'
  | 'CRITICAL'
  | 'SECURITY_CRITICAL'
  | 'DATA_INTEGRITY_CRITICAL'
  | 'GOVERNANCE_BLOCKING'
  | 'UNKNOWN';

export type DegradationLevel =
  | 'NORMAL'
  | 'DEGRADED'
  | 'SEVERELY_DEGRADED'
  | 'READ_ONLY'
  | 'SAFE_MODE'
  | 'RECOVERY'
  | 'OFFLINE';

export type CircuitBreakerTarget =
  | 'AI_PROVIDER'
  | 'EXTERNAL_API'
  | 'STORAGE'
  | 'SEARCH_INDEX'
  | 'NOTIFICATION_SERVICE'
  | 'TASK_PIPELINE';

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerRecord {
  target: CircuitBreakerTarget;
  state: CircuitBreakerState;
  failureCount: number;
  failureThreshold: number;
  resetTimeoutMs: number;
  lastFailureTime?: string;
  lastSuccessTime?: string;
  lastTrippedTime?: string;
  auditNotes: string;
}

export interface DeadLetterRecord {
  id: string;
  eventId: string;
  projectId: string;
  source: string;
  destination: string;
  payload: Record<string, unknown>;
  error: string;
  retryCount: number;
  firstFailure: string;
  lastFailure: string;
  classification: FailureClassification;
  nextAction: string;
  owner: string;
  resolution?: string;
  status: 'QUEUED' | 'REPLAYED' | 'DISCARDED';
}

export type DataIntegrityCheckType =
  | 'FOREIGN_KEY_CONSISTENCY'
  | 'ORPHANED_TASKS'
  | 'DUPLICATE_AUTHORITATIVE_ENTITIES'
  | 'INVALID_STATE_TRANSITION'
  | 'AUDIT_CHAIN_INTEGRITY'
  | 'EVIDENCE_HASH_VERIFICATION';

export interface DataIntegrityCheckResult {
  checkType: DataIntegrityCheckType;
  passed: boolean;
  recordsExamined: number;
  anomaliesDetected: number;
  details: string;
  timestamp: string;
}

export interface SecretFindingRecord {
  id: string;
  projectId: string;
  detectedPattern: string;
  snippetRedacted: string;
  secretType: 'API_KEY' | 'ACCESS_TOKEN' | 'PRIVATE_KEY' | 'PASSWORD' | 'CREDENTIAL';
  sourceLocation: string;
  trappedAt: string;
  forensicHash: string;
  status: 'TRAPPED_AND_REDACTED' | 'REMEDIATED';
}

export type AIProviderHealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'OUTAGE';

export interface AIProviderProfile {
  providerId: string;
  name: string;
  activeModel: string;
  fallbackModel: string;
  status: AIProviderHealthStatus;
  latencyMs: number;
  rateLimitRemainingPercent: number;
  circuitBreakerState: CircuitBreakerState;
  totalCalls: number;
  failedCalls: number;
}

export type DeploymentState =
  | 'DRAFT'
  | 'VALIDATING'
  | 'READY'
  | 'APPROVAL_REQUIRED'
  | 'APPROVED'
  | 'DEPLOYING'
  | 'DEPLOYED'
  | 'VERIFYING'
  | 'SUCCESSFUL'
  | 'FAILED'
  | 'ROLLED_BACK'
  | 'BLOCKED';

export interface ReleaseGateCheck {
  id: string;
  name: string;
  required: boolean;
  passed: boolean;
  evidenceRef?: string;
  notes: string;
}

export interface DeploymentRecord {
  id: string;
  projectId: string;
  version: number;
  targetEnvironment: 'STAGING' | 'PRODUCTION';
  state: DeploymentState;
  releaseGates: ReleaseGateCheck[];
  rollbackAvailable: boolean;
  rollbackAction: string;
  approvedBy?: string;
  deployedAt?: string;
  verifiedAt?: string;
  rolledBackAt?: string;
  notes?: string;
}

export type BackupClass = 'CRITICAL' | 'HIGH' | 'STANDARD' | 'RECONSTRUCTABLE';

export interface BackupRecord {
  id: string;
  projectId: string;
  backupClass: BackupClass;
  snapshotHash: string;
  entityCounts: Record<string, number>;
  sizeBytes: number;
  rpoTargetMinutes: number;
  rtoTargetMinutes: number;
  createdAt: string;
  status: 'COMPLETED' | 'VERIFIED' | 'FAILED';
}

export interface RestoreTestRecord {
  id: string;
  backupId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  restoredEntityCount: number;
  integrityVerified: boolean;
  status: 'RESTORE_PASSED' | 'RESTORE_FAILED';
  notes: string;
}

export type IncidentSeverity = 'SEV0' | 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';

export type IncidentCategory =
  | 'SECURITY'
  | 'DATA_INTEGRITY'
  | 'AI_PROVIDER'
  | 'AGENT_CONTAINMENT'
  | 'INFRASTRUCTURE'
  | 'GOVERNANCE'
  | 'DEPLOYMENT';

export type IncidentLifecycleStatus =
  | 'DETECTED'
  | 'TRIAGED'
  | 'CONTAINING'
  | 'CONTAINED'
  | 'REMEDIATING'
  | 'VERIFYING'
  | 'RESOLVED'
  | 'POST_INCIDENT_REVIEW';

export interface IncidentTimelineEvent {
  timestamp: string;
  phase: string;
  actor: string;
  action: string;
  details: string;
}

export interface ProductionIncident {
  id: string;
  incidentId: string;
  projectId: string;
  title: string;
  severity: IncidentSeverity;
  category: IncidentCategory;
  status: IncidentLifecycleStatus;
  detectedAt: string;
  affectedSystems: string[];
  containmentActions: string[];
  owner: string;
  rootCauseAnalysis?: {
    category: string;
    rootCause: string;
    correctiveActions: string[];
  };
  timeline: IncidentTimelineEvent[];
  resolvedAt?: string;
  exportedToMemoryId?: string;
}

export interface OperationalRunbook {
  id: string;
  scenario: string;
  category: string;
  triggerConditions: string[];
  steps: Array<{
    stepNumber: number;
    action: string;
    commandOrEndpoint: string;
    expectedOutcome: string;
  }>;
  lastValidated: string;
}

export type ReadinessDimensionStatus = 'READY' | 'CONDITIONAL' | 'NOT_READY' | 'BLOCKED';

export interface ReadinessDimension {
  dimension: string;
  status: ReadinessDimensionStatus;
  evidence: string;
  openIssuesCount: number;
  riskLevel: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiredAction: string;
}

export interface ProductionReadinessScorecard {
  projectId: string;
  evaluatedAt: string;
  dimensions: ReadinessDimension[];
  isProductionReady: boolean;
}

export interface ResilienceOverviewMetrics {
  systemDegradationLevel: DegradationLevel;
  activeIncidentsCount: number;
  circuitBreakersOpenCount: number;
  deadLetterQueueCount: number;
  verifiedBackupsCount: number;
  productionDeploymentsCount: number;
  productionReadinessStatus: 'READY' | 'RESTRICTED' | 'BLOCKED';
}

// ============================================================================
// PHASE 11: FULL-SYSTEM VERIFICATION, INTEGRATION ASSURANCE & GO-LIVE
// ============================================================================

export type SystemVerificationState =
  | 'NOT_VERIFIED'
  | 'VERIFYING'
  | 'CONDITIONALLY_VERIFIED'
  | 'VERIFIED';

export type SystemProductionState =
  | 'NOT_READY'
  | 'READY_FOR_APPROVAL'
  | 'APPROVED_FOR_GO_LIVE'
  | 'LIVE'
  | 'DEGRADED'
  | 'RECOVERY'
  | 'ROLLED_BACK';

export type VerificationLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type VerificationStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'FAILED'
  | 'NOT_VERIFIED'
  | 'NOT_APPLICABLE'
  | 'BLOCKED';

export interface VerificationScopeItem {
  verificationId: string;
  systemArea: string;
  governingContract: string;
  authoritativeSource: string;
  implementationLocation: string;
  existingTestReferences: string[];
  existingValidationEvidence: string;
  lastVerifiedVersion: string;
  currentImplementationVersion: string;
  evidenceFreshness: 'FRESH' | 'VALID_REUSABLE' | 'STALE' | 'EXPIRED';
  verificationStatus: VerificationStatus;
  knownFailures: string[];
  dependencies: string[];
  requiredReverificationTriggers: string[];
}

export type ProductionGoLiveGateId =
  | 'GATE_A_ARCHITECTURE'
  | 'GATE_B_SECURITY'
  | 'GATE_C_DATA_INTEGRITY'
  | 'GATE_D_GOVERNANCE'
  | 'GATE_E_EXECUTION'
  | 'GATE_F_VALIDATION'
  | 'GATE_G_AI_SAFETY'
  | 'GATE_H_RESILIENCE'
  | 'GATE_I_DEPLOYMENT'
  | 'GATE_J_OBSERVABILITY'
  | 'GATE_K_RECOVERY'
  | 'GATE_L_TRACEABILITY'
  | 'GATE_M_OPERATIONAL_READINESS';

export type GoLiveGateStatus =
  | 'PASSED'
  | 'FAILED'
  | 'BLOCKED'
  | 'CONDITIONALLY_PASSED'
  | 'NOT_APPLICABLE';

export interface GoLiveGate {
  gateId: ProductionGoLiveGateId;
  name: string;
  category: string;
  status: GoLiveGateStatus;
  evidence: string;
  findings: string[];
  evaluatedAt: string;
  verifiedBy: string;
}

export interface ResidualRisk {
  riskId: string;
  description: string;
  affectedComponent: string;
  evidence: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  likelihood: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  mitigation: string;
  remainingExposure: string;
  owner: string;
  expirationDate: string;
  requiredApprovalRole: UserRole;
  status: 'ACCEPTED' | 'MITIGATING' | 'MONITORING' | 'RESOLVED';
}

export interface TraceabilityChain {
  targetId: string;
  targetType: 'TASK' | 'REQUIREMENT' | 'DECISION' | 'DEPLOYMENT';
  whyExists: string;
  requirementId: string;
  requirementTitle: string;
  decisionId: string;
  decisionTitle: string;
  taskId: string;
  taskTitle: string;
  agentId: string;
  agentRole: string;
  contextProvided: string;
  promptVersion: string;
  filesChanged: string[];
  validationRulesApplied: string[];
  evidenceProvingCorrectness: string;
  findingsOccurred: string[];
  risksAccepted: string[];
  deploymentId?: string;
  deploymentEnvironment?: string;
  postDeploymentOutcome?: string;
}

export interface ChangeImpactAssessment {
  changedArtifacts: string[];
  recommendedLevel: VerificationLevel;
  levelName: string;
  rationale: string;
  affectedContracts: string[];
  affectedModules: string[];
  affectedTests: string[];
  affectedValidationRules: string[];
  requiredVerificationSet: string[];
}

export type DefectCategory =
  | 'CONTRACT_CONFLICT'
  | 'AUTHORITY_VIOLATION'
  | 'DATA_INTEGRITY'
  | 'SECURITY'
  | 'TENANT_ISOLATION'
  | 'FUNCTIONAL'
  | 'INTEGRATION'
  | 'VALIDATION'
  | 'DRIFT'
  | 'AGENT_BEHAVIOR'
  | 'AI_SAFETY'
  | 'PERFORMANCE'
  | 'RESILIENCE'
  | 'DEPLOYMENT'
  | 'OBSERVABILITY'
  | 'UX'
  | 'ACCESSIBILITY'
  | 'GOVERNANCE'
  | 'TRACEABILITY'
  | 'DOCUMENTATION';

export interface SystemDefect {
  id: string;
  category: DefectCategory;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedComponent: string;
  evidence: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'VERIFIED';
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface GoLiveDecisionPackage {
  projectId: string;
  verificationState: SystemVerificationState;
  productionState: SystemProductionState;
  verificationLevelUsed: VerificationLevel;
  evaluatedAt: string;
  gates: GoLiveGate[];
  residualRisks: ResidualRisk[];
  defects: SystemDefect[];
  summary: {
    passedGates: number;
    totalGates: number;
    openCriticalDefects: number;
    acceptedResidualRisks: number;
    traceabilityCompletenessPercent: number;
    isReadyForHumanApproval: boolean;
  };
  humanApproval?: {
    approvedBy: string;
    role: UserRole;
    approvedAt: string;
    rationale: string;
  };
  observationPlan: {
    monitoringActive: boolean;
    triggers: string[];
    rollbackThresholds: string[];
  };
}

// ============================================================================
// PHASE 12: CONTROLLED GO-LIVE, CONTINUOUS OPERATIONS & MAINTENANCE
// ============================================================================

export type OperationalMaturityState =
  | 'PRE_PRODUCTION'
  | 'CONTROLLED_GO_LIVE'
  | 'OBSERVATION'
  | 'OPERATIONAL'
  | 'DEGRADED'
  | 'RECOVERY';

export interface AIProviderOperationalStatus {
  provider: string;
  model: string;
  fallbackTarget: string;
  latencyMs: number;
  errorRate: number;
  status: 'HEALTHY' | 'DEGRADED' | 'OUTAGE';
}

export interface OperationalBaseline {
  applicationVersion: string;
  storageVersion: string;
  migrationVersion: string;
  configVersion: string;
  enabledFeatureFlags: Record<string, boolean>;
  aiProviderVersions: AIProviderOperationalStatus[];
  agentVersions: Record<string, string>;
  validationRuleVersions: Record<string, string>;
  securityPolicyVersions: Record<string, string>;
  deploymentId: string;
  establishedAt: string;
  activeOperationalPolicies: string[];
}

export interface ProductionSmokeCheck {
  id: string;
  name: string;
  category: 'APPLICATION' | 'AUTH' | 'STORAGE' | 'VALIDATION' | 'AI_PROVIDER' | 'OBSERVABILITY' | 'BACKUP';
  passed: boolean;
  details: string;
  latencyMs: number;
  evaluatedAt: string;
}

export type MaintenanceCategory =
  | 'CORRECTIVE'
  | 'PREVENTIVE'
  | 'ADAPTIVE'
  | 'SECURITY'
  | 'PERFORMANCE'
  | 'OPERATIONAL'
  | 'GOVERNANCE';

export interface MaintenanceTask {
  id: string;
  category: MaintenanceCategory;
  title: string;
  description: string;
  affectedComponent: string;
  impact: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PROPOSED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  owner: string;
  scheduledFor?: string;
  completedAt?: string;
  resolutionNotes?: string;
}

export interface TechnicalDebtItem {
  id: string;
  problem: string;
  evidence: string;
  impact: string;
  affectedComponent: string;
  risk: string;
  estimatedEffort: '1h' | '4h' | '1d' | '3d' | '1w';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  owner: string;
  status: 'IDENTIFIED' | 'ACCEPTED' | 'REMEDIATING' | 'RESOLVED';
  proposedRemediation: string;
}

export interface ProductionChangeFreeze {
  active: boolean;
  reason?: string;
  initiatedBy?: string;
  initiatedAt?: string;
  allowedExceptionTypes: string[];
}

export interface EmergencyAccessSession {
  id: string;
  actorId: string;
  actorRole: UserRole;
  reason: string;
  startedAt: string;
  expiresAt: string;
  active: boolean;
  affectedResources: string[];
  auditTrailRef: string;
}

export interface OperationalOverview {
  maturityState: OperationalMaturityState;
  baseline: OperationalBaseline;
  smokeChecks: ProductionSmokeCheck[];
  changeFreeze: ProductionChangeFreeze;
  activeEmergencySessions: EmergencyAccessSession[];
  maintenanceTasks: MaintenanceTask[];
  technicalDebt: TechnicalDebtItem[];
  operationalMetrics: {
    systemAvailability: number;
    errorRate: number;
    incidentRate: number;
    validationFailureRate: number;
    activeAlertsCount: number;
    driftFrequencyPerHour: number;
  };
}

// ============================================================================
// PHASE 13: CONTINUOUS ASSURANCE, CONTROLLED EVOLUTION & ARCHITECTURAL INTEGRITY
// ============================================================================

export interface CanonicalArchitecturalPrinciple {
  id: number;
  principle: string;
  rationale: string;
  enforcementMechanism: string;
  verifiedStatus: 'ENFORCED' | 'MONITORED';
}

export type ConceptDomain =
  | 'REQUIREMENTS'
  | 'DECISIONS'
  | 'ARCHITECTURE'
  | 'TASK_STATE'
  | 'EXECUTION_STATE'
  | 'VALIDATION'
  | 'SECURITY_POLICY'
  | 'DEPLOYMENT'
  | 'ORGANIZATIONAL_LEARNING';

export interface AuthorityMapping {
  domain: ConceptDomain;
  conceptName: string;
  authoritativeOwner: string;
  sourceOfTruthLocation: string;
  derivedProjections: string[];
  lastIntegrityCheck: string;
  duplicateAuthorityDetected: boolean;
}

export type ContinuousAssuranceTriggerType =
  | 'ARCHITECTURE'
  | 'SECURITY'
  | 'DATA'
  | 'AGENT'
  | 'AI_PROVIDER'
  | 'VALIDATION'
  | 'DEPLOYMENT'
  | 'INCIDENT'
  | 'DRIFT'
  | 'LEARNING';

export interface AssuranceTriggerEvent {
  id: string;
  triggerType: ContinuousAssuranceTriggerType;
  sourceArtifact: string;
  evidence: string;
  timestamp: string;
  affectedScopeIds: string[];
  affectedContractIds: string[];
  affectedSuites: string[];
  reverificationRequired: boolean;
  escalatedToFullSystem: boolean;
  status: 'PENDING' | 'VERIFIED' | 'DISMISSED';
}

export type SimplificationStatus =
  | 'CANDIDATE'
  | 'USAGE_EVALUATED'
  | 'DEPENDENCY_ANALYZED'
  | 'DEPRECATED'
  | 'OBSERVATION'
  | 'REMOVED';

export interface SimplificationCandidate {
  id: string;
  artifactName: string;
  artifactType: 'MODULE' | 'TABLE' | 'API' | 'WORKFLOW' | 'FEATURE_FLAG' | 'CONFIG' | 'ADAPTER';
  reason: string;
  usageEvidence: string;
  dependencyAnalysis: string[];
  riskAnalysis: string;
  status: SimplificationStatus;
  proposedBy: string;
  createdAt: string;
  reviewDate: string;
}

export interface GovernedFeatureFlag {
  key: string;
  purpose: string;
  owner: string;
  creationDate: string;
  expectedLifecycle: 'TEMPORARY_ROLLOUT' | 'PERMANENT_OPERATIONAL' | 'EXPERIMENT' | 'SAFETY_OVERRIDE';
  currentState: boolean;
  dependencies: string[];
  removalCondition: string;
  isStale: boolean;
}

export interface MetricGamingAnomaly {
  id: string;
  metricName: string;
  observedPattern: string;
  potentialGamingHypothesis: string;
  evidenceData: Record<string, unknown>;
  detectedAt: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'SUSPECTED' | 'CONFIRMED' | 'RESOLVED' | 'FALSE_POSITIVE';
  correctiveAction: string;
}

export interface FeedbackLoopDetection {
  id: string;
  loopType: 'RECOMMENDATION_REINFORCEMENT' | 'STRATEGY_OVERSELECTION' | 'VALIDATION_SUPPRESSION';
  description: string;
  confidenceScore: number;
  artificialConfidenceRisk: string;
  detectedAt: string;
  status: 'FLAGGED' | 'INVESTIGATING' | 'MITIGATED';
  mitigationRecommendation: string;
}

export interface ContinuousAssuranceOverview {
  projectId: string;
  principles: CanonicalArchitecturalPrinciple[];
  authorityMappings: AuthorityMapping[];
  duplicateAuthoritiesCount: number;
  activeTriggers: AssuranceTriggerEvent[];
  simplificationCandidates: SimplificationCandidate[];
  governedFlags: GovernedFeatureFlag[];
  gamingAnomalies: MetricGamingAnomaly[];
  feedbackLoops: FeedbackLoopDetection[];
  evolutionProposals: EvolutionProposal[];
  targetedVerificationRecommendation: {
    recommendedLevel: string;
    affectedSuites: string[];
    fullSystemAvoided: boolean;
    evidenceFreshnessPreserved: number;
  };
}





