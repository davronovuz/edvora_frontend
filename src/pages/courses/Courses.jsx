import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faSearch,
  faEdit,
  faTrash,
  faTimes,
  faCheck,
  faBook,
  faClock,
  faUsers,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import { coursesService } from '@/services/courses';
import { subjectsService } from '@/services/subjects';

// ============================================
// CONFIG
// ============================================
const statusConfig = {
  active: { label: 'Faol', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)' },
  inactive: { label: 'Nofaol', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)' },
};

const levelOptions = [
  { value: 'beginner', label: 'Boshlang\'ich' },
  { value: 'elementary', label: 'Elementary' },
  { value: 'intermediate', label: 'O\'rta' },
  { value: 'advanced', label: 'Yuqori' },
];

const durationOptions = [
  { value: 1, label: '1 oy' },
  { value: 2, label: '2 oy' },
  { value: 3, label: '3 oy' },
  { value: 4, label: '4 oy' },
  { value: 6, label: '6 oy' },
  { value: 12, label: '12 oy' },
];

const colorOptions = [
  '#3B82F6', '#22C55E', '#EF4444', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#6366F1'
];

// ============================================
// CUSTOM COMPONENTS
// ============================================

function Modal({ isOpen, onClose, title, children }) {
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </>
  );
}

function Input({ label, required, error, prefix, suffix, className = '', ...props }) {
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
        <input
          className={`w-full h-12 px-4 rounded-xl border bg-transparent transition-all focus:outline-none focus:ring-2 focus:ring-orange-400 ${prefix ? 'rounded-l-none' : ''} ${suffix ? 'rounded-r-none' : ''} ${error ? 'border-red-500' : ''}`}
          style={{ borderColor: error ? '#EF4444' : 'var(--border-color)', color: 'var(--text-primary)' }}
          {...props}
        />
        {suffix && (
          <div className="flex items-center justify-center px-4 rounded-r-xl border border-l-0 bg-gray-50 dark:bg-gray-800/50" style={{ borderColor: 'var(--border-color)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{suffix}</span>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

function Select({ label, required, options, value, onChange, error, placeholder, className = '' }) {
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
        className={`w-full h-12 px-4 rounded-xl border bg-transparent transition-all focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none cursor-pointer ${error ? 'border-red-500' : ''}`}
        style={{ borderColor: error ? '#EF4444' : 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

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
          <p style={{ color: 'var(--text-secondary)' }}><strong>{name}</strong> kursini o'chirmoqchimisiz?</p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 h-12 rounded-xl border font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Bekor qilish</button>
          <button onClick={onConfirm} className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors">O'chirish</button>
        </div>
      </div>
    </>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function Courses() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0 });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formMode, setFormMode] = useState('create');
  const [formLoading, setFormLoading] = useState(false);

  const initialForm = {
    name: '',  // Fan nomi
    description: '',
    price: '',
    duration_months: 3,
    level: 'beginner',
    color: '#3B82F6',
    status: 'active',
  };
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCourses();
    fetchSubjects();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await coursesService.getAll();
      let data = [];
      if (Array.isArray(res)) data = res;
      else if (res?.data?.results && Array.isArray(res.data.results)) data = res.data.results;
      else if (res?.data?.data && Array.isArray(res.data.data)) data = res.data.data;
      else if (Array.isArray(res?.data)) data = res.data;

      // Backend is_active -> frontend status mapping
      data = data.map(c => ({ ...c, status: c.is_active !== false ? 'active' : 'inactive' }));
      setCourses(data);
      calcStats(data);
    } catch (error) {
      console.log('Fetch error:', error);
      setCourses([]);
      calcStats([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await subjectsService.getAll();
      let data = [];
      if (Array.isArray(res)) data = res;
      else if (res?.data?.data && Array.isArray(res.data.data)) data = res.data.data;
      else if (Array.isArray(res?.data)) data = res.data;
      
      setSubjects(data);
    } catch (error) {
      console.log('Subjects fetch error:', error);
      setSubjects([]);
    }
  };

  // Fan topish yoki yaratish
  const getOrCreateSubject = async (name) => {
    const trimmedName = name.trim();

    // Mavjud fanni qidirish (case-insensitive)
    const existingSubject = subjects.find(
      s => s.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingSubject) return existingSubject;

    // Yangi fan yaratish (slug serverda avtomatik yaratiladi)
    const res = await subjectsService.create({ name: trimmedName });
    const newSubject = res?.data?.data || res?.data || res;

    if (newSubject?.id) {
      setSubjects(prev => [...prev, newSubject]);
      return newSubject;
    }

    throw new Error('Fan yaratilmadi');
  };

  const calcStats = (data) => {
    if (!Array.isArray(data)) data = [];
    setStats({
      total: data.length,
      active: data.filter(c => c.status === 'active').length,
    });
  };

  const filtered = courses.filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => {
    setForm(initialForm);
    setErrors({});
    setFormMode('create');
    setIsFormOpen(true);
  };

  const openEdit = (course) => {
    setSelectedCourse(course);
    setForm({
      name: course.subject?.name || course.name || '',
      description: course.description || '',
      price: course.price || '',
      duration_months: course.duration_months || 3,
      level: course.level || 'beginner',
      color: course.color || '#3B82F6',
      status: course.status || 'active',
    });
    setErrors({});
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const openDelete = (course) => {
    setSelectedCourse(course);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Fan nomi kiritilmagan';
    if (!form.price) errs.price = 'Narx kiritilmagan';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      // Fan topish yoki yaratish
      const subject = await getOrCreateSubject(form.name);
      
      console.log('Subject:', subject); // Debug
      
      if (!subject || !subject.id) {
        toast.error("Fan yaratishda xatolik!");
        setFormLoading(false);
        return;
      }
      
      const data = {
        name: form.name.trim(),
        price: Number(form.price),
        duration_months: Number(form.duration_months),
        level: form.level,
        is_active: form.status === 'active',
        subject: subject.id,
      };
      if (form.description?.trim()) data.description = form.description.trim();

      console.log('Course data:', data); // Debug

      if (formMode === 'create') {
        await coursesService.create(data);
        toast.success("Kurs muvaffaqiyatli qo'shildi!");
      } else {
        await coursesService.update(selectedCourse.id, data);
        toast.success("Kurs yangilandi!");
      }
      setIsFormOpen(false);
      fetchCourses();
    } catch (error) {
      const errData = error.response?.data;
      const errMsg = errData?.error?.message || errData?.detail ||
                     (typeof errData === 'object' ? Object.values(errData).flat().join(', ') : null) ||
                     "Xatolik yuz berdi!";
      toast.error(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await coursesService.delete(selectedCourse.id);
      toast.success("Kurs o'chirildi!");
      setIsDeleteOpen(false);
      fetchCourses();
    } catch (e) {
      const msg = e.response?.data?.error?.message || e.response?.data?.detail || '';
      if (e.response?.status === 400 || e.response?.status === 409 || msg.toLowerCase().includes('protect') || msg.toLowerCase().includes('foreign') || msg.toLowerCase().includes('bog\'langan')) {
        toast.error("Bu kursni o'chirib bo'lmaydi — unga guruhlar bog'langan. Avval guruhlarni o'chiring yoki boshqa kursga o'tkazing.");
      } else {
        toast.error(msg || "Xatolik yuz berdi!");
      }
    }
  };

  const formatMoney = (v) => new Intl.NumberFormat('uz-UZ').format(v) + " so'm";

  const getSubjectName = (course) => {
    if (course.subject_name) return course.subject_name;
    if (course.subject?.name) return course.subject.name;
    const subj = subjects.find(s => s.id === course.subject);
    return subj?.name || '';
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('nav.courses')}</h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{stats.total}</span> ta kurs
            </span>
            <span className="text-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span style={{ color: 'var(--text-muted)' }}>{stats.active} faol</span>
            </span>
          </div>
        </div>
        <button onClick={openCreate} className="h-10 px-5 rounded-xl text-white font-medium flex items-center gap-2 transition-colors" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
          Yangi kurs
        </button>
      </div>

      {/* FILTERS */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FontAwesomeIcon icon={faSearch} className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Kurs nomi bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-xl border bg-transparent transition-all focus:outline-none focus:ring-2 focus:ring-orange-400"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 rounded-xl border bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <option value="all">Barchasi</option>
            <option value="active">Faol</option>
            <option value="inactive">Nofaol</option>
          </select>
        </div>
      </div>

      {/* COURSES GRID */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <FontAwesomeIcon icon={faBook} className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Kurslar topilmadi</h3>
          <p className="mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>Yangi kurs qo'shing</p>
          <button onClick={openCreate} className="h-11 px-6 rounded-xl text-white font-medium flex items-center gap-2 transition-colors" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            Yangi kurs
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((course) => (
            <div key={course.id} className="card p-5 hover:shadow-lg transition-all group">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${course.color || '#3B82F6'}20` }}
                >
                  <FontAwesomeIcon icon={faBook} className="w-6 h-6" style={{ color: course.color || '#3B82F6' }} />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(course)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <FontAwesomeIcon icon={faEdit} className="w-4 h-4 text-orange-500" />
                  </button>
                  <button onClick={() => openDelete(course)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>{course.name}</h3>
              
              {/* Subject badge */}
              {getSubjectName(course) && (
                <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium mb-2" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  {getSubjectName(course)}
                </span>
              )}
              
              {course.description && (
                <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{course.description}</p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faClock} className="w-4 h-4" />
                  {course.duration_months} oy
                </span>
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faLayerGroup} className="w-4 h-4" />
                  {course.groups_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faUsers} className="w-4 h-4" />
                  {course.students_count || 0}
                </span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-lg font-bold" style={{ color: course.color || '#3B82F6' }}>{formatMoney(course.price)}</span>
                <span
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: statusConfig[course.status]?.bg, color: statusConfig[course.status]?.color }}
                >
                  {statusConfig[course.status]?.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM MODAL */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={formMode === 'create' ? "Yangi kurs" : "Kursni tahrirlash"}>
        <div className="space-y-4">
          {/* FAN NOMI - ODDIY INPUT */}
          <Input
            label="Fan nomi"
            required
            placeholder="Masalan: Ingliz tili, Matematika, Python..."
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Tavsif</label>
            <textarea
              rows={2}
              placeholder="Kurs haqida qisqacha..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Narxi"
              required
              type="number"
              placeholder="400000"
              suffix="so'm"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              error={errors.price}
            />
            <Select
              label="Davomiyligi"
              options={durationOptions}
              value={form.duration_months}
              onChange={(v) => setForm({ ...form, duration_months: v })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Daraja"
              options={levelOptions}
              value={form.level}
              onChange={(v) => setForm({ ...form, level: v })}
            />
            <Select
              label="Holat"
              options={[{ value: 'active', label: 'Faol' }, { value: 'inactive', label: 'Nofaol' }]}
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Rang</label>
            <div className="flex gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`w-10 h-10 rounded-xl transition-all ${form.color === color ? 'ring-2 ring-offset-2 ring-orange-400 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
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
              className="flex-1 h-12 rounded-xl disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2 transition-colors"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
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
      </Modal>

      {/* DELETE MODAL */}
      <DeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        name={selectedCourse?.name}
      />
    </div>
  );
}