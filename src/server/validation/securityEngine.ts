/**
 * ARCADIA SYSTEM - PHASE 7: VALIDATION, SECURITY & DRIFT INTELLIGENCE
 * Security Validation Engine
 * 
 * Implements:
 * - Security Profile Enforcement (STANDARD, HIGH_SECURITY, FINANCIAL, REGULATED)
 * - Stop Condition Trapping (Auth bypass, secret leakage, cross-tenant leaks, injection)
 * - Threat Model & Trust Boundary Verification
 * - Sensitive Data Flow Analysis
 * - Structured Security Findings with Governed Lifecycle
 */

import {
  SecurityProfile,
  SecurityStopCondition,
  SecurityFinding,
  ThreatModel,
  TrustBoundary,
  DataFlowRecord,
  ValidationSeverity,
  UserRole,
  ExecutionEvidence,
  UniversalTaskSpecification,
  Project
} from '../../types/index.ts';
import { storage } from '../storage.ts';

export class SecurityValidationEngine {
  /**
   * Secret and credential leakage patterns
   */
  private secretPatterns: Array<{ name: string; regex: RegExp; severity: ValidationSeverity }> = [
    { name: 'Private Key Block', regex: /-----BEGIN (RSA|EC|OPENSSH|PGP|PRIVATE) KEY-----/i, severity: 'CRITICAL' },
    { name: 'Generic API Key Assignment', regex: /(api_key|apikey|secret_key|private_key)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i, severity: 'CRITICAL' },
    { name: 'Bearer Token Leak', regex: /bearer\s+[a-zA-Z0-9\-_]{20,}\.[a-zA-Z0-9\-_]{20,}/i, severity: 'CRITICAL' },
    { name: 'Gemini / Google Secret Leak', regex: /AIza[0-9A-Za-z\-_]{35}/i, severity: 'CRITICAL' },
    { name: 'Hardcoded Password Assignment', regex: /password\s*[:=]\s*['"][^'"]{8,}['"]/i, severity: 'HIGH' }
  ];

