import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faUser, faUsers, faClipboardCheck, faMoneyBill, faHistory,
  faCopy, faEdit, faPhone, faMapMarkerAlt, faBirthdayCake, faCalendarAlt,
  faCheckCircle, faTimesCircle, faClock, faShieldAlt, faExchangeAlt,
  faExternalLinkAlt, faTag, faArrowRight, faStickyNote,
} from '@fortawesome/free-solid-svg-icons';
import { faSnowflake } from '@fortawesome/free-solid-svg-icons';
import {
  useStudent,
  useStudentGroups,
  useStudentProgress,
  useStudentTransferHistory,
} from '@/hooks/queries/useStudents';
import { usePaymentsByStudent } from '@/hooks/queries/usePayments';
import { billingInvoicesService } from '@/services/billing';
import { unwrap } from '@/services/api';
import { notify } from '@/lib/notify';
import { formatMoney, formatDate, formatMonth } from '@/utils/format';

// ─── constants ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'general',    label: 'Umumiy',   icon: faUser },
  { key: 'groups',     label: 'Guruhlar', icon: faUsers },
  { key: 'attendance', label: 'Davomat',  icon: faClipboardCheck },
  { key: 'finance',    label: 'Moliya',   icon: faMoneyBill },
  { key: 'history',    label: 'Tarix',    icon: faHistory },
];

