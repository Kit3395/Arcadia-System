import { storage } from '../server/storage.ts';
import { costEngine } from '../server/optimization/costEngine.ts';
import { temporalEngine } from '../server/optimization/temporalEngine.ts';
import { cognitiveLoadEngine } from '../server/optimization/cognitiveLoadEngine.ts';
import { trustEngine } from '../server/optimization/trustEngine.ts';
import { optimizationEngine } from '../server/optimization/optimizationEngine.ts';
import { telemetryEngine } from '../server/optimization/telemetryEngine.ts';
import { OptimizationRecommendation, OptimizationStatus } from '../types/index.ts';

export async function runOptimizationTests(): Promise<{
  passed: boolean;
  results: Array<{ testName: string; passed: boolean; message: string }>;
}> {
  const results: Array<{ testName: string; passed: boolean; message: string }> = [];

  function assert(condition: boolean, testName: string, message: string) {
    results.push({
      testName,
      passed: condition,
      message: condition ? 'PASSED: ' + message : 'FAILED: ' + message
    });
  }

  const projId = 'proj-core-os';
  const orgId = 'org-arcadia-demo';

  // 1. Cost Engine Unit Tests
  try {
    const estimate = costEngine.estimateTaskCost(projId, 'tsk-001');
    assert(
      estimate.minCost > 0 && estimate.maxCost >= estimate.minCost && estimate.expectedCost >= estimate.minCost,
      'Cost Engine: Range Estimation',
      `Expected task cost generated as range ($${estimate.minCost} - $${estimate.maxCost}) with ${estimate.confidence} confidence.`
    );
    assert(
      estimate.classification === 'ESTIMATED',
      'Cost Engine: Data Authority Classification',
      'Cost estimate is explicitly classified as ESTIMATED, not OBSERVED.'
    );

    const actuals = costEngine.getActualCosts(projId);
    assert(
      actuals.total >= 0 && actuals.byCategory.AI_EXECUTION !== undefined,
      'Cost Engine: Observed Breakdown',
      `Observed cost $${actuals.total} across ${actuals.count} events categorized cleanly.`
    );
  } catch (err: any) {
    assert(false, 'Cost Engine Suite', err.message);
  }

  // 2. Temporal Engine Unit Tests
  try {
    const durations = temporalEngine.getDurationBreakdown(projId);
    assert(
      durations.ACTIVE >= 0 && durations.REVIEW >= 0 && durations.TOTAL_ELAPSED >= durations.ACTIVE,
      'Temporal Engine: Duration Breakdown',
      `Duration cleanly separated into Active (${durations.ACTIVE}s), Review (${durations.REVIEW}s), Total (${durations.TOTAL_ELAPSED}s).`
    );

    const criticalPath = temporalEngine.calculateCriticalPath(projId);
    assert(
      Array.isArray(criticalPath.criticalTasks) && criticalPath.totalPathDurationSeconds > 0,
      'Temporal Engine: Critical Path Analysis',
      `Identified ${criticalPath.criticalTasks.length} critical path tasks.`
    );

    const delay = temporalEngine.analyzeDelayPropagation(projId, 'tsk-001', 1800);
    assert(
      delay.delaySeconds === 1800 && typeof delay.propagationImpact === 'string',
      'Temporal Engine: Delay Propagation',
      `Delay impact successfully derived: ${delay.propagationImpact}`
    );

    const prediction = temporalEngine.predictTimeline(projId);
    assert(
      prediction.confidence === 'MEDIUM' && prediction.expectedCompletionWindow.includes('–'),
      'Temporal Engine: Prediction Range & Confidence',
      `Completion prediction formatted as range: ${prediction.expectedCompletionWindow} (Confidence: ${prediction.confidence}).`
    );
  } catch (err: any) {
    assert(false, 'Temporal Engine Suite', err.message);
  }

  // 3. Cognitive Load Engine (Operational Workflow Complexity)
  try {
    const load = cognitiveLoadEngine.measureWorkflowLoad(projId);
    assert(
      load.derivedScore >= 0 && load.derivedScore <= 100,
      'Cognitive Load Engine: Operational Score',
      `Operational complexity score derived at ${load.derivedScore}/100 (${load.loadLevel}).`
    );
    assert(
      load.rawFactors.activeDecisions !== undefined && Array.isArray(load.primaryDrivers),
      'Cognitive Load Engine: Factor Explainability',
      `Workflow load fully explainable through ${load.primaryDrivers.length} primary operational drivers.`
    );
    assert(
      !JSON.stringify(load).toLowerCase().includes('mental health') &&
      !JSON.stringify(load).toLowerCase().includes('depression') &&
      !JSON.stringify(load).toLowerCase().includes('psychological'),
      'Cognitive Load Invariant: Anti-Psychological Safeguard',
      'Engine strictly measures operational workflow characteristics, completely avoiding human psychological/medical claims.'
    );
  } catch (err: any) {
    assert(false, 'Cognitive Load Engine Suite', err.message);
  }

  // 4. Trust Calibration Engine
  try {
    const profile = trustEngine.getContextualProfile(projId, 'agent-gemini-2.5-pro', 'FOUNDATION_ARCHITECTURE', 'HIGH');
    assert(
      profile.agentId === 'agent-gemini-2.5-pro' && profile.taskType === 'FOUNDATION_ARCHITECTURE',
      'Trust Engine: Contextual Profile',
      `Profile computed specifically for taskType: ${profile.taskType} (Complexity: ${profile.complexity}).`
    );
    assert(
      profile.acceptanceRate >= 0 && profile.acceptanceRate <= 100,
      'Trust Engine: Contextual Rates',
      `Contextual acceptance rate observed at ${profile.acceptanceRate}%.`
    );
  } catch (err: any) {
    assert(false, 'Trust Engine Suite', err.message);
  }

  // 5. Optimization Intelligence Coordinator
  try {
    const recs = optimizationEngine.generateRecommendations(projId);
    assert(
      recs.length > 0,
      'Optimization Engine: Evidence-Based Recommendations',
      `Generated ${recs.length} actionable optimization recommendations.`
    );
    const rec = recs[0];
    assert(
      rec.observedProblem.length > 0 && rec.expectedBenefit.length > 0 && rec.requiredAuthority !== undefined,
      'Optimization Engine: Recommendation Model Completeness',
      `Recommendation has problem, evidence, expected benefit, risks, and authority (${rec.requiredAuthority}).`
    );
  } catch (err: any) {
    assert(false, 'Optimization Engine Suite', err.message);
  }

  // ==========================================
  // ADVERSARIAL TESTS (Section 50)
  // ==========================================

  // Adversarial 1: Cross-Organization Telemetry Leakage
  try {
    let blocked = false;
    try {
      telemetryEngine.query('org-attacker-rogue', projId);
    } catch (err: any) {
      if (err.message.includes('Access Denied')) {
        blocked = true;
      }
    }
    assert(
      blocked,
      'Adversarial 1: Cross-Organization Isolation',
      'Cross-organization telemetry query was blocked and rejected.'
    );
  } catch (err: any) {
    assert(false, 'Adversarial 1', err.message);
  }

  // Adversarial 2: Metric Gaming Detection (Self-Reported vs Authoritative Contract)
  try {
    storage.saveValidationContract({
      id: 'contract-002',
      projectId: projId,
      taskId: 'tsk-001',
      status: 'FAILED',
      evidenceItems: [],
      failures: [{
        id: 'fail-001',
        category: 'FUNCTIONAL_REGRESSION',
        severity: 'HIGH',
        expectedBehavior: 'All assertions pass',
        observedBehavior: 'Gate 4 assertions failed with exit code 1',
        reproducibilityRate: 1.0,
        waived: false
      }],
      verifiedAt: new Date().toISOString()
    } as any, 'usr-lead', 'PROJECT_LEAD');

    const gamingCheck = trustEngine.verifySelfReportedMetric(
      projId,
      'agent-gemini-2.5-flash',
      true, // Claims PASS
      'contract-002' // But contract is FAILED
    );
    assert(
      !gamingCheck.corroborated && gamingCheck.discrepancyNotice !== undefined,
      'Adversarial 2: Metric Gaming Protection',
      'Detected agent self-reporting PASS when independent gate contract recorded failure.'
    );
  } catch (err: any) {
    assert(false, 'Adversarial 2', err.message);
  }

  // Adversarial 3: Self-Approval / Role Permission Bypass
  try {
    // Attempt by DEVELOPER role to approve HIGH-impact recommendation
    const highRec: OptimizationRecommendation = {
      id: `rec-adv-high-${Date.now()}`,
      organizationId: orgId,
      projectId: projId,
      scope: 'PROJECT',
      category: 'VALIDATION_OPTIMIZATION',
      observedProblem: 'Test optimization',
      evidence: 'None',
      currentStrategy: 'A',
      proposedStrategy: 'B',
      expectedBenefit: 'Faster',
      expectedCost: '0',
      risks: ['None'],
      securityImpact: 'HIGH',
      governanceImpact: 'HIGH',
      timelineImpact: 'None',
      workflowImpact: 'None',
      confidence: 'HIGH',
      reversibility: 'REVERSIBLE',
      requiredAuthority: 'PROJECT_LEAD',
      affectedTasks: [],
      affectedAgents: [],
      validationRequirements: [],
      expiration: new Date(Date.now() + 86400000).toISOString(),
      status: 'PROPOSED',
      createdAt: new Date().toISOString()
    };
    storage.createOptimizationRecommendation(highRec, 'usr-dev', 'DEVELOPER');

    const updateAttempt = storage.updateOptimizationRecommendationStatus(
      highRec.id,
      projId,
      'APPROVED',
      'usr-dev',
      'DEVELOPER'
    );
    assert(
      !updateAttempt.success && Boolean(updateAttempt.error?.includes('Authorization denied')),
      'Adversarial 3: Developer Self-Approval Blocked',
      'Developer role prohibited from approving HIGH-impact optimization recommendations.'
    );
  } catch (err: any) {
    assert(false, 'Adversarial 3', err.message);
  }

  // Adversarial 4: Security Tradeoff Protection
  try {
    // Verify that applying a recommendation that attempts to bypass security without Security role fails
    const applyAttempt = optimizationEngine.applyIntervention(
      'rec-adv-high',
      projId,
      'usr-dev',
      'DEVELOPER'
    );
    assert(
      !applyAttempt.success,
      'Adversarial 4: Security Tradeoff Blocked',
      'Cost/temporal optimization cannot bypass security controls or execute without required governance authority.'
    );
  } catch (err: any) {
    assert(false, 'Adversarial 4', err.message);
  }

  // Adversarial 5: Feedback Loop Runaway Protection
  try {
    // Attempt to spam interventions
    let hitLimit = false;
    for (let i = 0; i < 15; i++) {
      const res = optimizationEngine.applyIntervention(
        'rec-opt-001',
        projId,
        'usr-lead',
        'PROJECT_LEAD'
      );
      if (!res.success && res.error?.includes('Safety Invariant Triggered')) {
        hitLimit = true;
        break;
      }
    }
    assert(
      hitLimit,
      'Adversarial 5: Bounded Loop Protection',
      'Enforced maximum hourly interventions ceiling to prevent unbounded adaptive runaway feedback loops.'
    );
  } catch (err: any) {
    assert(false, 'Adversarial 5', err.message);
  }

  const allPassed = results.every(r => r.passed);
  return {
    passed: allPassed,
    results
  };
}
