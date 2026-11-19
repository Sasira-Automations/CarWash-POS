import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AuditLogItem, AuditCategory } from '../types';

const LOCAL_STORAGE_KEY = 'washflow_audit_logs';
const MAX_LOCAL_LOGS = 250;

export interface LogEventParams {
  action: string;
  category: AuditCategory;
  details?: Record<string, any>;
  userId?: string | null;
  userEmail?: string | null;
}

const getStoredLocalLogs = (): AuditLogItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveStoredLocalLogs = (logs: AuditLogItem[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs.slice(0, MAX_LOCAL_LOGS)));
  } catch (err) {
    console.warn('Failed to save audit logs to localStorage:', err);
  }
};

/**
 * Record an audit log entry to Supabase and local cache
 */
export const logAuditEvent = async ({
  action,
  category,
  details = {},
  userId,
  userEmail,
}: LogEventParams): Promise<AuditLogItem> => {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  const now = new Date().toISOString();

  const clientOrigin = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost';
  const isLocal = clientOrigin === 'localhost' || clientOrigin === '127.0.0.1';
  const reportedIp = isLocal ? '127.0.0.1 (Local Client)' : `Web Client (${clientOrigin})`;

  // Create client log entry
  const entry: AuditLogItem = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: userId || null,
    userEmail: userEmail || 'system',
    action,
    category,
    details,
    ipAddress: reportedIp,
    userAgent,
    createdAt: now,
  };

  // 1. Save to local storage for immediate offline/fast access
  const existing = getStoredLocalLogs();
  saveStoredLocalLogs([entry, ...existing]);

  // 2. Persist to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('audit_logs').insert([
        {
          id: entry.id,
          user_id: entry.userId || null,
          user_email: entry.userEmail,
          action: entry.action,
          category: entry.category,
          details: entry.details,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent,
          created_at: entry.createdAt,
        },
      ]);
      if (error) {
        console.warn('Failed to sync audit log to Supabase:', error.message);
      }
    } catch (err) {
      console.warn('Network error while persisting audit log:', err);
    }
  }

  return entry;
};

/**
 * Fetch recent audit logs from Supabase with fallback to local storage
 */
export const fetchAuditLogs = async (limit = 100): Promise<AuditLogItem[]> => {
  const localLogs = getStoredLocalLogs();

  if (!isSupabaseConfigured) {
    return localLogs.slice(0, limit);
  }

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      return localLogs.slice(0, limit);
    }

    const remoteLogs: AuditLogItem[] = data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      action: row.action,
      category: row.category as AuditCategory,
      details: row.details || {},
      ipAddress: row.ip_address || 'Unknown',
      userAgent: row.user_agent || 'Unknown',
      createdAt: row.created_at,
    }));

    // Merge and deduplicate by ID
    const seen = new Set<string>();
    const merged: AuditLogItem[] = [];

    for (const log of [...remoteLogs, ...localLogs]) {
      if (!seen.has(log.id)) {
        seen.add(log.id);
        merged.push(log);
      }
    }

    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return merged.slice(0, limit);
  } catch (err) {
    console.warn('Error fetching remote audit logs, falling back to local:', err);
    return localLogs.slice(0, limit);
  }
};

/**
 * Export audit logs as CSV file
 */
export const exportAuditLogsToCSV = (logs: AuditLogItem[]): void => {
  if (!logs.length) return;

  const headers = ['Timestamp', 'Category', 'Action', 'User Email', 'IP Address', 'Details'];
  const rows = logs.map((log) => [
    `"${log.createdAt}"`,
    `"${log.category}"`,
    `"${log.action}"`,
    `"${log.userEmail || ''}"`,
    `"${log.ipAddress || ''}"`,
    `"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `washflow-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export audit logs as JSON file
 */
export const exportAuditLogsToJSON = (logs: AuditLogItem[]): void => {
  if (!logs.length) return;

  const jsonContent = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', jsonContent);
  link.setAttribute('download', `washflow-audit-logs-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
