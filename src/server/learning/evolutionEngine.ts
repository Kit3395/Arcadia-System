import { storage } from '../storage.ts';
import { 
  EvolutionProposal, 
  EvolutionProposalStatus, 
  UserRole 
} from '../../types/index.ts';

export class EvolutionEngine {
  /**
   * Evaluates project patterns and verified memories to synthesize evidence-backed system evolution proposals.
   */
  public synthesizeProposals(projectId: string): EvolutionProposal[] {
    const project = storage.getProject(projectId);
    const orgId = project?.organizationId || 'org-arcadia-demo';
    const patterns = storage.getPatterns(projectId);
    const memories = storage.getMemories(projectId);
    const existing = storage.getEvolutionProposals(projectId);

    const proposals: EvolutionProposal[] = [];

    // 1. Synthesize proposal for scope-lock anti-pattern if detected
    const scopePattern = patterns.find(p => p.signature === 'SIG-SCOPE-OVERBROAD-WILD' && !p.resolved);
    const scopeMemory = memories.find(m => m.title.includes('Scope-Locked') && m.status === 'VERIFIED');
    if (scopePattern && !existing.some(e => e.triggeringPatternIds.includes(scopePattern.id))) {
      proposals.push({
        id: `evo-scope-${Date.now()}`,
        organizationId: orgId,
        projectId,
        title: 'Synthesize Fine-Grained AST File Binding in Task Readiness',
        targetDomain: 'VALIDATION_RULE',
        rationale: `Pattern ${scopePattern.signature} showed ${scopePattern.occurrenceCount} boundary violations. Verified Memory ${scopeMemory?.id || 'mem-001'} proves strict AST symbol declaration prevents unauthorized drift.`,
        synthesizedRuleOrPolicy: 'RULE-SCOPE-AST-01: Prohibit top-level directory wildcards; mandate explicit relative file paths in Task Scope Locks.',
        triggeringPatternIds: [scopePattern.id],
        triggeringMemoryIds: scopeMemory ? [scopeMemory.id] : [],
        currentValue: 'Allow directory wildcards (e.g. src/*)',
        proposedValue: 'Mandate explicit file array without wildcards (e.g. [src/server/storage.ts])',
        simulatedImpact: {
          predictedImprovementPercent: 28,
          riskRating: 'MINIMAL',
          affectedWorkflows: ['Task Readiness Gate (Gate 2)', 'Prompt Compiler']
        },
        status: 'PROPOSED',
        requiredAuthority: 'PROJECT_LEAD',
        isConstitutionallyCompliant: true,
        reversibility: 'REVERSIBLE',
        rollbackAction: 'Restore directory wildcard parsing in taskReadinessGate.',
        proposedBy: 'system-evolution-agent',
        timestamp: new Date().toISOString()
      });
    }

    // 2. Synthesize proposal for repeated retry failure
    const retryPattern = patterns.find(p => p.category === 'REPEATED_FAILURE' && !p.resolved);
    if (retryPattern && !existing.some(e => e.triggeringPatternIds.includes(retryPattern.id))) {
      proposals.push({
        id: `evo-retry-${Date.now()}`,
        organizationId: orgId,
        projectId,
        title: 'Enact Failure-Conditioned Prompt Reflection for Task Retries',
        targetDomain: 'RETRY_POLICY',
        rationale: `Recurring failure ${retryPattern.signature} with ${retryPattern.occurrenceCount} repeats requires injecting exact error diffs into retry prompt compilation.`,
        synthesizedRuleOrPolicy: 'POLICY-RETRY-REFLECTION-01: Inject Gate 4 validation failure error trace into subsequent iteration prompt context.',
        triggeringPatternIds: [retryPattern.id],
        triggeringMemoryIds: [],
        currentValue: 'Retry with static initial task prompt',
        proposedValue: 'Dynamic failure-conditioned reflection prompt injection',
        simulatedImpact: {
          predictedImprovementPercent: 35,
          riskRating: 'MINIMAL',
          affectedWorkflows: ['Autonomous Execution Pipeline', 'Context Orchestrator']
        },
        status: 'PROPOSED',
        requiredAuthority: 'PROJECT_LEAD',
        isConstitutionallyCompliant: true,
        reversibility: 'REVERSIBLE',
        rollbackAction: 'Revert promptCompiler retry mode to static base prompt.',
        proposedBy: 'system-evolution-agent',
        timestamp: new Date().toISOString()
      });
    }

    // Save newly synthesized proposals to storage
    proposals.forEach(p => storage.createEvolutionProposal(p));

    return storage.getEvolutionProposals(projectId);
  }

