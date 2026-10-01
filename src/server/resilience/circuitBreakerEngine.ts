import { storage } from '../storage.ts';
import {
  CircuitBreakerTarget,
  CircuitBreakerState,
  CircuitBreakerRecord,
  UserRole
} from '../../types/index.ts';

export class CircuitBreakerEngine {
  /**
   * Executes a given operation through the target circuit breaker.
   * If the breaker is OPEN, throws or executes fallback without invoking the failing service.
   */
  public async executeWithBreaker<T>(
    target: CircuitBreakerTarget,
    operation: () => Promise<T>,
    fallback?: (error?: any) => Promise<T>
  ): Promise<T> {
    const breaker = this.getOrInitBreaker(target);

    // Check if breaker is currently OPEN
    if (breaker.state === 'OPEN') {
      const now = Date.now();
      const lastTripped = breaker.lastTrippedTime ? new Date(breaker.lastTrippedTime).getTime() : 0;

      // Check if timeout elapsed to transition to HALF_OPEN
      if (now - lastTripped > breaker.resetTimeoutMs) {
        breaker.state = 'HALF_OPEN';
        breaker.auditNotes = `Reset timeout (${breaker.resetTimeoutMs}ms) elapsed; entering HALF_OPEN trial.`;
        storage.updateCircuitBreaker(breaker);
      } else {
        if (fallback) {
          return await fallback(new Error(`Circuit breaker for ${target} is OPEN (cooldown active).`));
        }
        throw new Error(
          `Circuit breaker for ${target} is OPEN. Calls halted to prevent cascading failure. Retry after cooldown.`
        );
      }
    }

    try {
      const result = await operation();
      this.recordSuccess(target);
      return result;
    } catch (err: any) {
      this.recordFailure(target, err);
      if (fallback) {
        return await fallback(err);
      }
      throw err;
    }
  }

  public recordSuccess(target: CircuitBreakerTarget): void {
    const breaker = this.getOrInitBreaker(target);
    breaker.lastSuccessTime = new Date().toISOString();

    if (breaker.state === 'HALF_OPEN') {
      breaker.state = 'CLOSED';
      breaker.failureCount = 0;
      breaker.auditNotes = 'Trial call succeeded in HALF_OPEN; circuit breaker restored to CLOSED.';
      storage.updateCircuitBreaker(breaker);
    } else if (breaker.failureCount > 0) {
      breaker.failureCount = 0;
      storage.updateCircuitBreaker(breaker);
    }
  }

  public recordFailure(target: CircuitBreakerTarget, error: any): void {
    const breaker = this.getOrInitBreaker(target);
    breaker.failureCount++;
    breaker.lastFailureTime = new Date().toISOString();

    if (breaker.state === 'HALF_OPEN' || breaker.failureCount >= breaker.failureThreshold) {
      this.tripBreaker(
        target,
        `Consecutive failures (${breaker.failureCount}/${breaker.failureThreshold}) exceeded safety threshold: ${error?.message || String(error)}`
      );
    } else {
      storage.updateCircuitBreaker(breaker);
    }
  }

  public tripBreaker(target: CircuitBreakerTarget, reason: string): CircuitBreakerRecord {
    const breaker = this.getOrInitBreaker(target);
    breaker.state = 'OPEN';
    breaker.lastTrippedTime = new Date().toISOString();
    breaker.auditNotes = `Breaker TRIPPED: ${reason}`;
    storage.updateCircuitBreaker(breaker);

    storage.recordAudit({
      actorId: 'circuit-breaker-engine',
      actorRole: 'OPERATIONS',
      action: 'CIRCUIT_BREAKER_TRIPPED',
      targetEntity: 'CircuitBreaker',
      targetId: target,
      afterState: { target, state: 'OPEN', reason, failureCount: breaker.failureCount },
      correlationId: `corr-cb-${Date.now()}`
    });

    return breaker;
  }

  public resetBreaker(target: CircuitBreakerTarget, actorId: string = 'system', actorRole: UserRole = 'OPERATIONS'): CircuitBreakerRecord {
    const breaker = this.getOrInitBreaker(target);
    const priorState = breaker.state;
    breaker.state = 'CLOSED';
    breaker.failureCount = 0;
    breaker.auditNotes = `Breaker manually reset to CLOSED by ${actorId} (${actorRole}).`;
    storage.updateCircuitBreaker(breaker);

    storage.recordAudit({
      actorId,
      actorRole,
      action: 'CIRCUIT_BREAKER_RESET',
      targetEntity: 'CircuitBreaker',
      targetId: target,
      beforeState: { state: priorState },
      afterState: { state: 'CLOSED', failureCount: 0 },
      correlationId: `corr-cb-reset-${Date.now()}`
    });

    return breaker;
  }

  public getOrInitBreaker(target: CircuitBreakerTarget): CircuitBreakerRecord {
    let breaker = storage.getCircuitBreaker(target);
    if (!breaker) {
      breaker = {
        target,
        state: 'CLOSED',
        failureCount: 0,
        failureThreshold: target === 'AI_PROVIDER' ? 3 : 5,
        resetTimeoutMs: 30000,
        auditNotes: 'Initialized in CLOSED healthy state.'
      };
      storage.updateCircuitBreaker(breaker);
    }
    return breaker;
  }
}

export const circuitBreakerEngine = new CircuitBreakerEngine();
