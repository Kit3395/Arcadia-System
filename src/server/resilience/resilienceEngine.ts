import { failureEngine } from './failureEngine.ts';
import { circuitBreakerEngine } from './circuitBreakerEngine.ts';
import { dataIntegrityEngine } from './dataIntegrityEngine.ts';
import { deploymentGovernanceEngine } from './deploymentGovernanceEngine.ts';
import { disasterRecoveryEngine } from './disasterRecoveryEngine.ts';
import { incidentEngine } from './incidentEngine.ts';
import { observabilityEngine } from './observabilityEngine.ts';

export class ResilienceEngine {
  public readonly failure = failureEngine;
  public readonly circuitBreaker = circuitBreakerEngine;
  public readonly dataIntegrity = dataIntegrityEngine;
  public readonly deployment = deploymentGovernanceEngine;
  public readonly disasterRecovery = disasterRecoveryEngine;
  public readonly incident = incidentEngine;
  public readonly observability = observabilityEngine;
}

export const resilienceEngine = new ResilienceEngine();
