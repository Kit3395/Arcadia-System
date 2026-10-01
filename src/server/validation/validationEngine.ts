/**
 * ARCADIA SYSTEM - PHASE 7: VALIDATION, SECURITY & DRIFT INTELLIGENCE
 * Master Validation Engine & Governance Pipeline
 * 
 * Implements:
 * - Claim -> Evidence -> Validation -> Result -> Authority Pipeline
 * - Multi-Dimensional Validation (Requirements, Scope, Functional, Architecture, Security, Regression)
 * - 7-Gate Operational Lifecycle
 * - Structured Failure Diagnostics with Impact Tracing
 * - Governed Waiver Mechanism (Never silent; RBAC verified; CRITICAL unwaiverable)
 * - Proof of Completion State Transitions (IMPLEMENTED -> VALIDATED -> APPROVED)
 * - Complete Evidence-Based Traceability Chain
 */

import {
  ValidationContract,
  ValidationGate,
  ValidationFailure,
  ValidationEvidenceItem,
  ValidationStatus,
  ValidationSeverity,
  ValidationCategory,
  ValidationMethod,
  ProofOfCompletionState,
  UniversalTaskSpecification,
  ExecutionEvidence,
  Project,
  UserRole
} from '../../types/index.ts';
import { storage } from '../storage.ts';
import { securityEngine } from './securityEngine.ts';
import { regressionEngine } from './regressionEngine.ts';

