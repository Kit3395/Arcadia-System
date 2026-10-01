import { storage } from '../storage.ts';
import { 
  WorkflowLoadFactors, 
  WorkflowLoadIndicator 
} from '../../types/index.ts';

export class CognitiveLoadEngine {
  /**
   * Measure operational workflow complexity.
   * NOTE: Strict Invariant - Measures workflow characteristics, NEVER human psychological or medical states.
   */
  public measureWorkflowLoad(projectId: string): WorkflowLoadIndicator {
    const decisions = storage.getDecisions(projectId);
    const tasks = storage.getTasks(projectId);
    const contracts = storage.getValidationContracts(projectId);
    const findings = storage.getSecurityFindings(projectId);
    const queue = storage.getValidationReviewQueue(projectId);

    const pendingDecisions = decisions.filter(d => d.status === 'PROPOSED');
    const unresolvedDecisions = pendingDecisions.length;
    const concurrentTasks = tasks.filter(t => t.state === 'RUNNING' || t.state === 'ASSIGNED').length;
    const blockers = tasks.filter(t => t.state === 'BLOCKED').length;
    const criticalFailures = contracts.reduce((acc, c) => acc + c.failures.filter(f => f.severity === 'CRITICAL' && !f.waived).length, 0);
    const openFindings = findings.filter(f => f.status === 'OPEN').length;
    const project = storage.getProject(projectId);
    const activeProjectsCount = project ? storage.getProjects(project.organizationId).length : 1;

    const rawFactors: WorkflowLoadFactors = {
      activeDecisions: decisions.length,
      unresolvedDecisions,
      informationVolume: tasks.length * 15 + contracts.length * 8,
      contextSwitches: concurrentTasks > 2 ? concurrentTasks * 2 : concurrentTasks,
      activeProjects: activeProjectsCount,
      concurrentTasks,
      exceptions: criticalFailures + openFindings,
      blockers,
      reviewComplexity: queue.length > 3 ? 3 : queue.length,
      pendingApprovals: queue.length,
      notificationVolume: unresolvedDecisions * 2 + blockers,
      dependencyComplexity: tasks.reduce((acc, t) => acc + (t.dependencies?.length || 0), 0),
      riskLevel: criticalFailures > 0 ? 'HIGH' : openFindings > 0 ? 'MEDIUM' : 'LOW',
      timePressure: blockers > 1 ? 'HIGH' : 'LOW',
      openChangeRequests: decisions.filter(d => d.status === 'PROPOSED' && (d.description.includes('Scope') || d.context.includes('Scope'))).length
    };

    // Calculate explainable composite operational score (0 - 100)
    let score = 15; // baseline
    score += unresolvedDecisions * 6;
    score += blockers * 12;
    score += criticalFailures * 15;
    score += queue.length * 5;
    score += concurrentTasks > 3 ? (concurrentTasks - 3) * 8 : 0;
    score = Math.min(100, Math.max(0, score));

    let loadLevel: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'ATTENTION_REQUIRED' = 'NORMAL';
    if (score >= 75) {
      loadLevel = 'ATTENTION_REQUIRED';
    } else if (score >= 50) {
      loadLevel = 'HIGH';
    } else if (score >= 30) {
      loadLevel = 'ELEVATED';
    }

    const primaryDrivers: string[] = [];
    if (blockers > 0) primaryDrivers.push(`${blockers} active execution blockers`);
    if (unresolvedDecisions > 0) primaryDrivers.push(`${unresolvedDecisions} pending architectural decisions`);
    if (criticalFailures > 0) primaryDrivers.push(`${criticalFailures} critical gate failures`);
    if (queue.length > 2) primaryDrivers.push(`${queue.length} pending review items in governance queue`);

    if (primaryDrivers.length === 0) {
      primaryDrivers.push('System workflow is running within optimal operational thresholds');
    }

    // Recommended low-risk UI presentations
    const recommendedUIAdaptations: string[] = [];
    if (blockers > 0 || criticalFailures > 0) {
      recommendedUIAdaptations.push('BLOCKER_FIRST_PRESENTATION: Elevate blocked tasks and critical failures to top of dashboard.');
    }
    if (queue.length > 3) {
      recommendedUIAdaptations.push('GROUP_RELATED_DECISIONS: Cluster related review queue items into a single bulk-decision drawer.');
    }
    if (concurrentTasks > 4) {
      recommendedUIAdaptations.push('PROGRESSIVE_DISCLOSURE: Collapse inactive background tasks to reduce visual noise.');
    }
    if (recommendedUIAdaptations.length === 0) {
      recommendedUIAdaptations.push('STANDARD_DENSITY: Standard balanced information display.');
    }

    return {
      projectId,
      rawFactors,
      derivedScore: score,
      loadLevel,
      primaryDrivers,
      explanation: `Operational complexity is currently ${loadLevel} (score: ${score}/100) based on ${primaryDrivers.join('; ')}.`,
      recommendedUIAdaptations,
      calculatedAt: new Date().toISOString()
    };
  }
}

export const cognitiveLoadEngine = new CognitiveLoadEngine();
