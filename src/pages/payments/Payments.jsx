import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faSearch, faEdit, faTrash, faTimes, faMoneyBill, faFileInvoice,
  faPercent, faChevronLeft, faChevronRight, faEye, faUndo, faWallet,
  faArrowUp, faArrowDown, faCheckCircle, faClock, faExclamationTriangle,
  faUser, faUsers, faCalendarAlt, faReceipt, faFilter, faChartLine,
  faMoneyBillWave, faCreditCard, faMobileAlt, faExchangeAlt, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { paymentsService, invoicesService, discountsService } from '@/services/payments';
import api from '@/services/api';

const monthNames = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

const paymentStatusConfig = {
  pending: { label: 'Kutilmoqda', color: '#EAB308', bg: 'rgba(234,179,8,0.12)', icon: faClock },
  completed: { label: 'To\'langan', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', icon: faCheckCircle },
  cancelled: { label: 'Bekor qilingan', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: faTimes },
  refunded: { label: 'Qaytarilgan', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', icon: faUndo },
};

const invoiceStatusConfig = {
  draft: { label: 'Qoralama', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  sent: { label: 'Yuborilgan', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  paid: { label: 'To\'langan', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  partial: { label: 'Qisman', color: '#EAB308', bg: 'rgba(234,179,8,0.12)' },
  overdue: { label: 'Muddati o\'tgan', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  cancelled: { label: 'Bekor', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
};

const methodConfig = {
  cash: { label: 'Naqd', icon: faMoneyBillWave, color: '#22C55E' },
  card: { label: 'Karta', icon: faCreditCard, color: '#3B82F6' },
  transfer: { label: "O'tkazma", icon: faExchangeAlt, color: '#8B5CF6' },
  payme: { label: 'Payme', icon: faMobileAlt, color: '#00CCCC' },
  click: { label: 'Click', icon: faMobileAlt, color: '#F97316' },
};

function StatusBadge({ status, config }) {
  const s = config[status] || { label: status, color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{ color: s.color, backgroundColor: s.bg }}>
      {s.icon && <FontAwesomeIcon icon={s.icon} className="w-3 h-3" />}
      {s.label}
    </span>
  );
}

function Modal({ isOpen, onClose, title, children, wide }) {
  if (!isOpen) return null;
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl`} style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <FontAwesomeIcon icon={faTimes} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </>
  );
}

function PaymentDetailModal({ isOpen, onClose, payment, groupPrice }) {
  if (!isOpen || !payment) return null;
  const price = groupPrice || 0;
  const paid = Number(payment.amount || 0);
  const remaining = Math.max(0, price - paid);
  const paidPercent = price > 0 ? Math.min(100, Math.round((paid / price) * 100)) : 100;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="To'lov tafsilotlari">
      <div className="space-y-5">
        {/* Student & Group */}
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--primary-600)', color: 'white' }}>
            {(payment.student_name || 'S')[0]}
          </div>
          <div className="flex-1">
            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{payment.student_name || payment.student}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{payment.group_name || payment.group}</div>
          </div>
          <StatusBadge status={payment.status} config={paymentStatusConfig} />
        </div>

        {/* Payment Period */}
        <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
          <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>To'lov davri</div>
          <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {monthNames[(payment.period_month || 1) - 1]} {payment.period_year}
          </div>
        </div>

        {/* Amount Breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(59,130,246,0.08)' }}>
            <div className="text-xs mb-1" style={{ color: '#3B82F6' }}>Kurs narxi</div>
            <div className="text-sm font-bold" style={{ color: '#3B82F6' }}>{formatMoney(price)}</div>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(34,197,94,0.08)' }}>
            <div className="text-xs mb-1" style={{ color: '#22C55E' }}>To'langan</div>
            <div className="text-sm font-bold" style={{ color: '#22C55E' }}>{formatMoney(paid)}</div>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ backgroundColor: remaining > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)' }}>
            <div className="text-xs mb-1" style={{ color: remaining > 0 ? '#EF4444' : '#22C55E' }}>Qoldiq</div>
            <div className="text-sm font-bold" style={{ color: remaining > 0 ? '#EF4444' : '#22C55E' }}>{formatMoney(remaining)}</div>
          </div>
        </div>

        {/* Progress Bar */}
        {price > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>To'lov jarayoni</span>
              <span className="text-xs font-bold" style={{ color: paidPercent >= 100 ? '#22C55E' : '#EAB308' }}>{paidPercent}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{
                width: `${paidPercent}%`,
                background: paidPercent >= 100
                  ? 'linear-gradient(90deg, #22C55E, #16A34A)'
                  : paidPercent >= 50
                    ? 'linear-gradient(90deg, #EAB308, #F59E0B)'
                    : 'linear-gradient(90deg, #EF4444, #F97316)'
              }} />
            </div>
          </div>
        )}

        {/* Payment Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>To'lov usuli</div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={methodConfig[payment.payment_method]?.icon || faMoneyBill} style={{ color: methodConfig[payment.payment_method]?.color || 'var(--text-secondary)' }} className="w-4 h-4" />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{methodConfig[payment.payment_method]?.label || payment.payment_method}</span>
            </div>
          </div>
          <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Sana</div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{payment.created_at ? new Date(payment.created_at).toLocaleDateString('uz') : '—'}</div>
          </div>
        </div>

        {payment.note && (
          <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Izoh</div>
            <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{payment.note}</div>
          </div>
        )}
      </div>
    </Modal>
  );
}

const formatMoney = (v) => Number(v || 0).toLocaleString('uz-UZ') + " so'm";

const emptyPayment = { student: '', group: '', amount: '', payment_method: 'cash', payment_type: 'tuition', period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), note: '', status: 'completed' };
const emptyDiscount = { student: '', group: '', name: '', discount_type: 'percent', value: '', start_date: '', end_date: '', reason: '' };

export default function Payments() {
  const { t } = useTranslation();

  const [tab, setTab] = useState('payments');
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
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
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterMethod) params.payment_method = filterMethod;

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
    } catch { toast.error('Ma\'lumotlarni yuklashda xato'); }
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
  useEffect(() => { fetchData(); }, [tab, search, filterStatus, filterMethod, page]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const completed = payments.filter(p => p.status === 'completed');
    const pending = payments.filter(p => p.status === 'pending');
    const totalCollected = completed.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalPending = pending.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const thisMonth = completed.filter(p => p.period_month === new Date().getMonth() + 1 && p.period_year === new Date().getFullYear());
    const thisMonthTotal = thisMonth.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return { totalCollected, totalPending, thisMonthTotal, totalPayments: payments.length, pendingCount: pending.length };
  }, [payments]);

  const handleSavePayment = async () => {
    if (!form.student) { toast.error("O'quvchini tanlang"); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error("Summani kiriting"); return; }
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (editId) {
        await paymentsService.update(editId, payload);
        toast.success("To'lov yangilandi");
      } else {
        await paymentsService.create(payload);
        toast.success("To'lov qo'shildi");
      }
      setShowForm(false); setEditId(null); setForm(emptyPayment); fetchData();
    } catch (e) { toast.error(e.response?.data?.error?.message || 'Xato yuz berdi'); }
  };

  const handleDeletePayment = async (id) => {
    if (!confirm("Bu to'lovni o'chirmoqchimisiz?")) return;
    try { await paymentsService.delete(id); toast.success("To'lov o'chirildi"); fetchData(); }
    catch { toast.error('Xato'); }
  };

  const handleRefund = async (id) => {
    if (!confirm("To'lovni qaytarmoqchimisiz?")) return;
    try { await paymentsService.update(id, { status: 'refunded' }); toast.success("To'lov qaytarildi"); fetchData(); }
    catch { toast.error('Xato'); }
  };

  const handleSaveDiscount = async () => {
    try {
      const payload = { ...discountForm, value: parseFloat(discountForm.value) };
      if (discountEditId) { await discountsService.update(discountEditId, payload); toast.success("Chegirma yangilandi"); }
      else { await discountsService.create(payload); toast.success("Chegirma qo'shildi"); }
      setShowDiscount(false); setDiscountEditId(null); setDiscountForm(emptyDiscount); fetchData();
    } catch (e) { toast.error(e.response?.data?.error?.message || 'Xato'); }
  };

  const handleDeleteDiscount = async (id) => {
    if (!confirm("O'chirmoqchimisiz?")) return;
    try { await discountsService.delete(id); toast.success("O'chirildi"); fetchData(); }
    catch { toast.error('Xato'); }
  };

  // Auto-fill group price when group is selected
  const handleGroupChange = (groupId) => {
    setForm(prev => ({ ...prev, group: groupId }));
    const group = groups.find(g => String(g.id) === String(groupId));
    if (group && group.price && !form.amount) {
      setForm(prev => ({ ...prev, amount: String(group.price) }));
    }
  };

  const getGroupPrice = (groupId) => {
    const group = groups.find(g => String(g.id) === String(groupId));
    return group?.price || 0;
  };

  const tabs = [
    { key: 'payments', label: "To'lovlar", icon: faMoneyBill, count: payments.length },
    { key: 'invoices', label: 'Hisob-fakturalar', icon: faFileInvoice },
    { key: 'discounts', label: 'Chegirmalar', icon: faPercent, count: discounts.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Moliya boshqaruvi</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>To'lovlar, hisob-fakturalar va chegirmalarni boshqaring</p>
        </div>
        <div className="flex gap-2">
          {tab === 'payments' && (
            <button onClick={() => { setForm(emptyPayment); setEditId(null); setShowForm(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
              <FontAwesomeIcon icon={faPlus} /> To'lov qabul qilish
            </button>
          )}
          {tab === 'discounts' && (
            <button onClick={() => { setDiscountForm(emptyDiscount); setDiscountEditId(null); setShowDiscount(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium shadow-lg shadow-orange-500/25 transition-all"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
              <FontAwesomeIcon icon={faPlus} /> Chegirma qo'shish
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {tab === 'payments' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Jami yig\'ilgan', value: formatMoney(summaryStats.totalCollected), icon: faWallet, color: '#22C55E', gradient: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.02))' },
            { label: 'Kutilayotgan', value: formatMoney(summaryStats.totalPending), icon: faClock, color: '#EAB308', gradient: 'linear-gradient(135deg, rgba(234,179,8,0.1), rgba(234,179,8,0.02))' },
            { label: 'Bu oy', value: formatMoney(summaryStats.thisMonthTotal), icon: faCalendarAlt, color: '#3B82F6', gradient: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.02))' },
            { label: 'Jami to\'lovlar', value: summaryStats.totalPayments, icon: faReceipt, color: '#8B5CF6', gradient: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.02))' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-5 border" style={{ borderColor: 'var(--border-color)', background: s.gradient }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + '18' }}>
                  <FontAwesomeIcon icon={s.icon} className="w-4 h-4" style={{ color: s.color }} />
                </div>
                {s.label === 'Kutilayotgan' && summaryStats.pendingCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#EAB30818', color: '#EAB308' }}>{summaryStats.pendingCount} ta</span>
                )}
              </div>
              <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1.5 rounded-2xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => { setTab(tb.key); setPage(1); setFilterStatus(''); setFilterMethod(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${tab === tb.key ? 'shadow-sm' : ''}`}
            style={{ backgroundColor: tab === tb.key ? 'var(--bg-secondary)' : 'transparent', color: tab === tb.key ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            <FontAwesomeIcon icon={tb.icon} className="w-4 h-4" /> {tb.label}
            {tb.count > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>{tb.count}</span>}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="O'quvchi yoki guruh bo'yicha qidirish..."
            className="w-full h-11 pl-11 pr-4 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
        </div>
        {tab === 'payments' && (
          <>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="h-11 px-4 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">Barcha holatlar</option>
              {Object.entries(paymentStatusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filterMethod} onChange={e => { setFilterMethod(e.target.value); setPage(1); }}
              className="h-11 px-4 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">Barcha usullar</option>
              {Object.entries(methodConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </>
        )}
      </div>

      {/* Content */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</span>
          </div>
        ) : tab === 'payments' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  {["O'quvchi", 'Guruh', 'Davr', 'Summa', "To'lov usuli", 'Holat', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, idx) => {
                  const groupPrice = getGroupPrice(p.group);
                  const paid = Number(p.amount || 0);
                  const remaining = Math.max(0, groupPrice - paid);
                  const paidPercent = groupPrice > 0 ? Math.min(100, Math.round((paid / groupPrice) * 100)) : 100;

                  return (
                    <tr key={p.id} className="border-b hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                      style={{ borderColor: 'var(--border-color)' }}
                      onClick={() => { setSelectedPayment(p); setShowDetail(true); }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--primary-600)', color: 'white' }}>
                            {(p.student_name || 'S')[0]}
                          </div>
                          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.student_name || p.student}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{p.group_name || p.group || '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faCalendarAlt} className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {monthNames[(p.period_month || 1) - 1]} {p.period_year}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatMoney(paid)}</div>
                          {groupPrice > 0 && remaining > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)', maxWidth: '80px' }}>
                                <div className="h-full rounded-full" style={{
                                  width: `${paidPercent}%`,
                                  backgroundColor: paidPercent >= 100 ? '#22C55E' : paidPercent >= 50 ? '#EAB308' : '#EF4444'
                                }} />
                              </div>
                              <span className="text-[10px] font-medium" style={{ color: '#EF4444' }}>-{formatMoney(remaining)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={methodConfig[p.payment_method]?.icon || faMoneyBill} className="w-4 h-4" style={{ color: methodConfig[p.payment_method]?.color || 'var(--text-muted)' }} />
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{methodConfig[p.payment_method]?.label || p.payment_method}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={p.status} config={paymentStatusConfig} />
                      </td>
                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setSelectedPayment(p); setShowDetail(true); }} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="Ko'rish">
                            <FontAwesomeIcon icon={faEye} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                          </button>
                          <button onClick={() => {
                            setForm({ student: p.student, group: p.group, amount: p.amount, payment_method: p.payment_method, payment_type: p.payment_type, period_month: p.period_month, period_year: p.period_year, note: p.note || '', status: p.status });
                            setEditId(p.id); setShowForm(true);
                          }} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="Tahrirlash">
                            <FontAwesomeIcon icon={faEdit} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                          </button>
                          {p.status === 'completed' && (
                            <button onClick={() => handleRefund(p.id)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="Qaytarish">
                              <FontAwesomeIcon icon={faUndo} className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                            </button>
                          )}
                          <button onClick={() => handleDeletePayment(p.id)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="O'chirish">
                            <FontAwesomeIcon icon={faTrash} className="w-4 h-4" style={{ color: '#EF4444' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {payments.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-16">
                    <FontAwesomeIcon icon={faMoneyBill} className="w-12 h-12 mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                    <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>To'lovlar topilmadi</div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : tab === 'invoices' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  {['Raqam', "O'quvchi", 'Summa', 'Muddat', 'Holat', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-b hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-5 py-4 text-sm font-bold" style={{ color: 'var(--primary-600)' }}>#{inv.invoice_number}</td>
                    <td className="px-5 py-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{inv.student_name || inv.student}</td>
                    <td className="px-5 py-4 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatMoney(inv.total)}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{inv.due_date}</td>
                    <td className="px-5 py-4"><StatusBadge status={inv.status} config={invoiceStatusConfig} /></td>
                    <td className="px-5 py-4">
                      <button className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faEye} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} /></button>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-16">
                    <FontAwesomeIcon icon={faFileInvoice} className="w-12 h-12 mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                    <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Hisob-fakturalar topilmadi</div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  {['Nomi', "O'quvchi", 'Holat', 'Qiymati', 'Muddat', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {discounts.map(d => (
                  <tr key={d.id} className="border-b hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-5 py-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{d.name}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{d.student_name || d.student}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ color: d.is_active ? '#22C55E' : '#94A3B8', backgroundColor: d.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.12)' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.is_active ? '#22C55E' : '#94A3B8' }} />
                        {d.is_active ? 'Faol' : 'Nofaol'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold" style={{ color: '#F97316' }}>{d.discount_type === 'percent' ? d.value + '%' : formatMoney(d.value)}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{d.start_date} — {d.end_date || '∞'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setDiscountForm({ student: d.student, group: d.group || '', name: d.name, discount_type: d.discount_type, value: d.value, start_date: d.start_date, end_date: d.end_date || '', reason: d.reason || '' }); setDiscountEditId(d.id); setShowDiscount(true); }} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                          <FontAwesomeIcon icon={faEdit} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <button onClick={() => handleDeleteDiscount(d.id)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" style={{ color: '#EF4444' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {discounts.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-16">
                    <FontAwesomeIcon icon={faPercent} className="w-12 h-12 mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                    <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Chegirmalar topilmadi</div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="w-10 h-10 rounded-xl border flex items-center justify-center disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ borderColor: 'var(--border-color)' }}>
            <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;
              return (
                <button key={pageNum} onClick={() => setPage(pageNum)}
                  className="w-10 h-10 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: page === pageNum ? 'var(--primary-600)' : 'transparent',
                    color: page === pageNum ? 'white' : 'var(--text-secondary)'
                  }}>
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="w-10 h-10 rounded-xl border flex items-center justify-center disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ borderColor: 'var(--border-color)' }}>
            <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      )}

      {/* Payment Form Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditId(null); }} title={editId ? "To'lovni tahrirlash" : "To'lov qabul qilish"}>
        <div className="space-y-5">
          {/* Student Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>O'quvchi *</label>
            <select value={form.student} onChange={e => setForm({ ...form, student: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">O'quvchini tanlang...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>

          {/* Group Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Guruh</label>
            <select value={form.group} onChange={e => handleGroupChange(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">Guruhni tanlang...</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name} {g.price ? `(${formatMoney(g.price)})` : ''}</option>)}
            </select>
          </div>

          {/* Amount & Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Summa *</label>
              <div className="relative">
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full h-12 pl-4 pr-14 rounded-xl border bg-transparent text-sm font-bold" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} placeholder="0" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>so'm</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>To'lov usuli</label>
              <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                {Object.entries(methodConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Qaysi oy uchun</label>
            <div className="grid grid-cols-2 gap-3">
              <select value={form.period_month} onChange={e => setForm({ ...form, period_month: Number(e.target.value) })}
                className="h-12 px-4 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <input type="number" value={form.period_year} onChange={e => setForm({ ...form, period_year: Number(e.target.value) })}
                className="h-12 px-4 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Holat</label>
            <div className="flex gap-2">
              {Object.entries(paymentStatusConfig).map(([k, v]) => (
                <button key={k} onClick={() => setForm({ ...form, status: k })}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all border"
                  style={{
                    borderColor: form.status === k ? v.color : 'var(--border-color)',
                    backgroundColor: form.status === k ? v.bg : 'transparent',
                    color: form.status === k ? v.color : 'var(--text-secondary)'
                  }}>
                  <FontAwesomeIcon icon={v.icon} className="w-3 h-3" />
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Izoh</label>
            <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2}
              className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="Qo'shimcha izoh..." />
          </div>

          {/* Group price info */}
          {form.group && getGroupPrice(form.group) > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: 'rgba(59,130,246,0.08)' }}>
              <FontAwesomeIcon icon={faInfoCircle} className="w-4 h-4" style={{ color: '#3B82F6' }} />
              <span className="text-xs" style={{ color: '#3B82F6' }}>Guruh narxi: {formatMoney(getGroupPrice(form.group))}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowForm(false); setEditId(null); }}
              className="flex-1 h-12 rounded-xl border font-semibold text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Bekor qilish</button>
            <button onClick={handleSavePayment}
              className="flex-1 h-12 rounded-xl text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
              {editId ? 'Saqlash' : "To'lovni qabul qilish"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Discount Form Modal */}
      <Modal isOpen={showDiscount} onClose={() => { setShowDiscount(false); setDiscountEditId(null); }} title={discountEditId ? 'Chegirmani tahrirlash' : "Chegirma qo'shish"}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Nomi *</label>
            <input value={discountForm.name} onChange={e => setDiscountForm({ ...discountForm, name: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} placeholder="Chegirma nomi" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>O'quvchi *</label>
            <select value={discountForm.student} onChange={e => setDiscountForm({ ...discountForm, student: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">O'quvchini tanlang...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Turi</label>
              <select value={discountForm.discount_type} onChange={e => setDiscountForm({ ...discountForm, discount_type: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                <option value="percent">Foizda (%)</option>
                <option value="fixed">Qat'iy summa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Qiymati *</label>
              <input type="number" value={discountForm.value} onChange={e => setDiscountForm({ ...discountForm, value: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder={discountForm.discount_type === 'percent' ? '10' : '50000'} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Boshlanish</label>
              <input type="date" value={discountForm.start_date} onChange={e => setDiscountForm({ ...discountForm, start_date: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Tugash</label>
              <input type="date" value={discountForm.end_date} onChange={e => setDiscountForm({ ...discountForm, end_date: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Sabab</label>
            <textarea value={discountForm.reason} onChange={e => setDiscountForm({ ...discountForm, reason: e.target.value })} rows={2}
              className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="Chegirma sababi..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowDiscount(false); setDiscountEditId(null); }}
              className="flex-1 h-12 rounded-xl border font-semibold text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Bekor qilish</button>
            <button onClick={handleSaveDiscount}
              className="flex-1 h-12 rounded-xl text-white font-semibold text-sm" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>Saqlash</button>
          </div>
        </div>
      </Modal>

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        isOpen={showDetail}
        onClose={() => { setShowDetail(false); setSelectedPayment(null); }}
        payment={selectedPayment}
        groupPrice={selectedPayment ? getGroupPrice(selectedPayment.group) : 0}
      />
    </div>
  );
}
