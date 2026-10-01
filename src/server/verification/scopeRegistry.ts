import {
  VerificationScopeItem,
  VerificationLevel,
  ChangeImpactAssessment
} from '../../types/index.ts';

export class ScopeRegistry {
  private scopeItems: Map<string, VerificationScopeItem> = new Map();

  constructor() {
    this.seedRegistry();
  }

  private seedRegistry() {
    const defaultItems: VerificationScopeItem[] = [
      {
        verificationId: 'VR-AUTH-001',
        systemArea: 'Authority & Constitution',
        governingContract: 'Supreme Constitution Invariant Contract v1.0',
        authoritativeSource: 'src/types/index.ts:ProjectConstitution',
        implementationLocation: 'src/server/storage.ts',
        existingTestReferences: ['src/tests/foundation.test.ts:Constitution Invariants'],
        existingValidationEvidence: 'All constitutional amendments strictly require human PROJECT_LEAD or ARCHITECT sign-off. Prompts cannot override constitution.',
        lastVerifiedVersion: 'v10.0.0',
        currentImplementationVersion: 'v11.0.0',
        evidenceFreshness: 'VALID_REUSABLE',
        verificationStatus: 'VERIFIED',
        knownFailures: [],
        dependencies: [],
        requiredReverificationTriggers: [
          'Project Constitution modified',
          'Constitutional invariant schema updated',
          'RBAC matrix modified'
        ]
      },
      {
        verificationId: 'VR-RBAC-001',
        systemArea: 'Tenant & Role Access Control',
        governingContract: 'Multi-Tenant RBAC Matrix Contract',
        authoritativeSource: 'src/server/storage.ts:ROLE_PERMISSIONS',
        implementationLocation: 'src/server/auth.ts',
        existingTestReferences: [
          'src/tests/foundation.test.ts:RBAC Guardrails',
          'src/tests/optimization.test.ts:Adversarial 1'
        ],
        existingValidationEvidence: 'Cross-tenant data queries strictly blocked and audited. Least-privilege role matrix active.',
        lastVerifiedVersion: 'v10.0.0',
        currentImplementationVersion: 'v11.0.0',
        evidenceFreshness: 'VALID_REUSABLE',
        verificationStatus: 'VERIFIED',
        knownFailures: [],
        dependencies: ['VR-AUTH-001'],
        requiredReverificationTriggers: [
          'ROLE_PERMISSIONS modified',
          'Auth middleware modified',
          'New role or tenant endpoint added'
        ]
      },
      {
        verificationId: 'VR-TASK-001',
        systemArea: 'Task Specification & Lifecycle',
        governingContract: 'Universal Task Specification Contract v2.0',
        authoritativeSource: 'src/types/index.ts:UniversalTaskSpecification',
        implementationLocation: 'src/server/storage.ts',
        existingTestReferences: ['src/tests/execution.test.ts:Task Lifecycle Invariants'],
        existingValidationEvidence: 'Immutable state transition machine: DRAFT -> READY -> ASSIGNED -> RUNNING -> VALIDATING -> PASSED.',
        lastVerifiedVersion: 'v10.0.0',
        currentImplementationVersion: 'v11.0.0',
        evidenceFreshness: 'VALID_REUSABLE',
        verificationStatus: 'VERIFIED',
        knownFailures: [],
        dependencies: ['VR-AUTH-001', 'VR-RBAC-001'],
        requiredReverificationTriggers: [
          'TaskState enum changed',
          'Task transition rule modified'
        ]
      },
      {
        verificationId: 'VR-EXEC-001',
        systemArea: 'Autonomous Agent Execution',
        governingContract: 'Sandboxed Agent Execution Contract',
        authoritativeSource: 'src/server/execution/agentRuntime.ts',
        implementationLocation: 'src/server/execution/',
        existingTestReferences: ['src/tests/execution.test.ts:Execution Sandboxing & Gate 1-3'],
        existingValidationEvidence: 'Strict boundary check: filesystem access restricted to assigned scope paths. Out-of-scope writes blocked.',
        lastVerifiedVersion: 'v10.0.0',
        currentImplementationVersion: 'v11.0.0',
        evidenceFreshness: 'VALID_REUSABLE',
        verificationStatus: 'VERIFIED',
        knownFailures: [],
        dependencies: ['VR-TASK-001'],
        requiredReverificationTriggers: [
          'Execution engine sandbox changed',
          'Tool execution policy altered'
        ]
      },
      {
        verificationId: 'VR-COLLAB-001',
        systemArea: 'Multi-Agent Collaboration',
        governingContract: 'Agent Collaboration & Consensus Contract',
        authoritativeSource: 'src/types/index.ts:AgentCollaborationSession',
        implementationLocation: 'src/server/execution/collaborationEngine.ts',
        existingTestReferences: ['src/tests/collaboration.test.ts:Phase 6 Multi-Agent Collaboration'],
        existingValidationEvidence: 'Consensus does not bypass human authority. Bounded rounds (max 5) prevent infinite collaborative loops.',
        lastVerifiedVersion: 'v10.0.0',
        currentImplementationVersion: 'v11.0.0',
        evidenceFreshness: 'VALID_REUSABLE',
        verificationStatus: 'VERIFIED',
        knownFailures: [],
        dependencies: ['VR-EXEC-001'],
        requiredReverificationTriggers: [
          'Collaboration routing altered',
          'Consensus algorithm modified'
        ]
      },
      {
        verificationId: 'VR-VAL-001',
        systemArea: 'Validation & Quality Gates',
        governingContract: 'Validation Contract & 7-Gate Lifecycle',
        authoritativeSource: 'src/types/index.ts:ValidationContract',
        implementationLocation: 'src/server/validation/contractEngine.ts',
        existingTestReferences: ['src/tests/validation.test.ts:Phase 7 Validation Pipeline'],
        existingValidationEvidence: 'Gates 4-7 independently enforce lint, test pass, security AST, and architectural contract compliance. Zero silent passes.',
        lastVerifiedVersion: 'v10.0.0',
        currentImplementationVersion: 'v11.0.0',
        evidenceFreshness: 'VALID_REUSABLE',
        verificationStatus: 'VERIFIED',
        knownFailures: [],
        dependencies: ['VR-EXEC-001'],
        requiredReverificationTriggers: [
          'Validation contract schema changed',
          'Gate logic modified'
        ]
      },
      {
        verificationId: 'VR-DRIFT-001',
        systemArea: 'System Drift Detection',
        governingContract: 'Multi-Dimensional Drift Intelligence Contract',
        authoritativeSource: 'src/types/index.ts:DriftDetectionReport',
        implementationLocation: 'src/server/validation/driftEngine.ts',
        existingTestReferences: ['src/tests/validation.test.ts:Drift Detection Suite'],
        existingValidationEvidence: 'Continuous comparison between intended requirements and observed artifacts. Drift classified into Schema, Logic, and Security.',
        lastVerifiedVersion: 'v10.0.0',
        currentImplementationVersion: 'v11.0.0',
        evidenceFreshness: 'VALID_REUSABLE',
        verificationStatus: 'VERIFIED',
        knownFailures: [],
        dependencies: ['VR-VAL-001'],
        requiredReverificationTriggers: ['Drift rules or thresholds updated']
      },
      {
        verificationId: 'VR-OPT-001',
        systemArea: 'Optimization Intelligence',
        governingContract: 'Evidence-Based Optimization Contract',
        authoritativeSource: 'src/types/index.ts:OptimizationRecommendation',
        implementationLocation: 'src/server/optimization/optimizationEngine.ts',
        existingTestReferences: ['src/tests/optimization.test.ts:Phase 8 Optimization Intelligence'],
        existingValidationEvidence: 'Cost/temporal optimizations strictly cannot bypass security controls or disable mandatory validation gates.',
        lastVerifiedVersion: 'v10.0.0',
        currentImplementationVersion: 'v11.0.0',
        evidenceFreshness: 'VALID_REUSABLE',
        verificationStatus: 'VERIFIED',
        knownFailures: [],
        dependencies: ['VR-VAL-001'],
        requiredReverificationTriggers: [
          'Optimization policy modified',
          'Trust profile algorithm adjusted'
        ]
      },
      {
        verificationId: 'VR-LEARN-001',
        systemArea: 'Organizational Memory & Anti-Poisoning',
        governingContract: 'Organizational Memory Governance Contract',
        authoritativeSource: 'src/types/index.ts:OrganizationalMemory',
        implementationLocation: 'src/server/learning/memoryEngine.ts',
        existingTestReferences: ['src/tests/learning.test.ts:Adversarial 1 Memory Poisoning'],
        existingValidationEvidence: 'Untrusted advice clamped to PROPOSED. Unverified memories strictly excluded from context injection. Human-in-the-loop verification required.',
        lastVerifiedVersion: 'v10.0.0',
        currentImplementationVersion: 'v11.0.0',
        evidenceFreshness: 'VALID_REUSABLE',
        verificationStatus: 'VERIFIED',
        knownFailures: [],
        dependencies: ['VR-AUTH-001'],
        requiredReverificationTriggers: [
          'Memory schema altered',
          'Context injection filter modified'
        ]
      },
      {
        verificationId: 'VR-EVOLVE-001',
        systemArea: 'Continuous Evolution & Rollback',
        governingContract: 'Evolutionary Synthesis & Reversible Rollback Contract',
        authoritativeSource: 'src/types/index.ts:EvolutionProposal',
        implementationLocation: 'src/server/learning/evolutionEngine.ts',
        existingTestReferences: ['src/tests/learning.test.ts:Adversarial 5 Anti-Degradation Rollback'],
        existingValidationEvidence: '100% of approved/applied evolutionary proposals declare verified reversible rollback mechanisms. Supreme Constitution cannot be weakened.',
        lastVerifiedVersion: 'v10.0.0',
        currentImplementationVersion: 'v11.0.0',
        evidenceFreshness: 'VALID_REUSABLE',
        verificationStatus: 'VERIFIED',
        knownFailures: [],
        dependencies: ['VR-AUTH-001', 'VR-LEARN-001'],
        requiredReverificationTriggers: [
          'Evolution proposal schema changed',
          'Rollback mechanism modified'
        ]
      },
      {
        verificationId: 'VR-RESIL-001',
        systemArea: 'Resilience & Circuit Breakers',
        governingContract: 'Cascading Failure Protection & Circuit Breaker Contract',
        authoritativeSource: 'src/types/index.ts:CircuitBreakerState',
        implementationLocation: 'src/server/resilience/circuitBreakerEngine.ts',
        existingTestReferences: ['src/tests/resilience.test.ts:Circuit Breaker Suite'],
        existingValidationEvidence: 'Threshold trip to OPEN after 5 failures. Fast fallback prevents cascading thread exhaustion. Lead role required for reset.',
        lastVerifiedVersion: 'v10.0.0',
        currentImplementationVersion: 'v11.0.0',
        evidenceFreshness: 'VALID_REUSABLE',
        verificationStatus: 'VERIFIED',
        knownFailures: [],
        dependencies: ['VR-EXEC-001'],
        requiredReverificationTriggers: [
          'Breaker threshold adjusted',
          'Fallback routing modified'
        ]
      },
      {
        verificationId: 'VR-DR-001',
        systemArea: 'Disaster Recovery & Restore Drills',
        governingContract: 'Disaster Recovery & Point-in-Time Restore Contract',
        authoritativeSource: 'src/types/index.ts:BackupRecord',
        implementationLocation: 'src/server/resilience/disasterRecoveryEngine.ts',
        existingTestReferences: ['src/tests/resilience.test.ts:Disaster Recovery Suite'],
        existingValidationEvidence: 'Immutable backup snapshot with SHA-256 integrity hash. Automated restore drill verified in < 50ms (RTO < 5m, RPO < 1m).',
        lastVerifiedVersion: 'v10.0.0',
        currentImplementationVersion: 'v11.0.0',
        evidenceFreshness: 'VALID_REUSABLE',
        verificationStatus: 'VERIFIED',
        knownFailures: [],
        dependencies: ['VR-AUTH-001'],
        requiredReverificationTriggers: [
          'Backup snapshot schema changed',
          'Restore logic modified'
        ]
      },
      {
        verificationId: 'VR-GATE-001',
        systemArea: 'Production Release Governance',
        governingContract: '8-Point Deployment Release Gate Contract',
        authoritativeSource: 'src/types/index.ts:DeploymentRecord',
        implementationLocation: 'src/server/resilience/deploymentGovernanceEngine.ts',
        existingTestReferences: ['src/tests/resilience.test.ts:Adversarial 1 & 2 Deployment'],
        existingValidationEvidence: 'Production deployment blocked if unresolved critical security findings exist. Developer self-approval strictly rejected.',
        lastVerifiedVersion: 'v10.0.0',
        currentImplementationVersion: 'v11.0.0',
        evidenceFreshness: 'VALID_REUSABLE',
        verificationStatus: 'VERIFIED',
        knownFailures: [],
        dependencies: ['VR-VAL-001', 'VR-RBAC-001'],
        requiredReverificationTriggers: [
          'Deployment gate criteria modified',
          'Rollback mechanism modified'
        ]
      },
      {
        verificationId: 'VR-TRACE-001',
        systemArea: 'End-to-End Traceability',
        governingContract: '13-Question Provenance & Traceability Contract',
        authoritativeSource: 'src/types/index.ts:TraceabilityChain',
        implementationLocation: 'src/server/verification/traceabilityEngine.ts',
        existingTestReferences: ['src/tests/integration.test.ts:Traceability Chain Verification'],
        existingValidationEvidence: 'Full backwards provenance chain: Requirement -> Decision -> Task -> Context -> Prompt -> Execution -> Artifact -> Validation -> Deployment.',
        lastVerifiedVersion: 'v10.0.0',
        currentImplementationVersion: 'v11.0.0',
        evidenceFreshness: 'FRESH',
        verificationStatus: 'VERIFIED',
        knownFailures: [],
        dependencies: ['VR-AUTH-001', 'VR-TASK-001', 'VR-EXEC-001', 'VR-VAL-001'],
        requiredReverificationTriggers: [
          'Relational foreign key modified',
          'Artifact metadata schema altered'
        ]
      },
      {
        verificationId: 'VR-AISAFE-001',
        systemArea: 'AI Safety & Adversarial Defenses',
        governingContract: 'AI Safety, Anti-Injection & Boundary Contract',
        authoritativeSource: 'src/server/execution/agentRuntime.ts',
        implementationLocation: 'src/server/execution/',
        existingTestReferences: ['src/tests/integration.test.ts:AI Safety Suite'],
        existingValidationEvidence: 'Strict detection and neutralization of prompt injection, context poisoning, tool abuse, and collusion attempts.',
        lastVerifiedVersion: 'v10.0.0',
        currentImplementationVersion: 'v11.0.0',
        evidenceFreshness: 'FRESH',
        verificationStatus: 'VERIFIED',
        knownFailures: [],
        dependencies: ['VR-EXEC-001', 'VR-LEARN-001'],
        requiredReverificationTriggers: [
          'Prompt template updated',
          'Agent toolset expanded'
        ]
      },
      {
        verificationId: 'VR-INTEG-001',
        systemArea: 'Data Integrity & Concurrency',
        governingContract: 'Relational Integrity & Optimistic Concurrency Contract',
        authoritativeSource: 'src/server/resilience/dataIntegrityEngine.ts',
        implementationLocation: 'src/server/resilience/dataIntegrityEngine.ts',
        existingTestReferences: ['src/tests/resilience.test.ts:Data Integrity 6-Point Audit'],
        existingValidationEvidence: 'Zero relational foreign-key anomalies. Stale client writes rejected via optimistic concurrency guard.',
        lastVerifiedVersion: 'v10.0.0',
        currentImplementationVersion: 'v11.0.0',
        evidenceFreshness: 'VALID_REUSABLE',
        verificationStatus: 'VERIFIED',
        knownFailures: [],
        dependencies: ['VR-AUTH-001'],
        requiredReverificationTriggers: [
          'Storage schema updated',
          'Concurrency versioning altered'
        ]
      }
    ];

    defaultItems.forEach(item => this.scopeItems.set(item.verificationId, item));
  }

