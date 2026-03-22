import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faSearch,
  faEye,
  faEdit,
  faTrash,
  faPhone,
  faEnvelope,
  faUser,
  faUsers,
  faMapMarkerAlt,
  faDownload,
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faChevronUp,
  faTimes,
  faCamera,
  faCheck,
  faInfoCircle,
  faMale,
  faFemale,
} from '@fortawesome/free-solid-svg-icons';
import { faTelegram, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { studentsService } from '@/services/students';

// ============================================
// CONFIG
// ============================================
const statusConfig = {
  active: { label: 'Faol', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)' },
  inactive: { label: 'Nofaol', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)' },
  graduated: { label: 'Bitirgan', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
  frozen: { label: 'Muzlatilgan', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)' },
  dropped: { label: 'Chiqib ketgan', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
};

const sourceOptions = [
  { value: 'walk_in', label: "O'zi kelgan" },
  { value: 'instagram', label: 'Instagram' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Tavsiya' },
  { value: 'phone', label: 'Telefon' },
];

// Demo data
const demoStudents = []


// ============================================
// CUSTOM COMPONENTS
// ============================================

// Custom Drawer
function Drawer({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[520px] transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-16 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        {/* Content */}
        <div className="h-[calc(100%-64px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}

// Collapsible Section
function Section({ title, icon, iconColor, defaultOpen = true, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b" style={{ borderColor: 'var(--border-color)' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
            <FontAwesomeIcon icon={icon} className="w-4 h-4" />
          </div>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{title}</span>
        </div>
        <FontAwesomeIcon
          icon={isOpen ? faChevronUp : faChevronDown}
          className="w-4 h-4 transition-transform"
          style={{ color: 'var(--text-muted)' }}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-6 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// Custom Input
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
          <div className="flex items-center justify-center px-4 rounded-l-xl border border-r-0 bg-gray-50 dark:bg-gray-800/50" style={{ borderColor: 'var(--border-color)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{prefix}</span>
          </div>
        )}
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
            <FontAwesomeIcon icon={icon} className="w-4 h-4" />
          </span>
        )}
        <input
          className={`w-full h-12 px-4 rounded-xl border bg-transparent transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            prefix ? 'rounded-l-none' : ''
          } ${icon ? 'pl-11' : ''} ${error ? 'border-red-500' : ''}`}
          style={{ borderColor: error ? '#EF4444' : 'var(--border-color)', color: 'var(--text-primary)' }}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

// Custom Select
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

// Delete Confirmation Modal
function DeleteModal({ isOpen, onClose, onConfirm, studentName }) {
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
            className="flex-1 h-12 rounded-xl border font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            Bekor qilish
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
          >
            O'chirish
          </button>
        </div>
      </div>
    </>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function Students() {
  const { t } = useTranslation();
  // State
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, withDebt: 0 });
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [balanceFilter, setBalanceFilter] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;
  
  // Selection
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Drawers & Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formMode, setFormMode] = useState('create');
  const [formLoading, setFormLoading] = useState(false);
  
  // Form
  const initialForm = {
    first_name: '', last_name: '', phone: '', email: '',
    gender: 'male', birth_date: '', address: '',
    telegram_username: '', instagram_username: '',
    parent_name: '', parent_phone: '', source: 'walk_in', notes: '',
  };
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  // Fetch
  useEffect(() => { fetchStudents(); }, []);


const fetchStudents = async () => {
  setLoading(true);
  try {
    const res = await studentsService.getAll();
    console.log('API Response:', res);
    
    // Backend format: res.data.data (axios.data.backend.data)
    let data = [];
    if (Array.isArray(res)) {
      data = res;
    } else if (res?.data?.data && Array.isArray(res.data.data)) {
      // Format: { success: true, data: [...], meta: {...} }
      data = res.data.data;
    } else if (Array.isArray(res?.data)) {
      data = res.data;
    } else if (res?.results && Array.isArray(res.results)) {
      data = res.results;
    }
    
    console.log('Students data:', data);
    setStudents(data);
    calcStats(data);
  } catch (error) {
    console.log('Fetch error:', error);
    setStudents(demoStudents);
    calcStats(demoStudents);
  } finally {
    setLoading(false);
  }
};

const calcStats = (data) => {
  if (!Array.isArray(data)) {
    console.log('calcStats: data is not array', data);
    data = [];
  }
  setStats({
    total: data.length,
    active: data.filter(s => s.status === 'active').length,
    inactive: data.filter(s => s.status === 'inactive').length,
    withDebt: data.filter(s => s.balance < 0).length,
  });
};

  // Filter logic
  const filtered = students.filter(s => {
    const matchSearch = `${s.first_name} ${s.last_name} ${s.phone}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchBalance = balanceFilter === 'all' ||
      (balanceFilter === 'debt' && s.balance < 0) ||
      (balanceFilter === 'positive' && s.balance > 0) ||
      (balanceFilter === 'zero' && s.balance === 0);
    return matchSearch && matchStatus && matchBalance;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Selection
  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(s => s.id));
  };
  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
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
      instagram_username: student.instagram_username || '',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone?.replace('+998', '') || '',
      source: student.source || 'walk_in',
      notes: student.notes || '',
    });
    setErrors({});
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const openView = (student) => {
    setSelectedStudent(student);
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
    source: form.source,
  };

  // Optional fields - faqat to'ldirilgan bo'lsa qo'shamiz
  if (form.email?.trim()) data.email = form.email.trim();
  if (form.birth_date) data.birth_date = form.birth_date;
  if (form.address?.trim()) data.address = form.address.trim();
  if (form.telegram_username?.trim()) data.telegram_username = form.telegram_username.trim();
  if (form.instagram_username?.trim()) data.instagram_username = form.instagram_username.trim();
  if (form.parent_name?.trim()) data.parent_name = form.parent_name.trim();
  if (form.parent_phone?.trim()) data.parent_phone = '+998' + form.parent_phone.replace(/\D/g, '');
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
    } catch {
      toast.error("Xatolik yuz berdi!");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await studentsService.delete(selectedStudent.id);
      toast.success("O'quvchi o'chirildi!");
      setIsDeleteOpen(false);
      fetchStudents();
    } catch {
      toast.error("Xatolik yuz berdi!");
    }
  };

  // Freeze / Unfreeze / Archive
  const handleFreeze = async (student) => {
    const startDate = new Date().toISOString().split('T')[0];
    try {
      await studentsService.freeze(student.id, { start_date: startDate, reason: 'Muzlatildi' });
      toast.success(`${student.first_name} muzlatildi`);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Xatolik yuz berdi");
    }
  };

  const handleUnfreeze = async (student) => {
    try {
      await studentsService.unfreeze(student.id);
      toast.success(`${student.first_name} faollashtirildi`);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Xatolik yuz berdi");
    }
  };

  const handleArchive = async (student) => {
    try {
      await studentsService.archive(student.id, { reason: 'Arxivlandi' });
      toast.success(`${student.first_name} arxivga olindi`);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Xatolik yuz berdi");
    }
  };

  // Helpers
  const formatPhone = (p) => {
    if (!p) return '-';
    const c = p.replace(/\D/g, '');
    return c.length === 12 ? `+${c.slice(0,3)} ${c.slice(3,5)} ${c.slice(5,8)} ${c.slice(8,10)} ${c.slice(10)}` : p;
  };
  const formatMoney = (v) => new Intl.NumberFormat('uz-UZ').format(v) + " so'm";
  const getAge = (d) => {
    if (!d) return null;
    const t = new Date(), b = new Date(d);
    let a = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a;
  };
  const getInitials = (f, l) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase();

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('students.title')}</h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{stats.total}</span> ta o'quvchi
            </span>
            <span className="text-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span style={{ color: 'var(--text-muted)' }}>{stats.active} faol</span>
            </span>
            <span className="text-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span style={{ color: 'var(--text-muted)' }}>{stats.withDebt} qarzdor</span>
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="h-10 px-4 rounded-xl border font-medium flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
            <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={openCreate} className="h-10 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium flex items-center gap-2 transition-colors">
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            {t('students.addStudent')}
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <FontAwesomeIcon icon={faSearch} className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Ism yoki telefon bo'yicha qidirish..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full h-11 pl-11 pr-4 rounded-xl border bg-transparent transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="h-11 px-4 rounded-xl border bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <option value="all">Barcha holat</option>
            <option value="active">Faol</option>
            <option value="inactive">Nofaol</option>
            <option value="graduated">Bitirgan</option>
          </select>
          <select
            value={balanceFilter}
            onChange={(e) => { setBalanceFilter(e.target.value); setCurrentPage(1); }}
            className="h-11 px-4 rounded-xl border bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <option value="all">Barcha balans</option>
            <option value="debt">Qarzdorlar</option>
            <option value="positive">Balans +</option>
            <option value="zero">Balans 0</option>
          </select>
          {(search || statusFilter !== 'all' || balanceFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setBalanceFilter('all'); }}
              className="h-11 px-4 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors"
            >
              Tozalash
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <FontAwesomeIcon icon={faUsers} className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>O'quvchilar topilmadi</h3>
            <p className="mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
              {search || statusFilter !== 'all' ? "Qidiruv natijasi bo'sh" : "Yangi o'quvchi qo'shing"}
            </p>
            <button onClick={openCreate} className="h-11 px-6 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium flex items-center gap-2 transition-colors">
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
              Yangi o'quvchi
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <th className="p-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === paginated.length && paginated.length > 0}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 rounded border-gray-300 cursor-pointer"
                      />
                    </th>
                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-muted)' }}>O'quvchi</th>
                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Telefon</th>
                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Guruhlar</th>
                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Balans</th>
                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Holat</th>
                    <th className="p-4 w-32"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          className="w-5 h-5 rounded border-gray-300 cursor-pointer"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                            style={{ backgroundColor: s.gender === 'female' ? '#EC4899' : '#1B365D' }}
                          >
                            {getInitials(s.first_name, s.last_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                              {s.first_name} {s.last_name}
                            </p>
                            <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                              {getAge(s.birth_date) ? `${getAge(s.birth_date)} yosh` : s.email || '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <a href={`tel:${s.phone}`} className="text-primary-600 hover:underline font-medium">
                          {formatPhone(s.phone)}
                        </a>
                      </td>
                      <td className="p-4">
                        {s.groups?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {s.groups.slice(0, 2).map((g, i) => (
                              <span key={i} className="px-2 py-1 rounded-lg text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                                {g}
                              </span>
                            ))}
                            {s.groups.length > 2 && (
                              <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800" style={{ color: 'var(--text-muted)' }}>
                                +{s.groups.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`font-semibold ${s.balance < 0 ? 'text-red-500' : s.balance > 0 ? 'text-green-500' : ''}`}>
                          {formatMoney(s.balance)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: statusConfig[s.status]?.bg, color: statusConfig[s.status]?.color }}
                        >
                          {statusConfig[s.status]?.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openView(s)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Ko'rish">
                            <FontAwesomeIcon icon={faEye} className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                          </button>
                          <button onClick={() => openEdit(s)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Tahrirlash">
                            <FontAwesomeIcon icon={faEdit} className="w-4 h-4 text-primary-600" />
                          </button>
                          {s.status === 'frozen' ? (
                            <button onClick={() => handleUnfreeze(s)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Faollashtirish">
                              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                          ) : s.status === 'active' ? (
                            <button onClick={() => handleFreeze(s)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors" title="Muzlatish">
                              <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                            </button>
                          ) : null}
                          <button onClick={() => openDelete(s)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="O'chirish">
                            <FontAwesomeIcon icon={faTrash} className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, filtered.length)} / {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
      <Drawer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formMode === 'create' ? "Yangi o'quvchi" : "O'quvchini tahrirlash"}
      >
        <div>
          {/* Avatar upload */}
          <div className="flex justify-center py-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="relative">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: form.gender === 'female' ? '#EC4899' : '#1B365D' }}
              >
                {getInitials(form.first_name, form.last_name) || <FontAwesomeIcon icon={faUser} className="w-10 h-10 opacity-50" />}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg hover:bg-primary-700 transition-colors">
                <FontAwesomeIcon icon={faCamera} className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Shaxsiy ma'lumotlar */}
          <Section title="Shaxsiy ma'lumotlar" icon={faUser} iconColor="bg-primary-100 dark:bg-primary-900/30 text-primary-600" defaultOpen={true}>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Ism"
                required
                placeholder="Ism kiriting"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                error={errors.first_name}
              />
              <Input
                label="Familiya"
                required
                placeholder="Familiya kiriting"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                error={errors.last_name}
              />
            </div>
            <Input
              label="Telefon raqam"
              required
              prefix="+998"
              placeholder="90 123 45 67"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 9) })}
              error={errors.phone}
            />
            <Input
              label="Email"
              type="email"
              icon={faEnvelope}
              placeholder="email@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Tug'ilgan sana"
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Jinsi</label>
                <div className="flex h-12 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, gender: 'male' })}
                    className={`flex-1 flex items-center justify-center gap-2 font-medium transition-colors ${
                      form.gender === 'male' ? 'bg-primary-600 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    style={form.gender !== 'male' ? { color: 'var(--text-secondary)' } : {}}
                  >
                    <FontAwesomeIcon icon={faMale} className="w-4 h-4" />
                    Erkak
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, gender: 'female' })}
                    className={`flex-1 flex items-center justify-center gap-2 font-medium transition-colors ${
                      form.gender === 'female' ? 'bg-pink-500 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    style={form.gender !== 'female' ? { color: 'var(--text-secondary)' } : {}}
                  >
                    <FontAwesomeIcon icon={faFemale} className="w-4 h-4" />
                    Ayol
                  </button>
                </div>
              </div>
            </div>
            <Input
              label="Manzil"
              icon={faMapMarkerAlt}
              placeholder="Shahar, tuman, ko'cha"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Section>

          {/* Ota-ona */}
          <Section title="Ota-ona ma'lumotlari" icon={faUsers} iconColor="bg-orange-100 dark:bg-orange-900/30 text-orange-500" defaultOpen={false}>
            <Input
              label="Ota-ona ismi"
              placeholder="To'liq ism"
              value={form.parent_name}
              onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
            />
            <Input
              label="Telefon raqam"
              prefix="+998"
              placeholder="90 123 45 67"
              value={form.parent_phone}
              onChange={(e) => setForm({ ...form, parent_phone: e.target.value.replace(/\D/g, '').slice(0, 9) })}
            />
          </Section>

          {/* Ijtimoiy tarmoqlar */}
          <Section title="Ijtimoiy tarmoqlar" icon={faTelegram} iconColor="bg-sky-100 dark:bg-sky-900/30 text-sky-500" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Telegram"
                icon={faTelegram}
                placeholder="@username"
                value={form.telegram_username}
                onChange={(e) => setForm({ ...form, telegram_username: e.target.value })}
              />
              <Input
                label="Instagram"
                icon={faInstagram}
                placeholder="@username"
                value={form.instagram_username}
                onChange={(e) => setForm({ ...form, instagram_username: e.target.value })}
              />
            </div>
          </Section>

          {/* Qo'shimcha */}
          <Section title="Qo'shimcha" icon={faInfoCircle} iconColor="bg-gray-100 dark:bg-gray-800 text-gray-500" defaultOpen={false}>
            <Select
              label="Qayerdan kelgan?"
              options={sourceOptions}
              value={form.source}
              onChange={(v) => setForm({ ...form, source: v })}
            />
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Izoh</label>
              <textarea
                rows={3}
                placeholder="Qo'shimcha ma'lumot..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </Section>

          {/* Footer */}
          <div className="sticky bottom-0 flex gap-3 p-6 border-t" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <button
              onClick={() => setIsFormOpen(false)}
              className="flex-1 h-12 rounded-xl border font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              Bekor qilish
            </button>
            <button
              onClick={handleSubmit}
              disabled={formLoading}
              className="flex-1 h-12 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {formLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
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
      <Drawer
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="O'quvchi ma'lumotlari"
      >
        {selectedStudent && (
          <div className="p-6 space-y-6">
            {/* Profile */}
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                style={{ backgroundColor: selectedStudent.gender === 'female' ? '#EC4899' : '#1B365D' }}
              >
                {getInitials(selectedStudent.first_name, selectedStudent.last_name)}
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {selectedStudent.first_name} {selectedStudent.last_name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: statusConfig[selectedStudent.status]?.bg, color: statusConfig[selectedStudent.status]?.color }}
                  >
                    {statusConfig[selectedStudent.status]?.label}
                  </span>
                  {getAge(selectedStudent.birth_date) && (
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{getAge(selectedStudent.birth_date)} yosh</span>
                  )}
                </div>
              </div>
            </div>

            {/* Balance */}
            <div className={`p-4 rounded-xl ${selectedStudent.balance < 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Balans</p>
              <p className={`text-2xl font-bold ${selectedStudent.balance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {formatMoney(selectedStudent.balance)}
              </p>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <FontAwesomeIcon icon={faPhone} className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Telefon</p>
                  <a href={`tel:${selectedStudent.phone}`} className="font-medium text-primary-600">{formatPhone(selectedStudent.phone)}</a>
                </div>
              </div>
              {selectedStudent.email && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Email</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedStudent.email}</p>
                  </div>
                </div>
              )}
              {selectedStudent.address && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Manzil</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedStudent.address}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Groups */}
            {selectedStudent.groups?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Guruhlar</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedStudent.groups.map((g, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Parent */}
            {selectedStudent.parent_name && (
              <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Ota-ona</h4>
                <p style={{ color: 'var(--text-primary)' }}>{selectedStudent.parent_name}</p>
                {selectedStudent.parent_phone && (
                  <a href={`tel:${selectedStudent.parent_phone}`} className="text-sm text-primary-600">{formatPhone(selectedStudent.parent_phone)}</a>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setIsViewOpen(false); openEdit(selectedStudent); }}
                className="flex-1 h-12 rounded-xl border font-medium flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                Tahrirlash
              </button>
              <button className="flex-1 h-12 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors">
                To'lov qilish
              </button>
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
      />
    </div>
  );
}