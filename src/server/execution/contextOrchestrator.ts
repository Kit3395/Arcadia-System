/**
 * ARCADIA SYSTEM - EXECUTION LAYER (PHASE 5)
 * Module: Context Orchestration Engine
 * 
 * Assembles the Minimal Sufficient Context for a task.
 * Enforces:
 *   - Task Relevance
 *   - Authority Hierarchy: Constitution > Governance > Project State > Decisions > Tasks
 *   - Status Filtering (rejects superseded/rejected items)
 *   - Provenance & Sensitivity classification
 *   - Conflict Detection & Resolution by Authority
 *   - Explainability Manifest ("Why was this included / excluded?")
 */

import {
  Project,
  ProjectConstitution,
  Requirement,
  Decision,
  UniversalTaskSpecification,
  ContextPackage,
  ContextItem,
  ContextConflict,
  ContextManifestEntry,
  ContextAuthorityLevel,
  SecurityClassification
} from '../../types/index.ts';

const AUTHORITY_SCORES: Record<ContextAuthorityLevel, number> = {
  CONSTITUTION: 100,
  GOVERNANCE: 90,
  PROJECT_STATE: 80,
  DECISION_INTELLIGENCE: 70,
  ORCHESTRATION: 60,
  EXECUTION: 50,
  VALIDATION: 40,
  LEARNING: 30
};

