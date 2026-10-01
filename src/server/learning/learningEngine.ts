import { metricsEngine } from './metricsEngine.ts';
import { patternEngine } from './patternEngine.ts';
import { memoryEngine } from './memoryEngine.ts';
import { evolutionEngine } from './evolutionEngine.ts';
import { storage } from '../storage.ts';
import { LearningOverviewMetrics } from '../../types/index.ts';

export class LearningEngine {
  public metrics = metricsEngine;
  public patterns = patternEngine;
  public memory = memoryEngine;
  public evolution = evolutionEngine;

  /**
   * Retrieves the comprehensive continuous learning overview for a project.
   */
  public getOverview(projectId: string): LearningOverviewMetrics {
    return storage.getLearningOverview(projectId);
  }

  /**
   * Runs a full continuous learning cycle:
   * 1. Re-computes metric snapshots and trend lines
   * 2. Detects emerging patterns and anti-patterns
   * 3. Synthesizes proposed system evolution rules
   */
  public runLearningCycle(projectId: string) {
    const snapshots = this.metrics.computeSnapshots(projectId);
    const patterns = this.patterns.detectPatterns(projectId);
    const proposals = this.evolution.synthesizeProposals(projectId);
    const overview = this.getOverview(projectId);

    return {
      snapshots,
      patterns,
      proposals,
      overview
    };
  }
}

export const learningEngine = new LearningEngine();