  public getAllScopeItems(): VerificationScopeItem[] {
    return Array.from(this.scopeItems.values());
  }

  public getScopeItem(id: string): VerificationScopeItem | undefined {
    return this.scopeItems.get(id);
  }

  public updateScopeItem(id: string, updates: Partial<VerificationScopeItem>): void {
    const existing = this.scopeItems.get(id);
    if (existing) {
      this.scopeItems.set(id, { ...existing, ...updates });
    }
  }

  /**
   * Change-Aware Verification Level Evaluation (Section 4)
   * Determines minimal sufficient verification level:
   * Level 0: Evidence Reuse
   * Level 1: Targeted Verification
   * Level 2: Dependency Verification
   * Level 3: Integration Verification
   * Level 4: End-to-End Verification
   * Level 5: Full-System Reverification
   */
  public evaluateVerificationLevel(changedArtifacts: string[]): ChangeImpactAssessment {
    if (!changedArtifacts || changedArtifacts.length === 0) {
      return {
        changedArtifacts: [],
        recommendedLevel: 0,
        levelName: 'LEVEL 0 — Evidence Reuse',
        rationale: 'No artifacts changed. Existing valid evidence proves all requirements.',
        affectedContracts: [],
        affectedModules: [],
        affectedTests: [],
        affectedValidationRules: [],
        requiredVerificationSet: []
      };
    }

    const hasCoreSecurityOrConstitution = changedArtifacts.some(
      f => f.includes('constitution') || f.includes('auth.ts') || f.includes('ROLE_PERMISSIONS')
    );
    const hasStorageOrDatabase = changedArtifacts.some(f => f.includes('storage.ts') || f.includes('db/'));
    const hasExecutionOrAgent = changedArtifacts.some(f => f.includes('execution/') || f.includes('agent'));
    const hasValidationOrGates = changedArtifacts.some(f => f.includes('validation/') || f.includes('gates'));
    const hasResilienceOrDR = changedArtifacts.some(f => f.includes('resilience/'));

    let level: VerificationLevel = 1;
    let levelName = 'LEVEL 1 — Targeted Verification';
    let rationale = 'Only directly changed files, tests, contracts, or dependencies are inspected.';
    const affectedContracts: string[] = [];
    const affectedModules: string[] = [];
    const affectedTests: string[] = [];
    const affectedRules: string[] = [];
    const requiredSet: string[] = [];

    if (hasCoreSecurityOrConstitution) {
      level = 5;
      levelName = 'LEVEL 5 — Full-System Reverification';
      rationale = 'Changes affect foundational architecture, security boundaries, or constitutional authority.';
      affectedContracts.push('Supreme Constitution Invariant Contract', 'RBAC Matrix Contract');
      affectedModules.push('src/server/storage.ts', 'src/server/auth.ts');
      affectedTests.push('src/tests/foundation.test.ts', 'src/tests/integration.test.ts');
      affectedRules.push('RULE-CONST-01', 'RULE-SEC-01');
      requiredSet.push('VR-AUTH-001', 'VR-RBAC-001', 'VR-GATE-001', 'VR-AISAFE-001');
    } else if (hasStorageOrDatabase && hasExecutionOrAgent) {
      level = 4;
      levelName = 'LEVEL 4 — End-to-End Verification';
      rationale = 'Multiple core runtime interacting modules changed across storage and execution layers.';
      affectedContracts.push('Universal Task Specification Contract', 'Execution Contract');
      affectedModules.push('src/server/storage.ts', 'src/server/execution/');
      affectedTests.push('src/tests/execution.test.ts', 'src/tests/integration.test.ts');
      affectedRules.push('RULE-TASK-01', 'RULE-EXEC-01');
      requiredSet.push('VR-TASK-001', 'VR-EXEC-001', 'VR-TRACE-001');
    } else if (hasValidationOrGates || hasResilienceOrDR) {
      level = 3;
      levelName = 'LEVEL 3 — Integration Verification';
      rationale = 'Interacting governance, validation, or resilience modules tested together.';
      affectedContracts.push('Validation Contract', 'Release Gate Contract');
      affectedModules.push('src/server/validation/', 'src/server/resilience/');
      affectedTests.push('src/tests/validation.test.ts', 'src/tests/resilience.test.ts');
      affectedRules.push('RULE-VAL-01', 'RULE-GATE-01');
      requiredSet.push('VR-VAL-001', 'VR-RESIL-001', 'VR-GATE-001');
    } else if (hasExecutionOrAgent) {
      level = 2;
      levelName = 'LEVEL 2 — Dependency Verification';
      rationale = 'Directly affected execution modules and their contracts verified.';
      affectedContracts.push('Sandboxed Agent Execution Contract');
      affectedModules.push('src/server/execution/');
      affectedTests.push('src/tests/execution.test.ts');
      affectedRules.push('RULE-SANDBOX-01');
      requiredSet.push('VR-EXEC-001');
    } else {
      level = 1;
      levelName = 'LEVEL 1 — Targeted Verification';
      rationale = 'Targeted single-artifact modification verified in isolation.';
      affectedContracts.push('Local Component Contract');
      affectedModules.push(changedArtifacts[0]);
      affectedTests.push('Targeted Unit Verification');
      affectedRules.push('RULE-LOCAL-01');
      requiredSet.push('VR-TASK-001');
    }

    return {
      changedArtifacts,
      recommendedLevel: level,
      levelName,
      rationale,
      affectedContracts,
      affectedModules,
      affectedTests,
      affectedValidationRules: affectedRules,
      requiredVerificationSet: requiredSet
    };
  }
}

export const scopeRegistry = new ScopeRegistry();
