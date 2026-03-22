import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHistory, faSearch, faPlus, faEdit, faTrash, faEye, faFilter,
  faChevronLeft, faChevronRight, faShieldAlt
} from '@fortawesome/free-solid-svg-icons';
import { auditService } from '@/services/audit';

const actionConfig = {
  create: { label: 'Yaratish', color: '#22C55E', bg: 'rgba(34,197,94,0.15)', icon: faPlus },
  update: { label: 'Yangilash', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', icon: faEdit },
  delete: { label: "O'chirish", color: '#EF4444', bg: 'rgba(239,68,68,0.15)', icon: faTrash },
  read: { label: "Ko'rish", color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', icon: faEye },
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState(null);
  const [tab, setTab] = useState('logs');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      if (filterAction) params.action = filterAction;
      const res = await auditService.getAll(params);
      setLogs(res.data?.data || res.data?.results || []);
      setTotalPages(res.data?.meta?.total_pages || Math.ceil((res.data?.count || 0) / 20) || 1);
    } catch { toast.error("Xato"); }
    setLoading(false);
  };

  const fetchSummary = async () => {
    try {
      const res = await auditService.getSummary(7);
      setSummary(res.data?.data || res.data);
    } catch {}
  };

  useEffect(() => { fetchSummary(); }, []);
  useEffect(() => { fetchLogs(); }, [search, filterAction, page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Audit log</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Tizimdagi barcha o'zgarishlarni kuzating</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(actionConfig).map(([key, cfg]) => (
            <div key={key} className="rounded-xl p-4 border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cfg.bg }}>
                  <FontAwesomeIcon icon={cfg.icon} className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                </div>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{cfg.label}</span>
              </div>
              <div className="text-xl font-bold" style={{ color: cfg.color }}>{summary[key] || summary[`${key}_count`] || 0}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>So'nggi 7 kun</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..." className="w-full h-11 pl-11 pr-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
        </div>
        <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1); }} className="h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="">Barcha amallar</option>
          {Object.entries(actionConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Logs */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} /></div>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
              {['Foydalanuvchi', 'Amal', 'Model', 'Tavsif', 'Vaqt'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {logs.map(log => {
                const action = actionConfig[log.action] || actionConfig.read;
                return (
                  <tr key={log.id} className="border-b hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{log.user_name || log.user || '—'}</td>
                    <td className="px-4 py-3">
                      <span style={{ color: action.color, backgroundColor: action.bg, padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 500 }}>
                        <FontAwesomeIcon icon={action.icon} className="w-3 h-3 mr-1" />{action.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{log.model || log.content_type || '—'}</td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>{log.description || log.changes || '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleString('uz-UZ')}</td>
                  </tr>
                );
              })}
              {logs.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>Loglar topilmadi</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border disabled:opacity-40" style={{ borderColor: 'var(--border-color)' }}><FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" /></button>
          <span className="text-sm px-4" style={{ color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border disabled:opacity-40" style={{ borderColor: 'var(--border-color)' }}><FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}