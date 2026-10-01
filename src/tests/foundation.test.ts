/**
 * ARCADIA SYSTEM - FOUNDATION SPECIFICATION v1.0
 * Automated Foundation Test Suite
 * Covers Domain Invariants, State Machines, Scope Lock, RBAC, Tenant Isolation, and Audit Trails
 */

import { storage } from '../server/storage.ts';
import { User, TestResult } from '../types/index.ts';

export async function runFoundationTests(): Promise<{ passed: boolean; results: TestResult[]; summary: { total: number; passed: number; failed: number } }> {
  const results: TestResult[] = [];

  function assert(name: string, category: TestResult['category'], condition: boolean, message: string) {
    const start = performance.now();
    results.push({
      name,
      category,
      passed: condition,
      message: condition ? 'PASSED: ' + message : 'FAILED: ' + message,
      durationMs: Math.round((performance.now() - start) * 100) / 100
    });
  }

  // --- Test Setup ---
  const leadUser = storage.getUser('usr-lead')!;
  const clientUser = storage.getUser('usr-client')!;
  const devUser = storage.getUser('usr-dev')!;
  const demoProjectId = 'proj-core-os';

  // 1. RBAC PERMISSION ENFORCEMENT
  {
    const clientCanApprove = storage.hasPermission(clientUser.role, 'requirement.approve');
    assert(
      'RBAC-01: Client Role Denied Requirement Approval',
      'RBAC',
      !clientCanApprove,
      'CLIENT role is properly denied requirement.approve permission.'
    );

    const leadCanApprove = storage.hasPermission(leadUser.role, 'requirement.approve');
    assert(
      'RBAC-02: Project Lead Role Granted Requirement Approval',
      'RBAC',
      leadCanApprove,
      'PROJECT_LEAD role is granted requirement.approve permission.'
    );

    const devCanCreateTask = storage.hasPermission(devUser.role, 'task.create');
    assert(
      'RBAC-03: Developer Denied Task Creation (Lead/Architect Scope)',
      'RBAC',
      !devCanCreateTask,
      'DEVELOPER cannot create tasks without lead/architect role.'
    );
  }

  // 2. TENANT ISOLATION
  {
    const projectUnderOrg = storage.getProject(demoProjectId, 'org-arcadia-demo');
    assert(
      'TENANT-01: Authorized Org Access',
      'TENANT',
      projectUnderOrg !== undefined,
      'Project is accessible under its owning organization.'
    );

    const projectUnderDifferentOrg = storage.getProject(demoProjectId, 'org-rogue-tenant');
    assert(
      'TENANT-02: Tenant Isolation Enforced',
      'TENANT',
      projectUnderDifferentOrg === undefined,
      'Cross-organization query returned undefined, preventing tenant data leaks.'
    );
  }

  // 3. INFERENCE FIREWALL & REQUIREMENT PROVENANCE
  {
    const aiReqResult = storage.createRequirement(
      demoProjectId,
      'org-arcadia-demo',
      {
        reqIdentifier: 'REQ-TEST-AI-01',
        description: 'AI model suggests omitting authentication on dev server',
        source: 'AI_RECOMMENDATION',
        classification: 'RECOMMENDATION',
        status: 'APPROVED', // Intentionally attempting to create as APPROVED
        confidenceScore: 0.75,
        affectedComponents: ['auth']
      },
      leadUser,
      'corr-test-01'
    );

    assert(
      'PROVENANCE-01: AI Recommendations Quarantined to PROPOSED',
      'DOMAIN',
      aiReqResult.success && aiReqResult.requirement?.status === 'PROPOSED',
      'AI recommendation status forced to PROPOSED despite client request for APPROVED.'
    );
  }

  // 4. TASK SCOPE LOCK VERIFICATION
  {
    const validCheck = storage.verifyTaskScope(
      'tsk-001',
      demoProjectId,
      ['src/server/auth.ts'],
      'FILE_EDIT'
    );
    assert(
      'SCOPE-01: Legitimate Task In-Scope File Allowed',
      'SCOPE_LOCK',
      validCheck.allowed,
      'Modifying src/server/auth.ts is allowed by tsk-001 relevantFiles contract.'
    );

    const outOfScopeCheck = storage.verifyTaskScope(
      'tsk-001',
      demoProjectId,
      ['src/server/database/passwords.txt'],
      'FILE_EDIT'
    );
    assert(
      'SCOPE-02: Out-of-Scope File Blocked by Scope Lock',
      'SCOPE_LOCK',
      !outOfScopeCheck.allowed && (outOfScopeCheck.violationReason?.includes('Scope Lock Violation') || false),
      'Modifying unlisted sensitive file was blocked by Scope Lock.'
    );

    const prohibitedActionCheck = storage.verifyTaskScope(
      'tsk-001',
      demoProjectId,
      ['src/server/auth.ts'],
      'DROP_TABLE'
    );
    assert(
      'SCOPE-03: Prohibited Action Blocked by Scope Lock',
      'SCOPE_LOCK',
      !prohibitedActionCheck.allowed,
      'Action DROP_TABLE is explicitly prohibited and rejected.'
    );
  }

  // 5. PROJECT LIFECYCLE STATE MACHINE PREREQUISITES
  {
    // Attempt illegal state transition
    const tempProj = storage.createProject(
      {
        organizationId: 'org-arcadia-demo',
        name: 'State Transition Test Project',
        slug: 'state-test-proj',
        description: 'Testing lifecycle transitions',
        complexityLevel: 'L2',
        primaryState: 'BLUEPRINT',
        governanceState: 'CLEAR',
        securityState: 'CLEAR',
        driftState: 'ALIGNED',
        timelineState: 'ON_TRACK',
        cognitiveLoadState: 'NORMAL',
        ownerId: leadUser.id
      },
      leadUser,
      'corr-state-test'
    );

    // BLUEPRINT -> GOVERNANCE requires at least one APPROVED requirement
    const transitionAttempt = storage.updateProjectState(
      tempProj.id,
      'org-arcadia-demo',
      'GOVERNANCE',
      leadUser,
      'corr-state-trans'
    );

    assert(
      'STATE-01: Lifecycle Prerequisite Guard Enforced',
      'DOMAIN',
      !transitionAttempt.success && (transitionAttempt.error?.includes('without at least one APPROVED') || false),
      'State transition from BLUEPRINT to GOVERNANCE without approved requirements was rejected.'
    );
  }

  // 6. IMMUTABLE AUDIT TRAIL
  {
    const initialAuditCount = storage.getAuditLogs(demoProjectId).length;
    storage.recordAudit({
      actorId: leadUser.id,
      actorRole: leadUser.role,
      action: 'SECURITY_CHECK_COMPLETED',
      targetEntity: 'SecurityHarness',
      targetId: 'audit-verify-01',
      projectId: demoProjectId,
      afterState: { checksPassed: true },
      correlationId: 'corr-audit-test'
    });

    const newLogs = storage.getAuditLogs(demoProjectId);
    assert(
      'AUDIT-01: Audit Event Persisted with Correlation ID',
      'AUDIT',
      newLogs.length === initialAuditCount + 1 && newLogs[0].correlationId === 'corr-audit-test',
      'Audit log entry successfully appended with correlation ID.'
    );
  }

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    passed: failedCount === 0,
    results,
    summary: {
      total: results.length,
      passed: passedCount,
      failed: failedCount
    }
  };
}

// Support CLI execution via `npm test`
if (process.argv[1]?.includes('foundation.test.ts')) {
  console.log('Running Arcadia Foundation Test Suite...\n');
  runFoundationTests().then(report => {
    report.results.forEach(r => {
      const mark = r.passed ? '✓' : '✗';
      console.log(`${mark} [${r.category}] ${r.name}: ${r.message}`);
    });
    console.log(`\nResults: ${report.summary.passed}/${report.summary.total} tests passed.`);
    if (!report.passed) {
      process.exit(1);
    }
  });
}
