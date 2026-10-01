/**
 * ARCADIA SYSTEM - EXECUTION LAYER (PHASE 5)
 * Module: Adaptive Pipeline Engine
 * 
 * Adapts execution complexity based on actual system characteristics (L0 through L5).
 * Prevents unnecessary enterprise bureaucracy on trivial landing pages while enforcing
 * strict multi-gate validation on complex, sensitive business systems.
 */

import { Project, ProjectComplexity, UniversalTaskSpecification, ExecutionPolicy } from '../../types/index.ts';

export interface ComplexityProfile {
  level: ProjectComplexity;
  name: string;
  description: string;
  characteristics: string[];
  requiredGates: string[];
  defaultExecutionPolicy: ExecutionPolicy;
}

export const COMPLEXITY_PROFILES: Record<ProjectComplexity, ComplexityProfile> = {
  L0: {
    level: 'L0',
    name: 'Static / Landing',
    description: 'Static landing pages, simple content display without state, database, or authentication.',
    characteristics: ['Static content', 'No backend database', 'No authentication', 'No external APIs'],
    requiredGates: ['TASK_VALIDITY', 'BASIC_SCOPE_LOCK'],
    defaultExecutionPolicy: {
      maxRetries: 1,
      timeoutMs: 30000,
      allowFallback: false,
      autoEscalateOnViolation: false
    }
  },
  L1: {
    level: 'L1',
    name: 'Business Website',
    description: 'Marketing and informational websites with contact forms or simple analytics.',
    characteristics: ['Basic forms', 'Public data only', 'Client-side state'],
    requiredGates: ['TASK_VALIDITY', 'SCOPE_LOCK', 'STATIC_CHECKS'],
    defaultExecutionPolicy: {
      maxRetries: 2,
      timeoutMs: 45000,
      allowFallback: true,
      fallbackAgentId: 'agent-gemini-2.5-flash',
      autoEscalateOnViolation: true
    }
  },
  L2: {
    level: 'L2',
    name: 'Interactive Website',
    description: 'Single-page applications with client-side interactive state, animations, and local cache.',
    characteristics: ['Interactive UI', 'Client cache', 'Local state management', 'Component hierarchy'],
    requiredGates: ['TASK_VALIDITY', 'SCOPE_LOCK', 'STATIC_CHECKS', 'COMPONENT_TESTS'],
    defaultExecutionPolicy: {
      maxRetries: 2,
      timeoutMs: 60000,
      allowFallback: true,
      fallbackAgentId: 'agent-gemini-2.5-flash',
      autoEscalateOnViolation: true
    }
  },
  L3: {
    level: 'L3',
    name: 'Web Application',
    description: 'Full-stack application with user accounts, relational/document storage, and REST APIs.',
    characteristics: ['User authentication', 'Database persistence', 'Role-based access', 'REST/GraphQL APIs'],
    requiredGates: ['TASK_VALIDITY', 'DEPENDENCY_CHECK', 'AUTHORITY_CHECK', 'SCOPE_LOCK', 'TEST_SUITE', 'SECURITY_FILTER'],
    defaultExecutionPolicy: {
      maxRetries: 3,
      timeoutMs: 90000,
      allowFallback: true,
      fallbackAgentId: 'agent-gemini-2.5-pro',
      autoEscalateOnViolation: true
    }
  },
  L4: {
    level: 'L4',
    name: 'Business System',
    description: 'Mission-critical business workflows, payment processing, multi-tenant RBAC, and audit logs.',
    characteristics: ['Payments / Financial transactions', 'Multi-tenant isolation', 'Immutable audit logs', 'Complex state machines', 'Background jobs'],
    requiredGates: ['TASK_VALIDITY', 'DEPENDENCY_CHECK', 'REQUIREMENTS_RATIFIED', 'AUTHORITY_CHECK', 'SECURITY_REVIEW', 'SCOPE_LOCK', 'REGRESSION_SUITE', 'AUDIT_INTEGRITY'],
    defaultExecutionPolicy: {
      maxRetries: 3,
      timeoutMs: 120000,
      allowFallback: true,
      fallbackAgentId: 'agent-claude-3.7-sonnet',
      autoEscalateOnViolation: true
    }
  },
  L5: {
    level: 'L5',
    name: 'Complex / Enterprise',
    description: 'Regulated systems with strict compliance (SOC2, HIPAA, GDPR), financial risk, and zero-trust boundaries.',
    characteristics: ['Regulatory compliance', 'Cryptographic boundaries', 'Zero-trust architecture', 'Zero data leakage tolerance', 'Dual-approval human gates'],
    requiredGates: ['FULL_CONSTITUTION_GATE', 'DEPENDENCY_CHECK', 'REQUIREMENTS_RATIFIED', 'ARCHITECT_AUTHORITY', 'SECURITY_OFFICER_REVIEW', 'STRICT_SCOPE_LOCK', 'CI_AUTOMATION', 'MANDATORY_HUMAN_SIGN_OFF'],
    defaultExecutionPolicy: {
      maxRetries: 2,
      timeoutMs: 180000,
      allowFallback: false,
      autoEscalateOnViolation: true
    }
  }
};

export class AdaptivePipelineEngine {
  /**
   * Determine project complexity dynamically based on project characteristics and constitution
   */
  public evaluateProjectComplexity(project: Project, characteristics: string[] = []): ComplexityProfile {
    let baseLevel: ProjectComplexity = project.complexityLevel || 'L2';
    
    // If high risk indicators exist, adapt complexity up
    const hasFinancial = characteristics.some(c => c.toLowerCase().includes('payment') || c.toLowerCase().includes('financial') || c.toLowerCase().includes('billing'));
    const hasRegulated = characteristics.some(c => c.toLowerCase().includes('gdpr') || c.toLowerCase().includes('soc2') || c.toLowerCase().includes('compliance') || c.toLowerCase().includes('regulated'));
    const hasAuth = characteristics.some(c => c.toLowerCase().includes('auth') || c.toLowerCase().includes('rbac') || c.toLowerCase().includes('multi-tenant'));

    if (hasRegulated) {
      baseLevel = 'L5';
    } else if (hasFinancial) {
      baseLevel = 'L4';
    } else if (hasAuth && (baseLevel === 'L0' || baseLevel === 'L1' || baseLevel === 'L2')) {
      baseLevel = 'L3';
    }

    return COMPLEXITY_PROFILES[baseLevel];
  }

  /**
   * Get tailored execution policy for a given task and project
   */
  public getExecutionPolicy(project: Project, task: UniversalTaskSpecification): ExecutionPolicy {
    const profile = COMPLEXITY_PROFILES[project.complexityLevel || 'L2'];
    const basePolicy = { ...profile.defaultExecutionPolicy };

    // Task-specific complexity override if task is marked HIGH complexity
    if (task.complexity === 'HIGH') {
      basePolicy.timeoutMs = Math.max(basePolicy.timeoutMs, 120000);
      basePolicy.maxRetries = Math.min(basePolicy.maxRetries, 2); // Avoid excessive runaway loops on high complexity
    }

    return basePolicy;
  }
}

export const adaptivePipeline = new AdaptivePipelineEngine();
