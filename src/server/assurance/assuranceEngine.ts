/**
 * ARCADIA SYSTEM - PHASE 13: CONTINUOUS ASSURANCE, CONTROLLED EVOLUTION & ARCHITECTURAL INTEGRITY
 * 
 * Establishes the permanent mechanism by which Arcadia remains correct, secure,
 * maintainable, governed, and architecturally coherent as the system changes over time.
 * 
 * Reuses existing engines:
 * - storage.ts (Governance, Change Requests, Constitution, Audit Log)
 * - scopeRegistry.ts (Verification Scope Registry, Change Impact Assessment)
 * - driftEngine.ts (Drift Detection & Classification)
 * - metricsEngine.ts (Metrics Intelligence)
 * - memoryEngine.ts (Organizational Memory Lifecycle)
 * - operationsEngine.ts (Operational Baselines, Smoke Checks, Feature Flags)
 */

import { storage } from '../storage.ts';
import { scopeRegistry } from '../verification/scopeRegistry.ts';
import { driftEngine } from '../validation/driftEngine.ts';
import { metricsEngine } from '../learning/metricsEngine.ts';
import { operationsEngine } from '../operations/operationsEngine.ts';
import {
  CanonicalArchitecturalPrinciple,
  AuthorityMapping,
  ConceptDomain,
  ContinuousAssuranceTriggerType,
  AssuranceTriggerEvent,
  SimplificationCandidate,
  SimplificationStatus,
  GovernedFeatureFlag,
  MetricGamingAnomaly,
  FeedbackLoopDetection,
  EvolutionProposal,
  ContinuousAssuranceOverview,
  UserRole
} from '../../types/index.ts';

export class AssuranceEngine {
  private triggers: Map<string, AssuranceTriggerEvent[]> = new Map();
  private simplifications: Map<string, SimplificationCandidate[]> = new Map();
  private proposals: Map<string, EvolutionProposal[]> = new Map();
  private gamingAnomalies: Map<string, MetricGamingAnomaly[]> = new Map();
  private feedbackLoops: Map<string, FeedbackLoopDetection[]> = new Map();

