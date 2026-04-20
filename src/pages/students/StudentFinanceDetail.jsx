import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faPhone, faWallet, faMoneyBillWave, faExclamationTriangle,
  faCalendarAlt, faCheckCircle, faClock, faTimes, faUndo, faPercent, faPlus,
  faReceipt, faGraduationCap, faCreditCard, faMobileAlt,
  faExchangeAlt, faMoneyBill, faPrint, faCheck, faHourglassHalf, faGift,
  faBan, faUser,
} from '@fortawesome/free-solid-svg-icons';
import { studentsService } from '@/services/students';
import { paymentsService } from '@/services/payments';
import { billingInvoicesService, billingDiscountsService } from '@/services/billing';
import { attendanceService } from '@/services/attendance';
import { unwrap, unwrapList } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { formatMoney, formatDate } from '@/utils/format';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const MONTHS = [
  'Yanvar','Fevral','Mart','Aprel','May','Iyun',
  'Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr',
];

const METHOD_CFG = {
  cash:     { label: 'Naqd',     icon: faMoneyBillWave, color: '#22C55E' },
  card:     { label: 'Karta',    icon: faCreditCard,    color: '#3B82F6' },
  transfer: { label: "O'tkazma", icon: faExchangeAlt,   color: '#8B5CF6' },
  payme:    { label: 'Payme',    icon: faMobileAlt,     color: '#00CCCC' },
  click:    { label: 'Click',    icon: faMobileAlt,     color: '#F97316' },
};

const INV_STATUS = {
  draft:     { label: 'Qoralama',         variant: 'neutral', icon: faClock },
  unpaid:    { label: "To'lanmagan",      variant: 'danger',  icon: faTimes },
  partial:   { label: 'Qisman',           variant: 'warning', icon: faHourglassHalf },
  paid:      { label: "To'langan",        variant: 'success', icon: faCheck },
  overdue:   { label: "Muddati o'tgan",   variant: 'danger',  icon: faExclamationTriangle },
  cancelled: { label: 'Bekor qilingan',   variant: 'neutral', icon: faBan },
};

const PAY_STATUS = {
  pending:   { label: 'Kutilmoqda',  variant: 'warning', icon: faClock },
  completed: { label: "To'langan",   variant: 'success', icon: faCheckCircle },
  cancelled: { label: 'Bekor',       variant: 'danger',  icon: faTimes },
  refunded:  { label: 'Qaytarilgan', variant: 'primary', icon: faUndo },
};

const fm = (v) => formatMoney(v);
const fd = (d) => formatDate(d);

// ─────────────────────────────────────────────
// SHARED UI
// ─────────────────────────────────────────────
function StatusBadge({ status, config }) {
  const cfg = config[status] || { label: status, variant: 'neutral' };
  return (
    <Badge variant={cfg.variant} size="sm">
      {cfg.icon && <FontAwesomeIcon icon={cfg.icon} className="w-2.5 h-2.5" />}
      {cfg.label}
    </Badge>
  );
}