export class ContextOrchestrationEngine {
  /**
   * Assembles a versioned ContextPackage with explainable manifest
   */
  public assembleContextPackage(
    task: UniversalTaskSpecification,
    project: Project,
    constitution: ProjectConstitution | null | undefined,
    requirements: Requirement[],
    decisions: Decision[],
    allTasks: UniversalTaskSpecification[],
    maxTokenBudget: number = 8000
  ): ContextPackage {
    const rawItems: ContextItem[] = [];
    const manifest: ContextManifestEntry[] = [];
    const includedItems: ContextItem[] = [];
    const conflicts: ContextConflict[] = [];

    // 1. Gather all potential knowledge items from project state

    // A. Project Constitution
    if (constitution) {
      rawItems.push({
        id: `ctx-const-${constitution.version}`,
        projectId: project.id,
        sourceType: 'PROJECT_CONSTITUTION',
        sourceId: constitution.id,
        contentReference: `Constitution v${constitution.version}`,
        authorityLevel: 'CONSTITUTION',
        status: constitution.isCurrent ? 'CURRENT' : 'HISTORICAL',
        provenance: `Approved by ${constitution.approvedBy}`,
        confidence: 1.0,
        sensitivity: constitution.securityClassification,
        relevanceScore: 1.0,
        version: constitution.version,
        createdAt: constitution.createdAt,
        content: {
          approvedStack: constitution.approvedStack,
          securityClassification: constitution.securityClassification,
          complianceProfiles: constitution.complianceProfiles,
          prohibitedDependencies: constitution.prohibitedDependencies,
          governanceRules: constitution.governanceRules
        }
      });
    }

    // B. Project State
    rawItems.push({
      id: `ctx-proj-state-${project.id}`,
      projectId: project.id,
      sourceType: 'PROJECT_STATE',
      sourceId: project.id,
      contentReference: `Project Lifecycle State [${project.primaryState}]`,
      authorityLevel: 'PROJECT_STATE',
      status: 'CURRENT',
      provenance: 'Authoritative Storage',
      confidence: 1.0,
      sensitivity: 'INTERNAL',
      relevanceScore: 0.9,
      version: project.currentVersion,
      createdAt: project.updatedAt,
      content: {
        primaryState: project.primaryState,
        complexityLevel: project.complexityLevel,
        governanceState: project.governanceState,
        securityState: project.securityState
      }
    });

    // C. Requirements
    for (const req of requirements) {
      const isDirectlySatisfied = task.requirementsSatisfied?.includes(req.reqIdentifier) || task.requirementsSatisfied?.includes(req.id);
      const isRelatedComponent = req.affectedComponents?.some(c => 
        task.architectureSlice?.relevantModules?.includes(c) ||
        task.relevantFiles?.some(f => f.path.includes(c))
      );

      let relevanceScore = 0.2;
      if (isDirectlySatisfied) relevanceScore = 1.0;
      else if (isRelatedComponent) relevanceScore = 0.7;

      rawItems.push({
        id: `ctx-req-${req.id}`,
        projectId: project.id,
        sourceType: 'REQUIREMENT',
        sourceId: req.id,
        contentReference: `${req.reqIdentifier}: ${req.description.substring(0, 40)}...`,
        authorityLevel: req.status === 'APPROVED' ? 'GOVERNANCE' : 'DECISION_INTELLIGENCE',
        status: req.status,
        provenance: `Source: ${req.source} (${req.classification})`,
        confidence: req.confidenceScore,
        sensitivity: 'INTERNAL',
        relevanceScore,
        version: req.version,
        createdAt: req.createdAt,
        content: {
          reqIdentifier: req.reqIdentifier,
          description: req.description,
          classification: req.classification,
          status: req.status,
          affectedComponents: req.affectedComponents
        }
      });
    }

    // D. Decisions (ADRs)
    for (const dec of decisions) {
      const isDecRelated = dec.context?.toLowerCase().includes(task.title.toLowerCase()) ||
        task.architectureSlice?.relevantModules?.some(m => dec.title.toLowerCase().includes(m.toLowerCase()));
      const relevanceScore = isDecRelated ? 0.85 : 0.3;

      rawItems.push({
        id: `ctx-dec-${dec.id}`,
        projectId: project.id,
        sourceType: 'DECISION',
        sourceId: dec.id,
        contentReference: `ADR ${dec.decisionIdentifier}: ${dec.title}`,
        authorityLevel: 'DECISION_INTELLIGENCE',
        status: dec.status,
        provenance: `Authority: ${dec.authority}`,
        confidence: 0.95,
        sensitivity: 'INTERNAL',
        relevanceScore,
        version: dec.version,
        createdAt: dec.createdAt,
        content: {
          decisionIdentifier: dec.decisionIdentifier,
          title: dec.title,
          selectedOption: dec.selectedOption,
          authority: dec.authority,
          status: dec.status
        }
      });
    }

    // E. Task Dependencies (Prerequisite task outcomes)
    if (task.dependencies && task.dependencies.length > 0) {
      for (const depId of task.dependencies) {
        const depTask = allTasks.find(t => t.taskId === depId || t.taskIdentifier === depId);
        if (depTask) {
          rawItems.push({
            id: `ctx-deptask-${depTask.taskId}`,
            projectId: project.id,
            sourceType: 'TASK_DEPENDENCY',
            sourceId: depTask.taskId,
            contentReference: `Dependency Task [${depTask.taskIdentifier}]: ${depTask.title}`,
            authorityLevel: 'EXECUTION',
            status: depTask.state,
            provenance: 'Task State Machine',
            confidence: 1.0,
            sensitivity: 'INTERNAL',
            relevanceScore: 0.95,
            dependencyRelationship: `PREREQUISITE_FOR_${task.taskIdentifier}`,
            version: 1,
            createdAt: depTask.updatedAt,
            content: {
              taskIdentifier: depTask.taskIdentifier,
              title: depTask.title,
              state: depTask.state,
              relevantFiles: depTask.relevantFiles
            }
          });
        }
      }
    }

    // 2. Filter & Prioritize Pipeline

    // Sort items by relevance and authority
    rawItems.sort((a, b) => {
      const scoreA = a.relevanceScore * 100 + AUTHORITY_SCORES[a.authorityLevel];
      const scoreB = b.relevanceScore * 100 + AUTHORITY_SCORES[b.authorityLevel];
      return scoreB - scoreA;
    });

    let currentTokens = 0;
    const includedSourceIds: string[] = [];
    const excludedSourceIds: string[] = [];

    for (const item of rawItems) {
      // Rule 1: Exclude rejected or superseded statuses
      if (item.status === 'REJECTED' || item.status === 'SUPERSEDED' || item.status === 'DEFERRED') {
        excludedSourceIds.push(item.sourceId);
        manifest.push({
          id: item.id,
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          status: 'EXCLUDED',
          reason: `Excluded status: '${item.status}' is not authoritative.`,
          authority: item.authorityLevel,
          sensitivity: item.sensitivity
        });
        continue;
      }

      // Rule 2: Minimum relevance threshold
      if (item.relevanceScore < 0.4 && item.authorityLevel !== 'CONSTITUTION' && item.authorityLevel !== 'PROJECT_STATE') {
        excludedSourceIds.push(item.sourceId);
        manifest.push({
          id: item.id,
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          status: 'EXCLUDED',
          reason: `Low relevance (${(item.relevanceScore * 100).toFixed(0)}%) to current task objective.`,
          authority: item.authorityLevel,
          sensitivity: item.sensitivity
        });
        continue;
      }

      // Rule 3: Conflict detection with existing included items
      let hasBlockingConflict = false;
      for (const existing of includedItems) {
        if (existing.sourceType === item.sourceType && existing.sourceId === item.sourceId) {
          // Duplicate removal
          hasBlockingConflict = true;
          break;
        }
      }

      if (hasBlockingConflict) {
        excludedSourceIds.push(item.sourceId);
        manifest.push({
          id: item.id,
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          status: 'EXCLUDED',
          reason: 'Duplicate source superseded by higher-ranked instance.',
          authority: item.authorityLevel,
          sensitivity: item.sensitivity
        });
        continue;
      }

      // Estimate tokens for item
      const itemJson = JSON.stringify(item.content);
      const estTokens = Math.ceil(itemJson.length / 4);

      if (currentTokens + estTokens > maxTokenBudget && item.authorityLevel !== 'CONSTITUTION') {
        excludedSourceIds.push(item.sourceId);
        manifest.push({
          id: item.id,
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          status: 'EXCLUDED',
          reason: `Token budget overflow (current: ${currentTokens}, item: ${estTokens}, max: ${maxTokenBudget}).`,
          authority: item.authorityLevel,
          sensitivity: item.sensitivity
        });
        continue;
      }

      // Include item
      currentTokens += estTokens;
      includedItems.push(item);
      includedSourceIds.push(item.sourceId);

      let inclusionReason = `Authority level '${item.authorityLevel}' with ${(item.relevanceScore * 100).toFixed(0)}% task relevance.`;
      if (item.sourceType === 'PROJECT_CONSTITUTION') {
        inclusionReason = 'Mandatory architectural boundaries, prohibited dependencies, and governance rules.';
      } else if (item.sourceType === 'REQUIREMENT') {
        inclusionReason = `Approved requirement directly governing task: ${item.contentReference}`;
      } else if (item.sourceType === 'TASK_DEPENDENCY') {
        inclusionReason = `Prerequisite dependency outcome verified in state '${item.status}'.`;
      }

      item.inclusionReason = inclusionReason;
      manifest.push({
        id: item.id,
        sourceType: item.sourceType,
        sourceId: item.sourceId,
        status: 'INCLUDED',
        reason: inclusionReason,
        authority: item.authorityLevel,
        sensitivity: item.sensitivity
      });
    }

    const packageId = `ctxpkg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const originalCount = rawItems.length;
    const compressedCount = includedItems.length;

    return {
      id: packageId,
      projectId: project.id,
      taskId: task.taskId,
      version: 1,
      generatedAt: new Date().toISOString(),
      items: includedItems,
      includedSourceIds,
      excludedSourceIds,
      conflicts,
      dependencies: task.dependencies || [],
      securityRestrictions: constitution?.complianceProfiles || ['STANDARD_ISOLATION'],
      tokenBudget: {
        totalEstimatedTokens: currentTokens,
        maxBudget: maxTokenBudget
      },
      compressionMetadata: {
        originalItemCount: originalCount,
        compressedItemCount: compressedCount,
        compressionRatio: originalCount > 0 ? parseFloat((compressedCount / originalCount).toFixed(2)) : 1.0
      },
      manifest
    };
  }
}

export const contextOrchestrator = new ContextOrchestrationEngine();