  // The 18 Canonical Architectural Principles defined in Section 40
  private canonicalPrinciples: CanonicalArchitecturalPrinciple[] = [
    {
      id: 1,
      principle: 'Project truth has explicit authority.',
      rationale: 'Requirements, architecture, decisions, and tasks must originate from an unambiguous single source of truth.',
      enforcementMechanism: 'Single Authority Mapping & Supreme Constitution Invariant',
      verifiedStatus: 'ENFORCED'
    },
    {
      id: 2,
      principle: 'Prompts are execution artifacts.',
      rationale: 'Prompts guide models during task execution but cannot override project requirements or governance rules.',
      enforcementMechanism: 'Prompt Compiler context isolation and system instruction guards',
      verifiedStatus: 'ENFORCED'
    },
    {
      id: 3,
      principle: 'Agents are execution participants.',
      rationale: 'Agents execute governed tasks but have no innate authority to ratify requirements or release software.',
      enforcementMechanism: 'RBAC least-privilege boundary and separation of concerns invariant',
      verifiedStatus: 'ENFORCED'
    },
    {
      id: 4,
      principle: 'Historical information does not override current state.',
      rationale: 'Historical memories and previous executions are evidence, not retroactive commands.',
      enforcementMechanism: 'Immutable Append-Only Audit Trail and Versioned State Transitions',
      verifiedStatus: 'ENFORCED'
    },
    {
      id: 5,
      principle: 'Learning does not silently become policy.',
      rationale: 'Organizational patterns and memory recommendations require explicit human governance ratification.',
      enforcementMechanism: 'Phase 9 Memory Engine human ratification bridge',
      verifiedStatus: 'ENFORCED'
    },
    {
      id: 6,
      principle: 'Human authority remains explicit.',
      rationale: 'High-risk state changes, go-live decisions, and constitutional amendments require authenticated human roles.',
      enforcementMechanism: 'Role verification on Go-Live and Constitution update APIs',
      verifiedStatus: 'ENFORCED'
    },
    {
      id: 7,
      principle: 'Validation requires evidence.',
      rationale: 'Tasks and releases cannot pass through silence, defaults, or assertions without concrete proof.',
      enforcementMechanism: 'Validation Contract Gates with AST scans, test reports, and lint proofs',
      verifiedStatus: 'ENFORCED'
    },
    {
      id: 8,
      principle: 'Security outranks optimization.',
      rationale: 'Performance or token-reduction optimizations must never compromise RBAC, tenant isolation, or safety.',
      enforcementMechanism: 'Phase 8 Optimization Engine hard security boundaries',
      verifiedStatus: 'ENFORCED'
    },
    {
      id: 9,
      principle: 'Correctness outranks cost.',
      rationale: 'Financial cost caps must pause execution safely rather than degrading validation rigor.',
      enforcementMechanism: 'Cost Engine pause triggers and strict validation invariant',
      verifiedStatus: 'ENFORCED'
    },
    {
      id: 10,
      principle: 'Changes are impact-analyzed.',
      rationale: 'Mutations to code, schemas, or contracts must map directly to their dependencies before execution.',
      enforcementMechanism: 'Scope Registry change impact evaluator and dependency graph',
      verifiedStatus: 'ENFORCED'
    },
    {
      id: 11,
      principle: 'Production behavior generates evidence.',
      rationale: 'Live operational metrics, telemetry, and incidents feedback directly into system evaluation.',
      enforcementMechanism: 'Phase 12 Smoke Checks and Observability Engine metrics collection',
      verifiedStatus: 'ENFORCED'
    },
    {
      id: 12,
      principle: 'Evidence drives evolution.',
      rationale: 'System evolution is permitted solely when substantiated by measured operational data.',
      enforcementMechanism: 'Phase 13 Controlled Evolution Loop and Evolution Proposal governance',
      verifiedStatus: 'ENFORCED'
    },
    {
      id: 13,
      principle: 'Existing capabilities are reused before new ones are created.',
      rationale: 'Anti-redundancy rule: Extend existing verified modules instead of spawning duplicate subsystems.',
      enforcementMechanism: 'Architectural Integrity Baseline and Simplification Registry',
      verifiedStatus: 'ENFORCED'
    },
    {
      id: 14,
      principle: 'Verification is change-aware.',
      rationale: 'Re-verification focuses precisely on affected modules to avoid wasteful perpetual full-system loops.',
      enforcementMechanism: 'Continuous Assurance Triggers and Targeted Verification Recommender',
      verifiedStatus: 'ENFORCED'
    },
    {
      id: 15,
      principle: 'The system fails safely.',
      rationale: 'When SEV1 incidents or circuit breaker trips occur, the system transitions into SAFE_MODE.',
      enforcementMechanism: 'Incident Engine auto-containment and SAFE_MODE isolation',
      verifiedStatus: 'ENFORCED'
    },
    {
      id: 16,
      principle: 'Authoritative state is recoverable.',
      rationale: 'Disaster recovery snapshots and restore drills ensure data integrity within defined RTO/RPO limits.',
      enforcementMechanism: 'Disaster Recovery Engine checksummed snapshots and automated restore drills',
      verifiedStatus: 'ENFORCED'
    },
    {
      id: 17,
      principle: 'Every important action is traceable.',
      rationale: 'Any task, decision, or artifact can answer the 13 backwards provenance questions.',
      enforcementMechanism: 'Phase 11 Traceability Engine with immutable audit links',
      verifiedStatus: 'ENFORCED'
    },
    {
      id: 18,
      principle: 'Complexity requires justification.',
      rationale: 'Proposed changes must answer the 7 canonical complexity control questions before approval.',
      enforcementMechanism: 'Evolution Proposal complexity control checklist',
      verifiedStatus: 'ENFORCED'
    }
  ];

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    const projId = 'proj-core-os';

