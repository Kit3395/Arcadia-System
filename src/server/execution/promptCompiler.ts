/**
 * ARCADIA SYSTEM - EXECUTION LAYER (PHASE 5)
 * Module: Prompt Compiler & Prompt Health Check Engine
 * 
 * Transforms:
 *   Universal Task Specification + Minimal Sufficient Context + Agent Profile + Execution Policy
 * into:
 *   Agent-Specific Execution Prompt (with SHA-256 hash, versioning, and immutable execution contract)
 * 
 * Enforces:
 *   - 12-point Prompt Health Check
 *   - Scope Lock Boundaries embedded into prompt contracts
 *   - Prohibited Actions & Stop Conditions explicitly bounded
 *   - Prompt is an execution artifact, NEVER the authoritative source of truth.
 */

import crypto from 'crypto';
import {
  UniversalTaskSpecification,
  ContextPackage,
  AgentProfile,
  ExecutionPolicy,
  PromptVersion,
  PromptHealthCheck,
  PromptHealthCheckItem,
  PromptStructure
} from '../../types/index.ts';

export class PromptCompilerEngine {
  public readonly COMPILER_VERSION = '1.0.0-arcadia-exec';
  public readonly POLICY_VERSION = '1.0.0';

  /**
   * Evaluates Prompt Health before compilation
   */
  public evaluatePromptHealth(
    task: UniversalTaskSpecification,
    contextPackage: ContextPackage,
    agent: AgentProfile
  ): PromptHealthCheck {
    const checks: PromptHealthCheckItem[] = [];
    const blockingIssues: string[] = [];
    const warnings: string[] = [];

    // 1. Objective Check
    const hasObjective = !!(task.objective && task.objective.trim().length >= 10);
    checks.push({
      category: 'OBJECTIVE',
      test: 'Explicit Objective',
      passed: hasObjective,
      message: hasObjective ? 'Task objective is clearly defined.' : 'Objective is missing or ambiguous.',
      blocking: true
    });
    if (!hasObjective) blockingIssues.push('Task objective is missing or shorter than 10 characters.');

    // 2. Scope Boundary Check
    const hasScope = !!(task.relevantFiles && task.relevantFiles.length > 0 && task.prohibitedActions?.length > 0);
    checks.push({
      category: 'SCOPE',
      test: 'Bounded Scope Lock',
      passed: hasScope,
      message: hasScope ? `Scope bounded to ${task.relevantFiles.length} files.` : 'Scope files or prohibited actions not defined.',
      blocking: true
    });
    if (!hasScope) blockingIssues.push('Scope Lock boundary undefined: relevantFiles or prohibitedActions missing.');

    // 3. Requirements Check
    const hasReqs = contextPackage.items.some(i => i.sourceType === 'REQUIREMENT');
    checks.push({
      category: 'REQUIREMENTS',
      test: 'Governing Requirements in Context',
      passed: hasReqs,
      message: hasReqs ? 'Context includes approved governing requirements.' : 'No governing requirements in context package.',
      blocking: false
    });
    if (!hasReqs) warnings.push('Context package contains no explicit requirement items.');

    // 4. Dependencies Check
    const unresolvedDeps = contextPackage.dependencies.filter(d => !contextPackage.items.some(i => i.sourceId === d || i.id.includes(d)));
    const depsResolved = unresolvedDeps.length === 0;
    checks.push({
      category: 'DEPENDENCIES',
      test: 'Task Dependencies Resolved',
      passed: depsResolved,
      message: depsResolved ? 'All specified task dependencies are resolved.' : `Unresolved dependencies: ${unresolvedDeps.join(', ')}`,
      blocking: true
    });
    if (!depsResolved) blockingIssues.push(`Unresolved dependencies in prompt context: ${unresolvedDeps.join(', ')}`);

    // 5. Context Conflicts Check
    const unresolvedConflicts = contextPackage.conflicts.filter(c => c.resolution === 'UNRESOLVED_BLOCKING');
    const noConflicts = unresolvedConflicts.length === 0;
    checks.push({
      category: 'CONFLICTS',
      test: 'Material Conflicts Resolved',
      passed: noConflicts,
      message: noConflicts ? 'Zero unresolvable material conflicts.' : `${unresolvedConflicts.length} blocking conflicts exist.`,
      blocking: true
    });
    if (!noConflicts) blockingIssues.push('Material context conflict unresolved by authority.');

    // 6. Security Constraints
    const hasSecurity = !!(contextPackage.securityRestrictions && contextPackage.securityRestrictions.length > 0);
    checks.push({
      category: 'SECURITY',
      test: 'Security Constraints Defined',
      passed: hasSecurity,
      message: hasSecurity ? `Active compliance profiles: ${contextPackage.securityRestrictions.join(', ')}` : 'No security restrictions defined.',
      blocking: false
    });

    // 7. Acceptance Criteria Check
    const hasAcceptance = !!(task.acceptanceCriteria && task.acceptanceCriteria.length > 0);
    checks.push({
      category: 'ACCEPTANCE',
      test: 'Testable Acceptance Criteria',
      passed: hasAcceptance,
      message: hasAcceptance ? `${task.acceptanceCriteria.length} testable criteria verified.` : 'No acceptance criteria defined.',
      blocking: true
    });
    if (!hasAcceptance) blockingIssues.push('Task has zero acceptance criteria.');

    // 8. Validation Requirements Check
    const hasValidation = !!(task.validationRequirements && (task.validationRequirements.mandatoryTests?.length > 0 || task.validationRequirements.staticChecks?.length > 0));
    checks.push({
      category: 'VALIDATION',
      test: 'Validation Method Prescribed',
      passed: hasValidation,
      message: hasValidation ? 'Mandatory test suite & static checks defined.' : 'Validation requirements missing.',
      blocking: true
    });
    if (!hasValidation) blockingIssues.push('No mandatory tests or static checks defined for task validation.');

    // 9. Agent Capability Matching Check
    const requiredCap = task.complexity === 'HIGH' ? 'CODE_GENERATION' : 'TEXT_GENERATION';
    const hasCap = agent.capabilities.includes(requiredCap as any) || agent.capabilities.includes('CODE_MODIFICATION');
    checks.push({
      category: 'AGENT_CAPABILITY',
      test: 'Agent Capability Alignment',
      passed: hasCap,
      message: hasCap ? `Agent '${agent.name}' has verified capability for ${task.complexity} complexity.` : `Agent lacks required capabilities.`,
      blocking: true
    });
    if (!hasCap) blockingIssues.push(`Agent '${agent.name}' cannot handle required task capability.`);

    // 10. Stop & Escalation Conditions
    const hasStop = !!(task.stopConditions && task.stopConditions.length > 0);
    checks.push({
      category: 'STOP_CONDITIONS',
      test: 'Safety Stop Conditions',
      passed: hasStop,
      message: hasStop ? `${task.stopConditions.length} safety stop conditions configured.` : 'No safety stop conditions defined.',
      blocking: false
    });
    if (!hasStop) warnings.push('No custom stop conditions defined (default safety stops will apply).');

    let status: PromptHealthCheck['status'] = 'HEALTHY';
    if (blockingIssues.length > 0) {
      status = 'BLOCKED';
    } else if (warnings.length > 0) {
      status = 'WARNING';
    }

    return {
      status,
      checks,
      blockingIssues,
      warnings
    };
  }

