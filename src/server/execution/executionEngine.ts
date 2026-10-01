/**
 * ARCADIA SYSTEM - EXECUTION LAYER (PHASE 5)
 * Module: Execution Engine & Lifecycle Orchestrator
 * 
 * Core Orchestrator implementing the primary execution principle:
 * Task Truth -> Readiness Gate -> Context Assembly -> Prompt Health -> Prompt Compilation
 * -> Agent Selection -> Controlled Execution -> Evidence Capture -> Scope Lock & Stop Conditions
 * -> Validation -> State Update Proposal -> Immutable Audit.
 * 
 * Never: Prompt -> Agent -> Automatic Truth.
 */

import {
  UniversalTaskSpecification,
  Project,
  User,
  ExecutionRecord,
  ExecutionContract,
  ExecutionState,
  ExecutionEvidence,
  ScopeViolationRecord,
  ExecutionMetricsSummary,
  TaskReadinessGateResult
} from '../../types/index.ts';
import { storage } from '../storage.ts';
import { adaptivePipeline } from './adaptivePipeline.ts';
import { taskReadinessGate } from './taskReadiness.ts';
import { contextOrchestrator } from './contextOrchestrator.ts';
import { promptCompiler } from './promptCompiler.ts';
import { agentRegistry } from './agentRegistry.ts';
import { agentAdapter } from './agentAdapter.ts';

export class ExecutionEngine {
  private executionRecords: Map<string, ExecutionRecord> = new Map();

