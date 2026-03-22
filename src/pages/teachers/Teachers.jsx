import { useState, useEffect } from 'react';
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
  faChalkboardTeacher,
  faGraduationCap,
  faStar,
  faMoneyBillWave,
  faClock,
  faCalendarAlt,
  faBook,
} from '@fortawesome/free-solid-svg-icons';
import { faTelegram, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { teachersService } from '@/services/teachers';

// ============================================
// CONFIG
// ============================================
const statusConfig = {
  active: { label: 'Faol', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)' },
  inactive: { label: 'Nofaol', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)' },
  on_leave: { label: "Ta'tilda", color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
};

const paymentTypeOptions = [
  { value: 'fixed', label: 'Belgilangan oylik' },
  { value: 'percent', label: 'Foizda (har bir guruhdan)' },
  { value: 'hourly', label: 'Soatbay' },
];

const subjectOptions = [
  { value: 'english', label: 'Ingliz tili' },
  { value: 'russian', label: 'Rus tili' },
  { value: 'math', label: 'Matematika' },
  { value: 'physics', label: 'Fizika' },
  { value: 'chemistry', label: 'Kimyo' },
  { value: 'biology', label: 'Biologiya' },
  { value: 'programming', label: 'Dasturlash' },
  { value: 'korean', label: 'Koreys tili' },
  { value: 'arabic', label: 'Arab tili' },
  { value: 'german', label: 'Nemis tili' },
];

// Demo data
const demoTeachers = [
  { id: '1', first_name: 'Xamidov', last_name: 'Jaxongir', phone: '+998901977395', email: 'jaxongir@gmail.com', status: 'active', gender: 'male', birth_date: '1990-05-15', address: 'Toshkent, Chilonzor', subjects: ['english', 'german'], groups_count: 7, students_count: 45, rating: 4.8, payment_type: 'percent', payment_amount: 40, experience_years: 8, telegram_username: '@jaxongir', bio: "IELTS 8.0, Cambridge sertifikati" },
  { id: '2', first_name: 'Abduraxmonov', last_name: 'Toshtemir', phone: '+998945450212', email: 'toshtemir@gmail.com', status: 'active', gender: 'male', birth_date: '1985-11-20', address: 'Toshkent, Yunusobod', subjects: ['math', 'physics'], groups_count: 6, students_count: 38, rating: 4.9, payment_type: 'fixed', payment_amount: 5500000, experience_years: 12, telegram_username: '@toshtemir', bio: "Matematika bo'yicha PhD" },
  { id: '3', first_name: 'Moxinur', last_name: 'Shodmonova', phone: '+998973950602', email: 'moxinur@gmail.com', status: 'active', gender: 'female', birth_date: '1995-03-08', address: 'Toshkent, Mirzo Ulugbek', subjects: ['korean'], groups_count: 1, students_count: 12, rating: 4.7, payment_type: 'hourly', payment_amount: 80000, experience_years: 3, telegram_username: '@moxinur', bio: "TOPIK 6 daraja" },
  { id: '4', first_name: "G'ulomov", last_name: "Og'abek", phone: '+998941908212', email: 'ogabek@gmail.com', status: 'active', gender: 'male', birth_date: '1992-07-14', address: 'Toshkent, Sergeli', subjects: ['programming'], groups_count: 3, students_count: 24, rating: 4.6, payment_type: 'percent', payment_amount: 35, experience_years: 5, telegram_username: '@ogabek_dev', bio: "Full-stack developer, 5 yillik tajriba" },
  { id: '5', first_name: 'Shaxzod', last_name: 'Muradov', phone: '+998906020440', email: 'shaxzod@gmail.com', status: 'inactive', gender: 'male', birth_date: '1988-12-01', address: 'Toshkent, Olmazor', subjects: ['russian', 'english'], groups_count: 0, students_count: 0, rating: 4.5, payment_type: 'fixed', payment_amount: 4000000, experience_years: 10, telegram_username: '@shaxzod', bio: "" },
];

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
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[560px] transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        <div className="h-[calc(100%-64px)] overflow-y-auto">{children}</div>
      </div>
    </>
  );
}

