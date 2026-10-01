/**
 * ARCADIA SYSTEM - EXECUTION LAYER (PHASE 5)
 * Module: Task Readiness Gate
 * 
 * Implements the strict 8-step Task Readiness Gate before any task can enter
 * Context Orchestration or execution:
 * 
 * TASK CREATED -> TASK ANALYZED -> DEPENDENCIES CHECKED -> REQUIREMENTS CHECKED
 * -> AUTHORITY CHECKED -> SECURITY CHECKED -> SCOPE LOCK CHECKED -> ACCEPTANCE & VALIDATION CHECKED
 */

import {
  UniversalTaskSpecification,
  Project,
  Requirement,
  TaskReadinessGateResult,
  TaskReadinessGateCheck,
  TaskReadinessStatus
} from '../../types/index.ts';

export class TaskReadinessGate {
  /**
   * Evaluates readiness of a task against project context, requirements, and dependencies
   */
  public evaluateTaskReadiness(
    task: UniversalTaskSpecification,
    project: Project,
    allTasks: UniversalTaskSpecification[],
    requirements: Requirement[]
  ): TaskReadinessGateResult {
    const checks: TaskReadinessGateCheck[] = [];
    const blockingReasons: string[] = [];
    const missingPrerequisites: TaskReadinessGateResult['missingPrerequisites'] = {
      dependencies: [],
      requirements: [],
      decisions: [],
      approvals: []
    };

    // 1. Task Existence & Identity Check
    if (!task.taskId || !task.taskIdentifier || !task.title) {
      checks.push({
        name: 'TASK_IDENTITY',
        passed: false,
        message: 'Task missing mandatory identity fields (taskId, identifier, or title).',
        severity: 'BLOCKING'
      });
      blockingReasons.push('Incomplete task identity definition.');
    } else {
      checks.push({
        name: 'TASK_IDENTITY',
        passed: true,
        message: `Task ${task.taskIdentifier} has verified identity structure.`,
        severity: 'INFO'
      });
    }

    // 2. Objective Clarity Check
    if (!task.objective || task.objective.trim().length < 10) {
      checks.push({
        name: 'OBJECTIVE_CLARITY',
        passed: false,
        message: 'Task objective is missing or insufficiently detailed (< 10 chars).',
        severity: 'BLOCKING'
      });
      blockingReasons.push('Task objective is ambiguous or empty.');
    } else {
      checks.push({
        name: 'OBJECTIVE_CLARITY',
        passed: true,
        message: 'Task objective is explicitly formulated.',
        severity: 'INFO'
      });
    }

    // 3. Task Dependencies Resolution Check
    let dependenciesPassed = true;
    if (task.dependencies && task.dependencies.length > 0) {
      for (const depId of task.dependencies) {
        const depTask = allTasks.find(t => t.taskId === depId || t.taskIdentifier === depId);
        if (!depTask) {
          dependenciesPassed = false;
          missingPrerequisites.dependencies?.push(depId);
          blockingReasons.push(`Unresolved dependency: Task '${depId}' not found.`);
        } else if (depTask.state !== 'PASSED') {
          dependenciesPassed = false;
          missingPrerequisites.dependencies?.push(depId);
          blockingReasons.push(`Dependency '${depTask.taskIdentifier}' is in state '${depTask.state}' (requires 'PASSED').`);
        }
      }
    }

    checks.push({
      name: 'TASK_DEPENDENCIES',
      passed: dependenciesPassed,
      message: dependenciesPassed
        ? `All ${task.dependencies?.length || 0} task dependencies resolved and passed.`
        : `Task has unresolved dependencies: ${missingPrerequisites.dependencies?.join(', ')}.`,
      severity: dependenciesPassed ? 'INFO' : 'BLOCKING'
    });

    // 4. Requirements Provenance & Approval Check
    let requirementsPassed = true;
    if (task.requirementsSatisfied && task.requirementsSatisfied.length > 0) {
      for (const reqIdent of task.requirementsSatisfied) {
        const req = requirements.find(r => r.reqIdentifier === reqIdent || r.id === reqIdent);
        if (!req) {
          requirementsPassed = false;
          missingPrerequisites.requirements?.push(reqIdent);
          blockingReasons.push(`Governing requirement '${reqIdent}' not found in project requirements.`);
        } else if (req.status !== 'APPROVED' && req.status !== 'VALIDATED') {
          requirementsPassed = false;
          missingPrerequisites.requirements?.push(reqIdent);
          blockingReasons.push(`Governing requirement '${req.reqIdentifier}' is '${req.status}' (requires 'APPROVED' or 'VALIDATED').`);
        }
      }
    } else {
      // Warning if task satisfies no explicit requirements
      checks.push({
        name: 'REQUIREMENTS_MAPPING',
        passed: true,
        message: 'Task has no explicit requirements mapped (isolated maintenance or infra task).',
        severity: 'WARNING'
      });
    }

    if (task.requirementsSatisfied && task.requirementsSatisfied.length > 0) {
      checks.push({
        name: 'REQUIREMENTS_APPROVAL',
        passed: requirementsPassed,
        message: requirementsPassed
          ? `All mapped requirements (${task.requirementsSatisfied.join(', ')}) are approved.`
          : `Mapped requirements not approved: ${missingPrerequisites.requirements?.join(', ')}.`,
        severity: requirementsPassed ? 'INFO' : 'BLOCKING'
      });
    }

    // 5. Authority & Project Lifecycle State Check
    const validProjectStates = ['PLANNED', 'EXECUTION', 'VALIDATION'];
    const projectStateValid = validProjectStates.includes(project.primaryState);
    if (!projectStateValid) {
      checks.push({
        name: 'PROJECT_STATE_AUTHORITY',
        passed: false,
        message: `Project is in '${project.primaryState}'. Execution is only authorized in 'PLANNED', 'EXECUTION', or 'VALIDATION'.`,
        severity: 'BLOCKING'
      });
      blockingReasons.push(`Project lifecycle state '${project.primaryState}' does not permit task execution.`);
    } else {
      checks.push({
        name: 'PROJECT_STATE_AUTHORITY',
        passed: true,
        message: `Project lifecycle state '${project.primaryState}' authorizes execution.`,
        severity: 'INFO'
      });
    }

    // 6. Security & Governance Clearance Check
    const isSecurityBlocked = project.securityState === 'BLOCKED' || project.securityState === 'RESTRICTED';
    const isGovernanceEscalated = project.governanceState === 'ESCALATED';

    if (isSecurityBlocked) {
      checks.push({
        name: 'SECURITY_CLEARANCE',
        passed: false,
        message: `Project security state is '${project.securityState}'. Execution is halted.`,
        severity: 'BLOCKING'
      });
      blockingReasons.push(`Security block active on project: ${project.securityState}.`);
    } else {
      checks.push({
        name: 'SECURITY_CLEARANCE',
        passed: true,
        message: `Security state '${project.securityState}' cleared for execution.`,
        severity: 'INFO'
      });
    }

    // 7. Scope Lock Definition Check
    const hasFiles = task.relevantFiles && task.relevantFiles.length > 0;
    const hasAllowedActions = task.allowedActions && task.allowedActions.length > 0;
    const hasProhibitedActions = task.prohibitedActions && task.prohibitedActions.length > 0;
    const scopeLockPassed = hasFiles && hasAllowedActions && hasProhibitedActions;

    checks.push({
      name: 'SCOPE_LOCK_CONTRACT',
      passed: scopeLockPassed,
      message: scopeLockPassed
        ? `Scope Lock contract valid (${task.relevantFiles.length} files bounded, ${task.prohibitedActions.length} prohibited actions defined).`
        : 'Scope Lock contract incomplete: must specify relevantFiles, allowedActions, and prohibitedActions.',
      severity: scopeLockPassed ? 'INFO' : 'BLOCKING'
    });
    if (!scopeLockPassed) {
      blockingReasons.push('Scope Lock contract incomplete (files or prohibited actions missing).');
    }

    // 8. Acceptance Criteria & Validation Requirements Check
    const hasAcceptance = task.acceptanceCriteria && task.acceptanceCriteria.length > 0;
    const hasValidation = task.validationRequirements && 
      (task.validationRequirements.mandatoryTests?.length > 0 || task.validationRequirements.staticChecks?.length > 0);

    const validationPassed = hasAcceptance && hasValidation;
    checks.push({
      name: 'ACCEPTANCE_AND_VALIDATION',
      passed: validationPassed,
      message: validationPassed
        ? `Acceptance criteria (${task.acceptanceCriteria.length} criteria) and validation rules are testable.`
        : 'Acceptance criteria or validation requirements are missing or empty.',
      severity: validationPassed ? 'INFO' : 'BLOCKING'
    });
    if (!validationPassed) {
      blockingReasons.push('Testable acceptance criteria or validation checks are missing.');
    }

    // Determine final status
    let status: TaskReadinessStatus = 'READY';
    if (isSecurityBlocked) {
      status = 'SECURITY_REVIEW_REQUIRED';
    } else if (!dependenciesPassed) {
      status = 'DEPENDENCY_BLOCKED';
    } else if (!requirementsPassed) {
      status = 'REQUIRES_APPROVAL';
    } else if (isGovernanceEscalated) {
      status = 'REQUIRES_DECISION';
    } else if (blockingReasons.length > 0) {
      status = 'BLOCKED';
    }

    return {
      status,
      passed: status === 'READY',
      checks,
      blockingReasons,
      missingPrerequisites
    };
  }
}

export const taskReadinessGate = new TaskReadinessGate();
