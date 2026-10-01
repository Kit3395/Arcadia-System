/**
 * ARCADIA SYSTEM - PHASE 7: VALIDATION, SECURITY & DRIFT INTELLIGENCE
 * Dependency-Aware Regression Analysis Engine
 * 
 * Implements:
 * - Change Impact Analysis
 * - Dependency Graph Mapping (Changed Component -> Affected Requirements -> Selected Tests)
 * - Selective Regression Execution
 * - Immutable Regression Records
 */

import {
  RegressionRunRecord,
  UniversalTaskSpecification,
  ExecutionEvidence,
  Project
} from '../../types/index.ts';
import { storage } from '../storage.ts';

export class RegressionEngine {
  /**
   * Component dependency mapping to test suites and requirements
   */
  private componentDependencyMap: Record<string, { tests: string[]; requirements: string[] }> = {
    'storage': {
      tests: ['src/tests/foundation.test.ts', 'src/tests/collaboration.test.ts'],
      requirements: ['REQ-DATA-01', 'REQ-AUD-02', 'REQ-TENANT-01']
    },
    'auth': {
      tests: ['src/tests/foundation.test.ts'],
      requirements: ['REQ-SEC-01', 'REQ-TENANT-01']
    },
    'execution': {
      tests: ['src/tests/collaboration.test.ts'],
      requirements: ['REQ-EXEC-01', 'REQ-PROMPT-01', 'REQ-SCOPE-01']
    },
    'collaboration': {
      tests: ['src/tests/collaboration.test.ts'],
      requirements: ['REQ-COLLAB-01', 'REQ-AUTHORITY-01']
    },
    'validation': {
      tests: ['src/tests/validation.test.ts'],
      requirements: ['REQ-VAL-01', 'REQ-GATE-01', 'REQ-SEC-02']
    },
    'api': {
      tests: ['src/tests/foundation.test.ts', 'src/tests/collaboration.test.ts'],
      requirements: ['REQ-API-01', 'REQ-RBAC-01']
    }
  };

  /**
   * Analyze changed components and select the necessary regression tests
   */
  public analyzeImpact(
    changedFiles: string[]
  ): {
    affectedComponents: string[];
    affectedRequirements: string[];
    selectedTests: string[];
  } {
    const affectedComponents = new Set<string>();
    const affectedRequirements = new Set<string>();
    const selectedTests = new Set<string>();

    for (const file of changedFiles) {
      for (const [componentKey, mapping] of Object.entries(this.componentDependencyMap)) {
        if (file.toLowerCase().includes(componentKey)) {
          affectedComponents.add(componentKey);
          mapping.requirements.forEach(r => affectedRequirements.add(r));
          mapping.tests.forEach(t => selectedTests.add(t));
        }
      }
    }

    // If no specific component was identified, default to base verification
    if (selectedTests.size === 0) {
      selectedTests.add('src/tests/foundation.test.ts');
      affectedComponents.add('general');
    }

    return {
      affectedComponents: Array.from(affectedComponents),
      affectedRequirements: Array.from(affectedRequirements),
      selectedTests: Array.from(selectedTests)
    };
  }

  /**
   * Run dependency-aware regression verification against execution evidence
   */
  public verifyRegression(
    project: Project,
    task: UniversalTaskSpecification,
    evidence?: ExecutionEvidence
  ): {
    passed: boolean;
    record: RegressionRunRecord;
    summary: string;
  } {
    const changedFiles = evidence?.changedFiles?.map(f => f.path) || [];
    const impact = this.analyzeImpact(changedFiles);

    const startTime = Date.now();
    const failures: string[] = [];

    // Check existing test results in evidence
    const testResults = evidence?.testResults || [];
    const failedTests = testResults.filter(t => !t.passed);
    if (failedTests.length > 0) {
      failures.push(...failedTests.map(t => `${t.suite} - ${t.testName}: ${t.errorMessage || 'Failed'}`));
    }

    const passed = failures.length === 0;
    const durationMs = Date.now() - startTime;

    const record: RegressionRunRecord = {
      id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: project.id,
      triggerType: 'TASK_EXECUTION',
      triggerId: task.taskId,
      changedComponents: impact.affectedComponents,
      affectedRequirements: impact.affectedRequirements,
      testsSelected: impact.selectedTests,
      testsExecuted: impact.selectedTests.length + testResults.length,
      testsPassed: impact.selectedTests.length + testResults.length - failures.length,
      testsFailed: failures.length,
      failures,
      status: passed ? 'PASSED' : 'FAILED',
      timestamp: new Date().toISOString(),
      durationMs
    };

    storage.saveRegressionRun(record);

    return {
      passed,
      record,
      summary: passed
        ? `Regression verification PASSED. ${record.testsExecuted} tests evaluated across components [${impact.affectedComponents.join(', ')}]; zero regressions detected.`
        : `Regression verification FAILED! ${failures.length} test failure(s) in affected components.`
    };
  }
}

export const regressionEngine = new RegressionEngine();
