import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faUser, faPhone, faWallet, faMoneyBillWave, faExclamationTriangle,
  faCalendarAlt, faCheckCircle, faClock, faTimes, faUndo, faPercent, faPlus,
  faFileInvoice, faReceipt, faChartLine, faBookOpen, faUsers, faGraduationCap,
  faCreditCard, faMobileAlt, faExchangeAlt, faMoneyBill, faInfoCircle, faPrint,
  faCheck, faCalendarCheck, faCalendarXmark, faHourglassHalf, faGift,
} from '@fortawesome/free-solid-svg-icons';
import { studentsService } from '@/services/students';
import { paymentsService, invoicesService, discountsService } from '@/services/payments';
import { billingInvoicesService } from '@/services/billing';
import { attendanceService } from '@/services/attendance';
import { useAuthStore } from '@/stores/authStore';

// ============================================
// CONFIG
// ============================================
const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const monthShort = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

const methodConfig = {
  cash: { label: 'Naqd', icon: faMoneyBillWave, color: '#22C55E' },
  card: { label: 'Karta', icon: faCreditCard, color: '#3B82F6' },
  transfer: { label: "O'tkazma", icon: faExchangeAlt, color: '#8B5CF6' },
  payme: { label: 'Payme', icon: faMobileAlt, color: '#00CCCC' },
  click: { label: 'Click', icon: faMobileAlt, color: '#F97316' },
};