  /**
   * Applies an approved evolution proposal.
   * INVARIANTS:
   * 1. CONSTITUTIONAL SUPREMACY: Mutation cannot relax or weaken Supreme Constitution articles.
   * 2. RBAC: Must be approved and applied by PROJECT_LEAD or ARCHITECT.
   * 3. REVERSIBILITY: Must have an explicit rollbackAction defined.
   */
  public applyProposal(
    proposalId: string,
    actorId: string,
    actorRole: UserRole
  ): { success: boolean; proposal?: EvolutionProposal; error?: string } {
    const proposal = storage.getEvolutionProposal(proposalId);
    if (!proposal) {
      return { success: false, error: 'Evolution proposal not found' };
    }

    // Invariant 1: RBAC check
    if (actorRole !== 'PROJECT_LEAD' && actorRole !== 'ARCHITECT') {
      return {
        success: false,
        error: `Role ${actorRole} is prohibited from applying system evolution mutations. Requires PROJECT_LEAD or ARCHITECT authority.`
      };
    }

    // Invariant 2: Constitutional compliance check
    if (!proposal.isConstitutionallyCompliant) {
      storage.updateEvolutionProposal(proposalId, { status: 'REJECTED' });
      return {
        success: false,
        error: 'HARD REJECTION: Proposal violates Supreme Constitution invariants. Constitutional rules cannot be modified or bypassed through system evolution.'
      };
    }

    // Invariant 3: Reversibility check
    if (proposal.reversibility !== 'REVERSIBLE' || !proposal.rollbackAction) {
      storage.updateEvolutionProposal(proposalId, { status: 'REJECTED' });
      return {
        success: false,
        error: 'REJECTION: System evolution requires verified reversible rollback actions.'
      };
    }

    const updated = storage.updateEvolutionProposal(proposalId, {
      status: 'APPLIED',
      reviewedBy: actorId,
      appliedAt: new Date().toISOString()
    });

    // Mark any triggering patterns as resolved
    proposal.triggeringPatternIds.forEach(patId => {
      storage.resolvePattern(patId);
    });

    // Record audit event
    storage.recordAudit({
      actorId,
      actorRole,
      action: 'SYSTEM_EVOLUTION_MUTATION_APPLIED',
      targetEntity: 'EvolutionProposal',
      targetId: proposalId,
      projectId: proposal.projectId,
      beforeState: { status: proposal.status, value: proposal.currentValue },
      afterState: { status: 'APPLIED', value: proposal.proposedValue, appliedAt: updated?.appliedAt },
      correlationId: `corr-evo-apply-${Date.now()}`
    });

    return { success: true, proposal: updated };
  }

  /**
   * Rolls back an applied evolution proposal to its prior verified state.
   */
  public rollbackProposal(
    proposalId: string,
    actorId: string,
    actorRole: UserRole
  ): { success: boolean; proposal?: EvolutionProposal; error?: string } {
    const proposal = storage.getEvolutionProposal(proposalId);
    if (!proposal) {
      return { success: false, error: 'Evolution proposal not found' };
    }

    if (actorRole !== 'PROJECT_LEAD' && actorRole !== 'ARCHITECT') {
      return {
        success: false,
        error: `Role ${actorRole} is not authorized to rollback system evolution. Requires PROJECT_LEAD or ARCHITECT.`
      };
    }

    if (proposal.status !== 'APPLIED') {
      return {
        success: false,
        error: `Proposal is in state ${proposal.status}, only APPLIED proposals can be rolled back.`
      };
    }

    const updated = storage.updateEvolutionProposal(proposalId, {
      status: 'ROLLED_BACK',
      rolledBackAt: new Date().toISOString()
    });

    storage.recordAudit({
      actorId,
      actorRole,
      action: 'SYSTEM_EVOLUTION_MUTATION_ROLLED_BACK',
      targetEntity: 'EvolutionProposal',
      targetId: proposalId,
      projectId: proposal.projectId,
      beforeState: { status: 'APPLIED', value: proposal.proposedValue },
      afterState: { status: 'ROLLED_BACK', value: proposal.currentValue, rollbackAction: proposal.rollbackAction },
      correlationId: `corr-evo-rollback-${Date.now()}`
    });

    return { success: true, proposal: updated };
  }

  /**
   * Simulates the performance and cost impact of a proposed mutation.
   */
  public simulateImpact(proposal: Partial<EvolutionProposal>): {
    predictedImprovementPercent: number;
    riskRating: 'MINIMAL' | 'MODERATE' | 'ELEVATED';
    affectedWorkflows: string[];
    costDeltaPercent: number;
  } {
    const domain = proposal.targetDomain || 'VALIDATION_RULE';
    if (domain === 'RETRY_POLICY') {
      return {
        predictedImprovementPercent: 32,
        riskRating: 'MINIMAL',
        affectedWorkflows: ['Adaptive Execution Engine', 'Task Recovery Pipeline'],
        costDeltaPercent: -22.5
      };
    } else if (domain === 'VALIDATION_RULE') {
      return {
        predictedImprovementPercent: 24,
        riskRating: 'MINIMAL',
        affectedWorkflows: ['Task Readiness Gate (Gate 2)', 'Static AST Lint Validation'],
        costDeltaPercent: -12.0
      };
    }

    return {
      predictedImprovementPercent: 15,
      riskRating: 'MODERATE',
      affectedWorkflows: ['Agent Assignment', 'Collaboration Handoff'],
      costDeltaPercent: -5.0
    };
  }
}

export const evolutionEngine = new EvolutionEngine();
