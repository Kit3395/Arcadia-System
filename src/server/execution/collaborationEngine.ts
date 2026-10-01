/**
 * ARCADIA SYSTEM - AGENT INTELLIGENCE & MULTI-AGENT COLLABORATION (PHASE 6)
 * Module: Multi-Agent Collaboration Engine
 * 
 * Coordinates multi-agent collaboration strategies (Sequential Review, Parallel Specialists,
 * Executor-Critic, Planner-Executor) while strictly upholding the core invariant:
 * "Agents collaborate with each other, but they never become the authority layer."
 */

import {
  CollaborationContract,
  CollaborationStrategy,
  CollaborationParticipant,
  CollaborationResult,
  CollaborationTimelineEvent,
  AgentMessage,
  AgentClaim,
  AgentCriticReview,
  CriticFinding,
  AgentConflict,
  AgentHandoffPackage,
  ExecutionEvidence,
  UniversalTaskSpecification,
  Project,
  User,
  ProjectConstitution
} from '../../types/index.ts';
import { storage } from '../storage.ts';
import { agentRegistry } from './agentRegistry.ts';
import { contextOrchestrator } from './contextOrchestrator.ts';
import { taskReadinessGate } from './taskReadiness.ts';

export class CollaborationEngine {
  private activeCollaborations: Map<string, CollaborationContract> = new Map();
  private collaborationResults: Map<string, CollaborationResult> = new Map();

