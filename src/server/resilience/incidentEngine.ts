import { storage } from '../storage.ts';
import {
  ProductionIncident,
  IncidentSeverity,
  IncidentCategory,
  IncidentLifecycleStatus,
  IncidentTimelineEvent,
  UserRole
} from '../../types/index.ts';

export class IncidentEngine {
  /**
   * Creates and registers a new production incident.
   */
  public createIncident(
    data: {
      projectId: string;
      title: string;
      severity: IncidentSeverity;
      category: IncidentCategory;
      affectedSystems: string[];
      owner?: string;
    },
    actorId: string,
    actorRole: UserRole
  ): ProductionIncident {
    const timestamp = new Date().toISOString();
    const incidentNum = Math.floor(100 + Math.random() * 900);
    const incidentId = `INC-${incidentNum}`;

    const timeline: IncidentTimelineEvent[] = [
      {
        timestamp,
        phase: 'DETECTED',
        actor: actorId,
        action: 'INCIDENT_DETECTED',
        details: `Incident logged with severity ${data.severity} in category ${data.category}.`
      }
    ];

    const incident: ProductionIncident = {
      id: `inc-${Date.now()}`,
      incidentId,
      projectId: data.projectId,
      title: data.title,
      severity: data.severity,
      category: data.category,
      status: 'DETECTED',
      detectedAt: timestamp,
      affectedSystems: data.affectedSystems,
      containmentActions: [],
      owner: data.owner || actorId,
      timeline
    };

    // Auto-containment / safe-mode escalation for SEV0 / SEV1
    if (data.severity === 'SEV0' || data.severity === 'SEV1') {
      storage.setDegradationLevel(
        data.projectId,
        'SAFE_MODE',
        `Automatic SEV0/SEV1 containment for incident ${incidentId}: ${data.title}`,
        actorId,
        actorRole
      );
      incident.containmentActions.push('TRIGGER_SYSTEM_SAFE_MODE');
      incident.status = 'CONTAINED';
      incident.timeline.push({
        timestamp: new Date().toISOString(),
        phase: 'CONTAINED',
        actor: 'system-incident-engine',
        action: 'AUTO_SAFE_MODE_CONTAINMENT',
        details: 'System transitioned to SAFE_MODE to prevent cascading impact.'
      });
    }

    storage.createIncident(incident);
    storage.recordAudit({
      actorId,
      actorRole,
      action: 'INCIDENT_CREATED',
      targetEntity: 'ProductionIncident',
      targetId: incident.id,
      projectId: data.projectId,
      afterState: {
        incidentId,
        severity: data.severity,
        category: data.category,
        title: data.title
      },
      correlationId: `corr-inc-${Date.now()}`
    });

    return incident;
  }

  /**
   * Applies an active containment action to an open incident.
   */
  public executeContainment(
    incidentId: string,
    action: 'HALT_AGENT' | 'BLOCK_TOOL' | 'SAFE_MODE' | 'READ_ONLY' | 'FREEZE_TASK',
    actorId: string,
    actorRole: UserRole
  ): ProductionIncident {
    const incident = storage.getIncident(incidentId);
    if (!incident) {
      throw new Error(`Incident '${incidentId}' not found.`);
    }

    const timestamp = new Date().toISOString();
    incident.containmentActions.push(action);
    incident.status = 'CONTAINED';

    if (action === 'SAFE_MODE') {
      storage.setDegradationLevel(incident.projectId, 'SAFE_MODE', `Containment for ${incident.incidentId}`, actorId, actorRole);
    } else if (action === 'READ_ONLY') {
      storage.setDegradationLevel(incident.projectId, 'READ_ONLY', `Containment for ${incident.incidentId}`, actorId, actorRole);
    }

    incident.timeline.push({
      timestamp,
      phase: 'CONTAINED',
      actor: actorId,
      action: `CONTAINMENT_${action}`,
      details: `Containment action '${action}' executed by ${actorId} (${actorRole}).`
    });

    storage.updateIncident(incident.id, incident);
    storage.recordAudit({
      actorId,
      actorRole,
      action: 'INCIDENT_CONTAINMENT_EXECUTED',
      targetEntity: 'ProductionIncident',
      targetId: incident.id,
      projectId: incident.projectId,
      afterState: { action, status: incident.status },
      correlationId: `corr-cont-${Date.now()}`
    });

    return incident;
  }

