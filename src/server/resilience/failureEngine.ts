import { storage } from '../storage.ts';
import {
  FailureClassification,
  DegradationLevel,
  UserRole
} from '../../types/index.ts';

export class FailureEngine {
  /**
   * Classifies an operational failure according to the Arcadia Safety Hierarchy.
   * Priority: Human Safety > Security > Data Integrity > Governance > Project Truth > Correctness > Availability.
   */
  public classifyFailure(error: any, context?: Record<string, unknown>): {
    classification: FailureClassification;
    retryable: boolean;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    suggestedAction: string;
  } {
    const message = (error?.message || String(error || '')).toLowerCase();
    const stack = (error?.stack || '').toLowerCase();

    // 1. Security-Critical Failures
    if (
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('rbac') ||
      message.includes('secret') ||
      message.includes('cross-tenant') ||
      message.includes('poisoning') ||
      message.includes('injection')
    ) {
      return {
        classification: 'SECURITY_CRITICAL',
        retryable: false,
        severity: 'CRITICAL',
        suggestedAction: 'Immediately halt agent execution, redact sensitive material, and alert Security Lead.'
      };
    }

    // 2. Data Integrity Failures
    if (
      message.includes('foreign key') ||
      message.includes('checksum') ||
      message.includes('hash mismatch') ||
      message.includes('corruption') ||
      message.includes('stale version') ||
      message.includes('concurrency')
    ) {
      return {
        classification: 'DATA_INTEGRITY_CRITICAL',
        retryable: false,
        severity: 'CRITICAL',
        suggestedAction: 'Refuse state modification, initiate rollback to last known valid snapshot, and run integrity scan.'
      };
    }

    // 3. Governance Blocking Failures
    if (
      message.includes('constitution') ||
      message.includes('invariant') ||
      message.includes('scope lock') ||
      message.includes('unwaiverable') ||
      message.includes('prohibited')
    ) {
      return {
        classification: 'GOVERNANCE_BLOCKING',
        retryable: false,
        severity: 'HIGH',
        suggestedAction: 'Block mutation, stage evidence in Decision Queue for Project Lead human review.'
      };
    }

    // 4. Transient / Network / Rate-Limit Failures (Retryable)
    if (
      message.includes('timeout') ||
      message.includes('429') ||
      message.includes('rate limit') ||
      message.includes('econnreset') ||
      message.includes('network') ||
      message.includes('etimedout')
    ) {
      return {
        classification: 'TRANSIENT',
        retryable: true,
        severity: 'MEDIUM',
        suggestedAction: 'Apply bounded exponential backoff retry with jitter (max 3 attempts).'
      };
    }

    // 5. Permanent Non-Retryable Client / Contract Failures
    if (
      message.includes('syntax') ||
      message.includes('invalid argument') ||
      message.includes('not found') ||
      message.includes('malformed')
    ) {
      return {
        classification: 'NON_RETRYABLE',
        retryable: false,
        severity: 'LOW',
        suggestedAction: 'Reject request without retry; provide error diff to caller.'
      };
    }

    // 6. Unknown Failures (Invariant: Unknown failures must not automatically be treated as safe)
    return {
      classification: 'UNKNOWN',
      retryable: false,
      severity: 'HIGH',
      suggestedAction: 'Treat failure as potentially unsafe; contain execution and escalate for diagnostic review.'
    };
  }

  /**
   * Contains a failure by preventing cascading damage, preserving state and evidence.
   */
  public containFailure(
    error: any,
    projectId: string,
    context: Record<string, unknown>
  ): {
    contained: boolean;
    safeModeTriggered: boolean;
    alertGenerated: boolean;
    suggestedRecovery: string;
  } {
    const classification = this.classifyFailure(error, context);

    // Record audit of failure containment
    storage.recordAudit({
      actorId: (context.actorId as string) || 'system-resilience',
      actorRole: 'OPERATIONS',
      action: 'FAILURE_CONTAINED',
      targetEntity: 'SystemResilience',
      targetId: projectId,
      projectId,
      afterState: {
        classification: classification.classification,
        retryable: classification.retryable,
        severity: classification.severity,
        error: error?.message || String(error)
      },
      correlationId: `corr-fail-${Date.now()}`
    });

    let safeModeTriggered = false;

    // Invariant: Trigger safe mode on critical security or data integrity failure
    if (
      classification.classification === 'SECURITY_CRITICAL' ||
      classification.classification === 'DATA_INTEGRITY_CRITICAL'
    ) {
      storage.setDegradationLevel(
        projectId,
        'SAFE_MODE',
        `Automatic containment triggered by ${classification.classification}: ${error?.message || 'Critical anomaly'}`,
        'system-resilience',
        'SECURITY'
      );
      safeModeTriggered = true;
    }

    return {
      contained: true,
      safeModeTriggered,
      alertGenerated: true,
      suggestedRecovery: classification.suggestedAction
    };
  }

  /**
   * Evaluates if an operation is permitted under the current system degradation level.
   */
  public isOperationPermitted(
    projectId: string,
    operationType: 'READ' | 'WRITE' | 'AUTONOMOUS_EXECUTION' | 'DEPLOYMENT' | 'ADMIN'
  ): { permitted: boolean; reason?: string } {
    const level = storage.getDegradationLevel(projectId);

    if (level === 'OFFLINE') {
      return { permitted: false, reason: 'System is completely OFFLINE for emergency maintenance.' };
    }

    if (level === 'SAFE_MODE') {
      if (operationType === 'AUTONOMOUS_EXECUTION' || operationType === 'DEPLOYMENT') {
        return {
          permitted: false,
          reason: 'Autonomous execution and deployments are blocked in SAFE_MODE. Human inspection and recovery permitted.'
        };
      }
      return { permitted: true };
    }

    if (level === 'READ_ONLY') {
      if (operationType !== 'READ') {
        return { permitted: false, reason: 'System is in READ_ONLY mode. State mutations are restricted.' };
      }
      return { permitted: true };
    }

    if (level === 'SEVERELY_DEGRADED') {
      if (operationType === 'DEPLOYMENT') {
        return { permitted: false, reason: 'Production deployments are disabled while system is SEVERELY_DEGRADED.' };
      }
    }

    return { permitted: true };
  }
}

export const failureEngine = new FailureEngine();
