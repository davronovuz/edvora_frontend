import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileInvoice, faPlus, faSearch, faTimes, faEdit, faTrash, faEye,
  faChevronLeft, faChevronRight, faCheck, faClock, faExclamationTriangle,
  faPercent, faCalendarAlt, faUsers, faMoneyBillWave, faChartLine,
  faCog, faGift, faUmbrella, faBan, faWallet, faFilter,
  faArrowUp, faArrowDown, faUserGraduate, faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import {
  billingProfilesService, billingInvoicesService,
  billingLeavesService, billingDiscountsService,
} from '@/services/billing';
import { groupsService } from '@/services/groups';

// ============================================
// CONFIG
// ============================================
const formatMoney = (v) => Number(v || 0).toLocaleString('uz-UZ') + " so'm";

const invoiceStatusConfig = {
  draft: { label: 'Qoralama', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  unpaid: { label: "To'lanmagan", color: '#EAB308', bg: 'rgba(234,179,8,0.12)', icon: faClock },
  partial: { label: 'Qisman', color: '#F97316', bg: 'rgba(249,115,22,0.12)', icon: faArrowDown },
  paid: { label: "To'langan", color: '#22C55E', bg: 'rgba(34,197,94,0.12)', icon: faCheck },
  overdue: { label: "Muddati o'tgan", color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: faExclamationTriangle },
  cancelled: { label: 'Bekor', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', icon: faBan },
};

const leaveStatusConfig = {
  pending: { label: 'Kutilmoqda', color: '#EAB308', bg: 'rgba(234,179,8,0.12)' },
  approved: { label: 'Tasdiqlangan', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  rejected: { label: 'Rad etilgan', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  cancelled: { label: 'Bekor', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
};

const modeLabels = {
  monthly_flat: 'Oylik (qat\'iy)',
  monthly_prorated_days: 'Oylik (kun pro-rate)',
  monthly_prorated_lessons: 'Oylik (dars pro-rate)',
  per_lesson: 'Har dars uchun',
  per_attendance: 'Qatnashgan dars',
  package: 'Paket',
  hourly: 'Soatlik',
  subscription_freeze: 'Obuna (muzlatish)',
};

const discountKindLabels = {
  student_percent: "O'quvchi foiz",
  student_fixed: "O'quvchi summa",
  group_percent: 'Guruh foiz',
  group_fixed: 'Guruh summa',
  course_percent: 'Kurs foiz',
  course_fixed: 'Kurs summa',
  sibling: 'Aka-uka',
  multi_course: 'Ko\'p kurs',
  first_month: 'Birinchi oy',
  loyalty: 'Sodiqlik',
  promo: 'Promo kod',
};

// ============================================
// SHARED COMPONENTS
// ============================================
function StatusBadge({ status, config }) {
  const s = config[status] || { label: status, color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color: s.color, backgroundColor: s.bg }}>
      {s.icon && <FontAwesomeIcon icon={s.icon} className="w-3 h-3" />}
      {s.label}
    </span>
  );
}

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

function StatCard({ label, value, icon, color }) {
  return (
    <div className="rounded-2xl p-5 border transition-all" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
          <FontAwesomeIcon icon={icon} className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
        className="w-8 h-8 rounded-lg flex items-center justify-center border disabled:opacity-30"
        style={{ borderColor: 'var(--border-color)' }}>
        <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
      </button>
      <span className="text-sm px-3" style={{ color: 'var(--text-muted)' }}>{page} / {totalPages}</span>
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
        className="w-8 h-8 rounded-lg flex items-center justify-center border disabled:opacity-30"
        style={{ borderColor: 'var(--border-color)' }}>
        <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
      </button>
    </div>
  );
}

// ============================================
// TAB 1: INVOICES
// ============================================
function InvoicesTab() {
  const now = new Date();
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [detail, setDetail] = useState(null);
  const [generateModal, setGenerateModal] = useState(false);
  const [genForm, setGenForm] = useState({ group_student_id: '', year: now.getFullYear(), month: now.getMonth() + 1 });
  const [genMode, setGenMode] = useState('single'); // 'single' | 'group'
  const [genGroupId, setGenGroupId] = useState('');
  const [groups, setGroups] = useState([]);
  const [groupStudents, setGroupStudents] = useState([]);
  const [groupSearch, setGroupSearch] = useState('');
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const monthLabels = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

  const goMonth = (dir) => {
    let m = filterMonth + dir;
    let y = filterYear;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setFilterMonth(m);
    setFilterYear(y);
    setPage(1);
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = { page, search, period_year: filterYear, period_month: filterMonth };
      if (statusFilter) params.status = statusFilter;
      const res = await billingInvoicesService.getAll(params);
      setInvoices(res.data.data || res.data.results || []);
      setTotalPages(res.data.meta?.total_pages || Math.ceil((res.data.meta?.total || 0) / 20) || 1);
    } catch { toast.error('Invoice yuklashda xato'); }
    setLoading(false);
  };

  const fetchSummary = async () => {
    try {
      const res = await billingInvoicesService.summary({ year: filterYear, month: filterMonth });
      setSummary(res.data);
    } catch {}
  };

  useEffect(() => { fetchInvoices(); }, [page, statusFilter, search, filterYear, filterMonth]);
  useEffect(() => { fetchSummary(); }, [filterYear, filterMonth]);

  const handleCancel = async (id) => {
    if (!confirm('Invoice bekor qilinsinmi?')) return;
    try {
      await billingInvoicesService.cancel(id);
      toast.success('Invoice bekor qilindi');
      fetchInvoices();
      fetchSummary();
    } catch (e) { toast.error(e.response?.data?.detail || 'Xato'); }
  };

  const fetchGroups = async (q = '') => {
    setLoadingGroups(true);
    try {
      const res = await groupsService.getAll({ search: q, page_size: 50 });
      setGroups(res.data.data || res.data.results || []);
    } catch { setGroups([]); }
    setLoadingGroups(false);
  };

  const fetchGroupStudents = async (groupId) => {
    if (!groupId) { setGroupStudents([]); return; }
    setLoadingStudents(true);
    try {
      const res = await groupsService.getStudents(groupId);
      setGroupStudents(res.data.data || res.data || []);
    } catch { setGroupStudents([]); }
    setLoadingStudents(false);
  };

  const openGenerateModal = () => {
    setGenMode('single');
    setGenGroupId('');
    setGenForm({ group_student_id: '', year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
    setGroupStudents([]);
    setGenerateModal(true);
    fetchGroups();
  };

  const handleGenerate = async () => {
    try {
      if (genMode === 'group') {
        if (!genGroupId) { toast.error('Guruhni tanlang'); return; }
        await billingInvoicesService.generateGroup({ group_id: genGroupId, year: genForm.year, month: genForm.month });
        toast.success('Guruh uchun invoicelar yaratildi');
      } else {
        if (!genForm.group_student_id) { toast.error("O'quvchini tanlang"); return; }
        await billingInvoicesService.generate(genForm);
        toast.success('Invoice yaratildi');
      }
      setGenerateModal(false);
      fetchInvoices();
      fetchSummary();
    } catch (e) { toast.error(e.response?.data?.detail || e.response?.data?.error || 'Xato'); }
  };

  const viewDetail = async (id) => {
    try {
      const res = await billingInvoicesService.getById(id);
      setDetail(res.data);
    } catch { toast.error('Xato'); }
  };

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
              {monthLabels[filterMonth - 1]}
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
            Bugungi oy
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Kutilayotgan" value={formatMoney(summary.total_expected)} icon={faChartLine} color="#3B82F6" />
          <StatCard label="Yig'ilgan" value={formatMoney(summary.total_collected)} icon={faMoneyBillWave} color="#22C55E" />
          <StatCard label="Qarz" value={formatMoney(summary.total_debt)} icon={faExclamationTriangle} color="#EF4444" />
          <StatCard label="Muddati o'tgan" value={summary.overdue_count} icon={faClock} color="#F97316" />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Qidirish..." className="input pl-10 w-full" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input">
          <option value="">Barchasi</option>
          {Object.entries(invoiceStatusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={openGenerateModal} className="btn btn-primary gap-2">
          <FontAwesomeIcon icon={faPlus} /> Yaratish
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {['Raqam', "O'quvchi", 'Guruh', 'Davr', 'Summa', "To'langan", 'Status', 'Muddat', ''].map(h =>
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Invoice topilmadi</td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} className="border-t transition-colors hover:bg-[var(--bg-tertiary)]" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-4 py-3 text-sm font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{inv.number}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>{inv.student_name || `${inv.student?.first_name || ''} ${inv.student?.last_name || ''}`}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{inv.group_name || inv.group?.name || ''}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{inv.period_month}/{inv.period_year}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatMoney(inv.total_amount)}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#22C55E' }}>{formatMoney(inv.paid_amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} config={invoiceStatusConfig} /></td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{inv.due_date}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => viewDetail(inv.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-blue-500/10" title="Ko'rish">
                        <FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5" style={{ color: '#3B82F6' }} />
                      </button>
                      {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                        <button onClick={() => handleCancel(inv.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10" title="Bekor">
                          <FontAwesomeIcon icon={faBan} className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Generate Modal */}
      <Modal isOpen={generateModal} onClose={() => setGenerateModal(false)} title="Invoice yaratish">
        <div className="space-y-4">
          {/* Mode switch */}
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
            <button onClick={() => { setGenMode('single'); setGenGroupId(''); setGenForm(p => ({ ...p, group_student_id: '' })); setGroupStudents([]); }}
              className="flex-1 py-2.5 text-sm font-semibold transition-colors"
              style={{ backgroundColor: genMode === 'single' ? '#F97316' : 'transparent', color: genMode === 'single' ? '#fff' : 'var(--text-secondary)' }}>
              <FontAwesomeIcon icon={faUserGraduate} className="mr-2" />Bitta o'quvchi
            </button>
            <button onClick={() => { setGenMode('group'); setGenForm(p => ({ ...p, group_student_id: '' })); }}
              className="flex-1 py-2.5 text-sm font-semibold transition-colors"
              style={{ backgroundColor: genMode === 'group' ? '#F97316' : 'transparent', color: genMode === 'group' ? '#fff' : 'var(--text-secondary)' }}>
              <FontAwesomeIcon icon={faLayerGroup} className="mr-2" />Butun guruh
            </button>
          </div>

          {/* Group selector */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Guruh</label>
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <input value={groupSearch} onChange={e => { setGroupSearch(e.target.value); fetchGroups(e.target.value); }}
                placeholder="Guruh qidirish..." className="input pl-9 w-full" />
            </div>
            {loadingGroups ? (
              <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
            ) : groups.length > 0 ? (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border space-y-0.5 p-1" style={{ borderColor: 'var(--border-color)' }}>
                {groups.map(g => (
                  <button key={g.id} onClick={() => {
                    if (genMode === 'group') {
                      setGenGroupId(g.id);
                    }
                    fetchGroupStudents(g.id);
                    setGroupSearch(g.name);
                    setGroups([]);
                  }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bg-tertiary)]"
                    style={{ color: 'var(--text-primary)' }}>
                    <div className="font-medium">{g.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {g.course_name || g.course || ''} {g.teacher_name ? `• ${g.teacher_name}` : ''}
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Student selector (only for single mode) */}
          {genMode === 'single' && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>O'quvchi</label>
              {loadingStudents ? (
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
              ) : groupStudents.length === 0 ? (
                <div className="text-xs p-3 rounded-xl text-center" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)' }}>
                  Avval guruhni tanlang
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-xl border space-y-0.5 p-1" style={{ borderColor: 'var(--border-color)' }}>
                  {groupStudents.map(gs => (
                    <button key={gs.id} onClick={() => setGenForm(p => ({ ...p, group_student_id: gs.id }))}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                      style={{
                        backgroundColor: genForm.group_student_id === gs.id ? 'rgba(249,115,22,0.12)' : 'transparent',
                        borderLeft: genForm.group_student_id === gs.id ? '3px solid #F97316' : '3px solid transparent',
                      }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: '#F97316' }}>
                        {(gs.student_name || gs.full_name || gs.first_name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: genForm.group_student_id === gs.id ? '#F97316' : 'var(--text-primary)' }}>
                          {gs.student_name || gs.full_name || `${gs.first_name || ''} ${gs.last_name || ''}`.trim()}
                        </div>
                        {gs.phone && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{gs.phone}</div>}
                      </div>
                      {genForm.group_student_id === gs.id && (
                        <FontAwesomeIcon icon={faCheck} className="ml-auto w-4 h-4" style={{ color: '#F97316' }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Group info for group mode */}
          {genMode === 'group' && genGroupId && (
            <div className="p-3 rounded-xl flex items-center gap-2" style={{ backgroundColor: 'rgba(249,115,22,0.08)' }}>
              <FontAwesomeIcon icon={faLayerGroup} className="w-4 h-4" style={{ color: '#F97316' }} />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Guruhdagi barcha o'quvchilar uchun invoice yaratiladi
                {groupStudents.length > 0 && <b> ({groupStudents.length} ta)</b>}
              </span>
            </div>
          )}

          {/* Year / Month */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Yil</label>
              <input type="number" value={genForm.year} onChange={e => setGenForm(p => ({ ...p, year: +e.target.value }))} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Oy</label>
              <select value={genForm.month} onChange={e => setGenForm(p => ({ ...p, month: +e.target.value }))} className="input w-full">
                {['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={handleGenerate} className="btn btn-primary w-full gap-2">
            <FontAwesomeIcon icon={faPlus} />
            {genMode === 'group' ? 'Guruh uchun yaratish' : 'Invoice yaratish'}
          </button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={`Invoice ${detail?.number || ''}`} maxWidth="max-w-2xl">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs" style={{ color: 'var(--text-muted)' }}>O'quvchi</span><p className="font-medium" style={{ color: 'var(--text-primary)' }}>{detail.student_name}</p></div>
              <div><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Guruh</span><p className="font-medium" style={{ color: 'var(--text-primary)' }}>{detail.group_name}</p></div>
              <div><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Davr</span><p className="font-medium" style={{ color: 'var(--text-primary)' }}>{detail.period_month}/{detail.period_year}</p></div>
              <div><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Status</span><p><StatusBadge status={detail.status} config={invoiceStatusConfig} /></p></div>
            </div>

            <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Asosiy summa</span><span style={{ color: 'var(--text-primary)' }}>{formatMoney(detail.base_amount)}</span></div>
              {Number(detail.discount_amount) > 0 && <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Chegirma</span><span style={{ color: '#22C55E' }}>-{formatMoney(detail.discount_amount)}</span></div>}
              {Number(detail.leave_credit_amount) > 0 && <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Ta'til chegirmasi</span><span style={{ color: '#22C55E' }}>-{formatMoney(detail.leave_credit_amount)}</span></div>}
              {Number(detail.late_fee_amount) > 0 && <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Penya</span><span style={{ color: '#EF4444' }}>+{formatMoney(detail.late_fee_amount)}</span></div>}
              <div className="border-t pt-2 flex justify-between text-sm font-bold" style={{ borderColor: 'var(--border-color)' }}>
                <span style={{ color: 'var(--text-primary)' }}>Jami</span><span style={{ color: 'var(--text-primary)' }}>{formatMoney(detail.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-muted)' }}>To'langan</span><span style={{ color: '#22C55E' }}>{formatMoney(detail.paid_amount)}</span></div>
            </div>

            {detail.lines?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Tafsilotlar</h4>
                <div className="space-y-1">
                  {detail.lines.map((line, i) => (
                    <div key={i} className="flex justify-between text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{line.description}</span>
                      <span className="font-medium" style={{ color: line.amount < 0 ? '#22C55E' : 'var(--text-primary)' }}>{formatMoney(Math.abs(line.amount))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ============================================
// TAB 2: PROFILES
// ============================================
function ProfilesTab() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [modes, setModes] = useState([]);
  const [form, setForm] = useState({
    name: '', mode: 'monthly_flat', billing_day: 1, due_days: 10,
    grace_period_days: 3, leave_policy: 'prorate_days', is_default: false,
    late_fee_enabled: false, late_fee_type: 'percent', late_fee_value: 0,
    price_per_lesson: '', price_per_hour: '',
  });

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await billingProfilesService.getAll();
      setProfiles(res.data.data || res.data.results || []);
    } catch { toast.error('Xato'); }
    setLoading(false);
  };

  const fetchModes = async () => {
    try {
      const res = await billingProfilesService.modes();
      setModes(res.data);
    } catch {}
  };

  useEffect(() => { fetchProfiles(); fetchModes(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', mode: 'monthly_flat', billing_day: 1, due_days: 10, grace_period_days: 3, leave_policy: 'prorate_days', is_default: false, late_fee_enabled: false, late_fee_type: 'percent', late_fee_value: 0, price_per_lesson: '', price_per_hour: '' });
    setModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name, mode: p.mode, billing_day: p.billing_day, due_days: p.due_days,
      grace_period_days: p.grace_period_days, leave_policy: p.leave_policy, is_default: p.is_default,
      late_fee_enabled: p.late_fee_enabled, late_fee_type: p.late_fee_type, late_fee_value: p.late_fee_value || 0,
      price_per_lesson: p.price_per_lesson || '', price_per_hour: p.price_per_hour || '',
    });
    setModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await billingProfilesService.update(editing.id, form);
        toast.success('Yangilandi');
      } else {
        await billingProfilesService.create(form);
        toast.success('Yaratildi');
      }
      setModal(false);
      fetchProfiles();
    } catch (e) { toast.error(e.response?.data?.detail || 'Xato'); }
  };

  const handleDelete = async (id) => {
    if (!confirm("O'chirilsinmi?")) return;
    try {
      await billingProfilesService.delete(id);
      toast.success("O'chirildi");
      fetchProfiles();
    } catch { toast.error('Xato'); }
  };

  const F = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{profiles.length} ta profil</p>
        <button onClick={openCreate} className="btn btn-primary gap-2"><FontAwesomeIcon icon={faPlus} /> Yangi profil</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <p className="col-span-3 text-center py-12" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</p> :
          profiles.map(p => (
            <div key={p.id} className="card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ backgroundColor: '#3B82F620', color: '#3B82F6' }}>
                    {modeLabels[p.mode] || p.mode}
                  </span>
                </div>
                {p.is_default && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#22C55E20', color: '#22C55E' }}>Default</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <div>Hisob kuni: <strong>{p.billing_day}</strong></div>
                <div>To'lov muddati: <strong>{p.due_days} kun</strong></div>
                <div>Ta'til: <strong>{p.leave_policy}</strong></div>
                <div>Penya: <strong>{p.late_fee_enabled ? 'Ha' : 'Yo\'q'}</strong></div>
              </div>
              <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button onClick={() => openEdit(p)} className="flex-1 btn btn-sm btn-outline gap-1"><FontAwesomeIcon icon={faEdit} className="w-3 h-3" /> Tahrirlash</button>
                <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10">
                  <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                </button>
              </div>
            </div>
          ))}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Profilni tahrirlash' : 'Yangi profil'} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nomi</label>
            <input value={form.name} onChange={e => F('name', e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Billing turi</label>
            <select value={form.mode} onChange={e => F('mode', e.target.value)} className="input w-full">
              {modes.length > 0 ? modes.map(m => <option key={m.value} value={m.value}>{m.label}</option>) :
                Object.entries(modeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Hisob kuni</label>
              <input type="number" min={1} max={28} value={form.billing_day} onChange={e => F('billing_day', +e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>To'lov muddati (kun)</label>
              <input type="number" value={form.due_days} onChange={e => F('due_days', +e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Grace (kun)</label>
              <input type="number" value={form.grace_period_days} onChange={e => F('grace_period_days', +e.target.value)} className="input w-full" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Ta'til siyosati</label>
            <select value={form.leave_policy} onChange={e => F('leave_policy', e.target.value)} className="input w-full">
              <option value="none">Ta'til yo'q</option>
              <option value="prorate_days">Kun bo'yicha chegirish</option>
              <option value="prorate_lessons">Dars bo'yicha chegirish</option>
              <option value="push_to_next_month">Keyingi oyga surish</option>
            </select>
          </div>
          {(form.mode === 'per_lesson' || form.mode === 'per_attendance') && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>1 dars narxi</label>
              <input type="number" value={form.price_per_lesson} onChange={e => F('price_per_lesson', e.target.value)} className="input w-full" />
            </div>
          )}
          {form.mode === 'hourly' && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>1 soat narxi</label>
              <input type="number" value={form.price_per_hour} onChange={e => F('price_per_hour', e.target.value)} className="input w-full" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_default} onChange={e => F('is_default', e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Default profil</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.late_fee_enabled} onChange={e => F('late_fee_enabled', e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Penya</span>
            </label>
          </div>
          {form.late_fee_enabled && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Penya turi</label>
                <select value={form.late_fee_type} onChange={e => F('late_fee_type', e.target.value)} className="input w-full">
                  <option value="percent">Foiz</option>
                  <option value="fixed">Belgilangan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Qiymat</label>
                <input type="number" value={form.late_fee_value} onChange={e => F('late_fee_value', e.target.value)} className="input w-full" />
              </div>
            </div>
          )}
          <button onClick={handleSave} className="btn btn-primary w-full">{editing ? 'Saqlash' : 'Yaratish'}</button>
        </div>
      </Modal>
    </div>
  );
}

// ============================================
// TAB 3: LEAVES
// ============================================
function LeavesTab() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await billingLeavesService.getAll({ page });
      setLeaves(res.data.data || res.data.results || []);
      setTotalPages(res.data.meta?.total_pages || 1);
    } catch { toast.error('Xato'); }
    setLoading(false);
  };

  useEffect(() => { fetchLeaves(); }, [page]);

  const handleApprove = async (id) => {
    try {
      await billingLeavesService.approve(id);
      toast.success('Tasdiqlandi');
      fetchLeaves();
    } catch (e) { toast.error(e.response?.data?.detail || 'Xato'); }
  };

  const handleReject = async (id) => {
    try {
      await billingLeavesService.reject(id);
      toast.success('Rad etildi');
      fetchLeaves();
    } catch (e) { toast.error(e.response?.data?.detail || 'Xato'); }
  };

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {["O'quvchi", 'Guruh', 'Boshlanish', 'Tugash', 'Kunlar', 'Sabab', 'Status', ''].map(h =>
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</td></tr>
              ) : leaves.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Ta'til topilmadi</td></tr>
              ) : leaves.map(l => (
                <tr key={l.id} className="border-t transition-colors hover:bg-[var(--bg-tertiary)]" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>{l.student_name}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{l.group_name}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{l.start_date}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{l.end_date}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{l.days_count}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{l.reason}</td>
                  <td className="px-4 py-3"><StatusBadge status={l.status} config={leaveStatusConfig} /></td>
                  <td className="px-4 py-3">
                    {l.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => handleApprove(l.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-green-500/10" title="Tasdiqlash">
                          <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" style={{ color: '#22C55E' }} />
                        </button>
                        <button onClick={() => handleReject(l.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10" title="Rad etish">
                          <FontAwesomeIcon icon={faTimes} className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

// ============================================
// TAB 4: DISCOUNTS
// ============================================
function DiscountsTab() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', kind: 'student_percent', value_type: 'percent', value: '', start_date: '', code: '' });

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await billingDiscountsService.getAll();
      setDiscounts(res.data.data || res.data.results || []);
    } catch { toast.error('Xato'); }
    setLoading(false);
  };

  useEffect(() => { fetchDiscounts(); }, []);

  const handleSave = async () => {
    try {
      await billingDiscountsService.create(form);
      toast.success('Chegirma yaratildi');
      setModal(false);
      fetchDiscounts();
    } catch (e) { toast.error(e.response?.data?.detail || 'Xato'); }
  };

  const handleDelete = async (id) => {
    if (!confirm("O'chirilsinmi?")) return;
    try {
      await billingDiscountsService.delete(id);
      toast.success("O'chirildi");
      fetchDiscounts();
    } catch { toast.error('Xato'); }
  };

  const F = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{discounts.length} ta chegirma</p>
        <button onClick={() => { setForm({ name: '', kind: 'student_percent', value_type: 'percent', value: '', start_date: '', code: '' }); setModal(true); }} className="btn btn-primary gap-2">
          <FontAwesomeIcon icon={faPlus} /> Yangi chegirma
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {['Nomi', 'Turi', 'Qiymat', 'Boshlanish', 'Promo kod', 'Faol', ''].map(h =>
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</td></tr>
              ) : discounts.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Chegirma topilmadi</td></tr>
              ) : discounts.map(d => (
                <tr key={d.id} className="border-t transition-colors hover:bg-[var(--bg-tertiary)]" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{d.name}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{discountKindLabels[d.kind] || d.kind}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: '#8B5CF6' }}>
                    {d.value_type === 'percent' ? `${d.value}%` : formatMoney(d.value)}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{d.start_date}</td>
                  <td className="px-4 py-3 text-sm font-mono" style={{ color: d.code ? '#3B82F6' : 'var(--text-muted)' }}>{d.code || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: d.is_active ? '#22C55E' : '#94A3B8' }} />
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(d.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10">
                      <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Yangi chegirma">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nomi</label>
            <input value={form.name} onChange={e => F('name', e.target.value)} className="input w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Turi</label>
              <select value={form.kind} onChange={e => F('kind', e.target.value)} className="input w-full">
                {Object.entries(discountKindLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Qiymat turi</label>
              <select value={form.value_type} onChange={e => F('value_type', e.target.value)} className="input w-full">
                <option value="percent">Foiz</option>
                <option value="fixed">Belgilangan</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Qiymat</label>
              <input type="number" value={form.value} onChange={e => F('value', e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Boshlanish</label>
              <input type="date" value={form.start_date} onChange={e => F('start_date', e.target.value)} className="input w-full" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Promo kod (ixtiyoriy)</label>
            <input value={form.code} onChange={e => F('code', e.target.value)} className="input w-full" placeholder="SALE20" />
          </div>
          <button onClick={handleSave} className="btn btn-primary w-full">Yaratish</button>
        </div>
      </Modal>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================
const tabs = [
  { key: 'invoices', label: 'Invoicelar', icon: faFileInvoice },
  { key: 'profiles', label: 'Profillar', icon: faCog },
  { key: 'leaves', label: "Ta'tillar", icon: faUmbrella },
  { key: 'discounts', label: 'Chegirmalar', icon: faGift },
];

export default function Billing() {
  const [activeTab, setActiveTab] = useState('invoices');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Hisob-kitob</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Invoicelar, billing profillar, chegirmalar va ta'tillar</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'shadow-sm' : ''}`}
            style={{
              backgroundColor: activeTab === tab.key ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
            }}>
            <FontAwesomeIcon icon={tab.icon} className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'invoices' && <InvoicesTab />}
      {activeTab === 'profiles' && <ProfilesTab />}
      {activeTab === 'leaves' && <LeavesTab />}
      {activeTab === 'discounts' && <DiscountsTab />}
    </div>
  );
}
