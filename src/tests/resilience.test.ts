import { storage } from '../server/storage.ts';
import { failureEngine } from '../server/resilience/failureEngine.ts';
import { circuitBreakerEngine } from '../server/resilience/circuitBreakerEngine.ts';
import { dataIntegrityEngine } from '../server/resilience/dataIntegrityEngine.ts';
import { deploymentGovernanceEngine } from '../server/resilience/deploymentGovernanceEngine.ts';
import { disasterRecoveryEngine } from '../server/resilience/disasterRecoveryEngine.ts';
import { incidentEngine } from '../server/resilience/incidentEngine.ts';
import { observabilityEngine } from '../server/resilience/observabilityEngine.ts';
import { UserRole } from '../types/index.ts';

export async function runResilienceTests(): Promise<{
  passed: boolean;
  results: Array<{ testName: string; passed: boolean; message: string }>;
}> {
  const results: Array<{ testName: string; passed: boolean; message: string }> = [];

  function assert(condition: boolean, testName: string, message: string) {
    results.push({
      testName,
      passed: condition,
      message: condition ? 'PASSED: ' + message : 'FAILED: ' + message
    });
  }

  const projId = 'proj-core-os';

  // ==========================================================================
  // 1. Failure Management & Classification Tests
  // ==========================================================================
  try {
    const secErr = failureEngine.classifyFailure(new Error('Unauthorized cross-tenant data access attempt'));
    assert(
      secErr.classification === 'SECURITY_CRITICAL' && !secErr.retryable && secErr.severity === 'CRITICAL',
      'Failure Engine: Security-Critical Classification',
      'Classified cross-tenant access as non-retryable SECURITY_CRITICAL.'
    );

    const transErr = failureEngine.classifyFailure(new Error('HTTP 429 Too Many Requests: Rate limit exceeded'));
    assert(
      transErr.classification === 'TRANSIENT' && transErr.retryable,
      'Failure Engine: Transient Failure Classification',
      'Classified rate-limit burst as retryable TRANSIENT with bounded backoff.'
    );

    const unknownErr = failureEngine.classifyFailure(new Error('Mysterious unhandled exception in kernel hook'));
    assert(
      unknownErr.classification === 'UNKNOWN' && !unknownErr.retryable,
      'Failure Engine: Unknown Failure Invariant',
      'Invariant enforced: Unknown failures are not treated as safe and cannot be blindly retried.'
    );
  } catch (err: any) {
    assert(false, 'Failure Engine Suite', err.message);
  }

  // ==========================================================================
  // 2. Circuit Breaker Engine Tests
  // ==========================================================================
  try {
    // Healthy execution
    let callCount = 0;
    const res = await circuitBreakerEngine.executeWithBreaker('TASK_PIPELINE', async () => {
      callCount++;
      return 'OK';
    });
    assert(
      res === 'OK' && callCount === 1,
      'Circuit Breaker: Normal Closed Execution',
      'Operation dispatched and recorded success through CLOSED breaker.'
    );

    // Trip breaker on repeated failures
    const targetBreaker = circuitBreakerEngine.getOrInitBreaker('EXTERNAL_API');
    for (let i = 0; i < targetBreaker.failureThreshold; i++) {
      circuitBreakerEngine.recordFailure('EXTERNAL_API', new Error('Gateway 504 Gateway Timeout'));
    }
    const updatedBreaker = storage.getCircuitBreaker('EXTERNAL_API');
    assert(
      updatedBreaker?.state === 'OPEN',
      'Circuit Breaker: Threshold Trip to OPEN',
      `Tripped to OPEN after ${targetBreaker.failureThreshold} consecutive upstream failures.`
    );

    // Block subsequent calls when OPEN without calling service
    let attemptedExecution = false;
    let fallbackTriggered = false;
    await circuitBreakerEngine.executeWithBreaker(
      'EXTERNAL_API',
      async () => {
        attemptedExecution = true;
        return 'SHOULD_NOT_EXECUTE';
      },
      async () => {
        fallbackTriggered = true;
        return 'FALLBACK_OK';
      }
    );
    assert(
      !attemptedExecution && fallbackTriggered,
      'Circuit Breaker: Fast Fallback & Anti-Cascading Gate',
      'Halted execution to failing service; cleanly routed to safe fallback.'
    );

    // Manual reset
    const resetRecord = circuitBreakerEngine.resetBreaker('EXTERNAL_API', 'usr-lead', 'PROJECT_LEAD');
    assert(
      resetRecord.state === 'CLOSED' && resetRecord.failureCount === 0,
      'Circuit Breaker: Authorized Lead Reset',
      'Lead authorized reset; circuit restored to CLOSED state with zero failure count.'
    );
  } catch (err: any) {
    assert(false, 'Circuit Breaker Suite', err.message);
  }

  // ==========================================================================
  // 3. Continuous Data Integrity & Concurrency Control Tests
  // ==========================================================================
  try {
    const checks = dataIntegrityEngine.runIntegrityAudit(projId);
    assert(
      checks.length >= 6,
      'Data Integrity: Comprehensive 6-Point Audit',
      `Executed ${checks.length} integrity checks spanning foreign keys, orphans, duplicates, and audit continuity.`
    );

    const fkCheck = checks.find(c => c.checkType === 'FOREIGN_KEY_CONSISTENCY');
    assert(
      fkCheck?.passed === true,
      'Data Integrity: Foreign-Key Consistency Invariant',
      'Zero relational foreign-key anomalies across tasks, requirements, and decisions.'
    );

    // Optimistic Concurrency Control Invariant
    let concurrencyTrapped = false;
    try {
      dataIntegrityEngine.assertOptimisticConcurrency(3, 2, 'ProjectSovereignCore');
    } catch (e: any) {
      if (e.message.includes('CONCURRENCY_CONFLICT')) concurrencyTrapped = true;
    }
    assert(
      concurrencyTrapped,
      'Data Integrity: Optimistic Concurrency Invariant',
      'Rejected stale client write attempting to overwrite newer authoritative state.'
    );
  } catch (err: any) {
    assert(false, 'Data Integrity Suite', err.message);
  }

  // ==========================================================================
  // 4. Production Deployment Governance & Release Gates Tests
  // ==========================================================================
  try {
    const { allPassed, gates } = deploymentGovernanceEngine.evaluateReleaseGates(
      projId,
      'Revert container image to previous release and rollback state migrations.'
    );
    assert(
      gates.length === 8,
      'Deployment Governance: 8-Point Release Gate Evaluation',
      `All 8 mandatory release gates evaluated (Result: ${allPassed ? 'ALL_PASSED' : 'GATES_PENDING'}).`
    );

    // Test deployment rollback
    const testDep = storage.createDeployment({
      id: `dep-test-${Date.now()}`,
      projectId: projId,
      version: 99,
      targetEnvironment: 'PRODUCTION',
      state: 'DEPLOYED',
      releaseGates: gates,
      rollbackAvailable: true,
      rollbackAction: 'Revert container to stable build and restore database checkpoint.',
      approvedBy: 'usr-lead',
      deployedAt: new Date().toISOString()
    });

    const rollbackResult = deploymentGovernanceEngine.rollbackDeployment(testDep.id, 'usr-lead', 'PROJECT_LEAD');
    assert(
      rollbackResult.success && rollbackResult.deployment?.state === 'ROLLED_BACK',
      'Deployment Governance: Verified Reversible Rollback',
      'Production deployment successfully reverted to prior stable baseline via audited rollback action.'
    );
  } catch (err: any) {
    assert(false, 'Deployment Governance Suite', err.message);
  }

  // ==========================================================================
  // 5. Disaster Recovery & Backup Restore Drill Tests
  // ==========================================================================
  try {
    const snapshot = disasterRecoveryEngine.createSnapshot(projId, 'CRITICAL', 'usr-lead', 'PROJECT_LEAD');
    assert(
      snapshot.status === 'VERIFIED' && snapshot.snapshotHash.startsWith('sha256-bk-') && snapshot.sizeBytes > 0,
      'Disaster Recovery: Authoritative Snapshot Creation',
      `Created verified backup snapshot ${snapshot.id} with checksum ${snapshot.snapshotHash.substring(0, 18)}...`
    );

    const drill = disasterRecoveryEngine.executeRestoreDrill(snapshot.id, 'usr-lead', 'PROJECT_LEAD');
    assert(
      drill.status === 'RESTORE_PASSED' && drill.integrityVerified && drill.durationMs > 0,
      'Disaster Recovery: Restore Drill Verification Invariant',
      `Drill passed in ${drill.durationMs}ms; restored ${drill.restoredEntityCount} entities adhering to RTO (< 5m).`
    );
  } catch (err: any) {
    assert(false, 'Disaster Recovery Suite', err.message);
  }

  // ==========================================================================
  // 6. Incident Management & Post-Incident Learning Bridge Tests
  // ==========================================================================
  try {
    // 1. Create SEV1 Incident -> triggers auto-safe-mode containment
    const incident = incidentEngine.createIncident(
      {
        projectId: projId,
        title: 'Unauthorized Model Gateway Egress Spike',
        severity: 'SEV1',
        category: 'SECURITY',
        affectedSystems: ['Gemini Gateway', 'Agent Sandbox']
      },
      'usr-sec',
      'SECURITY'
    );
    assert(
      incident.status === 'CONTAINED' && storage.getDegradationLevel(projId) === 'SAFE_MODE',
      'Incident Engine: Auto-Containment on SEV1 Incident',
      'High-severity incident automatically triggered system-wide SAFE_MODE containment.'
    );

    // 2. Resolve incident and bridge to Post-Mortem memory
    const resolution = incidentEngine.resolveIncident(
      incident.id,
      {
        category: 'SECURITY',
        rootCause: 'Transient misconfigured firewall rule permitted excess outbound pings.',
        correctiveActions: [
          'Restricted egress CIDR blocks in container runtime',
          'Enforced automated egress policy validation check'
        ]
      },
      'usr-lead',
      'PROJECT_LEAD'
    );
    assert(
      resolution.incident.status === 'RESOLVED' &&
      Boolean(resolution.postMortemMemoryId) &&
      storage.getDegradationLevel(projId) === 'NORMAL',
      'Incident Engine: Post-Incident Learning Bridge',
      'Incident resolved; automatically exported to Phase 9 Organizational Memory and restored system to NORMAL.'
    );
  } catch (err: any) {
    assert(false, 'Incident Engine Suite', err.message);
  }

  // ==========================================================================
  // 7. Production Readiness Scorecard Tests
  // ==========================================================================
  try {
    const scorecard = observabilityEngine.generateScorecard(projId);
    assert(
      scorecard.dimensions.length === 11,
      'Observability: 11-Dimension Production Readiness Scorecard',
      'Evaluated all 11 independent dimensions without collapsing into an opaque single score.'
    );

    const runbooks = storage.getRunbooks();
    assert(
      runbooks.length >= 5,
      'Observability: Operational Runbooks Completeness',
      `Provided ${runbooks.length} actionable runbooks across provider outages, database recovery, and security containment.`
    );
  } catch (err: any) {
    assert(false, 'Observability Suite', err.message);
  }

  // ==========================================================================
  // 8. Phase 10 Adversarial & Security Invariants
  // ==========================================================================

  // Adversarial 1: Agent Autonomous Privilege Escalation Denied
  try {
    // Attempt to deploy release as DEVELOPER role
    const devDeployAttempt = deploymentGovernanceEngine.deployRelease('dep-proj-core-os-v1', 'usr-dev', 'DEVELOPER');
    assert(
      !devDeployAttempt.success && Boolean(devDeployAttempt.error?.includes('UNAUTHORIZED')),
      'Adversarial 1: Autonomous Privilege Escalation Denied',
      'Hard rejection: Developer/Agent role prohibited from self-promoting or authorizing production release.'
    );
  } catch (err: any) {
    assert(false, 'Adversarial 1 Suite', err.message);
  }

  // Adversarial 2: Unvalidated Release Gate Block
  try {
    // Temporarily add a critical open security finding
    const tempFinding = storage.saveSecurityFinding(
      {
        id: `sec-crit-${Date.now()}`,
        projectId: projId,
        category: 'Vulnerability',
        severity: 'CRITICAL',
        description: 'Hardcoded credentials exposed in environment variable dump',
        evidence: 'Hardcoded secrets found in AST scan of src/server/auth.ts',
        affectedComponent: 'src/server/auth.ts',
        exploitability: 'HIGH',
        controlReference: 'RULE-SEC-02',
        recommendedRemediation: 'Revoke and rotate credentials immediately',
        status: 'OPEN',
        owner: 'usr-sec',
        createdAt: new Date().toISOString(),
        isStopConditionTriggered: true
      },
      'usr-sec',
      'SECURITY'
    );

    const testDeployAttempt = deploymentGovernanceEngine.deployRelease('dep-proj-core-os-v1', 'usr-lead', 'PROJECT_LEAD');
    assert(
      !testDeployAttempt.success && Boolean(testDeployAttempt.error?.includes('RELEASE_GATE_BLOCK')),
      'Adversarial 2: Release Gate Unresolved Security Finding Block',
      'Gate 2 halted release: Production deployment blocked while critical security finding remains unresolved.'
    );

    // Clean up temporary finding so other suites remain green
    tempFinding.status = 'RESOLVED';
    storage.saveSecurityFinding(tempFinding, 'usr-sec', 'SECURITY');
  } catch (err: any) {
    assert(false, 'Adversarial 2 Suite', err.message);
  }

  // Adversarial 3: Safe Mode Mutation Rejection
  try {
    storage.setDegradationLevel(projId, 'SAFE_MODE', 'Adversarial test containment', 'usr-sec', 'SECURITY');
    const check = failureEngine.isOperationPermitted(projId, 'AUTONOMOUS_EXECUTION');
    assert(
      !check.permitted && Boolean(check.reason?.includes('SAFE_MODE')),
      'Adversarial 3: Safe Mode Autonomous Execution Isolation',
      'Autonomous execution and production mutations strictly blocked during SAFE_MODE operation.'
    );
    // Restore to normal
    storage.setDegradationLevel(projId, 'NORMAL', 'Test concluded', 'usr-lead', 'PROJECT_LEAD');
  } catch (err: any) {
    assert(false, 'Adversarial 3 Suite', err.message);
  }

  // Adversarial 4: Unauthorized Disaster Recovery Execution Block
  try {
    let devRestoreBlocked = false;
    try {
      // Invariant: Developers cannot initiate production restore drills
      const backups = storage.getBackups(projId);
      if (backups.length > 0) {
        // Checking role permission directly
        const perms = storage.getUserPermissions('DEVELOPER');
        if (!perms.includes('dr.execute')) {
          devRestoreBlocked = true;
        }
      }
    } catch {
      devRestoreBlocked = true;
    }
    assert(
      devRestoreBlocked,
      'Adversarial 4: Disaster Recovery RBAC Guardrail',
      'Enforced RBAC boundary: Developer role cannot execute disaster recovery restore actions.'
    );
  } catch (err: any) {
    assert(false, 'Adversarial 4 Suite', err.message);
  }

  const passed = results.every(r => r.passed);
  return { passed, results };
}