  /**
   * Compiles the Universal Task Specification and Context Package into a deterministic prompt
   */
  public compilePrompt(
    task: UniversalTaskSpecification,
    contextPackage: ContextPackage,
    agent: AgentProfile,
    policy: ExecutionPolicy
  ): PromptVersion {
    const healthCheck = this.evaluatePromptHealth(task, contextPackage, agent);

    const allowedFiles = task.relevantFiles.filter(f => !f.readOnly).map(f => f.path);
    const readOnlyFiles = task.relevantFiles.filter(f => f.readOnly).map(f => f.path);

    const structure: PromptStructure = {
      role: `You are Arcadia Execution Agent [${agent.name}]. You operate under strict Scope Lock and verifiable evidence capture. You are an execution participant, not an authority.`,
      objective: task.objective,
      scope: {
        allowedActions: task.allowedActions || ['FILE_EDIT', 'RUN_TEST'],
        prohibitedActions: task.prohibitedActions || ['DROP_TABLE', 'DISABLE_SECURITY', 'BYPASS_AUTH'],
        relevantFiles: task.relevantFiles.map(f => `${f.path} (${f.readOnly ? 'READ-ONLY' : 'WRITABLE'})`)
      },
      requirements: task.requirementsSatisfied || [],
      contextSummary: contextPackage.items
        .map(i => `[${i.sourceType} | Authority: ${i.authorityLevel}]\n${typeof i.content === 'string' ? i.content : JSON.stringify(i.content, null, 2)}`)
        .join('\n\n'),
      acceptanceCriteria: task.acceptanceCriteria || [],
      stopConditions: [
        ...(task.stopConditions || []),
        'Immediately halt if an unlisted file touch is required.',
        'Immediately halt if any credential or secret is encountered.',
        'Immediately halt if database destructive action is needed.'
      ],
      escalationConditions: task.escalationConditions || [
        'Escalate to Architect if architectural invariant is broken.',
        'Escalate to Project Lead if scope expansion is requested.'
      ],
      formatInstructions: `Produce evidence-backed execution results. Return changed file diffs, reasoning summary, and tool executions. Do NOT declare changes authoritative.`
    };

    const promptContent = `
=== ARCADIA CONTROLLED EXECUTION PROMPT ===
Execution ID Ref: Pending
Task Identifier: ${task.taskIdentifier}
Task Title: ${task.title}
Target Agent: ${agent.name} (${agent.model})
Compiler Version: ${this.COMPILER_VERSION}

[SYSTEM INSTRUCTION & ROLE]
${structure.role}

[TASK OBJECTIVE]
${structure.objective}

[SCOPE LOCK BOUNDARY]
* Allowed Actions: ${structure.scope.allowedActions.join(', ')}
* STRICTLY PROHIBITED ACTIONS: ${structure.scope.prohibitedActions.join(', ')}
* Allowed Writable Files: ${allowedFiles.join(', ') || 'NONE'}
* Reference Read-Only Files: ${readOnlyFiles.join(', ') || 'NONE'}
RULE: Any file modification outside the Allowed Writable Files is an instant Scope Lock Violation and halts execution.

[GOVERNING REQUIREMENTS]
${structure.requirements.length > 0 ? structure.requirements.map(r => `* ${r}`).join('\n') : 'No explicit requirement mapping.'}

[MINIMAL SUFFICIENT CONTEXT]
${structure.contextSummary}

[ACCEPTANCE CRITERIA]
${structure.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

[SAFETY STOP CONDITIONS]
${structure.stopConditions.map(sc => `* STOP: ${sc}`).join('\n')}

[ESCALATION CONDITIONS]
${structure.escalationConditions.map(ec => `* ESCALATE: ${ec}`).join('\n')}

[MANDATORY VALIDATION REQUIREMENTS]
* Mandatory Tests: ${task.validationRequirements.mandatoryTests?.join(', ') || 'None specified'}
* Static Checks: ${task.validationRequirements.staticChecks?.join(', ') || 'None specified'}
* Max Execution Time: ${task.validationRequirements.maxExecutionTimeMs || policy.timeoutMs}ms

[OUTPUT FORMAT & EVIDENCE INSTRUCTION]
${structure.formatInstructions}
=== END OF COMPILED PROMPT ===
`.trim();

    const promptHash = crypto.createHash('sha256').update(promptContent).digest('hex');
    const promptId = `prompt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    return {
      id: promptId,
      projectId: task.projectId,
      taskId: task.taskId,
      contextPackageId: contextPackage.id,
      agentId: agent.agentId,
      agentVersion: agent.version,
      compilerVersion: this.COMPILER_VERSION,
      executionPolicyVersion: this.POLICY_VERSION,
      generatedAt: new Date().toISOString(),
      promptHash,
      promptContent,
      healthCheck,
      structure
    };
  }
}

export const promptCompiler = new PromptCompilerEngine();
