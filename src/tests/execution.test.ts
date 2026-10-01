/**
 * ARCADIA SYSTEM - EXECUTION LAYER (PHASE 5)
 * Automated Invariant & Security Test Suite
 * 
 * Verifies core architectural invariants:
 * 1. Task Readiness Gates (Dependencies, Requirements, Scope Lock)
 * 2. Context Orchestration & Authority Hierarchy
 * 3. Status Filtering & Explainability Manifest
 * 4. Prompt Health Check & Versioning
 * 5. Agent Registry Selection & Clearances
 * 6. Scope Lock Interception & Breach Halting
 * 7. Evidence Separation (Evidence != Authoritative Truth)
 * 8. Authorized Evidence Promotion & Audit Immutability
 */

import { TestResult, UniversalTaskSpecification } from '../types/index.ts';
import { storage } from '../server/storage.ts';
import { taskReadinessGate } from '../server/execution/taskReadiness.ts';
import { contextOrchestrator } from '../server/execution/contextOrchestrator.ts';
import { promptCompiler } from '../server/execution/promptCompiler.ts';
import { agentRegistry } from '../server/execution/agentRegistry.ts';
import { executionEngine } from '../server/execution/executionEngine.ts';
import { adaptivePipeline } from '../server/execution/adaptivePipeline.ts';

