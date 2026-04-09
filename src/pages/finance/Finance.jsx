import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faSearch, faEdit, faTrash, faTimes, faWallet, faArrowUp, faArrowDown,
  faMoneyBillWave, faChartPie, faChevronLeft, faChevronRight, faUserTie,
  faCheck, faExclamationTriangle, faCalendarAlt, faPercent, faCoins,
  faFileInvoice, faHandHoldingUsd, faCreditCard, faMobileAlt, faMoneyBill,
  faExchangeAlt, faFilter, faEye, faClock, faUsers, faChartLine, faChartBar,
} from '@fortawesome/free-solid-svg-icons';
import {
  expenseCategoriesService, expensesService, transactionsService,
  salariesService, financeDashboardService,
} from '@/services/finance';
import { paymentsService } from '@/services/payments';

// ============================================
// CONFIG
// ============================================
const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

const expenseStatusConfig = {
  pending: { label: 'Kutilmoqda', color: '#EAB308', bg: 'rgba(234,179,8,0.12)' },
  approved: { label: 'Tasdiqlangan', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  paid: { label: "To'langan", color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  cancelled: { label: 'Bekor', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

const salaryStatusConfig = {
  calculated: { label: 'Hisoblangan', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  approved: { label: 'Tasdiqlangan', color: '#EAB308', bg: 'rgba(234,179,8,0.12)' },
  paid: { label: "To'langan", color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  cancelled: { label: 'Bekor', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

const txTypeConfig = {
  income: { label: 'Kirim', color: '#22C55E', icon: faArrowUp, bg: 'rgba(34,197,94,0.1)' },
  expense: { label: 'Chiqim', color: '#EF4444', icon: faArrowDown, bg: 'rgba(239,68,68,0.1)' },
  transfer: { label: "O'tkazma", color: '#3B82F6', icon: faExchangeAlt, bg: 'rgba(59,130,246,0.1)' },
  refund: { label: 'Qaytarish', color: '#8B5CF6', icon: faMoneyBillWave, bg: 'rgba(139,92,246,0.1)' },
  salary: { label: 'Oylik', color: '#F97316', icon: faUserTie, bg: 'rgba(249,115,22,0.1)' },
};

const payMethodIcons = {
  cash: faMoneyBill,
  card: faCreditCard,
  transfer: faExchangeAlt,
  payme: faMobileAlt,
  click: faMobileAlt,
};

const formatMoney = (v) => Number(v || 0).toLocaleString('uz-UZ') + " so'm";
const formatMoneyShort = (v) => {
  const n = Number(v || 0);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
};

// ============================================
// REUSABLE COMPONENTS
// ============================================
function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    if (isOpen) { document.addEventListener('keydown', h); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = 'unset'; };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl`} style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </>
  );
}

function StatCard({ label, value, subValue, icon, color, trend }) {
  return (
    <div className="rounded-2xl p-5 border transition-all" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color + '60'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
          <FontAwesomeIcon icon={icon} className="w-5 h-5" style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className="text-xs font-medium px-2 py-1 rounded-full" style={{
            color: trend >= 0 ? '#22C55E' : '#EF4444',
            backgroundColor: trend >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'
          }}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      {subValue && <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{subValue}</div>}
    </div>
  );
}

function Badge({ status, config }) {
  const cfg = config[status] || { label: status, color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' };
  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
const emptyExpense = { category: '', title: '', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0], status: 'pending' };

export default function Finance() {
  const { t } = useTranslation();

  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [paymentStats, setPaymentStats] = useState(null);
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
  const [txFilter, setTxFilter] = useState('all');
  const [expenseFilter, setExpenseFilter] = useState('all');
  const [salaryFilter, setSalaryFilter] = useState('all');
  const [detailModal, setDetailModal] = useState(null);
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // ============================================
  // DATA FETCHING
  // ============================================
  const fetchDashboard = async () => {
    try {
      const [dashRes, monthRes, debtRes, statsRes] = await Promise.all([
        financeDashboardService.summary().catch(() => null),
        financeDashboardService.monthlyReport().catch(() => null),
        paymentsService.debtors().catch(() => null),
        paymentsService.statistics().catch(() => null),
      ]);
      setDashboard(dashRes?.data?.data || dashRes?.data || {});
      const mData = monthRes?.data?.data || monthRes?.data?.monthly_data || monthRes?.data || [];
      setMonthlyData(Array.isArray(mData) ? mData : []);
      const dData = debtRes?.data?.data || debtRes?.data?.results || debtRes?.data || [];
      setDebtors(Array.isArray(dData) ? dData : []);
      setPaymentStats(statsRes?.data?.data || statsRes?.data || null);
    } catch {}
    setLoading(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 20 };
      if (search) params.search = search;

      if (tab === 'expenses') {
        if (expenseFilter !== 'all') params.status = expenseFilter;
        const res = await expensesService.getAll(params);
        const data = res.data?.data || res.data?.results || [];
        setExpenses(Array.isArray(data) ? data : []);
        setTotalPages(res.data?.meta?.total_pages || Math.ceil((res.data?.count || 0) / 20) || 1);
      } else if (tab === 'transactions') {
        if (txFilter !== 'all') params.transaction_type = txFilter;
        const res = await transactionsService.getAll(params);
        const data = res.data?.data || res.data?.results || [];
        setTransactions(Array.isArray(data) ? data : []);
        setTotalPages(res.data?.meta?.total_pages || Math.ceil((res.data?.count || 0) / 20) || 1);
      } else if (tab === 'salaries') {
        if (salaryFilter !== 'all') params.status = salaryFilter;
        const res = await salariesService.getAll(params);
        const data = res.data?.data || res.data?.results || [];
        setSalaries(Array.isArray(data) ? data : []);
        setTotalPages(res.data?.meta?.total_pages || Math.ceil((res.data?.count || 0) / 20) || 1);
      }
    } catch { toast.error('Ma\'lumotlarni yuklashda xatolik'); }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await expenseCategoriesService.getAll();
        setCategories(res.data?.data || res.data?.results || []);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (tab === 'dashboard') fetchDashboard();
    else fetchData();
  }, [tab, search, page, txFilter, expenseFilter, salaryFilter]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleSaveExpense = async () => {
    if (!form.title.trim() || !form.amount) { toast.error('Maydonlarni to\'ldiring'); return; }
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (editId) {
        await expensesService.update(editId, payload);
        toast.success("Chiqim yangilandi");
      } else {
        await expensesService.create(payload);
        toast.success("Chiqim qo'shildi");
      }
      setShowForm(false); setEditId(null); setForm(emptyExpense); fetchData();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || e.response?.data?.detail || "Xatolik yuz berdi");
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    try { await expensesService.delete(id); toast.success("O'chirildi"); fetchData(); }
    catch { toast.error('Xatolik'); }
  };

  const tabs = [
    { key: 'dashboard', label: 'Umumiy', icon: faChartPie },
    { key: 'expenses', label: 'Chiqimlar', icon: faArrowDown },
    { key: 'transactions', label: 'Tranzaksiyalar', icon: faExchangeAlt },
    { key: 'salaries', label: 'Oyliklar', icon: faUserTie },
  ];

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Moliya boshqaruvi</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Kirim, chiqim va oylik statistikasi</p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'expenses' && (
            <button onClick={() => { setForm(emptyExpense); setEditId(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-opacity"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" /> Chiqim qo'shish
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => { setTab(tb.key); setPage(1); setSearch(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === tb.key ? 'shadow-sm' : ''}`}
            style={{
              backgroundColor: tab === tb.key ? 'var(--bg-secondary)' : 'transparent',
              color: tab === tb.key ? '#F97316' : 'var(--text-secondary)'
            }}>
            <FontAwesomeIcon icon={tb.icon} className="w-4 h-4" />
            <span className="hidden sm:inline">{tb.label}</span>
          </button>
        ))}
      </div>

      {/* ============================================ */}
      {/* DASHBOARD TAB */}
      {/* ============================================ */}
      {tab === 'dashboard' && (
        loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Jami kirim"
                value={formatMoney(dashboard?.total_income)}
                icon={faArrowUp}
                color="#22C55E"
                trend={dashboard?.income_trend}
              />
              <StatCard
                label="Jami chiqim"
                value={formatMoney(dashboard?.total_expense)}
                icon={faArrowDown}
                color="#EF4444"
                trend={dashboard?.expense_trend}
              />
              <StatCard
                label="Jami oyliklar"
                value={formatMoney(dashboard?.total_salary)}
                icon={faUserTie}
                color="#F97316"
              />
              <StatCard
                label="Sof foyda"
                value={formatMoney(dashboard?.net_profit)}
                subValue={dashboard?.profit_margin ? `Marja: ${Number(dashboard.profit_margin).toFixed(1)}%` : null}
                icon={faWallet}
                color={Number(dashboard?.net_profit || 0) >= 0 ? '#22C55E' : '#EF4444'}
              />
            </div>

            {/* Profit overview bar */}
            {Number(dashboard?.total_income || 0) > 0 && (
              <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Kirim-chiqim taqsimoti</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Kirim', value: dashboard?.total_income, color: '#22C55E', icon: faArrowUp },
                    { label: 'Chiqimlar', value: dashboard?.total_expense, color: '#EF4444', icon: faArrowDown },
                    { label: 'Oyliklar', value: dashboard?.total_salary, color: '#F97316', icon: faUserTie },
                    { label: 'Sof foyda', value: dashboard?.net_profit, color: '#3B82F6', icon: faWallet },
                  ].map(item => {
                    const pct = Math.min(100, Math.abs(Number(item.value || 0)) / Number(dashboard?.total_income || 1) * 100);
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={item.icon} className="w-3.5 h-3.5" style={{ color: item.color }} />
                            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{formatMoney(item.value)}</span>
                            <span className="text-[10px] font-medium" style={{ color: item.color }}>{pct.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Chart (simple bar visualization) */}
              {monthlyData.length > 0 && (
                <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    <FontAwesomeIcon icon={faChartBar} className="mr-2 w-4 h-4" style={{ color: '#F97316' }} />
                    Oylik hisobot
                  </h3>
                  <div className="space-y-2">
                    {monthlyData.slice(-6).map((m, i) => {
                      const maxVal = Math.max(...monthlyData.slice(-6).map(x => Number(x.income || x.total_income || 0)));
                      const income = Number(m.income || m.total_income || 0);
                      const expense = Number(m.expense || m.total_expense || 0) + Number(m.salary || m.total_salary || 0);
                      const incomePct = maxVal > 0 ? (income / maxVal * 100) : 0;
                      const expensePct = maxVal > 0 ? (expense / maxVal * 100) : 0;
                      const monthLabel = monthNames[(m.month || m.period_month || i + 1) - 1] || '';
                      return (
                        <div key={i} className="group">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium w-16" style={{ color: 'var(--text-secondary)' }}>{monthLabel}</span>
                            <div className="text-[10px] flex gap-3" style={{ color: 'var(--text-muted)' }}>
                              <span style={{ color: '#22C55E' }}>+{formatMoneyShort(income)}</span>
                              <span style={{ color: '#EF4444' }}>-{formatMoneyShort(expense)}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 h-3">
                            <div className="rounded-full transition-all" style={{ width: `${incomePct}%`, backgroundColor: '#22C55E', minWidth: income > 0 ? '4px' : '0' }} />
                            <div className="rounded-full transition-all" style={{ width: `${expensePct}%`, backgroundColor: '#EF4444', minWidth: expense > 0 ? '4px' : '0' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    <span><span className="inline-block w-2.5 h-2.5 rounded-full mr-1" style={{ backgroundColor: '#22C55E' }} />Kirim</span>
                    <span><span className="inline-block w-2.5 h-2.5 rounded-full mr-1" style={{ backgroundColor: '#EF4444' }} />Chiqim + Oylik</span>
                  </div>
                </div>
              )}

              {/* Recent Transactions */}
              <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    <FontAwesomeIcon icon={faExchangeAlt} className="mr-2 w-4 h-4" style={{ color: '#3B82F6' }} />
                    So'nggi tranzaksiyalar
                  </h3>
                  <button onClick={() => { setTab('transactions'); setPage(1); }} className="text-xs font-medium" style={{ color: '#F97316' }}>Barchasi</button>
                </div>
                <div className="space-y-2">
                  {(dashboard?.recent_transactions || []).slice(0, 8).map((tx, i) => {
                    const cfg = txTypeConfig[tx.transaction_type] || txTypeConfig.income;
                    return (
                      <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0 transition-colors" style={{ borderColor: 'var(--border-color)' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: cfg.bg }}>
                          <FontAwesomeIcon icon={cfg.icon} className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{tx.description || cfg.label}</div>
                          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{tx.transaction_date}</div>
                        </div>
                        <span className="text-xs font-bold flex-shrink-0" style={{ color: cfg.color }}>
                          {tx.transaction_type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                        </span>
                      </div>
                    );
                  })}
                  {(!dashboard?.recent_transactions || dashboard.recent_transactions.length === 0) && (
                    <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Tranzaksiyalar yo'q</div>
                  )}
                </div>
              </div>
            </div>

            {/* Debtors */}
            {debtors.length > 0 && (
              <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 w-4 h-4" style={{ color: '#EF4444' }} />
                    Qarzdor o'quvchilar ({debtors.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                        <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>O'quvchi</th>
                        <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Telefon</th>
                        <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Guruh</th>
                        <th className="text-right px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Qarz miqdori</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debtors.slice(0, 10).map((d, i) => (
                        <tr key={i} className="border-b last:border-0 transition-colors" style={{ borderColor: 'var(--border-color)' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                            {d.student_name || d.full_name || `${d.first_name || ''} ${d.last_name || ''}`.trim()}
                          </td>
                          <td className="px-3 py-2.5" style={{ color: 'var(--text-secondary)' }}>{d.phone || d.student_phone || '-'}</td>
                          <td className="px-3 py-2.5" style={{ color: 'var(--text-secondary)' }}>{d.group_name || d.groups?.[0]?.name || '-'}</td>
                          <td className="px-3 py-2.5 text-right font-bold" style={{ color: '#EF4444' }}>{formatMoney(Math.abs(d.balance || d.debt || d.amount || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payment method breakdown */}
            {paymentStats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(paymentStats?.by_method || paymentStats?.payment_methods || {}).map(([method, data]) => {
                  const amount = typeof data === 'object' ? (data.total || data.amount || 0) : data;
                  const count = typeof data === 'object' ? (data.count || 0) : null;
                  return (
                    <div key={method} className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(249,115,22,0.1)' }}>
                        <FontAwesomeIcon icon={payMethodIcons[method] || faCoins} className="w-4 h-4" style={{ color: '#F97316' }} />
                      </div>
                      <div>
                        <div className="text-xs capitalize font-medium" style={{ color: 'var(--text-secondary)' }}>{method}</div>
                        <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatMoney(amount)}</div>
                        {count !== null && <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{count} ta to'lov</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      )}

      {/* ============================================ */}
      {/* EXPENSES TAB */}
      {/* ============================================ */}
      {tab === 'expenses' && (
        <div className="space-y-4">
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Chiqim qidirish..."
                className="w-full h-11 pl-11 pr-4 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              {[{ v: 'all', l: 'Barchasi' }, { v: 'pending', l: 'Kutilmoqda' }, { v: 'approved', l: 'Tasdiqlangan' }, { v: 'paid', l: "To'langan" }].map(f => (
                <button key={f.v} onClick={() => { setExpenseFilter(f.v); setPage(1); }}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: expenseFilter === f.v ? 'var(--bg-secondary)' : 'transparent',
                    color: expenseFilter === f.v ? '#F97316' : 'var(--text-secondary)',
                    boxShadow: expenseFilter === f.v ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}>{f.l}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            {loading ? (
              <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin" /></div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <FontAwesomeIcon icon={faArrowDown} className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Chiqimlar topilmadi</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Yangi chiqim qo'shing</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                      {['Nomi', 'Kategoriya', 'Summa', 'Sana', 'Holat', ''].map((h, i) => (
                        <th key={i} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(exp => (
                      <tr key={exp.id} className="border-b last:border-0 transition-colors" style={{ borderColor: 'var(--border-color)' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{exp.title}</div>
                          {exp.description && <div className="text-[11px] truncate max-w-[200px]" style={{ color: 'var(--text-muted)' }}>{exp.description}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-md" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                            {exp.category_name || categories.find(c => c.id === exp.category)?.name || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold" style={{ color: '#EF4444' }}>-{formatMoney(exp.amount)}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{exp.expense_date}</td>
                        <td className="px-4 py-3"><Badge status={exp.status} config={expenseStatusConfig} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setForm({ category: exp.category, title: exp.title, description: exp.description || '', amount: exp.amount, expense_date: exp.expense_date, status: exp.status }); setEditId(exp.id); setShowForm(true); }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                              <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" style={{ color: '#F97316' }} />
                            </button>
                            <button onClick={() => handleDeleteExpense(exp.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                              <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* TRANSACTIONS TAB */}
      {/* ============================================ */}
      {tab === 'transactions' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex flex-wrap gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            {[{ v: 'all', l: 'Barchasi' }, { v: 'income', l: 'Kirim', c: '#22C55E' }, { v: 'expense', l: 'Chiqim', c: '#EF4444' }, { v: 'salary', l: 'Oylik', c: '#F97316' }, { v: 'refund', l: 'Qaytarish', c: '#8B5CF6' }].map(f => (
              <button key={f.v} onClick={() => { setTxFilter(f.v); setPage(1); }}
                className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: txFilter === f.v ? 'var(--bg-secondary)' : 'transparent',
                  color: txFilter === f.v ? (f.c || '#F97316') : 'var(--text-secondary)',
                  boxShadow: txFilter === f.v ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}>{f.l}</button>
            ))}
          </div>

          {/* List */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            {loading ? (
              <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin" /></div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <FontAwesomeIcon icon={faExchangeAlt} className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Tranzaksiyalar topilmadi</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {transactions.map(tx => {
                  const cfg = txTypeConfig[tx.transaction_type] || txTypeConfig.income;
                  return (
                    <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                      style={{ borderColor: 'var(--border-color)' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: cfg.bg }}>
                        <FontAwesomeIcon icon={cfg.icon} className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{tx.description || cfg.label}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{tx.transaction_date}</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color: cfg.color, backgroundColor: cfg.bg }}>{cfg.label}</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold flex-shrink-0" style={{ color: cfg.color }}>
                        {tx.transaction_type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* SALARIES TAB */}
      {/* ============================================ */}
      {tab === 'salaries' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex flex-wrap gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            {[{ v: 'all', l: 'Barchasi' }, { v: 'calculated', l: 'Hisoblangan' }, { v: 'approved', l: 'Tasdiqlangan' }, { v: 'paid', l: "To'langan" }].map(f => (
              <button key={f.v} onClick={() => { setSalaryFilter(f.v); setPage(1); }}
                className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: salaryFilter === f.v ? 'var(--bg-secondary)' : 'transparent',
                  color: salaryFilter === f.v ? '#F97316' : 'var(--text-secondary)',
                  boxShadow: salaryFilter === f.v ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}>{f.l}</button>
            ))}
          </div>

          {/* Salary cards */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            {loading ? (
              <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin" /></div>
            ) : salaries.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <FontAwesomeIcon icon={faUserTie} className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Oyliklar topilmadi</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                      {['O\'qituvchi', 'Davr', 'Asosiy oylik', 'Bonus', 'Chegirma', 'Jami', 'Darslar', 'Holat'].map((h, i) => (
                        <th key={i} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {salaries.map(s => (
                      <tr key={s.id} className="border-b last:border-0 transition-colors" style={{ borderColor: 'var(--border-color)' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(249,115,22,0.1)' }}>
                              <FontAwesomeIcon icon={faUserTie} className="w-3.5 h-3.5" style={{ color: '#F97316' }} />
                            </div>
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.teacher_name || s.teacher}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {monthNames[(s.period_month || 1) - 1]} {s.period_year}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>{formatMoney(s.base_salary)}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: Number(s.bonus || 0) > 0 ? '#22C55E' : 'var(--text-muted)' }}>
                          {Number(s.bonus || 0) > 0 ? '+' : ''}{formatMoney(s.bonus)}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: Number(s.deduction || 0) > 0 ? '#EF4444' : 'var(--text-muted)' }}>
                          {Number(s.deduction || 0) > 0 ? '-' : ''}{formatMoney(s.deduction)}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatMoney(s.total)}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{s.total_lessons || '-'}</td>
                        <td className="px-4 py-3"><Badge status={s.status} config={salaryStatusConfig} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* PAGINATION */}
      {/* ============================================ */}
      {tab !== 'dashboard' && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => setPage(1)} disabled={page === 1} className="w-9 h-9 rounded-lg text-xs font-medium disabled:opacity-30 transition-colors" style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            «
          </button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-9 h-9 rounded-lg disabled:opacity-30 transition-colors" style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
            const p = start + i;
            if (p > totalPages) return null;
            return (
              <button key={p} onClick={() => setPage(p)}
                className="w-9 h-9 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: page === p ? '#F97316' : 'transparent',
                  color: page === p ? 'white' : 'var(--text-secondary)'
                }}>{p}</button>
            );
          })}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-9 h-9 rounded-lg disabled:opacity-30 transition-colors" style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
          </button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="w-9 h-9 rounded-lg text-xs font-medium disabled:opacity-30 transition-colors" style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            »
          </button>
        </div>
      )}

      {/* ============================================ */}
      {/* EXPENSE FORM MODAL */}
      {/* ============================================ */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditId(null); }} title={editId ? "Chiqimni tahrirlash" : "Yangi chiqim qo'shish"}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nomi <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Masalan: Elektr energiya, Ijara..."
              className="w-full h-11 px-4 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Kategoriya <span className="text-red-500">*</span></label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full h-11 px-4 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}>
              <option value="">Tanlang</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Summa <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0"
                  className="w-full h-11 px-4 pr-14 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>so'm</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Sana</label>
              <input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Izoh</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Qo'shimcha ma'lumot..."
              className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowForm(false); setEditId(null); }}
              className="flex-1 h-11 rounded-xl border font-medium text-sm transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              Bekor qilish
            </button>
            <button onClick={handleSaveExpense}
              className="flex-1 h-11 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
              {editId ? 'Saqlash' : "Qo'shish"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
