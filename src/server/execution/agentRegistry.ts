/**
 * ARCADIA SYSTEM - AGENT INTELLIGENCE & MULTI-AGENT COLLABORATION (PHASE 6)
 * Module: Agent Registry, Behavior Profiling & Selection Intelligence
 * 
 * Manages registered execution agents with declared capability profiles,
 * behavioral observations, failure signatures, and task compatibility evaluation.
 * 
 * CORE PRINCIPLE:
 * "Agents collaborate with each other, but they never become the authority layer."
 */

import {
  AgentProfile,
  AgentRole,
  AgentBehaviorDimensions,
  AgentFailureSignature,
  TaskAgentCompatibility,
  CollaborationStrategy,
  UniversalTaskSpecification,
  SecurityClassification
} from '../../types/index.ts';

export const REGISTERED_AGENTS: AgentProfile[] = [
  {
    agentId: 'agent-gemini-2.5-pro',
    name: 'Gemini 2.5 Pro (Deep Reasoning & Architecture)',
    provider: 'GOOGLE_GEMINI',
    model: 'gemini-2.5-pro',
    version: '2026.1',
    capabilities: [
      'CODE_GENERATION',
      'CODE_MODIFICATION',
      'REFACTORING',
      'ANALYSIS',
      'DESIGN_ANALYSIS',
      'TEST_GENERATION',
      'TOOL_USE',
      'FILE_ANALYSIS'
    ],
    supportedRoles: [
      'ARCHITECT',
      'DEVELOPER',
      'PLANNER',
      'CRITIC',
      'CODE_REVIEWER',
      'EXECUTOR',
      'ANALYST'
    ],
    supportedTaskTypes: ['ARCHITECTURE', 'FEATURE_IMPLEMENTATION', 'SECURITY_ANALYSIS', 'COMPLEX_REFACTOR'],
    maxContextTokens: 1000000,
    inputTypes: ['TEXT', 'CODE', 'JSON'],
    outputTypes: ['TEXT', 'CODE', 'DIFF', 'STRUCTURED_JSON'],
    toolCapabilities: ['FILE_EDIT', 'RUN_TEST', 'READ_FILE', 'LINT'],
    fileCapabilities: ['TYPESCRIPT', 'JAVASCRIPT', 'SQL', 'JSON', 'MARKDOWN'],
    executionRestrictions: ['NO_CREDENTIAL_EXPORT', 'BOUNDED_FILE_SYSTEM'],
    securityClassification: 'REGULATED',
    costPer1kTokens: 0.00125,
    averageExecutionTimeMs: 4200,
    reliabilityScore: 0.98,
    status: 'AVAILABLE',
    behaviorDimensions: {
      scopeDiscipline: 0.96,
      requirementAdherence: 0.98,
      architectureAdherence: 0.99,
      validationDiscipline: 0.97,
      securityDiscipline: 0.99,
      efficiency: 0.91,
      reliability: 0.98,
      escalationBehavior: 0.95,
      changeDiscipline: 0.97
    },
    knownStrengths: [
      'Exceptional architectural invariant adherence',
      'Deep 1M token context reasoning across multi-layer systems',
      'Disciplined self-checking against Acceptance Criteria'
    ],
    knownLimitations: [
      'Higher latency than Flash models for trivial edits',
      'Occasional tendency towards expansive refactor proposals without explicit scope lock'
    ],
    policyRestrictions: [
      'Mandatory Scope Lock file boundary verification on file mutations',
      'Requires human lead approval for Level 4/5 state mutations'
    ],
    performanceHistory: {
      totalTasks: 142,
      successfulTasks: 138,
      defectsDetected: 4,
      scopeViolations: 1,
      unauthorizedChanges: 0,
      retries: 3,
      escalations: 2,
      averageDurationMs: 4120,
      taskTypeBreakdown: {
        ARCHITECTURE: { total: 45, success: 44, avgDurationMs: 4400 },
        FEATURE_IMPLEMENTATION: { total: 68, success: 67, avgDurationMs: 3900 },
        SECURITY_ANALYSIS: { total: 29, success: 27, avgDurationMs: 4200 }
      }
    }
  },
  {
    agentId: 'agent-gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (Fast Execution & Testing)',
    provider: 'GOOGLE_GEMINI',
    model: 'gemini-2.5-flash',
    version: '2026.1',
    capabilities: [
      'CODE_GENERATION',
      'CODE_MODIFICATION',
      'DOCUMENTATION',
      'TEST_GENERATION',
      'TEST_EXECUTION',
      'TOOL_USE'
    ],
    supportedRoles: [
      'DEVELOPER',
      'TESTER',
      'SUMMARIZER',
      'EXECUTOR',
      'RESEARCHER'
    ],
    supportedTaskTypes: ['UNIT_TESTS', 'UI_COMPONENT', 'BUG_FIX', 'DOCUMENTATION'],
    maxContextTokens: 1000000,
    inputTypes: ['TEXT', 'CODE'],
    outputTypes: ['TEXT', 'CODE', 'DIFF'],
    toolCapabilities: ['FILE_EDIT', 'RUN_TEST', 'READ_FILE'],
    fileCapabilities: ['TYPESCRIPT', 'REACT', 'TAILWIND', 'JSON'],
    executionRestrictions: ['NO_CREDENTIAL_EXPORT'],
    securityClassification: 'CONFIDENTIAL',
    costPer1kTokens: 0.00015,
    averageExecutionTimeMs: 1400,
    reliabilityScore: 0.95,
    status: 'AVAILABLE',
    behaviorDimensions: {
      scopeDiscipline: 0.94,
      requirementAdherence: 0.95,
      architectureAdherence: 0.92,
      validationDiscipline: 0.96,
      securityDiscipline: 0.93,
      efficiency: 0.99,
      reliability: 0.95,
      escalationBehavior: 0.91,
      changeDiscipline: 0.94
    },
    knownStrengths: [
      'Ultra-fast generation and unit test cycle execution (<1.5s)',
      'Extremely high cost-efficiency for regression verification',
      'Strong React and Tailwind UI component generation'
    ],
    knownLimitations: [
      'Lower precision on multi-file systemic architecture constraints',
      'May omit subtle distributed edge-cases without explicit critic pairing'
    ],
    policyRestrictions: [
      'Requires secondary reviewer for High complexity or Regulated security tasks'
    ],
    performanceHistory: {
      totalTasks: 310,
      successfulTasks: 295,
      defectsDetected: 15,
      scopeViolations: 3,
      unauthorizedChanges: 1,
      retries: 8,
      escalations: 4,
      averageDurationMs: 1380,
      taskTypeBreakdown: {
        UNIT_TESTS: { total: 150, success: 146, avgDurationMs: 1100 },
        UI_COMPONENT: { total: 110, success: 105, avgDurationMs: 1600 },
        DOCUMENTATION: { total: 50, success: 44, avgDurationMs: 1200 }
      }
    }
  },
  {
    agentId: 'agent-claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet (Hybrid Reasoning & Critic)',
    provider: 'ANTHROPIC',
    model: 'claude-3-7-sonnet-20250219',
    version: '3.7.0',
    capabilities: [
      'CODE_GENERATION',
      'CODE_MODIFICATION',
      'REFACTORING',
      'ANALYSIS',
      'TEST_GENERATION',
      'TOOL_USE'
    ],
    supportedRoles: [
      'CRITIC',
      'CODE_REVIEWER',
      'SECURITY_REVIEWER',
      'ARCHITECT',
      'DEVELOPER'
    ],
    supportedTaskTypes: ['FEATURE_IMPLEMENTATION', 'BACKEND_LOGIC', 'SECURITY_AUDIT'],
    maxContextTokens: 200000,
    inputTypes: ['TEXT', 'CODE'],
    outputTypes: ['TEXT', 'CODE', 'DIFF'],
    toolCapabilities: ['FILE_EDIT', 'RUN_TEST'],
    fileCapabilities: ['TYPESCRIPT', 'PYTHON', 'RUST', 'SQL'],
    executionRestrictions: ['NO_CREDENTIAL_EXPORT', 'BOUNDED_FILE_SYSTEM'],
    securityClassification: 'REGULATED',
    costPer1kTokens: 0.003,
    averageExecutionTimeMs: 3800,
    reliabilityScore: 0.97,
    status: 'AVAILABLE',
    behaviorDimensions: {
      scopeDiscipline: 0.98,
      requirementAdherence: 0.97,
      architectureAdherence: 0.97,
      validationDiscipline: 0.98,
      securityDiscipline: 0.98,
      efficiency: 0.92,
      reliability: 0.97,
      escalationBehavior: 0.96,
      changeDiscipline: 0.98
    },
    knownStrengths: [
      'Rigorous independent review & code critique without bias',
      'Strong detection of subtle concurrency and security edge cases',
      'High adherence to strict Scope Lock constraints'
    ],
    knownLimitations: [
      'Context capped at 200k tokens compared to Gemini 1M',
      'Higher unit cost per token'
    ],
    policyRestrictions: [
      'Mandatory review participation for Level 3+ high-risk workflows'
    ],
    performanceHistory: {
      totalTasks: 98,
      successfulTasks: 95,
      defectsDetected: 3,
      scopeViolations: 0,
      unauthorizedChanges: 0,
      retries: 2,
      escalations: 1,
      averageDurationMs: 3750,
      taskTypeBreakdown: {
        SECURITY_AUDIT: { total: 42, success: 41, avgDurationMs: 3600 },
        CODE_REVIEW: { total: 36, success: 35, avgDurationMs: 3400 },
        BACKEND_LOGIC: { total: 20, success: 19, avgDurationMs: 4100 }
      }
    }
  },
  {
    agentId: 'agent-gpt-4o',
    name: 'OpenAI GPT-4o (Omni Specialist & Planner)',
    provider: 'OPENAI',
    model: 'gpt-4o',
    version: '2024-11-20',
    capabilities: [
      'CODE_GENERATION',
      'CODE_MODIFICATION',
      'ANALYSIS',
      'DOCUMENTATION',
      'TOOL_USE'
    ],
    supportedRoles: [
      'PLANNER',
      'DESIGNER',
      'ANALYST',
      'SUMMARIZER',
      'DEVELOPER',
      'EXECUTOR'
    ],
    supportedTaskTypes: ['GENERAL_CODING', 'API_INTEGRATION', 'DOCUMENTATION', 'PLANNING'],
    maxContextTokens: 128000,
    inputTypes: ['TEXT', 'CODE'],
    outputTypes: ['TEXT', 'CODE', 'DIFF'],
    toolCapabilities: ['FILE_EDIT', 'RUN_TEST'],
    fileCapabilities: ['TYPESCRIPT', 'HTML', 'CSS', 'JSON'],
    executionRestrictions: ['NO_CREDENTIAL_EXPORT'],
    securityClassification: 'CONFIDENTIAL',
    costPer1kTokens: 0.0025,
    averageExecutionTimeMs: 2900,
    reliabilityScore: 0.94,
    status: 'AVAILABLE',
    behaviorDimensions: {
      scopeDiscipline: 0.93,
      requirementAdherence: 0.94,
      architectureAdherence: 0.92,
      validationDiscipline: 0.94,
      securityDiscipline: 0.94,
      efficiency: 0.93,
      reliability: 0.94,
      escalationBehavior: 0.92,
      changeDiscipline: 0.93
    },
    knownStrengths: [
      'Structured execution breakdown and task planning',
      'Broad generalist API and contract integration synthesis'
    ],
    knownLimitations: [
      'Prone to occasional scope expansion if not constrained by Scope Lock',
      '128k context token limit'
    ],
    policyRestrictions: [
      'Restricted from directly modifying Level 1 Constitution rules'
    ],
    performanceHistory: {
      totalTasks: 85,
      successfulTasks: 80,
      defectsDetected: 5,
      scopeViolations: 2,
      unauthorizedChanges: 0,
      retries: 4,
      escalations: 2,
      averageDurationMs: 2840,
      taskTypeBreakdown: {
        PLANNING: { total: 35, success: 34, avgDurationMs: 2600 },
        API_INTEGRATION: { total: 30, success: 28, avgDurationMs: 3100 },
        DOCUMENTATION: { total: 20, success: 18, avgDurationMs: 2700 }
      }
    }
  },
  {
    agentId: 'agent-local-sandbox',
    name: 'Local Deterministic Runner (Air-Gapped CI & Validator)',
    provider: 'LOCAL_SANDBOX',
    model: 'deterministic-sandbox-v1',
    version: '1.0.0',
    capabilities: [
      'TEST_EXECUTION',
      'FILE_ANALYSIS',
      'TOOL_USE'
    ],
    supportedRoles: [
      'VALIDATOR',
      'TESTER'
    ],
    supportedTaskTypes: ['AUTOMATED_VERIFICATION', 'LINTING', 'SCOPE_VERIFICATION'],
    maxContextTokens: 64000,
    inputTypes: ['CODE', 'JSON'],
    outputTypes: ['TEST_RESULTS', 'AUDIT_DIFF'],
    toolCapabilities: ['RUN_TEST', 'TYPECHECK', 'LINT'],
    fileCapabilities: ['ALL'],
    executionRestrictions: ['AIR_GAPPED', 'ZERO_EXTERNAL_NETWORK'],
    securityClassification: 'REGULATED',
    costPer1kTokens: 0.0,
    averageExecutionTimeMs: 450,
    reliabilityScore: 0.999,
    status: 'AVAILABLE',
    behaviorDimensions: {
      scopeDiscipline: 1.0,
      requirementAdherence: 1.0,
      architectureAdherence: 1.0,
      validationDiscipline: 1.0,
      securityDiscipline: 1.0,
      efficiency: 1.0,
      reliability: 0.999,
      escalationBehavior: 1.0,
      changeDiscipline: 1.0
    },
    knownStrengths: [
      'Deterministic AST and compiler-level invariant verification',
      'Zero external network exposure (100% air-gapped)',
      'Sub-second execution time'
    ],
    knownLimitations: [
      'Cannot generate novel creative code (validation and verification only)'
    ],
    policyRestrictions: [
      'Enforces strictly read-only file access; cannot write to codebase'
    ],
    performanceHistory: {
      totalTasks: 450,
      successfulTasks: 450,
      defectsDetected: 0,
      scopeViolations: 0,
      unauthorizedChanges: 0,
      retries: 0,
      escalations: 0,
      averageDurationMs: 420,
      taskTypeBreakdown: {
        AUTOMATED_VERIFICATION: { total: 300, success: 300, avgDurationMs: 400 },
        SCOPE_VERIFICATION: { total: 150, success: 150, avgDurationMs: 450 }
      }
    }
  },
  {
    agentId: 'agent-security-verifier',
    name: 'Security AST & Secret Sentinel (Security Reviewer)',
    provider: 'SECURITY_ANALYZER',
    model: 'arcadia-sec-ast-v1',
    version: '1.0.0',
    capabilities: [
      'ANALYSIS',
      'FILE_ANALYSIS',
      'TOOL_USE'
    ],
    supportedRoles: [
      'SECURITY_REVIEWER',
      'VALIDATOR',
      'CRITIC'
    ],
    supportedTaskTypes: ['SECURITY_AUDIT', 'SECRET_SCANNING', 'DEPENDENCY_CHECK'],
    maxContextTokens: 128000,
    inputTypes: ['CODE', 'AST'],
    outputTypes: ['SECURITY_REPORT', 'VULNERABILITY_LIST'],
    toolCapabilities: ['STATIC_ANALYSIS'],
    fileCapabilities: ['TYPESCRIPT', 'JSON', 'ENV'],
    executionRestrictions: ['READ_ONLY_ACCESS', 'AIR_GAPPED'],
    securityClassification: 'REGULATED',
    costPer1kTokens: 0.0,
    averageExecutionTimeMs: 650,
    reliabilityScore: 0.99,
    status: 'AVAILABLE',
    behaviorDimensions: {
      scopeDiscipline: 1.0,
      requirementAdherence: 0.99,
      architectureAdherence: 1.0,
      validationDiscipline: 0.99,
      securityDiscipline: 1.0,
      efficiency: 0.98,
      reliability: 0.99,
      escalationBehavior: 1.0,
      changeDiscipline: 1.0
    },
    knownStrengths: [
      'Deep static analysis of ASTs for RBAC/Tenant isolation leaks',
      'Zero-false-negative secret token & key regex scanner',
      'Immediate blocking trap for unauthorized permissions'
    ],
    knownLimitations: [
      'Static verification only; does not generate functional feature implementations'
    ],
    policyRestrictions: [
      'Read-only inspector role; output quarantined until human lead acknowledgment'
    ],
    performanceHistory: {
      totalTasks: 210,
      successfulTasks: 208,
      defectsDetected: 2,
      scopeViolations: 0,
      unauthorizedChanges: 0,
      retries: 0,
      escalations: 5,
      averageDurationMs: 620,
      taskTypeBreakdown: {
        SECURITY_AUDIT: { total: 130, success: 128, avgDurationMs: 610 },
        SECRET_SCANNING: { total: 80, success: 80, avgDurationMs: 640 }
      }
    }
  }
];

