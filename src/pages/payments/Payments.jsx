import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faSearch, faEdit, faTrash, faTimes, faMoneyBill,
  faChevronLeft, faChevronRight, faEye, faUndo, faWallet,
  faCheckCircle, faClock, faExclamationTriangle,
  faCalendarAlt, faReceipt, faMoneyBillWave, faCreditCard,
  faMobileAlt, faExchangeAlt, faUserGraduate, faUsers,
  faArrowRight, faCheck, faFileInvoiceDollar,
} from '@fortawesome/free-solid-svg-icons';
import { paymentsService } from '@/services/payments';
import { billingInvoicesService } from '@/services/billing';
import api from '@/services/api';

// ============================================
// CONSTANTS
// ============================================
const monthNames = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

const paymentStatusConfig = {
  pending: { label: 'Kutilmoqda', color: '#EAB308', bg: 'rgba(234,179,8,0.12)', icon: faClock },
  completed: { label: "To'langan", color: '#22C55E', bg: 'rgba(34,197,94,0.12)', icon: faCheckCircle },
  cancelled: { label: 'Bekor qilingan', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: faTimes },
  refunded: { label: 'Qaytarilgan', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', icon: faUndo },
};

const methodConfig = {
  cash: { label: 'Naqd', icon: faMoneyBillWave, color: '#22C55E' },
  card: { label: 'Karta', icon: faCreditCard, color: '#3B82F6' },
  transfer: { label: "O'tkazma", icon: faExchangeAlt, color: '#8B5CF6' },
  payme: { label: 'Payme', icon: faMobileAlt, color: '#00CCCC' },
  click: { label: 'Click', icon: faMobileAlt, color: '#F97316' },
};

const formatMoney = (v) => Number(v || 0).toLocaleString('uz-UZ') + " so'm";

// ============================================
// SHARED COMPONENTS
// ============================================
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
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    if (isOpen) { document.addEventListener('keydown', h); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = 'unset'; };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl`} style={{ backgroundColor: 'var(--bg-secondary)' }}>
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

// ============================================
// PAYMENT DETAIL MODAL
// ============================================
function PaymentDetailModal({ isOpen, onClose, payment }) {
  if (!isOpen || !payment) return null;

  const method = methodConfig[payment.payment_method];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="To'lov tafsilotlari">
      <div className="space-y-4">
        {/* Student & Group */}
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            {(payment.student_name || 'S')[0]}
          </div>
          <div className="flex-1">
            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{payment.student_name || payment.student}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{payment.group_name || payment.group || 'Guruh belgilanmagan'}</div>
          </div>
          <StatusBadge status={payment.status} config={paymentStatusConfig} />
        </div>

        {/* Amount */}
        <div className="text-center p-5 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
          <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>To'lov summasi</div>
          <div className="text-3xl font-bold" style={{ color: '#1B365D' }}>{formatMoney(payment.amount)}</div>
          <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {monthNames[(payment.period_month || 1) - 1]} {payment.period_year} uchun
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>To'lov usuli</div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={method?.icon || faMoneyBill} style={{ color: method?.color || 'var(--text-secondary)' }} className="w-4 h-4" />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{method?.label || payment.payment_method}</span>
            </div>
          </div>
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Sana</div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {payment.created_at ? new Date(payment.created_at).toLocaleDateString('uz') : '—'}
            </div>
          </div>
        </div>

        {payment.receipt_number && (
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Kvitansiya raqami</div>
            <div className="text-sm font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{payment.receipt_number}</div>
          </div>
        )}

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

// ============================================
// SMART PAYMENT FORM — Step-by-step
// ============================================
function PaymentFormModal({ isOpen, onClose, onSuccess, editPayment }) {
  const [step, setStep] = useState(1);
  const [studentSearch, setStudentSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentGroups, setStudentGroups] = useState([]);
  const [studentInvoices, setStudentInvoices] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const searchTimer = useRef(null);

  // Edit mode
  const isEdit = !!editPayment;

  useEffect(() => {
    if (isOpen && editPayment) {
      setStep(3); // Skip to payment details for edit
      setSelectedStudent({ id: editPayment.student, full_name: editPayment.student_name || '' });
      setSelectedGroup(editPayment.group ? { id: editPayment.group, name: editPayment.group_name || '' } : null);
      setAmount(String(editPayment.amount || ''));
      setMethod(editPayment.payment_method || 'cash');
      setPeriodMonth(editPayment.period_month || new Date().getMonth() + 1);
      setPeriodYear(editPayment.period_year || new Date().getFullYear());
      setNote(editPayment.note || '');
    }
  }, [isOpen, editPayment]);

  const reset = () => {
    setStep(1);
    setStudentSearch('');
    setSearchResults([]);
    setSelectedStudent(null);
    setStudentGroups([]);
    setStudentInvoices([]);
    setSelectedGroup(null);
    setSelectedInvoice(null);
    setAmount('');
    setMethod('cash');
    setPeriodMonth(new Date().getMonth() + 1);
    setPeriodYear(new Date().getFullYear());
    setNote('');
  };

  const handleClose = () => { reset(); onClose(); };

  // Step 1: Search students
  const searchStudents = useCallback(async (query) => {
    if (!query || query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get('/students/', { params: { search: query, page_size: 10 } });
      setSearchResults(res.data?.data || res.data?.results || []);
    } catch { setSearchResults([]); }
    setSearching(false);
  }, []);

  const handleSearchChange = (val) => {
    setStudentSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchStudents(val), 300);
  };

  // Step 2: Load student's groups and invoices
  const selectStudent = async (student) => {
    setSelectedStudent(student);
    setStep(2);
    setLoadingGroups(true);
    try {
      const [groupsRes, invoicesRes] = await Promise.all([
        api.get('/groups/', { params: { student_id: student.id, page_size: 50 } }).catch(() => ({ data: { data: [] } })),
        billingInvoicesService.getAll({ student_id: student.id, status: 'unpaid,partial,overdue', page_size: 50 }).catch(() => ({ data: { data: [] } })),
      ]);
      setStudentGroups(groupsRes.data?.data || groupsRes.data?.results || []);
      setStudentInvoices(invoicesRes.data?.data || invoicesRes.data?.results || []);
    } catch {}
    setLoadingGroups(false);
  };

  // Step 2: Select group or invoice → go to step 3
  const selectGroupOrInvoice = (group, invoice) => {
    setSelectedGroup(group);
    setSelectedInvoice(invoice);
    if (invoice) {
      setAmount(String(Number(invoice.total_amount) - Number(invoice.paid_amount || 0)));
      setPeriodMonth(invoice.period_month || new Date().getMonth() + 1);
      setPeriodYear(invoice.period_year || new Date().getFullYear());
    } else if (group) {
      setAmount(String(group.price || group.monthly_price || ''));
      setPeriodMonth(new Date().getMonth() + 1);
      setPeriodYear(new Date().getFullYear());
    }
    setStep(3);
  };

  // Step 3: Submit payment
  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) { toast.error("Summani kiriting"); return; }
    setSaving(true);
    try {
      const payload = {
        student: selectedStudent.id,
        group: selectedGroup?.id || '',
        amount: parseFloat(amount),
        payment_method: method,
        payment_type: 'tuition',
        period_month: periodMonth,
        period_year: periodYear,
        note,
        status: 'completed',
      };

      if (isEdit) {
        await paymentsService.update(editPayment.id, payload);
        toast.success("To'lov yangilandi");
      } else {
        await paymentsService.create(payload);
        toast.success("To'lov qabul qilindi!");
      }
      handleClose();
      onSuccess();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || e.response?.data?.detail || "Xato yuz berdi");
    }
    setSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? "To'lovni tahrirlash" : "To'lov qabul qilish"} wide={step === 2}>
      {/* Step indicator */}
      {!isEdit && (
        <div className="flex items-center gap-2 mb-6">
          {[
            { num: 1, label: "O'quvchi" },
            { num: 2, label: 'Guruh / Qarz' },
            { num: 3, label: "To'lov" },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    backgroundColor: step >= s.num ? '#F97316' : 'var(--bg-tertiary)',
                    color: step >= s.num ? 'white' : 'var(--text-muted)',
                  }}>
                  {step > s.num ? <FontAwesomeIcon icon={faCheck} className="w-3 h-3" /> : s.num}
                </div>
                <span className="text-xs font-medium truncate" style={{ color: step >= s.num ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s.label}</span>
              </div>
              {i < 2 && <div className="w-8 h-px flex-shrink-0" style={{ backgroundColor: step > s.num ? '#F97316' : 'var(--border-color)' }} />}
            </div>
          ))}
        </div>
      )}

      {/* STEP 1: Student search */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              autoFocus
              value={studentSearch}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="O'quvchi ismi yoki telefon raqamini kiriting..."
              className="w-full h-12 pl-11 pr-4 rounded-xl border bg-transparent text-sm"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          {searching && (
            <div className="text-center py-6">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#F97316', borderTopColor: 'transparent' }} />
              <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Qidirilmoqda...</div>
            </div>
          )}

          {!searching && searchResults.length > 0 && (
            <div className="space-y-1 max-h-[350px] overflow-y-auto">
              {searchResults.map(s => (
                <button key={s.id} onClick={() => selectStudent(s)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.01]"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(249,115,22,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                    {(s.first_name || 'S')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {s.first_name} {s.last_name}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {s.phone || s.parent_phone || 'Telefon yo\'q'}
                    </div>
                  </div>
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>
          )}

          {!searching && studentSearch.length >= 2 && searchResults.length === 0 && (
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faUserGraduate} className="w-10 h-10 mb-2" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>O'quvchi topilmadi</div>
            </div>
          )}

          {!searching && studentSearch.length < 2 && (
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faSearch} className="w-10 h-10 mb-2" style={{ color: 'var(--text-muted)', opacity: 0.2 }} />
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Kamida 2 ta harf yozing</div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Groups & Outstanding invoices */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Selected student */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
              {(selectedStudent?.first_name || selectedStudent?.full_name || 'S')[0]}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {selectedStudent?.first_name ? `${selectedStudent.first_name} ${selectedStudent.last_name || ''}` : selectedStudent?.full_name}
              </div>
            </div>
            <button onClick={() => { setStep(1); setSelectedStudent(null); setStudentGroups([]); setStudentInvoices([]); }}
              className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#F97316', backgroundColor: 'rgba(249,115,22,0.1)' }}>
              O'zgartirish
            </button>
          </div>

          {loadingGroups ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#F97316', borderTopColor: 'transparent' }} />
              <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Ma'lumotlar yuklanmoqda...</div>
            </div>
          ) : (
            <>
              {/* Outstanding invoices */}
              {studentInvoices.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: '#EF4444' }}>
                    <FontAwesomeIcon icon={faExclamationTriangle} className="w-3 h-3" />
                    To'lanmagan qarzlar ({studentInvoices.length})
                  </div>
                  <div className="space-y-2">
                    {studentInvoices.map(inv => {
                      const remaining = Number(inv.total_amount) - Number(inv.paid_amount || 0);
                      return (
                        <button key={inv.id} onClick={() => selectGroupOrInvoice(
                          { id: inv.group, name: inv.group_name },
                          inv
                        )}
                          className="w-full flex items-center gap-3 p-3 rounded-xl text-left border transition-all"
                          style={{ borderColor: 'rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.03)' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.06)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.03)'; }}
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                            <FontAwesomeIcon icon={faFileInvoiceDollar} className="w-4 h-4" style={{ color: '#EF4444' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {inv.group_name || 'Guruh'} — {monthNames[(inv.period_month || 1) - 1]} {inv.period_year}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              Invoice: {inv.number} • Muddat: {inv.due_date || '—'}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-bold" style={{ color: '#EF4444' }}>{formatMoney(remaining)}</div>
                            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>qoldiq</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Groups */}
              {studentGroups.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Guruhlar ({studentGroups.length})
                  </div>
                  <div className="space-y-2">
                    {studentGroups.map(g => (
                      <button key={g.id} onClick={() => selectGroupOrInvoice(g, null)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-left border transition-all"
                        style={{ borderColor: 'var(--border-color)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.backgroundColor = 'rgba(249,115,22,0.04)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(27,54,93,0.08)' }}>
                          <FontAwesomeIcon icon={faUsers} className="w-4 h-4" style={{ color: '#1B365D' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{g.name}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {g.course_name || g.course || ''} {g.teacher_name ? `• ${g.teacher_name}` : ''}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold" style={{ color: '#1B365D' }}>
                            {g.price || g.monthly_price ? formatMoney(g.price || g.monthly_price) : '—'}
                          </div>
                          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>oylik</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No data */}
              {studentGroups.length === 0 && studentInvoices.length === 0 && (
                <div className="text-center py-8">
                  <FontAwesomeIcon icon={faUsers} className="w-10 h-10 mb-2" style={{ color: 'var(--text-muted)', opacity: 0.2 }} />
                  <div className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Bu o'quvchi hech qaysi guruhda emas</div>
                  <button onClick={() => selectGroupOrInvoice(null, null)}
                    className="text-sm px-4 py-2 rounded-xl font-medium"
                    style={{ color: '#F97316', backgroundColor: 'rgba(249,115,22,0.1)' }}>
                    Guruhsiz to'lov qilish
                  </button>
                </div>
              )}

              {/* Skip: manual payment without group */}
              {studentGroups.length > 0 && (
                <button onClick={() => selectGroupOrInvoice(null, null)}
                  className="w-full text-center text-xs py-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  Guruh tanlamasdan davom etish →
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* STEP 3: Payment details */}
      {step === 3 && (
        <div className="space-y-5">
          {/* Context info */}
          {!isEdit && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                {(selectedStudent?.first_name || selectedStudent?.full_name || 'S')[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                  {selectedStudent?.first_name ? `${selectedStudent.first_name} ${selectedStudent.last_name || ''}` : selectedStudent?.full_name}
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {selectedGroup?.name || 'Guruh tanlanmagan'}
                  {selectedInvoice && ` • Invoice: ${selectedInvoice.number}`}
                </div>
              </div>
              <button onClick={() => setStep(2)} className="text-xs px-2 py-1 rounded-lg" style={{ color: '#F97316' }}>
                Orqaga
              </button>
            </div>
          )}

          {/* Invoice reminder */}
          {selectedInvoice && (
            <div className="p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <FontAwesomeIcon icon={faFileInvoiceDollar} className="w-4 h-4 flex-shrink-0" style={{ color: '#EF4444' }} />
              <div className="flex-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <strong>Qarz:</strong> {formatMoney(Number(selectedInvoice.total_amount) - Number(selectedInvoice.paid_amount || 0))}
                {' '}({monthNames[(selectedInvoice.period_month || 1) - 1]} {selectedInvoice.period_year})
              </div>
            </div>
          )}

          {/* Amount — big and prominent */}
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
          </div>

          {/* Payment method — visual buttons */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>To'lov usuli</label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(methodConfig).map(([key, m]) => (
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

          {/* Period */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Qaysi oy uchun</label>
            <div className="grid grid-cols-2 gap-3">
              <select value={periodMonth} onChange={e => setPeriodMonth(Number(e.target.value))}
                className="h-11 px-4 rounded-xl border bg-transparent text-sm"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <input type="number" value={periodYear} onChange={e => setPeriodYear(Number(e.target.value))}
                className="h-11 px-4 rounded-xl border bg-transparent text-sm"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
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
            <button onClick={handleClose}
              className="flex-1 h-12 rounded-xl border font-semibold text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              Bekor qilish
            </button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 h-12 rounded-xl text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
              {saving ? 'Saqlanmoqda...' : isEdit ? 'Saqlash' : "✓ To'lovni qabul qilish"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ============================================
// MAIN PAGE
// ============================================
export default function Payments() {
  const now = new Date();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editPayment, setEditPayment] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const goMonth = (dir) => {
    let m = filterMonth + dir;
    let y = filterYear;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setFilterMonth(m);
    setFilterYear(y);
    setPage(1);
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterMethod) params.payment_method = filterMethod;
      // Oy boshi va oxiri bo'yicha filtr
      const startDate = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(filterYear, filterMonth, 0).getDate();
      const endDate = `${filterYear}-${String(filterMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      params.start_date = startDate;
      params.end_date = endDate;
      const res = await paymentsService.getAll(params);
      setPayments(res.data?.data || res.data?.results || []);
      setTotalPages(res.data?.meta?.total_pages || Math.ceil((res.data?.count || 0) / 20) || 1);
    } catch { toast.error("Ma'lumotlarni yuklashda xato"); }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await paymentsService.statistics({ period: 'custom', start_date: `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`, end_date: `${filterYear}-${String(filterMonth).padStart(2, '0')}-${new Date(filterYear, filterMonth, 0).getDate()}` });
      setStats(res.data);
    } catch {}
  };

  useEffect(() => { fetchStats(); }, [filterYear, filterMonth]);
  useEffect(() => { fetchPayments(); }, [search, filterStatus, filterMethod, page, filterYear, filterMonth]);

  const handleDelete = async (id) => {
    if (!confirm("Bu to'lovni o'chirmoqchimisiz?")) return;
    try { await paymentsService.delete(id); toast.success("To'lov o'chirildi"); fetchPayments(); fetchStats(); }
    catch { toast.error('Xato'); }
  };

  const handleRefund = async (id) => {
    if (!confirm("To'lovni qaytarmoqchimisiz?")) return;
    try { await paymentsService.update(id, { status: 'refunded' }); toast.success("To'lov qaytarildi"); fetchPayments(); fetchStats(); }
    catch { toast.error('Xato'); }
  };

  // Calculate stats from payments if backend stats not available
  const displayStats = stats || (() => {
    const completed = payments.filter(p => p.status === 'completed');
    const pending = payments.filter(p => p.status === 'pending');
    return {
      total_collected: completed.reduce((s, p) => s + Number(p.amount || 0), 0),
      total_pending: pending.reduce((s, p) => s + Number(p.amount || 0), 0),
      this_month: completed.filter(p => p.period_month === new Date().getMonth() + 1 && p.period_year === new Date().getFullYear()).reduce((s, p) => s + Number(p.amount || 0), 0),
      total_count: payments.length,
      pending_count: pending.length,
    };
  })();

  const statCards = [
    { label: 'Jami yig\'ilgan', value: formatMoney(displayStats.total_collected), icon: faWallet, color: '#22C55E' },
    { label: 'Kutilayotgan', value: formatMoney(displayStats.total_pending), icon: faClock, color: '#EAB308', badge: displayStats.pending_count > 0 ? `${displayStats.pending_count} ta` : null },
    { label: 'Bu oy', value: formatMoney(displayStats.this_month), icon: faCalendarAlt, color: '#3B82F6' },
    { label: 'Jami to\'lovlar', value: displayStats.total_count, icon: faReceipt, color: '#8B5CF6' },
  ];

  return (
    <div className="space-y-6">
      {/* Month Navigator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => goMonth(-1)}
            className="w-9 h-9 rounded-xl border flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: 'var(--border-color)' }}>
            <FontAwesomeIcon icon={faChevronLeft} className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
          </button>
          <div className="min-w-[160px] text-center">
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {monthNames[filterMonth - 1]}
            </span>
            <span className="text-lg font-medium ml-2" style={{ color: 'var(--text-muted)' }}>
              {filterYear}
            </span>
          </div>
          <button onClick={() => goMonth(1)}
            className="w-9 h-9 rounded-xl border flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: 'var(--border-color)' }}>
            <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        {(filterYear !== now.getFullYear() || filterMonth !== now.getMonth() + 1) && (
          <button onClick={() => { setFilterYear(now.getFullYear()); setFilterMonth(now.getMonth() + 1); setPage(1); }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: '#F97316', backgroundColor: 'rgba(249,115,22,0.1)' }}>
            Joriy oy
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="rounded-2xl p-5 border transition-all" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = s.color + '60'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + '15' }}>
                <FontAwesomeIcon icon={s.icon} className="w-4 h-4" style={{ color: s.color }} />
              </div>
              {s.badge && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.color + '18', color: s.color }}>{s.badge}</span>
              )}
            </div>
            <div className="text-lg font-bold" style={{ color: '#1B365D' }}>{s.value}</div>
            <div className="text-xs mt-1 uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="O'quvchi yoki guruh bo'yicha qidirish..."
            className="w-full h-11 pl-11 pr-4 rounded-xl border bg-transparent text-sm"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="h-11 px-4 rounded-xl border bg-transparent text-sm"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="">Barcha holatlar</option>
          {Object.entries(paymentStatusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterMethod} onChange={e => { setFilterMethod(e.target.value); setPage(1); }}
          className="h-11 px-4 rounded-xl border bg-transparent text-sm"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="">Barcha usullar</option>
          {Object.entries(methodConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={() => { setEditPayment(null); setShowForm(true); }}
          className="flex items-center gap-2 px-5 h-11 rounded-xl text-white font-medium shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
          <FontAwesomeIcon icon={faPlus} /> To'lov qabul qilish
        </button>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F97316', borderTopColor: 'transparent' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-20">
            <FontAwesomeIcon icon={faMoneyBill} className="w-12 h-12 mb-3" style={{ color: 'var(--text-muted)', opacity: 0.2 }} />
            <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>To'lovlar topilmadi</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {search || filterStatus || filterMethod ? 'Filtrlarni o\'zgartiring' : 'Birinchi to\'lovni qabul qiling'}
            </div>
          </div>
        ) : (
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
                {payments.map(p => (
                  <tr key={p.id}
                    className="border-b hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    style={{ borderColor: 'var(--border-color)' }}
                    onClick={() => { setSelectedPayment(p); setShowDetail(true); }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                          {(p.student_name || 'S')[0]}
                        </div>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.student_name || p.student}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{p.group_name || p.group || '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {monthNames[(p.period_month || 1) - 1]} {p.period_year}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold" style={{ color: '#1B365D' }}>{formatMoney(p.amount)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={methodConfig[p.payment_method]?.icon || faMoneyBill} className="w-4 h-4"
                          style={{ color: methodConfig[p.payment_method]?.color || 'var(--text-muted)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {methodConfig[p.payment_method]?.label || p.payment_method}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={p.status} config={paymentStatusConfig} />
                    </td>
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setSelectedPayment(p); setShowDetail(true); }}
                          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="Ko'rish">
                          <FontAwesomeIcon icon={faEye} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <button onClick={() => { setEditPayment(p); setShowForm(true); }}
                          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="Tahrirlash">
                          <FontAwesomeIcon icon={faEdit} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        {p.status === 'completed' && (
                          <button onClick={() => handleRefund(p.id)}
                            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="Qaytarish">
                            <FontAwesomeIcon icon={faUndo} className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(p.id)}
                          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="O'chirish">
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" style={{ color: '#EF4444' }} />
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
                    backgroundColor: page === pageNum ? '#F97316' : 'transparent',
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
      <PaymentFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditPayment(null); }}
        onSuccess={() => { fetchPayments(); fetchStats(); }}
        editPayment={editPayment}
      />

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        isOpen={showDetail}
        onClose={() => { setShowDetail(false); setSelectedPayment(null); }}
        payment={selectedPayment}
      />
    </div>
  );
}
