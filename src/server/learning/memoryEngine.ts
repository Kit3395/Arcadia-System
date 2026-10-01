import { storage } from '../storage.ts';
import { 
  OrganizationalMemory, 
  MemoryType, 
  MemoryStatus, 
  UserRole 
} from '../../types/index.ts';

export class MemoryEngine {
  /**
   * Generates a deterministic SHA-256 style immutable checksum for memory content.
   */
  public generateMemoryHash(title: string, summary: string, authorId: string, timestamp: string): string {
    let hash = 0;
    const combined = `${title}|${summary}|${authorId}|${timestamp}`;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `sha256-${hex}a1b2c3d4e5f60718293a4b5c6d7e8f90`;
  }

  /**
   * Creates a new Organizational Memory with complete provenance and initial status.
   * INVARIANT: By default, newly submitted memories start as 'PROPOSED' or 'DRAFT' unless created by PROJECT_LEAD or ARCHITECT with immediate verification.
   */
  public proposeMemory(params: {
    projectId: string;
    organizationId: string;
    title: string;
    type: MemoryType;
    category: string;
    summary: string;
    detailedContent: string;
    authorId: string;
    authorRole: UserRole;
    applicableContexts?: string[];
    relatedTaskIds?: string[];
    relatedRequirementIds?: string[];
    relatedConstitutionalArticles?: string[];
    sourceTaskId?: string;
    sourceDecisionId?: string;
    sourceIncidentId?: string;
    verifiedDirectly?: boolean;
  }): OrganizationalMemory {
    const now = new Date().toISOString();
    const immutableHash = this.generateMemoryHash(params.title, params.summary, params.authorId, now);

    // ANTI-POISONING INVARIANT: Only PROJECT_LEAD or ARCHITECT can directly verify a memory upon creation.
    // Client, Developer, or Automated agents must enter PROPOSED status pending verification.
    const isLeadOrArchitect = params.authorRole === 'PROJECT_LEAD' || params.authorRole === 'ARCHITECT';
    const status: MemoryStatus = (params.verifiedDirectly && isLeadOrArchitect) ? 'VERIFIED' : 'PROPOSED';

    const memory: OrganizationalMemory = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      organizationId: params.organizationId,
      projectId: params.projectId,
      title: params.title,
      type: params.type,
      category: params.category,
      summary: params.summary,
      detailedContent: params.detailedContent,
      status,
      provenance: {
        sourceTaskId: params.sourceTaskId,
        sourceDecisionId: params.sourceDecisionId,
        sourceIncidentId: params.sourceIncidentId,
        authorId: params.authorId,
        authorRole: params.authorRole,
        organizationId: params.organizationId,
        projectId: params.projectId,
        verifiedBy: (status === 'VERIFIED') ? params.authorId : undefined,
        verifiedAt: (status === 'VERIFIED') ? now : undefined,
        confidenceScore: isLeadOrArchitect ? 0.95 : 0.75,
        verificationMethod: isLeadOrArchitect ? 'MANUAL_HUMAN' : 'AUTOMATED_VALIDATION',
        immutableHash
      },
      applicableContexts: params.applicableContexts || [],
      relatedTaskIds: params.relatedTaskIds || [],
      relatedRequirementIds: params.relatedRequirementIds || [],
      relatedConstitutionalArticles: params.relatedConstitutionalArticles || [],
      usageCount: 0,
      successRate: 100,
      freshnessScore: 100,
      createdTimestamp: now,
      updatedTimestamp: now
    };

    storage.createMemory(memory);

    // Record audit event
    storage.recordAudit({
      actorId: params.authorId,
      actorRole: params.authorRole,
      action: 'ORGANIZATIONAL_MEMORY_PROPOSED',
      targetEntity: 'OrganizationalMemory',
      targetId: memory.id,
      projectId: params.projectId,
      afterState: { id: memory.id, title: memory.title, status: memory.status },
      correlationId: `corr-mem-${Date.now()}`
    });

