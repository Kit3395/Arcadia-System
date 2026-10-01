/**
 * ARCADIA SYSTEM - PHASE 7: VALIDATION, SECURITY & DRIFT INTELLIGENCE
 * Invariant Verification & Adversarial Test Suite
 */

import { storage } from '../server/storage.ts';
import { validationEngine } from '../server/validation/validationEngine.ts';
import { securityEngine } from '../server/validation/securityEngine.ts';
import { driftEngine } from '../server/validation/driftEngine.ts';
import { regressionEngine } from '../server/validation/regressionEngine.ts';
import { User, UniversalTaskSpecification, ExecutionEvidence, Project } from '../types/index.ts';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

export async function runValidationTests(): Promise<{ passed: boolean; results: TestResult[] }> {
  const results: TestResult[] = [];
  const suite = 'Phase 7: Validation, Security & Drift Intelligence';

  const testOrgId = 'org-arcadia-demo';
  const testProjId = 'proj-core-os';

  const leadUser: User = storage.getUser('usr-lead') || {
    id: 'usr-lead',
    organizationId: testOrgId,
    email: 'lead@arcadia.dev',
    fullName: 'Dr. Evelyn Vance',
    role: 'PROJECT_LEAD',
    createdAt: new Date().toISOString()
  };

  const devUser: User = storage.getUser('usr-dev') || {
    id: 'usr-dev',
    organizationId: testOrgId,
    email: 'dev@arcadia.dev',
    fullName: 'Marcus Chen',
    role: 'DEVELOPER',
    createdAt: new Date().toISOString()
  };

  const secUser: User = {
    id: 'usr-sec',
    organizationId: testOrgId,
    email: 'sec@arcadia.dev',
    fullName: 'Sarah Connor',
    role: 'SECURITY',
    createdAt: new Date().toISOString()
  };

  const project: Project = storage.getProject(testProjId, testOrgId) || {
    id: testProjId,
    organizationId: testOrgId,
    name: 'Arcadia Core OS',
    slug: 'arcadia-core-os',
    description: 'Autonomous Operating System Core',
    complexityLevel: 'L2',
    primaryState: 'VALIDATION',
    governanceState: 'CLEAR',
    securityState: 'CLEAR',
    driftState: 'ALIGNED',
    timelineState: 'ON_TRACK',
    cognitiveLoadState: 'NORMAL',
    currentVersion: 1,
    ownerId: leadUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Helper baseline task
  const baselineTask: UniversalTaskSpecification = {
    taskId: 'tsk-val-test-01',
    taskIdentifier: 'TSK-VAL-01',
    projectId: testProjId,
    title: 'Implement Validation Gate Enforcement',
    objective: 'Ensure no unverified code can be promoted to authoritative state.',
    complexity: 'MEDIUM',
    state: 'RUNNING',
    requirementsSatisfied: ['REQ-VAL-01'],
    dependencies: [],
    allowedActions: ['FILE_EDIT', 'RUN_TEST'],
    prohibitedActions: ['BYPASS_VALIDATION'],
    architectureSlice: {
      relevantModules: ['src/server/validation/'],
      contractsToPreserve: ['ValidationContract']
    },
    relevantFiles: [
      { path: 'src/server/validation/validationEngine.ts', readOnly: false },
      { path: 'src/types/index.ts', readOnly: true }
    ],
    acceptanceCriteria: [
      'Evidence required before validation passes',
      'All 7 gates evaluated in sequence'
    ],
    validationRequirements: {
      mandatoryTests: ['src/tests/validation.test.ts'],
      staticChecks: ['TYPESCRIPT'],
      maxExecutionTimeMs: 15000
    },
    stopConditions: ['Zero secret leakage', 'Zero scope breach'],
    escalationConditions: ['Critical security finding'],
    assignedAgentId: 'agent-gemini-2.5-pro',
    retryCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Ensure requirement REQ-VAL-01 exists for testing
  const existingReqs = storage.getRequirements(testProjId);
  if (!existingReqs.some(r => r.reqIdentifier === 'REQ-VAL-01' || (r as any).reqId === 'REQ-VAL-01')) {
    storage.createRequirement(
      testProjId,
      testOrgId,
      {
        reqIdentifier: 'REQ-VAL-01',
        description: 'System must assert requirements, scope, tests, and security before promotion.',
        source: 'CLIENT_REQUEST',
        classification: 'REQUEST',
        status: 'APPROVED',
        confidenceScore: 0.99,
        affectedComponents: ['src/server/validation/']
      },
      leadUser,
      'corr-init-req'
    );
  }

  // 1. VAL-01: Claim -> Evidence -> Validation Rule (No Evidence = Blocked)
  try {
    const contract = validationEngine.runValidationPipeline(
      project,
      baselineTask,
      undefined,
      undefined, // Missing evidence!
      leadUser.id,
      leadUser.role
    );

    if (contract.status !== 'FAILED' && contract.status !== 'BLOCKED') {
      throw new Error(`Expected contract to fail without evidence, got: ${contract.status}`);
    }

    const missingEv = contract.failures.find(f => f.whatFailed.includes('Evidence Missing'));
    if (!missingEv || missingEv.severity !== 'CRITICAL') {
      throw new Error('Expected CRITICAL failure for missing execution evidence.');
    }

    results.push({
      suite,
      name: 'VAL-01: Claim -> Evidence Pipeline (Missing Evidence Trapping)',
      passed: true,
      details: 'Validated that agent claims without authoritative evidence are immediately blocked.'
    });
  } catch (err: any) {
    results.push({
      suite,
      name: 'VAL-01: Claim -> Evidence Pipeline (Missing Evidence Trapping)',
      passed: false,
      error: err.message
    });
  }

  // 2. VAL-02: 7-Gate Validation Pipeline Execution with Clean Evidence
  try {
    const cleanEvidence: ExecutionEvidence = {
      executionId: 'exec-clean-001',
      agentId: 'agent-gemini-2.5-pro',
      timestamp: new Date().toISOString(),
      changedFiles: [
        {
          path: 'src/server/validation/validationEngine.ts',
          diff: '+ export function validateEverything() { return true; }',
          astVerified: true
        }
      ],
      testResults: [
        { suite: 'ValidationSuite', testName: 'GateCheck', passed: true }
      ],
      lintResults: { clean: true, errorCount: 0, warningCount: 0 },
      agentOutput: 'Successfully implemented validation contract handlers with zero errors.',
      agentReasoningSummary: 'Executed strictly within task boundaries.'
    };

    const contract = validationEngine.runValidationPipeline(
      project,
      baselineTask,
      undefined,
      cleanEvidence,
      leadUser.id,
      leadUser.role
    );

    if (contract.gates.length !== 7) {
      throw new Error(`Expected 7 validation gates, found ${contract.gates.length}`);
    }

    if (contract.status !== 'PASSED') {
      throw new Error(`Expected clean validation contract to PASS, got: ${contract.status}. Failures: ${JSON.stringify(contract.failures)}`);
    }

    if (contract.proofOfCompletion !== 'VALIDATED') {
      throw new Error(`Expected proofOfCompletion to be 'VALIDATED', got: ${contract.proofOfCompletion}`);
    }

    results.push({
      suite,
      name: 'VAL-02: 7-Gate Operational Lifecycle Execution',
      passed: true,
      details: 'All 7 validation gates executed and passed with structured evidence notes.'
    });
  } catch (err: any) {
    results.push({
      suite,
      name: 'VAL-02: 7-Gate Operational Lifecycle Execution',
      passed: false,
      error: err.message
    });
  }

  // 3. VAL-03: Scope Lock Boundary Trapping in Gate 2
  try {
    // Add task to storage to enable storage.verifyTaskScope
    storage.saveTask(testProjId, baselineTask, leadUser, 'corr-val-scope');

    const outOfScopeEvidence: ExecutionEvidence = {
      executionId: 'exec-scope-breach-001',
      agentId: 'agent-gemini-2.5-pro',
      timestamp: new Date().toISOString(),
      changedFiles: [
        {
          path: 'src/server/storage.ts', // NOT in baselineTask.relevantFiles!
          diff: '+ export const rogueVar = true;',
          astVerified: false
        }
      ],
      testResults: [
        { suite: 'ValidationSuite', testName: 'ScopeCheck', passed: true }
      ],
      lintResults: { clean: true, errorCount: 0, warningCount: 0 },
      agentOutput: 'Modified storage directly.',
      agentReasoningSummary: 'Needed extra store'
    };

    const contract = validationEngine.runValidationPipeline(
      project,
      baselineTask,
      undefined,
      outOfScopeEvidence,
      leadUser.id,
      leadUser.role
    );

    const gate2 = contract.gates.find(g => g.order === 2);
    if (!gate2 || gate2.passed) {
      throw new Error('Gate 2 (Scope Lock) should have failed on unlisted file modification.');
    }

    const scopeFailure = contract.failures.find(f => f.category === 'SCOPE');
    if (!scopeFailure || scopeFailure.severity !== 'CRITICAL') {
      throw new Error('Expected CRITICAL Scope Lock violation failure.');
    }

    results.push({
      suite,
      name: 'VAL-03: Scope Lock Boundary Trapping in Gate 2',
      passed: true,
      details: 'Gate 2 properly blocked unauthorized file modification outside declared boundary.'
    });
  } catch (err: any) {
    results.push({
      suite,
      name: 'VAL-03: Scope Lock Boundary Trapping in Gate 2',
      passed: false,
      error: err.message
    });
  }

  // 4. SEC-01: Stop Condition Trapping (Secret Leakage)
  try {
    const secretLeakEvidence: ExecutionEvidence = {
      executionId: 'exec-sec-leak-001',
      agentId: 'agent-gemini-2.5-pro',
      timestamp: new Date().toISOString(),
      changedFiles: [
        {
          path: 'src/server/validation/validationEngine.ts',
          diff: '+ const api_key = "AIzaSyD-1234567890abcdefghijklmnopqrstuv";',
          astVerified: false
        }
      ],
      testResults: [],
      lintResults: { clean: true, errorCount: 0, warningCount: 0 },
      agentOutput: 'Configured secret key in code',
      agentReasoningSummary: 'Hardcoded key'
    };

    const secScan = securityEngine.scanExecution(project, baselineTask, secretLeakEvidence);

    if (secScan.passed) {
      throw new Error('Security scan should have failed due to secret leakage.');
    }

    if (!secScan.stopConditionTriggered || secScan.stopCondition !== 'SECRET_LEAKAGE') {
      throw new Error(`Expected SECRET_LEAKAGE stop condition, got: ${secScan.stopCondition}`);
    }

    const finding = secScan.findings.find(f => f.category === 'Secret Leakage');
    if (!finding || finding.severity !== 'CRITICAL') {
      throw new Error('Expected CRITICAL severity for Secret Leakage finding.');
    }

    results.push({
      suite,
      name: 'SEC-01: Stop Condition Trapping (Secret Leakage)',
      passed: true,
      details: 'Identified hardcoded API key and raised CRITICAL Stop Condition finding.'
    });
  } catch (err: any) {
    results.push({
      suite,
      name: 'SEC-01: Stop Condition Trapping (Secret Leakage)',
      passed: false,
      error: err.message
    });
  }

  // 5. SEC-02: Non-Developer Self-Certification Invariant
  try {
    const findingId = `sec-test-finding-${Date.now()}`;
    storage.saveSecurityFinding({
      id: findingId,
      projectId: testProjId,
      taskId: baselineTask.taskId,
      category: 'Input Validation',
      severity: 'HIGH',
      description: 'Test vulnerability finding for role resolution verification.',
      evidence: 'Missing parameter sanitization',
      affectedComponent: 'src/server/api.ts',
      exploitability: 'HIGH',
      controlReference: 'RULE-SEC-01',
      recommendedRemediation: 'Add schema sanitization',
      status: 'OPEN',
      owner: 'usr-dev',
      createdAt: new Date().toISOString(),
      isStopConditionTriggered: false
    }, 'SECURITY_TEST', 'SECURITY');

    // Attempt resolution as DEVELOPER (must fail!)
    let devResolutionBlocked = false;
    try {
      storage.updateSecurityFindingStatus(findingId, testProjId, 'RESOLVED', devUser, 'I fixed this myself');
    } catch (e: any) {
      devResolutionBlocked = true;
    }

    if (!devResolutionBlocked) {
      throw new Error('Invariant violation: Developer was able to resolve their own security finding!');
    }

    // Resolution as PROJECT_LEAD (must succeed!)
    const resolvedByLead = storage.updateSecurityFindingStatus(
      findingId,
      testProjId,
      'RESOLVED',
      leadUser,
      'Verified with security team and reviewed test cases.'
    );

    if (resolvedByLead.status !== 'RESOLVED' || resolvedByLead.resolvedByRole !== 'PROJECT_LEAD') {
      throw new Error('Project Lead failed to resolve security finding with audited notes.');
    }

    results.push({
      suite,
      name: 'SEC-02: Non-Developer Self-Certification Invariant',
      passed: true,
      details: 'Enforced that developers cannot self-certify security resolutions without Lead/Security sign-off.'
    });
  } catch (err: any) {
    results.push({
      suite,
      name: 'SEC-02: Non-Developer Self-Certification Invariant',
      passed: false,
      error: err.message
    });
  }

  // 6. SEC-03: Multi-Tenant Boundary Assertion
  try {
    const foreignTenantEvidence: ExecutionEvidence = {
      executionId: 'exec-sec-tenant-001',
      agentId: 'agent-gemini-2.5-pro',
      timestamp: new Date().toISOString(),
      changedFiles: [
        {
          path: 'src/server/validation/validationEngine.ts',
          diff: '+ const foreignOrg = "org-foreign-evil-corp-999";',
          astVerified: true
        }
      ],
      testResults: [],
      lintResults: { clean: true, errorCount: 0, warningCount: 0 },
      agentOutput: 'Accessing tenant org-foreign-evil-corp-999',
      agentReasoningSummary: 'Queried foreign tenant'
    };

    const secScan = securityEngine.scanExecution(project, baselineTask, foreignTenantEvidence);

    if (secScan.passed) {
      throw new Error('Security scan should have failed due to foreign tenant reference.');
    }

    if (!secScan.stopConditionTriggered || secScan.stopCondition !== 'CROSS_TENANT_EXPOSURE') {
      throw new Error(`Expected CROSS_TENANT_EXPOSURE stop condition, got: ${secScan.stopCondition}`);
    }

    results.push({
      suite,
      name: 'SEC-03: Multi-Tenant Boundary Trapping',
      passed: true,
      details: 'Trapped cross-tenant exposure and prevented multi-tenant leakage.'
    });
  } catch (err: any) {
    results.push({
      suite,
      name: 'SEC-03: Multi-Tenant Boundary Trapping',
      passed: false,
      error: err.message
    });
  }

  // 7. DRIFT-01: Requirement Drift Trapping (Rejected Requirement Implementation)
  try {
    // Create a rejected requirement
    const rejectedReqId = 'REQ-REJ-99';
    const createReqRes = storage.createRequirement(
      testProjId,
      testOrgId,
      {
        reqIdentifier: rejectedReqId,
        description: 'Explicitly rejected by Project Lead during Layer 2 review.',
        source: 'CLIENT_REQUEST',
        classification: 'REQUEST',
        status: 'PROPOSED',
        confidenceScore: 0.1,
        affectedComponents: ['src/db']
      },
      leadUser,
      'corr-rej-req'
    );
    if (createReqRes.requirement) {
      storage.updateRequirementStatus(
        testProjId,
        createReqRes.requirement.id,
        testOrgId,
        'REJECTED',
        leadUser,
        'corr-rej-status'
      );
    }

    // Create a task that attempts to implement this rejected requirement
    const rogueTask: UniversalTaskSpecification = {
      ...baselineTask,
      taskId: 'tsk-rogue-rej-01',
      title: 'Implement Rejected SQL Database',
      requirementsSatisfied: [rejectedReqId],
      state: 'RUNNING'
    };
    storage.saveTask(testProjId, rogueTask, leadUser, 'corr-save-rogue');

    // Run drift detection
    const driftResult = driftEngine.runDriftDetection(testProjId, leadUser.id, leadUser.role);

    const reqDrift = driftResult.records.find(d => 
      d.type === 'REQUIREMENT' && d.actualState.includes(rogueTask.taskId)
    );

    if (!reqDrift) {
      throw new Error('Expected drift detection to flag active task implementing rejected requirement.');
    }

    if (reqDrift.classification !== 'UNAUTHORIZED' || reqDrift.recommendedAction !== 'BLOCK_TASK') {
      throw new Error(`Expected UNAUTHORIZED classification and BLOCK_TASK action, got: ${reqDrift.classification}`);
    }

    results.push({
      suite,
      name: 'DRIFT-01: Requirement Drift Detection & Classification',
      passed: true,
      details: 'Flagged active task implementing rejected requirement as UNAUTHORIZED drift.'
    });
  } catch (err: any) {
    results.push({
      suite,
      name: 'DRIFT-01: Requirement Drift Detection & Classification',
      passed: false,
      error: err.message
    });
  }

  // 8. DRIFT-02: Governed Drift Classification & Resolution
  try {
    const driftRecord = storage.getDriftRecords(testProjId)[0];
    if (!driftRecord) {
      throw new Error('No drift records found in storage for resolution test.');
    }

    // Classify drift
    const classified = driftEngine.classifyDrift(
      driftRecord.id,
      testProjId,
      'AUTHORIZED',
      'ACCEPT_AS_AUTHORIZED',
      leadUser.id,
      leadUser.role
    );

    if (classified.status !== 'AUTHORIZED' || classified.classification !== 'AUTHORIZED') {
      throw new Error(`Failed to classify drift record as AUTHORIZED, status: ${classified.status}`);
    }

    // Resolve drift with audit notes
    const resolved = driftEngine.resolveDrift(
      driftRecord.id,
      testProjId,
      'ACCEPT_AS_AUTHORIZED',
      'Verified as harmless configuration delta by Project Lead.',
      leadUser.id,
      leadUser.role
    );

    if (resolved.status !== 'AUTHORIZED' || !resolved.resolution) {
      throw new Error('Drift record resolution failed to store audit notes.');
    }

    results.push({
      suite,
      name: 'DRIFT-02: Governed Drift Classification & Resolution',
      passed: true,
      details: 'Classified and resolved drift record through authorized Project Lead governance.'
    });
  } catch (err: any) {
    results.push({
      suite,
      name: 'DRIFT-02: Governed Drift Classification & Resolution',
      passed: false,
      error: err.message
    });
  }

  // 9. WAIVER-01: Governed Waiver Rules (CRITICAL unwaiverable, HIGH requires Lead)
  try {
    const contract = validationEngine.createContract(project, baselineTask);

    // Inject a CRITICAL failure and a HIGH failure
    const critFailId = `fail-crit-${Date.now()}`;
    const highFailId = `fail-high-${Date.now()}`;

    contract.failures = [
      {
        id: critFailId,
        category: 'SECURITY',
        whatFailed: 'Secret Leakage',
        expectedBehavior: 'No secrets',
        observedBehavior: 'Found secret',
        evidence: 'API_KEY exposed in diff',
        recommendedAction: 'Revoke and rotate secret',
        severity: 'CRITICAL',
        requiredAuthority: 'GOVERNANCE_APPROVED'
      },
      {
        id: highFailId,
        category: 'FUNCTIONAL',
        whatFailed: 'Non-blocking test timeout',
        expectedBehavior: 'Pass in 5s',
        observedBehavior: 'Took 6s',
        evidence: 'Execution timer: 6.2s',
        recommendedAction: 'Optimize test fixture',
        severity: 'HIGH',
        requiredAuthority: 'HUMAN_REVIEWED'
      }
    ];
    storage.saveValidationContract(contract, leadUser.id, leadUser.role);

    // Attempt to waive CRITICAL failure (must fail!)
    let critWaiverFailed = false;
    try {
      storage.waiveValidation(contract.id, testProjId, critFailId, leadUser, 'Attempting to waive critical');
    } catch (e: any) {
      critWaiverFailed = true;
    }

    if (!critWaiverFailed) {
      throw new Error('Invariant violation: CRITICAL validation failure was waived!');
    }

    // Attempt to waive HIGH failure as DEVELOPER (must fail!)
    let devWaiverFailed = false;
    try {
      storage.waiveValidation(contract.id, testProjId, highFailId, devUser, 'Developer waiver');
    } catch (e: any) {
      devWaiverFailed = true;
    }

    if (!devWaiverFailed) {
      throw new Error('Invariant violation: Developer was able to waive a validation failure!');
    }

    // Waive HIGH failure as PROJECT_LEAD (must succeed and preserve failure record)
    const waivedContract = storage.waiveValidation(
      contract.id,
      testProjId,
      highFailId,
      leadUser,
      'Accepting 1s timeout variance in development container.'
    );

    const waivedFailure = waivedContract.failures.find(f => f.id === highFailId);
    if (!waivedFailure || !waivedFailure.waived || !waivedFailure.waiverReason) {
      throw new Error('Waiver failed to set waived=true and preserve waiverReason in failure.');
    }

    results.push({
      suite,
      name: 'WAIVER-01: Governed Waiver Rules & Invariant Enforcement',
      passed: true,
      details: 'Asserted that CRITICAL failures cannot be waived and waivers require Lead authorization.'
    });
  } catch (err: any) {
    results.push({
      suite,
      name: 'WAIVER-01: Governed Waiver Rules & Invariant Enforcement',
      passed: false,
      error: err.message
    });
  }

  // 10. REG-01: Dependency-Aware Regression Analysis
  try {
    const impact = regressionEngine.analyzeImpact([
      'src/server/storage.ts',
      'src/server/validation/validationEngine.ts'
    ]);

    if (!impact.affectedComponents.includes('storage') || !impact.affectedComponents.includes('validation')) {
      throw new Error('Impact analysis failed to extract touched components.');
    }

    if (!impact.selectedTests.includes('src/tests/foundation.test.ts') || !impact.selectedTests.includes('src/tests/validation.test.ts')) {
      throw new Error('Impact analysis failed to select affected test suites.');
    }

    const regResult = regressionEngine.verifyRegression(project, baselineTask, {
      executionId: 'exec-reg-001',
      agentId: 'agent-gemini-2.5-pro',
      timestamp: new Date().toISOString(),
      changedFiles: [{ path: 'src/server/validation/validationEngine.ts', diff: '' }],
      testResults: [{ suite: 'ValidationSuite', testName: 'RegCheck', passed: true }],
      lintResults: { clean: true, errorCount: 0, warningCount: 0 }
    });

    if (!regResult.passed || regResult.record.status !== 'PASSED') {
      throw new Error('Regression verification failed unexpectedly on clean test results.');
    }

    results.push({
      suite,
      name: 'REG-01: Dependency-Aware Regression Analysis & Selective Testing',
      passed: true,
      details: 'Mapped changed files to affected components and verified regression execution.'
    });
  } catch (err: any) {
    results.push({
      suite,
      name: 'REG-01: Dependency-Aware Regression Analysis & Selective Testing',
      passed: false,
      error: err.message
    });
  }

  // 11. PROM-01: Authoritative State Promotion Gate (Gate 7)
  try {
    // Attempt to promote task with unpassed validation (must fail!)
    const unvalidatedTaskId = 'tsk-unvalidated-001';
    const unvalidatedTask: UniversalTaskSpecification = {
      ...baselineTask,
      taskId: unvalidatedTaskId,
      state: 'RUNNING'
    };
    storage.saveTask(testProjId, unvalidatedTask, leadUser, 'corr-unval');

    let prematurePromotionFailed = false;
    try {
      validationEngine.promoteTaskState(testProjId, unvalidatedTaskId, leadUser.id, leadUser.role);
    } catch (e: any) {
      prematurePromotionFailed = true;
    }

    if (!prematurePromotionFailed) {
      throw new Error('Invariant violation: Unvalidated task was promoted to authoritative state!');
    }

    // Now validate baselineTask cleanly and promote it
    const cleanEvidence: ExecutionEvidence = {
      executionId: 'exec-promo-001',
      agentId: 'agent-gemini-2.5-pro',
      timestamp: new Date().toISOString(),
      changedFiles: [
        { path: 'src/server/validation/validationEngine.ts', diff: '+ export const done = true;', astVerified: true }
      ],
      testResults: [{ suite: 'ValidationSuite', testName: 'PromoCheck', passed: true }],
      lintResults: { clean: true, errorCount: 0, warningCount: 0 }
    };

    const validatedContract = validationEngine.runValidationPipeline(
      project,
      baselineTask,
      undefined,
      cleanEvidence,
      leadUser.id,
      leadUser.role
    );

    if (validatedContract.status !== 'PASSED') {
      throw new Error(`Failed to cleanly pass validation pipeline for promotion test: ${validatedContract.status}`);
    }

    const promotion = validationEngine.promoteTaskState(
      testProjId,
      baselineTask.taskId,
      leadUser.id,
      leadUser.role
    );

    if (!promotion.success || promotion.proofOfCompletion !== 'APPROVED') {
      throw new Error('Task promotion failed to transition proofOfCompletion to APPROVED.');
    }

    results.push({
      suite,
      name: 'PROM-01: Authoritative State Promotion Gate (Gate 7)',
      passed: true,
      details: 'Enforced that only cleanly validated tasks can be promoted to APPROVED authoritative state.'
    });
  } catch (err: any) {
    results.push({
      suite,
      name: 'PROM-01: Authoritative State Promotion Gate (Gate 7)',
      passed: false,
      error: err.message
    });
  }

  const allPassed = results.every(r => r.passed);
  return { passed: allPassed, results };
}
