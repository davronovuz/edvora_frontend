import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faSearch, faEye, faEdit, faTrash, faPhone, faEnvelope,
  faUser, faUsers, faMapMarkerAlt, faDownload,
  faChevronLeft, faChevronRight, faChevronDown, faChevronUp,
  faTimes, faCheck, faInfoCircle, faMale, faFemale,
  faSnowflake, faSun, faArchive, faExclamationTriangle,
  faUserGraduate, faUserClock, faUserMinus, faSort, faSortUp, faSortDown,
  faEllipsisV, faFileExcel, faWallet, faCalendarAlt,
  faChartLine, faArrowUp, faArrowDown, faExchangeAlt, faMinus,
} from '@fortawesome/free-solid-svg-icons';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';
import { studentsService } from '@/services/students';
import { useAuthStore } from '@/stores/authStore';
import { formatMoney } from '@/utils/format';
import Drawer from '@/components/ui/Drawer';
import { unwrap } from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudents } from './useStudents';

// ============================================
// CONFIG
// ============================================
const statusConfig = {
  active: { label: 'Faol', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)', icon: faUser },
  inactive: { label: 'Nofaol', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)', icon: faUserClock },
  graduated: { label: 'Bitirgan', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', icon: faUserGraduate },
  frozen: { label: 'Muzlatilgan', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)', icon: faSnowflake },
  dropped: { label: 'Chiqib ketgan', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', icon: faUserMinus },
  archived: { label: 'Arxivlangan', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)', icon: faArchive },
};

const sourceOptions = [
  { value: '', label: 'Tanlang...' },
  { value: 'walk_in', label: "O'zi kelgan" },
  { value: 'instagram', label: 'Instagram' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Tavsiya' },
  { value: 'phone', label: 'Telefon' },
];

// ============================================
// REUSABLE COMPONENTS
// ============================================

function Section({ title, icon, iconColor, defaultOpen = true, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b" style={{ borderColor: 'var(--border-color)' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 transition-colors"
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
            <FontAwesomeIcon icon={icon} className="w-4 h-4" />
          </div>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{title}</span>
        </div>
        <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Input({ label, required, error, icon, prefix, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex">
        {prefix && (
          <div className="flex items-center justify-center px-4 rounded-l-xl border border-r-0" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{prefix}</span>
          </div>
        )}
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
            <FontAwesomeIcon icon={icon} className="w-4 h-4" />
          </span>
        )}
        <input
          className={`w-full h-12 px-4 rounded-xl border bg-transparent transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${prefix ? 'rounded-l-none' : ''} ${icon ? 'pl-11' : ''} ${error ? 'border-red-500' : ''}`}
          style={{ borderColor: error ? '#EF4444' : 'var(--border-color)', color: 'var(--text-primary)' }}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

function Select({ label, required, options, value, onChange, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 px-4 rounded-xl border bg-transparent transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function DeleteModal({ isOpen, onClose, onConfirm, studentName, loading }) {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 rounded-2xl shadow-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faTrash} className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>O'chirishni tasdiqlang</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            <strong>{studentName}</strong> ni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-12 rounded-xl border font-medium transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Bekor qilish
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium transition-colors flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "O'chirish"}
          </button>
        </div>
      </div>
    </>
  );
}

function FreezeModal({ isOpen, onClose, onConfirm, student, loading, form, setForm, errors }) {
  if (!isOpen) return null;
  const name = student ? `${student.first_name} ${student.last_name}` : '';
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg p-6 rounded-2xl shadow-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(6, 182, 212, 0.12)' }}>
            <FontAwesomeIcon icon={faSnowflake} className="w-5 h-5" style={{ color: '#06B6D4' }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>O'quvchini muzlatish</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{name}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Muzlatish sababi <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              rows={3}
              placeholder="Masalan: sog'lig'i yomon, vaqtincha dam olmoqda..."
              className="w-full px-3 py-2 rounded-lg border outline-none transition-colors resize-none text-sm"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: errors.reason ? '#EF4444' : 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => { if (!errors.reason) e.currentTarget.style.borderColor = 'var(--primary-600)'; }}
              onBlur={e => { if (!errors.reason) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            />
            {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Boshlanish sanasi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border outline-none text-sm"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: errors.start_date ? '#EF4444' : 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
              {errors.start_date && <p className="text-xs text-red-500 mt-1">{errors.start_date}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Qaytish sanasi
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })}
                min={form.start_date || undefined}
                className="w-full px-3 py-2 rounded-lg border outline-none text-sm"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: errors.end_date ? '#EF4444' : 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
              {errors.end_date && <p className="text-xs text-red-500 mt-1">{errors.end_date}</p>}
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(6, 182, 212, 0.08)' }}>
            <FontAwesomeIcon icon={faInfoCircle} className="w-4 h-4 mt-0.5" style={{ color: '#06B6D4' }} />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Muzlatilgan o'quvchi barcha guruhlardan vaqtincha chiqariladi. Keyin bitta bosish bilan qayta faollashtirsa bo'ladi.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-11 rounded-xl border font-medium transition-colors text-sm"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Bekor qilish
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-11 rounded-xl disabled:opacity-50 text-white font-medium transition-colors flex items-center justify-center gap-2 text-sm"
            style={{ backgroundColor: '#06B6D4' }}
            onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = '#0891B2')}
            onMouseLeave={e => !loading && (e.currentTarget.style.backgroundColor = '#06B6D4')}
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FontAwesomeIcon icon={faSnowflake} className="w-4 h-4" /> Muzlatish</>}
          </button>
        </div>
      </div>
    </>
  );
}

// Stat card — list variant with left accent border
function StatCard({ label, value, icon, color, bg, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[140px] p-4 rounded-xl border transition-all duration-200 text-left ${active ? 'shadow-md -translate-y-0.5' : 'hover:-translate-y-0.5 hover:shadow-md'}`}
      style={{
        borderColor: active ? color : 'var(--border-color)',
        borderLeftWidth: '4px',
        borderLeftColor: color,
        backgroundColor: active ? bg : 'var(--bg-secondary)',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.backgroundColor = bg;
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="text-[26px] font-bold leading-none tracking-tight" style={{ color: active ? color : '#1B365D' }}>{value}</p>
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: bg, color }}>
          <FontAwesomeIcon icon={icon} className="w-4 h-4" />
        </div>
      </div>
    </button>
  );
}

// ============================================
// HELPERS
// ============================================
const formatPhone = (p) => {
  if (!p) return '—';
  const c = p.replace(/\D/g, '');
  return c.length === 12 ? `+${c.slice(0, 3)} ${c.slice(3, 5)} ${c.slice(5, 8)} ${c.slice(8, 10)} ${c.slice(10)}` : p;
};
const getAge = (d) => {
  if (!d) return null;
  const t = new Date(), b = new Date(d);
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a;
};
const getInitials = (f, l) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase();

// ============================================
// MAIN COMPONENT
// ============================================
export default function Students() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Data — useStudents hook orqali
  const {
    students, setStudents,
    stats,
    loading,
    meta,
    search,
    searchInput, setSearchInput,
    statusFilter, setStatusFilter,
    debtFilter, setDebtFilter,
    sortField, sortDir,
    currentPage, setCurrentPage,
    handleSort,
    refresh: fetchStudents,
    refreshStats: fetchStats,
  } = useStudents();

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Drawers & Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formMode, setFormMode] = useState('create');
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Freeze modal
  const [isFreezeOpen, setIsFreezeOpen] = useState(false);
  const [freezeStudent, setFreezeStudent] = useState(null);
  const [freezeForm, setFreezeForm] = useState({ reason: '', start_date: '', end_date: '' });
  const [freezeErrors, setFreezeErrors] = useState({});
  const [freezeLoading, setFreezeLoading] = useState(false);

  // Action dropdown
  const [actionDropdownId, setActionDropdownId] = useState(null);
  const actionRef = useRef(null);

  // Progress & transfer history (view drawer)
  const [progress, setProgress] = useState(null);
  const [transferHistory, setTransferHistory] = useState([]);
  const [progressLoading, setProgressLoading] = useState(false);

  // Form
  const initialForm = {
    first_name: '', last_name: '', phone: '', email: '',
    gender: 'male', birth_date: '', address: '',
    telegram_username: '',
    parent_name: '', parent_phone: '', source: '', notes: '',
  };
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  // Close action dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (actionRef.current && !actionRef.current.contains(e.target)) {
        setActionDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch progress + transfer history when view drawer opens
  useEffect(() => {
    if (!isViewOpen || !selectedStudent?.id) {
      setProgress(null);
      setTransferHistory([]);
      return;
    }
    let cancelled = false;
    setProgressLoading(true);
    Promise.all([
      studentsService.getProgressSummary(selectedStudent.id),
      studentsService.getTransferHistory(selectedStudent.id),
    ])
      .then(([progRes, trRes]) => {
        if (cancelled) return;
        setProgress(unwrap(progRes));
        const tr = unwrap(trRes);
        setTransferHistory(Array.isArray(tr) ? tr : []);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error("Progress ma'lumotlarini olishda xato");
      })
      .finally(() => {
        if (!cancelled) setProgressLoading(false);
      });
    return () => { cancelled = true; };
  }, [isViewOpen, selectedStudent?.id]);

  const { isOwner, isOwnerOrAdmin, isRegistrar } = usePermissions();
  const canEdit = isOwnerOrAdmin;
  const canCreate = isOwnerOrAdmin || isRegistrar;
  const canDelete = isOwner;

  // Selection
  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === students.length ? [] : students.map(s => s.id));
  };
  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return faSort;
    return sortDir === 'asc' ? faSortUp : faSortDown;
  };

  // Export
  const handleExport = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (debtFilter === 'debt') params.has_debt = 'true';
      params.per_page = 10000; // all

      const res = await studentsService.getAll(params);
      const data = res.data?.data || res.data?.results || res.data || [];
      if (!Array.isArray(data) || data.length === 0) {
        toast.error("Eksport uchun ma'lumot topilmadi");
        return;
      }

      // CSV yaratish
      const headers = ['Ism', 'Familiya', 'Telefon', 'Email', 'Jinsi', "Tug'ilgan sana", 'Balans', 'Status', 'Manba', 'Manzil'];
      const rows = data.map(s => [
        s.first_name, s.last_name, s.phone || '', s.email || '',
        s.gender === 'male' ? 'Erkak' : 'Ayol',
        s.birth_date || '', s.balance || 0,
        statusConfig[s.status]?.label || s.status,
        sourceOptions.find(o => o.value === s.source)?.label || s.source || '',
        s.address || '',
      ]);

      const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oqivchilar_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Eksport tayyor!');
    } catch {
      toast.error('Eksport xatolik');
    }
  };

  // Form handlers
  const openCreate = () => {
    setForm(initialForm);
    setErrors({});
    setFormMode('create');
    setIsFormOpen(true);
  };

  const openEdit = (student) => {
    setSelectedStudent(student);
    setForm({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      phone: student.phone?.replace('+998', '') || '',
      email: student.email || '',
      gender: student.gender || 'male',
      birth_date: student.birth_date || '',
      address: student.address || '',
      telegram_username: student.telegram_username || '',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone?.replace('+998', '') || '',
      source: student.source || '',
      notes: student.notes || '',
    });
    setErrors({});
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const openView = async (student) => {
    try {
      const res = await studentsService.getById(student.id);
      setSelectedStudent(res.data?.data || res.data);
    } catch {
      setSelectedStudent(student);
    }
    setIsViewOpen(true);
  };

  const openDelete = (student) => {
    setSelectedStudent(student);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'Ism kiritilmagan';
    if (!form.last_name.trim()) errs.last_name = 'Familiya kiritilmagan';
    if (!form.phone.trim()) errs.phone = 'Telefon kiritilmagan';
    else if (form.phone.replace(/\D/g, '').length !== 9) errs.phone = "Telefon 9 ta raqam bo'lishi kerak";
    if (form.parent_phone && form.parent_phone.replace(/\D/g, '').length > 0 && form.parent_phone.replace(/\D/g, '').length !== 9) {
      errs.parent_phone = "Telefon 9 ta raqam bo'lishi kerak";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const data = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: '+998' + form.phone.replace(/\D/g, ''),
      gender: form.gender,
    };

    if (form.source) data.source = form.source;
    if (form.email?.trim()) data.email = form.email.trim();
    if (form.birth_date) data.birth_date = form.birth_date;
    if (form.address?.trim()) data.address = form.address.trim();
    if (form.telegram_username?.trim()) data.telegram_username = form.telegram_username.trim();
    if (form.parent_name?.trim()) data.parent_name = form.parent_name.trim();
    if (form.parent_phone?.trim() && form.parent_phone.replace(/\D/g, '').length === 9) {
      data.parent_phone = '+998' + form.parent_phone.replace(/\D/g, '');
    }
    if (form.notes?.trim()) data.notes = form.notes.trim();

    setFormLoading(true);
    try {
      if (formMode === 'create') {
        await studentsService.create(data);
        toast.success("O'quvchi muvaffaqiyatli qo'shildi!");
      } else {
        await studentsService.update(selectedStudent.id, data);
        toast.success("O'quvchi yangilandi!");
      }
      setIsFormOpen(false);
      fetchStudents();
      fetchStats();
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.error?.message || errData?.detail || "Xatolik yuz berdi";
      if (errData?.error?.details) {
        const fieldErrors = {};
        errData.error.details.forEach(d => {
          if (d.field) fieldErrors[d.field] = d.message;
        });
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          return;
        }
      }
      // phone unique xatosi
      if (errData?.phone) {
        setErrors({ phone: Array.isArray(errData.phone) ? errData.phone[0] : errData.phone });
        return;
      }
      toast.error(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await studentsService.delete(selectedStudent.id);
      toast.success("O'quvchi o'chirildi!");
      setIsDeleteOpen(false);
      fetchStudents();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Xatolik yuz berdi");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openFreeze = (student) => {
    setFreezeStudent(student);
    setFreezeForm({
      reason: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
    });
    setFreezeErrors({});
    setIsFreezeOpen(true);
  };

  const submitFreeze = async () => {
    const errs = {};
    if (!freezeForm.reason.trim() || freezeForm.reason.trim().length < 3) {
      errs.reason = "Sabab kamida 3 ta belgi bo'lishi kerak";
    }
    if (!freezeForm.start_date) {
      errs.start_date = 'Sana majburiy';
    }
    if (freezeForm.end_date && freezeForm.end_date < freezeForm.start_date) {
      errs.end_date = "Qaytish sanasi boshlanishidan keyin bo'lishi kerak";
    }
    if (Object.keys(errs).length) {
      setFreezeErrors(errs);
      return;
    }
    setFreezeLoading(true);
    try {
      const payload = {
        start_date: freezeForm.start_date,
        reason: freezeForm.reason.trim(),
      };
      if (freezeForm.end_date) payload.end_date = freezeForm.end_date;
      await studentsService.freeze(freezeStudent.id, payload);
      toast.success(`${freezeStudent.first_name} muzlatildi`);
      setIsFreezeOpen(false);
      setFreezeStudent(null);
      fetchStudents();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Xatolik yuz berdi");
    } finally {
      setFreezeLoading(false);
    }
  };

  const handleUnfreeze = async (student) => {
    if (!window.confirm(`${student.first_name} ${student.last_name} ni muzlatishdan chiqarasizmi?`)) return;
    try {
      await studentsService.unfreeze(student.id);
      toast.success(`${student.first_name} faollashtirildi`);
      fetchStudents();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Xatolik yuz berdi");
    }
  };

  // Stat filter toggle
  const toggleStatFilter = (status) => {
    if (statusFilter === status) {
      setStatusFilter('');
    } else {
      setStatusFilter(status);
      setDebtFilter('');
    }
    setCurrentPage(1);
  };

  const toggleDebtFilter = () => {
    if (debtFilter === 'debt') {
      setDebtFilter('');
    } else {
      setDebtFilter('debt');
      setStatusFilter('');
    }
    setCurrentPage(1);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-5 fade-up">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: '#1B365D' }}>
            {t('students.title')}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            O'quvchilarni boshqarish va monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="h-10 px-4 rounded-xl border font-medium flex items-center gap-2 transition-all duration-200"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#22C55E';
              e.currentTarget.style.color = '#22C55E';
              e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <FontAwesomeIcon icon={faFileExcel} className="w-4 h-4" />
            <span className="hidden sm:inline">Eksport</span>
          </button>
          {canCreate && (
            <button onClick={openCreate} className="h-10 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium flex items-center gap-2 transition-colors">
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
              {t('students.addStudent')}
            </button>
          )}
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        <StatCard
          label="Jami o'quvchilar"
          value={stats?.total || 0}
          icon={faUsers}
          color="#6366F1"
          bg="rgba(99, 102, 241, 0.08)"
          onClick={() => { setStatusFilter(''); setDebtFilter(''); setCurrentPage(1); }}
          active={!statusFilter && !debtFilter}
        />
        <StatCard
          label="Faol"
          value={stats?.active || 0}
          icon={faUser}
          color="#22C55E"
          bg="rgba(34, 197, 94, 0.08)"
          onClick={() => toggleStatFilter('active')}
          active={statusFilter === 'active'}
        />
        <StatCard
          label="Muzlatilgan"
          value={stats?.frozen || 0}
          icon={faSnowflake}
          color="#06B6D4"
          bg="rgba(6, 182, 212, 0.08)"
          onClick={() => toggleStatFilter('frozen')}
          active={statusFilter === 'frozen'}
        />
        <StatCard
          label="Qarzdorlar"
          value={stats?.with_debt || 0}
          icon={faExclamationTriangle}
          color="#EF4444"
          bg="rgba(239, 68, 68, 0.08)"
          onClick={toggleDebtFilter}
          active={debtFilter === 'debt'}
        />
      </div>

      {/* SEARCH & FILTERS */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <FontAwesomeIcon icon={faSearch} className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Ism, familiya yoki telefon bo'yicha qidirish..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-xl border bg-transparent transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setDebtFilter(''); setCurrentPage(1); }}
            className="h-11 px-4 rounded-xl border bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <option value="">Barcha status</option>
            <option value="active">Faol</option>
            <option value="frozen">Muzlatilgan</option>
            <option value="graduated">Bitirgan</option>
            <option value="dropped">Chiqib ketgan</option>
          </select>
          {(searchInput || statusFilter || debtFilter) && (
            <button
              onClick={() => { setSearchInput(''); setStatusFilter(''); setDebtFilter(''); setCurrentPage(1); }}
              className="h-11 px-4 rounded-xl font-medium transition-colors text-red-500"
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Tozalash
            </button>
          )}
        </div>

        {/* Active filters info */}
        {(statusFilter || debtFilter || search) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Filtrlar:</span>
            {statusFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: statusConfig[statusFilter]?.bg, color: statusConfig[statusFilter]?.color }}>
                {statusConfig[statusFilter]?.label}
                <button onClick={() => { setStatusFilter(''); setCurrentPage(1); }} className="ml-1 opacity-60 hover:opacity-100">
                  <FontAwesomeIcon icon={faTimes} className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {debtFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' }}>
                Qarzdorlar
                <button onClick={() => { setDebtFilter(''); setCurrentPage(1); }} className="ml-1 opacity-60 hover:opacity-100">
                  <FontAwesomeIcon icon={faTimes} className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', color: '#6366F1' }}>
                "{search}"
                <button onClick={() => { setSearchInput(''); setCurrentPage(1); }} className="ml-1 opacity-60 hover:opacity-100">
                  <FontAwesomeIcon icon={faTimes} className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
              {meta.total} ta natija
            </span>
          </div>
        )}
      </div>

      {/* BULK ACTIONS */}
      {selectedIds.length > 0 && canEdit && (
        <div className="card p-3 flex items-center gap-3" style={{ borderColor: 'var(--color-primary-500)', borderWidth: '2px' }}>
          <span className="text-sm font-medium px-2" style={{ color: 'var(--text-primary)' }}>
            {selectedIds.length} ta tanlandi
          </span>
          <div className="h-5 w-px" style={{ backgroundColor: 'var(--border-color)' }} />
          <button
            onClick={() => {
              const first = selectedIds
                .map(id => students.find(st => st.id === id))
                .find(s => s?.status === 'active');
              if (first) openFreeze(first);
              setSelectedIds([]);
            }}
            className="h-8 px-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            style={{ color: '#06B6D4' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <FontAwesomeIcon icon={faSnowflake} className="w-3.5 h-3.5" /> Muzlatish
          </button>
          <button
            onClick={() => {
              selectedIds.forEach(id => {
                const s = students.find(st => st.id === id);
                if (s?.status === 'frozen') handleUnfreeze(s);
              });
              setSelectedIds([]);
            }}
            className="h-8 px-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            style={{ color: '#22C55E' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <FontAwesomeIcon icon={faSun} className="w-3.5 h-3.5" /> Faollashtirish
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="ml-auto h-8 px-3 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Bekor qilish
          </button>
        </div>
      )}

      {/* TABLE */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <FontAwesomeIcon icon={faUsers} className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {search || statusFilter || debtFilter ? "Natija topilmadi" : "O'quvchilar yo'q"}
            </h3>
            <p className="mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
              {search || statusFilter || debtFilter ? "Filterni o'zgartirib ko'ring" : "Yangi o'quvchi qo'shing"}
            </p>
            {canCreate && !search && !statusFilter && !debtFilter && (
              <button onClick={openCreate} className="h-11 px-6 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium flex items-center gap-2 transition-colors">
                <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                {t('students.addStudent')}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <th className="p-4 w-12">
                      <input type="checkbox" checked={selectedIds.length === students.length && students.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded cursor-pointer accent-primary-600" />
                    </th>
                    <th className="p-4 text-left">
                      <button onClick={() => handleSort('first_name')} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: sortField === 'first_name' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        O'quvchi
                        <FontAwesomeIcon icon={getSortIcon('first_name')} className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Telefon</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>Guruhlar</th>
                    <th className="p-4 text-left">
                      <button onClick={() => handleSort('balance')} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: sortField === 'balance' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        Balans
                        <FontAwesomeIcon icon={getSortIcon('balance')} className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                    <th className="p-4 w-20" />
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b last:border-0 transition-colors duration-150 cursor-pointer"
                      style={{ borderColor: 'var(--border-color)' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={(e) => {
                        if (e.target.closest('input[type="checkbox"]') || e.target.closest('.actions-cell')) return;
                        navigate(`/app/students/${s.id}`);
                      }}
                    >
                      <td className="p-4" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} className="w-4 h-4 rounded cursor-pointer accent-primary-600" />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0" style={{ backgroundColor: s.gender === 'female' ? '#EC4899' : '#1B365D' }}>
                            {getInitials(s.first_name, s.last_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{s.first_name} {s.last_name}</p>
                            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                              {s.created_at ? new Date(s.created_at).toLocaleDateString('uz-UZ') : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatPhone(s.phone)}</span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        {s.groups_count != null ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                            <FontAwesomeIcon icon={faUsers} className="w-3 h-3" />
                            {s.groups_count} ta
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`font-semibold text-sm ${Number(s.balance) < 0 ? 'text-red-500' : Number(s.balance) > 0 ? 'text-green-600' : ''}`} style={Number(s.balance) === 0 ? { color: 'var(--text-muted)' } : {}}>
                          {formatMoney(s.balance)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusConfig[s.status]?.bg, color: statusConfig[s.status]?.color }}>
                          <FontAwesomeIcon icon={statusConfig[s.status]?.icon || faUser} className="w-3 h-3" />
                          {statusConfig[s.status]?.label || s.status}
                        </span>
                      </td>
                      <td className="p-4 actions-cell" onClick={e => e.stopPropagation()}>
                        <div className="relative" ref={actionDropdownId === s.id ? actionRef : null}>
                          <button
                            onClick={() => setActionDropdownId(actionDropdownId === s.id ? null : s.id)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                            onMouseLeave={e => {
                              if (actionDropdownId !== s.id) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <FontAwesomeIcon icon={faEllipsisV} className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {actionDropdownId === s.id && (
                            <div
                              className="absolute right-0 top-full mt-1 w-48 rounded-xl shadow-lg border z-30 py-1 overflow-hidden"
                              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                            >
                              <button
                                onClick={() => { navigate(`/app/students/${s.id}`); setActionDropdownId(null); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <FontAwesomeIcon icon={faEye} className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                Ko'rish
                              </button>
                              {canEdit && (
                                <button
                                  onClick={() => { openEdit(s); setActionDropdownId(null); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                                  style={{ color: 'var(--text-primary)' }}
                                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <FontAwesomeIcon icon={faEdit} className="w-4 h-4 text-primary-600" />
                                  Tahrirlash
                                </button>
                              )}
                              {canEdit && s.status === 'active' && (
                                <button
                                  onClick={() => { openFreeze(s); setActionDropdownId(null); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                                  style={{ color: 'var(--text-primary)' }}
                                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <FontAwesomeIcon icon={faSnowflake} className="w-4 h-4" style={{ color: '#06B6D4' }} />
                                  Muzlatish
                                </button>
                              )}
                              {canEdit && s.status === 'frozen' && (
                                <button
                                  onClick={() => { handleUnfreeze(s); setActionDropdownId(null); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                                  style={{ color: 'var(--text-primary)' }}
                                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <FontAwesomeIcon icon={faSun} className="w-4 h-4" style={{ color: '#22C55E' }} />
                                  Faollashtirish
                                </button>
                              )}
                              {canDelete && (
                                <>
                                  <div className="my-1 border-t" style={{ borderColor: 'var(--border-color)' }} />
                                  <button
                                    onClick={() => { openDelete(s); setActionDropdownId(null); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-red-500"
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.06)'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                                    O'chirish
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {meta.total_pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {(currentPage - 1) * meta.per_page + 1}–{Math.min(currentPage * meta.per_page, meta.total)} / {meta.total}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => { if (currentPage > 1) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, meta.total_pages) }, (_, i) => {
                    let page;
                    if (meta.total_pages <= 5) page = i + 1;
                    else if (currentPage <= 3) page = i + 1;
                    else if (currentPage >= meta.total_pages - 2) page = meta.total_pages - 4 + i;
                    else page = currentPage - 2 + i;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-primary-600 text-white' : ''}`}
                        style={currentPage !== page ? { color: 'var(--text-secondary)' } : {}}
                        onMouseEnter={e => { if (currentPage !== page) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                        onMouseLeave={e => { if (currentPage !== page) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(meta.total_pages, p + 1))}
                    disabled={currentPage === meta.total_pages}
                    className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => { if (currentPage < meta.total_pages) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CREATE/EDIT DRAWER */}
      <Drawer isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={formMode === 'create' ? t('students.addStudent') : "O'quvchini tahrirlash"}>
        <div>
          <div className="flex justify-center py-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: form.gender === 'female' ? '#EC4899' : '#1B365D' }}>
              {getInitials(form.first_name, form.last_name) || <FontAwesomeIcon icon={faUser} className="w-10 h-10 opacity-50" />}
            </div>
          </div>

          <Section title="Shaxsiy ma'lumotlar" icon={faUser} iconColor="bg-primary-100 dark:bg-primary-900/30 text-primary-600" defaultOpen={true}>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Ism" required placeholder="Ism kiriting" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} error={errors.first_name} />
              <Input label="Familiya" required placeholder="Familiya kiriting" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} error={errors.last_name} />
            </div>
            <Input label="Telefon raqam" required prefix="+998" placeholder="90 123 45 67" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 9) })} error={errors.phone} />
            <Input label="Email" type="email" icon={faEnvelope} placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Tug'ilgan sana" type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Jinsi</label>
                <div className="flex h-12 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                  <button type="button" onClick={() => setForm({ ...form, gender: 'male' })} className={`flex-1 flex items-center justify-center gap-2 font-medium transition-colors ${form.gender === 'male' ? 'bg-primary-600 text-white' : ''}`}
                    style={form.gender !== 'male' ? { color: 'var(--text-secondary)' } : {}}
                    onMouseEnter={e => { if (form.gender !== 'male') e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                    onMouseLeave={e => { if (form.gender !== 'male') e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <FontAwesomeIcon icon={faMale} className="w-4 h-4" /> Erkak
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, gender: 'female' })} className={`flex-1 flex items-center justify-center gap-2 font-medium transition-colors ${form.gender === 'female' ? 'bg-pink-500 text-white' : ''}`}
                    style={form.gender !== 'female' ? { color: 'var(--text-secondary)' } : {}}
                    onMouseEnter={e => { if (form.gender !== 'female') e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                    onMouseLeave={e => { if (form.gender !== 'female') e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <FontAwesomeIcon icon={faFemale} className="w-4 h-4" /> Ayol
                  </button>
                </div>
              </div>
            </div>
            <Input label="Manzil" icon={faMapMarkerAlt} placeholder="Shahar, tuman, ko'cha" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Section>

          <Section title="Ota-ona ma'lumotlari" icon={faUsers} iconColor="bg-orange-100 dark:bg-orange-900/30 text-orange-500" defaultOpen={false}>
            <Input label="Ota-ona ismi" placeholder="To'liq ism" value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} />
            <Input label="Telefon raqam" prefix="+998" placeholder="90 123 45 67" value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value.replace(/\D/g, '').slice(0, 9) })} error={errors.parent_phone} />
          </Section>

          <Section title="Telegram" icon={faTelegram} iconColor="bg-sky-100 dark:bg-sky-900/30 text-sky-500" defaultOpen={false}>
            <Input label="Telegram username" icon={faTelegram} placeholder="@username" value={form.telegram_username} onChange={(e) => setForm({ ...form, telegram_username: e.target.value })} />
          </Section>

          <Section title="Qo'shimcha" icon={faInfoCircle} iconColor="bg-gray-100 dark:bg-gray-800 text-gray-500" defaultOpen={false}>
            <Select label="Qayerdan kelgan?" options={sourceOptions} value={form.source} onChange={(v) => setForm({ ...form, source: v })} />
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Izoh</label>
              <textarea rows={3} placeholder="Qo'shimcha ma'lumot..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </Section>

          <div className="sticky bottom-0 flex gap-3 p-6 border-t" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <button
              onClick={() => setIsFormOpen(false)}
              className="flex-1 h-12 rounded-xl border font-medium transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Bekor qilish
            </button>
            <button onClick={handleSubmit} disabled={formLoading} className="flex-1 h-12 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2 transition-colors">
              {formLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                <>
                  <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                  {formMode === 'create' ? "Qo'shish" : 'Saqlash'}
                </>
              )}
            </button>
          </div>
        </div>
      </Drawer>

      {/* VIEW DRAWER */}
      <Drawer isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="O'quvchi ma'lumotlari" width="560px">
        {selectedStudent && (
          <div>
            {/* Header section */}
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0" style={{ backgroundColor: selectedStudent.gender === 'female' ? '#EC4899' : '#1B365D' }}>
                  {getInitials(selectedStudent.first_name, selectedStudent.last_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{selectedStudent.first_name} {selectedStudent.last_name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusConfig[selectedStudent.status]?.bg, color: statusConfig[selectedStudent.status]?.color }}>
                      <FontAwesomeIcon icon={statusConfig[selectedStudent.status]?.icon || faUser} className="w-3 h-3" />
                      {statusConfig[selectedStudent.status]?.label}
                    </span>
                    {getAge(selectedStudent.birth_date) && (
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{getAge(selectedStudent.birth_date)} yosh</span>
                    )}
                  </div>
                  {selectedStudent.created_at && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3 mr-1" />
                      Qo'shilgan: {new Date(selectedStudent.created_at).toLocaleDateString('uz-UZ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Balance card */}
              <div className="mt-4 p-4 rounded-xl" style={{
                backgroundColor: Number(selectedStudent.balance) < 0 ? 'rgba(239, 68, 68, 0.08)' : Number(selectedStudent.balance) > 0 ? 'rgba(34, 197, 94, 0.08)' : 'var(--bg-tertiary)',
              }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      <FontAwesomeIcon icon={faWallet} className="w-3 h-3 mr-1" />
                      Balans
                    </p>
                    <p className={`text-2xl font-bold mt-0.5 ${Number(selectedStudent.balance) < 0 ? 'text-red-500' : Number(selectedStudent.balance) > 0 ? 'text-green-600' : ''}`}
                      style={Number(selectedStudent.balance) === 0 ? { color: 'var(--text-muted)' } : {}}>
                      {formatMoney(selectedStudent.balance)}
                    </p>
                  </div>
                  {Number(selectedStudent.balance) < 0 && (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/app/students/${selectedStudent.id}/finance`)}
                  className="mt-3 w-full h-10 rounded-xl text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                >
                  <FontAwesomeIcon icon={faWallet} className="w-3.5 h-3.5" />
                  Moliya tafsilotlari
                </button>
              </div>
            </div>

            {/* Contact info */}
            <div className="p-6 space-y-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary-100 dark:bg-primary-900/30">
                  <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Telefon</p>
                  <a href={`tel:${selectedStudent.phone}`} className="font-medium text-primary-600 text-sm">{formatPhone(selectedStudent.phone)}</a>
                </div>
              </div>
              {selectedStudent.email && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                    <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Email</p>
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{selectedStudent.email}</p>
                  </div>
                </div>
              )}
              {selectedStudent.telegram_username && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-sky-100 dark:bg-sky-900/30">
                    <FontAwesomeIcon icon={faTelegram} className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Telegram</p>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{selectedStudent.telegram_username}</p>
                  </div>
                </div>
              )}
              {selectedStudent.address && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Manzil</p>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{selectedStudent.address}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Parent info */}
            {selectedStudent.parent_name && (
              <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Ota-ona</h4>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-orange-100 dark:bg-orange-900/30">
                    <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{selectedStudent.parent_name}</p>
                    {selectedStudent.parent_phone && (
                      <a href={`tel:${selectedStudent.parent_phone}`} className="text-xs text-primary-600">{formatPhone(selectedStudent.parent_phone)}</a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Groups */}
            {selectedStudent.groups && selectedStudent.groups.length > 0 && (
              <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Guruhlar</h4>
                <div className="space-y-2">
                  {selectedStudent.groups.map((g, i) => (
                    <div key={g.id || i} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30">
                          <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{g.name}</p>
                          {g.teacher_name && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{g.teacher_name}</p>}
                        </div>
                      </div>
                      {g.schedule && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{g.schedule}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source & notes */}
            {(selectedStudent.source || selectedStudent.notes) && (
              <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
                {selectedStudent.source && (
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <span style={{ color: 'var(--text-muted)' }}>Manba:</span>
                    <span className="px-2 py-0.5 rounded-lg text-xs font-medium" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                      {selectedStudent.source_display || sourceOptions.find(o => o.value === selectedStudent.source)?.label || selectedStudent.source}
                    </span>
                  </div>
                )}
                {selectedStudent.notes && (
                  <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <p className="text-xs font-medium mb-1" style={{ color: '#D97706' }}>Izoh</p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{selectedStudent.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Progress */}
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30">
                  <FontAwesomeIcon icon={faChartLine} className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Progress</h4>
              </div>
              {progressLoading && !progress ? (
                <div className="grid grid-cols-3 gap-2">
                  {[0,1,2].map(i => (
                    <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
                  ))}
                </div>
              ) : progress ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Davomat</p>
                    {progress.attendance?.month_rate != null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{Math.round(progress.attendance.month_rate)}%</span>
                        {progress.attendance.trend === 'up' && <FontAwesomeIcon icon={faArrowUp} className="w-3 h-3 text-green-500" />}
                        {progress.attendance.trend === 'down' && <FontAwesomeIcon icon={faArrowDown} className="w-3 h-3 text-red-500" />}
                        {progress.attendance.trend === 'stable' && <FontAwesomeIcon icon={faMinus} className="w-3 h-3 text-gray-400" />}
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Ma'lumot yo'q</span>
                    )}
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>joriy oy</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Baholar</p>
                    {progress.grades?.exam_avg != null ? (
                      <>
                        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{Number(progress.grades.exam_avg).toFixed(1)}</span>
                        <span className="text-xs ml-0.5" style={{ color: 'var(--text-muted)' }}>/100</span>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{progress.grades.exam_count || 0} ta imtihon</p>
                      </>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Ma'lumot yo'q</span>
                    )}
                    {progress.grades?.homework_avg != null && (
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Uy vaz.: {Number(progress.grades.homework_avg).toFixed(1)}</p>
                    )}
                  </div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Moliya</p>
                    <span className={`text-lg font-bold ${Number(progress.finance?.balance) < 0 ? 'text-red-500' : ''}`} style={Number(progress.finance?.balance) >= 0 ? { color: 'var(--text-primary)' } : {}}>
                      {formatMoney(progress.finance?.balance ?? 0)}
                    </span>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {progress.finance?.groups_with_debt > 0
                        ? `${progress.finance.groups_with_debt} qarzdor guruh`
                        : 'qarz yo\'q'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Ma'lumot yuklanmadi</p>
              )}
            </div>

            {/* Transfer history */}
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-100 dark:bg-violet-900/30">
                  <FontAwesomeIcon icon={faExchangeAlt} className="w-4 h-4 text-violet-600" />
                </div>
                <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Ko'chirish tarixi</h4>
              </div>
              {progressLoading && transferHistory.length === 0 ? (
                <div className="space-y-2">
                  {[0,1].map(i => (
                    <div key={i} className="h-12 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
                  ))}
                </div>
              ) : transferHistory.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Hech qanday ko'chirish bo'lmagan</p>
              ) : (
                <div className="space-y-2">
                  {transferHistory.map(t => (
                    <div key={t.id} className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        <span className="truncate">{t.from_group?.name || '—'}</span>
                        <FontAwesomeIcon icon={faArrowUp} className="w-3 h-3 rotate-90" style={{ color: 'var(--text-muted)' }} />
                        <span className="truncate">{t.to_group?.name || '—'}</span>
                      </div>
                      {t.reason && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t.reason}</p>
                      )}
                      <div className="flex items-center justify-between mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        <span>{t.performed_by?.name || 'Tizim'}</span>
                        {t.date && <span>{new Date(t.date).toLocaleDateString('uz-UZ')}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6">
              <div className="flex gap-3">
                {canEdit && (
                  <button
                    onClick={() => { setIsViewOpen(false); openEdit(selectedStudent); }}
                    className="flex-1 h-12 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                    Tahrirlash
                  </button>
                )}
                {canEdit && selectedStudent.status === 'active' && (
                  <button
                    onClick={() => { openFreeze(selectedStudent); setIsViewOpen(false); }}
                    className="h-12 px-5 rounded-xl border font-medium flex items-center justify-center gap-2 transition-colors"
                    style={{ borderColor: '#06B6D4', color: '#06B6D4' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.08)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FontAwesomeIcon icon={faSnowflake} className="w-4 h-4" />
                    Muzlatish
                  </button>
                )}
                {canEdit && selectedStudent.status === 'frozen' && (
                  <button
                    onClick={() => { handleUnfreeze(selectedStudent); setIsViewOpen(false); }}
                    className="h-12 px-5 rounded-xl border font-medium flex items-center justify-center gap-2 transition-colors"
                    style={{ borderColor: '#22C55E', color: '#22C55E' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.08)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FontAwesomeIcon icon={faSun} className="w-4 h-4" />
                    Faollashtirish
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* DELETE MODAL */}
      <DeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        studentName={`${selectedStudent?.first_name} ${selectedStudent?.last_name}`}
        loading={deleteLoading}
      />

      {/* FREEZE MODAL */}
      <FreezeModal
        isOpen={isFreezeOpen}
        onClose={() => { setIsFreezeOpen(false); setFreezeStudent(null); }}
        onConfirm={submitFreeze}
        student={freezeStudent}
        loading={freezeLoading}
        form={freezeForm}
        setForm={setFreezeForm}
        errors={freezeErrors}
      />
    </div>
  );
}
