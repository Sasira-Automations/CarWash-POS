import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Shield,
  CreditCard,
  Settings,
  DollarSign,
  User,
  Activity,
  ChevronDown,
  ChevronUp,
  Clock
} from 'lucide-react';
import { AuditLogItem, AuditCategory } from '../../types';
import {
  fetchAuditLogs,
  exportAuditLogsToCSV,
  exportAuditLogsToJSON
} from '../../services/auditLogService';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAuditLogs(150);
      setLogs(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Category filter
      if (selectedCategory !== 'all' && log.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const actionMatch = log.action.toLowerCase().includes(query);
        const emailMatch = (log.userEmail || '').toLowerCase().includes(query);
        const categoryMatch = log.category.toLowerCase().includes(query);
        const detailsMatch = JSON.stringify(log.details || {}).toLowerCase().includes(query);
        return actionMatch || emailMatch || categoryMatch || detailsMatch;
      }

      return true;
    });
  }, [logs, selectedCategory, searchQuery]);

  const getCategoryBadge = (category: AuditCategory) => {
    switch (category) {
      case 'auth':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: User,
          label: 'Auth'
        };
      case 'security':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: Shield,
          label: 'Security'
        };
      case 'pos':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CreditCard,
          label: 'POS & Sales'
        };
      case 'expenses':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: DollarSign,
          label: 'Expenses'
        };
      case 'settings':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Settings,
          label: 'Settings'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: Activity,
          label: 'System'
        };
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header & Action Controls */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">System Audit Trail & Compliance</h3>
              <p className="text-xs text-slate-500">
                Immutable records of user logins, 2FA operations, sales, refunds, and security events.
              </p>
            </div>
          </div>

          {/* Export & Refresh Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadLogs}
              disabled={isLoading}
              title="Refresh log feed"
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => exportAuditLogsToCSV(filteredLogs)}
              disabled={filteredLogs.length === 0}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={() => exportAuditLogsToJSON(filteredLogs)}
              disabled={filteredLogs.length === 0}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action, email, or details..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Category Filter Select */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="all">All Categories</option>
              <option value="auth">Authentication</option>
              <option value="security">Security & 2FA</option>
              <option value="pos">POS & Transactions</option>
              <option value="expenses">Expenses</option>
              <option value="settings">Settings</option>
              <option value="operations">Operations</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table / Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading audit log entries...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-1">
            <p className="font-bold text-slate-600 text-sm">No audit logs found</p>
            <p>
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search criteria or category filter.'
                : 'Activity will automatically be logged as you interact with the dashboard.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const badge = getCategoryBadge(log.category);
              const Icon = badge.icon;
              const isExpanded = expandedLogId === log.id;

              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors cursor-pointer"
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className={`p-2 rounded-xl border shrink-0 ${badge.bg}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {log.action}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          User: <strong className="text-slate-700">{log.userEmail || 'System'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right text-[11px] text-slate-400">
                        <div className="flex items-center gap-1 font-medium text-slate-600 sm:justify-end">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatTimestamp(log.createdAt)}</span>
                        </div>
                        <span className="text-[10px]">{log.ipAddress || 'Client'}</span>
                      </div>

                      <button
                        type="button"
                        aria-label="Toggle details"
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable JSON details */}
                  {isExpanded && (
                    <div className="mt-3.5 p-3.5 bg-slate-900 rounded-2xl text-slate-100 text-xs font-mono space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                        <span>Event ID: {log.id}</span>
                        <span>Category: {log.category}</span>
                      </div>
                      <div className="overflow-x-auto text-[11px] max-h-56 leading-relaxed">
                        <pre className="text-emerald-400 font-mono">
                          {JSON.stringify(log.details || {}, null, 2)}
                        </pre>
                      </div>
                      {log.userAgent && (
                        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 break-all">
                          User-Agent: {log.userAgent}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
