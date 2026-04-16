import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle, faSearch, faPhone, faMoneyBillWave,
  faCreditCard, faMobileAlt, faExchangeAlt, faUserGraduate,
  faEye, faFileInvoiceDollar,
} from '@fortawesome/free-solid-svg-icons';
import { paymentsService } from '@/services/payments';
import { billingInvoicesService } from '@/services/billing';
import { unwrapList } from '@/services/api';
import { formatMoney, formatMonth } from '@/utils/format';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';

const METHOD_CONFIG = {
  cash:     { label: 'Naqd',      icon: faMoneyBillWave, color: '#22C55E' },
  card:     { label: 'Karta',     icon: faCreditCard,    color: '#3B82F6' },
  transfer: { label: "O'tkazma",  icon: faExchangeAlt,   color: '#8B5CF6' },
  payme:    { label: 'Payme',     icon: faMobileAlt,     color: '#00CCCC' },
  click:    { label: 'Click',     icon: faMobileAlt,     color: '#F97316' },
};

// ─── Quick Pay Modal ───────────────────────────────────
function QuickPayModal({ open, onClose, debtor, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    if (!open || !debtor) return;
    setAmount(String(debtor.total_debt || ''));
    setMethod('cash');
    setNote('');
    setSelectedGroup(debtor.groups?.[0] || null);
    loadInvoices();
  }, [open, debtor]);

  const loadInvoices = async () => {
    if (!debtor) return;
    setLoadingInvoices(true);
    try {
      const res = await billingInvoicesService.getAll({
        student: debtor.student_id,
        status: 'unpaid,partial,overdue',
        page_size: 50,
        ordering: 'period_year,period_month',
      });
      setInvoices(unwrapList(res));
    } catch {
      setInvoices([]);
    }
    setLoadingInvoices(false);
  };

  const handleSubmit = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.error("Summani kiriting"); return; }
    setSaving(true);
    try {
      const now = new Date();
      const payload = {
        student: debtor.student_id,
        amount: num,
        payment_method: method,
        payment_type: 'tuition',
        period_month: now.getMonth() + 1,
        period_year: now.getFullYear(),
        note: note || "Qarzdorlar sahifasidan to'lov",
        status: 'completed',
      };
      if (selectedGroup) payload.group = selectedGroup.id;

      await paymentsService.create(payload);
      toast.success("To'lov qabul qilindi!");
      onClose();
      onSuccess?.();
    } catch (e) {
      const msg = e.response?.data?.error?.message
        || e.response?.data?.detail
        || e.response?.data?.non_field_errors?.[0]
        || "To'lov qabul qilinmadi";
      toast.error(msg);
    }
    setSaving(false);
  };

  if (!debtor) return null;

  return (
    <Modal open={open} onClose={onClose} title={`To'lov — ${debtor.student_name}`} size="md">
      <div className="space-y-5">
        {/* Debtor info */}
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
            {(debtor.student_name || 'S')[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{debtor.student_name}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {debtor.groups?.map(g => g.name).join(', ') || 'Guruh belgilanmagan'}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-lg font-bold" style={{ color: '#EF4444' }}>{formatMoney(debtor.total_debt)}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>jami qarz</div>
          </div>
        </div>

        {/* Outstanding invoices */}
        {loadingInvoices ? (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#F97316', borderTopColor: 'transparent' }} />
          </div>
        ) : invoices.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: '#EF4444' }}>
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-3 h-3" />
              To'lanmagan invoicelar ({invoices.length})
            </div>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {invoices.map(inv => {
                const remaining = Number(inv.total_amount) - Number(inv.paid_amount || 0);
                return (
                  <div key={inv.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm"
                    style={{ backgroundColor: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faFileInvoiceDollar} className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                      <span style={{ color: 'var(--text-primary)' }}>
                        {inv.group_name || 'Guruh'} — {formatMonth(inv.period_month, inv.period_year)}
                      </span>
                    </div>
                    <span className="font-bold" style={{ color: '#EF4444' }}>{formatMoney(remaining)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Group select */}
        {debtor.groups?.length > 1 && (
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Guruh</label>
            <div className="flex flex-wrap gap-2">
              {debtor.groups.map(g => (
                <button key={g.id} onClick={() => setSelectedGroup(g)}
                  className="px-3 py-2 rounded-xl text-sm font-medium border transition-all"
                  style={{
                    borderColor: selectedGroup?.id === g.id ? '#F97316' : 'var(--border-color)',
                    backgroundColor: selectedGroup?.id === g.id ? 'rgba(249,115,22,0.08)' : 'transparent',
                    color: selectedGroup?.id === g.id ? '#F97316' : 'var(--text-secondary)',
                  }}>
                  {g.name} — {formatMoney(g.monthly_price)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Summa</label>
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
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>so'm</span>
          </div>
          <div className="flex gap-2 mt-2">
            {selectedGroup?.monthly_price && (
              <button onClick={() => setAmount(String(selectedGroup.monthly_price))}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)' }}>
                1 oy: {formatMoney(selectedGroup.monthly_price)}
              </button>
            )}
            <button onClick={() => setAmount(String(debtor.total_debt))}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)' }}>
              Butun qarz: {formatMoney(debtor.total_debt)}
            </button>
          </div>
        </div>

        {/* Payment method */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>To'lov usuli</label>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(METHOD_CONFIG).map(([key, m]) => (
              <button key={key} onClick={() => setMethod(key)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all"
                style={{
                  borderColor: method === key ? m.color : 'var(--border-color)',
                  backgroundColor: method === key ? m.color + '10' : 'transparent',
                }}>
                <FontAwesomeIcon icon={m.icon} className="w-5 h-5" style={{ color: method === key ? m.color : 'var(--text-muted)' }} />
                <span className="text-[11px] font-medium" style={{ color: method === key ? m.color : 'var(--text-muted)' }}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Izoh (ixtiyoriy)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
            className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none text-sm"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            placeholder="Qo'shimcha ma'lumot..." />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} className="flex-1 h-12 rounded-xl">
            Bekor qilish
          </Button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 h-12 rounded-xl text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            {saving ? 'Saqlanmoqda...' : "To'lovni qabul qilish"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Invoice Status Badge ──────────────────────────────
const INVOICE_STATUS = {
  unpaid:  { label: "To'lanmagan", variant: 'warning' },
  partial: { label: 'Qisman',     variant: 'warning' },
  overdue: { label: "Muddati o'tgan", variant: 'danger' },
};

function InvoiceStatusBadge({ status }) {
  const cfg = INVOICE_STATUS[status] || { label: status, variant: 'neutral' };
  return <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>;
}

// ─── Main Debtors Page ─────────────────────────────────
export default function Debtors() {
  const navigate = useNavigate();
  const [debtors, setDebtors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [totalDebt, setTotalDebt] = useState(0);
  const [payDebtor, setPayDebtor] = useState(null);

  const [expandedId, setExpandedId] = useState(null);
  const [expandedInvoices, setExpandedInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const fetchDebtors = async () => {
    setLoading(true);
    try {
      const res = await billingInvoicesService.debtors();
      const raw = unwrapList(res);
      const list = raw.map(d => ({
        student_id: d.student__id ?? d.student_id ?? d.id,
        student_name: d.student__first_name
          ? `${d.student__first_name} ${d.student__last_name || ''}`.trim()
          : (d.student_name || '—'),
        student_phone: d.student_phone || null,
        parent_phone: d.parent_phone || null,
        groups: d.groups || [],
        total_debt: Number(d.total_debt ?? 0),
        invoice_count: d.invoice_count || 0,
      }));
      setDebtors(list);
      setTotalDebt(list.reduce((s, d) => s + d.total_debt, 0));
    } catch (e) {
      toast.error("Qarzdorlarni yuklashda xato: " + (e.response?.data?.detail || e.message));
    }
    setLoading(false);
  };

  useEffect(() => { fetchDebtors(); }, []);

  const fetchStudentInvoices = async (studentId) => {
    setLoadingInvoices(true);
    try {
      const res = await billingInvoicesService.getAll({
        student: studentId,
        status: 'unpaid,partial,overdue',
        page_size: 50,
        ordering: 'period_year,period_month',
      });
      setExpandedInvoices(unwrapList(res));
    } catch (e) {
      toast.error("Invoice yuklashda xato");
      setExpandedInvoices([]);
    }
    setLoadingInvoices(false);
  };

  const toggleExpand = (studentId) => {
    if (expandedId === studentId) {
      setExpandedId(null);
      setExpandedInvoices([]);
    } else {
      setExpandedId(studentId);
      fetchStudentInvoices(studentId);
    }
  };

  const filtered = debouncedSearch
    ? debtors.filter(d =>
        d.student_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        d.student_phone?.includes(debouncedSearch) ||
        d.parent_phone?.includes(debouncedSearch) ||
        d.groups?.some(g => g.name?.toLowerCase().includes(debouncedSearch.toLowerCase()))
      )
    : debtors;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Jami qarz summasi"
          value={formatMoney(totalDebt)}
          icon={faExclamationTriangle}
          tone="danger"
          loading={loading}
        />
        <StatCard
          label="Qarzdor o'quvchilar"
          value={debtors.length}
          hint={debtors.length > 0 ? `O'rtacha: ${formatMoney(totalDebt / debtors.length)}` : undefined}
          icon={faUserGraduate}
          tone="warning"
          loading={loading}
        />
      </div>

      {/* Search */}
      <div className="relative">
        <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Ism, telefon yoki guruh bo'yicha qidirish..."
          className="w-full h-11 pl-11 pr-4 rounded-xl border bg-transparent text-sm"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
      </div>

      {/* Debtors Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F97316', borderTopColor: 'transparent' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={search ? faSearch : faExclamationTriangle}
            title={search ? "Qidiruv bo'yicha natija topilmadi" : "Qarzdor o'quvchilar yo'q"}
            description={search ? "Boshqa kalit so'z bilan urinib ko'ring" : "Barcha to'lovlar to'g'ri amalga oshirilgan"}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  {["O'quvchi", 'Telefon', 'Guruh(lar)', 'Invoicelar', 'Qarz', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <Fragment key={d.student_id}>
                    <tr
                      className="border-b transition-colors cursor-pointer"
                      style={{ borderColor: 'var(--border-color)', backgroundColor: expandedId === d.student_id ? 'rgba(239,68,68,0.03)' : 'transparent' }}
                      onMouseEnter={e => { if (expandedId !== d.student_id) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                      onMouseLeave={e => { if (expandedId !== d.student_id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      onClick={() => toggleExpand(d.student_id)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
                            {(d.student_name || 'S')[0]}
                          </div>
                          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{d.student_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{d.student_phone || '—'}</div>
                        {d.parent_phone && (
                          <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            <FontAwesomeIcon icon={faPhone} className="w-2.5 h-2.5" />
                            {d.parent_phone}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {d.groups?.length > 0
                            ? d.groups.map(g => (
                                <span key={g.id} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(27,54,93,0.08)', color: '#1B365D' }}>
                                  {g.name}
                                </span>
                              ))
                            : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                          }
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="danger" size="sm">{d.invoice_count} ta</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold" style={{ color: '#EF4444' }}>{formatMoney(d.total_debt)}</span>
                      </td>
                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setPayDebtor(d)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{ color: '#fff', backgroundColor: '#22C55E' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#16A34A'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#22C55E'}
                            title="To'lov qabul qilish">
                            <FontAwesomeIcon icon={faMoneyBillWave} className="w-3 h-3" />
                            Qabul qilish
                          </button>
                          <button onClick={() => navigate(`/app/students/${d.student_id}/finance`)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5"
                            title="Batafsil ko'rish">
                            <FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5" style={{ color: '#3B82F6' }} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded invoices */}
                    {expandedId === d.student_id && (
                      <tr>
                        <td colSpan={6} className="px-5 py-4" style={{ backgroundColor: 'rgba(239,68,68,0.02)' }}>
                          {loadingInvoices ? (
                            <div className="text-center py-4">
                              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#F97316', borderTopColor: 'transparent' }} />
                            </div>
                          ) : expandedInvoices.length === 0 ? (
                            <div className="text-center py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                              Invoice topilmadi
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#EF4444' }}>
                                To'lanmagan invoicelar — {d.student_name}
                              </div>
                              <div className="grid gap-2">
                                {expandedInvoices.map(inv => {
                                  const remaining = Number(inv.total_amount) - Number(inv.paid_amount || 0);
                                  return (
                                    <div key={inv.id} className="flex items-center justify-between px-4 py-3 rounded-xl border"
                                      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
                                          <FontAwesomeIcon icon={faFileInvoiceDollar} className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {inv.group_name || 'Guruh'} — {formatMonth(inv.period_month, inv.period_year)}
                                          </div>
                                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            #{inv.number} {inv.due_date ? `• Muddat: ${inv.due_date}` : ''}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <InvoiceStatusBadge status={inv.status} />
                                        <div className="text-right">
                                          <div className="text-sm font-bold" style={{ color: '#EF4444' }}>{formatMoney(remaining)}</div>
                                          {Number(inv.paid_amount) > 0 && (
                                            <div className="text-[10px]" style={{ color: '#22C55E' }}>
                                              {formatMoney(inv.paid_amount)} to'langan
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Pay Modal */}
      <QuickPayModal
        open={!!payDebtor}
        onClose={() => setPayDebtor(null)}
        debtor={payDebtor}
        onSuccess={fetchDebtors}
      />
    </div>
  );
}
