import { DatabaseWriter } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Audit log helper utility
 * Provides functions to create audit log entries for entity changes
 */

export type AuditAction = "create" | "update" | "delete" | "approve" | "cancel" | "lock" | "unlock" | "return" | "payment";

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  dataType: string;
}

export interface CreateAuditLogParams {
  db: DatabaseWriter;
  organizationId: Id<"organizations">;
  userId: Id<"users">;
  userName: string;
  action: AuditAction;
  entityType: string;
  entityId: string | Id<any>; // Can be string or Convex ID
  changes: AuditChange[];
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<Id<"auditLogs">> {
  const {
    db,
    organizationId,
    userId,
    userName,
    action,
    entityType,
    entityId,
    changes,
    metadata,
    ipAddress,
    userAgent,
  } = params;

  const now = Date.now();

  // Ensure entityId is always a string
  const entityIdString = typeof entityId === "string" ? entityId : String(entityId);
  
  // Ensure changes array is not empty (at least log that an action occurred)
  const finalChanges = changes.length > 0 ? changes : [{
    field: "_action",
    oldValue: null,
    newValue: action,
    dataType: "string",
  }];

  return await db.insert("auditLogs", {
    organizationId,
    userId,
    userName,
    action,
    entityType,
    entityId: entityIdString,
    changes: finalChanges,
    metadata: metadata || {},
    ipAddress,
    userAgent,
    timestamp: now,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Compare two objects and generate audit changes
 * Useful for tracking updates
 */
export function generateChanges(oldData: any, newData: any, excludeFields: string[] = []): AuditChange[] {
  const changes: AuditChange[] = [];
  const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

  for (const key of allKeys) {
    // Skip excluded fields and internal fields
    if (excludeFields.includes(key) || key === "updatedAt" || key === "_id" || key === "_creationTime") {
      continue;
    }

    const oldValue = oldData?.[key];
    const newValue = newData?.[key];

    // Skip if values are the same
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
      continue;
    }

    // Determine data type
    let dataType = "unknown";
    if (newValue !== null && newValue !== undefined) {
      if (Array.isArray(newValue)) {
        dataType = "array";
      } else if (typeof newValue === "object") {
        dataType = "object";
      } else {
        dataType = typeof newValue;
      }
    } else if (oldValue !== null && oldValue !== undefined) {
      if (Array.isArray(oldValue)) {
        dataType = "array";
      } else if (typeof oldValue === "object") {
        dataType = "object";
      } else {
        dataType = typeof oldValue;
      }
    }

    changes.push({
      field: key,
      oldValue: oldValue ?? null, // Always include, use null if undefined
      newValue: newValue ?? null, // Always include, use null if undefined
      dataType,
    });
  }

  return changes;
}

/**
 * Create audit log for entity creation
 */
export async function logCreate(
  db: DatabaseWriter,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
  userName: string,
  entityType: string,
  entityId: string | Id<any>,
  newData: any,
  options?: {
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    excludeFields?: string[];
  }
): Promise<Id<"auditLogs">> {
  const changes = generateChanges({}, newData, options?.excludeFields || []);

  // Ensure we have at least some changes for create operations
  if (changes.length === 0) {
    // If no changes detected, create a minimal log entry
    const firstKey = Object.keys(newData || {})[0];
    if (firstKey) {
      changes.push({
        field: firstKey,
        oldValue: null,
        newValue: newData[firstKey] ?? null,
        dataType: typeof newData[firstKey],
      });
    }
  }

  return await createAuditLog({
    db,
    organizationId,
    userId,
    userName,
    action: "create",
    entityType,
    entityId: typeof entityId === "string" ? entityId : String(entityId),
    changes,
    metadata: options?.metadata,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
  });
}

/**
 * Create audit log for entity update
 */
export async function logUpdate(
  db: DatabaseWriter,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
  userName: string,
  entityType: string,
  entityId: string | Id<any>,
  oldData: any,
  newData: any,
  options?: {
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    excludeFields?: string[];
  }
): Promise<Id<"auditLogs">> {
  const changes = generateChanges(oldData, newData, options?.excludeFields || []);

  if (changes.length === 0) {
    // No actual changes, skip logging
    throw new Error("No changes detected");
  }

  return await createAuditLog({
    db,
    organizationId,
    userId,
    userName,
    action: "update",
    entityType,
    entityId,
    changes,
    metadata: options?.metadata,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
  });
}

/**
 * Create audit log for entity deletion
 */
export async function logDelete(
  db: DatabaseWriter,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
  userName: string,
  entityType: string,
  entityId: string | Id<any>,
  oldData: any,
  options?: {
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    excludeFields?: string[];
  }
): Promise<Id<"auditLogs">> {
  const changes = generateChanges(oldData, {}, options?.excludeFields || []);

  return await createAuditLog({
    db,
    organizationId,
    userId,
    userName,
    action: "delete",
    entityType,
    entityId,
    changes,
    metadata: options?.metadata,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
  });
}