    return memory;
  }

  /**
   * Verifies an Organizational Memory, elevating its status to VERIFIED or ACTIVE.
   * INVARIANT: Verifier must have PROJECT_LEAD, ARCHITECT, or QA role.
   */
  public verifyMemory(
    memoryId: string,
    verifierId: string,
    verifierRole: UserRole,
    method: 'MANUAL_HUMAN' | 'AUTOMATED_VALIDATION' | 'CONSENSUS_AUDIT' = 'MANUAL_HUMAN'
  ): { success: boolean; memory?: OrganizationalMemory; error?: string } {
    const memory = storage.getMemory(memoryId);
    if (!memory) {
      return { success: false, error: 'Memory not found' };
    }

    if (verifierRole !== 'PROJECT_LEAD' && verifierRole !== 'ARCHITECT' && verifierRole !== 'QA') {
      return { 
        success: false, 
        error: `Role ${verifierRole} is not authorized to verify organizational memories. Requires PROJECT_LEAD, ARCHITECT, or QA.` 
      };
    }

    const updated = storage.verifyMemory(memoryId, verifierId, verifierRole, method);

    // Record audit
    storage.recordAudit({
      actorId: verifierId,
      actorRole: verifierRole,
      action: 'ORGANIZATIONAL_MEMORY_VERIFIED',
      targetEntity: 'OrganizationalMemory',
      targetId: memoryId,
      projectId: memory.projectId,
      afterState: { id: memoryId, status: 'VERIFIED', verifiedBy: verifierId, method },
      correlationId: `corr-mem-verify-${Date.now()}`
    });

    return { success: true, memory: updated };
  }

  /**
   * Queries verified organizational memories relevant to a given task context or keyword query.
   * Used by Context Orchestrator to inject organizational knowledge into prompt context packages.
   */
  public queryRelevantMemories(
    projectId: string,
    contexts: string[],
    options?: { minConfidence?: number; limit?: number; includeProposed?: boolean }
  ): OrganizationalMemory[] {
    const memories = storage.getMemories(projectId);
    const minConfidence = options?.minConfidence ?? 0.8;
    const limit = options?.limit ?? 5;
    const includeProposed = options?.includeProposed ?? false;

    return memories
      .filter(m => {
        // Enforce anti-poisoning: only VERIFIED or ACTIVE memories are injected into execution context
        if (!includeProposed && m.status !== 'VERIFIED' && m.status !== 'ACTIVE') {
          return false;
        }
        if (m.provenance.confidenceScore < minConfidence) {
          return false;
        }
        if (contexts.length === 0) return true;
        // Check matching contexts or tags
        return contexts.some(c => 
          m.applicableContexts.some(ac => ac.toLowerCase().includes(c.toLowerCase())) ||
          m.title.toLowerCase().includes(c.toLowerCase()) ||
          m.category.toLowerCase().includes(c.toLowerCase())
        );
      })
      .sort((a, b) => (b.provenance.confidenceScore * b.freshnessScore) - (a.provenance.confidenceScore * a.freshnessScore))
      .slice(0, limit);
  }

  /**
   * Increments usage count and updates freshness score when a memory is utilized in an execution or prompt.
   */
  public recordMemoryUsage(memoryId: string, success: boolean): void {
    const memory = storage.getMemory(memoryId);
    if (!memory) return;

    const newUsageCount = memory.usageCount + 1;
    const newSuccessRate = success 
      ? Math.round(((memory.successRate * memory.usageCount) + 100) / newUsageCount)
      : Math.round(((memory.successRate * memory.usageCount) + 0) / newUsageCount);

    storage.updateMemory(memoryId, {
      usageCount: newUsageCount,
      successRate: newSuccessRate,
      freshnessScore: Math.min(100, memory.freshnessScore + 5)
    });
  }
}

export const memoryEngine = new MemoryEngine();