const paymentStatusConfig = {
  pending: { label: 'Kutilmoqda', color: '#EAB308', bg: 'rgba(234,179,8,0.12)', icon: faClock },
  completed: { label: "To'langan", color: '#22C55E', bg: 'rgba(34,197,94,0.12)', icon: faCheckCircle },
  cancelled: { label: 'Bekor', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: faTimes },
  refunded: { label: 'Qaytarilgan', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', icon: faUndo },
};

const invoiceStatusConfig = {
  draft: { label: 'Qoralama', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  sent: { label: 'Yuborilgan', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  paid: { label: "To'langan", color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  partial: { label: 'Qisman', color: '#EAB308', bg: 'rgba(234,179,8,0.12)' },
  overdue: { label: "Muddati o'tgan", color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  cancelled: { label: 'Bekor', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
};

const formatMoney = (v) => Number(v || 0).toLocaleString('uz-UZ') + " so'm";
const formatDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '—';
const daysBetween = (a, b) => Math.ceil((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));

// ============================================
// SUB-COMPONENTS
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
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </>
  );
}

function StatCard({ label, value, subValue, icon, color, danger }) {
  return (
    <div className="rounded-2xl p-5 border transition-all" style={{
      borderColor: danger ? '#EF444460' : 'var(--border-color)',
      backgroundColor: 'var(--bg-secondary)',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color + '80'}
      onMouseLeave={e => e.currentTarget.style.borderColor = danger ? '#EF444460' : 'var(--border-color)'}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '18' }}>
          <FontAwesomeIcon icon={icon} className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <div className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      {subValue && <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{subValue}</div>}
    </div>
  );
}

function SectionCard({ title, icon, iconColor, actions, children }) {
  return (
    <div className="rounded-2xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          {icon && <FontAwesomeIcon icon={icon} className="w-4 h-4" style={{ color: iconColor || '#F97316' }} />}
          {title}
        </h3>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function StudentFinanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canManage = ['owner', 'admin', 'accountant'].includes(user?.role);

  const [student, setStudent] = useState(null);
  const [studentGroups, setStudentGroups] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [billingInvoices, setBillingInvoices] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  // Payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({
    amount: '', payment_method: 'cash', payment_type: 'tuition',
    period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(),
    group: '', note: '', status: 'completed',
  });

  // Discount modal
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountForm, setDiscountForm] = useState({
    name: '', discount_type: 'percent', value: '',
    start_date: new Date().toISOString().split('T')[0], end_date: '', reason: '',
  });

  // ============================================
  // FETCH DATA
  // ============================================
  const [attendanceStatsFromBackend, setAttendanceStatsFromBackend] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [stRes, grpRes, payRes, invRes, discRes, attRes, billRes] = await Promise.all([
        studentsService.getById(id).catch(() => null),
        studentsService.getGroups(id).catch(() => null),
        paymentsService.getAll({ student: id, page_size: 200 }).catch(() => null),
        invoicesService.getAll({ student: id, page_size: 100 }).catch(() => null),
        discountsService.getAll({ student: id, page_size: 100 }).catch(() => null),
        attendanceService.byStudent({ student_id: id }).catch(() => null),
        billingInvoicesService.getAll({ student: id, page_size: 100 }).catch(() => null),
      ]);

      // Student: retrieve returns raw serialized object (no wrapping)
      const st = stRes?.data || null;
      setStudent(st);

      // Groups custom action: {success: true, data: [...]}
      const grps = grpRes?.data?.data || [];
      setStudentGroups(Array.isArray(grps) ? grps : []);

      // Payments paginated: {success: true, data: [...], meta: {...}}
      const pays = payRes?.data?.data || [];
      setPayments(Array.isArray(pays) ? pays : []);

      // Invoices paginated
      const invs = invRes?.data?.data || [];
      setInvoices(Array.isArray(invs) ? invs : []);

      // Discounts paginated
      const discs = discRes?.data?.data || [];
      setDiscounts(Array.isArray(discs) ? discs : []);

      // Attendance by_student: {data: {student, statistics, attendances: [...]}}
      const attData = attRes?.data?.data || {};
      setAttendance(Array.isArray(attData.attendances) ? attData.attendances : []);
      setAttendanceStatsFromBackend(attData.statistics || null);

      // Billing invoices
      const bills = billRes?.data?.data || [];
      setBillingInvoices(Array.isArray(bills) ? bills : []);
    } catch (e) {
      toast.error("Ma'lumotlarni yuklashda xato");
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [id]);

  // ============================================
  // COMPUTED
  // ============================================
  const monthlyPrice = useMemo(() => {
    return studentGroups.reduce((sum, g) => sum + Number(g.monthly_price || g.price || 0), 0);
  }, [studentGroups]);

  const activeDiscounts = useMemo(() => {
    const today = new Date();
    return discounts.filter(d => {
      if (!d.is_active && d.is_active !== undefined) return false;
      if (d.start_date && new Date(d.start_date) > today) return false;
      if (d.end_date && new Date(d.end_date) < today) return false;
      return true;
    });
  }, [discounts]);

  const effectiveMonthlyPrice = useMemo(() => {
    let price = monthlyPrice;
    for (const d of activeDiscounts) {
      const val = Number(d.value || 0);
      if (d.discount_type === 'percent') price -= (price * val / 100);
      else price -= val;
    }
    return Math.max(0, price);
  }, [monthlyPrice, activeDiscounts]);

  const stats = useMemo(() => {
    const completed = payments.filter(p => p.status === 'completed');
    const refunded = payments.filter(p => p.status === 'refunded');
    const pending = payments.filter(p => p.status === 'pending');

    const totalPaid = completed.reduce((s, p) => s + Number(p.amount || 0), 0);
    const totalRefunded = refunded.reduce((s, p) => s + Number(p.amount || 0), 0);
    const totalPending = pending.reduce((s, p) => s + Number(p.amount || 0), 0);

    // debt calculation: prefer backend student.balance (negative = debt) if available
    // fallback: count months from joined_date to current month and compare to paid
    let totalExpected = 0;
    let firstEnroll = null;
    for (const g of studentGroups) {
      const start = g.joined_date || g.enrolled_at || g.start_date;
      if (start && (!firstEnroll || new Date(start) < new Date(firstEnroll))) firstEnroll = start;
    }
    if (firstEnroll && effectiveMonthlyPrice > 0) {
      const start = new Date(firstEnroll);
      const now = new Date();
      const months = Math.max(1, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1);
      totalExpected = months * effectiveMonthlyPrice;
    }

    // Prefer backend balance field if present (negative = debt)
    let balance, debt;
    if (student && student.balance !== undefined && student.balance !== null) {
      balance = Number(student.balance);
      debt = balance < 0 ? Math.abs(balance) : 0;
    } else {
      balance = totalPaid - totalExpected;
      debt = Math.max(0, -balance);
    }

    return { totalPaid, totalRefunded, totalPending, totalExpected, balance, debt, paymentsCount: payments.length };
  }, [payments, studentGroups, monthlyPrice, effectiveMonthlyPrice, student]);

  // Next upcoming invoice & overdue
  const upcomingInvoices = useMemo(() => {
    const today = new Date();
    return invoices
      .filter(i => i.status !== 'paid' && i.status !== 'cancelled' && i.due_date)
      .map(i => ({ ...i, daysLeft: daysBetween(today, i.due_date) }))
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [invoices]);

  const nextInvoice = upcomingInvoices[0];
  const overdueInvoices = upcomingInvoices.filter(i => i.daysLeft < 0);

  // Monthly grid: for each month in year, how much was paid
  const monthlyGrid = useMemo(() => {
    const grid = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      paid: 0,
      payments: [],
      expected: effectiveMonthlyPrice,
      status: 'future',
    }));
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    for (const p of payments) {
      if (p.status !== 'completed') continue;
      if (Number(p.period_year) !== year) continue;
      const mIdx = (Number(p.period_month) || 1) - 1;
      if (mIdx < 0 || mIdx > 11) continue;
      grid[mIdx].paid += Number(p.amount || 0);
      grid[mIdx].payments.push(p);
    }

    for (let i = 0; i < 12; i++) {
      const m = grid[i];
      const isFuture = year > currentYear || (year === currentYear && i > currentMonth);
      if (isFuture) { m.status = 'future'; continue; }
      if (m.paid <= 0) m.status = 'unpaid';
      else if (m.paid >= m.expected) m.status = 'paid';
      else m.status = 'partial';
    }
    return grid;
  }, [payments, year, effectiveMonthlyPrice]);

  // Per-group monthly breakdown using billing invoices
  const groupMonthlyBreakdown = useMemo(() => {
    return studentGroups.map(group => {
      // Bu guruh uchun billingInvoices
      const groupInvoices = billingInvoices.filter(inv =>
        (inv.group === group.id || inv.group_id === group.id)
      );

      // Qo'shilgan sana
      const joinedDate = group.joined_date || group.enrolled_at || group.start_date;
      const startDate = joinedDate ? new Date(joinedDate) : new Date(year, 0, 1);
      const now = new Date();

      // Boshlanish oyidan hozirgi oygacha oylar ro'yxati
      const months = [];
      const startY = startDate.getFullYear();
      const startM = startDate.getMonth();
      const endY = now.getFullYear();
      const endM = now.getMonth();

      for (let y = startY; y <= endY; y++) {
        const mStart = y === startY ? startM : 0;
        const mEnd = y === endY ? endM : 11;
        for (let m = mStart; m <= mEnd; m++) {
          const invoice = groupInvoices.find(inv =>
            Number(inv.period_year) === y && Number(inv.period_month) === m + 1
          );
          // payments dan ham tekshiramiz
          const monthPayments = payments.filter(p =>
            p.status === 'completed' &&
            Number(p.period_year) === y &&
            Number(p.period_month) === m + 1 &&
            (p.group === group.id || p.group_id === group.id || (!p.group && studentGroups.length === 1))
          );
          const paidFromPayments = monthPayments.reduce((s, p) => s + Number(p.amount || 0), 0);

          const expected = Number(invoice?.total_amount || group.monthly_price || group.price || 0);
          const paid = Number(invoice?.paid_amount || 0) || paidFromPayments;
          const remaining = Math.max(0, expected - paid);

          let status;
          if (invoice) {
            status = invoice.status;
          } else if (paid >= expected && expected > 0) {
            status = 'paid';
          } else if (paid > 0) {
            status = 'partial';
          } else {
            status = 'unpaid';
          }

          months.push({
            year: y,
            month: m + 1,
            expected,
            paid,
            remaining,
            status,
            invoiceId: invoice?.id,
            hasInvoice: !!invoice,
          });
        }
      }

      const totalExpected = months.reduce((s, m) => s + m.expected, 0);
      const totalPaid = months.reduce((s, m) => s + m.paid, 0);
      const totalRemaining = months.reduce((s, m) => s + m.remaining, 0);

      return {
        group,
        months,
        totalExpected,
        totalPaid,
        totalRemaining,
        joinedDate,
      };
    });
  }, [studentGroups, billingInvoices, payments, year]);

  // Attendance stats — prefer backend stats if provided
  const attendanceStats = useMemo(() => {
    if (attendanceStatsFromBackend) {
      return {
        total: attendanceStatsFromBackend.total || 0,
        present: attendanceStatsFromBackend.present || 0,
        absent: attendanceStatsFromBackend.absent || 0,
        late: attendanceStatsFromBackend.late || 0,
        percent: Math.round(attendanceStatsFromBackend.rate || 0),
      };
    }
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const percent = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, absent, late, percent };
  }, [attendance, attendanceStatsFromBackend]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleAcceptPayment = async () => {
    if (!payForm.amount || Number(payForm.amount) <= 0) { toast.error("Summani kiriting"); return; }
    try {
      const payload = {
        student: id,
        amount: parseFloat(payForm.amount),
        payment_method: payForm.payment_method,
        payment_type: payForm.payment_type,
        period_month: payForm.period_month,
        period_year: payForm.period_year,
        note: payForm.note,
        status: payForm.status,
      };
      if (payForm.group) payload.group = payForm.group;
      await paymentsService.create(payload);
      toast.success("To'lov qabul qilindi");
      setShowPayModal(false);
      setPayForm({ ...payForm, amount: '', note: '' });
      loadAll();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || e.response?.data?.detail || 'Xato');
    }
  };

  const handleRefund = async (paymentId) => {
    if (!confirm("To'lovni qaytarmoqchimisiz?")) return;
    try {
      await paymentsService.update(paymentId, { status: 'refunded' });
      toast.success('Qaytarildi');
      loadAll();
    } catch { toast.error('Xato'); }
  };

  const handleAddDiscount = async () => {
    if (!discountForm.name || !discountForm.value) { toast.error("Maydonlarni to'ldiring"); return; }
    try {
      const payload = {
        student: id,
        name: discountForm.name,
        discount_type: discountForm.discount_type,
        value: parseFloat(discountForm.value),
        start_date: discountForm.start_date,
        end_date: discountForm.end_date || null,
        reason: discountForm.reason,
      };
      await discountsService.create(payload);
      toast.success("Chegirma qo'shildi");
      setShowDiscountModal(false);
      setDiscountForm({ name: '', discount_type: 'percent', value: '', start_date: new Date().toISOString().split('T')[0], end_date: '', reason: '' });
      loadAll();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Xato');
    }
  };

  const handleDeleteDiscount = async (discId) => {
    if (!confirm("O'chirmoqchimisiz?")) return;
    try { await discountsService.delete(discId); toast.success("O'chirildi"); loadAll(); }
    catch { toast.error('Xato'); }
  };

  const handlePrintReceipt = (payment) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head><title>Kvitansiya #${payment.id}</title>
      <style>
        body{font-family:Arial,sans-serif;max-width:400px;margin:20px auto;padding:20px}
        h2{text-align:center;margin:0 0 5px}
        .small{text-align:center;color:#666;font-size:12px;margin-bottom:20px}
        .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #ccc}
        .total{font-size:18px;font-weight:bold;padding:15px 0;border-top:2px solid #000;margin-top:10px}
        .footer{text-align:center;margin-top:30px;font-size:11px;color:#666}
      </style></head><body>
        <h2>TO'LOV KVITANSIYASI</h2>
        <div class="small">#${payment.id} • ${formatDate(payment.created_at)}</div>
        <div class="row"><span>O'quvchi:</span><b>${student?.first_name || ''} ${student?.last_name || ''}</b></div>
        <div class="row"><span>Guruh:</span><span>${payment.group_name || '—'}</span></div>
        <div class="row"><span>Davr:</span><span>${monthNames[(payment.period_month || 1) - 1]} ${payment.period_year}</span></div>
        <div class="row"><span>Usul:</span><span>${methodConfig[payment.payment_method]?.label || payment.payment_method}</span></div>
        <div class="row total"><span>JAMI:</span><span>${formatMoney(payment.amount)}</span></div>
        <div class="footer">MarkazEdu ERP tizimi orqali</div>
        <script>window.print();</script>
      </body></html>`);
    win.document.close();
  };

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <FontAwesomeIcon icon={faUser} className="w-16 h-16 mb-4" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
        <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>O'quvchi topilmadi</p>
        <button onClick={() => navigate('/app/students')} className="mt-4 px-5 py-2 rounded-xl text-white font-medium" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
          O'quvchilar ro'yxatiga qaytish
        </button>
      </div>
    );
  }

  const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.full_name || 'Noma\'lum';
  const initial = (fullName[0] || 'S').toUpperCase();

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl border flex items-center justify-center transition-colors"
          style={{ borderColor: 'var(--border-color)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
          <FontAwesomeIcon icon={faArrowLeft} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <div className="flex-1 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{fullName}</h1>
            <div className="flex items-center gap-3 mt-1 text-xs flex-wrap" style={{ color: 'var(--text-secondary)' }}>
              {student.phone && (
                <a href={`tel:${student.phone}`} className="flex items-center gap-1 hover:underline">
                  <FontAwesomeIcon icon={faPhone} className="w-3 h-3" /> {student.phone}
                </a>
              )}
              {student.parent_phone && (
                <a href={`tel:${student.parent_phone}`} className="flex items-center gap-1 hover:underline" style={{ color: 'var(--text-muted)' }}>
                  <FontAwesomeIcon icon={faPhone} className="w-3 h-3" />
                  {student.parent_name ? `${student.parent_name}: ` : 'Ota-ona: '}{student.parent_phone}
                </a>
              )}
              {studentGroups.length > 0 && (
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faUsers} className="w-3 h-3" /> {studentGroups.length} ta guruh
                </span>
              )}
            </div>
          </div>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <button onClick={() => setShowDiscountModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <FontAwesomeIcon icon={faPercent} className="w-3.5 h-3.5" /> Chegirma
            </button>
            <button onClick={() => {
              setPayForm({ ...payForm, amount: String(Math.max(0, stats.debt || effectiveMonthlyPrice)), group: studentGroups[0]?.id || '' });
              setShowPayModal(true);
            }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition-all"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
              <FontAwesomeIcon icon={faPlus} /> To'lov qabul qilish
            </button>
          </div>
        )}
      </div>

      {/* ALERT: Overdue */}
      {overdueInvoices.length > 0 && (
        <div className="rounded-2xl p-4 flex items-center gap-3 border" style={{ borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.08)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}>
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5" style={{ color: '#EF4444' }} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold" style={{ color: '#EF4444' }}>
              {overdueInvoices.length} ta hisob-fakturaning muddati o'tgan
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Jami: {formatMoney(overdueInvoices.reduce((s, i) => s + Number(i.total || i.amount || 0), 0))}
            </div>
          </div>
        </div>
      )}

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Oylik narx (samarali)"
          value={formatMoney(effectiveMonthlyPrice)}
          subValue={monthlyPrice !== effectiveMonthlyPrice ? `Asl: ${formatMoney(monthlyPrice)}` : null}
          icon={faWallet}
          color="#3B82F6"
        />
        <StatCard
          label="Jami to'langan"
          value={formatMoney(stats.totalPaid)}
          subValue={`${stats.paymentsCount} ta to'lov`}
          icon={faCheckCircle}
          color="#22C55E"
        />
        <StatCard
          label={stats.debt > 0 ? 'Joriy qarz' : 'Balans'}
          value={stats.debt > 0 ? formatMoney(stats.debt) : formatMoney(Math.max(0, stats.balance))}
          subValue={stats.totalExpected > 0 ? `Kutilgan: ${formatMoney(stats.totalExpected)}` : null}
          icon={stats.debt > 0 ? faExclamationTriangle : faCheckCircle}
          color={stats.debt > 0 ? '#EF4444' : '#22C55E'}
          danger={stats.debt > 0}
        />
        <StatCard
          label="Keyingi to'lov"
          value={nextInvoice ? formatDate(nextInvoice.due_date) : 'Yo\'q'}
          subValue={nextInvoice
            ? (nextInvoice.daysLeft < 0
              ? `${Math.abs(nextInvoice.daysLeft)} kun muddati o'tgan`
              : nextInvoice.daysLeft === 0 ? 'Bugun' : `${nextInvoice.daysLeft} kun qoldi`)
            : 'Faol hisob-faktura yo\'q'}
          icon={faCalendarAlt}
          color={nextInvoice && nextInvoice.daysLeft < 0 ? '#EF4444' : '#F97316'}
        />
      </div>

      {/* GURUH BO'YICHA OYLIK MOLIYAVIY JADVAL */}
      {groupMonthlyBreakdown.length > 0 ? (
        <div className="space-y-6">
          {groupMonthlyBreakdown.map(({ group, months, totalExpected, totalPaid, totalRemaining, joinedDate }) => (
            <SectionCard
              key={group.id}
              title={group.name}
              icon={faGraduationCap}
              iconColor="#3B82F6"
              actions={
                <div className="flex items-center gap-3">
                  {totalRemaining > 0 && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)' }}>
                      Qarz: {formatMoney(totalRemaining)}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatMoney(group.monthly_price || group.price || 0)}/oy
                  </span>
                </div>
              }
            >
              {/* Guruh ma'lumotlari */}
              <div className="flex flex-wrap items-center gap-3 mb-4 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {[group.course_name || group.course, group.teacher_name || group.teacher].filter(Boolean).join(' • ')}
                </div>
                {joinedDate && (
                  <div className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(59,130,246,0.08)', color: '#3B82F6' }}>
                    Qo'shilgan: {formatDate(joinedDate)}
                  </div>
                )}
                <div className="flex items-center gap-3 ml-auto text-xs">
                  <span style={{ color: '#22C55E' }}>To'langan: {formatMoney(totalPaid)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Kutilgan: {formatMoney(totalExpected)}</span>
                </div>
              </div>

              {/* Oylik jadval */}
              {months.length === 0 ? (
                <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>Ma'lumot yo'q</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        {['Oy', 'Summa', "To'langan", 'Qarz', 'Holat'].map(h => (
                          <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {months.map(m => {
                        const statusCfg = {
                          paid: { label: "To'langan", color: '#22C55E', bg: 'rgba(34,197,94,0.12)', icon: faCheck },
                          partial: { label: 'Qisman', color: '#EAB308', bg: 'rgba(234,179,8,0.12)', icon: faHourglassHalf },
                          unpaid: { label: "To'lanmagan", color: '#EF4444', bg: 'rgba(239,68,68,0.08)', icon: faTimes },
                          overdue: { label: "Muddati o'tgan", color: '#DC2626', bg: 'rgba(220,38,38,0.1)', icon: faExclamationTriangle },
                          cancelled: { label: 'Bekor', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', icon: faTimes },
                          draft: { label: 'Qoralama', color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', icon: faClock },
                        };
                        const sc = statusCfg[m.status] || statusCfg.unpaid;
                        return (
                          <tr key={`${m.year}-${m.month}`} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                            <td className="px-3 py-2.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {monthNames[m.month - 1]} {m.year}
                            </td>
                            <td className="px-3 py-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {formatMoney(m.expected)}
                            </td>
                            <td className="px-3 py-2.5 text-sm font-medium" style={{ color: m.paid > 0 ? '#22C55E' : 'var(--text-muted)' }}>
                              {m.paid > 0 ? formatMoney(m.paid) : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-sm font-bold" style={{ color: m.remaining > 0 ? '#EF4444' : 'var(--text-muted)' }}>
                              {m.remaining > 0 ? formatMoney(m.remaining) : '—'}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                                style={{ color: sc.color, backgroundColor: sc.bg }}>
                                <FontAwesomeIcon icon={sc.icon} className="w-2.5 h-2.5" />
                                {sc.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          ))}
        </div>
      ) : (
        <SectionCard title="Faol guruhlar" icon={faGraduationCap} iconColor="#3B82F6">
          <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Bu o'quvchi hech qaysi guruhda emas</div>
        </SectionCard>
      )}

      {/* CHEGIRMALAR */}
      {discounts.length > 0 && (
        <SectionCard
          title="Chegirmalar"
          icon={faGift}
          iconColor="#8B5CF6"
          actions={canManage && (
            <button onClick={() => setShowDiscountModal(true)} className="text-xs font-semibold" style={{ color: '#F97316' }}>
              + Qo'shish
            </button>
          )}
        >
          <div className="space-y-2">
            {discounts.map(d => {
              const isActive = activeDiscounts.find(a => a.id === d.id);
              return (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{
                  borderColor: isActive ? '#8B5CF660' : 'var(--border-color)',
                  backgroundColor: isActive ? 'rgba(139,92,246,0.05)' : 'transparent',
                }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{d.name}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {d.start_date} → {d.end_date || '∞'}
                    </div>
                  </div>
                  <div className="text-sm font-bold whitespace-nowrap" style={{ color: '#8B5CF6' }}>
                    {d.discount_type === 'percent' ? `-${d.value}%` : `-${formatMoney(d.value)}`}
                  </div>
                  {canManage && (
                    <button onClick={() => handleDeleteDiscount(d.id)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <FontAwesomeIcon icon={faTimes} className="w-3 h-3" style={{ color: '#EF4444' }} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* MONTHLY GRID */}
      <SectionCard
        title="Oylik to'lov holati"
        icon={faCalendarCheck}
        iconColor="#22C55E"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setYear(y => y - 1)} className="w-7 h-7 rounded-lg border flex items-center justify-center" style={{ borderColor: 'var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>‹</span>
            </button>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{year}</span>
            <button onClick={() => setYear(y => y + 1)} className="w-7 h-7 rounded-lg border flex items-center justify-center" style={{ borderColor: 'var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>›</span>
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {monthlyGrid.map((m, i) => {
            const cfg = {
              paid: { bg: 'rgba(34,197,94,0.12)', border: '#22C55E', color: '#22C55E', icon: faCheck, label: "To'langan" },
              partial: { bg: 'rgba(234,179,8,0.12)', border: '#EAB308', color: '#EAB308', icon: faHourglassHalf, label: 'Qisman' },
              unpaid: { bg: 'rgba(239,68,68,0.08)', border: '#EF4444', color: '#EF4444', icon: faTimes, label: "To'lanmagan" },
              future: { bg: 'var(--bg-tertiary)', border: 'var(--border-color)', color: 'var(--text-muted)', icon: faClock, label: 'Kutilmoqda' },
            }[m.status];
            return (
              <div key={i} className="rounded-xl p-3 border text-center transition-all" style={{
                borderColor: cfg.border,
                backgroundColor: cfg.bg,
              }}>
                <div className="text-[11px] font-bold mb-1" style={{ color: cfg.color }}>{monthShort[i]}</div>
                <FontAwesomeIcon icon={cfg.icon} className="w-3 h-3 mb-1" style={{ color: cfg.color }} />
                <div className="text-[10px] font-semibold" style={{ color: cfg.color }}>
                  {m.status !== 'future' && m.paid > 0 ? Number(m.paid).toLocaleString('uz-UZ').replace(/,/g, ' ') : cfg.label}
                </div>
                {m.status === 'partial' && m.expected > 0 && (
                  <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    /{Number(m.expected).toLocaleString('uz-UZ').replace(/,/g, ' ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />To'langan</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#EAB308' }} />Qisman</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#EF4444' }} />To'lanmagan</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#94A3B8' }} />Kelajak</span>
        </div>
      </SectionCard>

      {/* ATTENDANCE vs PAYMENT */}
      {(attendance.length > 0 || attendanceStats.total > 0) && (
        <SectionCard title="Davomat ↔ To'lov taqqoslash" icon={faChartLine} iconColor="#8B5CF6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(34,197,94,0.08)' }}>
              <div className="text-2xl font-bold" style={{ color: '#22C55E' }}>{attendanceStats.present}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Kelgan</div>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
              <div className="text-2xl font-bold" style={{ color: '#EF4444' }}>{attendanceStats.absent}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Kelmagan</div>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(234,179,8,0.08)' }}>
              <div className="text-2xl font-bold" style={{ color: '#EAB308' }}>{attendanceStats.late}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Kech qolgan</div>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(59,130,246,0.08)' }}>
              <div className="text-2xl font-bold" style={{ color: '#3B82F6' }}>{attendanceStats.percent}%</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Davomat</div>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-xl flex items-center gap-2" style={{ backgroundColor: 'rgba(59,130,246,0.06)' }}>
            <FontAwesomeIcon icon={faInfoCircle} className="w-4 h-4 flex-shrink-0" style={{ color: '#3B82F6' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Jami {attendanceStats.total} dars, har bir darsning taxminiy narxi{' '}
              <b style={{ color: 'var(--text-primary)' }}>{formatMoney(attendanceStats.total > 0 ? stats.totalPaid / attendanceStats.total : 0)}</b>
            </span>
          </div>
        </SectionCard>
      )}

      {/* INVOICES */}
      {invoices.length > 0 && (
        <SectionCard title="Hisob-fakturalar" icon={faFileInvoice} iconColor="#F97316">
          <div className="space-y-2">
            {invoices.map(inv => {
              const daysLeft = inv.due_date ? daysBetween(new Date(), inv.due_date) : null;
              const isOverdue = daysLeft !== null && daysLeft < 0 && inv.status !== 'paid';
              const cfg = invoiceStatusConfig[inv.status] || invoiceStatusConfig.draft;
              return (
                <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl border transition-colors" style={{
                  borderColor: isOverdue ? '#EF4444' : 'var(--border-color)',
                  backgroundColor: isOverdue ? 'rgba(239,68,68,0.04)' : 'transparent',
                }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                    <FontAwesomeIcon icon={faFileInvoice} className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>#{inv.invoice_number || inv.id}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Muddat: {formatDate(inv.due_date)}
                      {daysLeft !== null && inv.status !== 'paid' && (
                        <span className="ml-2" style={{ color: isOverdue ? '#EF4444' : daysLeft <= 3 ? '#EAB308' : 'var(--text-muted)' }}>
                          ({isOverdue ? `${Math.abs(daysLeft)} kun o'tgan` : daysLeft === 0 ? 'Bugun' : `${daysLeft} kun qoldi`})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatMoney(inv.total || inv.amount)}</div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* BILLING INVOICES */}
      {billingInvoices.length > 0 && (
        <SectionCard title={`Billing hisob-fakturalar (${billingInvoices.length})`} icon={faFileInvoice} iconColor="#6366F1">
          <div className="space-y-2">
            {billingInvoices.map(inv => {
              const statusMap = {
                paid: { label: "To'langan", color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
                partial: { label: 'Qisman', color: '#EAB308', bg: 'rgba(234,179,8,0.12)' },
                unpaid: { label: "To'lanmagan", color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
                overdue: { label: "Muddati o'tgan", color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
                cancelled: { label: 'Bekor', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
              };
              const cfg = statusMap[inv.status] || statusMap.unpaid;
              return (
                <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                    <FontAwesomeIcon icon={faFileInvoice} className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {inv.number || `#${inv.id}`}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {inv.group_name} • Muddat: {formatDate(inv.due_date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatMoney(inv.total_amount)}</div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* PAYMENT HISTORY */}
      <SectionCard title={`To'lov tarixi (${payments.length})`} icon={faReceipt} iconColor="#22C55E">
        {payments.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            <FontAwesomeIcon icon={faReceipt} className="w-12 h-12 mb-3 opacity-30" />
            <div>Hali to'lovlar yo'q</div>
          </div>
        ) : (
          <div className="space-y-2">
            {[...payments].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).map(p => {
              const mcfg = methodConfig[p.payment_method] || { label: p.payment_method, icon: faMoneyBill, color: '#94A3B8' };
              const scfg = paymentStatusConfig[p.status] || paymentStatusConfig.pending;
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border transition-colors" style={{ borderColor: 'var(--border-color)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: mcfg.color + '15' }}>
                    <FontAwesomeIcon icon={mcfg.icon} className="w-4 h-4" style={{ color: mcfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {formatMoney(p.amount)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ color: scfg.color, backgroundColor: scfg.bg }}>
                        {scfg.label}
                      </span>
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {monthNames[(p.period_month || 1) - 1]} {p.period_year} • {mcfg.label} • {formatDate(p.created_at)}
                      {p.group_name && ` • ${p.group_name}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handlePrintReceipt(p)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" title="Kvitansiya"
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <FontAwesomeIcon icon={faPrint} className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                    </button>
                    {canManage && p.status === 'completed' && (
                      <button onClick={() => handleRefund(p.id)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" title="Qaytarish"
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <FontAwesomeIcon icon={faUndo} className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* REFUND HISTORY */}
      {payments.filter(p => p.status === 'refunded').length > 0 && (
        <SectionCard title="Refund tarixi" icon={faUndo} iconColor="#8B5CF6">
          <div className="space-y-2">
            {payments.filter(p => p.status === 'refunded').map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(139,92,246,0.05)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}>
                  <FontAwesomeIcon icon={faUndo} className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold" style={{ color: '#8B5CF6' }}>-{formatMoney(p.amount)}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {monthNames[(p.period_month || 1) - 1]} {p.period_year} • {formatDate(p.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* PAYMENT MODAL */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="To'lov qabul qilish">
        <div className="space-y-4">
          <div className="p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#F97316' }}>{initial}</div>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{fullName}</div>
              {stats.debt > 0 && <div className="text-xs" style={{ color: '#EF4444' }}>Qarz: {formatMoney(stats.debt)}</div>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Summa *</label>
            <div className="relative">
              <input type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                className="w-full h-12 pl-4 pr-14 rounded-xl border bg-transparent text-base font-bold focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} placeholder="0" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>so'm</span>
            </div>
            <div className="flex gap-2 mt-2">
              {effectiveMonthlyPrice > 0 && (
                <button type="button" onClick={() => setPayForm({ ...payForm, amount: String(effectiveMonthlyPrice) })}
                  className="text-[11px] px-3 py-1 rounded-lg border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                  Oylik: {formatMoney(effectiveMonthlyPrice)}
                </button>
              )}
              {stats.debt > 0 && (
                <button type="button" onClick={() => setPayForm({ ...payForm, amount: String(stats.debt) })}
                  className="text-[11px] px-3 py-1 rounded-lg border" style={{ borderColor: '#EF4444', color: '#EF4444' }}>
                  Qarz: {formatMoney(stats.debt)}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>To'lov usuli</label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(methodConfig).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setPayForm({ ...payForm, payment_method: k })}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-all" style={{
                    borderColor: payForm.payment_method === k ? v.color : 'var(--border-color)',
                    backgroundColor: payForm.payment_method === k ? v.color + '15' : 'transparent',
                  }}>
                  <FontAwesomeIcon icon={v.icon} className="w-4 h-4" style={{ color: v.color }} />
                  <span className="text-[10px] font-semibold" style={{ color: payForm.payment_method === k ? v.color : 'var(--text-secondary)' }}>{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {studentGroups.length > 1 && (
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Guruh</label>
              <select value={payForm.group} onChange={e => setPayForm({ ...payForm, group: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                <option value="">— Tanlang —</option>
                {studentGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Oy</label>
              <select value={payForm.period_month} onChange={e => setPayForm({ ...payForm, period_month: Number(e.target.value) })}
                className="w-full h-11 px-3 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Yil</label>
              <input type="number" value={payForm.period_year} onChange={e => setPayForm({ ...payForm, period_year: Number(e.target.value) })}
                className="w-full h-11 px-3 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Izoh</label>
            <textarea value={payForm.note} onChange={e => setPayForm({ ...payForm, note: e.target.value })} rows={2}
              className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="Qo'shimcha ma'lumot..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowPayModal(false)}
              className="flex-1 h-12 rounded-xl border font-semibold text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              Bekor qilish
            </button>
            <button onClick={handleAcceptPayment}
              className="flex-1 h-12 rounded-xl text-white font-semibold text-sm shadow-lg shadow-orange-500/25"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
              To'lovni qabul qilish
            </button>
          </div>
        </div>
      </Modal>

      {/* DISCOUNT MODAL */}
      <Modal isOpen={showDiscountModal} onClose={() => setShowDiscountModal(false)} title="Chegirma qo'shish">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Nomi *</label>
            <input value={discountForm.name} onChange={e => setDiscountForm({ ...discountForm, name: e.target.value })}
              className="w-full h-11 px-4 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="Masalan: Aka-uka chegirmasi" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Turi</label>
              <select value={discountForm.discount_type} onChange={e => setDiscountForm({ ...discountForm, discount_type: e.target.value })}
                className="w-full h-11 px-3 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                <option value="percent">Foizda (%)</option>
                <option value="fixed">Qat'iy summa</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Qiymati *</label>
              <input type="number" value={discountForm.value} onChange={e => setDiscountForm({ ...discountForm, value: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder={discountForm.discount_type === 'percent' ? '10' : '50000'} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Boshlanish</label>
              <input type="date" value={discountForm.start_date} onChange={e => setDiscountForm({ ...discountForm, start_date: e.target.value })}
                className="w-full h-11 px-3 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Tugash</label>
              <input type="date" value={discountForm.end_date} onChange={e => setDiscountForm({ ...discountForm, end_date: e.target.value })}
                className="w-full h-11 px-3 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Sabab</label>
            <textarea value={discountForm.reason} onChange={e => setDiscountForm({ ...discountForm, reason: e.target.value })} rows={2}
              className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowDiscountModal(false)}
              className="flex-1 h-12 rounded-xl border font-semibold text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              Bekor qilish
            </button>
            <button onClick={handleAddDiscount}
              className="flex-1 h-12 rounded-xl text-white font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
              Saqlash
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
