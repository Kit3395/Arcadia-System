import { storage } from '../storage.ts';
import { 
  TrustEvent, 
  TrustEventType, 
  ContextualTrustProfile 
} from '../../types/index.ts';

export class TrustEngine {
  /**
   * Record an observed trust event.
   */
  public recordEvent(params: {
    projectId: string;
    agentId: string;
    eventType: TrustEventType;
    taskType: string;
    complexity?: 'LOW' | 'MEDIUM' | 'HIGH';
    strategy?: string;
    securityLevel?: string;
    outcome?: 'SUCCESS' | 'FAILURE' | 'NEUTRAL';
    validationResult?: 'PASSED' | 'FAILED';
    contextDetails: string;
  }): TrustEvent {
    const event: TrustEvent = {
      id: `trust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: params.projectId,
      agentId: params.agentId,
      eventType: params.eventType,
      taskType: params.taskType,
      complexity: params.complexity || 'MEDIUM',
      strategy: params.strategy || 'EXECUTOR',
      securityLevel: params.securityLevel || 'RESTRICTED',
      outcome: params.outcome || (params.eventType.includes('SUCCESS') || params.eventType.includes('APPROVAL') ? 'SUCCESS' : 'FAILURE'),
      validationResult: params.validationResult,
      contextDetails: params.contextDetails,
      timestamp: new Date().toISOString()
    };

    return storage.recordTrustEvent(event);
  }

  /**
   * Calculate a Contextual Trust Profile for an agent under specific conditions.
   * INVARIANT: Never outputs a single universal global trust score. Profiles are explicitly contextual.
   */
  public getContextualProfile(
    projectId: string,
    agentId: string,
    taskType: string,
    complexity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
  ): ContextualTrustProfile {
    const allEvents = storage.getTrustEvents(projectId, agentId);
    const contextualEvents = allEvents.filter(e => e.taskType === taskType && e.complexity === complexity);

    const sample = contextualEvents.length > 0 ? contextualEvents : allEvents;
    const sampleSize = sample.length;

    let accepted = 0;
    let overrides = 0;
    let corrections = 0;

    for (const ev of sample) {
      if (ev.eventType === 'RECOMMENDATION_ACCEPTED' || ev.eventType === 'HUMAN_APPROVAL' || ev.eventType === 'SUCCESSFUL_RECOMMENDATION') {
        accepted++;
      }
      if (ev.eventType === 'HUMAN_OVERRIDE') {
        overrides++;
      }
      if (ev.eventType === 'CORRECTION_REQUIRED' || ev.eventType === 'VALIDATION_DISAGREEMENT') {
        corrections++;
      }
    }

    const acceptanceRate = sampleSize > 0 ? Math.round((accepted / sampleSize) * 100) : 95;
    const overrideRate = sampleSize > 0 ? Math.round((overrides / sampleSize) * 100) : 4;
    const correctionRate = sampleSize > 0 ? Math.round((corrections / sampleSize) * 100) : 5;

    const observedStrengths: string[] = [];
    const observedWeaknesses: string[] = [];
    const recommendedControls: string[] = [];

    if (acceptanceRate > 85) {
      observedStrengths.push('High alignment with architectural and security constraints.');
      observedStrengths.push('Reliable AST invariant generation and test verification.');
    } else {
      observedWeaknesses.push('Elevated review rejection or modification frequency.');
    }

    if (correctionRate > 10) {
      observedWeaknesses.push('Frequent post-execution corrections required by human reviewer.');
      recommendedControls.push('Mandatory human review placement on Gate 6.');
      recommendedControls.push('Require additional static rule verification.');
    } else {
      recommendedControls.push('Standard 7-Gate chronological validation.');
    }

    // Invariant: Authority cannot be automatically expanded regardless of high trust
    const evidenceRequirementLevel = correctionRate > 15 ? 'MANDATORY_REVIEW' : (complexity === 'HIGH' ? 'ELEVATED' : 'STANDARD');

    return {
      agentId,
      taskType,
      complexity,
      strategy: sample[0]?.strategy || 'EXECUTOR_WITH_AUDIT',
      sampleSize,
      acceptanceRate,
      overrideRate,
      correctionRate,
      observedStrengths,
      observedWeaknesses,
      recommendedControls,
      evidenceRequirementLevel
    };
  }

  /**
   * Validate that self-reported metrics from an agent are corroborated by authoritative validation outcomes.
   * Anti-gaming protection.
   */
  public verifySelfReportedMetric(
    projectId: string,
    agentId: string,
    selfReportedPass: boolean,
    contractId?: string
  ): { corroborated: boolean; discrepancyNotice?: string } {
    if (!contractId) {
      return { corroborated: true };
    }

    const contracts = storage.getValidationContracts(projectId);
    const contract = contracts.find(c => c.id === contractId);

    if (!contract) {
      return { corroborated: true };
    }

    const actualPassed = contract.status === 'PASSED';
    if (selfReportedPass && !actualPassed) {
      // Discrepancy detected! Agent claimed pass, but authoritative contract failed
      this.recordEvent({
        projectId,
        agentId,
        eventType: 'FALSE_POSITIVE',
        taskType: 'METRIC_VERIFICATION',
        complexity: 'HIGH',
        outcome: 'FAILURE',
        contextDetails: `Agent reported PASS on contract ${contractId}, but authoritative gate recorded status ${contract.status}.`
      });

      return {
        corroborated: false,
        discrepancyNotice: `Gaming / Invariant Violation: Agent self-reported PASS, but Gate Contract ${contractId} is ${contract.status}. Independent validation is authoritative.`
      };
    }

    return { corroborated: true };
  }
}

export const trustEngine = new TrustEngine();
