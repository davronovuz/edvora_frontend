import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faSearch, faEdit, faTrash, faTimes, faWallet, faArrowUp, faArrowDown,
  faMoneyBillWave, faChartPie, faChevronLeft, faChevronRight, faUserTie
} from '@fortawesome/free-solid-svg-icons';
import { expenseCategoriesService, expensesService, transactionsService, salariesService, financeDashboardService } from '@/services/finance';

const expenseStatusColors = {
  pending: { color: '#EAB308', bg: 'rgba(234,179,8,0.15)' },
  approved: { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  paid: { color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  cancelled: { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
};

const salaryStatusColors = {
  calculated: { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  approved: { color: '#EAB308', bg: 'rgba(234,179,8,0.15)' },
  paid: { color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  cancelled: { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
};

const txTypeConfig = {
  income: { color: '#22C55E', icon: faArrowUp },
  expense: { color: '#EF4444', icon: faArrowDown },
  transfer: { color: '#3B82F6', icon: faMoneyBillWave },
  refund: { color: '#8B5CF6', icon: faMoneyBillWave },
  salary: { color: '#F97316', icon: faUserTie },
};

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faTimes} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>
        {children}
      </div>
    </>
  );
}

const formatMoney = (v) => Number(v || 0).toLocaleString('uz-UZ') + " so'm";

const emptyExpense = { category: '', title: '', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0], status: 'pending' };

export default function Finance() {
  const { t } = useTranslation();

  const txTypeLabels = {
    income: t('finance.income'),
    expense: t('finance.expense'),
    transfer: t('payments.transfer'),
    refund: t('payments.refund'),
    salary: t('teachers.salary'),
  };

  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyExpense);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDashboard = async () => {
    try {
      const res = await financeDashboardService.get();
      setDashboard(res.data?.data || res.data);
    } catch {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      if (tab === 'expenses') {
        const res = await expensesService.getAll(params);
        setExpenses(res.data?.data || res.data?.results || []);
        setTotalPages(res.data?.meta?.total_pages || 1);
      } else if (tab === 'transactions') {
        const res = await transactionsService.getAll(params);
        setTransactions(res.data?.data || res.data?.results || []);
        setTotalPages(res.data?.meta?.total_pages || 1);
      } else if (tab === 'salaries') {
        const res = await salariesService.getAll(params);
        setSalaries(res.data?.data || res.data?.results || []);
        setTotalPages(res.data?.meta?.total_pages || 1);
      }
    } catch { toast.error('Xato'); }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
    (async () => {
      try {
        const res = await expenseCategoriesService.getAll();
        setCategories(res.data?.data || res.data?.results || []);
      } catch {}
    })();
  }, []);

  useEffect(() => { if (tab !== 'dashboard') fetchData(); else setLoading(false); }, [tab, search, page]);

  const handleSaveExpense = async () => {
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (editId) { await expensesService.update(editId, payload); toast.success(t('finance.expense') + ' ' + t('common.updated')); }
      else { await expensesService.create(payload); toast.success(t('finance.expense') + ' ' + t('common.created')); }
      setShowForm(false); setEditId(null); setForm(emptyExpense); fetchData();
    } catch (e) { toast.error(e.response?.data?.error?.message || 'Xato'); }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm(t('common.delete') + '?')) return;
    try { await expensesService.delete(id); toast.success(t('common.delete') + ' ✓'); fetchData(); }
    catch { toast.error('Xato'); }
  };

  const tabs = [
    { key: 'dashboard', label: t('dashboard.title'), icon: faChartPie },
    { key: 'expenses', label: t('finance.expense'), icon: faArrowDown },
    { key: 'transactions', label: t('finance.transactions'), icon: faMoneyBillWave },
    { key: 'salaries', label: t('teachers.salary'), icon: faUserTie },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('finance.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('finance.transactions')}</p>
        </div>
        {tab === 'expenses' && (
          <button onClick={() => { setForm(emptyExpense); setEditId(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>
            <FontAwesomeIcon icon={faPlus} /> {t('finance.expense')} {t('common.add').toLowerCase()}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => { setTab(tb.key); setPage(1); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === tb.key ? 'shadow-sm' : ''}`}
            style={{ backgroundColor: tab === tb.key ? 'var(--bg-secondary)' : 'transparent', color: tab === tb.key ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            <FontAwesomeIcon icon={tb.icon} /> <span className="hidden sm:inline">{tb.label}</span>
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {tab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t('common.total') + ' ' + t('finance.income').toLowerCase(), value: formatMoney(dashboard.total_income), color: '#22C55E', icon: faArrowUp },
              { label: t('common.total') + ' ' + t('finance.expense').toLowerCase(), value: formatMoney(dashboard.total_expense), color: '#EF4444', icon: faArrowDown },
              { label: t('common.total') + ' ' + t('teachers.salary').toLowerCase(), value: formatMoney(dashboard.total_salary), color: '#F97316', icon: faUserTie },
              { label: t('finance.profit'), value: formatMoney(dashboard.net_profit), color: '#3B82F6', icon: faWallet },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-5 border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + '15' }}>
                    <FontAwesomeIcon icon={s.icon} style={{ color: s.color }} />
                  </div>
                </div>
                <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
              </div>
            ))}
          </div>
          {dashboard.recent_transactions && (
            <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{t('dashboard.recentPayments')}</h3>
              <div className="space-y-3">
                {(dashboard.recent_transactions || []).slice(0, 5).map((tx, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={txTypeConfig[tx.transaction_type]?.icon || faMoneyBillWave} style={{ color: txTypeConfig[tx.transaction_type]?.color }} />
                      <div>
                        <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{tx.description}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{tx.transaction_date}</div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: txTypeConfig[tx.transaction_type]?.color }}>{formatMoney(tx.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expenses Tab */}
      {tab === 'expenses' && (
        <>
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('common.search')} className="w-full h-11 pl-11 pr-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            {loading ? (
              <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                    {[t('common.name'), t('common.status'), t('payments.amount'), t('common.date'), t('common.status'), ''].map((h, i) => (
                      <th key={i} className="text-left px-4 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {expenses.map(exp => (
                      <tr key={exp.id} className="border-b hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: 'var(--border-color)' }}>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{exp.title}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{exp.category_name || exp.category}</td>
                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#EF4444' }}>{formatMoney(exp.amount)}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{exp.expense_date}</td>
                        <td className="px-4 py-3"><span style={{ color: expenseStatusColors[exp.status]?.color, backgroundColor: expenseStatusColors[exp.status]?.bg, padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>{exp.status}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setForm({ category: exp.category, title: exp.title, description: exp.description || '', amount: exp.amount, expense_date: exp.expense_date, status: exp.status }); setEditId(exp.id); setShowForm(true); }} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faEdit} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} /></button>
                            <button onClick={() => handleDeleteExpense(exp.id)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faTrash} className="w-4 h-4" style={{ color: '#EF4444' }} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {expenses.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.noData')}</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Transactions Tab */}
      {tab === 'transactions' && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                  {[t('common.status'), t('students.notes'), t('payments.amount'), t('common.date')].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: 'var(--border-color)' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={txTypeConfig[tx.transaction_type]?.icon || faMoneyBillWave} style={{ color: txTypeConfig[tx.transaction_type]?.color }} />
                          <span className="text-sm font-medium" style={{ color: txTypeConfig[tx.transaction_type]?.color }}>{txTypeLabels[tx.transaction_type] || tx.transaction_type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>{tx.description}</td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: txTypeConfig[tx.transaction_type]?.color }}>{formatMoney(tx.amount)}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{tx.transaction_date}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && <tr><td colSpan={4} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.noData')}</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Salaries Tab */}
      {tab === 'salaries' && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                  {[t('groups.teacher'), t('common.date'), t('teachers.salary'), 'Bonus', t('common.total'), t('common.status')].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {salaries.map(s => (
                    <tr key={s.id} className="border-b hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: 'var(--border-color)' }}>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.teacher_name || s.teacher}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{s.period_month}/{s.period_year}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{formatMoney(s.base_salary)}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#22C55E' }}>{formatMoney(s.bonus)}</td>
                      <td className="px-4 py-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatMoney(s.total)}</td>
                      <td className="px-4 py-3"><span style={{ color: salaryStatusColors[s.status]?.color, backgroundColor: salaryStatusColors[s.status]?.bg, padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>{s.status}</span></td>
                    </tr>
                  ))}
                  {salaries.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.noData')}</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {tab !== 'dashboard' && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border disabled:opacity-40" style={{ borderColor: 'var(--border-color)' }}><FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" /></button>
          <span className="text-sm px-4" style={{ color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border disabled:opacity-40" style={{ borderColor: 'var(--border-color)' }}><FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" /></button>
        </div>
      )}

      {/* Expense Form Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditId(null); }} title={editId ? t('common.edit') + ' ' + t('finance.expense').toLowerCase() : t('finance.expense') + ' ' + t('common.add').toLowerCase()}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('common.name')} *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('common.status')} *</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">{t('common.search').replace('...', '')}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('payments.amount')} *</label>
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('common.date')}</label>
              <input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('students.notes')}</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="flex-1 h-11 rounded-xl border font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{t('common.cancel')}</button>
            <button onClick={handleSaveExpense} className="flex-1 h-11 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>{t('common.save')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