export class AgentRegistryEngine {
  private agents: Map<string, AgentProfile> = new Map();
  private failureSignatures: AgentFailureSignature[] = [];

  constructor() {
    REGISTERED_AGENTS.forEach(a => this.agents.set(a.agentId, a));
    this.seedHistoricalFailures();
  }

  private seedHistoricalFailures() {
    this.failureSignatures.push({
      id: 'fail-sig-001',
      signatureType: 'SCOPE_EXPANSION',
      taskId: 'tsk-auth-01',
      agentId: 'agent-gpt-4o',
      evidence: 'Agent generated edits in /src/config/redis.json which was not in relevantFiles Scope Lock boundary.',
      severity: 'HIGH',
      detectionSource: 'ScopeLockStaticGate',
      validationResult: 'BLOCKED_BY_SCOPE_LOCK',
      resolution: 'Task halted. Restrictive boundary enforced. Rewritten by Gemini 2.5 Pro with strict relevantFiles parameter.',
      recurrenceCount: 1,
      timestamp: new Date(Date.now() - 86400000 * 5).toISOString()
    });

    this.failureSignatures.push({
      id: 'fail-sig-002',
      signatureType: 'INSUFFICIENT_VALIDATION',
      taskId: 'tsk-ui-02',
      agentId: 'agent-gemini-2.5-flash',
      evidence: 'Generated React button component without active disabled cursor style on isRunning state.',
      severity: 'LOW',
      detectionSource: 'CriticAgentReview',
      validationResult: 'REVISE_REQUIRED',
      resolution: 'Claude 3.7 Critic caught missing disabled CSS attribute. Revision loop added disabled:cursor-not-allowed.',
      recurrenceCount: 2,
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
    });
  }