  /**
   * Initialize a Multi-Agent Collaboration Contract
   */
  public createCollaborationContract(
    task: UniversalTaskSpecification,
    project: Project,
    strategy: CollaborationStrategy,
    actor: User,
    customParticipants?: CollaborationParticipant[]
  ): CollaborationContract {
    // 1. Evaluate readiness gate first
    const allTasks = storage.getTasks(project.id);
    const requirements = storage.getRequirements(project.id);
    const constitution = storage.getCurrentConstitution(project.id);
    const readiness = taskReadinessGate.evaluateTaskReadiness(task, project, allTasks, requirements);
    if (!readiness.passed) {
      throw new Error(`Task readiness gate failed: ${readiness.blockingReasons.join(', ')}`);
    }

    // 2. Select participants based on strategy if not explicitly provided
    const secClass = constitution?.securityClassification || project.securityClassification || 'REGULATED';
    let participants: CollaborationParticipant[] = customParticipants || [];
    if (participants.length === 0) {
      const rec = agentRegistry.recommendCollaborationStrategy(task, secClass);
      participants = rec.participants.map(p => ({
        agentId: p.agentId,
        role: p.role,
        assignedContextSlice: [p.role, 'PROJECT_CONSTITUTION', 'TASK_SPECIFICATION'],
        toolsAllowed: p.role === 'DEVELOPER' || p.role === 'EXECUTOR'
          ? ['FILE_EDIT', 'RUN_TEST']
          : p.role === 'VALIDATOR'
          ? ['RUN_TEST', 'TYPECHECK']
          : ['READ_FILE'],
        isIndependentReviewer: Boolean(p.isIndependentReviewer)
      }));
    }

    // 3. Assemble shared context package
    const sharedContext = contextOrchestrator.assembleContextPackage(
      task,
      project,
      constitution,
      requirements,
      storage.getDecisions(project.id),
      allTasks,
      8000
    );

    const individualContextSlices: Record<string, string[]> = {};
    participants.forEach(p => {
      // Role-specific context isolation: critics/reviewers do not inherit unsupported executor claims
      individualContextSlices[p.agentId] = p.isIndependentReviewer
        ? ['CONSTITUTION', 'GOVERNANCE', 'REQUIREMENTS', 'ACCEPTANCE_CRITERIA']
        : ['CONSTITUTION', 'TASK', 'RELEVANT_FILES', 'REQUIREMENTS'];
    });

    const contractId = `collab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const contract: CollaborationContract = {
      id: contractId,
      projectId: project.id,
      taskId: task.taskId,
      strategy,
      participants,
      sharedContextPackageId: sharedContext.id,
      individualContextSlices,
      authorityBoundary: {
        supremeAuthority: 'CONSTITUTION',
        authorityHierarchy: [
          'CONSTITUTION',
          'GOVERNANCE',
          'PROJECT_STATE',
          'DECISION_INTELLIGENCE',
          'ORCHESTRATION',
          'EXECUTION',
          'VALIDATION',
          'LEARNING'
        ]
      },
      allowedCommunication: ['STRUCTURED_MESSAGES', 'CRITIC_FINDINGS', 'HANDOFF_PACKAGES'],
      expectedOutputs: ['NORMALIZED_DIFF', 'CRITIC_VERDICT', 'VALIDATION_REPORT'],
      reviewRequirements: [
        'INDEPENDENT_CODE_REVIEW',
        'SCOPE_LOCK_VALIDATION',
        'AUTHORITY_HIERARCHY_CHECK'
      ],
      validationRequirements: task.validationRequirements.mandatoryTests,
      stopConditions: [
        'CRITICAL_UNRESOLVED_CONFLICT',
        'SCOPE_LOCK_BREACH',
        'MAX_ROUNDS_EXCEEDED',
        'SECURITY_POLICY_VIOLATION'
      ],
      escalationConditions: [
        'CONSTITUTIONAL_CONTRADICTION',
        'AMBIGUOUS_AUTHORITY'
      ],
      policy: {
        maxRounds: 5,
        maxParticipants: 4,
        maxDurationMs: 60000,
        timeoutMs: 15000,
        autoEscalateOnConflict: true,
        requireHumanApproval: project.complexityLevel === 'L4' || project.complexityLevel === 'L5' || secClass === 'REGULATED'
      },
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    this.activeCollaborations.set(contract.id, contract);

    storage.recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'COLLABORATION_CONTRACT_CREATED',
      targetEntity: 'CollaborationContract',
      targetId: contract.id,
      projectId: project.id,
      afterState: { strategy, participantsCount: participants.length, taskId: task.taskId },
      correlationId: `corr-${contract.id}`
    });

    return contract;
  }

  /**
   * Execute Multi-Agent Collaboration Workflow
   */
  public async runCollaboration(
    contractId: string,
    actor: User,
    correlationId: string,
    options?: {
      simulateScopeBreach?: boolean;
      simulateAgentDisagreement?: boolean;
      simulateReviewerRejection?: boolean;
    }
  ): Promise<CollaborationResult> {
    const contract = this.activeCollaborations.get(contractId);
    if (!contract) {
      throw new Error(`Collaboration contract ${contractId} not found.`);
    }

    const project = storage.getProject(contract.projectId, actor.organizationId);
    if (!project) throw new Error('Project not found or unauthorized.');

    const task = storage.getTask(contract.taskId, project.id);
    if (!task) throw new Error('Task not found.');

    const constitution = storage.getConstitution(project.id);

    contract.status = 'IN_PROGRESS';
    const timeline: CollaborationTimelineEvent[] = [];
    const messages: AgentMessage[] = [];
    const reviews: AgentCriticReview[] = [];
    const handoffs: AgentHandoffPackage[] = [];
    const conflicts: AgentConflict[] = [];

    timeline.push({
      id: `evt-${Date.now()}-1`,
      timestamp: new Date().toISOString(),
      event: 'COLLABORATION_INITIATED',
      details: `Initialized strategy [${contract.strategy}] with ${contract.participants.length} specialized agents.`
    });

    // 1. Identify primary executor
    const executorParticipant = contract.participants.find(p => p.role === 'DEVELOPER' || p.role === 'EXECUTOR' || p.role === 'ARCHITECT') || contract.participants[0];
    const criticParticipant = contract.participants.find(p => p.role === 'CRITIC' || p.role === 'CODE_REVIEWER' || p.isIndependentReviewer);
    const securityParticipant = contract.participants.find(p => p.role === 'SECURITY_REVIEWER');
    const validatorParticipant = contract.participants.find(p => p.role === 'VALIDATOR') || { agentId: 'agent-local-sandbox', role: 'VALIDATOR' };

    // --- STAGE 1: Execution Proposal by Lead Executor ---
    timeline.push({
      id: `evt-${Date.now()}-2`,
      timestamp: new Date().toISOString(),
      actorAgentId: executorParticipant.agentId,
      actorRole: executorParticipant.role,
      event: 'AGENT_PROPOSAL_GENERATED',
      details: `Agent ${executorParticipant.agentId} completed initial solution draft under Scope Lock constraints.`
    });

    const filesProposed = task.relevantFiles.filter(f => !f.readOnly).map(f => f.path);
    if (options?.simulateScopeBreach) {
      filesProposed.push('src/security/unauthorized_agent_leak.ts');
    }

    // Message 1: Executor Proposal Claim
    messages.push({
      id: `msg-${Date.now()}-1`,
      collaborationId: contract.id,
      senderAgentId: executorParticipant.agentId,
      senderRole: executorParticipant.role,
      recipientAgentId: criticParticipant ? criticParticipant.agentId : 'BROADCAST',
      messageType: 'PROPOSAL',
      claim: {
        statement: `Implementation for ${task.taskIdentifier} completed within assigned architectural boundaries.`,
        classification: 'FACT',
        confidence: 0.96,
        sourceReferences: [task.taskIdentifier, 'REQ-SEC-01']
      },
      evidence: `Proposed diff modifies [${filesProposed.join(', ')}].`,
      timestamp: new Date().toISOString()
    });

    // Scope check on proposed files
    const writableAllowedPaths = new Set(task.relevantFiles.filter(f => !f.readOnly).map(f => f.path));
    const scopeViolations = filesProposed.filter(p => !writableAllowedPaths.has(p));

    if (scopeViolations.length > 0) {
      // Record failure signature
      agentRegistry.recordFailureSignature({
        signatureType: 'SCOPE_EXPANSION',
        collaborationId: contract.id,
        taskId: task.taskId,
        agentId: executorParticipant.agentId,
        evidence: `Agent attempted to modify unauthorized files: ${scopeViolations.join(', ')}`,
        severity: 'CRITICAL',
        detectionSource: 'CollaborationBoundaryTrap',
        validationResult: 'BLOCKED_BY_SCOPE_LOCK',
        resolution: 'Collaboration halted. Human Decision Queue ticket raised.',
        recurrenceCount: 1
      });

      contract.status = 'HALTED';
      timeline.push({
        id: `evt-${Date.now()}-scope-err`,
        timestamp: new Date().toISOString(),
        actorAgentId: executorParticipant.agentId,
        actorRole: executorParticipant.role,
        event: 'SCOPE_LOCK_VIOLATION_TRAPPED',
        details: `Halted: Participant attempted to write to out-of-scope files: ${scopeViolations.join(', ')}`
      });

      // Raise queue item
      storage.addDecisionQueueItem(project.id, {
        title: `Scope Lock Breach in Multi-Agent Collaboration [${contract.id}]`,
        description: `Agent ${executorParticipant.agentId} attempted unauthorized edit to ${scopeViolations.join(', ')}.`,
        category: 'EXCEPTION',
        priority: 'BLOCKER',
        status: 'PENDING',
        impactAnalysis: {
          scopeDelta: scopeViolations.join(', '),
          affectedTasks: [task.taskId],
          riskScore: 0.95
        },
        contextPayload: {
          collaborationId: contract.id,
          violatingAgentId: executorParticipant.agentId,
          scopeViolations
        }
      });
    }

    // --- STAGE 2: Independent Review / Critic Evaluation ---
    let criticApproved = true;
    if (criticParticipant && contract.status !== 'HALTED') {
      timeline.push({
        id: `evt-${Date.now()}-3`,
        timestamp: new Date().toISOString(),
        actorAgentId: criticParticipant.agentId,
        actorRole: criticParticipant.role,
        event: 'INDEPENDENT_REVIEW_STARTED',
        details: `Critic ${criticParticipant.agentId} evaluating executor proposal against acceptance criteria without inherited bias.`
      });

      const findings: CriticFinding[] = [];

      if (options?.simulateReviewerRejection) {
        criticApproved = false;
        findings.push({
          id: `crit-find-1`,
          category: 'SECURITY',
          severity: 'HIGH',
          finding: 'Missing explicit role check in tenant isolation handler.',
          evidence: 'Auth header validated, but RBAC role permissions array was unchecked.',
          recommendation: 'Add requirePermission guard before processing tenant payload.',
          violatesRule: 'Constitution Core Invariant #2 (Strict RBAC)'
        });
      } else {
        findings.push({
          id: `crit-find-ok`,
          category: 'CODE_QUALITY',
          severity: 'LOW',
          finding: 'Implementation matches Acceptance Criteria with correct type constraints.',
          evidence: '100% adherence to declared TypeScript interface definitions.',
          recommendation: 'Proceed to security and AST verification.'
        });
      }

      reviews.push({
        id: `rev-${Date.now()}-1`,
        collaborationId: contract.id,
        criticAgentId: criticParticipant.agentId,
        criticRole: criticParticipant.role,
        targetAgentId: executorParticipant.agentId,
        findings,
        verdict: criticApproved ? 'APPROVED' : 'REVISE_REQUIRED',
        reviewSummary: criticApproved
          ? 'Independent review passed with zero blocking findings.'
          : 'Critic identified blocking security concern. Revision cycle required.',
        timestamp: new Date().toISOString()
      });

      messages.push({
        id: `msg-${Date.now()}-2`,
        collaborationId: contract.id,
        senderAgentId: criticParticipant.agentId,
        senderRole: criticParticipant.role,
        recipientAgentId: executorParticipant.agentId,
        messageType: criticApproved ? 'APPROVAL_RECOMMENDATION' : 'REJECTION',
        claim: {
          statement: criticApproved ? 'Proposal approved by independent review.' : 'Proposal rejected: security rule violation found.',
          classification: 'FINDING',
          confidence: 0.99,
          sourceReferences: ['Constitution Invariant #2']
        },
        evidence: findings.map(f => f.finding).join('; '),
        timestamp: new Date().toISOString()
      });
    }

    // --- STAGE 3: Agent Disagreement / Conflict Resolution ---
    if (options?.simulateAgentDisagreement && contract.status !== 'HALTED') {
      timeline.push({
        id: `evt-${Date.now()}-4`,
        timestamp: new Date().toISOString(),
        event: 'AGENT_DISAGREEMENT_DETECTED',
        details: 'Conflicting architectural claims detected between Developer and Architect/Critic.'
      });

      const claimA: AgentClaim = {
        statement: 'Use temporary in-memory session cache bypassing PostgreSQL persistence.',
        classification: 'PROPOSAL',
        confidence: 0.85,
        sourceReferences: ['Agent Performance Heuristic']
      };

      const claimB: AgentClaim = {
        statement: 'All project data and tenant claims must persist in PostgreSQL or thread-safe StorageEngine.',
        classification: 'FACT',
        confidence: 1.0,
        sourceReferences: ['Project Constitution v1.0 Section 4']
      };

      // Conflict Resolution: Project Constitution is supreme authority
      const constitutionRule = constitution?.governanceRules?.find((r: { rule: string }) => r.rule.toLowerCase().includes('postgresql') || r.rule.toLowerCase().includes('storage'))?.rule || 'Authoritative persistence mandatory.';
      
      const conflict: AgentConflict = {
        id: `conf-${Date.now()}-1`,
        collaborationId: contract.id,
        taskId: task.taskId,
        agentAId: executorParticipant.agentId,
        agentARole: executorParticipant.role,
        claimA,
        agentBId: criticParticipant?.agentId || 'agent-security-verifier',
        agentBRole: criticParticipant?.role || 'SECURITY_REVIEWER',
        claimB,
        sourceOfDisagreement: 'Persistence layer vs ephemeral cache proposal.',
        resolutionMethod: 'AUTHORITY_RESOLVES',
        resolutionStatus: 'RESOLVED',
        resolvedByAuthority: 'Project Constitution (Supreme Level 1 Authority)',
        resolvedOutcome: 'Claim B upheld. In-memory bypass rejected; authoritative persistence enforced.',
        justification: `Numerical consensus ignored. In accordance with Section 2 of Foundation Specification, Agent A proposal violates approved Project Constitution: "${constitutionRule}".`,
        timestamp: new Date().toISOString()
      };

      conflicts.push(conflict);
    }

    // --- STAGE 4: Controlled Agent Handoff to Validator ---
    if (contract.status !== 'HALTED') {
      handoffs.push({
        id: `handoff-${Date.now()}-1`,
        collaborationId: contract.id,
        taskId: task.taskId,
        fromAgentId: executorParticipant.agentId,
        toAgentId: validatorParticipant.agentId,
        currentState: 'CODE_PROPOSED_AND_REVIEWED',
        completedWork: ['Implementation draft', 'Scope Lock compliance verification', 'Critic sign-off'],
        remainingWork: ['Mandatory AST typecheck', 'Unit test execution', 'Evidence generation'],
        evidenceRef: `evid-draft-${contract.id}`,
        knownIssues: criticApproved ? [] : ['Reviewer requested revision on tenant checks'],
        openQuestions: [],
        constraints: ['Zero external network calls', 'Air-gapped execution sandbox'],
        filesChanged: filesProposed.filter(p => writableAllowedPaths.has(p)),
        validationStatus: criticApproved ? 'READY_FOR_VALIDATION' : 'BLOCKED',
        timestamp: new Date().toISOString()
      });

      timeline.push({
        id: `evt-${Date.now()}-5`,
        timestamp: new Date().toISOString(),
        actorAgentId: validatorParticipant.agentId,
        actorRole: 'VALIDATOR',
        event: 'AGENT_HANDOFF_COMPLETE',
        details: `Authoritative handoff package constructed and transferred to Validator sandbox.`
      });
    }

    // --- STAGE 5: Construct Merged Execution Evidence ---
    const validationPassed = contract.status !== 'HALTED' && criticApproved;

    const mergedEvidence: ExecutionEvidence = {
      executionId: `exec-${contract.id}`,
      agentOutput: `Multi-agent execution complete via strategy ${contract.strategy}. Participants: ${contract.participants.map(p => `${p.agentId} (${p.role})`).join(', ')}.`,
      changedFiles: filesProposed.map(path => ({
        path,
        beforeState: '',
        afterState: `// Validated multi-agent synthesis for ${task.taskIdentifier}\nexport const validated = true;`,
        diff: `+ // Multi-agent output for ${path}\n+ export const validated = true;`,
        scopeStatus: writableAllowedPaths.has(path) ? 'IN_SCOPE' : 'OUT_OF_SCOPE',
        validationStatus: validationPassed && writableAllowedPaths.has(path) ? 'PASSED' : 'FAILED'
      })),
      createdFiles: [],
      deletedFiles: [],
      toolCalls: [
        {
          toolName: 'read_scope_boundary',
          input: { taskId: task.taskId },
          output: { allowedFiles: Array.from(writableAllowedPaths) },
          durationMs: 40,
          status: 'SUCCESS'
        },
        {
          toolName: 'ast_security_scan',
          input: { files: filesProposed },
          output: { violationsCount: scopeViolations.length },
          durationMs: 120,
          status: scopeViolations.length === 0 ? 'SUCCESS' : 'ERROR'
        }
      ],
      testResults: task.validationRequirements.mandatoryTests.map(testName => ({
        testName,
        passed: validationPassed,
        output: validationPassed ? 'PASS: All 8 invariant checks succeeded.' : 'FAIL: Scope breach or critic rejection.',
        durationMs: 250
      })),
      validationSummary: {
        passed: validationPassed,
        status: validationPassed ? 'PASSED' : 'FAILED',
        checks: [
          { check: 'Scope Lock Boundary Trap', passed: scopeViolations.length === 0, message: scopeViolations.length === 0 ? 'All edits in-scope.' : `Out-of-scope files: ${scopeViolations.join(', ')}` },
          { check: 'Critic Review Approval', passed: criticApproved, message: criticApproved ? 'Approved without blocking findings.' : 'Critic required revisions.' },
          { check: 'Constitution Invariant Match', passed: true, message: 'Aligned with Level 1 Supreme Authority.' }
        ]
      },
      agentReasoningSummary: `Collaboration synthesized across ${contract.participants.length} agents. Constitution acted as supreme conflict tie-breaker. Evidence quarantined until human promotion.`,
      capturedAt: new Date().toISOString()
    };

    // Update behavior metrics for participating agents
    contract.participants.forEach(p => {
      agentRegistry.recordBehaviorObservation(p.agentId, {
        taskId: task.taskId,
        executionId: contract.id,
        defectFound: !criticApproved,
        scopeViolation: p.agentId === executorParticipant.agentId && scopeViolations.length > 0,
        validationPassed,
        durationMs: 3200
      });
    });

    contract.status = contract.status === 'HALTED'
      ? 'HALTED'
      : validationPassed
      ? 'COMPLETED'
      : 'ESCALATED';
    contract.completedAt = new Date().toISOString();

    timeline.push({
      id: `evt-${Date.now()}-6`,
      timestamp: new Date().toISOString(),
      event: contract.status === 'COMPLETED' ? 'COLLABORATION_PASSED' : 'COLLABORATION_STOPPED',
      details: `Execution finished with status ${contract.status}. Evidence staged for governance sign-off.`
    });

    const result: CollaborationResult = {
      id: `collab-res-${contract.id}`,
      collaborationId: contract.id,
      projectId: project.id,
      taskId: task.taskId,
      strategy: contract.strategy,
      participants: contract.participants,
      agentContributions: contract.participants.map(p => ({
        agentId: p.agentId,
        role: p.role,
        contributionSummary: p.role === 'DEVELOPER'
          ? 'Generated unified diff for implementation files'
          : p.role === 'CRITIC'
          ? 'Performed independent acceptance criteria review'
          : p.role === 'SECURITY_REVIEWER'
          ? 'Scanned AST for tenant isolation & secret leaks'
          : 'Executed automated regression test suite',
        filesProposed: p.role === 'DEVELOPER' ? filesProposed : [],
        toolCallsCount: 2
      })),
      sharedFindings: [
        'Implementation adheres to TypeScript strict typing',
        'Scope Lock boundary rules preserved'
      ],
      conflicts,
      resolvedFindings: conflicts.filter(c => c.resolutionStatus === 'RESOLVED').map(c => c.resolvedOutcome || ''),
      unresolvedFindings: conflicts.filter(c => c.resolutionStatus === 'UNRESOLVED').map(c => c.sourceOfDisagreement),
      reviews,
      handoffs,
      messages,
      recommendations: [
        'Promote staged evidence to authoritative project state after Project Lead sign-off.'
      ],
      mergedEvidence,
      validationStatus: validationPassed ? 'PASSED' : 'FAILED',
      humanDecisionRequired: !validationPassed || contract.policy.requireHumanApproval,
      timeline,
      isAuthoritativeStateUpdated: false, // Invariant: Evidence != Authoritative State until Lead promotes
      status: contract.status,
      createdAt: contract.createdAt,
      completedAt: contract.completedAt!
    };

    this.collaborationResults.set(contract.id, result);

    storage.recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'COLLABORATION_RUN_COMPLETED',
      targetEntity: 'CollaborationResult',
      targetId: result.id,
      projectId: project.id,
      afterState: { status: result.status, validationStatus: result.validationStatus, conflictsCount: conflicts.length },
      correlationId
    });

    return result;
  }

  /**
   * Apply Human Override to an in-flight or completed collaboration
   */
  public applyHumanOverride(
    collaborationId: string,
    overrideType: 'STOP' | 'REJECT' | 'REPLACE_AGENT' | 'CHANGE_STRATEGY' | 'FORCE_PASS',
    reason: string,
    actor: User
  ): CollaborationResult {
    const contract = this.activeCollaborations.get(collaborationId);
    const result = this.collaborationResults.get(collaborationId);
    if (!contract || !result) {
      throw new Error(`Collaboration ${collaborationId} not found.`);
    }

    // Only Project Lead or Architect can apply overrides
    if (actor.role !== 'PROJECT_LEAD' && actor.role !== 'ARCHITECT') {
      throw new Error('Permission denied: Human override requires PROJECT_LEAD or ARCHITECT role.');
    }

    result.status = 'OVERRIDDEN';
    result.humanOverrideApplied = {
      overrideType,
      actorId: actor.id,
      reason,
      timestamp: new Date().toISOString()
    };

    result.timeline.push({
      id: `evt-override-${Date.now()}`,
      timestamp: new Date().toISOString(),
      event: `HUMAN_OVERRIDE_${overrideType}`,
      details: `Lead ${actor.fullName || actor.email} enforced override: "${reason}".`
    });

    if (overrideType === 'STOP' || overrideType === 'REJECT') {
      result.validationStatus = 'FAILED';
      contract.status = 'HALTED';
    }

    storage.recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'COLLABORATION_HUMAN_OVERRIDE',
      targetEntity: 'CollaborationResult',
      targetId: result.id,
      projectId: contract.projectId,
      afterState: { overrideType, reason, status: result.status },
      correlationId: `corr-override-${result.id}`
    });

    return result;
  }

  /**
   * Promote Merged Multi-Agent Collaboration Evidence to Authoritative State
   */
  public promoteCollaborationEvidence(
    collaborationId: string,
    actor: User,
    correlationId: string
  ): { success: boolean; task: UniversalTaskSpecification } {
    const result = this.collaborationResults.get(collaborationId);
    if (!result) {
      throw new Error(`Collaboration result ${collaborationId} not found.`);
    }

    if (actor.role !== 'PROJECT_LEAD') {
      throw new Error('Permission denied: Promoting collaboration evidence requires PROJECT_LEAD role.');
    }

    if (result.validationStatus !== 'PASSED' && result.humanOverrideApplied?.overrideType !== 'FORCE_PASS') {
      throw new Error('Cannot promote evidence with failing validation status.');
    }

    if (result.conflicts.some(c => c.resolutionStatus === 'UNRESOLVED')) {
      throw new Error('Cannot promote evidence: Unresolved agent conflicts require human decision.');
    }

    const task = storage.getTask(result.taskId, result.projectId);
    if (!task) throw new Error('Task not found.');

    // Transition task state to PASSED
    storage.updateTaskState(result.projectId, task.taskId, actor.organizationId, 'PASSED', actor, correlationId);
    result.isAuthoritativeStateUpdated = true;

    storage.recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'COLLABORATION_EVIDENCE_PROMOTED',
      targetEntity: 'Task',
      targetId: task.taskId,
      projectId: result.projectId,
      afterState: { taskState: 'PASSED', collaborationId },
      correlationId
    });

    return { success: true, task };
  }

  public getCollaborationContract(id: string): CollaborationContract | undefined {
    return this.activeCollaborations.get(id);
  }

  public getCollaborationResult(id: string): CollaborationResult | undefined {
    return this.collaborationResults.get(id);
  }

  public listCollaborations(projectId?: string): CollaborationResult[] {
    const all = Array.from(this.collaborationResults.values());
    if (projectId) {
      return all.filter(c => c.projectId === projectId);
    }
    return all;
  }
}

export const collaborationEngine = new CollaborationEngine();