// Collapsible Section
function Section({ title, icon, iconColor, defaultOpen = true, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b" style={{ borderColor: 'var(--border-color)' }}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
            <FontAwesomeIcon icon={icon} className="w-4 h-4" />
          </div>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{title}</span>
        </div>
        <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} className="w-4 h-4 transition-transform" style={{ color: 'var(--text-muted)' }} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-6 space-y-4">{children}</div>
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
          className={`w-full h-12 px-4 rounded-xl border bg-transparent transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${prefix ? 'rounded-l-none' : ''} ${icon ? 'pl-11' : ''} ${error ? 'border-red-500' : ''}`}
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

// Multi Select (for subjects)
function MultiSelect({ label, options, value = [], onChange }) {
  const toggleOption = (optValue) => {
    if (value.includes(optValue)) {
      onChange(value.filter(v => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{label}</label>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggleOption(opt.value)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              value.includes(opt.value)
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            style={!value.includes(opt.value) ? { color: 'var(--text-secondary)' } : {}}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Delete Modal
function DeleteModal({ isOpen, onClose, onConfirm, name }) {
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
            <strong>{name}</strong> ni o'chirmoqchimisiz?
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 h-12 rounded-xl border font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
            Bekor qilish
          </button>
          <button onClick={onConfirm} className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors">
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
export default function Teachers() {
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const [selectedIds, setSelectedIds] = useState([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formMode, setFormMode] = useState('create');
  const [formLoading, setFormLoading] = useState(false);

  const initialForm = {
    first_name: '', last_name: '', phone: '', email: '',
    gender: 'male', birth_date: '', address: '',
    subjects: [], payment_type: 'fixed', payment_amount: '',
    experience_years: '', telegram_username: '', instagram_username: '',
    bio: '',
  };
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchTeachers(); }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await teachersService.getAll();
      let data = [];
      if (Array.isArray(res)) data = res;
      else if (res?.data?.data && Array.isArray(res.data.data)) data = res.data.data;
      else if (Array.isArray(res?.data)) data = res.data;
      
      setTeachers(data);
      calcStats(data);
    } catch (error) {
      console.log('Fetch error:', error);
      setTeachers(demoTeachers);
      calcStats(demoTeachers);
    } finally {
      setLoading(false);
    }
  };

  const calcStats = (data) => {
    if (!Array.isArray(data)) data = [];
    setStats({
      total: data.length,
      active: data.filter(t => t.status === 'active').length,
      inactive: data.filter(t => t.status === 'inactive' || t.status === 'on_leave').length,
    });
  };

  const filtered = teachers.filter(t => {
    const matchSearch = `${t.first_name} ${t.last_name} ${t.phone}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const toggleSelectAll = () => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(t => t.id));
  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const openCreate = () => { setForm(initialForm); setErrors({}); setFormMode('create'); setIsFormOpen(true); };
  const openEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setForm({
      first_name: teacher.first_name || '',
      last_name: teacher.last_name || '',
      phone: teacher.phone?.replace('+998', '') || '',
      email: teacher.email || '',
      gender: teacher.gender || 'male',
      birth_date: teacher.birth_date || '',
      address: teacher.address || '',
      subjects: teacher.subjects || [],
      payment_type: teacher.payment_type || 'fixed',
      payment_amount: teacher.payment_amount || '',
      experience_years: teacher.experience_years || '',
      telegram_username: teacher.telegram_username || '',
      instagram_username: teacher.instagram_username || '',
      bio: teacher.bio || '',
    });
    setErrors({});
    setFormMode('edit');
    setIsFormOpen(true);
  };
  const openView = (teacher) => { setSelectedTeacher(teacher); setIsViewOpen(true); };
  const openDelete = (teacher) => { setSelectedTeacher(teacher); setIsDeleteOpen(true); };

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
    };

    if (form.email?.trim()) data.email = form.email.trim();
    if (form.birth_date) data.birth_date = form.birth_date;
    if (form.address?.trim()) data.address = form.address.trim();
    if (form.subjects?.length > 0) data.subjects = form.subjects;
    if (form.payment_type) data.payment_type = form.payment_type;
    if (form.payment_amount) data.payment_amount = Number(form.payment_amount);
    if (form.experience_years) data.experience_years = Number(form.experience_years);
    if (form.telegram_username?.trim()) data.telegram_username = form.telegram_username.trim();
    if (form.instagram_username?.trim()) data.instagram_username = form.instagram_username.trim();
    if (form.bio?.trim()) data.bio = form.bio.trim();

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
    } catch {
      toast.error("Xatolik yuz berdi!");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await teachersService.delete(selectedTeacher.id);
      toast.success("O'qituvchi o'chirildi!");
      setIsDeleteOpen(false);
      fetchTeachers();
    } catch {
      toast.error("Xatolik yuz berdi!");
    }
  };

  const formatPhone = (p) => {
    if (!p) return '-';
    const c = p.replace(/\D/g, '');
    return c.length === 12 ? `+${c.slice(0,3)} ${c.slice(3,5)} ${c.slice(5,8)} ${c.slice(8,10)} ${c.slice(10)}` : p;
  };

  const formatMoney = (v) => new Intl.NumberFormat('uz-UZ').format(v) + " so'm";

  const getSubjectLabels = (subjects = []) => {
    return subjects.map(s => subjectOptions.find(o => o.value === s)?.label || s);
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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('teachers.title')}</h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{stats.total}</span> ta o'qituvchi
            </span>
            <span className="text-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span style={{ color: 'var(--text-muted)' }}>{stats.active} faol</span>
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
            {t('teachers.addTeacher')}
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
            <option value="on_leave">Ta'tilda</option>
          </select>
          {(search || statusFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setStatusFilter('all'); }} className="h-11 px-4 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors">
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
              <FontAwesomeIcon icon={faChalkboardTeacher} className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>O'qituvchilar topilmadi</h3>
            <p className="mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>Yangi o'qituvchi qo'shing</p>
            <button onClick={openCreate} className="h-11 px-6 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium flex items-center gap-2 transition-colors">
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
              Yangi o'qituvchi
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <th className="p-4 w-12">
                      <input type="checkbox" checked={selectedIds.length === paginated.length && paginated.length > 0} onChange={toggleSelectAll} className="w-5 h-5 rounded border-gray-300 cursor-pointer" />
                    </th>
                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-muted)' }}>O'qituvchi</th>
                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Telefon</th>
                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Fanlar</th>
                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Guruhlar</th>
                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Holat</th>
                    <th className="p-4 w-32"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                      <td className="p-4">
                        <input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => toggleSelect(t.id)} className="w-5 h-5 rounded border-gray-300 cursor-pointer" />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0" style={{ backgroundColor: t.gender === 'female' ? '#EC4899' : '#1B365D' }}>
                            {getInitials(t.first_name, t.last_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{t.first_name} {t.last_name}</p>
                            {t.rating && (
                              <p className="text-sm flex items-center gap-1">
                                <FontAwesomeIcon icon={faStar} className="w-3 h-3 text-yellow-500" />
                                <span style={{ color: 'var(--text-muted)' }}>{t.rating}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <a href={`tel:${t.phone}`} className="text-primary-600 hover:underline font-medium">{formatPhone(t.phone)}</a>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {getSubjectLabels(t.subjects).slice(0, 2).map((s, i) => (
                            <span key={i} className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">{s}</span>
                          ))}
                          {t.subjects?.length > 2 && (
                            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800" style={{ color: 'var(--text-muted)' }}>+{t.subjects.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUsers} className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                          <span style={{ color: 'var(--text-primary)' }}>{t.groups_count || 0} guruh</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusConfig[t.status]?.bg, color: statusConfig[t.status]?.color }}>
                          {statusConfig[t.status]?.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openView(t)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Ko'rish">
                            <FontAwesomeIcon icon={faEye} className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                          </button>
                          <button onClick={() => openEdit(t)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Tahrirlash">
                            <FontAwesomeIcon icon={faEdit} className="w-4 h-4 text-primary-600" />
                          </button>
                          <button onClick={() => openDelete(t)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="O'chirish">
                            <FontAwesomeIcon icon={faTrash} className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, filtered.length)} / {filtered.length}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
                    <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{page}</button>
                    );
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
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
          {/* Avatar */}
          <div className="flex justify-center py-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="relative">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: form.gender === 'female' ? '#EC4899' : '#1B365D' }}>
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
              <Input label="Ism" required placeholder="Ism" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} error={errors.first_name} />
              <Input label="Familiya" required placeholder="Familiya" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} error={errors.last_name} />
            </div>
            <Input label="Telefon" required prefix="+998" placeholder="90 123 45 67" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 9) })} error={errors.phone} />
            <Input label="Email" type="email" icon={faEnvelope} placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Tug'ilgan sana" type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Jinsi</label>
                <div className="flex h-12 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                  <button type="button" onClick={() => setForm({ ...form, gender: 'male' })} className={`flex-1 flex items-center justify-center gap-2 font-medium transition-colors ${form.gender === 'male' ? 'bg-primary-600 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`} style={form.gender !== 'male' ? { color: 'var(--text-secondary)' } : {}}>
                    <FontAwesomeIcon icon={faMale} className="w-4 h-4" /> Erkak
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, gender: 'female' })} className={`flex-1 flex items-center justify-center gap-2 font-medium transition-colors ${form.gender === 'female' ? 'bg-pink-500 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`} style={form.gender !== 'female' ? { color: 'var(--text-secondary)' } : {}}>
                    <FontAwesomeIcon icon={faFemale} className="w-4 h-4" /> Ayol
                  </button>
                </div>
              </div>
            </div>
            <Input label="Manzil" icon={faMapMarkerAlt} placeholder="Shahar, tuman" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Section>

          {/* Kasbiy ma'lumotlar */}
          <Section title="Kasbiy ma'lumotlar" icon={faGraduationCap} iconColor="bg-purple-100 dark:bg-purple-900/30 text-purple-600" defaultOpen={true}>
            <MultiSelect label="O'qitadigan fanlar" options={subjectOptions} value={form.subjects} onChange={(v) => setForm({ ...form, subjects: v })} />
            <Input label="Tajriba (yil)" type="number" placeholder="5" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} />
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Bio / Qo'shimcha</label>
              <textarea rows={3} placeholder="Sertifikatlar, yutuqlar..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </Section>

          {/* To'lov */}
          <Section title="To'lov shartlari" icon={faMoneyBillWave} iconColor="bg-green-100 dark:bg-green-900/30 text-green-600" defaultOpen={false}>
            <Select label="To'lov turi" options={paymentTypeOptions} value={form.payment_type} onChange={(v) => setForm({ ...form, payment_type: v })} />
            <Input
              label={form.payment_type === 'percent' ? 'Foiz (%)' : form.payment_type === 'hourly' ? 'Soatiga (so\'m)' : 'Oylik (so\'m)'}
              type="number"
              placeholder={form.payment_type === 'percent' ? '40' : '5000000'}
              value={form.payment_amount}
              onChange={(e) => setForm({ ...form, payment_amount: e.target.value })}
            />
          </Section>

          {/* Ijtimoiy tarmoqlar */}
          <Section title="Ijtimoiy tarmoqlar" icon={faTelegram} iconColor="bg-sky-100 dark:bg-sky-900/30 text-sky-500" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Telegram" icon={faTelegram} placeholder="@username" value={form.telegram_username} onChange={(e) => setForm({ ...form, telegram_username: e.target.value })} />
              <Input label="Instagram" icon={faInstagram} placeholder="@username" value={form.instagram_username} onChange={(e) => setForm({ ...form, instagram_username: e.target.value })} />
            </div>
          </Section>

          {/* Footer */}
          <div className="sticky bottom-0 flex gap-3 p-6 border-t" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <button onClick={() => setIsFormOpen(false)} className="flex-1 h-12 rounded-xl border font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              Bekor qilish
            </button>
            <button onClick={handleSubmit} disabled={formLoading} className="flex-1 h-12 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2 transition-colors">
              {formLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FontAwesomeIcon icon={faCheck} className="w-4 h-4" />{formMode === 'create' ? "Qo'shish" : 'Saqlash'}</>}
            </button>
          </div>
        </div>
      </Drawer>

      {/* VIEW DRAWER */}
      <Drawer isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="O'qituvchi ma'lumotlari">
        {selectedTeacher && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0" style={{ backgroundColor: selectedTeacher.gender === 'female' ? '#EC4899' : '#1B365D' }}>
                {getInitials(selectedTeacher.first_name, selectedTeacher.last_name)}
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedTeacher.first_name} {selectedTeacher.last_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusConfig[selectedTeacher.status]?.bg, color: statusConfig[selectedTeacher.status]?.color }}>
                    {statusConfig[selectedTeacher.status]?.label}
                  </span>
                  {selectedTeacher.rating && (
                    <span className="flex items-center gap-1 text-sm">
                      <FontAwesomeIcon icon={faStar} className="w-4 h-4 text-yellow-500" />
                      <span style={{ color: 'var(--text-primary)' }}>{selectedTeacher.rating}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <p className="text-2xl font-bold text-primary-600">{selectedTeacher.groups_count || 0}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Guruh</p>
              </div>
              <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <p className="text-2xl font-bold text-green-600">{selectedTeacher.students_count || 0}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>O'quvchi</p>
              </div>
              <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <p className="text-2xl font-bold text-purple-600">{selectedTeacher.experience_years || 0}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Yil tajriba</p>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <FontAwesomeIcon icon={faPhone} className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Telefon</p>
                  <a href={`tel:${selectedTeacher.phone}`} className="font-medium text-primary-600">{formatPhone(selectedTeacher.phone)}</a>
                </div>
              </div>
              {selectedTeacher.email && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Email</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedTeacher.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Subjects */}
            {selectedTeacher.subjects?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>O'qitadigan fanlar</h4>
                <div className="flex flex-wrap gap-2">
                  {getSubjectLabels(selectedTeacher.subjects).map((s, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Payment */}
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {paymentTypeOptions.find(p => p.value === selectedTeacher.payment_type)?.label || 'Oylik'}
              </p>
              <p className="text-2xl font-bold text-green-600">
                {selectedTeacher.payment_type === 'percent' ? `${selectedTeacher.payment_amount}%` : formatMoney(selectedTeacher.payment_amount || 0)}
              </p>
            </div>

            {/* Bio */}
            {selectedTeacher.bio && (
              <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Bio</h4>
                <p style={{ color: 'var(--text-secondary)' }}>{selectedTeacher.bio}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => { setIsViewOpen(false); openEdit(selectedTeacher); }} className="flex-1 h-12 rounded-xl border font-medium flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                <FontAwesomeIcon icon={faEdit} className="w-4 h-4" /> Tahrirlash
              </button>
              <button className="flex-1 h-12 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors">
                Guruhlarni ko'rish
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* DELETE MODAL */}
      <DeleteModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} name={`${selectedTeacher?.first_name} ${selectedTeacher?.last_name}`} />
    </div>
  );
}