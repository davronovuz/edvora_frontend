import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faSearch, faEye, faEdit, faTrash, faPhone, faEnvelope,
  faUser, faUsers, faMapMarkerAlt,
  faChevronLeft, faChevronRight, faChevronDown, faChevronUp,
  faTimes, faCheck, faInfoCircle, faChalkboardTeacher,
  faGraduationCap, faMoneyBillWave, faCalendarAlt, faBook,
  faSort, faSortUp, faSortDown, faEllipsisV, faFileExcel,
  faWallet, faClock, faPause, faPlay, faBriefcase,
} from '@fortawesome/free-solid-svg-icons';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';
import { teachersService } from '@/services/teachers';
import { useAuthStore } from '@/stores/authStore';
import { formatMoney } from '@/utils/format';
import Drawer from '@/components/ui/Drawer';

// ============================================
// CONFIG
// ============================================
const statusConfig = {
  active: { label: 'Faol', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)', icon: faUser },
  inactive: { label: 'Nofaol', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)', icon: faPause },
  on_leave: { label: "Ta'tilda", color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', icon: faClock },
};

const salaryTypeConfig = {
  fixed: { label: 'Belgilangan oylik', icon: faWallet, color: '#22C55E' },
  hourly: { label: 'Soatlik', icon: faClock, color: '#3B82F6' },
  percent: { label: 'Foizli', icon: faMoneyBillWave, color: '#8B5CF6' },
};

const salaryTypeOptions = [
  { value: 'fixed', label: 'Belgilangan oylik' },
  { value: 'hourly', label: 'Soatlik' },
  { value: 'percent', label: 'Foizli (guruhdan %)' },
];

// ============================================
// REUSABLE COMPONENTS
// ============================================

function Section({ title, icon, iconColor, defaultOpen = true, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b" style={{ borderColor: 'var(--border-color)' }}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-6 py-4 transition-colors"
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
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

function Input({ label, required, error, icon, prefix, suffix, className = '', ...props }) {
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
          className={`w-full h-12 px-4 rounded-xl border bg-transparent transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${prefix ? 'rounded-l-none' : ''} ${suffix ? 'rounded-r-none' : ''} ${icon ? 'pl-11' : ''} ${error ? 'border-red-500' : ''}`}
          style={{ borderColor: error ? '#EF4444' : 'var(--border-color)', color: 'var(--text-primary)' }}
          {...props}
        />
        {suffix && (
          <div className="flex items-center justify-center px-4 rounded-r-xl border border-l-0" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{suffix}</span>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

function SelectInput({ label, required, options, value, onChange, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 px-4 rounded-xl border bg-transparent transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}>
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function DeleteModal({ isOpen, onClose, onConfirm, name, loading }) {
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
          <p style={{ color: 'var(--text-secondary)' }}><strong>{name}</strong> ni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.</p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} disabled={loading} className="flex-1 h-12 rounded-xl border font-medium transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
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

function StatCard({ label, value, icon, color, bg, onClick, active }) {
  return (
    <button onClick={onClick}
      className={`flex-1 min-w-[140px] p-4 rounded-xl border-2 transition-all duration-200 text-left ${active ? 'shadow-sm scale-[1.02]' : ''}`}
      style={{ borderColor: active ? color : 'var(--border-color)', backgroundColor: active ? bg : 'var(--bg-secondary)' }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = color; e.currentTarget.style.backgroundColor = bg; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; } }}>
      <div className="flex items-center justify-between mb-2">
        <FontAwesomeIcon icon={icon} className="w-5 h-5" style={{ color }} />
        <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
      </div>
      <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
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
const getInitials = (f, l) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase();
const formatSalary = (type, amount, percent) => {
  if (type === 'percent') return `${percent || 0}%`;
  if (type === 'hourly') return `${formatMoney(amount)} / soat`;
  return formatMoney(amount);
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function Teachers() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Server-side
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1, per_page: 20 });

  // Stats (computed from meta or separate)
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, on_leave: 0 });

  // UI states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherGroups, setTeacherGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionDropdownId, setActionDropdownId] = useState(null);
  const actionRef = useRef(null);

  const initialForm = {
    first_name: '', last_name: '', phone: '', phone_secondary: '', email: '',
    birth_date: '', address: '', bio: '',
    salary_type: 'fixed', salary_amount: '', salary_percent: '',
    hired_date: '', telegram_username: '', status: 'active',
  };
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const canCreate = user?.role === 'owner';
  const canEdit = user?.role === 'owner';
  const canDelete = user?.role === 'owner';

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (actionRef.current && !actionRef.current.contains(e.target)) setActionDropdownId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setCurrentPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch
  useEffect(() => { fetchTeachers(); }, [currentPage, search, statusFilter, sortField, sortDir]);
  useEffect(() => { fetchStats(); }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, per_page: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (sortField) params.ordering = (sortDir === 'desc' ? '-' : '') + sortField;

      const res = await teachersService.getAll(params);
      const responseData = res.data;

      if (responseData?.data && Array.isArray(responseData.data)) {
        setTeachers(responseData.data);
        if (responseData.meta) setMeta(responseData.meta);
      } else if (Array.isArray(responseData?.results)) {
        setTeachers(responseData.results);
        setMeta({ total: responseData.count || 0, total_pages: Math.ceil((responseData.count || 0) / 20), per_page: 20 });
      } else if (Array.isArray(responseData)) {
        setTeachers(responseData);
        setMeta({ total: responseData.length, total_pages: 1, per_page: 20 });
      } else {
        setTeachers([]);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "O'qituvchilarni yuklashda xatolik");
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Har bir status uchun count olish (backend filterset_fields = ['status'])
      const [allRes, activeRes, onLeaveRes] = await Promise.allSettled([
        teachersService.getAll({ per_page: 1 }),
        teachersService.getAll({ per_page: 1, status: 'active' }),
        teachersService.getAll({ per_page: 1, status: 'on_leave' }),
      ]);

      const getCount = (r) => {
        if (r.status !== 'fulfilled') return 0;
        const d = r.value.data;
        return d?.meta?.total || d?.count || (Array.isArray(d?.data) ? d.data.length : Array.isArray(d) ? d.length : 0);
      };

      const total = getCount(allRes);
      const active = getCount(activeRes);
      const on_leave = getCount(onLeaveRes);
      setStats({ total, active, inactive: total - active - on_leave, on_leave });
    } catch {
      // Not critical
    }
  };

  // Sort
  const handleSort = (field) => {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortField(''); setSortDir('asc'); }
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return faSort;
    return sortDir === 'asc' ? faSortUp : faSortDown;
  };

  // Export
  const handleExport = async () => {
    try {
      const res = await teachersService.getAll({ per_page: 10000 });
      const data = res.data?.data || res.data?.results || res.data || [];
      if (!Array.isArray(data) || data.length === 0) {
        toast.error("Eksport uchun ma'lumot topilmadi");
        return;
      }
      const headers = ['Ism', 'Familiya', 'Telefon', 'Email', 'Fanlar', 'Guruhlar', 'Status'];
      const rows = data.map(t => [
        t.first_name, t.last_name, t.phone || '', t.email || '',
        (t.subjects_list || []).join(', '),
        t.groups_count || 0,
        statusConfig[t.status]?.label || t.status,
      ]);
      const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oqituvchilar_${new Date().toISOString().split('T')[0]}.csv`;
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

  const openEdit = async (teacher) => {
    // Detail dan to'liq ma'lumot olish
    let full = teacher;
    try {
      const res = await teachersService.getById(teacher.id);
      full = res.data?.data || res.data;
    } catch { /* list data bilan davom */ }

    setSelectedTeacher(full);
    setForm({
      first_name: full.first_name || '',
      last_name: full.last_name || '',
      phone: full.phone?.replace('+998', '') || '',
      phone_secondary: full.phone_secondary?.replace('+998', '') || '',
      email: full.email || '',
      birth_date: full.birth_date || '',
      address: full.address || '',
      bio: full.bio || '',
      salary_type: full.salary_type || 'fixed',
      salary_amount: full.salary_amount || '',
      salary_percent: full.salary_percent || '',
      hired_date: full.hired_date || '',
      telegram_username: full.telegram_username || '',
      status: full.status || 'active',
    });
    setErrors({});
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const openView = async (teacher) => {
    // Detail + groups
    try {
      const res = await teachersService.getById(teacher.id);
      setSelectedTeacher(res.data?.data || res.data);
    } catch {
      setSelectedTeacher(teacher);
    }
    setIsViewOpen(true);

    // Guruhlarni yuklash
    setGroupsLoading(true);
    setTeacherGroups([]);
    try {
      const gRes = await teachersService.getGroups(teacher.id);
      setTeacherGroups(gRes.data?.data || gRes.data || []);
    } catch { /* Guruhlar yo'q */ }
    setGroupsLoading(false);
  };

  const openDelete = (teacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'Ism kiritilmagan';
    if (!form.last_name.trim()) errs.last_name = 'Familiya kiritilmagan';
    if (!form.phone.trim()) errs.phone = 'Telefon kiritilmagan';
    else if (form.phone.replace(/\D/g, '').length !== 9) errs.phone = "Telefon 9 ta raqam bo'lishi kerak";
    if (form.phone_secondary && form.phone_secondary.replace(/\D/g, '').length > 0 && form.phone_secondary.replace(/\D/g, '').length !== 9) {
      errs.phone_secondary = "Telefon 9 ta raqam bo'lishi kerak";
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
      salary_type: form.salary_type,
      status: form.status,
    };

    if (form.phone_secondary?.trim() && form.phone_secondary.replace(/\D/g, '').length === 9) {
      data.phone_secondary = '+998' + form.phone_secondary.replace(/\D/g, '');
    }
    if (form.email?.trim()) data.email = form.email.trim();
    if (form.birth_date) data.birth_date = form.birth_date;
    if (form.address?.trim()) data.address = form.address.trim();
    if (form.bio?.trim()) data.bio = form.bio.trim();
    if (form.hired_date) data.hired_date = form.hired_date;
    if (form.telegram_username?.trim()) data.telegram_username = form.telegram_username.trim();

    // Salary
    if (form.salary_type === 'percent') {
      data.salary_percent = Number(form.salary_percent) || 0;
      data.salary_amount = 0;
    } else {
      data.salary_amount = Number(form.salary_amount) || 0;
      data.salary_percent = 0;
    }

    setFormLoading(true);
    try {
      if (formMode === 'create') {
        await teachersService.create(data);
        toast.success("O'qituvchi muvaffaqiyatli qo'shildi!");
      } else {
        await teachersService.update(selectedTeacher.id, data);
        toast.success("O'qituvchi yangilandi!");
      }
      setIsFormOpen(false);
      fetchTeachers();
      fetchStats();
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.error?.message || errData?.detail || "Xatolik yuz berdi";
      if (errData?.error?.details) {
        const fieldErrors = {};
        errData.error.details.forEach(d => { if (d.field) fieldErrors[d.field] = d.message; });
        if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }
      }
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
      await teachersService.delete(selectedTeacher.id);
      toast.success("O'qituvchi o'chirildi!");
      setIsDeleteOpen(false);
      fetchTeachers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Xatolik yuz berdi");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Stat filter toggle
  const toggleStatFilter = (status) => {
    setStatusFilter(statusFilter === status ? '' : status);
    setCurrentPage(1);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('teachers.title')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>O'qituvchilarni boshqarish va monitoring</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="h-10 px-4 rounded-xl border font-medium flex items-center gap-2 transition-all duration-200"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#22C55E'; e.currentTarget.style.color = '#22C55E'; e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
            <FontAwesomeIcon icon={faFileExcel} className="w-4 h-4" />
            <span className="hidden sm:inline">Eksport</span>
          </button>
          {canCreate && (
            <button onClick={openCreate} className="h-10 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium flex items-center gap-2 transition-colors">
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
              {t('teachers.addTeacher')}
            </button>
          )}
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        <StatCard label="Jami o'qituvchilar" value={stats.total} icon={faChalkboardTeacher} color="#6366F1" bg="rgba(99, 102, 241, 0.08)"
          onClick={() => { setStatusFilter(''); setCurrentPage(1); }} active={!statusFilter} />
        <StatCard label="Faol" value={stats.active} icon={faUser} color="#22C55E" bg="rgba(34, 197, 94, 0.08)"
          onClick={() => toggleStatFilter('active')} active={statusFilter === 'active'} />
        <StatCard label="Nofaol" value={stats.inactive} icon={faPause} color="#94A3B8" bg="rgba(148, 163, 184, 0.08)"
          onClick={() => toggleStatFilter('inactive')} active={statusFilter === 'inactive'} />
        <StatCard label="Ta'tilda" value={stats.on_leave} icon={faClock} color="#F59E0B" bg="rgba(245, 158, 11, 0.08)"
          onClick={() => toggleStatFilter('on_leave')} active={statusFilter === 'on_leave'} />
      </div>

      {/* SEARCH & FILTERS */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <FontAwesomeIcon icon={faSearch} className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Ism, familiya yoki telefon bo'yicha qidirish..."
              value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-11 pl-11 pr-10 rounded-xl border bg-transparent transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            {searchInput && (
              <button onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
              </button>
            )}
          </div>
          <select value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="h-11 px-4 rounded-xl border bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}>
            <option value="">Barcha status</option>
            <option value="active">Faol</option>
            <option value="inactive">Nofaol</option>
            <option value="on_leave">Ta'tilda</option>
          </select>
          {(searchInput || statusFilter) && (
            <button onClick={() => { setSearchInput(''); setStatusFilter(''); setCurrentPage(1); }}
              className="h-11 px-4 rounded-xl font-medium transition-colors text-red-500"
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              Tozalash
            </button>
          )}
        </div>

        {/* Active filters */}
        {(statusFilter || search) && (
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
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', color: '#6366F1' }}>
                "{search}"
                <button onClick={() => { setSearchInput(''); setCurrentPage(1); }} className="ml-1 opacity-60 hover:opacity-100">
                  <FontAwesomeIcon icon={faTimes} className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{meta.total} ta natija</span>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <FontAwesomeIcon icon={faChalkboardTeacher} className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {search || statusFilter ? "Natija topilmadi" : "O'qituvchilar yo'q"}
            </h3>
            <p className="mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
              {search || statusFilter ? "Filterni o'zgartirib ko'ring" : "Yangi o'qituvchi qo'shing"}
            </p>
            {canCreate && !search && !statusFilter && (
              <button onClick={openCreate} className="h-11 px-6 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium flex items-center gap-2 transition-colors">
                <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                {t('teachers.addTeacher')}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <th className="p-4 text-left">
                      <button onClick={() => handleSort('first_name')} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: sortField === 'first_name' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        O'qituvchi <FontAwesomeIcon icon={getSortIcon('first_name')} className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Telefon</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>Fanlar</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>Guruhlar</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                    <th className="p-4 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((tc) => (
                    <tr key={tc.id} className="border-b last:border-0 transition-colors duration-150 cursor-pointer"
                      style={{ borderColor: 'var(--border-color)' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={(e) => {
                        if (e.target.closest('.actions-cell')) return;
                        openView(tc);
                      }}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0" style={{ backgroundColor: '#1B365D' }}>
                            {getInitials(tc.first_name, tc.last_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{tc.first_name} {tc.last_name}</p>
                            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                              {tc.full_name !== `${tc.first_name} ${tc.last_name}` ? tc.full_name : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatPhone(tc.phone)}</span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(tc.subjects_list || []).slice(0, 2).map((s, i) => (
                            <span key={i} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>{s}</span>
                          ))}
                          {(tc.subjects_list || []).length > 2 && (
                            <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>+{tc.subjects_list.length - 2}</span>
                          )}
                          {(!tc.subjects_list || tc.subjects_list.length === 0) && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                          <FontAwesomeIcon icon={faUsers} className="w-3 h-3" />
                          {tc.groups_count || 0} ta
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusConfig[tc.status]?.bg, color: statusConfig[tc.status]?.color }}>
                          <FontAwesomeIcon icon={statusConfig[tc.status]?.icon || faUser} className="w-3 h-3" />
                          {statusConfig[tc.status]?.label || tc.status}
                        </span>
                      </td>
                      <td className="p-4 actions-cell" onClick={e => e.stopPropagation()}>
                        <div className="relative" ref={actionDropdownId === tc.id ? actionRef : null}>
                          <button onClick={() => setActionDropdownId(actionDropdownId === tc.id ? null : tc.id)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                            onMouseLeave={e => { if (actionDropdownId !== tc.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                            <FontAwesomeIcon icon={faEllipsisV} className="w-4 h-4" />
                          </button>
                          {actionDropdownId === tc.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl shadow-lg border z-30 py-1 overflow-hidden"
                              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                              <button onClick={() => { openView(tc); setActionDropdownId(null); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <FontAwesomeIcon icon={faEye} className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> Ko'rish
                              </button>
                              {canEdit && (
                                <button onClick={() => { openEdit(tc); setActionDropdownId(null); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                                  style={{ color: 'var(--text-primary)' }}
                                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                  <FontAwesomeIcon icon={faEdit} className="w-4 h-4 text-primary-600" /> Tahrirlash
                                </button>
                              )}
                              {canDelete && (
                                <>
                                  <div className="my-1 border-t" style={{ borderColor: 'var(--border-color)' }} />
                                  <button onClick={() => { openDelete(tc); setActionDropdownId(null); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-red-500"
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.06)'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" /> O'chirish
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
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => { if (currentPage > 1) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, meta.total_pages) }, (_, i) => {
                    let page;
                    if (meta.total_pages <= 5) page = i + 1;
                    else if (currentPage <= 3) page = i + 1;
                    else if (currentPage >= meta.total_pages - 2) page = meta.total_pages - 4 + i;
                    else page = currentPage - 2 + i;
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-primary-600 text-white' : ''}`}
                        style={currentPage !== page ? { color: 'var(--text-secondary)' } : {}}
                        onMouseEnter={e => { if (currentPage !== page) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                        onMouseLeave={e => { if (currentPage !== page) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                        {page}
                      </button>
                    );
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(meta.total_pages, p + 1))} disabled={currentPage === meta.total_pages}
                    className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => { if (currentPage < meta.total_pages) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CREATE/EDIT DRAWER */}
      <Drawer isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={formMode === 'create' ? "Yangi o'qituvchi" : "O'qituvchini tahrirlash"}>
        <div>
          <div className="flex justify-center py-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: '#1B365D' }}>
              {getInitials(form.first_name, form.last_name) || <FontAwesomeIcon icon={faUser} className="w-10 h-10 opacity-50" />}
            </div>
          </div>

          <Section title="Shaxsiy ma'lumotlar" icon={faUser} iconColor="bg-primary-100 dark:bg-primary-900/30 text-primary-600" defaultOpen={true}>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Ism" required placeholder="Ism kiriting" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} error={errors.first_name} />
              <Input label="Familiya" required placeholder="Familiya kiriting" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} error={errors.last_name} />
            </div>
            <Input label="Telefon" required prefix="+998" placeholder="90 123 45 67" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 9) })} error={errors.phone} />
            <Input label="Qo'shimcha telefon" prefix="+998" placeholder="90 123 45 67" value={form.phone_secondary} onChange={(e) => setForm({ ...form, phone_secondary: e.target.value.replace(/\D/g, '').slice(0, 9) })} error={errors.phone_secondary} />
            <Input label="Email" type="email" icon={faEnvelope} placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Tug'ilgan sana" type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
              <Input label="Ishga kirgan sana" type="date" value={form.hired_date} onChange={(e) => setForm({ ...form, hired_date: e.target.value })} />
            </div>
            <Input label="Manzil" icon={faMapMarkerAlt} placeholder="Shahar, tuman, ko'cha" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Section>

          <Section title="Ish haqi" icon={faMoneyBillWave} iconColor="bg-green-100 dark:bg-green-900/30 text-green-600" defaultOpen={true}>
            <SelectInput label="Ish haqi turi" options={salaryTypeOptions} value={form.salary_type} onChange={(v) => setForm({ ...form, salary_type: v })} />
            {form.salary_type === 'percent' ? (
              <Input label="Foiz (%)" type="number" placeholder="40" suffix="%" value={form.salary_percent}
                onChange={(e) => setForm({ ...form, salary_percent: e.target.value })} />
            ) : (
              <Input label={form.salary_type === 'hourly' ? "Soatiga (so'm)" : "Oylik (so'm)"} type="number"
                placeholder={form.salary_type === 'hourly' ? '80000' : '5000000'} suffix="so'm"
                value={form.salary_amount} onChange={(e) => setForm({ ...form, salary_amount: e.target.value })} />
            )}
            <SelectInput label="Status" options={[
              { value: 'active', label: 'Faol' },
              { value: 'inactive', label: 'Nofaol' },
              { value: 'on_leave', label: "Ta'tilda" },
            ]} value={form.status} onChange={(v) => setForm({ ...form, status: v })} />
          </Section>

          <Section title="Qo'shimcha" icon={faInfoCircle} iconColor="bg-gray-100 dark:bg-gray-800 text-gray-500" defaultOpen={false}>
            <Input label="Telegram username" icon={faTelegram} placeholder="@username" value={form.telegram_username} onChange={(e) => setForm({ ...form, telegram_username: e.target.value })} />
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Bio / Izoh</label>
              <textarea rows={3} placeholder="Sertifikatlar, yutuqlar, tajriba..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </Section>

          <div className="sticky bottom-0 flex gap-3 p-6 border-t" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <button onClick={() => setIsFormOpen(false)} className="flex-1 h-12 rounded-xl border font-medium transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              Bekor qilish
            </button>
            <button onClick={handleSubmit} disabled={formLoading} className="flex-1 h-12 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2 transition-colors">
              {formLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                <><FontAwesomeIcon icon={faCheck} className="w-4 h-4" /> {formMode === 'create' ? "Qo'shish" : 'Saqlash'}</>
              )}
            </button>
          </div>
        </div>
      </Drawer>

      {/* VIEW DRAWER */}
      <Drawer isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="O'qituvchi ma'lumotlari" width="580px">
        {selectedTeacher && (
          <div>
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0" style={{ backgroundColor: '#1B365D' }}>
                  {getInitials(selectedTeacher.first_name, selectedTeacher.last_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{selectedTeacher.first_name} {selectedTeacher.last_name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusConfig[selectedTeacher.status]?.bg, color: statusConfig[selectedTeacher.status]?.color }}>
                      <FontAwesomeIcon icon={statusConfig[selectedTeacher.status]?.icon || faUser} className="w-3 h-3" />
                      {statusConfig[selectedTeacher.status]?.label}
                    </span>
                  </div>
                  {selectedTeacher.hired_date && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      <FontAwesomeIcon icon={faBriefcase} className="w-3 h-3 mr-1" />
                      Ishga kirgan: {new Date(selectedTeacher.hired_date).toLocaleDateString('uz-UZ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Salary card */}
              <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      <FontAwesomeIcon icon={salaryTypeConfig[selectedTeacher.salary_type]?.icon || faWallet} className="w-3 h-3 mr-1" />
                      {salaryTypeConfig[selectedTeacher.salary_type]?.label || 'Ish haqi'}
                    </p>
                    <p className="text-2xl font-bold mt-0.5" style={{ color: salaryTypeConfig[selectedTeacher.salary_type]?.color || '#22C55E' }}>
                      {formatSalary(selectedTeacher.salary_type, selectedTeacher.salary_amount, selectedTeacher.salary_percent)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}>
                    <FontAwesomeIcon icon={faMoneyBillWave} className="w-5 h-5" style={{ color: '#22C55E' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p className="text-2xl font-bold text-primary-600">{selectedTeacher.groups_count || teacherGroups.length || 0}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Faol guruhlar</p>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p className="text-2xl font-bold" style={{ color: '#8B5CF6' }}>{(selectedTeacher.subjects_data || []).length}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Fan</p>
                </div>
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
                  <a href={`tel:${selectedTeacher.phone}`} className="font-medium text-primary-600 text-sm">{formatPhone(selectedTeacher.phone)}</a>
                </div>
              </div>
              {selectedTeacher.phone_secondary && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary-100 dark:bg-primary-900/30">
                    <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Qo'shimcha telefon</p>
                    <a href={`tel:${selectedTeacher.phone_secondary}`} className="font-medium text-primary-600 text-sm">{formatPhone(selectedTeacher.phone_secondary)}</a>
                  </div>
                </div>
              )}
              {selectedTeacher.email && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                    <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Email</p>
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{selectedTeacher.email}</p>
                  </div>
                </div>
              )}
              {selectedTeacher.telegram_username && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-sky-100 dark:bg-sky-900/30">
                    <FontAwesomeIcon icon={faTelegram} className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Telegram</p>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{selectedTeacher.telegram_username}</p>
                  </div>
                </div>
              )}
              {selectedTeacher.address && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Manzil</p>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{selectedTeacher.address}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Subjects */}
            {(selectedTeacher.subjects_data || []).length > 0 && (
              <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>O'qitadigan fanlar</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTeacher.subjects_data.map((s) => (
                    <span key={s.id} className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
                      <FontAwesomeIcon icon={faBook} className="w-3 h-3 mr-1.5" />{s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Groups */}
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Faol guruhlar</h4>
              {groupsLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                </div>
              ) : teacherGroups.length > 0 ? (
                <div className="space-y-2">
                  {teacherGroups.map((g) => (
                    <div key={g.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30">
                          <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{g.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{g.course} • {g.students_count || 0} o'quvchi</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{g.days}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{g.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center py-3" style={{ color: 'var(--text-muted)' }}>Faol guruhlar yo'q</p>
              )}
            </div>

            {/* Bio */}
            {selectedTeacher.bio && (
              <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Bio</h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedTeacher.bio}</p>
              </div>
            )}

            {/* Actions */}
            <div className="p-6">
              <div className="flex gap-3">
                {canEdit && (
                  <button onClick={() => { setIsViewOpen(false); openEdit(selectedTeacher); }}
                    className="flex-1 h-12 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium flex items-center justify-center gap-2 transition-colors">
                    <FontAwesomeIcon icon={faEdit} className="w-4 h-4" /> Tahrirlash
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* DELETE MODAL */}
      <DeleteModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete}
        name={`${selectedTeacher?.first_name} ${selectedTeacher?.last_name}`} loading={deleteLoading} />
    </div>
  );
}