const STATUS_CONFIG = {
  active:   { label: 'Faol',         color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  frozen:   { label: 'Muzlatilgan',  color: '#06B6D4', bg: 'rgba(6,182,212,0.12)', icon: faSnowflake },
  archived: { label: 'Arxivlangan', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  inactive: { label: 'Nofaol',      color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  dropped:  { label: 'Chiqib ketgan', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  graduated:{ label: 'Bitirgan',    color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
};

const ATT_STATUS = {
  present: { label: 'Keldi',    color: '#22C55E', icon: faCheckCircle },
  absent:  { label: 'Kelmadi', color: '#EF4444', icon: faTimesCircle },
  late:    { label: 'Kechikdi', color: '#EAB308', icon: faClock },
  excused: { label: 'Sababli', color: '#3B82F6', icon: faShieldAlt },
};

const DAY_LABELS = { 0: 'Du', 1: 'Se', 2: 'Ch', 3: 'Pa', 4: 'Ju', 5: 'Sh', 6: 'Ya' };

function getInitials(f, l) {
  return `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase();
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => notify.success("Nusxalandi"));
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ lines = 4 }) {
  return (
    <div className="p-5 space-y-3 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', width: `${60 + (i % 3) * 15}%` }} />
      ))}
    </div>
  );
}

// ─── Tab panels ───────────────────────────────────────────────────────────────
function GeneralTab({ student, onEdit }) {
  const fields = [
    { icon: faPhone,       label: 'Telefon',       value: student.phone, copy: true },
    { icon: faBirthdayCake, label: "Tug'ilgan sana", value: formatDate(student.birth_date) },
    { icon: faMapMarkerAlt, label: 'Manzil',         value: student.address },
    { icon: faUser,        label: 'Jinsi',           value: student.gender === 'male' ? 'Erkak' : student.gender === 'female' ? 'Ayol' : null },
    { icon: faCalendarAlt, label: "Qo'shilgan",      value: formatDate(student.created_at) },
    { icon: faPhone,       label: 'Ota-ona telefon', value: student.parent_phone, copy: true },
    { icon: faUser,        label: 'Ota-ona ismi',    value: student.parent_name },
  ].filter(f => f.value && f.value !== '—');

  return (
    <div className="p-5 space-y-5">
      {/* Fields */}
      <div className="space-y-3">
        {fields.map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <FontAwesomeIcon icon={f.icon} className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>{f.label}</div>
              <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{f.value}</div>
            </div>
            {f.copy && (
              <button onClick={() => copyText(f.value)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors flex-shrink-0">
                <FontAwesomeIcon icon={faCopy} className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Tags */}
      {student.tags?.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <FontAwesomeIcon icon={faTag} className="w-3 h-3" /> Teg'lar
          </div>
          <div className="flex flex-wrap gap-1.5">
            {student.tags.map(tag => (
              <span key={tag.id ?? tag} className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                {tag.name ?? tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {student.notes && (
        <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <FontAwesomeIcon icon={faStickyNote} className="w-3 h-3" /> Izoh
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{student.notes}</p>
        </div>
      )}

      {/* Edit */}
      <button
        onClick={onEdit}
        className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-medium transition-all hover:bg-black/5"
        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
      >
        <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
        Tahrirlash
      </button>
    </div>
  );
}

function GroupsTab({ studentId }) {
  const { data: groups = [], isLoading } = useStudentGroups(studentId);
  if (isLoading) return <Skeleton lines={6} />;
  if (!groups.length) return <EmptyState icon={faUsers} text="Guruhlar topilmadi" />;
  return (
    <div className="p-5 space-y-3">
      {groups.map((g, i) => (
        <div key={g.id ?? i} className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{g.name || g.group_name}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {g.course_name && <Info label="Kurs" value={g.course_name} />}
            {g.teacher_name && <Info label="O'qituvchi" value={g.teacher_name} />}
            {(g.schedule?.days?.length > 0) && (
              <Info label="Jadval" value={g.schedule.days.map(d => DAY_LABELS[d] ?? d).join(', ')} />
            )}
            {g.status && (
              <Info label="Status" value={g.status === 'active' ? 'Faol' : g.status} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AttendanceTab({ studentId }) {
  const { data: progress, isLoading } = useStudentProgress(studentId);
  if (isLoading) return <Skeleton lines={8} />;
  if (!progress) return <EmptyState icon={faClipboardCheck} text="Davomat ma'lumoti yo'q" />;

  const rate = progress.attendance_rate ?? progress.rate ?? 0;
  const rateColor = rate >= 80 ? '#22C55E' : rate >= 60 ? '#EAB308' : '#EF4444';
  const records = progress.recent_records ?? progress.attendances ?? [];

  return (
    <div className="p-5 space-y-5">
      {/* Rate */}
      <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-secondary)', border: `1px solid ${rateColor}20` }}>
        <div className="text-4xl font-bold mb-1" style={{ color: rateColor }}>{Math.round(rate)}%</div>
        <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Davomat foizi</div>
        <div className="mt-3 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, rate)}%`, backgroundColor: rateColor }} />
        </div>
      </div>

      {/* Stats grid */}
      {(progress.present_count != null || progress.absent_count != null) && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { key: 'present', label: 'Keldi',    count: progress.present_count ?? 0, color: '#22C55E' },
            { key: 'absent',  label: 'Kelmadi', count: progress.absent_count  ?? 0, color: '#EF4444' },
            { key: 'late',    label: 'Kechikdi', count: progress.late_count    ?? 0, color: '#EAB308' },
            { key: 'excused', label: 'Sababli',  count: progress.excused_count ?? 0, color: '#3B82F6' },
          ].map(s => (
            <div key={s.key} className="rounded-xl p-3 text-center" style={{ backgroundColor: s.color + '10' }}>
              <div className="text-lg font-bold" style={{ color: s.color }}>{s.count}</div>
              <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent */}
      {records.length > 0 && (
        <div>
          <SectionLabel>Oxirgi darslar</SectionLabel>
          <div className="space-y-2">
            {records.slice(0, 10).map((r, i) => {
              const cfg = ATT_STATUS[r.status] ?? {};
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(r.date)}</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: (cfg.color ?? '#94A3B8') + '15', color: cfg.color ?? '#94A3B8' }}>
                    {cfg.icon && <FontAwesomeIcon icon={cfg.icon} className="w-3 h-3" />}
                    {cfg.label ?? r.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FinanceTab({ studentId, student }) {
  const { data: payments = [], isLoading: paymentsLoading } = usePaymentsByStudent(studentId);

  const { data: openInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['billing', 'invoices', 'open', studentId],
    queryFn: async () => {
      const res = await billingInvoicesService.getAll({ student: studentId, status: 'unpaid', ordering: 'period_year,period_month' });
      const body = unwrap(res);
      const list = Array.isArray(body) ? body : (body?.results ?? body?.data ?? []);
      return (Array.isArray(list) ? list : []).map(inv => ({
        ...inv,
        _remaining: Math.max(0, Number(inv.total_amount ?? inv.amount ?? 0) - Number(inv.paid_amount ?? 0)),
      }));
    },
    enabled: !!studentId,
  });

  const balance = Number(student?.balance ?? 0);
  const isDebt  = balance < 0;

  return (
    <div className="p-5 space-y-5">
      {/* Balance */}
      <div className="p-4 rounded-xl text-center" style={{ backgroundColor: isDebt ? 'rgba(239,68,68,0.06)' : balance > 0 ? 'rgba(34,197,94,0.06)' : 'var(--bg-secondary)', border: `1px solid ${isDebt ? 'rgba(239,68,68,0.2)' : balance > 0 ? 'rgba(34,197,94,0.2)' : 'var(--border-color)'}` }}>
        <div className="text-3xl font-bold" style={{ color: isDebt ? '#EF4444' : balance > 0 ? '#22C55E' : 'var(--text-muted)' }}>
          {isDebt ? '−' : ''}{formatMoney(Math.abs(balance))}
        </div>
        <div className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
          {isDebt ? 'Qarz' : balance > 0 ? "Ortiqcha to'lov" : 'Hisob tozalangan'}
        </div>
      </div>

      {/* Open invoices */}
      {!invoicesLoading && openInvoices.length > 0 && (
        <div>
          <SectionLabel>To'lanmagan invoicelar ({openInvoices.length})</SectionLabel>
          <div className="space-y-2">
            {openInvoices.map((inv, i) => (
              <div key={inv.id ?? i} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{inv.group_name || 'Guruh'}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatMonth(inv.period_month, inv.period_year)}</div>
                </div>
                <span className="text-sm font-bold" style={{ color: '#EF4444' }}>{formatMoney(inv._remaining)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent payments */}
      {paymentsLoading ? <Skeleton lines={4} /> : payments.length > 0 ? (
        <div>
          <SectionLabel>Oxirgi to'lovlar</SectionLabel>
          <div className="space-y-2">
            {payments.slice(0, 10).map((p, i) => (
              <div key={p.id ?? i} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatMoney(p.amount)}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(p.created_at || p.date)} · {p.payment_method || ''}
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
                  Qabul qilindi
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        !paymentsLoading && <EmptyState icon={faMoneyBill} text="To'lovlar topilmadi" small />
      )}

      {/* Link to full finance page */}
      <Link
        to={`/app/students/${studentId}/finance`}
        className="flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-medium transition-all hover:bg-black/5"
        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
      >
        <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3.5 h-3.5" />
        To'liq moliya sahifasi
        <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function HistoryTab({ studentId }) {
  const { data: transfers = [], isLoading } = useStudentTransferHistory(studentId);
  if (isLoading) return <Skeleton lines={5} />;
  if (!transfers.length) return <EmptyState icon={faHistory} text="Transfer tarixi topilmadi" />;
  return (
    <div className="p-5 space-y-3">
      {transfers.map((t, i) => (
        <div key={t.id ?? i} className="relative flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10" style={{ backgroundColor: 'rgba(249,115,22,0.12)' }}>
              <FontAwesomeIcon icon={faExchangeAlt} className="w-3.5 h-3.5" style={{ color: '#F97316' }} />
            </div>
            {i < transfers.length - 1 && (
              <div className="w-0.5 flex-1 mt-1" style={{ backgroundColor: 'var(--border-color)', minHeight: 20 }} />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {t.from_group_name || t.from_group || '—'}
              {' → '}
              {t.to_group_name || t.to_group || '—'}
            </div>
            {t.reason && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.reason}</div>}
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDate(t.created_at || t.date)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── small helpers ────────────────────────────────────────────────────────────
function Info({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{value}</div>
    </div>
  );
}
function SectionLabel({ children }) {
  return <div className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>{children}</div>;
}
function EmptyState({ icon, text, small = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${small ? 'py-6' : 'py-12'}`}>
      <FontAwesomeIcon icon={icon} className="w-8 h-8 mb-2" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{text}</div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function StudentSheet({ studentId, open, onClose, onEdit }) {
  const [activeTab, setActiveTab] = useState('general');

  const { data: student, isLoading } = useStudent(studentId);

  // Reset tab on new student
  useEffect(() => {
    if (open) setActiveTab('general');
  }, [studentId, open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const statusCfg = STATUS_CONFIG[student?.status] ?? STATUS_CONFIG.active;

  const content = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col shadow-2xl"
        style={{
          width: 'min(480px, 100vw)',
          backgroundColor: 'var(--bg-primary)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease-out',
          borderLeft: '1px solid var(--border-color)',
        }}
      >
        {/* ── Header ── */}
        <div className="flex-shrink-0 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-start gap-3 px-5 pt-5 pb-4">
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
              style={{ backgroundColor: student?.gender === 'female' ? '#EC4899' : '#1B365D' }}
            >
              {isLoading ? '?' : getInitials(student?.first_name, student?.last_name)}
            </div>

            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="space-y-1.5 animate-pulse">
                  <div className="h-5 rounded-lg w-40" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
                  <div className="h-3.5 rounded-lg w-28" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold truncate leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {student?.first_name} {student?.last_name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                    >
                      {statusCfg.label}
                    </span>
                    {student?.phone && (
                      <button
                        onClick={() => copyText(student.phone)}
                        className="flex items-center gap-1 text-xs hover:underline"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <FontAwesomeIcon icon={faPhone} className="w-2.5 h-2.5" />
                        {student.phone}
                        <FontAwesomeIcon icon={faCopy} className="w-2.5 h-2.5 ml-0.5" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>

          {/* ── Tabs ── */}
          <div className="flex overflow-x-auto px-3 pb-0" style={{ scrollbarWidth: 'none' }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 flex-shrink-0"
                style={{
                  borderBottomColor: activeTab === tab.key ? '#F97316' : 'transparent',
                  color: activeTab === tab.key ? '#F97316' : 'var(--text-muted)',
                }}
              >
                <FontAwesomeIcon icon={tab.icon} className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto">
          {!studentId ? null : (
            <>
              {activeTab === 'general' && (
                isLoading
                  ? <Skeleton lines={6} />
                  : student
                  ? <GeneralTab student={student} onEdit={() => { onClose(); onEdit?.(student); }} />
                  : <EmptyState icon={faUser} text="Ma'lumot topilmadi" />
              )}
              {activeTab === 'groups'     && <GroupsTab     studentId={studentId} />}
              {activeTab === 'attendance' && <AttendanceTab studentId={studentId} />}
              {activeTab === 'finance'    && <FinanceTab    studentId={studentId} student={student} />}
              {activeTab === 'history'    && <HistoryTab    studentId={studentId} />}
            </>
          )}
        </div>

        {/* ── Footer: link to full page ── */}
        {!isLoading && student && (
          <div className="flex-shrink-0 border-t p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <Link
              to={`/app/students/${studentId}`}
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-sm font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: '#1B365D', color: 'white' }}
            >
              <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3.5 h-3.5" />
              To'liq sahifani ochish
            </Link>
          </div>
        )}
      </div>
    </>
  );

  return createPortal(content, document.body);
}
