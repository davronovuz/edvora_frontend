import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine, faArrowDown, faArrowUp, faExclamationTriangle,
  faSearch, faCheck, faTimes, faMoneyBill, faMoneyBillWave,
  faCreditCard, faMobileAlt, faUserGraduate, faReceipt,
} from '@fortawesome/free-solid-svg-icons';
import { financeDashboardService } from '@/services/finance';
import { billingInvoicesService } from '@/services/billing';
import { studentsService } from '@/services/students';
import { unwrap } from '@/services/api';
import { usePaymentsList, useCreatePayment } from '@/hooks/queries/usePayments';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatMoney, formatMonth } from '@/utils/format';
import { notify } from '@/lib/notify';

const METHOD_CONFIG = {
  cash:  { label: 'Naqd',  icon: faMoneyBillWave, color: '#22C55E' },
  card:  { label: 'Karta', icon: faCreditCard,    color: '#3B82F6' },
  payme: { label: 'Payme', icon: faMobileAlt,     color: '#00CCCC' },
  click: { label: 'Click', icon: faMobileAlt,     color: '#F97316' },
};

export default function MoliyaDashboard() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear  = now.getFullYear();
  const qc = useQueryClient();

  // ── Finance summary ────────────────────────────────────────────────────────
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['finance', 'summary', currentMonth, currentYear],
    queryFn: async () => unwrap(await financeDashboardService.summary({ month: currentMonth, year: currentYear })),
  });

  // ── Recent payments ────────────────────────────────────────────────────────
  const { data: recentData } = usePaymentsList({ per_page: 10, ordering: '-created_at' });
  const recentPayments = recentData?.items ?? [];

  // ── Quick payment state ────────────────────────────────────────────────────
  const [phoneSearch, setPhoneSearch]       = useState('');
  const debouncedPhone                       = useDebouncedValue(phoneSearch, 400);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDropdown, setShowDropdown]     = useState(false);
  const [amount, setAmount]                 = useState('');
  const [method, setMethod]                 = useState('cash');
  const searchRef                           = useRef(null);

  // Student autocomplete
  const { data: foundStudents = [] } = useQuery({
    queryKey: ['students', 'quick-search', debouncedPhone],
    queryFn: async () => {
      const res = await studentsService.getAll({ search: debouncedPhone, per_page: 5 });
      const body = unwrap(res);
      const list = Array.isArray(body) ? body : (body?.results ?? body?.data ?? []);
      return Array.isArray(list) ? list : [];
    },
    enabled: debouncedPhone.length >= 3 && !selectedStudent,
  });

  useEffect(() => {
    if (debouncedPhone.length >= 3 && !selectedStudent) setShowDropdown(true);
    else setShowDropdown(false);
  }, [debouncedPhone, selectedStudent]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Open invoices for selected student
  const { data: openInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['billing', 'invoices', 'open', selectedStudent?.id],
    queryFn: async () => {
      const res = await billingInvoicesService.getAll({
        student: selectedStudent.id,
        status: 'unpaid',
        ordering: 'period_year,period_month',
      });
      const body = unwrap(res);
      const list = Array.isArray(body) ? body : (body?.results ?? body?.data ?? []);
      return (Array.isArray(list) ? list : []).map(inv => ({
        ...inv,
        _remaining: Math.max(0, Number(inv.total_amount ?? inv.amount ?? 0) - Number(inv.paid_amount ?? 0)),
      }));
    },
    enabled: !!selectedStudent?.id,
  });

  const totalDebt = openInvoices.reduce((s, i) => s + i._remaining, 0);

  // Sync amount input to total debt when student/invoices load
  useEffect(() => {
    if (!selectedStudent) return;
    if (totalDebt > 0) setAmount(String(totalDebt));
    else if (!invoicesLoading) setAmount('');
  }, [totalDebt, selectedStudent, invoicesLoading]);

  const createPayment = useCreatePayment();

  const selectStudent = (s) => {
    setSelectedStudent(s);
    setPhoneSearch(s.phone || `${s.first_name} ${s.last_name}`);
    setShowDropdown(false);
  };

  const clearStudent = () => {
    setSelectedStudent(null);
    setPhoneSearch('');
    setAmount('');
    setMethod('cash');
  };

  const handlePayAll = async () => {
    if (!selectedStudent) { notify.warning("O'quvchini tanlang"); return; }
    const sum = Number(amount);
    if (!sum || sum <= 0) { notify.warning("Summa kiritilmagan"); return; }
    try {
      await createPayment.mutateAsync({
        student: selectedStudent.id,
        amount: sum,
        payment_method: method,
        period_month: currentMonth,
        period_year: currentYear,
        note: '',
      });
      qc.invalidateQueries({ queryKey: ['finance', 'summary'] });
      clearStudent();
    } catch {}
  };

  const handlePayInvoice = async (inv) => {
    if (!selectedStudent || inv._remaining <= 0) return;
    try {
      await createPayment.mutateAsync({
        student: selectedStudent.id,
        group: inv.group,
        amount: inv._remaining,
        payment_method: method,
        period_month: inv.period_month,
        period_year: inv.period_year,
        note: '',
      });
      qc.invalidateQueries({ queryKey: ['finance', 'summary'] });
      qc.invalidateQueries({ queryKey: ['billing', 'invoices', 'open', selectedStudent.id] });
    } catch {}
  };

  const netProfit = Number(summary?.net_profit ?? 0);
  const isProfit  = netProfit >= 0;

  return (
    <div className="space-y-6">

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Bu oy daromad',
            hint: formatMonth(currentMonth, currentYear),
            value: summary?.total_income ?? 0,
            prefix: '',
            color: '#22C55E',
            bg: 'rgba(34,197,94,0.06)',
            border: 'rgba(34,197,94,0.2)',
            icon: faChartLine,
          },
          {
            label: 'Bu oy xarajat',
            hint: summary?.total_salary ? `Ish haqi: ${formatMoney(summary.total_salary)}` : undefined,
            value: summary?.total_expense ?? 0,
            prefix: '',
            color: '#EF4444',
            bg: 'rgba(239,68,68,0.06)',
            border: 'rgba(239,68,68,0.2)',
            icon: faArrowDown,
          },
          {
            label: 'Sof foyda',
            hint: isProfit ? 'Ijobiy balans' : 'Manfiy balans',
            value: Math.abs(netProfit),
            prefix: isProfit ? '+' : '−',
            color: isProfit ? '#3B82F6' : '#EF4444',
            bg:    isProfit ? 'rgba(59,130,246,0.06)' : 'rgba(239,68,68,0.06)',
            border: isProfit ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)',
            icon: isProfit ? faArrowUp : faArrowDown,
          },
          {
            label: 'Umumiy qarz',
            hint: "To'lanmagan invoicelar",
            value: summary?.total_debt ?? 0,
            prefix: '',
            color: '#EF4444',
            bg: 'rgba(239,68,68,0.06)',
            border: 'rgba(239,68,68,0.2)',
            icon: faExclamationTriangle,
          },
        ].map(card => (
          <div
            key={card.label}
            className="card p-5 border transition-all hover:shadow-md"
            style={{ backgroundColor: card.bg, borderColor: card.border }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: card.color + '18' }}
              >
                <FontAwesomeIcon icon={card.icon} className="w-5 h-5" style={{ color: card.color }} />
              </div>
              {summaryLoading && (
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: card.color, borderTopColor: 'transparent' }} />
              )}
            </div>
            <div className="text-2xl font-bold mb-1 truncate" style={{ color: card.color }}>
              {summaryLoading ? '—' : `${card.prefix}${formatMoney(card.value)}`}
            </div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{card.label}</div>
            {card.hint && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{card.hint}</div>}
          </div>
        ))}
      </div>

      {/* ── QUICK PAYMENT ── */}
      <div className="card p-6">
        <h2 className="text-base font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}
          >
            <FontAwesomeIcon icon={faMoneyBill} className="w-3.5 h-3.5" style={{ color: '#22C55E' }} />
          </span>
          Tez to'lov qabul qilish
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left: student search + debt list */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              O'quvchi (telefon yoki ism)
            </label>
            <div ref={searchRef} className="relative">
              <div className="relative">
                <FontAwesomeIcon
                  icon={selectedStudent ? faUserGraduate : faSearch}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: selectedStudent ? '#22C55E' : 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  value={phoneSearch}
                  onChange={e => {
                    setPhoneSearch(e.target.value);
                    if (selectedStudent) setSelectedStudent(null);
                  }}
                  onFocus={() => { if (debouncedPhone.length >= 3 && !selectedStudent) setShowDropdown(true); }}
                  placeholder="Telefon raqam yoki ism..."
                  className="w-full h-12 pl-10 pr-10 rounded-xl border bg-transparent text-sm"
                  style={{
                    borderColor: selectedStudent ? '#22C55E' : 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
                {(phoneSearch || selectedStudent) && (
                  <button
                    onClick={clearStudent}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                  </button>
                )}
              </div>

              {/* Autocomplete dropdown */}
              {showDropdown && foundStudents.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-lg z-50 overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                >
                  {foundStudents.map(s => (
                    <button
                      key={s.id}
                      onMouseDown={() => selectStudent(s)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}
                      >
                        {(s.first_name?.[0] || '') + (s.last_name?.[0] || '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {s.first_name} {s.last_name}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.phone || ''}</div>
                      </div>
                      {s.has_debt && (
                        <span
                          className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
                        >
                          Qarzdor
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {showDropdown && foundStudents.length === 0 && debouncedPhone.length >= 3 && !selectedStudent && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-md z-50 px-4 py-3 text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                >
                  O'quvchi topilmadi
                </div>
              )}
            </div>

            {/* Selected student + invoices */}
            {selectedStudent && (
              <div className="mt-4 space-y-3">
                {/* Student badge */}
                <div
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E' }}
                  >
                    {(selectedStudent.first_name?.[0] || '') + (selectedStudent.last_name?.[0] || '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedStudent.phone}</div>
                  </div>
                  {totalDebt > 0 && (
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold" style={{ color: '#EF4444' }}>{formatMoney(totalDebt)}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>jami qarz</div>
                    </div>
                  )}
                </div>

                {/* Invoice list */}
                {invoicesLoading ? (
                  <div className="flex items-center gap-2 py-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} />
                    Qarzlar yuklanmoqda...
                  </div>
                ) : openInvoices.length === 0 ? (
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                    style={{ backgroundColor: 'rgba(34,197,94,0.06)', color: '#22C55E' }}
                  >
                    <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                    Qarzi yo'q — hisob-kitob tozalangan
                  </div>
                ) : (
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                    {openInvoices.map((inv, i) => (
                      <div
                        key={inv.id ?? i}
                        className="flex items-center justify-between px-4 py-3"
                        style={{
                          borderBottom: i < openInvoices.length - 1 ? '1px solid var(--border-color)' : 'none',
                          backgroundColor: 'var(--bg-secondary)',
                        }}
                      >
                        <div>
                          <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {inv.group_name || 'Guruh'}
                          </div>
                          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {formatMonth(inv.period_month, inv.period_year)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold" style={{ color: '#EF4444' }}>
                            {formatMoney(inv._remaining)}
                          </span>
                          <button
                            onClick={() => handlePayInvoice(inv)}
                            disabled={createPayment.isPending || inv._remaining <= 0}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40"
                            style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }}
                            title="Bu qarzni to'lash"
                          >
                            <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {openInvoices.length > 1 && (
                      <div
                        className="flex items-center justify-between px-4 py-3"
                        style={{ backgroundColor: 'rgba(239,68,68,0.04)', borderTop: '1px solid rgba(239,68,68,0.15)' }}
                      >
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          Jami qarz
                        </span>
                        <span className="text-base font-bold" style={{ color: '#EF4444' }}>
                          {formatMoney(totalDebt)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: amount + method + submit */}
          <div className="flex flex-col gap-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Summa (so'm)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handlePayAll(); }}
                  placeholder="0"
                  min="0"
                  className="w-full h-12 px-4 pr-16 rounded-xl border bg-transparent text-sm font-bold"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
                <span
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                >
                  so'm
                </span>
              </div>
              {totalDebt > 0 && amount !== String(totalDebt) && (
                <button
                  onClick={() => setAmount(String(totalDebt))}
                  className="mt-1.5 text-xs font-medium hover:underline"
                  style={{ color: '#F97316' }}
                >
                  Butun qarz: {formatMoney(totalDebt)}
                </button>
              )}
            </div>

            {/* Method selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                To'lov usuli
              </label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(METHOD_CONFIG).map(([key, m]) => (
                  <button
                    key={key}
                    onClick={() => setMethod(key)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all hover:scale-[1.02]"
                    style={{
                      borderColor: method === key ? m.color : 'var(--border-color)',
                      backgroundColor: method === key ? m.color + '10' : 'transparent',
                    }}
                  >
                    <FontAwesomeIcon icon={m.icon} className="w-5 h-5" style={{ color: method === key ? m.color : 'var(--text-muted)' }} />
                    <span className="text-[11px] font-medium" style={{ color: method === key ? m.color : 'var(--text-muted)' }}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handlePayAll}
              disabled={!selectedStudent || !amount || Number(amount) <= 0 || createPayment.isPending}
              className="w-full h-14 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-xl mt-auto"
              style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', boxShadow: '0 4px 14px rgba(34,197,94,0.35)' }}
            >
              {createPayment.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faMoneyBillWave} className="w-5 h-5" />
                  {amount && Number(amount) > 0
                    ? `${formatMoney(Number(amount))} qabul qilish`
                    : "To'lov qabul qilish"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── RECENT PAYMENTS ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(249,115,22,0.12)' }}
            >
              <FontAwesomeIcon icon={faReceipt} className="w-3.5 h-3.5" style={{ color: '#F97316' }} />
            </span>
            Oxirgi to'lovlar
          </h2>
          <Link
            to="/app/moliya/payments"
            className="text-sm font-semibold hover:underline"
            style={{ color: '#F97316' }}
          >
            Barcha to'lovlar →
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {['Sana', "O'quvchi", 'Summa', 'Usul', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>
                    To'lovlar topilmadi
                  </td>
                </tr>
              ) : recentPayments.map(p => {
                const m = METHOD_CONFIG[p.payment_method];
                const isOk = p.status === 'completed' || p.status === 'paid';
                return (
                  <tr
                    key={p.id}
                    className="border-b hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {p.created_at
                        ? new Date(p.created_at).toLocaleDateString('uz-UZ')
                        : (p.date || '—')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {p.student_name || p.student}
                      </div>
                      {p.group_name && (
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.group_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: '#22C55E' }}>
                      {formatMoney(p.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {m && <FontAwesomeIcon icon={m.icon} className="w-3.5 h-3.5" style={{ color: m.color }} />}
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {m?.label || p.payment_method}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: isOk ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                          color: isOk ? '#22C55E' : '#EAB308',
                        }}
                      >
                        {isOk ? 'Qabul qilindi' : (p.status || 'Kutilmoqda')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