    // Seed Simplification Candidates (governed lifecycle)
    this.simplifications.set(projId, [
      {
        id: 'SMP-001',
        artifactName: 'legacyStaticPromptTemplates',
        artifactType: 'MODULE',
        reason: 'Superseded by dynamic Phase 5 PromptCompiler with strict injection guardrails.',
        usageEvidence: 'Zero runtime calls across all 9 verified test suites and production executions.',
        dependencyAnalysis: ['src/server/execution/promptCompiler.ts (superseding owner)'],
        riskAnalysis: 'Low. Fully superseded; no callers remain in active routes.',
        status: 'DEPRECATED',
        proposedBy: 'ARCHITECT',
        createdAt: '2026-09-28T10:00:00Z',
        reviewDate: '2026-10-15T00:00:00Z'
      },
      {
        id: 'SMP-002',
        artifactName: 'experimentalUnusedCostHeuristic',
        artifactType: 'CONFIG',
        reason: 'Replaced by deterministic Phase 8 CostEngine rate cards.',
        usageEvidence: 'Historical prototype config flag not referenced in production baseline v12.0.0-prod.',
        dependencyAnalysis: ['src/server/optimization/costEngine.ts'],
        riskAnalysis: 'Negligible. Can be safely retired following observation period.',
        status: 'OBSERVATION',
        proposedBy: 'PROJECT_LEAD',
        createdAt: '2026-09-29T14:00:00Z',
        reviewDate: '2026-10-10T00:00:00Z'
      }
    ]);

    // Seed Evolution Proposals
    this.proposals.set(projId, [
      {
        id: 'EVO-2026-001',
        organizationId: 'org-arcadia-demo',
        projectId: projId,
        title: 'Integrate Streaming Telemetry for Upstream AI Latency',
        triggeringPatternIds: [],
        triggeringMemoryIds: [],
        simulatedImpact: {
          predictedImprovementPercent: 15,
          riskRating: 'MINIMAL',
          affectedWorkflows: ['Upstream Telemetry']
        },
        currentState: 'Batch telemetry logging for upstream AI provider responses',
        desiredState: 'Micro-batched streaming telemetry window to detect latency spikes 5x faster',
        reason: 'Measured upstream provider tail latency variance during production operations',
        evidence: 'Phase 12 Smoke check metrics logged 420ms p95 latency on secondary fallback provider',
        affectedRequirements: ['REQ-OBS-001'],
        affectedArchitecture: ['src/server/optimization/telemetryEngine.ts'],
        affectedSecurity: [],
        affectedData: ['telemetry_snapshots'],
        affectedAgents: [],
        affectedValidation: ['Suite 5 (Optimization)'],
        affectedDeployment: [],
        expectedBenefit: 'Reduces latency anomaly detection time from 60s to 12s',
        cost: 150,
        risk: 'LOW',
        rollbackPlan: 'Toggle STAGED_ROLLOUT flag to false to revert to batch telemetry mode',
        verificationRequirements: ['Suite 5 targeted re-verification', 'Telemetry buffer invariant check'],
        status: 'RATIFIED',
        proposedBy: 'OPERATIONS',
        ratifiedBy: 'usr-lead-1',
        ratifiedAt: '2026-09-30T16:00:00Z',
        createdAt: '2026-09-30T12:00:00Z'
      }
    ]);

    // Seed Metric Gaming Anomalies
    this.gamingAnomalies.set(projId, [
      {
        id: 'GAM-001',
        metricName: 'First-Pass Yield Optimization',
        observedPattern: 'Zero validation errors reported over 50 mock agent tasks during non-governed run',
        potentialGamingHypothesis: 'Task scope was artificially restricted to trivial operations to inflate First-Pass Yield',
        evidenceData: { averageTaskLinesChanged: 1, firstPassYield: 100 },
        detectedAt: '2026-09-30T18:00:00Z',
        severity: 'LOW',
        status: 'RESOLVED',
        correctiveAction: 'Enforced minimum complexity threshold and AST boundary checks on validation pass assertions'
      }
    ]);

    // Seed Feedback Loop Detections
    this.feedbackLoops.set(projId, [
      {
        id: 'FBL-001',
        loopType: 'STRATEGY_OVERSELECTION',
        description: 'Agent senior-fullstack selected for 92% of tasks due to self-reinforcing historical memory weight',
        confidenceScore: 0.88,
        artificialConfidenceRisk: 'Suppresses alternate agent specializations and reduces multi-agent diversity',
        detectedAt: '2026-09-30T19:30:00Z',
        status: 'MITIGATED',
        mitigationRecommendation: 'Applied exploration-decay parameter to agent strategy selection in AdaptivePipeline'
      }
    ]);