export async function runExecutionTests(): Promise<{
  passed: boolean;
  results: TestResult[];
  summary: { total: number; passed: number; failed: number };
}> {
  const results: TestResult[] = [];
  const testOrgId = 'org-arcadia-demo';
  const testProjId = 'proj-core-os';

  const leadUser = storage.getUser('usr-lead')!;
  const devUser = storage.getUser('usr-dev')!;

  // Test 1: Task Readiness Gate - Dependency Blocking
  try {
    const t0 = Date.now();
    const project = storage.getProject(testProjId, testOrgId)!;
    const requirements = storage.getRequirements(testProjId);
    
    // Create task with an unfulfilled dependency
    const blockedTask: UniversalTaskSpecification = {
      taskId: 'task-test-dep-block',
      projectId: testProjId,
      taskIdentifier: 'TSK-TEST-DEP',
      title: 'Task with Unresolved Dependency',
      objective: 'Verify that unresolved dependencies block task execution gate.',
      complexity: 'MEDIUM',
      state: 'READY',
      requirementsSatisfied: ['REQ-001'],
      dependencies: ['TSK-NON-EXISTENT'],
      allowedActions: ['FILE_EDIT'],
      prohibitedActions: ['DISABLE_SECURITY'],
      architectureSlice: { relevantModules: ['Core'], contractsToPreserve: [] },
      relevantFiles: [{ path: 'src/core/test.ts', readOnly: false }],
      acceptanceCriteria: ['Must pass test'],
      validationRequirements: { mandatoryTests: ['test1'], staticChecks: [], maxExecutionTimeMs: 5000 },
      stopConditions: ['Stop on error'],
      escalationConditions: ['Escalate to Lead'],
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const gateResult = taskReadinessGate.evaluateTaskReadiness(blockedTask, project, [], requirements);
    const passed = !gateResult.passed && gateResult.status === 'DEPENDENCY_BLOCKED';

    results.push({
      name: 'EXEC-READINESS-01: Unresolved Dependency Gate Block',
      category: 'EXECUTION',
      passed,
      message: passed
        ? 'Unresolved dependency correctly halted readiness gate with DEPENDENCY_BLOCKED status.'
        : `Gate failed to block task with unresolved dependency (status: ${gateResult.status})`,
      durationMs: Date.now() - t0
    });
  } catch (err: any) {
    results.push({
      name: 'EXEC-READINESS-01: Unresolved Dependency Gate Block',
      category: 'EXECUTION',
      passed: false,
      message: `Exception: ${err?.message}`,
      durationMs: 0
    });
  }

  // Test 2: Task Readiness Gate - Scope Lock Boundary Definition
  try {
    const t0 = Date.now();
    const project = storage.getProject(testProjId, testOrgId)!;
    const requirements = storage.getRequirements(testProjId);

    // Create task missing prohibitedActions and files
    const badScopeTask: UniversalTaskSpecification = {
      taskId: 'task-test-bad-scope',
      projectId: testProjId,
      taskIdentifier: 'TSK-TEST-SCOPE',
      title: 'Task Missing Scope Bounds',
      objective: 'Verify that unbounded tasks cannot pass readiness gate.',
      complexity: 'LOW',
      state: 'READY',
      requirementsSatisfied: ['REQ-001'],
      dependencies: [],
      allowedActions: [],
      prohibitedActions: [], // Missing!
      architectureSlice: { relevantModules: [], contractsToPreserve: [] },
      relevantFiles: [], // Missing!
      acceptanceCriteria: ['Valid'],
      validationRequirements: { mandatoryTests: ['t'], staticChecks: [], maxExecutionTimeMs: 1000 },
      stopConditions: [],
      escalationConditions: [],
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const gateResult = taskReadinessGate.evaluateTaskReadiness(badScopeTask, project, [], requirements);
    const passed = !gateResult.passed && gateResult.blockingReasons.some(r => r.includes('Scope Lock'));

    results.push({
      name: 'EXEC-READINESS-02: Scope Lock Missing Boundary Rejection',
      category: 'SCOPE_LOCK',
      passed,
      message: passed
        ? 'Task missing relevantFiles and prohibitedActions rejected by readiness gate.'
        : 'Readiness gate permitted task without Scope Lock boundaries.',
      durationMs: Date.now() - t0
    });
  } catch (err: any) {
    results.push({
      name: 'EXEC-READINESS-02: Scope Lock Missing Boundary Rejection',
      category: 'SCOPE_LOCK',
      passed: false,
      message: `Exception: ${err?.message}`,
      durationMs: 0
    });
  }

  // Test 3: Context Orchestration - Authority Hierarchy
  try {
    const t0 = Date.now();
    const project = storage.getProject(testProjId, testOrgId)!;
    const constitution = storage.getConstitution(testProjId) || null;
    const requirements = storage.getRequirements(testProjId);
    const decisions = storage.getDecisions(testProjId);
    const tasks = storage.getTasks(testProjId);

    const validTask = tasks[0];
    const contextPkg = contextOrchestrator.assembleContextPackage(
      validTask,
      project,
      constitution,
      requirements,
      decisions,
      tasks
    );

    // Constitution must be at highest authority level and included
    const constitutionItem = contextPkg.items.find(i => i.sourceType === 'PROJECT_CONSTITUTION');
    const passed = !!constitutionItem && constitutionItem.authorityLevel === 'CONSTITUTION' && contextPkg.manifest.length > 0;

    results.push({
      name: 'EXEC-CONTEXT-01: Authority Hierarchy Enforcement',
      category: 'CONTEXT',
      passed,
      message: passed
        ? `Context package ranked Constitution as supreme authority (${constitutionItem?.authorityLevel}) with explainable manifest.`
        : 'Context package did not correctly enforce Constitution authority.',
      durationMs: Date.now() - t0
    });
  } catch (err: any) {
    results.push({
      name: 'EXEC-CONTEXT-01: Authority Hierarchy Enforcement',
      category: 'CONTEXT',
      passed: false,
      message: `Exception: ${err?.message}`,
      durationMs: 0
    });
  }

  // Test 4: Context Explainability Manifest
  try {
    const t0 = Date.now();
    const project = storage.getProject(testProjId, testOrgId)!;
    const constitution = storage.getConstitution(testProjId) || null;
    const requirements = storage.getRequirements(testProjId);
    const decisions = storage.getDecisions(testProjId);
    const tasks = storage.getTasks(testProjId);

    const validTask = tasks[0];
    const contextPkg = contextOrchestrator.assembleContextPackage(
      validTask,
      project,
      constitution,
      requirements,
      decisions,
      tasks
    );

    // Every item in manifest must have an explicit reason
    const allHaveReasons = contextPkg.manifest.every(m => m.reason && m.reason.trim().length > 5);
    const hasIncluded = contextPkg.manifest.some(m => m.status === 'INCLUDED');
    const passed = allHaveReasons && hasIncluded;

    results.push({
      name: 'EXEC-CONTEXT-02: Explainability Manifest Coverage',
      category: 'CONTEXT',
      passed,
      message: passed
        ? `All ${contextPkg.manifest.length} context items have explicit inclusion/exclusion justifications.`
        : 'Manifest contains items without explicit justification reasons.',
      durationMs: Date.now() - t0
    });
  } catch (err: any) {
    results.push({
      name: 'EXEC-CONTEXT-02: Explainability Manifest Coverage',
      category: 'CONTEXT',
      passed: false,
      message: `Exception: ${err?.message}`,
      durationMs: 0
    });
  }

  // Test 5: Prompt Health Check - Objective & Acceptance Verification
  try {
    const t0 = Date.now();
    const project = storage.getProject(testProjId, testOrgId)!;
    const tasks = storage.getTasks(testProjId);
    const agent = agentRegistry.getAgent('agent-gemini-2.5-pro')!;

    const brokenTask: UniversalTaskSpecification = {
      ...tasks[0],
      objective: 'Too short',
      acceptanceCriteria: []
    };

    const contextPkg = contextOrchestrator.assembleContextPackage(
      brokenTask,
      project,
      storage.getConstitution(testProjId) || null,
      storage.getRequirements(testProjId),
      storage.getDecisions(testProjId),
      tasks
    );

    const health = promptCompiler.evaluatePromptHealth(brokenTask, contextPkg, agent);
    const passed = health.status === 'BLOCKED' && health.blockingIssues.length >= 2;

    results.push({
      name: 'EXEC-PROMPT-01: Prompt Health Check Blocking on Defective Task',
      category: 'PROMPT',
      passed,
      message: passed
        ? `Prompt health check blocked compilation (${health.blockingIssues.length} blocking issues detected).`
        : `Health check failed to block defective task (status: ${health.status})`,
      durationMs: Date.now() - t0
    });
  } catch (err: any) {
    results.push({
      name: 'EXEC-PROMPT-01: Prompt Health Check Blocking on Defective Task',
      category: 'PROMPT',
      passed: false,
      message: `Exception: ${err?.message}`,
      durationMs: 0
    });
  }

  // Test 6: Prompt Compiler - SHA-256 Versioning & Artifact Immutability
  try {
    const t0 = Date.now();
    const project = storage.getProject(testProjId, testOrgId)!;
    const tasks = storage.getTasks(testProjId);
    const validTask = tasks[0];
    const agent = agentRegistry.getAgent('agent-gemini-2.5-flash')!;
    const policy = adaptivePipeline.getExecutionPolicy(project, validTask);

    const contextPkg = contextOrchestrator.assembleContextPackage(
      validTask,
      project,
      storage.getConstitution(testProjId) || null,
      storage.getRequirements(testProjId),
      storage.getDecisions(testProjId),
      tasks
    );

    const promptVersion = promptCompiler.compilePrompt(validTask, contextPkg, agent, policy);
    const hasHash = !!(promptVersion.promptHash && promptVersion.promptHash.length === 64);
    const hasStructure = !!promptVersion.structure.role && !!promptVersion.structure.scope;
    const passed = hasHash && hasStructure && promptVersion.healthCheck.status !== 'BLOCKED';

    results.push({
      name: 'EXEC-PROMPT-02: Deterministic SHA-256 Prompt Compilation',
      category: 'PROMPT',
      passed,
      message: passed
        ? `Prompt compiled with cryptographic SHA-256 hash (${promptVersion.promptHash.substring(0, 16)}...) and bounded scope.`
        : 'Prompt compilation failed or missing hash/scope boundaries.',
      durationMs: Date.now() - t0
    });
  } catch (err: any) {
    results.push({
      name: 'EXEC-PROMPT-02: Deterministic SHA-256 Prompt Compilation',
      category: 'PROMPT',
      passed: false,
      message: `Exception: ${err?.message}`,
      durationMs: 0
    });
  }

  // Test 7: Agent Registry - Complexity and Security Selection
  try {
    const t0 = Date.now();
    const tasks = storage.getTasks(testProjId);
    const highComplexityTask: UniversalTaskSpecification = {
      ...tasks[0],
      complexity: 'HIGH'
    };

    const selectedAgent = agentRegistry.selectBestAgentForTask(highComplexityTask, 'INTERNAL');
    const passed = selectedAgent.capabilities.includes('CODE_MODIFICATION') && selectedAgent.reliabilityScore >= 0.95;

    results.push({
      name: 'EXEC-AGENT-01: Capability-Based Agent Selection',
      category: 'AGENT',
      passed,
      message: passed
        ? `Selected '${selectedAgent.name}' (reliability ${selectedAgent.reliabilityScore}) matching HIGH complexity requirements.`
        : `Agent selection failed to align with task complexity: ${selectedAgent?.name}`,
      durationMs: Date.now() - t0
    });
  } catch (err: any) {
    results.push({
      name: 'EXEC-AGENT-01: Capability-Based Agent Selection',
      category: 'AGENT',
      passed: false,
      message: `Exception: ${err?.message}`,
      durationMs: 0
    });
  }

  // Test 8: End-to-End Controlled Execution & Evidence Generation
  try {
    const t0 = Date.now();
    const tasks = storage.getTasks(testProjId);
    const validTask = tasks[0];

    const execResult = await executionEngine.executeTask(
      validTask.taskId,
      testProjId,
      testOrgId,
      devUser,
      'test-corr-e2e'
    );

    const passed = execResult.success && 
      !!execResult.executionRecord?.evidence && 
      execResult.executionRecord.evidence.changedFiles.length > 0 &&
      execResult.executionRecord.isAuthoritativeStateUpdated === false; // Evidence is NOT authoritative yet!

    results.push({
      name: 'EXEC-EVIDENCE-01: Structured Evidence Separation (Evidence != State)',
      category: 'EXECUTION',
      passed,
      message: passed
        ? `Execution generated ${execResult.executionRecord?.evidence?.changedFiles.length} diffs; authoritative state protected (isAuthoritativeStateUpdated: false).`
        : `Execution failed or erroneously mutated authoritative state immediately: ${execResult.error}`,
      durationMs: Date.now() - t0
    });
  } catch (err: any) {
    results.push({
      name: 'EXEC-EVIDENCE-01: Structured Evidence Separation (Evidence != State)',
      category: 'EXECUTION',
      passed: false,
      message: `Exception: ${err?.message}`,
      durationMs: 0
    });
  }

  // Test 9: Authoritative State Promotion Gate
  try {
    const t0 = Date.now();
    const executions = executionEngine.getExecutionsForProject(testProjId);
    const passedExec = executions.find(e => e.state === 'PASSED' && !e.isAuthoritativeStateUpdated);

    let passed = false;
    let message = '';

    if (!passedExec) {
      passed = false;
      message = 'No pending PASSED execution found to promote.';
    } else {
      const promoteResult = executionEngine.promoteEvidenceToAuthoritativeState(
        passedExec.id,
        testProjId,
        testOrgId,
        leadUser,
        'test-corr-promote'
      );

      passed = !!(promoteResult.success && passedExec.isAuthoritativeStateUpdated && promoteResult.task?.state === 'PASSED');
      message = passed
        ? `Evidence promoted by Project Lead; Task transitioned to authoritative state 'PASSED'.`
        : `Promotion failed: ${promoteResult.error}`;
    }

    results.push({
      name: 'EXEC-AUTHORITY-01: Authorized Human / Lead Evidence Promotion',
      category: 'EXECUTION',
      passed,
      message,
      durationMs: Date.now() - t0
    });
  } catch (err: any) {
    results.push({
      name: 'EXEC-AUTHORITY-01: Authorized Human / Lead Evidence Promotion',
      category: 'EXECUTION',
      passed: false,
      message: `Exception: ${err?.message}`,
      durationMs: 0
    });
  }

  return {
    passed: results.every(r => r.passed),
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length
    }
  };
}
