import type { AuditLogEntry, PropertyFilters } from './types';

const AUDIT_STORAGE_KEY = 'mlsAuditLog';
const MAX_LOG_ENTRIES = 1000;

function logAuditEvent(entry: AuditLogEntry): void {
  try {
    const existing = localStorage.getItem(AUDIT_STORAGE_KEY);
    const log: AuditLogEntry[] = existing ? JSON.parse(existing) : [];

    log.push(entry);

    // Keep only recent entries
    if (log.length > MAX_LOG_ENTRIES) {
      log.splice(0, log.length - MAX_LOG_ENTRIES);
    }

    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(log));
  } catch {
    // Silently fail if localStorage is full or unavailable
  }
}

export function logPropertyView(listingId: string): void {
  logAuditEvent({
    timestamp: new Date().toISOString(),
    action: 'view',
    listingId,
    userAgent: navigator.userAgent,
  });
}

export function logSearch(filters: PropertyFilters): void {
  logAuditEvent({
    timestamp: new Date().toISOString(),
    action: 'search',
    searchCriteria: filters,
    userAgent: navigator.userAgent,
  });
}

export function logPropertySave(listingId: string): void {
  logAuditEvent({
    timestamp: new Date().toISOString(),
    action: 'save',
    listingId,
    userAgent: navigator.userAgent,
  });
}

export function logContactInquiry(listingId?: string): void {
  logAuditEvent({
    timestamp: new Date().toISOString(),
    action: 'contact',
    listingId,
    userAgent: navigator.userAgent,
  });
}

export function getAuditLog(): AuditLogEntry[] {
  try {
    const log = localStorage.getItem(AUDIT_STORAGE_KEY);
    return log ? JSON.parse(log) : [];
  } catch {
    return [];
  }
}

export function clearAuditLog(): void {
  localStorage.removeItem(AUDIT_STORAGE_KEY);
}