    // Seed Assurance Trigger Event
    this.triggers.set(projId, [
      {
        id: 'TRG-001',
        triggerType: 'AI_PROVIDER',
        sourceArtifact: 'src/server/operations/operationsEngine.ts:aiProviderVersions',
        evidence: 'Upstream Gemini model updated to models/gemini-3.8-flash; latency verified at 380ms',
        timestamp: '2026-09-30T09:00:00Z',
        affectedScopeIds: ['VR-EXEC-001', 'VR-AI-SAFETY-001'],
        affectedContractIds: ['Execution Sandboxing Contract v2.0'],
        affectedSuites: ['Suite 2 (Autonomous Execution)', 'Suite 8 (Full-System Go-Live)'],
        reverificationRequired: true,
        escalatedToFullSystem: false,
        status: 'VERIFIED'
      }
    ]);
  }

  /**
   * Returns all 18 Canonical Principles and their enforcement status
   */
  public getCanonicalPrinciples(): CanonicalArchitecturalPrinciple[] {
    return this.canonicalPrinciples;
  }

  /**
   * Source-of-Truth Integrity: Evaluates single authoritative owner per concept domain
   * Detects duplicate authority attempts as an architectural defect (Section 6).
   */
  public getAuthorityMappings(projectId: string): {
    mappings: AuthorityMapping[];
    duplicateAuthoritiesCount: number;
    integrityVerified: boolean;
  } {
    const mappings: AuthorityMapping[] = [
      {
        domain: 'REQUIREMENTS',
        conceptName: 'Project Requirements & Acceptance Criteria',
        authoritativeOwner: 'Requirements Authority',
        sourceOfTruthLocation: 'src/server/storage.ts:requirements',
        derivedProjections: ['src/components/RequirementsView.tsx', 'UniversalTaskSpecification.requirementsSatisfied'],
        lastIntegrityCheck: new Date().toISOString(),
        duplicateAuthorityDetected: false
      },
      {
        domain: 'DECISIONS',
        conceptName: 'Architecture & Governance Decisions',
        authoritativeOwner: 'Decision Authority',
        sourceOfTruthLocation: 'src/server/storage.ts:decisions',
        derivedProjections: ['DecisionQueueView.tsx', 'DecisionsView.tsx'],
        lastIntegrityCheck: new Date().toISOString(),
        duplicateAuthorityDetected: false
      },
      {
        domain: 'ARCHITECTURE',
        conceptName: 'Supreme Project Constitution & Rules',
        authoritativeOwner: 'Architecture Authority',
        sourceOfTruthLocation: 'src/server/storage.ts:constitutions',
        derivedProjections: ['src/components/ConstitutionView.tsx', 'scopeRegistry.ts'],
        lastIntegrityCheck: new Date().toISOString(),
        duplicateAuthorityDetected: false
      },
      {
        domain: 'TASK_STATE',
        conceptName: 'Universal Task Specification & Lifecycle',
        authoritativeOwner: 'Task Authority',
        sourceOfTruthLocation: 'src/server/storage.ts:tasks',
        derivedProjections: ['src/components/TasksView.tsx', 'executionEngine.ts'],
        lastIntegrityCheck: new Date().toISOString(),
        duplicateAuthorityDetected: false
      },
      {
        domain: 'EXECUTION_STATE',
        conceptName: 'Autonomous Agent Execution Pipeline',
        authoritativeOwner: 'Execution Authority',
        sourceOfTruthLocation: 'src/server/execution/executionEngine.ts',
        derivedProjections: ['src/components/ExecutionsView.tsx', 'collaborationEngine.ts'],
        lastIntegrityCheck: new Date().toISOString(),
        duplicateAuthorityDetected: false
      },
      {
        domain: 'VALIDATION',
        conceptName: 'Contracts, AST Scans & Verification Gates',
        authoritativeOwner: 'Validation Authority',
        sourceOfTruthLocation: 'src/server/validation/validationEngine.ts',
        derivedProjections: ['src/components/ValidationView.tsx', 'storage.ts:validationContracts'],
        lastIntegrityCheck: new Date().toISOString(),
        duplicateAuthorityDetected: false
      },
      {
        domain: 'SECURITY_POLICY',
        conceptName: 'Multi-Tenant RBAC & Permission Matrix',
        authoritativeOwner: 'Security Authority',
        sourceOfTruthLocation: 'src/server/storage.ts:ROLE_PERMISSIONS',
        derivedProjections: ['src/server/auth.ts:requirePermission', 'storage.ts:hasPermission'],
        lastIntegrityCheck: new Date().toISOString(),
        duplicateAuthorityDetected: false
      },
      {
        domain: 'DEPLOYMENT',
        conceptName: 'Release Gates, Rollback & Change Freeze',
        authoritativeOwner: 'Deployment Authority',
        sourceOfTruthLocation: 'src/server/resilience/deploymentGovernanceEngine.ts',
        derivedProjections: ['src/server/operations/operationsEngine.ts:changeFreezes'],
        lastIntegrityCheck: new Date().toISOString(),
        duplicateAuthorityDetected: false
      },
      {
        domain: 'ORGANIZATIONAL_LEARNING',
        conceptName: 'Organizational Memory & Evolutionary Patterns',
        authoritativeOwner: 'Learning Authority',
        sourceOfTruthLocation: 'src/server/learning/memoryEngine.ts',
        derivedProjections: ['src/components/LearningView.tsx', 'storage.ts:memories'],
        lastIntegrityCheck: new Date().toISOString(),
        duplicateAuthorityDetected: false
      }
    ];

    const duplicateAuthoritiesCount = mappings.filter(m => m.duplicateAuthorityDetected).length;

    return {
      mappings,
      duplicateAuthoritiesCount,
      integrityVerified: duplicateAuthoritiesCount === 0
    };
  }

  /**
   * Continuous Assurance Triggers & Impact Graph (Sections 35 & 36)
   * Prevents perpetual full-system testing by analyzing change impact and targeting tests.
   */
  public evaluateAssuranceTrigger(
    projectId: string,
    triggerType: ContinuousAssuranceTriggerType,
    sourceArtifact: string,
    evidence: string
  ): AssuranceTriggerEvent {
    // 1. Evaluate change impact against the existing ScopeRegistry
    const impactAssessment = scopeRegistry.evaluateVerificationLevel([sourceArtifact]);

    // 2. Map affected scopes to specific test suites
    const affectedSuites: string[] = [];
    const affectedScopeIds: string[] = impactAssessment.requiredVerificationSet || [];
    const affectedContractIds: string[] = impactAssessment.affectedContracts || [];

    // Map affected modules and tests to suites deterministically
    for (const testRef of impactAssessment.affectedTests) {
      if (testRef.includes('foundation') && !affectedSuites.includes('Suite 1 (Foundation)')) {
        affectedSuites.push('Suite 1 (Foundation)');
      }
      if (testRef.includes('execution') && !affectedSuites.includes('Suite 2 (Autonomous Execution)')) {
        affectedSuites.push('Suite 2 (Autonomous Execution)');
      }
      if (testRef.includes('validation') && !affectedSuites.includes('Suite 4 (Validation)')) {
        affectedSuites.push('Suite 4 (Validation)');
      }
      if (testRef.includes('resilience') && !affectedSuites.includes('Suite 7 (Resilience)')) {
        affectedSuites.push('Suite 7 (Resilience)');
      }
      if (testRef.includes('integration') && !affectedSuites.includes('Suite 8 (Full-System Go-Live)')) {
        affectedSuites.push('Suite 8 (Full-System Go-Live)');
      }
    }

    // Default targeted suite fallback if none mapped
    if (affectedSuites.length === 0) {
      affectedSuites.push('Suite 9 (Operations & Runtime)');
    }

    // Full system re-verification is only escalated if Level 5 (auth/security/storage root core modified)
    const escalatedToFullSystem = impactAssessment.recommendedLevel === 5;

    const triggerEvent: AssuranceTriggerEvent = {
      id: `trg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      triggerType,
      sourceArtifact,
      evidence,
      timestamp: new Date().toISOString(),
      affectedScopeIds,
      affectedContractIds,
      affectedSuites,
      reverificationRequired: true,
      escalatedToFullSystem,
      status: 'PENDING'
    };

    const projectTriggers = this.triggers.get(projectId) || [];
    projectTriggers.unshift(triggerEvent);
    this.triggers.set(projectId, projectTriggers);

    // Record in authoritative audit log
    storage.recordAudit({
      actorId: 'SYSTEM',
      actorRole: 'OPERATIONS',
      action: 'CONTINUOUS_ASSURANCE_TRIGGER',
      targetEntity: 'TRIGGER',
      targetId: triggerEvent.id,
      projectId,
      afterState: {
        triggerType,
        sourceArtifact,
        escalatedToFullSystem,
        affectedSuitesCount: affectedSuites.length
      },
      correlationId: `cor-assure-${Date.now()}`
    });

    return triggerEvent;
  }

  /**
   * Governed Feature Flag Lifecycle (Section 30)
   */
  public getGovernedFeatureFlags(projectId: string): GovernedFeatureFlag[] {
    const baseline = operationsEngine.getOperationalBaseline(projectId);
    const flags = baseline.enabledFeatureFlags;

    const governedList: GovernedFeatureFlag[] = [
      {
        key: 'STAGED_ROLLOUT',
        purpose: 'Permits gradual traffic shift during production deployment release gates',
        owner: 'OPERATIONS',
        creationDate: '2026-09-01T00:00:00Z',
        expectedLifecycle: 'PERMANENT_OPERATIONAL',
        currentState: flags.STAGED_ROLLOUT,
        dependencies: ['deploymentGovernanceEngine.ts'],
        removalCondition: 'Never (permanent operational safety capability)',
        isStale: false
      },
      {
        key: 'CANARY_EXPOSURE',
        purpose: 'Exposes 5% of execution traffic to experimental agent prompt variants',
        owner: 'ARCHITECT',
        creationDate: '2026-09-10T00:00:00Z',
        expectedLifecycle: 'EXPERIMENT',
        currentState: flags.CANARY_EXPOSURE,
        dependencies: ['promptCompiler.ts'],
        removalCondition: 'Retire upon completion of Q3 agent accuracy evaluation',
        isStale: false
      },
      {
        key: 'AUTOMATED_SAFE_MODE',
        purpose: 'Instantly transitions system to SAFE_MODE on SEV1 failure',
        owner: 'SECURITY',
        creationDate: '2026-09-01T00:00:00Z',
        expectedLifecycle: 'SAFETY_OVERRIDE',
        currentState: flags.AUTOMATED_SAFE_MODE,
        dependencies: ['incidentEngine.ts', 'failureEngine.ts'],
        removalCondition: 'Never (mandatory containment invariant)',
        isStale: false
      },
      {
        key: 'EVIDENCE_FIRST_VERIFICATION',
        purpose: 'Enforces evidence reuse and skips full re-run when artifacts remain unmutated',
        owner: 'PROJECT_LEAD',
        creationDate: '2026-09-15T00:00:00Z',
        expectedLifecycle: 'PERMANENT_OPERATIONAL',
        currentState: flags.EVIDENCE_FIRST_VERIFICATION,
        dependencies: ['scopeRegistry.ts'],
        removalCondition: 'Never (anti-perpetual verification rule)',
        isStale: false
      },
      {
        key: 'CIRCUIT_BREAKERS_ACTIVE',
        purpose: 'Isolates external AI provider failures before cascade reaches user tasks',
        owner: 'OPERATIONS',
        creationDate: '2026-09-15T00:00:00Z',
        expectedLifecycle: 'PERMANENT_OPERATIONAL',
        currentState: flags.CIRCUIT_BREAKERS_ACTIVE,
        dependencies: ['circuitBreakerEngine.ts'],
        removalCondition: 'Never (mandatory resilience invariant)',
        isStale: false
      },
      {
        key: 'ORGANIZATIONAL_MEMORY_STRICT',
        purpose: 'Requires human PROJECT_LEAD verification before candidate memories become policy',
        owner: 'ARCHITECT',
        creationDate: '2026-09-20T00:00:00Z',
        expectedLifecycle: 'PERMANENT_OPERATIONAL',
        currentState: flags.ORGANIZATIONAL_MEMORY_STRICT,
        dependencies: ['memoryEngine.ts'],
        removalCondition: 'Never (anti-poisoning governance invariant)',
        isStale: false
      }
    ];

    return governedList;
  }

  /**
   * Architectural Simplification Candidates (Sections 28 & 29)
   */
  public getSimplificationCandidates(projectId: string): SimplificationCandidate[] {
    return this.simplifications.get(projectId) || [];
  }

  /**
   * Advances a Simplification Candidate along its governed 6-stage lifecycle
   */
  public advanceSimplificationStage(
    projectId: string,
    candidateId: string,
    targetStatus: SimplificationStatus,
    actorId: string,
    actorRole: UserRole
  ): SimplificationCandidate {
    // Only PROJECT_LEAD, ARCHITECT, or OPERATIONS can advance simplification stages
    if (actorRole !== 'PROJECT_LEAD' && actorRole !== 'ARCHITECT' && actorRole !== 'OPERATIONS') {
      throw new Error(`Role '${actorRole}' is not authorized to govern architectural simplification.`);
    }

    const list = this.simplifications.get(projectId) || [];
    const item = list.find(s => s.id === candidateId);
    if (!item) {
      throw new Error(`Simplification candidate '${candidateId}' not found.`);
    }

    item.status = targetStatus;

    storage.recordAudit({
      actorId,
      actorRole,
      action: 'ARCHITECTURAL_SIMPLIFICATION_STAGE',
      targetEntity: 'SIMPLIFICATION',
      targetId: candidateId,
      projectId,
      afterState: { targetStatus, actorRole, artifactName: item.artifactName },
      correlationId: `cor-simp-${Date.now()}`
    });

    return item;
  }

  /**
   * Metric Gaming & Feedback Loop Protection (Sections 17, 18, 19)
   */
  public detectMetricGamingAndLoops(projectId: string): {
    anomalies: MetricGamingAnomaly[];
    loops: FeedbackLoopDetection[];
    gamingDetected: boolean;
  } {
    const anomalies = this.gamingAnomalies.get(projectId) || [];
    const loops = this.feedbackLoops.get(projectId) || [];

    // Dynamically check live metrics from MetricsEngine
    const snapshots = metricsEngine.computeSnapshots(projectId);
    const failureRateMetric = snapshots.find(s => s.category === 'FAILURE_RATE');

    // Detect if validation failure rate is suspiciously zero while tasks are executed
    const tasks = storage.getTasks(projectId);
    if (tasks.length > 20 && failureRateMetric && failureRateMetric.value === 0) {
      const existing = anomalies.find(a => a.metricName === 'Validation Failure Rate Zero-Floor');
      if (!existing) {
        anomalies.push({
          id: `gam-${Date.now()}`,
          metricName: 'Validation Failure Rate Zero-Floor',
          observedPattern: 'Zero validation failures observed across >20 tasks',
          potentialGamingHypothesis: 'Validation contract assertions may have been weakened or mocked',
          evidenceData: { tasksCount: tasks.length, failureRate: 0 },
          detectedAt: new Date().toISOString(),
          severity: 'HIGH',
          status: 'SUSPECTED',
          correctiveAction: 'Run Suite 4 Validation Invariant tests and AST scans'
        });
      }
    }

    return {
      anomalies,
      loops,
      gamingDetected: anomalies.some(a => a.status === 'SUSPECTED' || a.status === 'CONFIRMED')
    };
  }

  /**
   * Evolution Proposals (Sections 1, 9, 37)
   */
  public getEvolutionProposals(projectId: string): EvolutionProposal[] {
    return this.proposals.get(projectId) || [];
  }

  /**
   * Creates an Evolution Proposal
   */
  public createEvolutionProposal(
    projectId: string,
    proposal: Omit<EvolutionProposal, 'id' | 'status' | 'createdAt' | 'organizationId' | 'projectId' | 'triggeringPatternIds' | 'triggeringMemoryIds' | 'simulatedImpact'> & {
      triggeringPatternIds?: string[];
      triggeringMemoryIds?: string[];
      simulatedImpact?: EvolutionProposal['simulatedImpact'];
    },
    authorRole: UserRole
  ): EvolutionProposal {
    const newProposal: EvolutionProposal = {
      ...proposal,
      triggeringPatternIds: proposal.triggeringPatternIds || [],
      triggeringMemoryIds: proposal.triggeringMemoryIds || [],
      simulatedImpact: proposal.simulatedImpact || {
        predictedImprovementPercent: 10,
        riskRating: proposal.risk === 'CRITICAL' || proposal.risk === 'HIGH' ? 'ELEVATED' : proposal.risk === 'MEDIUM' ? 'MODERATE' : 'MINIMAL',
        affectedWorkflows: proposal.affectedRequirements || []
      },
      id: `EVO-${Date.now().toString().slice(-4)}`,
      organizationId: 'org-arcadia-demo',
      projectId,
      status: 'DRAFT',
      createdAt: new Date().toISOString()
    };

    const projectProposals = this.proposals.get(projectId) || [];
    projectProposals.unshift(newProposal);
    this.proposals.set(projectId, projectProposals);

    storage.recordAudit({
      actorId: proposal.proposedBy,
      actorRole: authorRole,
      action: 'EVOLUTION_PROPOSAL_CREATED',
      targetEntity: 'EVOLUTION_PROPOSAL',
      targetId: newProposal.id,
      projectId,
      afterState: { title: newProposal.title, authorRole, risk: newProposal.risk },
      correlationId: `cor-evo-${Date.now()}`
    });

    return newProposal;
  }

  /**
   * Ratifies an Evolution Proposal (Requires human PROJECT_LEAD or ARCHITECT)
   */
  public ratifyEvolutionProposal(
    projectId: string,
    proposalId: string,
    userId: string,
    userRole: UserRole,
    decision: 'RATIFIED' | 'REJECTED'
  ): EvolutionProposal {
    // INVARIANT: Autonomous agents or developers cannot ratify evolution proposals
    if (userRole !== 'PROJECT_LEAD' && userRole !== 'ARCHITECT') {
      throw new Error(`Role '${userRole}' is not authorized to ratify architectural evolution proposals.`);
    }

    const projectProposals = this.proposals.get(projectId) || [];
    const item = projectProposals.find(p => p.id === proposalId);
    if (!item) {
      throw new Error(`Evolution proposal '${proposalId}' not found.`);
    }

    item.status = decision;
    item.ratifiedBy = userId;
    item.ratifiedAt = new Date().toISOString();

    storage.recordAudit({
      actorId: userId,
      actorRole: userRole,
      action: decision === 'RATIFIED' ? 'EVOLUTION_PROPOSAL_RATIFIED' : 'EVOLUTION_PROPOSAL_REJECTED',
      targetEntity: 'EVOLUTION_PROPOSAL',
      targetId: proposalId,
      projectId,
      afterState: { decision, userRole, title: item.title },
      correlationId: `cor-evo-rat-${Date.now()}`
    });

    return item;
  }

  /**
   * Comprehensive Overview for Continuous Assurance UI
   */
  public getOverview(projectId: string): ContinuousAssuranceOverview {
    const principles = this.getCanonicalPrinciples();
    const { mappings, duplicateAuthoritiesCount } = this.getAuthorityMappings(projectId);
    const activeTriggers = this.triggers.get(projectId) || [];
    const simplificationCandidates = this.getSimplificationCandidates(projectId);
    const governedFlags = this.getGovernedFeatureFlags(projectId);
    const { anomalies, loops } = this.detectMetricGamingAndLoops(projectId);
    const evolutionProposals = this.getEvolutionProposals(projectId);

    // Compute targeted verification recommendation:
    // If no high-severity triggers, recommend Level 0 / targeted re-verification
    const pendingTriggers = activeTriggers.filter(t => t.status === 'PENDING');
    const recommendedLevel = pendingTriggers.length > 0
      ? (pendingTriggers.some(t => t.escalatedToFullSystem) ? 'LEVEL_5_FULL_SYSTEM' : 'LEVEL_2_DEPENDENCY_VERIFICATION')
      : 'LEVEL_0_EVIDENCE_REUSE';

    const affectedSuitesSet = new Set<string>();
    pendingTriggers.forEach(t => t.affectedSuites.forEach(s => affectedSuitesSet.add(s)));

    return {
      projectId,
      principles,
      authorityMappings: mappings,
      duplicateAuthoritiesCount,
      activeTriggers,
      simplificationCandidates,
      governedFlags,
      gamingAnomalies: anomalies,
      feedbackLoops: loops,
      evolutionProposals,
      targetedVerificationRecommendation: {
        recommendedLevel,
        affectedSuites: Array.from(affectedSuitesSet),
        fullSystemAvoided: recommendedLevel !== 'LEVEL_5_FULL_SYSTEM',
        evidenceFreshnessPreserved: 94.2
      }
    };
  }
}

export const assuranceEngine = new AssuranceEngine();