  public listAgents(): AgentProfile[] {
    return Array.from(this.agents.values());
  }

  public getAgent(agentId: string): AgentProfile | undefined {
    if (agentId === 'agent-gemini-pro') return this.agents.get('agent-gemini-2.5-pro');
    if (agentId === 'agent-gemini-flash') return this.agents.get('agent-gemini-2.5-flash');
    return this.agents.get(agentId);
  }

  /**
   * Task-specific Agent Selection Algorithm
   * Evaluates task complexity, required capabilities, security level, and reliability.
   */
  public selectBestAgentForTask(
    task: UniversalTaskSpecification,
    projectSecurity: SecurityClassification = 'REGULATED'
  ): AgentProfile {
    const candidates = Array.from(this.agents.values()).filter(a => a.status === 'AVAILABLE');

    const securityRank: Record<SecurityClassification, number> = {
      PUBLIC: 1,
      INTERNAL: 2,
      CONFIDENTIAL: 3,
      SENSITIVE: 4,
      REGULATED: 5
    };

    const taskRequiredClearance = securityRank[projectSecurity] || 3;
    const eligibleAgents = candidates.filter(a => securityRank[a.securityClassification] >= taskRequiredClearance);

    const requiredCap = task.complexity === 'HIGH' ? 'CODE_GENERATION' : 'TEXT_GENERATION';
    const capableAgents = eligibleAgents.filter(a => 
      (a.capabilities.includes(requiredCap as any) || a.capabilities.includes('CODE_MODIFICATION') || a.capabilities.includes('CODE_GENERATION')) &&
      !a.supportedRoles.every(r => r === 'VALIDATOR' || r === 'TESTER' || r === 'SECURITY_REVIEWER')
    );
    const agentPool = capableAgents.length > 0 ? capableAgents : eligibleAgents;

    let bestAgent = agentPool[0] || candidates[0];
    let highestScore = -1;

    for (const agent of agentPool) {
      let score = 0;

      if (task.complexity === 'HIGH') {
        if (agent.capabilities.includes('REFACTORING')) score += 30;
        if (agent.capabilities.includes('DESIGN_ANALYSIS')) score += 20;
        if (agent.capabilities.includes('CODE_MODIFICATION')) score += 40;
      } else {
        if (agent.capabilities.includes('CODE_GENERATION')) score += 40;
        if (agent.capabilities.includes('TEST_GENERATION')) score += 20;
      }

      score += agent.reliabilityScore * 50;

      if (task.complexity === 'LOW' || task.complexity === 'MEDIUM') {
        score += (1 / (agent.costPer1kTokens + 0.0001)) * 0.005;
        score += (10000 / agent.averageExecutionTimeMs) * 2;
      }

      if (score > highestScore) {
        highestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  /**
   * Task-Agent Compatibility Evaluation
   * Evaluates requirements, complexity, capabilities, and security clearances.
   */
  public evaluateTaskAgentCompatibility(
    agentId: string,
    task: UniversalTaskSpecification,
    projectSecurity: SecurityClassification = 'REGULATED'
  ): TaskAgentCompatibility {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return {
        agentId,
        taskId: task.taskId,
        status: 'INCOMPATIBLE',
        compatibilityScore: 0,
        supportedRole: 'EXECUTOR',
        reasoning: 'Agent profile not found in registry.',
        risks: ['Unknown model identity'],
        recommendedControls: ['Select verified agent']
      };
    }

    const securityRank: Record<SecurityClassification, number> = {
      PUBLIC: 1,
      INTERNAL: 2,
      CONFIDENTIAL: 3,
      SENSITIVE: 4,
      REGULATED: 5
    };

    const taskRequiredClearance = securityRank[projectSecurity] || 3;
    const agentClearance = securityRank[agent.securityClassification] || 1;

    const risks: string[] = [];
    const recommendedControls: string[] = [];
    let score = 70;

    // 1. Security Check
    if (agentClearance < taskRequiredClearance) {
      return {
        agentId,
        taskId: task.taskId,
        status: 'INCOMPATIBLE',
        compatibilityScore: 10,
        supportedRole: 'EXECUTOR',
        reasoning: `Agent clearance (${agent.securityClassification}) is lower than project classification (${projectSecurity}).`,
        risks: ['Security clearance violation', 'Potential data exposure'],
        recommendedControls: ['Assign an agent with REGULATED security classification']
      };
    }

    // 2. Complexity vs Capability Check
    if (task.complexity === 'HIGH') {
      if (!agent.capabilities.includes('REFACTORING') && !agent.capabilities.includes('DESIGN_ANALYSIS')) {
        score -= 25;
        risks.push('Agent lacks specialized High-Complexity refactoring / design capabilities.');
        recommendedControls.push('Pair with an ARCHITECT or CRITIC agent (e.g. Gemini 2.5 Pro or Claude 3.7).');
      } else {
        score += 20;
      }
    } else {
      score += 15;
    }

    // 3. Historical Scope Discipline Check
    if (agent.behaviorDimensions && agent.behaviorDimensions.scopeDiscipline < 0.95) {
      risks.push('Historical tendency toward scope boundary expansion.');
      recommendedControls.push('Activate strict real-time Scope Lock boundary traps during execution.');
      score -= 10;
    } else {
      score += 10;
    }

    // 4. Determine Recommended Role
    let recommendedRole: AgentRole = 'DEVELOPER';
    if (agent.supportedRoles.includes('ARCHITECT') && task.complexity === 'HIGH') {
      recommendedRole = 'ARCHITECT';
    } else if (agent.supportedRoles.includes('DEVELOPER')) {
      recommendedRole = 'DEVELOPER';
    } else if (agent.supportedRoles.includes('VALIDATOR')) {
      recommendedRole = 'VALIDATOR';
    } else {
      recommendedRole = agent.supportedRoles[0] || 'EXECUTOR';
    }

    const finalScore = Math.min(100, Math.max(0, score));
    const status = finalScore >= 75 ? 'COMPATIBLE' : finalScore >= 50 ? 'PARTIALLY_COMPATIBLE' : 'INCOMPATIBLE';

    return {
      agentId,
      taskId: task.taskId,
      status,
      compatibilityScore: finalScore,
      supportedRole: recommendedRole,
      reasoning: `Agent ${agent.name} exhibits ${finalScore}% compatibility for ${task.complexity} complexity task ${task.taskIdentifier}.`,
      risks,
      recommendedControls,
      secondaryRecommendations: [
        {
          agentId: 'agent-claude-3.7-sonnet',
          role: 'CRITIC',
          reason: 'Independent review without inheriting executor bias'
        },
        {
          agentId: 'agent-security-verifier',
          role: 'SECURITY_REVIEWER',
          reason: 'Automated AST secret & tenant verification'
        }
      ]
    };
  }

  /**
   * Recommend optimal multi-agent collaboration strategy for a task
   */
  public recommendCollaborationStrategy(
    task: UniversalTaskSpecification,
    projectSecurity: SecurityClassification
  ): {
    strategy: CollaborationStrategy;
    participants: { agentId: string; role: AgentRole; isIndependentReviewer?: boolean }[];
    reasoning: string;
  } {
    if (task.complexity === 'HIGH' || projectSecurity === 'REGULATED') {
      // High-risk or high-complexity: Executor + Critic + Security Reviewer
      return {
        strategy: 'EXECUTOR_CRITIC',
        participants: [
          { agentId: 'agent-gemini-2.5-pro', role: 'DEVELOPER' },
          { agentId: 'agent-claude-3.7-sonnet', role: 'CRITIC', isIndependentReviewer: true },
          { agentId: 'agent-security-verifier', role: 'SECURITY_REVIEWER', isIndependentReviewer: true },
          { agentId: 'agent-local-sandbox', role: 'VALIDATOR' }
        ],
        reasoning: 'High-risk / regulated execution requires dual-model independent critique and air-gapped invariant validation before authoritative state promotion.'
      };
    }

    if (task.complexity === 'MEDIUM') {
      // Medium: Sequential Review (Developer -> Reviewer -> Validator)
      return {
        strategy: 'SEQUENTIAL_REVIEW',
        participants: [
          { agentId: 'agent-gemini-2.5-flash', role: 'DEVELOPER' },
          { agentId: 'agent-claude-3.7-sonnet', role: 'CODE_REVIEWER', isIndependentReviewer: true },
          { agentId: 'agent-local-sandbox', role: 'VALIDATOR' }
        ],
        reasoning: 'Medium complexity leverages fast generation with independent code review and compiler validation.'
      };
    }

    // Low complexity: Single Agent with Automated Validator
    return {
      strategy: 'SINGLE_AGENT',
      participants: [
        { agentId: 'agent-gemini-2.5-flash', role: 'EXECUTOR' },
        { agentId: 'agent-local-sandbox', role: 'VALIDATOR' }
      ],
      reasoning: 'Low complexity task bounded by Scope Lock; single-agent execution with automated CI validation is optimal.'
    };
  }

  /**
   * Record failure signature
   */
  public recordFailureSignature(signature: Omit<AgentFailureSignature, 'id' | 'timestamp'>): AgentFailureSignature {
    const record: AgentFailureSignature = {
      ...signature,
      id: `fail-sig-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };
    this.failureSignatures.unshift(record);

    // Update agent failure metrics
    const agent = this.agents.get(signature.agentId);
    if (agent && agent.performanceHistory) {
      if (signature.signatureType === 'SCOPE_EXPANSION') {
        agent.performanceHistory.scopeViolations++;
      } else if (signature.signatureType === 'UNAUTHORIZED_FILE_CHANGE') {
        agent.performanceHistory.unauthorizedChanges++;
      } else {
        agent.performanceHistory.defectsDetected++;
      }
    }

    return record;
  }

  public getFailureSignatures(agentId?: string): AgentFailureSignature[] {
    if (agentId) {
      return this.failureSignatures.filter(f => f.agentId === agentId);
    }
    return [...this.failureSignatures];
  }

  /**
   * Record behavior observation after execution or collaboration
   */
  public recordBehaviorObservation(
    agentId: string,
    observation: {
      taskId: string;
      executionId?: string;
      defectFound?: boolean;
      scopeViolation?: boolean;
      validationPassed: boolean;
      durationMs: number;
    }
  ): void {
    const agent = this.agents.get(agentId);
    if (!agent || !agent.performanceHistory) return;

    agent.performanceHistory.totalTasks++;
    if (observation.validationPassed && !observation.scopeViolation) {
      agent.performanceHistory.successfulTasks++;
    }
    if (observation.scopeViolation) {
      agent.performanceHistory.scopeViolations++;
    }
    if (observation.defectFound) {
      agent.performanceHistory.defectsDetected++;
    }

    // Smooth average duration
    agent.performanceHistory.averageDurationMs = Math.round(
      (agent.performanceHistory.averageDurationMs * (agent.performanceHistory.totalTasks - 1) + observation.durationMs) /
      agent.performanceHistory.totalTasks
    );
  }
}

export const agentRegistry = new AgentRegistryEngine();
