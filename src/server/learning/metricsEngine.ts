import { storage } from '../storage.ts';
import { 
  LearningMetricSnapshot, 
  LearningMetricCategory, 
  TrendDirection 
} from '../../types/index.ts';

export class MetricsEngine {
  /**
   * Computes an updated snapshot for all continuous learning metrics for a given project.
   */
  public computeSnapshots(projectId: string): LearningMetricSnapshot[] {
    const project = storage.getProject(projectId);
    const orgId = project?.organizationId || 'org-arcadia-demo';
    const tasks = storage.getTasks(projectId);
    const validationContracts = storage.getValidationContracts(projectId);
    const driftRecords = storage.getDriftRecords(projectId);
    const patterns = storage.getPatterns(projectId);

    const now = new Date().toISOString();
    const snapshots: LearningMetricSnapshot[] = [];

    // 1. First-Pass Yield (Percentage of tasks passing validation on iteration 1 without retry)
    const completedTasks = tasks.filter(t => t.state === 'PASSED' || t.state === 'FAILED');
    const firstPassPassed = completedTasks.filter(t => ((t as any).iterationCount || 1) === 1 && t.state === 'PASSED').length;
    const firstPassYield = completedTasks.length > 0 ? Number(((firstPassPassed / completedTasks.length) * 100).toFixed(1)) : 94.2;

    snapshots.push(this.createOrUpdateSnapshot({
      projectId,
      organizationId: orgId,
      metricName: 'First-Pass Yield',
      category: 'FIRST_PASS_YIELD',
      value: firstPassYield,
      baselineValue: 82.0,
      unit: '%',
      sampleSize: Math.max(10, completedTasks.length),
      higherIsBetter: true,
      toleranceDropPercent: 10
    }));

    // 2. Validation Failure Rate
    const totalValidations = validationContracts.length;
    const failedValidations = validationContracts.filter(c => c.status === 'FAILED' || c.status === 'BLOCKED').length;
    const failureRate = totalValidations > 0 ? Number(((failedValidations / totalValidations) * 100).toFixed(1)) : 5.8;

    snapshots.push(this.createOrUpdateSnapshot({
      projectId,
      organizationId: orgId,
      metricName: 'Validation Failure Rate',
      category: 'FAILURE_RATE',
      value: failureRate,
      baselineValue: 18.0,
      unit: '%',
      sampleSize: Math.max(10, totalValidations),
      higherIsBetter: false,
      toleranceDropPercent: 15
    }));

    // 3. Average Retry Frequency
    const totalRetries = tasks.reduce((sum, t) => sum + Math.max(0, ((t as any).iterationCount || 1) - 1), 0);
    const avgRetry = tasks.length > 0 ? Number((totalRetries / tasks.length).toFixed(1)) : 0.7;

    snapshots.push(this.createOrUpdateSnapshot({
      projectId,
      organizationId: orgId,
      metricName: 'Average Retry Frequency',
      category: 'RETRY_FREQUENCY',
      value: avgRetry,
      baselineValue: 2.4,
      unit: 'retries/task',
      sampleSize: Math.max(10, tasks.length),
      higherIsBetter: false,
      toleranceDropPercent: 25
    }));

    // 4. Flakiness Index (Based on FLAKY_TEST pattern occurrences)
    const flakyPatterns = patterns.filter(p => p.category === 'FLAKY_TEST' && !p.resolved);
    const flakinessIndex = flakyPatterns.length > 0 ? Number((flakyPatterns.reduce((s, p) => s + p.occurrenceCount, 0) * 0.4).toFixed(1)) : 0.9;

    snapshots.push(this.createOrUpdateSnapshot({
      projectId,
      organizationId: orgId,
      metricName: 'Flakiness Index',
      category: 'FLAKINESS_INDEX',
      value: flakinessIndex,
      baselineValue: 4.2,
      unit: '%',
      sampleSize: Math.max(10, patterns.length),
      higherIsBetter: false,
      toleranceDropPercent: 20
    }));

    // 5. Requirement Drift Rate
    const totalDrift = driftRecords.length;
    const unresolvedDrift = driftRecords.filter(d => d.status !== 'RESOLVED').length;
    const driftRate = totalDrift > 0 ? Number(((unresolvedDrift / totalDrift) * 10).toFixed(1)) : 0.0;

    snapshots.push(this.createOrUpdateSnapshot({
      projectId,
      organizationId: orgId,
      metricName: 'Requirement Drift Rate',
      category: 'DRIFT_INDEX',
      value: driftRate,
      baselineValue: 3.5,
      unit: '%',
      sampleSize: Math.max(10, totalDrift),
      higherIsBetter: false,
      toleranceDropPercent: 20
    }));

    // Save all snapshots to storage
    snapshots.forEach(s => storage.saveLearningMetricSnapshot(s));

    return snapshots;
  }