  /**
   * Destructive or unsafe operations
   */
  private destructivePatterns: Array<{ name: string; regex: RegExp; severity: ValidationSeverity }> = [
    { name: 'Unsafe Table Truncation / Drop', regex: /(DROP\s+TABLE|TRUNCATE\s+TABLE|DELETE\s+FROM\s+\w+\s*(?:;|$))/i, severity: 'CRITICAL' },
    { name: 'Arbitrary Code Execution (eval)', regex: /\beval\s*\(/i, severity: 'CRITICAL' },
    { name: 'Arbitrary Subprocess Execution', regex: /\b(child_process|execSync|spawnSync)\b/i, severity: 'HIGH' },
    { name: 'Recursive Force Deletion', regex: /\brm\s+-rf\b/i, severity: 'CRITICAL' }
  ];

  /**
   * Perform a comprehensive security scan against an execution's evidence and affected task
   */
  public scanExecution(
    project: Project,
    task: UniversalTaskSpecification,
    evidence?: ExecutionEvidence,
    securityProfile: SecurityProfile = 'STANDARD'
  ): {
    passed: boolean;
    stopConditionTriggered: boolean;
    stopCondition?: SecurityStopCondition;
    findings: SecurityFinding[];
    summary: string;
  } {
    const findings: SecurityFinding[] = [];
    let stopConditionTriggered = false;
    let stopCondition: SecurityStopCondition | undefined;

    const filesToScan = evidence?.changedFiles || [];
    const textPool = [
      evidence?.agentOutput || '',
      evidence?.agentReasoningSummary || '',
      ...filesToScan.map(f => `${f.path}\n${f.diff || ''}`)
    ].join('\n');

    // 1. Scan for Credential / Secret Leakage
    for (const pattern of this.secretPatterns) {
      if (pattern.regex.test(textPool)) {
        stopConditionTriggered = true;
        stopCondition = 'SECRET_LEAKAGE';
        findings.push({
          id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          projectId: project.id,
          taskId: task.taskId,
          category: 'Secret Leakage',
          severity: pattern.severity,
          description: `Security Stop Condition: Potential secret/credential exposure detected matching '${pattern.name}'.`,
          evidence: `Pattern match '${pattern.name}' in execution artifacts.`,
          affectedComponent: filesToScan[0]?.path || 'Agent Output',
          exploitability: 'CRITICAL',
          controlReference: 'RULE-SEC-02',
          recommendedRemediation: 'Remove hardcoded credentials immediately and replace with environment variable references.',
          status: 'OPEN',
          owner: 'usr-lead',
          createdAt: new Date().toISOString(),
          isStopConditionTriggered: true,
          stopConditionType: 'SECRET_LEAKAGE'
        });
      }
    }

    // 2. Scan for Destructive / Injection Patterns
    for (const pattern of this.destructivePatterns) {
      if (pattern.regex.test(textPool)) {
        stopConditionTriggered = true;
        stopCondition = 'UNSAFE_DESTRUCTIVE_OPERATION';
        findings.push({
          id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          projectId: project.id,
          taskId: task.taskId,
          category: 'Destructive Operation',
          severity: pattern.severity,
          description: `Security Stop Condition: Destructive or dangerous code pattern '${pattern.name}' detected.`,
          evidence: `Pattern match '${pattern.name}' in proposed changes.`,
          affectedComponent: filesToScan[0]?.path || 'Task Code',
          exploitability: 'HIGH',
          controlReference: 'RULE-SEC-01',
          recommendedRemediation: 'Refactor code to use safe, parameterized, non-destructive APIs.',
          status: 'OPEN',
          owner: 'usr-lead',
          createdAt: new Date().toISOString(),
          isStopConditionTriggered: true,
          stopConditionType: 'UNSAFE_DESTRUCTIVE_OPERATION'
        });
      }
    }

    // 3. Multi-Tenant Cross-Organization Scoping Assertion
    if (project.organizationId) {
      const crossOrgPattern = new RegExp(`org-(?!${project.organizationId.replace('org-', '')})[a-zA-Z0-9_\-]+`, 'i');
      if (crossOrgPattern.test(textPool)) {
        stopConditionTriggered = true;
        stopCondition = 'CROSS_TENANT_EXPOSURE';
        findings.push({
          id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          projectId: project.id,
          taskId: task.taskId,
          category: 'Multi-Tenant Isolation',
          severity: 'CRITICAL',
          description: 'Security Stop Condition: References to external foreign organization identifier detected.',
          evidence: `Foreign tenant reference found in task execution diffs.`,
          affectedComponent: 'src/server/storage.ts',
          exploitability: 'CRITICAL',
          controlReference: 'RULE-TENANT-01',
          recommendedRemediation: 'Ensure all queries and operations are strictly scoped to the authenticated tenant organization.',
          status: 'OPEN',
          owner: 'usr-lead',
          createdAt: new Date().toISOString(),
          isStopConditionTriggered: true,
          stopConditionType: 'CROSS_TENANT_EXPOSURE'
        });
      }
    }

    // 4. Profile-specific checks
    if (securityProfile === 'FINANCIAL' || securityProfile === 'HIGH_SECURITY' || securityProfile === 'REGULATED') {
      // Require explicit audit logging verification in financial/regulated profiles
      const touchesAudit = filesToScan.some(f => f.path.includes('audit') || f.path.includes('storage'));
      if (!touchesAudit && task.complexity === 'HIGH') {
        findings.push({
          id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          projectId: project.id,
          taskId: task.taskId,
          category: 'Compliance & Auditability',
          severity: 'MEDIUM',
          description: `Profile '${securityProfile}' requires mandatory audit trail verification for high-complexity operations.`,
          evidence: `Task ${task.taskId} does not include audit assertions in relevantFiles.`,
          affectedComponent: 'src/server/audit',
          exploitability: 'LOW',
          controlReference: 'CC-SOC2-CC6.1',
          recommendedRemediation: 'Attach audit log verification to task acceptance criteria.',
          status: 'OPEN',
          owner: 'usr-lead',
          createdAt: new Date().toISOString(),
          isStopConditionTriggered: false
        });
      }
    }

    // Persist any generated findings into storage
    for (const finding of findings) {
      storage.saveSecurityFinding(finding, 'SECURITY_VALIDATOR', 'SECURITY');
    }

    const hasCritical = findings.some(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');
    const passed = !stopConditionTriggered && !hasCritical;

    return {
      passed,
      stopConditionTriggered,
      stopCondition,
      findings,
      summary: passed
        ? `Security validation PASSED under profile '${securityProfile}'. Zero critical vulnerabilities or stop conditions detected.`
        : `Security validation BLOCKED! ${findings.length} findings detected (Stop Condition: ${stopCondition || 'CRITICAL_FINDINGS'}).`
    };
  }

  /**
   * Asserts whether a developer is attempting to self-certify security resolutions
   */
  public assertResolutionAuthority(actorRole: UserRole): void {
    if (actorRole === 'DEVELOPER' || actorRole === 'CLIENT') {
      throw new Error(`Permission Denied: Role '${actorRole}' cannot resolve security findings. Project Lead or Security authority required.`);
    }
  }

  /**
   * Evaluate Data Flow Compliance across Trust Boundaries
   */
  public validateDataFlow(flow: DataFlowRecord): { compliant: boolean; issues: string[] } {
    const issues: string[] = [];

    // Verify origin and storage
    if (!flow.dataOrigin || !flow.storageLocation) {
      issues.push('Missing data origin or authoritative storage location.');
    }

    // Verify authorized roles include at least one privileged lead or security role
    const hasPrivilegedRole = flow.authorizedRoles.some(r => r === 'PROJECT_LEAD' || r === 'SECURITY' || r === 'ARCHITECT');
    if (!hasPrivilegedRole) {
      issues.push('Data flow must have at least one authorized governance role (PROJECT_LEAD or SECURITY).');
    }

    // Check external provider boundaries
    if (flow.externalProviders.length > 0 && !flow.transformations.some(t => t.toLowerCase().includes('sanitize') || t.toLowerCase().includes('hash') || t.toLowerCase().includes('compact'))) {
      issues.push('External transmission requires explicit sanitization or compaction transformation step.');
    }

    return {
      compliant: issues.length === 0,
      issues
    };
  }
}

export const securityEngine = new SecurityValidationEngine();