  /**
   * Run the full controlled execution pipeline for a task
   */
  public async executeTask(
    taskId: string,
    projectId: string,
    orgId: string,
    actor: User,
    correlationId: string,
    targetAgentId?: string,
    simulateScopeViolation?: boolean
  ): Promise<{
    success: boolean;
    executionRecord?: ExecutionRecord;
    error?: string;
    readinessGate?: TaskReadinessGateResult;
  }> {
    const project = storage.getProject(projectId, orgId);
    if (!project) {
      return { success: false, error: `Project ${projectId} not found` };
    }

    const task = storage.getTask(taskId, projectId);
    if (!task) {
      return { success: false, error: `Task ${taskId} not found` };
    }

    const allTasks = storage.getTasks(projectId);
    const requirements = storage.getRequirements(projectId);
    const constitution = storage.getConstitution(projectId);
    const decisions = storage.getDecisions(projectId);

    // 1. Task Readiness Gate
    const readiness = taskReadinessGate.evaluateTaskReadiness(task, project, allTasks, requirements);
    if (!readiness.passed) {
      storage.recordAudit({
        projectId,
        actorId: actor.id,
        actorRole: actor.role,
        action: 'TASK_READINESS_GATE_FAILED',
        targetEntity: 'Task',
        targetId: task.taskId,
        beforeState: { taskState: task.state },
        afterState: { readinessStatus: readiness.status, blockingReasons: readiness.blockingReasons },
        correlationId
      });

      return {
        success: false,
        error: `Task Readiness Gate Failed: ${readiness.blockingReasons.join('; ')}`,
        readinessGate: readiness
      };
    }

    // 2. Adaptive Pipeline & Execution Policy
    const executionPolicy = adaptivePipeline.getExecutionPolicy(project, task);

    // 3. Context Orchestration (Minimal Sufficient Context)
    const contextPackage = contextOrchestrator.assembleContextPackage(
      task,
      project,
      constitution,
      requirements,
      decisions,
      allTasks
    );

    // 4. Agent Selection
    const assigned = targetAgentId || task.assignedAgentId;
    const agent = assigned 
      ? agentRegistry.getAgent(assigned) || agentRegistry.selectBestAgentForTask(task, project.securityState === 'RESTRICTED' ? 'REGULATED' : 'INTERNAL')
      : agentRegistry.selectBestAgentForTask(task, project.securityState === 'RESTRICTED' ? 'REGULATED' : 'INTERNAL');

    // 5. Prompt Health Check & Compilation
    const promptVersion = promptCompiler.compilePrompt(task, contextPackage, agent, executionPolicy);
    if (promptVersion.healthCheck.status === 'BLOCKED') {
      storage.recordAudit({
        projectId,
        actorId: actor.id,
        actorRole: actor.role,
        action: 'PROMPT_HEALTH_CHECK_BLOCKED',
        targetEntity: 'Task',
        targetId: task.taskId,
        afterState: { blockingIssues: promptVersion.healthCheck.blockingIssues },
        correlationId
      });

      return {
        success: false,
        error: `Prompt Health Check Failed: ${promptVersion.healthCheck.blockingIssues.join('; ')}`
      };
    }

    // 6. Create Immutable Execution Contract & Record
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const contract: ExecutionContract = {
      executionId,
      taskId: task.taskId,
      projectId: task.projectId,
      agentId: agent.agentId,
      agentVersion: agent.version,
      promptId: promptVersion.id,
      contextPackageId: contextPackage.id,
      executionPolicy,
      allowedActions: task.allowedActions,
      prohibitedActions: task.prohibitedActions,
      stopConditions: task.stopConditions,
      escalationConditions: task.escalationConditions,
      validationRequirements: task.validationRequirements,
      startedAt: new Date().toISOString(),
      status: 'RUNNING'
    };

    const executionRecord: ExecutionRecord = {
      id: executionId,
      projectId,
      taskId: task.taskId,
      contract,
      contextPackage,
      promptVersion,
      state: 'RUNNING',
      retries: [],
      scopeViolations: [],
      isAuthoritativeStateUpdated: false,
      correlationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.executionRecords.set(executionId, executionRecord);

    // Update Task State to RUNNING
    storage.updateTaskState(projectId, task.taskId, orgId, 'RUNNING', actor, correlationId);

    // 7. Execute Agent through Provider Adapter
    const runResult = await agentAdapter.execute({
      agent,
      promptVersion,
      task,
      correlationId
    });

    if (simulateScopeViolation) {
      runResult.evidence.changedFiles.push({
        path: 'src/security/unauthorized_bypass.ts',
        beforeState: '',
        afterState: 'export const disableSecurity = true;',
        diff: '+ export const disableSecurity = true;',
        scopeStatus: 'OUT_OF_SCOPE',
        validationStatus: 'FAILED'
      });
    }

    executionRecord.evidence = runResult.evidence;
    executionRecord.contract.completedAt = new Date().toISOString();

    // 8. Scope Lock Verification on Evidence
    const scopeViolations: ScopeViolationRecord[] = [];
    const allowedWritablePaths = task.relevantFiles.filter((f: { path: string; readOnly: boolean }) => !f.readOnly).map((f: { path: string }) => f.path);

    for (const file of runResult.evidence.changedFiles) {
      if (!allowedWritablePaths.includes(file.path)) {
        file.scopeStatus = 'OUT_OF_SCOPE';
        file.validationStatus = 'FAILED';
        scopeViolations.push({
          attemptedPath: file.path,
          attemptedAction: 'FILE_EDIT',
          reason: `File '${file.path}' is not within task Scope Lock boundary.`,
          timestamp: new Date().toISOString()
        });
      }
    }

    executionRecord.scopeViolations = scopeViolations;

    // 9. Evaluate Final State
    if (scopeViolations.length > 0) {
      executionRecord.state = 'SCOPE_VIOLATION';
      executionRecord.contract.status = 'SCOPE_VIOLATION';
      
      // Auto-escalate if configured
      if (executionPolicy.autoEscalateOnViolation) {
        executionRecord.escalation = {
          reason: `Scope Lock Violation: Agent attempted out-of-scope modification to ${scopeViolations.map(s => s.attemptedPath).join(', ')}`,
          severity: 'HIGH',
          affectedComponents: scopeViolations.map(s => s.attemptedPath),
          requiredAuthority: 'PROJECT_LEAD',
          recommendedAction: 'Halt execution, inspect prompt boundaries, and review file lock contract.',
          escalatedAt: new Date().toISOString()
        };

        // Create Human Decision Queue Item
        storage.addDecisionQueueItem(projectId, {
          category: 'ESCALATION',
          priority: 'BLOCKER',
          title: `Scope Lock Breach in Task ${task.taskIdentifier}`,
          description: `Agent '${agent.name}' attempted modification of ${scopeViolations.length} unauthorized files.`,
          contextPayload: { executionId, taskId: task.taskId, scopeViolations },
          status: 'PENDING'
        });
      }

      storage.updateTaskState(projectId, task.taskId, orgId, 'BLOCKED', actor, correlationId);

      storage.recordAudit({
        projectId,
        actorId: actor.id,
        actorRole: actor.role,
        action: 'EXECUTION_SCOPE_VIOLATION',
        targetEntity: 'Execution',
        targetId: executionId,
        afterState: { scopeViolations },
        correlationId
      });

      return {
        success: false,
        executionRecord,
        error: `Scope Lock Violation: unauthorized files modified (${scopeViolations.map(s => s.attemptedPath).join(', ')})`
      };
    }

    // Check validation test results
    const allTestsPassed = runResult.evidence.testResults.every(t => t.passed);
    if (allTestsPassed) {
      executionRecord.state = 'PASSED';
      executionRecord.contract.status = 'PASSED';
      
      // Update Task State to VALIDATING
      storage.updateTaskState(projectId, task.taskId, orgId, 'VALIDATING', actor, correlationId);

      storage.recordAudit({
        projectId,
        actorId: actor.id,
        actorRole: actor.role,
        action: 'EXECUTION_EVIDENCE_CAPTURED',
        targetEntity: 'Execution',
        targetId: executionId,
        afterState: {
          executionState: 'PASSED',
          testsPassedCount: runResult.evidence.testResults.length,
          filesChangedCount: runResult.evidence.changedFiles.length
        },
        correlationId
      });
    } else {
      executionRecord.state = 'FAILED';
      executionRecord.contract.status = 'FAILED';
      storage.updateTaskState(projectId, task.taskId, orgId, 'BLOCKED', actor, correlationId);
    }

    executionRecord.updatedAt = new Date().toISOString();
    return {
      success: executionRecord.state === 'PASSED',
      executionRecord
    };
  }

  /**
   * Promote Validated Execution Evidence to Authoritative State
   * (Human or authorized Lead verification)
   */
  public promoteEvidenceToAuthoritativeState(
    executionId: string,
    projectId: string,
    orgId: string,
    actor: User,
    correlationId: string,
    reviewNotes: string = 'Evidence verified and accepted into authoritative project baseline.'
  ): { success: boolean; error?: string; task?: UniversalTaskSpecification } {
    const record = this.executionRecords.get(executionId);
    if (!record) {
      return { success: false, error: `Execution record ${executionId} not found.` };
    }

    if (record.state !== 'PASSED') {
      return { success: false, error: `Cannot promote execution in state '${record.state}'. Must be 'PASSED'.` };
    }

    if (record.isAuthoritativeStateUpdated) {
      return { success: false, error: 'Execution evidence has already been promoted.' };
    }

    const taskResult = storage.updateTaskState(projectId, record.taskId, orgId, 'PASSED', actor, correlationId);
    if (!taskResult.success) {
      return { success: false, error: taskResult.error };
    }

    record.isAuthoritativeStateUpdated = true;
    record.updatedAt = new Date().toISOString();

    storage.recordAudit({
      projectId,
      actorId: actor.id,
      actorRole: actor.role,
      action: 'EXECUTION_EVIDENCE_PROMOTED_TO_AUTHORITATIVE_STATE',
      targetEntity: 'Task',
      targetId: record.taskId,
      afterState: {
        executionId,
        acceptedBy: actor.id,
        role: actor.role,
        reviewNotes
      },
      correlationId
    });

    return {
      success: true,
      task: taskResult.task
    };
  }

  /**
   * Get all execution records for a project
   */
  public getExecutionsForProject(projectId: string): ExecutionRecord[] {
    return Array.from(this.executionRecords.values())
      .filter(e => e.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get specific execution record
   */
  public getExecution(executionId: string): ExecutionRecord | undefined {
    return this.executionRecords.get(executionId);
  }

  /**
   * Compute Execution Metrics Summary for a project
   */
  public getMetricsSummary(projectId: string): ExecutionMetricsSummary {
    const tasks = storage.getTasks(projectId);
    const executions = this.getExecutionsForProject(projectId);

    const readyTasks = tasks.filter(t => t.state === 'READY').length;
    const running = executions.filter(e => e.state === 'RUNNING').length;
    const blocked = executions.filter(e => e.state === 'BLOCKED' || e.state === 'SECURITY_BLOCKED').length;
    const failed = executions.filter(e => e.state === 'FAILED').length;
    const escalated = executions.filter(e => e.state === 'ESCALATED' || !!e.escalation).length;
    const pendingValidation = executions.filter(e => e.state === 'PASSED' && !e.isAuthoritativeStateUpdated).length;
    const completed = executions.filter(e => e.isAuthoritativeStateUpdated).length;

    let totalDuration = 0;
    let finishedCount = 0;
    let scopeViolations = 0;
    let retries = 0;
    let fallbacks = 0;

    for (const e of executions) {
      if (e.contract.completedAt) {
        totalDuration += (new Date(e.contract.completedAt).getTime() - new Date(e.contract.startedAt).getTime());
        finishedCount++;
      }
      scopeViolations += e.scopeViolations.length;
      retries += e.retries.length;
      if (e.fallbackOccurred) fallbacks++;
    }

    return {
      readyTasks,
      runningExecutions: running,
      blockedExecutions: blocked,
      failedExecutions: failed,
      escalatedExecutions: escalated,
      pendingValidation,
      completedExecutions: completed,
      totalRetries: retries,
      totalFallbacks: fallbacks,
      scopeViolations,
      averageDurationMs: finishedCount > 0 ? Math.round(totalDuration / finishedCount) : 0
    };
  }
}

export const executionEngine = new ExecutionEngine();
