import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight, faPhone, faEnvelope, faMapMarkerAlt, faCalendarAlt,
  faUsers, faWallet, faExclamationTriangle, faUser, faInfoCircle,
  faUserGraduate, faLayerGroup, faChalkboardTeacher, faClock,
  faMoneyBillWave, faCreditCard, faMobileAlt, faExchangeAlt,
  faCheckCircle, faTimesCircle, faSnowflake, faPlus, faReceipt,
  faFileInvoiceDollar, faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';
import { studentsService } from '@/services/students';
import { paymentsService } from '@/services/payments';
import { billingInvoicesService } from '@/services/billing';
import { attendanceService } from '@/services/attendance';
import { unwrap, unwrapList } from '@/services/api';
import { formatMoney, formatDate, formatMonth } from '@/utils/format';
import { useCreatePayment } from '@/hooks/queries/usePayments';
import { notify } from '@/lib/notify';
import Modal from '@/components/ui/Modal';

// ─── Config ─────────────────────────────────────────────────
const STATUS_CFG = {
  active:    { label: 'Faol',           color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  frozen:    { label: 'Muzlatilgan',    color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
  graduated: { label: 'Bitirgan',       color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  dropped:   { label: 'Chiqib ketgan',  color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  archived:  { label: 'Arxivlangan',    color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  inactive:  { label: 'Nofaol',         color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
};

const METHOD_CFG = {
  cash:     { label: 'Naqd',     icon: faMoneyBillWave, color: '#22C55E' },
  card:     { label: 'Karta',    icon: faCreditCard,    color: '#3B82F6' },
  transfer: { label: "O'tkazma", icon: faExchangeAlt,   color: '#8B5CF6' },
  payme:    { label: 'Payme',    icon: faMobileAlt,     color: '#00CCCC' },
  click:    { label: 'Click',    icon: faMobileAlt,     color: '#F97316' },
};

const PAY_STATUS = {
  completed: { label: "To'langan",   color: '#22C55E' },
  pending:   { label: 'Kutilmoqda',  color: '#EAB308' },
  cancelled: { label: 'Bekor',       color: '#EF4444' },
  refunded:  { label: 'Qaytarilgan', color: '#8B5CF6' },
};

const fm = (v) => formatMoney(v);
const fd = (d) => (d ? formatDate(d) : '—');

// ─── Avatar ──────────────────────────────────────────────────
function Avatar({ name = '', size = 40 }) {
  const parts = name.trim().split(' ').filter(Boolean);
  const initials = parts.slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 40;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, hsl(${20 + hue} 85% 55%), hsl(${10 + hue} 85% 45%))`,
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.34, letterSpacing: 0.5,
    }}>{initials || '?'}</div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────
function Tabs({ tabs, value, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
      {tabs.map(t => {
        const active = value === t.value;
        return (
          <button key={t.value} onClick={() => onChange(t.value)}
            style={{
              padding: '10px 16px', background: 'transparent', border: 'none',
              borderBottom: `2px solid ${active ? 'var(--primary-600)' : 'transparent'}`,
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer', marginBottom: -1,
              whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
            {t.label}
            {t.count != null && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 999,
                background: active ? 'rgba(249,115,22,0.12)' : 'var(--bg-tertiary)',
                color: active ? 'var(--primary-600)' : 'var(--text-muted)',
              }}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── StatCard ────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: color + '1f', color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FontAwesomeIcon icon={icon} style={{ width: 13, height: 13 }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-muted)' }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{value}</p>
      {sub && <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

// ─── ProfileTab ───────────────────────────────────────────────
function ProfileTab({ student }) {
  const fields = [
    { icon: faPhone,       label: 'Telefon',         value: student.phone },
    { icon: faEnvelope,    label: 'Email',           value: student.email },
    { icon: faCalendarAlt, label: "Tug'ilgan sana",  value: student.birth_date ? formatDate(student.birth_date) : null },
    { icon: faUser,        label: 'Jinsi',           value: student.gender === 'male' ? 'Erkak' : student.gender === 'female' ? 'Ayol' : null },
    { icon: faMapMarkerAlt,label: 'Manzil',          value: student.address },
    { icon: faTelegram,    label: 'Telegram',        value: student.telegram_username ? `@${student.telegram_username}` : null },
  ].filter(f => f.value);

  const parentFields = [
    { icon: faUser,  label: 'Ota-ona ismi',     value: student.parent_name },
    { icon: faPhone, label: 'Ota-ona telefoni', value: student.parent_phone },
  ].filter(f => f.value);

  const Card = ({ title, items }) => (
    <div className="card" style={{ padding: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', marginBottom: 16 }}>{title}</p>
      {items.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'var(--bg-tertiary)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesomeIcon icon={f.icon} style={{ width: 13, height: 13 }} />
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{f.label}</p>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}>{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>Ma'lumot kiritilmagan</p>
      )}
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
      <Card title="Shaxsiy ma'lumotlar" items={fields} />
      {parentFields.length > 0 && <Card title="Ota-ona ma'lumotlari" items={parentFields} />}
      {student.notes && (
        <div className="card" style={{ padding: 20, gridColumn: '1 / -1' }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', marginBottom: 10 }}>Izoh</p>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{student.notes}</p>
        </div>
      )}
    </div>
  );
}

// ─── GroupsTab ────────────────────────────────────────────────
function GroupsTab({ groups, navigate }) {
  if (groups.length === 0) {
    return <EmptyBox icon={faLayerGroup} title="Guruhlar yo'q" text="Bu o'quvchi hech qaysi guruhga qo'shilmagan" />;
  }
  const dayNames = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
      {groups.map(g => (
        <div key={g.id} className="card" onClick={() => navigate(`/app/groups/${g.id}`)}
          style={{ padding: 16, cursor: 'pointer', borderLeft: '4px solid var(--primary-600)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{g.name}</p>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap',
              background: g.status === 'active' ? 'rgba(34,197,94,0.12)' : 'var(--bg-tertiary)',
              color: g.status === 'active' ? '#22C55E' : 'var(--text-muted)',
            }}>{g.status === 'active' ? 'Faol' : g.status}</span>
          </div>
          {g.course_name && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{g.course_name}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 11.5, color: 'var(--text-secondary)' }}>
            {g.teacher_name && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FontAwesomeIcon icon={faChalkboardTeacher} style={{ width: 11 }} />{g.teacher_name}</span>}
            {(g.start_time || g.end_time) && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FontAwesomeIcon icon={faClock} style={{ width: 11 }} />{g.start_time?.slice(0, 5)}–{g.end_time?.slice(0, 5)}</span>}
            {g.days?.length > 0 && <span style={{ color: 'var(--text-muted)' }}>{g.days.map(d => dayNames[d]).join(', ')}</span>}
          </div>
          {(g.monthly_price || g.joined_date) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-color)', fontSize: 11.5 }}>
              {g.joined_date && <span style={{ color: 'var(--text-muted)' }}>Qo'shildi: {fd(g.joined_date)}</span>}
              {g.monthly_price ? <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{fm(g.monthly_price)}/oy</span> : null}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── FinanceTab ───────────────────────────────────────────────
function FinanceTab({ invoices, payments, debt, nextPayment, onPay, navigate, studentId }) {
  const openInvoices = invoices
    .filter(i => ['unpaid', 'partial', 'overdue'].includes(i.status))
    .sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0));
  const sortedPayments = [...payments].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Outstanding invoices */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            To'lanmagan hisob-fakturalar {openInvoices.length > 0 && `(${openInvoices.length})`}
          </p>
          <button onClick={() => navigate(`/app/students/${studentId}/finance`)}
            style={{ background: 'transparent', border: 'none', color: 'var(--primary-600)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Oylik tarix <FontAwesomeIcon icon={faChevronRight} style={{ width: 9 }} />
          </button>
        </div>
        {openInvoices.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(34,197,94,0.07)', color: '#16A34A', fontSize: 13 }}>
            <FontAwesomeIcon icon={faCheckCircle} style={{ width: 14 }} /> Qarz yo'q — hammasi to'langan
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {openInvoices.map(inv => {
              const rem = Number(inv.total_amount) - Number(inv.paid_amount || 0);
              return (
                <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ width: 14 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {inv.group_name || 'Guruh'} — {formatMonth(inv.period_month, inv.period_year)}
                    </p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>To'lov muddati: {fd(inv.due_date)}</p>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#EF4444' }}>{fm(rem)}</span>
                </div>
              );
            })}
          </div>
        )}
        <button onClick={onPay}
          style={{
            marginTop: 14, width: '100%', height: 44, borderRadius: 11, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff', fontSize: 14, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 14px rgba(34,197,94,0.32)',
          }}>
          <FontAwesomeIcon icon={faMoneyBillWave} style={{ width: 16 }} /> To'lov qabul qilish
        </button>
      </div>

      {/* Payment history */}
      <div className="card" style={{ padding: 18 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
          To'lovlar tarixi {sortedPayments.length > 0 && `(${sortedPayments.length})`}
        </p>
        {sortedPayments.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '14px 0' }}>Hali to'lov qilinmagan</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sortedPayments.map((p, i) => {
              const m = METHOD_CFG[p.payment_method] || { label: p.payment_method, icon: faMoneyBillWave, color: '#94A3B8' };
              const st = PAY_STATUS[p.status] || { label: p.status, color: '#94A3B8' };
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i ? '1px solid var(--border-color)' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: m.color + '1f', color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FontAwesomeIcon icon={m.icon} style={{ width: 14 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{fm(p.amount)}</p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      {fd(p.created_at)} • {m.label}
                      {p.period_month ? ` • ${formatMonth(p.period_month, p.period_year)} uchun` : ''}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: st.color }}>{st.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AttendanceTab ────────────────────────────────────────────
function AttendanceTab({ attendance }) {
  const stats = attendance?.statistics || attendance || {};
  const rate = stats.rate ?? stats.attendance_rate ?? null;
  const present = stats.present ?? stats.present_count ?? 0;
  const absent = stats.absent ?? stats.absent_count ?? 0;
  const late = stats.late ?? stats.late_count ?? 0;
  const total = stats.total ?? stats.total_count ?? (present + absent + late);
  const records = attendance?.records || attendance?.attendances || attendance?.history || [];

  if (!rate && total === 0 && records.length === 0) {
    return <EmptyBox icon={faChartLine} title="Davomat ma'lumoti yo'q" text="Hali davomat belgilanmagan" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <StatCard label="Davomat" value={rate != null ? `${Math.round(rate)}%` : '—'} icon={faChartLine} color="#8B5CF6" />
        <StatCard label="Kelgan" value={present} icon={faCheckCircle} color="#22C55E" />
        <StatCard label="Kelmagan" value={absent} icon={faTimesCircle} color="#EF4444" />
        <StatCard label="Kechikkan" value={late} icon={faClock} color="#EAB308" />
      </div>
      {records.length > 0 && (
        <div className="card" style={{ padding: 18 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>So'nggi davomat</p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {records.slice(0, 20).map((r, i) => {
              const st = r.status || r.attendance_status;
              const ok = st === 'present' || st === 'came';
              const isLate = st === 'late';
              const color = ok ? '#22C55E' : isLate ? '#EAB308' : '#EF4444';
              const label = ok ? 'Keldi' : isLate ? 'Kechikdi' : 'Kelmadi';
              return (
                <div key={r.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderTop: i ? '1px solid var(--border-color)' : 'none' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {fd(r.date || r.lesson_date || r.created_at)}
                    {r.group_name ? ` • ${r.group_name}` : ''}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EmptyBox ─────────────────────────────────────────────────
function EmptyBox({ icon, title, text }) {
  return (
    <div className="card" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, minHeight: 180, justifyContent: 'center' }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--bg-tertiary)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FontAwesomeIcon icon={icon} style={{ width: 20 }} />
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</p>
      {text && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{text}</p>}
    </div>
  );
}

// ─── PayModal ─────────────────────────────────────────────────
function PayModal({ open, onClose, student, groups, debt, onSuccess }) {
  const now = new Date();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [groupId, setGroupId] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [note, setNote] = useState('');
  const createPayment = useCreatePayment();

  useEffect(() => {
    if (!open) return;
    setAmount(debt > 0 ? String(debt) : '');
    setMethod('cash');
    setGroupId(groups[0]?.id || '');
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
    setNote('');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedGroup = groups.find(g => String(g.id) === String(groupId));

  const submit = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { notify.error('Summani kiriting'); return; }
    try {
      await createPayment.mutateAsync({
        student: student.id,
        amount: num,
        payment_method: method,
        payment_type: 'tuition',
        period_month: month,
        period_year: year,
        note,
        ...(groupId ? { group: groupId } : {}),
      });
      onClose();
      onSuccess();
    } catch { /* hook xatoni ko'rsatadi */ }
  };

  const MONTHS = Array.from({ length: 12 }, (_, i) => ({ v: i + 1, l: formatMonth(i + 1) }));

  return (
    <Modal open={open} onClose={onClose} title="To'lov qabul qilish" size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, background: 'var(--bg-tertiary)' }}>
          <Avatar name={`${student.first_name || ''} ${student.last_name || ''}`} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{student.first_name} {student.last_name}</p>
            {debt > 0 && <p style={{ fontSize: 12, color: '#EF4444' }}>Qarz: {fm(debt)}</p>}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Summa</label>
          <div style={{ position: 'relative' }}>
            <input type="number" autoFocus value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
              style={{ width: '100%', height: 52, padding: '0 56px 0 16px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }} />
            <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-muted)' }}>so'm</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {selectedGroup?.monthly_price ? (
              <button onClick={() => setAmount(String(selectedGroup.monthly_price))}
                style={{ fontSize: 11.5, padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
                1 oy: {fm(selectedGroup.monthly_price)}
              </button>
            ) : null}
            {debt > 0 && (
              <button onClick={() => setAmount(String(debt))}
                style={{ fontSize: 11.5, padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                Butun qarz: {fm(debt)}
              </button>
            )}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>To'lov usuli</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {Object.entries(METHOD_CFG).map(([k, m]) => (
              <button key={k} onClick={() => setMethod(k)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '9px 0',
                  borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${method === k ? m.color : 'var(--border-color)'}`,
                  background: method === k ? m.color + '14' : 'transparent',
                }}>
                <FontAwesomeIcon icon={m.icon} style={{ width: 15, color: method === k ? m.color : 'var(--text-muted)' }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: method === k ? m.color : 'var(--text-muted)' }}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {groups.length > 0 && (
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Guruh</label>
            <select value={groupId} onChange={e => setGroupId(e.target.value)}
              style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: 13 }}>
              <option value="">— Guruhsiz —</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Oy</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: 13 }}>
              {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Yil</label>
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
              style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: 13 }} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Izoh (ixtiyoriy)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: 13, resize: 'none' }} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, height: 46, borderRadius: 11, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
            Bekor
          </button>
          <button onClick={submit} disabled={createPayment.isPending}
            style={{
              flex: 1, height: 46, borderRadius: 11, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff', fontSize: 13.5, fontWeight: 700,
              opacity: createPayment.isPending ? 0.6 : 1,
            }}>
            {createPayment.isPending ? 'Saqlanmoqda...' : 'Qabul qilish'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [groups, setGroups] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('profile');
  const [payOpen, setPayOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, g, p, inv, att] = await Promise.allSettled([
        studentsService.getById(id),
        studentsService.getGroups(id),
        paymentsService.getAll({ student: id, page_size: 200 }),
        billingInvoicesService.getAll({ student: id, page_size: 200 }),
        attendanceService.byStudent({ student_id: id }),
      ]);
      if (s.status === 'fulfilled') setStudent(unwrap(s.value));
      if (g.status === 'fulfilled') setGroups(unwrapList(g.value));
      if (p.status === 'fulfilled') setPayments(unwrapList(p.value));
      if (inv.status === 'fulfilled') setInvoices(unwrapList(inv.value));
      if (att.status === 'fulfilled') setAttendance(unwrap(att.value));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const debt = useMemo(
    () => invoices
      .filter(i => ['unpaid', 'partial', 'overdue'].includes(i.status))
      .reduce((s, i) => s + (Number(i.total_amount) - Number(i.paid_amount || 0)), 0),
    [invoices],
  );

  const nextPayment = useMemo(() => {
    const open = invoices
      .filter(i => ['unpaid', 'partial', 'overdue'].includes(i.status) && i.due_date)
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    return open[0] || null;
  }, [invoices]);

  const totalPaid = useMemo(
    () => payments.filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount || 0), 0),
    [payments],
  );

  const attRate = attendance?.statistics?.rate ?? attendance?.rate ?? null;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(249,115,22,0.2)', borderTopColor: '#F97316', animation: 'spin 600ms linear infinite' }} />
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>O'quvchi topilmadi</p>
        <button onClick={() => navigate('/app/students')} style={{ color: 'var(--primary-600)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
          Ro'yxatga qaytish
        </button>
      </div>
    );
  }

  const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
  const status = STATUS_CFG[student.status] || STATUS_CFG.active;
  const frozen = student.status === 'frozen' || student.is_frozen;

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
        <button onClick={() => navigate('/app/students')}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, fontSize: 12 }}>
          O'quvchilar
        </button>
        <FontAwesomeIcon icon={faChevronRight} style={{ width: 10, height: 10 }} />
        <span style={{ color: 'var(--text-primary)' }}>{fullName}</span>
      </div>

      {/* Header */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <Avatar name={fullName} size={64} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B365D', letterSpacing: -0.4, margin: 0 }}>{fullName}</h1>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: status.bg, color: status.color, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: status.color }} />
                {status.label}
              </span>
              {debt > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.12)', color: '#EF4444', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                  <FontAwesomeIcon icon={faExclamationTriangle} style={{ width: 10 }} />
                  Qarzdor: {fm(debt)}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              {student.phone && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><FontAwesomeIcon icon={faPhone} style={{ width: 12 }} />{student.phone}</span>}
              {groups.length > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><FontAwesomeIcon icon={faUsers} style={{ width: 12 }} />{groups.length} ta guruh</span>}
              {student.created_at && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><FontAwesomeIcon icon={faCalendarAlt} style={{ width: 12 }} />{fd(student.created_at)}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => setPayOpen(true)}
              style={{
                height: 40, padding: '0 18px', borderRadius: 11, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff', fontSize: 13, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
              }}>
              <FontAwesomeIcon icon={faMoneyBillWave} style={{ width: 14 }} /> To'lov qabul qilish
            </button>
          </div>
        </div>

        {frozen && (
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.25)' }}>
            <FontAwesomeIcon icon={faSnowflake} style={{ width: 15, color: '#06B6D4' }} />
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <b style={{ color: '#0891B2' }}>Muzlatilgan</b>
              {student.freeze_start_date ? ` — ${fd(student.freeze_start_date)}` : ''}
              {student.freeze_end_date ? ` → ${fd(student.freeze_end_date)}` : ''}
              {student.freeze_reason ? ` • ${student.freeze_reason}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <StatCard label="Joriy qarz" value={debt > 0 ? fm(debt) : '0'} icon={faExclamationTriangle} color={debt > 0 ? '#EF4444' : '#22C55E'} />
        <StatCard label="Keyingi to'lov" value={nextPayment ? fd(nextPayment.due_date) : '—'}
          sub={nextPayment ? formatMonth(nextPayment.period_month, nextPayment.period_year) : 'Qarz yo\'q'} icon={faCalendarAlt} color="#F97316" />
        <StatCard label="Jami to'langan" value={fm(totalPaid)} icon={faReceipt} color="#22C55E" />
        <StatCard label="Davomat" value={attRate != null ? `${Math.round(attRate)}%` : '—'} icon={faChartLine} color="#8B5CF6" />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onChange={setTab}
        tabs={[
          { value: 'profile',    label: 'Profil' },
          { value: 'groups',     label: 'Guruhlar', count: groups.length || null },
          { value: 'finance',    label: 'Moliya' },
          { value: 'attendance', label: 'Davomat' },
        ]}
      />

      {tab === 'profile'    && <ProfileTab student={student} />}
      {tab === 'groups'     && <GroupsTab groups={groups} navigate={navigate} />}
      {tab === 'finance'    && (
        <FinanceTab invoices={invoices} payments={payments} debt={debt} nextPayment={nextPayment}
          onPay={() => setPayOpen(true)} navigate={navigate} studentId={id} />
      )}
      {tab === 'attendance' && <AttendanceTab attendance={attendance} />}

      <PayModal open={payOpen} onClose={() => setPayOpen(false)} student={student} groups={groups} debt={debt} onSuccess={loadData} />
    </div>
  );
}