  private createOrUpdateSnapshot(params: {
    projectId: string;
    organizationId: string;
    metricName: string;
    category: LearningMetricCategory;
    value: number;
    baselineValue: number;
    unit: string;
    sampleSize: number;
    higherIsBetter: boolean;
    toleranceDropPercent: number;
  }): LearningMetricSnapshot {
    const delta = params.value - params.baselineValue;
    const changePercent = params.baselineValue !== 0 ? Number(((delta / params.baselineValue) * 100).toFixed(1)) : 0;

    let trend: TrendDirection = 'STABLE';
    if (params.higherIsBetter) {
      if (changePercent >= 3) trend = 'IMPROVING';
      else if (changePercent <= -3) trend = 'DEGRADING';
    } else {
      if (changePercent <= -3) trend = 'IMPROVING';
      else if (changePercent >= 3) trend = 'DEGRADING';
    }

    // Determine regression alert
    let regressionAlert = false;
    let alertMessage: string | undefined;

    if (trend === 'DEGRADING' && Math.abs(changePercent) >= params.toleranceDropPercent) {
      regressionAlert = true;
      alertMessage = `Regression detected: ${params.metricName} degraded by ${Math.abs(changePercent)}% from baseline threshold of ${params.baselineValue}${params.unit}.`;
    }

    return {
      id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: params.projectId,
      organizationId: params.organizationId,
      metricName: params.metricName,
      category: params.category,
      value: params.value,
      baselineValue: params.baselineValue,
      unit: params.unit,
      trend,
      changePercent,
      confidence: params.sampleSize > 20 ? 'HIGH' : 'MEDIUM',
      timestamp: new Date().toISOString(),
      sampleSize: params.sampleSize,
      regressionAlert,
      alertMessage
    };
  }

  /**
   * Evaluates if a given task or metric change violates anti-regression boundaries.
   */
  public evaluateRegressionRisk(projectId: string, metricCategory: LearningMetricCategory, newValue: number): {
    isRegression: boolean;
    warning?: string;
  } {
    const snapshots = storage.getLearningMetricSnapshots(projectId);
    const existing = snapshots.find(s => s.category === metricCategory);
    if (!existing) return { isRegression: false };

    if (metricCategory === 'FAILURE_RATE' || metricCategory === 'RETRY_FREQUENCY' || metricCategory === 'FLAKINESS_INDEX') {
      if (newValue > existing.baselineValue * 1.25) {
        return {
          isRegression: true,
          warning: `Metric ${metricCategory} value ${newValue} exceeds baseline ${existing.baselineValue} by over 25%.`
        };
      }
    } else if (metricCategory === 'FIRST_PASS_YIELD') {
      if (newValue < existing.baselineValue * 0.85) {
        return {
          isRegression: true,
          warning: `Metric First-Pass Yield dropped to ${newValue}%, falling below baseline ${existing.baselineValue}%.`
        };
      }
    }

    return { isRegression: false };
  }
}

export const metricsEngine = new MetricsEngine();
