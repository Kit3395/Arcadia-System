import { storage } from '../storage.ts';
import { 
  CostEvent, 
  CostCategory, 
  CostEstimate, 
  CostAllocation 
} from '../../types/index.ts';

export interface RecordCostEventParams {
  organizationId: string;
  projectId: string;
  taskId?: string;
  executionId?: string;
  provider: string;
  agentId?: string;
  costCategory: CostCategory;
  amount: number;
  currency?: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export class CostEngine {
  /**
   * Record an observed cost event.
   */
  public record(params: RecordCostEventParams): CostEvent {
    const event: CostEvent = {
      costEventId: `cost-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      organizationId: params.organizationId,
      projectId: params.projectId,
      taskId: params.taskId,
      executionId: params.executionId,
      provider: params.provider,
      agentId: params.agentId,
      costCategory: params.costCategory,
      amount: Number(params.amount.toFixed(4)),
      currency: params.currency || 'USD',
      source: params.source,
      observedAt: new Date().toISOString(),
      classification: 'OBSERVED',
      metadata: params.metadata || {}
    };

    return storage.recordCostEvent(event);
  }

  /**
   * Calculate Expected Task Cost with ranges rather than false precision.
   * Expected Task Cost = Execution + Validation + Expected Retry/Fallback + Expected Rework + Human Review + Infrastructure
   */
  public estimateTaskCost(projectId: string, taskId?: string): CostEstimate {
    const project = storage.getProject(projectId);
    const orgId = project?.organizationId || 'org-arcadia-demo';
    const model = storage.getCostModel(orgId);

    // Compute expected ranges based on rates
    const breakdown: Record<CostCategory, { min: number; max: number; expected: number }> = {
      AI_EXECUTION: {
        min: Number((model.rates.inputTokenPer1k * 3 + model.rates.outputTokenPer1k * 0.5).toFixed(4)),
        max: Number((model.rates.inputTokenPer1k * 12 + model.rates.outputTokenPer1k * 2.5).toFixed(4)),
        expected: Number((model.rates.inputTokenPer1k * 6 + model.rates.outputTokenPer1k * 1.2).toFixed(4))
      },
      CONTEXT: {
        min: 0.002,
        max: 0.015,
        expected: 0.006
      },
      VALIDATION: {
        min: Number((model.rates.automatedTestPerRun * 2 + model.rates.securityScanPerRun).toFixed(4)),
        max: Number((model.rates.automatedTestPerRun * 6 + model.rates.securityScanPerRun * 2).toFixed(4)),
        expected: Number((model.rates.automatedTestPerRun * 3 + model.rates.securityScanPerRun).toFixed(4))
      },
      EXECUTION_RECOVERY: {
        min: 0.0,
        max: 0.08,
        expected: 0.015
      },
      HUMAN_REVIEW: {
        min: 0.0,
        max: 1.40,
        expected: 0.45
      },
      INFRASTRUCTURE: {
        min: 0.01,
        max: 0.05,
        expected: 0.02
      },
      REWORK: {
        min: 0.0,
        max: 0.15,
        expected: 0.02
      },
      CHANGE_COST: {
        min: 0.0,
        max: 0.10,
        expected: 0.0
      }
    };

    let totalMin = 0;
    let totalMax = 0;
    let totalExpected = 0;

    for (const key of Object.keys(breakdown) as CostCategory[]) {
      totalMin += breakdown[key].min;
      totalMax += breakdown[key].max;
      totalExpected += breakdown[key].expected;
    }

    const estimate: CostEstimate = {
      estimateId: `est-${Date.now()}`,
      projectId,
      taskId,
      minCost: Number(totalMin.toFixed(2)),
      maxCost: Number(totalMax.toFixed(2)),
      expectedCost: Number(totalExpected.toFixed(2)),
      currency: model.currency,
      confidence: 'MEDIUM',
      primaryUncertainty: 'Validation gate retry frequency and human governance review duration',
      breakdown,
      classification: 'ESTIMATED',
      calculatedAt: new Date().toISOString()
    };

    storage.saveCostEstimate(estimate);
    return estimate;
  }

  /**
   * Get total observed cost and breakdown by category.
   */
  public getActualCosts(projectId: string): {
    total: number;
    currency: string;
    byCategory: Record<CostCategory, number>;
    count: number;
  } {
    const events = storage.getCostEvents(projectId);
    const byCategory: Record<CostCategory, number> = {
      AI_EXECUTION: 0,
      CONTEXT: 0,
      VALIDATION: 0,
      EXECUTION_RECOVERY: 0,
      HUMAN_REVIEW: 0,
      INFRASTRUCTURE: 0,
      REWORK: 0,
      CHANGE_COST: 0
    };

    let total = 0;
    for (const ev of events) {
      total += ev.amount;
      if (byCategory[ev.costCategory] !== undefined) {
        byCategory[ev.costCategory] += ev.amount;
      }
    }

    // Format numbers
    for (const k of Object.keys(byCategory) as CostCategory[]) {
      byCategory[k] = Number(byCategory[k].toFixed(4));
    }

    return {
      total: Number(total.toFixed(2)),
      currency: 'USD',
      byCategory,
      count: events.length
    };
  }

  /**
   * Check for cost anomalies where observed exceeds estimate or historical baseline.
   */
  public detectAnomalies(projectId: string): Array<{ category: CostCategory; observed: number; threshold: number; warning: string }> {
    const actuals = this.getActualCosts(projectId);
    const anomalies: Array<{ category: CostCategory; observed: number; threshold: number; warning: string }> = [];

    // Simple anomaly thresholds
    if (actuals.byCategory.EXECUTION_RECOVERY > 0.50) {
      anomalies.push({
        category: 'EXECUTION_RECOVERY',
        observed: actuals.byCategory.EXECUTION_RECOVERY,
        threshold: 0.50,
        warning: 'High retry/recovery costs detected. Investigate prompt drift or validation failures.'
      });
    }

    if (actuals.byCategory.AI_EXECUTION > 5.0) {
      anomalies.push({
        category: 'AI_EXECUTION',
        observed: actuals.byCategory.AI_EXECUTION,
        threshold: 5.0,
        warning: 'Token consumption above standard budget curve.'
      });
    }

    return anomalies;
  }

  /**
   * Calculate cost allocations across key dimensions.
   */
  public getAllocations(projectId: string): CostAllocation[] {
    const events = storage.getCostEvents(projectId);
    const total = events.reduce((acc, ev) => acc + ev.amount, 0) || 1;

    const taskMap: Record<string, number> = {};
    for (const ev of events) {
      const id = ev.taskId || 'general-overhead';
      taskMap[id] = (taskMap[id] || 0) + ev.amount;
    }

    const allocations: CostAllocation[] = [];
    for (const [taskId, amount] of Object.entries(taskMap)) {
      allocations.push({
        id: `alloc-${taskId}`,
        projectId,
        dimension: 'TASK',
        dimensionId: taskId,
        totalAmount: Number(amount.toFixed(4)),
        currency: 'USD',
        percentage: Number(((amount / total) * 100).toFixed(1))
      });
    }

    return allocations;
  }
}

export const costEngine = new CostEngine();
