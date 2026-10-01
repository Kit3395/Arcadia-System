import { storage } from '../storage.ts';
import { 
  TelemetryEvent, 
  TelemetryEventType, 
  DataAuthorityClassification 
} from '../../types/index.ts';

export interface IngestTelemetryParams {
  organizationId: string;
  projectId: string;
  taskId?: string;
  executionId?: string;
  agentId?: string;
  correlationId?: string;
  eventType: TelemetryEventType;
  source: string;
  classification: DataAuthorityClassification;
  measurement: number;
  unit: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
  privacyClassification?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  retentionDays?: number;
}

export class TelemetryEngine {
  /**
   * Ingest structured telemetry event with organization isolation checks.
   */
  public ingest(params: IngestTelemetryParams): TelemetryEvent {
    // Cross-organization validation
    const project = storage.getProject(params.projectId);
    if (project && project.organizationId !== params.organizationId) {
      throw new Error(`Security Violation: Telemetry organization mismatch (${params.organizationId} !== ${project.organizationId})`);
    }

    const event: TelemetryEvent = {
      eventId: `tel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      organizationId: params.organizationId,
      projectId: params.projectId,
      taskId: params.taskId,
      executionId: params.executionId,
      agentId: params.agentId,
      correlationId: params.correlationId || `corr-tel-${Date.now()}`,
      eventType: params.eventType,
      timestamp: new Date().toISOString(),
      source: params.source,
      classification: params.classification,
      measurement: params.measurement,
      unit: params.unit,
      confidence: params.confidence ?? 1.0,
      metadata: params.metadata || {},
      privacyClassification: params.privacyClassification || 'INTERNAL',
      retentionDays: params.retentionDays || 90,
      createdAt: new Date().toISOString()
    };

    return storage.recordTelemetry(event);
  }

  /**
   * Query telemetry with strict organization isolation enforcement.
   */
  public query(
    requestingOrgId: string,
    projectId: string,
    eventType?: TelemetryEventType,
    limit: number = 100
  ): TelemetryEvent[] {
    const project = storage.getProject(projectId);
    if (!project) {
      return [];
    }

    // Tenant boundary protection
    if (project.organizationId !== requestingOrgId) {
      throw new Error('Access Denied: Cross-organization telemetry query prohibited.');
    }

    return storage.getTelemetry(projectId, requestingOrgId, eventType, limit);
  }

  /**
   * Aggregate telemetry by event type.
   */
  public getAggregates(requestingOrgId: string, projectId: string): Record<TelemetryEventType, { count: number; sum: number; avg: number }> {
    const events = this.query(requestingOrgId, projectId);
    const result = {} as Record<TelemetryEventType, { count: number; sum: number; avg: number }>;

    for (const ev of events) {
      if (!result[ev.eventType]) {
        result[ev.eventType] = { count: 0, sum: 0, avg: 0 };
      }
      result[ev.eventType].count += 1;
      result[ev.eventType].sum += ev.measurement;
    }

    for (const type of Object.keys(result) as TelemetryEventType[]) {
      if (result[type].count > 0) {
        result[type].avg = Number((result[type].sum / result[type].count).toFixed(2));
      }
    }

    return result;
  }
}

export const telemetryEngine = new TelemetryEngine();
