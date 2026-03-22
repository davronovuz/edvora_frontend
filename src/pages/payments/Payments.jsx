import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faSearch, faEdit, faTrash, faTimes, faMoneyBill, faFileInvoice,
  faPercent, faChevronLeft, faChevronRight, faEye, faUndo
} from '@fortawesome/free-solid-svg-icons';
import { paymentsService, invoicesService, discountsService } from '@/services/payments';
import api from '@/services/api';

const paymentStatusConfig = {
  pending: { color: '#EAB308', bg: 'rgba(234,179,8,0.15)' },
  completed: { color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  cancelled: { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  refunded: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
};

const invoiceStatusConfig = {
  draft: { color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
  sent: { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  paid: { color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  partial: { color: '#EAB308', bg: 'rgba(234,179,8,0.15)' },
  overdue: { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  cancelled: { color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
};

function StatusBadge({ status, config, label }) {
  const s = config[status] || { color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' };
  return <span style={{ color: s.color, backgroundColor: s.bg, padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>{label || status}</span>;
}

function Modal({ isOpen, onClose, title, children, wide }) {
  if (!isOpen) return null;
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto rounded-2xl p-6`} style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5">
            <FontAwesomeIcon icon={faTimes} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

const emptyPayment = { student: '', group: '', amount: '', payment_method: 'cash', payment_type: 'tuition', period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), note: '' };
const emptyDiscount = { student: '', group: '', name: '', discount_type: 'percent', value: '', start_date: '', end_date: '', reason: '' };

export default function Payments() {
  const { t } = useTranslation();

  const methodOptions = [
    { value: 'cash', label: t('payments.cash') },
    { value: 'card', label: t('payments.card') },
    { value: 'transfer', label: t('payments.transfer') },
    { value: 'payme', label: 'Payme' },
    { value: 'click', label: 'Click' },
  ];

  const typeLabels = { tuition: t('payments.title'), registration: t('common.created'), material: 'Material', other: t('common.all') };

  const statusLabels = {
    pending: t('common.loading').replace('...', ''),
    completed: t('common.active'),
    cancelled: t('common.inactive'),
    refunded: t('payments.refund'),
    draft: 'Draft', sent: 'Sent', paid: t('common.active'),
    partial: 'Partial', overdue: 'Overdue',
  };

  const [tab, setTab] = useState('payments');
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyPayment);
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountForm, setDiscountForm] = useState(emptyDiscount);
  const [discountEditId, setDiscountEditId] = useState(null);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const formatMoney = (v) => Number(v || 0).toLocaleString('uz-UZ') + " so'm";

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;

      if (tab === 'payments') {
        const res = await paymentsService.getAll(params);
        setPayments(res.data?.data || res.data?.results || []);
        setTotalPages(res.data?.meta?.total_pages || Math.ceil((res.data?.count || 0) / 20) || 1);
      } else if (tab === 'invoices') {
        const res = await invoicesService.getAll(params);
        setInvoices(res.data?.data || res.data?.results || []);
        setTotalPages(res.data?.meta?.total_pages || Math.ceil((res.data?.count || 0) / 20) || 1);
      } else {
        const res = await discountsService.getAll(params);
        setDiscounts(res.data?.data || res.data?.results || []);
        setTotalPages(res.data?.meta?.total_pages || Math.ceil((res.data?.count || 0) / 20) || 1);
      }
    } catch { toast.error('Xato'); }
    setLoading(false);
  };

  const fetchMeta = async () => {
    try {
      const [s, g] = await Promise.all([api.get('/students/'), api.get('/groups/')]);
      setStudents(s.data?.data || s.data?.results || []);
      setGroups(g.data?.data || g.data?.results || []);
    } catch {}
  };

  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => { fetchData(); }, [tab, search, filterStatus, page]);

  const handleSavePayment = async () => {
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (editId) { await paymentsService.update(editId, payload); toast.success(t('payments.title') + ' ' + t('common.updated')); }
      else { await paymentsService.create(payload); toast.success(t('payments.addPayment') + ' ✓'); }
      setShowForm(false); setEditId(null); setForm(emptyPayment); fetchData();
    } catch (e) { toast.error(e.response?.data?.error?.message || 'Xato'); }
  };

  const handleDeletePayment = async (id) => {
    if (!confirm(t('common.delete') + '?')) return;
    try { await paymentsService.delete(id); toast.success(t('common.delete') + ' ✓'); fetchData(); }
    catch { toast.error('Xato'); }
  };

  const handleRefund = async (id) => {
    if (!confirm(t('payments.refund') + '?')) return;
    try { await paymentsService.update(id, { status: 'refunded' }); toast.success(t('payments.refund') + ' ✓'); fetchData(); }
    catch { toast.error('Xato'); }
  };

  const handleSaveDiscount = async () => {
    try {
      const payload = { ...discountForm, value: parseFloat(discountForm.value) };
      if (discountEditId) { await discountsService.update(discountEditId, payload); toast.success(t('payments.discount') + ' ' + t('common.updated')); }
      else { await discountsService.create(payload); toast.success(t('payments.discount') + ' ' + t('common.created')); }
      setShowDiscount(false); setDiscountEditId(null); setDiscountForm(emptyDiscount); fetchData();
    } catch (e) { toast.error(e.response?.data?.error?.message || 'Xato'); }
  };

  const handleDeleteDiscount = async (id) => {
    if (!confirm(t('common.delete') + '?')) return;
    try { await discountsService.delete(id); toast.success(t('common.delete') + ' ✓'); fetchData(); }
    catch { toast.error('Xato'); }
  };

  const tabs = [
    { key: 'payments', label: t('payments.title'), icon: faMoneyBill },
    { key: 'invoices', label: t('payments.receipt'), icon: faFileInvoice },
    { key: 'discounts', label: t('payments.discount'), icon: faPercent },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('payments.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('payments.title')}, {t('payments.receipt').toLowerCase()}, {t('payments.discount').toLowerCase()}</p>
        </div>
        <div className="flex gap-2">
          {tab === 'payments' && (
            <button onClick={() => { setForm(emptyPayment); setEditId(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>
              <FontAwesomeIcon icon={faPlus} /> {t('payments.addPayment')}
            </button>
          )}
          {tab === 'discounts' && (
            <button onClick={() => { setDiscountForm(emptyDiscount); setDiscountEditId(null); setShowDiscount(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>
              <FontAwesomeIcon icon={faPlus} /> {t('payments.discount')} {t('common.add').toLowerCase()}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => { setTab(tb.key); setPage(1); setFilterStatus(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === tb.key ? 'shadow-sm' : ''}`}
            style={{ backgroundColor: tab === tb.key ? 'var(--bg-secondary)' : 'transparent', color: tab === tb.key ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            <FontAwesomeIcon icon={tb.icon} /> {tb.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('common.search')} className="w-full h-11 pl-11 pr-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="">{t('common.all')} {t('common.status').toLowerCase()}</option>
          {Object.entries(tab === 'invoices' ? invoiceStatusConfig : paymentStatusConfig).map(([k]) => (
            <option key={k} value={k}>{statusLabels[k] || k}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} /></div>
        ) : tab === 'payments' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                {[t('payments.student'), t('payments.group'), t('payments.amount'), t('payments.method'), t('common.date'), t('common.status'), ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.student_name || p.student}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{p.group_name || p.group}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatMoney(p.amount)}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{methodOptions.find(m => m.value === p.payment_method)?.label || p.payment_method}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{p.period_month}/{p.period_year}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} config={paymentStatusConfig} label={statusLabels[p.status] || p.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setForm({ student: p.student, group: p.group, amount: p.amount, payment_method: p.payment_method, payment_type: p.payment_type, period_month: p.period_month, period_year: p.period_year, note: p.note || '' }); setEditId(p.id); setShowForm(true); }} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title={t('common.edit')}>
                          <FontAwesomeIcon icon={faEdit} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        {p.status === 'completed' && (
                          <button onClick={() => handleRefund(p.id)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title={t('payments.refund')}>
                            <FontAwesomeIcon icon={faUndo} className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                          </button>
                        )}
                        <button onClick={() => handleDeletePayment(p.id)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title={t('common.delete')}>
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" style={{ color: '#EF4444' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.noData')}</td></tr>}
              </tbody>
            </table>
          </div>
        ) : tab === 'invoices' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                {['#', t('payments.student'), t('payments.amount'), t('common.date'), t('common.status'), ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-b hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--primary-600)' }}>{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>{inv.student_name || inv.student}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatMoney(inv.total)}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{inv.due_date}</td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} config={invoiceStatusConfig} label={statusLabels[inv.status] || inv.status} /></td>
                    <td className="px-4 py-3">
                      <button className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faEye} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} /></button>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.noData')}</td></tr>}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                {[t('common.name'), t('payments.student'), t('common.status'), t('payments.amount'), t('common.date'), ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {discounts.map(d => (
                  <tr key={d.id} className="border-b hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{d.name}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{d.student_name || d.student}</td>
                    <td className="px-4 py-3"><span style={{ color: d.is_active ? '#22C55E' : '#94A3B8', backgroundColor: d.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>{d.is_active ? t('common.active') : t('common.inactive')}</span></td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{d.discount_type === 'percent' ? d.value + '%' : formatMoney(d.value)}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{d.start_date} — {d.end_date || '...'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setDiscountForm({ student: d.student, group: d.group || '', name: d.name, discount_type: d.discount_type, value: d.value, start_date: d.start_date, end_date: d.end_date || '', reason: d.reason || '' }); setDiscountEditId(d.id); setShowDiscount(true); }} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faEdit} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} /></button>
                        <button onClick={() => handleDeleteDiscount(d.id)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faTrash} className="w-4 h-4" style={{ color: '#EF4444' }} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {discounts.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.noData')}</td></tr>}
              </tbody>
            </table>
          </div>
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

      {/* Payment Form Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditId(null); }} title={editId ? t('common.edit') + ' ' + t('payments.title').toLowerCase() : t('payments.addPayment')}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('payments.student')} *</label>
            <select value={form.student} onChange={e => setForm({ ...form, student: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">{t('common.search').replace('...', '')}</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('payments.group')}</label>
            <select value={form.group} onChange={e => setForm({ ...form, group: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">{t('common.search').replace('...', '')}</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('payments.amount')} *</label>
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('payments.method')}</label>
              <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                {methodOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('common.status')}</label>
              <select value={form.payment_type} onChange={e => setForm({ ...form, payment_type: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('common.from')}</label>
              <input type="number" min={1} max={12} value={form.period_month} onChange={e => setForm({ ...form, period_month: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('common.date')}</label>
              <input type="number" value={form.period_year} onChange={e => setForm({ ...form, period_year: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('students.notes')}</label>
            <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="flex-1 h-11 rounded-xl border font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{t('common.cancel')}</button>
            <button onClick={handleSavePayment} className="flex-1 h-11 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>{t('common.save')}</button>
          </div>
        </div>
      </Modal>

      {/* Discount Form Modal */}
      <Modal isOpen={showDiscount} onClose={() => { setShowDiscount(false); setDiscountEditId(null); }} title={discountEditId ? t('common.edit') + ' ' + t('payments.discount').toLowerCase() : t('payments.discount') + ' ' + t('common.add').toLowerCase()}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('common.name')} *</label>
            <input value={discountForm.name} onChange={e => setDiscountForm({ ...discountForm, name: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('payments.student')} *</label>
            <select value={discountForm.student} onChange={e => setDiscountForm({ ...discountForm, student: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">{t('common.search').replace('...', '')}</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('common.status')}</label>
              <select value={discountForm.discount_type} onChange={e => setDiscountForm({ ...discountForm, discount_type: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                <option value="percent">%</option>
                <option value="fixed">{t('payments.amount')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('payments.amount')} *</label>
              <input type="number" value={discountForm.value} onChange={e => setDiscountForm({ ...discountForm, value: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('common.from')}</label>
              <input type="date" value={discountForm.start_date} onChange={e => setDiscountForm({ ...discountForm, start_date: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('common.to')}</label>
              <input type="date" value={discountForm.end_date} onChange={e => setDiscountForm({ ...discountForm, end_date: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('students.notes')}</label>
            <textarea value={discountForm.reason} onChange={e => setDiscountForm({ ...discountForm, reason: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowDiscount(false); setDiscountEditId(null); }} className="flex-1 h-11 rounded-xl border font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{t('common.cancel')}</button>
            <button onClick={handleSaveDiscount} className="flex-1 h-11 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>{t('common.save')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