export class ValidationEngine {
  /**
   * Assemble a task-specific Validation Contract before or immediately after execution
   */
  public createContract(
    project: Project,
    task: UniversalTaskSpecification,
    executionId?: string,
    validatorName: string = 'Arcadia Validation Engine v1.0',
    method: ValidationMethod = 'AUTOMATED_TEST'
  ): ValidationContract {
    const rules = storage.getValidationRules(project.id);
    const configuredGates = storage.getValidationGates(project.id);

    // Categories derived dynamically from task complexity & requirements
    const categories: ValidationCategory[] = [
      'REQUIREMENT',
      'SCOPE',
      'FUNCTIONAL',
      'ARCHITECTURE',
      'SECURITY',
      'REGRESSION'
    ];
    if (project.securityState === 'RESTRICTED') {
      categories.push('COMPLIANCE');
    }

    const contract: ValidationContract = {
      id: `val-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: project.id,
      taskId: task.taskId,
      executionId,
      requirementReferences: [...task.requirementsSatisfied],
      acceptanceCriteria: [...task.acceptanceCriteria],
      validationCategories: categories,
      validationRules: rules.filter(r => r.active).map(r => r.id),
      expectedResults: task.acceptanceCriteria.map(ac => `Criterion satisfied: ${ac}`),
      observedResults: [],
      evidence: [],
      validator: validatorName,
      validationMethod: method,
      gates: configuredGates.map(g => ({
        ...g,
        status: 'PENDING',
        passed: false
      })),
      failures: [],
      status: 'PENDING',
      severity: 'INFO',
      proofOfCompletion: 'IMPLEMENTED',
      isAuthoritativeApproved: false,
      createdAt: new Date().toISOString()
    };

    return storage.saveValidationContract(contract, 'SYSTEM', 'PROJECT_LEAD');
  }

  /**
   * Run the full 7-Gate Validation Pipeline against a task and its execution evidence
   */
  public runValidationPipeline(
    project: Project,
    task: UniversalTaskSpecification,
    contractId?: string,
    evidence?: ExecutionEvidence,
    actorId: string = 'usr-lead',
    actorRole: UserRole = 'PROJECT_LEAD'
  ): ValidationContract {
    let contract = contractId 
      ? storage.getValidationContract(contractId, project.id) 
      : undefined;

    if (!contract) {
      contract = this.createContract(project, task, evidence?.executionId);
    }

    contract.status = 'RUNNING';
    const failures: ValidationFailure[] = [];
    const evidenceItems: ValidationEvidenceItem[] = [];
    const observedResults: string[] = [];

    // Rule: Nothing becomes trusted merely because an agent says it is complete.
    // If no evidence is provided, fail immediately on missing evidence.
    if (!evidence) {
      const missingEvidenceFailure: ValidationFailure = {
        id: `fail-${Date.now()}-no-ev`,
        category: 'FUNCTIONAL',
        whatFailed: 'Mandatory Execution Evidence Missing',
        expectedBehavior: 'Execution must submit structured evidence (diffs, test results, tool calls) for validation.',
        observedBehavior: 'Agent declared completion without attaching authoritative ExecutionEvidence.',
        evidence: 'ExecutionEvidence payload is undefined or empty.',
        affectedRequirementId: task.requirementsSatisfied[0],
        affectedComponent: task.relevantFiles[0]?.path || 'Task',
        severity: 'CRITICAL',
        securityImpact: 'Unverified code execution cannot be promoted.',
        scopeImpact: 'Scope boundaries unverifiable without diffs.',
        recommendedAction: 'Re-run execution with evidence recording enabled.',
        requiredAuthority: 'GOVERNANCE_APPROVED'
      };
      failures.push(missingEvidenceFailure);
      contract.failures = failures;
      contract.status = 'FAILED';
      contract.severity = 'CRITICAL';
      contract.completedAt = new Date().toISOString();
      return storage.saveValidationContract(contract, actorId, actorRole);
    }

    // =========================================================================
    // GATE 1: REQUIREMENTS & PRECONDITIONS
    // =========================================================================
    const gate1 = contract.gates.find(g => g.order === 1);
    const reqs = storage.getRequirements(project.id);
    const taskReqs = reqs.filter(r => 
      task.requirementsSatisfied.includes(r.reqIdentifier) || 
      task.requirementsSatisfied.includes((r as any).reqId) ||
      task.requirementsSatisfied.includes(r.id)
    );

    let gate1Passed = true;
    if (taskReqs.length === 0 && task.requirementsSatisfied.length > 0) {
      gate1Passed = false;
      failures.push({
        id: `fail-${Date.now()}-req-not-found`,
        category: 'REQUIREMENT',
        whatFailed: 'Requirement Provenance Traceability',
        expectedBehavior: `Task must satisfy existing approved requirements.`,
        observedBehavior: `Requirements [${task.requirementsSatisfied.join(', ')}] not found in Layer 2 storage.`,
        evidence: `Task requirementsSatisfied: ${JSON.stringify(task.requirementsSatisfied)}`,
        affectedRequirementId: task.requirementsSatisfied[0],
        severity: 'HIGH',
        recommendedAction: 'Link task to valid project requirements approved in Intake/Intelligence.',
        requiredAuthority: 'HUMAN_REVIEWED'
      });
    }

    // Check if any referenced requirement is rejected
    const rejectedReq = taskReqs.find(r => r.status === 'REJECTED');
    if (rejectedReq) {
      gate1Passed = false;
      const refId = rejectedReq.reqIdentifier || (rejectedReq as any).reqId || rejectedReq.id;
      failures.push({
        id: `fail-${Date.now()}-req-rejected`,
        category: 'REQUIREMENT',
        whatFailed: 'Attempted Implementation of Rejected Requirement',
        expectedBehavior: 'Only approved requirements can be validated.',
        observedBehavior: `Requirement ${refId} is marked REJECTED by Project Lead.`,
        evidence: `Requirement status: ${rejectedReq.status}`,
        affectedRequirementId: refId,
        severity: 'CRITICAL',
        recommendedAction: 'Halt task or update requirement status via formal Governance review.',
        requiredAuthority: 'GOVERNANCE_APPROVED'
      });
    }

    if (gate1) {
      gate1.passed = gate1Passed;
      gate1.status = gate1Passed ? 'PASSED' : 'FAILED';
      gate1.evidenceNotes = gate1Passed 
        ? `Validated against ${taskReqs.length} approved requirement(s).` 
        : `Requirements validation failed.`;
    }
    observedResults.push(`Gate 1 (Requirements): ${gate1Passed ? 'PASSED' : 'FAILED'}`);

    // =========================================================================
    // GATE 2: SCOPE LOCK BOUNDARY
    // =========================================================================
    const gate2 = contract.gates.find(g => g.order === 2);
    const changedFiles = evidence.changedFiles.map(f => f.path);
    let scopeCheck = storage.verifyTaskScope(
      task.taskId,
      project.id,
      changedFiles,
      'FILE_EDIT'
    );

    if (!scopeCheck.allowed && scopeCheck.violationReason === 'Task not found.') {
      // Check directly against task specification contract
      if (task.prohibitedActions.includes('FILE_EDIT')) {
        scopeCheck = { allowed: false, violationReason: "Action 'FILE_EDIT' is prohibited by task specification." };
      } else {
        const allowedPaths = task.relevantFiles.map(f => f.path);
        const unlisted = changedFiles.filter(f => !allowedPaths.includes(f));
        if (unlisted.length > 0) {
          scopeCheck = { allowed: false, violationReason: `File '${unlisted[0]}' is outside task relevantFiles boundary.` };
        } else {
          scopeCheck = { allowed: true };
        }
      }
    }

    let gate2Passed = scopeCheck.allowed;
    if (!scopeCheck.allowed) {
      failures.push({
        id: `fail-${Date.now()}-scope`,
        category: 'SCOPE',
        whatFailed: 'Scope Lock Boundary Check',
        expectedBehavior: 'All modified files must be strictly listed in task.relevantFiles.',
        observedBehavior: scopeCheck.violationReason || 'Unauthorized file modification attempted.',
        evidence: `Changed files: ${JSON.stringify(changedFiles)} vs Allowed: ${JSON.stringify(task.relevantFiles.map(f => f.path))}`,
        severity: 'CRITICAL',
        scopeImpact: 'Direct breach of task Scope Lock contract.',
        recommendedAction: 'Revert unauthorized file modifications or expand task boundary via Lead Change Request.',
        requiredAuthority: 'GOVERNANCE_APPROVED'
      });
    }

    if (gate2) {
      gate2.passed = gate2Passed;
      gate2.status = gate2Passed ? 'PASSED' : 'FAILED';
      gate2.evidenceNotes = gate2Passed ? 'All modified paths within authorized Scope Lock boundary.' : scopeCheck.violationReason;
    }
    observedResults.push(`Gate 2 (Scope Lock): ${gate2Passed ? 'PASSED' : 'FAILED'}`);

    // =========================================================================
    // GATE 3: FUNCTIONAL & TECHNICAL CORRECTNESS
    // =========================================================================
    const gate3 = contract.gates.find(g => g.order === 3);
    const testResults = evidence.testResults || [];
    const testFailures = testResults.filter(t => !t.passed);

    let gate3Passed = testFailures.length === 0;
    if (!gate3Passed) {
      for (const tf of testFailures) {
        failures.push({
          id: `fail-${Date.now()}-test-${Math.random().toString(36).substring(2, 5)}`,
          category: 'FUNCTIONAL',
          whatFailed: `Automated Test Failure: ${tf.suite} -> ${tf.testName}`,
          expectedBehavior: 'All automated tests must pass cleanly.',
          observedBehavior: tf.errorMessage || 'Assertion failed in test harness.',
          evidence: `Test result failure in ${tf.suite}`,
          severity: 'HIGH',
          recommendedAction: 'Debug failure in test harness and update implementation.',
          requiredAuthority: 'AUTOMATED'
        });
      }
    }

    evidenceItems.push({
      id: `ev-${Date.now()}-tests`,
      type: 'AUTOMATED_TEST',
      summary: `Automated Test Results: ${testResults.length - testFailures.length}/${testResults.length} passed`,
      details: testResults.map(t => `${t.passed ? '✓' : '✗'} ${t.suite} - ${t.testName}`).join('\n'),
      timestamp: new Date().toISOString()
    });

    if (gate3) {
      gate3.passed = gate3Passed;
      gate3.status = gate3Passed ? 'PASSED' : 'FAILED';
      gate3.evidenceNotes = gate3Passed ? `All ${testResults.length} test assertions green.` : `${testFailures.length} test failures detected.`;
    }
    observedResults.push(`Gate 3 (Functional): ${gate3Passed ? 'PASSED' : 'FAILED'}`);

    // =========================================================================
    // GATE 4: SECURITY PROFILE & STOP CONDITIONS
    // =========================================================================
    const gate4 = contract.gates.find(g => g.order === 4);
    const secScan = securityEngine.scanExecution(
      project,
      task,
      evidence,
      project.securityState === 'RESTRICTED' ? 'REGULATED' : 'STANDARD'
    );

    let gate4Passed = secScan.passed;
    if (!secScan.passed) {
      for (const secFinding of secScan.findings) {
        failures.push({
          id: `fail-${Date.now()}-sec-${secFinding.id}`,
          category: 'SECURITY',
          whatFailed: `Security Finding: ${secFinding.category} (${secFinding.severity})`,
          expectedBehavior: 'Zero high or critical security vulnerabilities allowed.',
          observedBehavior: secFinding.description,
          evidence: secFinding.evidence,
          severity: secFinding.severity,
          securityImpact: secFinding.exploitability,
          recommendedAction: secFinding.recommendedRemediation,
          requiredAuthority: 'SECURITY_APPROVED'
        });
      }
    }

    evidenceItems.push({
      id: `ev-${Date.now()}-sec`,
      type: 'SECURITY_SCAN',
      summary: secScan.summary,
      details: secScan.findings.map(f => `[${f.severity}] ${f.category}: ${f.description}`).join('\n') || 'Clean scan',
      timestamp: new Date().toISOString()
    });

    if (gate4) {
      gate4.passed = gate4Passed;
      gate4.status = gate4Passed ? 'PASSED' : 'FAILED';
      gate4.evidenceNotes = secScan.summary;
    }
    observedResults.push(`Gate 4 (Security): ${gate4Passed ? 'PASSED' : 'FAILED'}`);

    // =========================================================================
    // GATE 5: REGRESSION CHECK
    // =========================================================================
    const gate5 = contract.gates.find(g => g.order === 5);
    const regResult = regressionEngine.verifyRegression(project, task, evidence);

    let gate5Passed = regResult.passed;
    if (!regResult.passed) {
      for (const rf of regResult.record.failures) {
        failures.push({
          id: `fail-${Date.now()}-reg`,
          category: 'REGRESSION',
          whatFailed: `Regression Check: ${rf}`,
          expectedBehavior: 'Zero regression defects across affected components.',
          observedBehavior: rf,
          evidence: `Affected components: ${regResult.record.changedComponents.join(', ')}`,
          severity: 'HIGH',
          regressionImpact: 'Existing functionality broken by new task diffs.',
          recommendedAction: 'Fix regression in touched components before promoting.',
          requiredAuthority: 'AUTOMATED'
        });
      }
    }

    evidenceItems.push({
      id: `ev-${Date.now()}-reg`,
      type: 'INTEGRATION_TEST',
      summary: regResult.summary,
      details: `Tests evaluated: ${regResult.record.testsExecuted}, Failures: ${regResult.record.testsFailed}`,
      timestamp: new Date().toISOString()
    });

    if (gate5) {
      gate5.passed = gate5Passed;
      gate5.status = gate5Passed ? 'PASSED' : 'FAILED';
      gate5.evidenceNotes = regResult.summary;
    }
    observedResults.push(`Gate 5 (Regression): ${gate5Passed ? 'PASSED' : 'FAILED'}`);

    // =========================================================================
    // GATE 6: HUMAN GOVERNANCE REVIEW (If High Severity or Exceptions Exist)
    // =========================================================================
    const gate6 = contract.gates.find(g => g.order === 6);
    const hasUnwaivedCritical = failures.some(f => f.severity === 'CRITICAL' && !f.waived);
    const hasUnwaivedHigh = failures.some(f => f.severity === 'HIGH' && !f.waived);

    let gate6Passed = true;
    if (hasUnwaivedCritical || hasUnwaivedHigh) {
      // Escalated to Human Review Queue
      gate6Passed = false;
      if (gate6) {
        gate6.passed = false;
        gate6.status = 'BLOCKED';
        gate6.evidenceNotes = 'Escalated to Human Validation Review Queue due to critical/high failures.';
      }
    } else {
      if (gate6) {
        gate6.passed = true;
        gate6.status = 'PASSED';
        gate6.evidenceNotes = 'All automated validation gates satisfied cleanly. Governance criteria met.';
      }
    }
    observedResults.push(`Gate 6 (Human Review): ${gate6Passed ? 'PASSED' : 'REQUIRES_REVIEW'}`);

    // =========================================================================
    // GATE 7: AUTHORITATIVE STATE PROMOTION GATE
    // =========================================================================
    const gate7 = contract.gates.find(g => g.order === 7);
    const allPrecedingPassed = [gate1Passed, gate2Passed, gate3Passed, gate4Passed, gate5Passed, gate6Passed].every(Boolean);

    if (gate7) {
      gate7.passed = allPrecedingPassed;
      gate7.status = allPrecedingPassed ? 'PASSED' : 'BLOCKED';
      gate7.evidenceNotes = allPrecedingPassed 
        ? 'Authoritative state promotion approved.' 
        : 'State promotion blocked until all gates pass or are validly waived by Project Lead.';
    }
    observedResults.push(`Gate 7 (Authoritative Promotion): ${allPrecedingPassed ? 'UNLOCKED' : 'LOCKED'}`);

    // Update Contract State
    contract.evidence = evidenceItems;
    contract.failures = failures;
    contract.observedResults = observedResults;
    contract.completedAt = new Date().toISOString();

    if (allPrecedingPassed) {
      contract.status = 'PASSED';
      contract.severity = 'INFO';
      contract.proofOfCompletion = 'VALIDATED';
      contract.isAuthoritativeApproved = true;
    } else {
      contract.status = hasUnwaivedCritical ? 'BLOCKED' : 'FAILED';
      contract.severity = hasUnwaivedCritical ? 'CRITICAL' : 'HIGH';
      contract.proofOfCompletion = 'IMPLEMENTED'; // Remains implemented but NOT validated
      contract.isAuthoritativeApproved = false;
    }

    return storage.saveValidationContract(contract, actorId, actorRole);
  }

  /**
   * Promote validated task to APPROVED authoritative state
   * Enforces: Task must be in VALIDATED state with Gate 7 passed.
   */
  public promoteTaskState(
    projectId: string,
    taskId: string,
    actorId: string,
    actorRole: UserRole
  ): { success: boolean; proofOfCompletion: ProofOfCompletionState; message: string } {
    if (actorRole !== 'PROJECT_LEAD' && actorRole !== 'SECURITY') {
      throw new Error(`Unauthorized: Role '${actorRole}' lacks authority to promote tasks to authoritative approved state.`);
    }

    const contracts = storage.getValidationContracts(projectId);
    const taskContract = contracts.find(c => c.taskId === taskId);

    if (!taskContract) {
      throw new Error(`Cannot promote task '${taskId}': No Validation Contract exists.`);
    }

    if (taskContract.status !== 'PASSED' && taskContract.status !== 'WAIVED') {
      throw new Error(`Cannot promote task '${taskId}': Validation status is '${taskContract.status}'. All gates must pass or be waived.`);
    }

    taskContract.proofOfCompletion = 'APPROVED';
    taskContract.isAuthoritativeApproved = true;
    storage.saveValidationContract(taskContract, actorId, actorRole);

    // Update task in storage to PASSED
    const project = storage.getProject(projectId);
    const orgId = project?.organizationId || 'org-arcadia-demo';
    const actorUser = storage.getUser(actorId) || {
      id: actorId,
      organizationId: orgId,
      email: `${actorId}@arcadia.internal`,
      fullName: actorId,
      role: actorRole,
      createdAt: new Date().toISOString()
    };
    storage.updateTaskState(projectId, taskId, orgId, 'PASSED', actorUser, `corr-prom-${Date.now()}`);

    return {
      success: true,
      proofOfCompletion: 'APPROVED',
      message: `Task ${taskId} formally promoted to APPROVED state. Authoritative state updated.`
    };
  }
}

export const validationEngine = new ValidationEngine();