  /**
   * Resolves an incident, records root cause analysis (RCA), and automatically bridges
   * post-incident learning into Phase 9 Organizational Memory as a POST_MORTEM.
   */
  public resolveIncident(
    incidentId: string,
    rca: {
      category: string;
      rootCause: string;
      correctiveActions: string[];
    },
    actorId: string,
    actorRole: UserRole
  ): { incident: ProductionIncident; postMortemMemoryId?: string } {
    const incident = storage.getIncident(incidentId);
    if (!incident) {
      throw new Error(`Incident '${incidentId}' not found.`);
    }

    const timestamp = new Date().toISOString();
    incident.status = 'RESOLVED';
    incident.resolvedAt = timestamp;
    incident.rootCauseAnalysis = rca;

    incident.timeline.push({
      timestamp,
      phase: 'RESOLVED',
      actor: actorId,
      action: 'INCIDENT_RESOLVED',
      details: `Incident resolved with RCA: ${rca.rootCause}`
    });

    // Bridge into Phase 9 Organizational Memory
    const memory = storage.createMemory({
      id: `mem-postmortem-${Date.now()}`,
      organizationId: 'org-arcadia-demo',
      projectId: incident.projectId,
      title: `POST-MORTEM: ${incident.incidentId} — ${incident.title}`,
      type: 'POST_MORTEM',
      category: 'INCIDENT_RECOVERY',
      summary: `Root cause analysis and remediation for incident ${incident.incidentId} (${incident.severity}).`,
      detailedContent: `ROOT CAUSE:\n${rca.rootCause}\n\nCORRECTIVE ACTIONS:\n${rca.correctiveActions.map((c, i) => `${i + 1}. ${c}`).join('\n')}`,
      status: 'VERIFIED',
      provenance: {
        sourceIncidentId: incident.incidentId,
        authorId: actorId,
        authorRole: actorRole,
        organizationId: 'org-arcadia-demo',
        projectId: incident.projectId,
        verifiedBy: actorId,
        verifiedAt: timestamp,
        confidenceScore: 0.96,
        verificationMethod: 'MANUAL_HUMAN',
        immutableHash: `sha256-inc-${incident.incidentId}-${Date.now().toString(16)}`
      },
      applicableContexts: [incident.category, 'INCIDENT_MANAGEMENT', 'POST_MORTEM'],
      relatedTaskIds: [],
      relatedRequirementIds: [],
      relatedConstitutionalArticles: ['ARTICLE_I_SCOPE_INTEGRITY', 'ARTICLE_IV_FAULT_ISOLATION'],
      usageCount: 1,
      successRate: 100,
      freshnessScore: 100,
      createdTimestamp: timestamp,
      updatedTimestamp: timestamp
    });

    incident.exportedToMemoryId = memory.id;
    storage.updateIncident(incident.id, incident);

    // If project was in SAFE_MODE, restore to NORMAL after verified resolution
    if (storage.getDegradationLevel(incident.projectId) === 'SAFE_MODE') {
      storage.setDegradationLevel(
        incident.projectId,
        'NORMAL',
        `Restored to NORMAL following verified resolution of ${incident.incidentId}`,
        actorId,
        actorRole
      );
    }

    storage.recordAudit({
      actorId,
      actorRole,
      action: 'INCIDENT_RESOLVED',
      targetEntity: 'ProductionIncident',
      targetId: incident.id,
      projectId: incident.projectId,
      afterState: {
        incidentId: incident.incidentId,
        status: 'RESOLVED',
        memoryId: memory.id
      },
      correlationId: `corr-inc-res-${Date.now()}`
    });

    return { incident, postMortemMemoryId: memory.id };
  }
}

export const incidentEngine = new IncidentEngine();
