import { runFoundationTests } from './foundation.test.ts';
import { runExecutionTests } from './execution.test.ts';
import { runCollaborationTests } from './collaboration.test.ts';
import { runValidationTests } from './validation.test.ts';
import { runOptimizationTests } from './optimization.test.ts';
import { runLearningTests } from './learning.test.ts';
import { runResilienceTests } from './resilience.test.ts';
import { runIntegrationTests } from './integration.test.ts';
import { runOperationsTests } from './operations.test.ts';
import { runAssuranceTests } from './assurance.test.ts';

async function main() {
  console.log('=====================================================');
  console.log('ARCADIA SYSTEM ARCHITECTURAL & INVARIANT TEST SUITES');
  console.log('=====================================================\n');

  console.log('Suite 1: Foundation (RBAC, Tenancy, Scope Lock, Invariants)...');
  const f = await runFoundationTests();
  f.results.forEach(r => console.log(`  ${r.passed ? '✓' : '✗'} [${r.category}] ${r.name}: ${r.message}`));

  console.log('\nSuite 2: Autonomous Execution (Gate 1-3, Sandboxing)...');
  const e = await runExecutionTests();
  e.results.forEach(r => console.log(`  ${r.passed ? '✓' : '✗'} [${r.category}] ${r.name}: ${r.message}`));

  console.log('\nSuite 3: Multi-Agent Collaboration (Consensus, Roles)...');
  const c = await runCollaborationTests();
  c.results.forEach((r: any) => console.log(`  ${r.passed ? '✓' : '✗'} [COLLABORATION] ${r.name}: ${r.details || r.error || 'PASSED'}`));

  console.log('\nSuite 4: Validation & Drift (Gate 4-7, Contract Engine)...');
  const v = await runValidationTests();
  v.results.forEach((r: any) => console.log(`  ${r.passed ? '✓' : '✗'} [VALIDATION] ${r.name}: ${r.details || r.error || 'PASSED'}`));

  console.log('\nSuite 5: Optimization Intelligence (Cost, Temporal, Trust, Adversarial)...');
  const o = await runOptimizationTests();
  o.results.forEach(r => console.log(`  ${r.passed ? '✓' : '✗'} [OPTIMIZATION] ${r.testName}: ${r.message}`));

  console.log('\nSuite 6: Continuous Learning & Evolution (Memories, Patterns, Metrics, Adversarial)...');
  const l = await runLearningTests();
  l.results.forEach(r => console.log(`  ${r.passed ? '✓' : '✗'} [LEARNING] ${r.testName}: ${r.message}`));

  console.log('\nSuite 7: Advanced Governance, Resilience & Production Hardening (Circuit Breakers, Gates, DR, Incidents)...');
  const res = await runResilienceTests();
  res.results.forEach(r => console.log(`  ${r.passed ? '✓' : '✗'} [RESILIENCE] ${r.testName}: ${r.message}`));

  console.log('\nSuite 8: Full-System Verification & Production Go-Live Assurance (Lifecycle, Traceability, Gates A-M, AI Safety)...');
  const integ = await runIntegrationTests();
  integ.results.forEach(r => console.log(`  ${r.passed ? '✓' : '✗'} [${r.category}] ${r.name}: ${r.message}`));

  console.log('\nSuite 9: Controlled Go-Live, Continuous Operations & Maintenance (Smoke Checks, Baseline, Freeze, Emergency)...');
  const ops = await runOperationsTests();
  ops.results.forEach(r => console.log(`  ${r.passed ? '✓' : '✗'} [${r.category}] ${r.name}: ${r.message}`));

  console.log('\nSuite 10: Continuous Assurance, Controlled Evolution & Architectural Integrity (Principles, Single Authority, Impact Graph)...');
  const ass = await runAssuranceTests();
  ass.results.forEach(r => console.log(`  ${r.passed ? '✓' : '✗'} [${r.category}] ${r.name}: ${r.message}`));

  const allResults = [
    ...f.results,
    ...e.results,
    ...c.results,
    ...v.results,
    ...o.results,
    ...l.results,
    ...res.results,
    ...integ.results,
    ...ops.results,
    ...ass.results
  ];

  const totalPassed = allResults.filter(r => r.passed).length;
  const totalFailed = allResults.length - totalPassed;

  console.log('\n=====================================================');
  console.log(`TOTAL SUITES: 10 | PASSED: ${totalPassed}/${allResults.length} | FAILED: ${totalFailed}`);
  console.log('=====================================================');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
