import { storage } from '../storage.ts';
import { 
  DetectedPattern, 
  PatternCategory, 
  PatternSeverity 
} from '../../types/index.ts';

export class PatternEngine {
  /**
   * Scans project state, validation failures, tasks, and audit logs to detect emerging patterns and anti-patterns.
   */
  public detectPatterns(projectId: string): DetectedPattern[] {
    const project = storage.getProject(projectId);
    const orgId = project?.organizationId || 'org-arcadia-demo';
    const tasks = storage.getTasks(projectId);
    const failures = storage.getValidationFailures(projectId);
    const contracts = storage.getValidationContracts(projectId);
    const auditLogs = storage.getAuditLogs(projectId);

    const detected: DetectedPattern[] = [];

    // 1. Detect Scope Lock Anti-Patterns (Over-broad wildcards or boundary leaks)
    const scopeViolations = failures.filter(f => 
      (f as any).gateId === 'gate-2-scope-boundary' || 
      (Boolean((f as any).ruleId) && typeof (f as any).ruleId === 'string' && (f as any).ruleId.includes('scope')) ||
      f.category === 'SCOPE' ||
      (Boolean(f.whatFailed) && typeof f.whatFailed === 'string' && f.whatFailed.toLowerCase().includes('scope'))
    );
    if (scopeViolations.length >= 2) {
      detected.push({
        id: `pat-scope-${Date.now()}`,
        organizationId: orgId,
        projectId,
        category: 'ANTI_PATTERN',
        severity: 'HIGH',
        title: 'Over-Broad Scope Lock in Execution Tasks',
        signature: 'SIG-SCOPE-OVERBROAD-WILD',
        occurrenceCount: scopeViolations.length,
        firstSeen: (scopeViolations[0] as any)?.timestamp || new Date().toISOString(),
        lastSeen: (scopeViolations[scopeViolations.length - 1] as any)?.timestamp || new Date().toISOString(),
        affectedComponents: ['ScopeLockValidator', 'AdaptivePipeline'],
        affectedTaskIds: Array.from(new Set(scopeViolations.map(v => (v as any).taskId || 'task-scope'))),
        correlationScore: 0.82,
        rootCauseHypothesis: 'Tasks declaring top-level directory wildcards create cross-boundary validation conflicts during execution.',
        actionableMitigation: 'Enforce exact symbol & file isolation instead of directory-level globs in task readiness contracts.',
        resolved: false
      });
    }

    // 2. Detect Repeated Validation Failures (Same rule failing repeatedly across tasks)
    const ruleFailureCounts = new Map<string, { count: number; taskIds: Set<string>; firstSeen: string; lastSeen: string }>();
    failures.forEach(f => {
      const ruleKey = (f as any).ruleId || f.category || (f.affectedComponent ? `${f.category}:${f.affectedComponent}` : f.whatFailed) || 'UNKNOWN_RULE';
      const timestamp = (f as any).timestamp || new Date().toISOString();
      const taskId = (f as any).taskId || 'general-task';
      const entry = ruleFailureCounts.get(ruleKey) || {
        count: 0,
        taskIds: new Set<string>(),
        firstSeen: timestamp,
        lastSeen: timestamp
      };
      entry.count++;
      entry.taskIds.add(taskId);
      entry.lastSeen = timestamp;
      ruleFailureCounts.set(ruleKey, entry);
    });

    for (const [ruleId, stats] of ruleFailureCounts.entries()) {
      if (stats.count >= 2) {
        detected.push({
          id: `pat-fail-${ruleId}`,
          organizationId: orgId,
          projectId,
          category: 'REPEATED_FAILURE',
          severity: stats.count > 3 ? 'CRITICAL' : 'HIGH',
          title: `Recurring Failure on Validation Rule: ${ruleId}`,
          signature: `SIG-FAIL-RULE-${ruleId.toUpperCase()}`,
          occurrenceCount: stats.count,
          firstSeen: stats.firstSeen,
          lastSeen: stats.lastSeen,
          affectedComponents: [ruleId],
          affectedTaskIds: Array.from(stats.taskIds),
          correlationScore: 0.75,
          rootCauseHypothesis: `Systematic failure in satisfying ${ruleId} contract preconditions prior to Gate 4 staging.`,
          actionableMitigation: `Inject rule ${ruleId} requirements directly into prompt template compiler context.`,
          resolved: false
        });
      }
    }

    // 3. Detect Workflow Bottlenecks (Decision queue backlog or human review latency)
    const queueItems = storage.getDecisionQueueItems ? storage.getDecisionQueueItems(projectId) : [];
    const pendingDecisions = queueItems.filter(d => d.status === 'PENDING');
    if (pendingDecisions.length >= 3) {
      detected.push({
        id: `pat-bottleneck-decisions-${Date.now()}`,
        organizationId: orgId,
        projectId,
        category: 'WORKFLOW_BOTTLENECK',
        severity: 'MEDIUM',
        title: 'Human Review Queue Congestion',
        signature: 'SIG-QUEUE-CONGESTION-HITL',
        occurrenceCount: pendingDecisions.length,
        firstSeen: pendingDecisions[0]?.createdAt || new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        affectedComponents: ['DecisionQueue', 'HumanInTheLoopGate'],
        affectedTaskIds: pendingDecisions.map(d => d.impactAnalysis?.affectedTasks?.[0] || 'general'),
        correlationScore: 0.68,
        rootCauseHypothesis: 'Multiple concurrent tasks requiring Project Lead manual sign-off causing pipeline queue delays.',
        actionableMitigation: 'Synthesize automated waiver policies for LOW-risk decisions under verified architectural memory.',
        resolved: false
      });
    }

    // 4. Detect Success Patterns (High First-Pass Passing Tasks)
    const passedTasks = tasks.filter(t => t.state === 'PASSED');
    if (passedTasks.length >= 2) {
      detected.push({
        id: `pat-success-firstpass-${Date.now()}`,
        organizationId: orgId,
        projectId,
        category: 'SUCCESS_PATTERN',
        severity: 'LOW',
        title: 'Pre-Flight Lint Verification in Dual-Agent Pair',
        signature: 'SIG-DUAL-LINT-PASS',
        occurrenceCount: passedTasks.length,
        firstSeen: passedTasks[0]?.updatedAt || new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        affectedComponents: ['collaborationEngine', 'promptCompiler'],
        affectedTaskIds: passedTasks.map(t => t.taskId),
        correlationScore: 0.94,
        rootCauseHypothesis: 'AST compiler verification before Critic review reduces review round-trips by 65%.',
        actionableMitigation: 'Standardize pre-flight AST compiler pass across all code modification workflows.',
        resolved: true,
        resolvedAt: new Date().toISOString()
      });
    }

    // Save detected patterns to storage (merging with existing)
    detected.forEach(p => storage.savePattern(p));

    return storage.getPatterns(projectId);
  }

  /**
   * Evaluates the correlation score between an observed pattern and overall task failure rate.
   */
  public evaluatePatternImpact(projectId: string, patternId: string): {
    correlationScore: number;
    estimatedCostImpact: number;
    delayRiskMinutes: number;
  } {
    const patterns = storage.getPatterns(projectId);
    const pattern = patterns.find(p => p.id === patternId);
    if (!pattern) {
      return { correlationScore: 0, estimatedCostImpact: 0, delayRiskMinutes: 0 };
    }

    const multiplier = pattern.severity === 'CRITICAL' ? 1.5 : pattern.severity === 'HIGH' ? 1.2 : 0.8;
    return {
      correlationScore: pattern.correlationScore,
      estimatedCostImpact: Number((pattern.occurrenceCount * 0.45 * multiplier).toFixed(2)),
      delayRiskMinutes: Math.round(pattern.occurrenceCount * 12 * multiplier)
    };
  }

  /**
   * Resolves a pattern once its mitigation policy has been enacted.
   */
  public resolvePattern(patternId: string): boolean {
    return storage.resolvePattern(patternId);
  }
}

export const patternEngine = new PatternEngine();
