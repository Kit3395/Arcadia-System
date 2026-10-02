/**
 * ARCADIA SYSTEM - FOUNDATION SPECIFICATION v1.0
 * Authentication, Authorization (RBAC + ABAC), and Correlation Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { storage } from './storage.ts';
import { User, Permission } from '../types/index.ts';

export interface AuthenticatedRequest extends Request {
  user?: User;
  correlationId?: string;
  sessionToken?: string;
}

// Active session token store
const activeTokens = new Map<string, { userId: string; expiresAt: number }>();
let isSystemLocked = false;
let activeUserId: string | null = null; // Start locked; requires login to activate

export function isSystemLockdownActive(): boolean {
  return isSystemLocked;
}

export function setSystemLockdown(locked: boolean): void {
  isSystemLocked = locked;
  if (locked) {
    activeTokens.clear();
    activeUserId = null;
  }
}

export function getActiveUserId(): string | null {
  return activeUserId;
}

export function setActiveUserId(id: string | null): boolean {
  if (id === null) {
    activeUserId = null;
    return true;
  }
  const user = storage.getUser(id);
  if (user) {
    activeUserId = id;
    isSystemLocked = false;
    return true;
  }
  return false;
}

export function createSessionToken(userId: string): string {
  const token = `arcadia_sec_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  // 12 hour session
  activeTokens.set(token, {
    userId,
    expiresAt: Date.now() + 12 * 60 * 60 * 1000
  });
  activeUserId = userId;
  isSystemLocked = false;
  return token;
}

export function validateSessionToken(token: string): string | null {
  const session = activeTokens.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeTokens.delete(token);
    return null;
  }
  return session.userId;
}

export function revokeSessionToken(token: string): void {
  activeTokens.delete(token);
  if (activeTokens.size === 0) {
    activeUserId = null;
  }
}

/**
 * Middleware: Attach Correlation ID and Active User Context
 */
export function correlationAndAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // Generate or forward Correlation ID
  const correlationId = (req.headers['x-arcadia-correlation-id'] as string) || 
    `corr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  req.correlationId = correlationId;
  res.setHeader('X-Arcadia-Correlation-Id', correlationId);

  // Check Bearer token first
  const authHeader = req.headers['authorization'];
  let identifiedUserId: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    identifiedUserId = validateSessionToken(token);
    if (identifiedUserId) {
      req.sessionToken = token;
    }
  }

  // Non-production fallbacks: explicit header override (for testing) or the
  // single active preview session. In production, ONLY a valid Bearer session
  // token identifies a user — no header impersonation, no shared global session.
  if (!identifiedUserId && process.env.NODE_ENV !== 'production') {
    const headerUserId = req.headers['x-arcadia-user-id'] as string;
    identifiedUserId = headerUserId || activeUserId;
  }

  if (identifiedUserId && !isSystemLocked) {
    const user = storage.getUser(identifiedUserId);
    if (user) {
      req.user = user;
      res.setHeader('X-Arcadia-Actor-Role', user.role);
      res.setHeader('X-Arcadia-Actor-Email', user.email);
    }
  }

  next();
}

/**
 * Guard: Require Authenticated User
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (isSystemLocked || !req.user) {
    res.status(401).json({
      error: 'SYSTEM_LOCKED',
      message: 'System is under full lockdown. Valid authorized authentication is required.',
      correlationId: req.correlationId
    });
    return;
  }
  next();
}

/**
 * Guard: Require Specific RBAC Permission
 */
export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (isSystemLocked || !req.user) {
      res.status(401).json({
        error: 'SYSTEM_LOCKED',
        message: 'System is under full lockdown. Valid authorized authentication is required.',
        correlationId: req.correlationId
      });
      return;
    }

    const hasPerm = storage.hasPermission(req.user.role, permission);
    if (!hasPerm) {
      // Record unauthorized attempt in audit log
      storage.recordAudit({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'AUTHORIZATION_DENIED',
        targetEntity: 'Permission',
        targetId: permission,
        projectId: req.params.projectId || (req.body?.projectId as string),
        afterState: { attemptedPath: req.originalUrl, requiredPermission: permission },
        correlationId: req.correlationId || 'unknown'
      });

      res.status(403).json({
        error: 'PERMISSION_DENIED',
        message: `Role '${req.user.role}' lacks required permission '${permission}'.`,
        correlationId: req.correlationId
      });
      return;
    }

    next();
  };
}
