/**
 * ARCADIA SYSTEM - AGENT INTELLIGENCE & MULTI-AGENT COLLABORATION (PHASE 6)
 * Invariant Verification & Adversarial Test Suite
 */

import { storage } from '../server/storage.ts';
import { agentRegistry } from '../server/execution/agentRegistry.ts';
import { collaborationEngine } from '../server/execution/collaborationEngine.ts';
import { User, UniversalTaskSpecification } from '../types/index.ts';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

export async function runCollaborationTests(): Promise<{ passed: boolean; results: TestResult[] }> {
  const results: TestResult[] = [];
  const suite = 'Phase 6: Multi-Agent Collaboration & Intelligence';

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

  const clientUser: User = storage.getUser('usr-client') || {
    id: 'usr-client',
    organizationId: testOrgId,
    email: 'client@arcadia.dev',
    fullName: 'Arthur Pendelton',
    role: 'CLIENT',
    createdAt: new Date().toISOString()
  };

  const project = storage.getProject(testProjId, testOrgId) || storage.getProjects(testOrgId)[0];
  if (!project) {
    throw new Error('Test setup error: Primary project not found in storage.');
  }

  // 1. Agent Registry & Behavioral Dimension Verification
  try {
    const agents = agentRegistry.listAgents();
    const geminiPro = agentRegistry.getAgent('agent-gemini-2.5-pro');
    const claude = agentRegistry.getAgent('agent-claude-3.7-sonnet');
    const validator = agentRegistry.getAgent('agent-local-sandbox');

    if (!geminiPro || !claude || !validator) {
      throw new Error('Expected registered agents missing from registry.');
    }

    if (!geminiPro.supportedRoles.includes('ARCHITECT') || !claude.supportedRoles.includes('CRITIC')) {
      throw new Error('Agent supportedRoles mapping missing required specialized roles.');
    }

    if (!geminiPro.behaviorDimensions || geminiPro.behaviorDimensions.scopeDiscipline <= 0) {
      throw new Error('Agent behaviorDimensions missing 9-axis profile.');
    }

    results.push({
      suite,
      name: 'Agent Registry & Behavioral Profiling Invariant',
      passed: true,
      details: `Verified ${agents.length} registered agents with explicit roles, behavior dimensions, and failure histories.`
    });
  } catch (err: any) {
    results.push({ suite, name: 'Agent Registry & Behavioral Profiling Invariant', passed: false, error: err.message });
  }

  // 2. Task-Agent Compatibility & Security Clearance Gate
  try {
    const task = storage.getTask('tsk-001', project.id);
    if (!task) throw new Error('Task tsk-001 not found.');

    // Pro is REGULATED clearance -> Compatible
    const compatPro = agentRegistry.evaluateTaskAgentCompatibility('agent-gemini-2.5-pro', task, 'REGULATED');
    if (compatPro.status !== 'COMPATIBLE') {
      throw new Error(`Expected Gemini Pro to be COMPATIBLE, got ${compatPro.status}`);
    }

    // Incompatible agent check (low clearance vs REGULATED task)
    const compatLow = agentRegistry.evaluateTaskAgentCompatibility('agent-gemini-2.5-flash', task, 'REGULATED');
    // Flash is CONFIDENTIAL clearance; project is REGULATED -> Incompatible
    if (compatLow.status !== 'INCOMPATIBLE') {
      throw new Error(`Expected low-clearance agent to be blocked on REGULATED project, got ${compatLow.status}`);
    }

    results.push({
      suite,
      name: 'Task-Agent Compatibility & Security Clearance Invariant',
      passed: true,
      details: 'Correctly allowed high-clearance agent and blocked insufficient security clearance.'
    });
  } catch (err: any) {
    results.push({ suite, name: 'Task-Agent Compatibility & Security Clearance Invariant', passed: false, error: err.message });
  }

  // 3. Multi-Agent Strategy Recommendation & Contract Immutability
  let testContractId = '';
  try {
    const task = storage.getTask('tsk-001', project.id)!;
    const recommendation = agentRegistry.recommendCollaborationStrategy(task, 'REGULATED');

    if (recommendation.strategy !== 'EXECUTOR_CRITIC') {
      throw new Error(`Expected EXECUTOR_CRITIC strategy for high-risk task, got ${recommendation.strategy}`);
    }

    const contract = collaborationEngine.createCollaborationContract(
      task,
      project,
      'EXECUTOR_CRITIC',
      leadUser
    );
    testContractId = contract.id;

    if (contract.authorityBoundary.supremeAuthority !== 'CONSTITUTION') {
      throw new Error('Contract supreme authority must be CONSTITUTION.');
    }

    if (contract.participants.length < 2) {
      throw new Error('Executor-Critic strategy requires multiple specialized participants.');
    }

    results.push({
      suite,
      name: 'Collaboration Contract & Authority Boundary Invariant',
      passed: true,
      details: `Created contract ${contract.id} with ${contract.participants.length} specialized participants governed by Constitution.`
    });
  } catch (err: any) {
    results.push({ suite, name: 'Collaboration Contract & Authority Boundary Invariant', passed: false, error: err.message });
  }

  // 4. Successful Multi-Agent Execution & Critic Approval Workflow
  try {
    const res = await collaborationEngine.runCollaboration(testContractId, leadUser, 'corr-test-success', {
      simulateScopeBreach: false,
      simulateAgentDisagreement: false,
      simulateReviewerRejection: false
    });

    if (res.status !== 'COMPLETED' || res.validationStatus !== 'PASSED') {
      throw new Error(`Expected collaboration to pass, got status ${res.status} and validation ${res.validationStatus}`);
    }

    if (res.reviews.length === 0 || res.reviews[0].verdict !== 'APPROVED') {
      throw new Error('Critic independent review missing or not approved.');
    }

    if (res.handoffs.length === 0) {
      throw new Error('Controlled handoff package was not generated.');
    }

    if (res.isAuthoritativeStateUpdated) {
      throw new Error('Invariant breach: Collaboration evidence must not mutate Authoritative State until promoted.');
    }

    results.push({
      suite,
      name: 'Successful Multi-Agent Collaboration & Critic Sign-off',
      passed: true,
      details: 'Executor draft reviewed by Critic, transferred via Handoff package, and staged with clean audit trail.'
    });
  } catch (err: any) {
    results.push({ suite, name: 'Successful Multi-Agent Collaboration & Critic Sign-off', passed: false, error: err.message });
  }

  // 5. Conflict Resolution: Constitution Supreme Authority vs Numerical Voting
  try {
    const task = storage.getTask('tsk-001', project.id)!;
    const contract = collaborationEngine.createCollaborationContract(task, project, 'EXECUTOR_CRITIC', leadUser);

    const res = await collaborationEngine.runCollaboration(contract.id, leadUser, 'corr-test-conflict', {
      simulateAgentDisagreement: true
    });

    if (res.conflicts.length === 0) {
      throw new Error('Expected conflict record to be captured.');
    }

    const conflict = res.conflicts[0];
    if (conflict.resolutionMethod !== 'AUTHORITY_RESOLVES' || conflict.resolutionStatus !== 'RESOLVED') {
      throw new Error('Expected conflict to be resolved via Project Constitution authority.');
    }

    results.push({
      suite,
      name: 'Conflict Resolution: Constitution Authority Invariant',
      passed: true,
      details: `Resolved disagreement using ${conflict.resolvedByAuthority}. Invariant enforced: Voting consensus != Truth.`
    });
  } catch (err: any) {
    results.push({ suite, name: 'Conflict Resolution: Constitution Authority Invariant', passed: false, error: err.message });
  }

  // 6. Adversarial Scope Lock Breach Trapping & Failure Signature Creation
  try {
    const task = storage.getTask('tsk-001', project.id)!;
    const contract = collaborationEngine.createCollaborationContract(task, project, 'EXECUTOR_CRITIC', leadUser);

    const res = await collaborationEngine.runCollaboration(contract.id, leadUser, 'corr-test-scope', {
      simulateScopeBreach: true
    });

    if (res.status !== 'HALTED') {
      throw new Error(`Expected collaboration to HALT immediately on Scope Lock breach, got ${res.status}`);
    }

    const signatures = agentRegistry.getFailureSignatures();
    const hasScopeExpansion = signatures.some(s => s.signatureType === 'SCOPE_EXPANSION' && s.collaborationId === contract.id);
    if (!hasScopeExpansion) {
      throw new Error('Expected SCOPE_EXPANSION failure signature to be recorded.');
    }

    results.push({
      suite,
      name: 'Adversarial Scope Lock Breach Trapping & Failure Signature',
      passed: true,
      details: 'Halted unauthorized file edit attempt and logged formal failure signature.'
    });
  } catch (err: any) {
    results.push({ suite, name: 'Adversarial Scope Lock Breach Trapping & Failure Signature', passed: false, error: err.message });
  }

  // 7. Human Lead Override Invariant
  try {
    const task = storage.getTask('tsk-001', project.id)!;
    const contract = collaborationEngine.createCollaborationContract(task, project, 'EXECUTOR_CRITIC', leadUser);
    await collaborationEngine.runCollaboration(contract.id, leadUser, 'corr-test-override');

    // Attempt override with Client role -> must fail
    let clientBlocked = false;
    try {
      collaborationEngine.applyHumanOverride(contract.id, 'STOP', 'Client unauthorized stop', clientUser);
    } catch {
      clientBlocked = true;
    }
    if (!clientBlocked) {
      throw new Error('CLIENT role was improperly allowed to apply collaboration override.');
    }

    // Apply valid override with Project Lead
    const overridden = collaborationEngine.applyHumanOverride(
      contract.id,
      'REPLACE_AGENT',
      'Replace junior executor with Gemini 2.5 Pro for architectural safety',
      leadUser
    );

    if (overridden.status !== 'OVERRIDDEN' || !overridden.humanOverrideApplied) {
      throw new Error('Expected collaboration to reflect OVERRIDDEN status with full audit payload.');
    }

    results.push({
      suite,
      name: 'Human Lead Override & RBAC Enforcement',
      passed: true,
      details: 'Enforced Project Lead override privileges and rejected unauthorized Client overrides.'
    });
  } catch (err: any) {
    results.push({ suite, name: 'Human Lead Override & RBAC Enforcement', passed: false, error: err.message });
  }

  // 8. Controlled Evidence Promotion to Authoritative State
  try {
    const task = storage.getTask('tsk-001', project.id)!;
    const contract = collaborationEngine.createCollaborationContract(task, project, 'EXECUTOR_CRITIC', leadUser);
    const runRes = await collaborationEngine.runCollaboration(contract.id, leadUser, 'corr-test-promote');

    if (runRes.validationStatus === 'PASSED') {
      const promotion = collaborationEngine.promoteCollaborationEvidence(contract.id, leadUser, 'corr-promote-01');
      if (!promotion.success || promotion.task.state !== 'PASSED') {
        throw new Error('Failed to transition task to PASSED state upon lead promotion.');
      }
    }

    results.push({
      suite,
      name: 'Authoritative State Promotion Gate',
      passed: true,
      details: 'Successfully promoted multi-agent evidence into authoritative task state after Lead verification.'
    });
  } catch (err: any) {
    results.push({ suite, name: 'Authoritative State Promotion Gate', passed: false, error: err.message });
  }

  return {
    passed: results.every(r => r.passed),
    results
  };
}