function StatCard({ label, value, icon, color, danger }) {
  return (
    <div className="rounded-2xl p-5 border transition-all"
      style={{
        borderColor: danger ? '#EF444450' : 'var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
      }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: color + '18' }}>
        <FontAwesomeIcon icon={icon} className="w-5 h-5" style={{ color }} />
      </div>
      <div className="text-xl font-bold" style={{ color: danger ? '#EF4444' : 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAY MODAL — to'lov qabul qilish
// ─────────────────────────────────────────────
function PayModal({ isOpen, onClose, student, groups, debt, defaultGroup, defaultMonth, defaultYear, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [groupId, setGroupId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setAmount('');
    setMethod('cash');
    setGroupId(defaultGroup || groups[0]?.id || '');
    setMonth(defaultMonth || new Date().getMonth() + 1);
    setYear(defaultYear || new Date().getFullYear());
    setNote('');
  }, [isOpen, defaultGroup, defaultMonth, defaultYear, groups]);

  const selectedGroup = groups.find(g => g.id === groupId);

  const handleSubmit = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.error("Summani kiriting"); return; }
    setSaving(true);
    try {
      await paymentsService.create({
        student: student.id,
        amount: num,
        payment_method: method,
        payment_type: 'tuition',
        period_month: month,
        period_year: year,
        note: note || '',
        status: 'completed',
        ...(groupId ? { group: groupId } : {}),
      });
      // Backend signali invoice'larga FIFO taqsimlashni avtomatik bajaradi
      toast.success("To'lov qabul qilindi!");
      onClose();
      onSuccess();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || e.response?.data?.detail || "To'lov qabul qilinmadi");
    }
    setSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="To'lov qabul qilish" size="sm">
      <div className="space-y-5">
        {/* Student summary */}
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            {(student?.first_name || '?')[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
              {student?.first_name} {student?.last_name}
            </div>
            {debt > 0 && <div className="text-xs" style={{ color: '#EF4444' }}>Qarz: {fm(debt)}</div>}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Summa *</label>
          <div className="relative">
            <input
              type="number"
              autoFocus
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full h-14 pl-5 pr-16 rounded-xl border bg-transparent text-xl font-bold"
              style={{ borderColor: 'var(--border-color)', color: '#1B365D' }}
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>so'm</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedGroup?.monthly_price && (
              <button onClick={() => setAmount(String(selectedGroup.monthly_price))}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ color: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)' }}>
                1 oy: {fm(selectedGroup.monthly_price)}
              </button>
            )}
            {debt > 0 && (
              <button onClick={() => setAmount(String(debt))}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)' }}>
                Butun qarz: {fm(debt)}
              </button>
            )}
          </div>
        </div>

        {/* Method */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Usul</label>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(METHOD_CFG).map(([k, m]) => (
              <button key={k} onClick={() => setMethod(k)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all"
                style={{
                  borderColor: method === k ? m.color : 'var(--border-color)',
                  backgroundColor: method === k ? m.color + '12' : 'transparent',
                }}>
                <FontAwesomeIcon icon={m.icon} className="w-4 h-4" style={{ color: method === k ? m.color : 'var(--text-muted)' }} />
                <span className="text-[10px] font-semibold" style={{ color: method === k ? m.color : 'var(--text-muted)' }}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Group */}
        {groups.length > 1 && (
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Guruh</label>
            <select value={groupId} onChange={e => setGroupId(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border bg-transparent text-sm"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">— Tanlang —</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name} — {fm(g.monthly_price)}</option>)}
            </select>
          </div>
        )}

        {/* Period */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Oy</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-xl border bg-transparent text-sm"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Yil</label>
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-xl border bg-transparent text-sm"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Izoh</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
            className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none text-sm"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            placeholder="Ixtiyoriy..." />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 h-12 rounded-xl border font-semibold text-sm"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Bekor</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 h-12 rounded-xl text-white font-bold text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            {saving ? 'Saqlanmoqda...' : "To'lovni qabul qilish"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// DISCOUNT MODAL — billing schema (kind + value_type)
// ─────────────────────────────────────────────
function DiscountModal({ isOpen, onClose, studentId, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    value_type: 'percent',
    value: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    reason: '',
  });
  const [saving, setSaving] = useState(false);
  const F = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      name: '',
      value_type: 'percent',
      value: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      reason: '',
    });
  }, [isOpen]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.value) { toast.error("Maydonlarni to'ldiring"); return; }
    setSaving(true);
    try {
      const payload = {
        student: studentId,
        name: form.name.trim(),
        kind: form.value_type === 'percent' ? 'student_percent' : 'student_fixed',
        value_type: form.value_type,
        value: parseFloat(form.value),
        start_date: form.start_date,
        end_date: form.end_date || null,
        reason: form.reason || '',
        is_active: true,
      };
      await billingDiscountsService.create(payload);
      toast.success("Chegirma qo'shildi");
      onClose();
      onSuccess();
    } catch (e) {
      const resp = e.response?.data;
      const msg = resp?.detail
        || (typeof Object.values(resp || {})[0] === 'string' ? Object.values(resp)[0] : null)
        || 'Saqlashda xato';
      toast.error(msg);
    }
    setSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chegirma qo'shish" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nomi *</label>
          <input value={form.name} onChange={e => F('name', e.target.value)}
            className="w-full h-11 px-4 rounded-xl border bg-transparent text-sm"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            placeholder="Aka-uka chegirmasi" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Turi</label>
            <select value={form.value_type} onChange={e => F('value_type', e.target.value)}
              className="w-full h-11 px-3 rounded-xl border bg-transparent text-sm"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="percent">Foiz (%)</option>
              <option value="fixed">Qat'iy summa</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Qiymat *</label>
            <input type="number" value={form.value} onChange={e => F('value', e.target.value)}
              className="w-full h-11 px-4 rounded-xl border bg-transparent text-sm"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              placeholder={form.value_type === 'percent' ? '10' : '50000'} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Boshlanish</label>
            <input type="date" value={form.start_date} onChange={e => F('start_date', e.target.value)}
              className="w-full h-11 px-4 rounded-xl border bg-transparent text-sm"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tugash</label>
            <input type="date" value={form.end_date} onChange={e => F('end_date', e.target.value)}
              className="w-full h-11 px-4 rounded-xl border bg-transparent text-sm"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Sabab</label>
          <textarea value={form.reason} onChange={e => F('reason', e.target.value)} rows={2}
            className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none text-sm"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 h-11 rounded-xl border font-semibold text-sm"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Bekor</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 h-11 rounded-xl text-white font-bold text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            {saving ? '...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// INVOICE DETAIL MODAL
// ─────────────────────────────────────────────
function InvoiceDetailModal({ isOpen, onClose, invoice }) {
  if (!invoice) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Invoice ${invoice.number || ''}`} size="sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{invoice.group_name}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {MONTHS[(invoice.period_month || 1) - 1]} {invoice.period_year}
            </div>
          </div>
          <StatusBadge status={invoice.status} config={INV_STATUS} />
        </div>
        <div className="space-y-2">
          {[
            { label: 'Asosiy summa', value: fm(invoice.base_amount), color: 'var(--text-primary)' },
            Number(invoice.discount_amount) > 0 && { label: 'Chegirma', value: `-${fm(invoice.discount_amount)}`, color: '#22C55E' },
            Number(invoice.leave_credit_amount) > 0 && { label: "Ta'til chegirmasi", value: `-${fm(invoice.leave_credit_amount)}`, color: '#22C55E' },
            Number(invoice.late_fee_amount) > 0 && { label: 'Penya', value: `+${fm(invoice.late_fee_amount)}`, color: '#EF4444' },
          ].filter(Boolean).map((r, i) => (
            <div key={i} className="flex justify-between text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
              <span style={{ color: r.color }}>{r.value}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold px-3 py-2.5 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
            <span style={{ color: 'var(--text-primary)' }}>Jami</span>
            <span style={{ color: 'var(--text-primary)' }}>{fm(invoice.total_amount)}</span>
          </div>
          <div className="flex justify-between text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.06)' }}>
            <span style={{ color: 'var(--text-muted)' }}>To'langan</span>
            <span style={{ color: '#22C55E', fontWeight: 600 }}>{fm(invoice.paid_amount)}</span>
          </div>
          {Number(invoice.remaining) > 0 && (
            <div className="flex justify-between text-sm font-bold px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.06)' }}>
              <span style={{ color: '#EF4444' }}>Qoldiq qarz</span>
              <span style={{ color: '#EF4444' }}>{fm(invoice.remaining)}</span>
            </div>
          )}
        </div>
        {invoice.due_date && (
          <div className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            To'lov muddati: <b>{fd(invoice.due_date)}</b>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// GROUP MONTHLY TABLE
// ─────────────────────────────────────────────
function GroupMonthlyTable({ group, invoices, onPay, onGenerate, generating }) {
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Bu guruh uchun invoicelar
  const groupInvoices = useMemo(
    () => invoices.filter(inv => String(inv.group) === String(group.id)),
    [invoices, group.id],
  );

  // Oylar ro'yxati — qo'shilgan sanadan bugungi kungacha
  const months = useMemo(() => {
    const now = new Date();
    const start = group.joined_date ? new Date(group.joined_date) : new Date(now.getFullYear(), 0, 1);

    const list = [];
    let y = start.getFullYear();
    let m = start.getMonth();

    const endY = now.getFullYear();
    const endM = now.getMonth();

    while (y < endY || (y === endY && m <= endM)) {
      const month1 = m + 1;
      const invoice = groupInvoices.find(
        inv => Number(inv.period_year) === y && Number(inv.period_month) === month1,
      );

      list.push({
        year: y,
        month: month1,
        invoice,
        expected: Number(invoice?.total_amount || 0),
        paid: Number(invoice?.paid_amount || 0),
        remaining: Number(invoice?.remaining || 0),
        status: invoice?.status || 'no_invoice',
      });

      m++;
      if (m > 11) { m = 0; y++; }
    }
    return list.reverse(); // eng yangi oy yuqorida
  }, [group.joined_date, groupInvoices]);

  const totalDebt = useMemo(
    () => months.reduce((s, row) => (
      ['unpaid', 'partial', 'overdue'].includes(row.status) ? s + row.remaining : s
    ), 0),
    [months],
  );
  const totalPaid = useMemo(() => months.reduce((s, row) => s + row.paid, 0), [months]);

  return (
    <>
      <div className="rounded-2xl border overflow-hidden"
        style={{
          borderColor: totalDebt > 0 ? '#EF444430' : 'var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
        }}>
        {/* Guruh header */}
        <div className="px-5 py-4 border-b flex flex-wrap items-center gap-3"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: totalDebt > 0 ? 'rgba(239,68,68,0.02)' : 'var(--bg-secondary)',
          }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
            <FontAwesomeIcon icon={faGraduationCap} className="w-4 h-4" style={{ color: '#3B82F6' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{group.name}</div>
            <div className="text-xs mt-0.5 flex flex-wrap gap-2" style={{ color: 'var(--text-muted)' }}>
              {group.course && <span>{group.course}</span>}
              {group.teacher && <span>• {group.teacher}</span>}
              {group.time && <span>• {group.time}</span>}
              {group.joined_date && <span>• Qo'shildi: {fd(group.joined_date)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Oylik</div>
              <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{fm(group.monthly_price)}</div>
            </div>
            {totalDebt > 0 && (
              <div className="text-right">
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Qarz</div>
                <div className="text-sm font-bold" style={{ color: '#EF4444' }}>{fm(totalDebt)}</div>
              </div>
            )}
            {totalPaid > 0 && (
              <div className="text-right">
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>To'langan</div>
                <div className="text-sm font-bold" style={{ color: '#22C55E' }}>{fm(totalPaid)}</div>
              </div>
            )}
            <button onClick={() => onPay(group.id, null, null)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
              <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
              To'lov
            </button>
          </div>
        </div>

        {/* Months table */}
        {months.length === 0 ? (
          <EmptyState title="Ma'lumot yo'q" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  {['Oy', 'Summa', "To'langan", 'Qarz', 'Holat', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {months.map(row => {
                  const isDebt = ['unpaid', 'partial', 'overdue'].includes(row.status);
                  const noInv = row.status === 'no_invoice';
                  return (
                    <tr key={`${row.year}-${row.month}`}
                      className="border-t transition-colors"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: isDebt ? 'rgba(239,68,68,0.02)' : 'transparent',
                      }}>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {MONTHS[row.month - 1]} {row.year}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {row.expected > 0 ? fm(row.expected) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: row.paid > 0 ? '#22C55E' : 'var(--text-muted)' }}>
                        {row.paid > 0 ? fm(row.paid) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold" style={{ color: row.remaining > 0 ? '#EF4444' : 'var(--text-muted)' }}>
                        {row.remaining > 0 ? fm(row.remaining) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {noInv ? (
                          <Badge variant="neutral" size="sm">Invoice yo'q</Badge>
                        ) : (
                          <button onClick={() => row.invoice && setSelectedInvoice(row.invoice)}
                            className="hover:opacity-80 transition-opacity">
                            <StatusBadge status={row.status} config={INV_STATUS} />
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {noInv && group.group_student_id && (
                            <button onClick={() => onGenerate(group.group_student_id, row.month, row.year)}
                              disabled={generating}
                              className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                              style={{ color: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)' }}
                              title="Invoice yaratish">
                              {generating ? '...' : '+ Invoice'}
                            </button>
                          )}
                          {isDebt && (
                            <button onClick={() => onPay(group.id, row.month, row.year)}
                              className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                              style={{ color: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)' }}
                              title="To'lov qabul qilish">
                              To'lov
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InvoiceDetailModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function StudentFinanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canManage = ['owner', 'admin', 'accountant'].includes(user?.role);

  const [student, setStudent] = useState(null);
  const [groups, setGroups] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [attRate, setAttRate] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showPay, setShowPay] = useState(false);
  const [payDefaults, setPayDefaults] = useState({});
  const [showDiscount, setShowDiscount] = useState(false);
  const [generating, setGenerating] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [stRes, grpRes, payRes, invRes, discRes, attRes] = await Promise.all([
        studentsService.getById(id).catch(() => null),
        studentsService.getGroups(id).catch(() => null),
        paymentsService.getAll({ student: id, page_size: 500 }).catch(() => null),
        billingInvoicesService.getAll({ student: id, page_size: 500 }).catch(() => null),
        billingDiscountsService.getAll({ student: id, page_size: 100 }).catch(() => null),
        attendanceService.byStudent({ student_id: id }).catch(() => null),
      ]);

      setStudent(stRes ? unwrap(stRes) : null);
      setGroups(stRes ? (unwrap(grpRes) || []) : []);
      setPayments(unwrapList(payRes));
      setInvoices(unwrapList(invRes));
      setDiscounts(unwrapList(discRes));
      const attData = attRes ? unwrap(attRes) : null;
      setAttRate(attData?.statistics?.rate ?? null);
    } catch {
      toast.error("Ma'lumotlarni yuklashda xato");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ─── Computed ───
  const fullName = student?.full_name || `${student?.first_name || ''} ${student?.last_name || ''}`.trim();
  const initial = (fullName[0] || '?').toUpperCase();

  const totalPaid = useMemo(
    () => payments
      .filter(p => p.status === 'completed')
      .reduce((s, p) => s + Number(p.amount || 0), 0),
    [payments],
  );

  // Qarz — faqat aktiv invoicelar asosida (yagona manba)
  const debt = useMemo(
    () => invoices
      .filter(inv => ['unpaid', 'partial', 'overdue'].includes(inv.status))
      .reduce((s, inv) => s + Number(inv.remaining || 0), 0),
    [invoices],
  );

  const overdueCount = useMemo(
    () => invoices.filter(i => i.status === 'overdue').length,
    [invoices],
  );

  const monthlyTotal = useMemo(
    () => groups.reduce((s, g) => s + Number(g.monthly_price || 0), 0),
    [groups],
  );

  // ─── Handlers ───
  const openPay = (groupId, month, year) => {
    setPayDefaults({ defaultGroup: groupId, defaultMonth: month, defaultYear: year });
    setShowPay(true);
  };

  const handleGenerate = async (groupStudentId, month, year) => {
    if (!groupStudentId) { toast.error("Guruh o'quvchisi topilmadi"); return; }
    setGenerating(true);
    try {
      await billingInvoicesService.generate({ group_student_id: groupStudentId, year, month });
      toast.success(`${MONTHS[month - 1]} ${year} uchun invoice yaratildi`);
      loadAll();
    } catch (e) {
      toast.error(e.response?.data?.detail || e.response?.data?.error || 'Invoice yaratishda xato');
    }
    setGenerating(false);
  };

  const handleRefund = async (payId) => {
    if (!confirm("To'lovni qaytarmoqchimisiz?")) return;
    try {
      await paymentsService.refund(payId);
      toast.success('Qaytarildi');
      loadAll();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || e.response?.data?.detail || 'Xato');
    }
  };

  const handlePrintReceipt = (p) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Kvitansiya</title>
    <style>body{font-family:Arial;max-width:380px;margin:20px auto;padding:20px}
    h2{text-align:center;margin:0 0 4px}.sub{text-align:center;color:#666;font-size:12px;margin-bottom:20px}
    .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #ddd}
    .total{font-size:18px;font-weight:bold;padding:12px 0;border-top:2px solid #000;margin-top:8px}
    .footer{text-align:center;margin-top:24px;font-size:11px;color:#999}</style></head><body>
    <h2>TO'LOV KVITANSIYASI</h2>
    <div class="sub">${fd(p.created_at)}</div>
    <div class="row"><span>O'quvchi</span><b>${fullName}</b></div>
    <div class="row"><span>Guruh</span><span>${p.group_name || '—'}</span></div>
    <div class="row"><span>Davr</span><span>${MONTHS[(p.period_month || 1) - 1]} ${p.period_year}</span></div>
    <div class="row"><span>Usul</span><span>${METHOD_CFG[p.payment_method]?.label || p.payment_method}</span></div>
    <div class="row total"><span>JAMI</span><span>${fm(p.amount)}</span></div>
    <div class="footer">MarkazEdu ERP</div>
    <script>window.print();</script></body></html>`);
    w.document.close();
  };

  // ─── Loading / Not found ───
  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#F97316', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!student) return (
    <EmptyState
      icon={faUser}
      title="O'quvchi topilmadi"
      action={
        <button onClick={() => navigate('/app/students')}
          className="px-5 py-2.5 rounded-xl text-white font-medium"
          style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
          Orqaga
        </button>
      }
    />
  );

  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
  );

  return (
    <div className="space-y-6">

      {/* ─── HEADER ─── */}
      <div className="rounded-2xl border p-5"
        style={{
          borderColor: debt > 0 ? '#EF444430' : 'var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
        }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 self-start transition-colors hover:bg-black/5"
            style={{ borderColor: 'var(--border-color)' }}>
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>

          {/* Avatar + info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
              style={{ background: debt > 0 ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, #F97316, #EA580C)' }}>
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{fullName}</h1>
              <div className="flex flex-wrap gap-3 mt-1.5">
                {student.phone && (
                  <a href={`tel:${student.phone}`} className="flex items-center gap-1.5 text-sm hover:underline" style={{ color: 'var(--text-secondary)' }}>
                    <FontAwesomeIcon icon={faPhone} className="w-3 h-3" /> {student.phone}
                  </a>
                )}
                {student.parent_phone && (
                  <a href={`tel:${student.parent_phone}`} className="flex items-center gap-1.5 text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>
                    <FontAwesomeIcon icon={faPhone} className="w-3 h-3" />
                    {student.parent_name ? `${student.parent_name}: ` : 'Ota-ona: '}{student.parent_phone}
                  </a>
                )}
                {groups.length > 0 && (
                  <span className="text-sm flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <FontAwesomeIcon icon={faGraduationCap} className="w-3 h-3" />
                    {groups.length} ta guruh
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {canManage && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setShowDiscount(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors hover:bg-black/5"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                <FontAwesomeIcon icon={faPercent} className="w-3.5 h-3.5" /> Chegirma
              </button>
              <button onClick={() => openPay(groups[0]?.id, null, null)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-orange-500/20"
                style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                <FontAwesomeIcon icon={faPlus} /> To'lov
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── OVERDUE ALERT ─── */}
      {overdueCount > 0 && (
        <div className="rounded-2xl p-4 flex items-center gap-3 border"
          style={{ borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.06)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}>
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5" style={{ color: '#EF4444' }} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: '#EF4444' }}>
              {overdueCount} ta invoice muddati o'tgan
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Imkon boricha tezroq to'lov qabul qiling
            </div>
          </div>
        </div>
      )}

      {/* ─── STATS CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={debt > 0 ? 'Joriy qarz' : 'Balans'}
          value={debt > 0 ? fm(debt) : fm(Math.max(0, Number(student?.balance || 0)))}
          icon={debt > 0 ? faExclamationTriangle : faCheckCircle}
          color={debt > 0 ? '#EF4444' : '#22C55E'}
          danger={debt > 0}
        />
        <StatCard label="Jami to'langan" value={fm(totalPaid)} icon={faWallet} color="#22C55E" />
        <StatCard label="Oylik to'lov" value={fm(monthlyTotal)} icon={faCalendarAlt} color="#3B82F6" />
        <StatCard
          label="Davomat"
          value={attRate !== null ? `${Math.round(attRate)}%` : '—'}
          icon={faCheckCircle}
          color="#8B5CF6"
        />
      </div>

      {/* ─── GURUH BO'YICHA OYLIK JADVAL ─── */}
      <div>
        <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Guruh bo'yicha to'lov holati
        </h2>
        {groups.length === 0 ? (
          <EmptyState
            icon={faGraduationCap}
            title="Guruh yo'q"
            description="Bu o'quvchi hech qaysi guruhda emas"
          />
        ) : (
          <div className="space-y-5">
            {groups.map(g => (
              <GroupMonthlyTable
                key={g.id}
                group={g}
                invoices={invoices}
                onPay={openPay}
                onGenerate={handleGenerate}
                generating={generating}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── CHEGIRMALAR ─── */}
      {discounts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              <FontAwesomeIcon icon={faGift} className="w-4 h-4 mr-2" style={{ color: '#8B5CF6' }} />
              Chegirmalar
            </h2>
            {canManage && (
              <button onClick={() => setShowDiscount(true)} className="text-xs font-semibold" style={{ color: '#F97316' }}>
                + Qo'shish
              </button>
            )}
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            {discounts.map((d, i) => {
              const today = new Date();
              const active = d.is_active
                && (!d.start_date || new Date(d.start_date) <= today)
                && (!d.end_date || new Date(d.end_date) >= today);
              return (
                <div key={d.id} className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? 'border-t' : ''}`}
                  style={{ borderColor: 'var(--border-color)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: active ? 'rgba(139,92,246,0.12)' : 'var(--bg-tertiary)' }}>
                    <FontAwesomeIcon icon={faPercent} className="w-4 h-4" style={{ color: active ? '#8B5CF6' : 'var(--text-muted)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{d.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {fd(d.start_date)} — {d.end_date ? fd(d.end_date) : '∞'}
                      {d.reason && ` • ${d.reason}`}
                    </div>
                  </div>
                  <div className="text-base font-bold" style={{ color: active ? '#8B5CF6' : 'var(--text-muted)' }}>
                    {d.value_type === 'percent' ? `-${d.value}%` : `-${fm(d.value)}`}
                  </div>
                  <Badge variant={active ? 'success' : 'neutral'} size="sm">
                    {active ? 'Faol' : 'Faol emas'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TO'LOVLAR TARIXI ─── */}
      <div>
        <h2 className="text-base font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          <FontAwesomeIcon icon={faReceipt} className="w-4 h-4 mr-2" style={{ color: '#22C55E' }} />
          To'lovlar tarixi ({payments.length})
        </h2>
        {sortedPayments.length === 0 ? (
          <EmptyState icon={faReceipt} title="Hali to'lovlar yo'q" />
        ) : (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            {sortedPayments.map((p, i) => {
              const m = METHOD_CFG[p.payment_method] || { label: p.payment_method, icon: faMoneyBill, color: '#94A3B8' };
              return (
                <div key={p.id} className={`flex items-center gap-4 px-5 py-4 transition-colors ${i > 0 ? 'border-t' : ''}`}
                  style={{ borderColor: 'var(--border-color)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: m.color + '18' }}>
                    <FontAwesomeIcon icon={m.icon} className="w-4 h-4" style={{ color: m.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{fm(p.amount)}</span>
                      <StatusBadge status={p.status} config={PAY_STATUS} />
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {MONTHS[(p.period_month || 1) - 1]} {p.period_year}
                      {p.group_name && ` • ${p.group_name}`}
                      {` • ${m.label}`}
                      {` • ${fd(p.created_at)}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handlePrintReceipt(p)} title="Kvitansiya"
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5">
                      <FontAwesomeIcon icon={faPrint} className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    </button>
                    {canManage && p.status === 'completed' && (
                      <button onClick={() => handleRefund(p.id)} title="Qaytarish"
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-purple-500/10">
                        <FontAwesomeIcon icon={faUndo} className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── MODALS ─── */}
      <PayModal
        isOpen={showPay}
        onClose={() => setShowPay(false)}
        student={student}
        groups={groups}
        debt={debt}
        defaultGroup={payDefaults.defaultGroup}
        defaultMonth={payDefaults.defaultMonth}
        defaultYear={payDefaults.defaultYear}
        onSuccess={loadAll}
      />

      <DiscountModal
        isOpen={showDiscount}
        onClose={() => setShowDiscount(false)}
        studentId={id}
        onSuccess={loadAll}
      />
    </div>
  );
}
