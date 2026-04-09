import { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faSearch, faEdit, faTrash, faTimes, faCheck, faBook,
  faClock, faLayerGroup, faGraduationCap, faMoneyBillWave,
  faEllipsisVertical, faEye, faFileExport, faXmark, faTags,
  faChevronLeft, faChevronRight, faCircleCheck, faSlash,
} from '@fortawesome/free-solid-svg-icons';
import { coursesService } from '@/services/courses';
import { subjectsService } from '@/services/subjects';
import { useAuthStore } from '@/stores/authStore';

// =========================
// CONFIG
// =========================
const levelConfig = {
  beginner:          { label: 'Boshlang\'ich',    color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)' },
  elementary:        { label: 'Elementary',        color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)' },
  intermediate:      { label: 'O\'rta',            color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  upper_intermediate:{ label: 'Yuqori o\'rta',     color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
  advanced:          { label: 'Yuqori',            color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)' },
};

const durationOptions = [1, 2, 3, 4, 6, 9, 12].map(v => ({ value: v, label: `${v} oy` }));

const colorOptions = ['#3B82F6', '#22C55E', '#F97316', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4', '#F59E0B'];

const PER_PAGE = 12;

// =========================
// HELPERS
// =========================
const formatMoney = (v) => new Intl.NumberFormat('uz-UZ').format(v || 0) + " so'm";

// =========================
// SUB COMPONENTS
// =========================
function StatCard({ label, value, icon, color, bg, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[160px] p-4 rounded-2xl border-2 transition-all duration-200 text-left ${active ? 'shadow-md scale-[1.02]' : ''}`}
      style={{
        borderColor: active ? color : 'var(--border-color)',
        backgroundColor: active ? bg : 'var(--bg-secondary)',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.backgroundColor = bg;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
        }
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
          <FontAwesomeIcon icon={icon} className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
    </button>
  );
}

function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95vw] ${maxWidth} max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl`}
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputStyle = (error) => ({
  borderColor: error ? '#EF4444' : 'var(--border-color)',
  color: 'var(--text-primary)',
  backgroundColor: 'var(--bg-primary)',
});

// =========================
// MAIN
// =========================
export default function Courses() {
  const { user } = useAuthStore();
  const role = user?.role;
  const canManage = role === 'owner' || role === 'admin';
  const canDelete = role === 'owner';

  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, total_pages: 1 });
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all'); // all|active|inactive
  const [levelFilter, setLevelFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const debounceRef = useRef(null);

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formLoading, setFormLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const initialForm = {
    name: '',
    subject_name: '',
    description: '',
    level: 'beginner',
    duration_months: 3,
    total_lessons: 24,
    price: '',
    color: '#3B82F6',
    is_active: true,
  };
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  // ============== Fetch ==============
  const fetchCourses = async (opts = {}) => {
    setLoading(true);
    try {
      const params = {
        page: opts.page ?? page,
        per_page: PER_PAGE,
      };
      if (search) params.search = search;
      if (statusFilter === 'active') params.is_active = true;
      if (statusFilter === 'inactive') params.is_active = false;
      if (levelFilter) params.level = levelFilter;
      if (subjectFilter) params.subject = subjectFilter;

      const res = await coursesService.getAll(params);
      const body = res?.data || res;
      const list = body?.data || body?.results || [];
      const m = body?.meta || {};

      setCourses(Array.isArray(list) ? list : []);
      setMeta({
        total: m.total ?? list.length ?? 0,
        page: m.page ?? params.page,
        total_pages: m.total_pages ?? 1,
      });
    } catch (e) {
      toast.error("Kurslarni yuklashda xatolik");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await subjectsService.getAll({ per_page: 200 });
      const body = res?.data || res;
      const list = body?.data || body?.results || [];
      setSubjects(Array.isArray(list) ? list : []);
    } catch {
      setSubjects([]);
    }
  };

  const fetchStats = async () => {
    try {
      const [allRes, activeRes] = await Promise.all([
        coursesService.getAll({ per_page: 1 }),
        coursesService.getAll({ per_page: 1, is_active: true }),
      ]);
      const total = allRes?.data?.meta?.total ?? 0;
      const active = activeRes?.data?.meta?.total ?? 0;
      setStats({ total, active, inactive: Math.max(0, total - active) });
    } catch {
      setStats({ total: 0, active: 0, inactive: 0 });
    }
  };

  useEffect(() => { fetchSubjects(); fetchStats(); }, []);

  // Debounced search effect
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchCourses({ page: 1 });
    }, 400);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line
  }, [search]);

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line
  }, [page, statusFilter, levelFilter, subjectFilter]);

  // ============== Form helpers ==============
  const openCreate = () => {
    if (!canManage) return toast.error("Sizda ruxsat yo'q");
    setForm(initialForm);
    setErrors({});
    setFormMode('create');
    setSelected(null);
    setFormOpen(true);
  };

  const openEdit = (c) => {
    if (!canManage) return toast.error("Sizda ruxsat yo'q");
    setSelected(c);
    setForm({
      name: c.name || '',
      subject_name: c.subject_name || subjects.find(s => s.id === c.subject)?.name || '',
      description: c.description || '',
      level: c.level || 'beginner',
      duration_months: c.duration_months || 3,
      total_lessons: c.total_lessons || 24,
      price: c.price || '',
      color: c.color || '#3B82F6',
      is_active: c.is_active !== false,
    });
    setErrors({});
    setFormMode('edit');
    setFormOpen(true);
    setOpenMenuId(null);
  };

  const openView = (c) => {
    setSelected(c);
    setViewOpen(true);
    setOpenMenuId(null);
  };

  const openDelete = (c) => {
    if (!canDelete) return toast.error("O'chirish faqat egasiga ruxsat etiladi");
    setSelected(c);
    setDeleteOpen(true);
    setOpenMenuId(null);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Kurs nomi kerak';
    if (!form.subject_name.trim()) e.subject_name = 'Fan tanlang yoki yarating';
    if (!form.price || Number(form.price) <= 0) e.price = 'Narx kerak';
    if (!form.duration_months || form.duration_months < 1) e.duration_months = 'Davomiylik kerak';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Find or create subject
  const ensureSubject = async (name) => {
    const trimmed = name.trim();
    const existing = subjects.find(s => s.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;
    const res = await subjectsService.create({ name: trimmed, is_active: true });
    const body = res?.data || res;
    const created = body?.data || body;
    if (created?.id) {
      setSubjects((prev) => [...prev, created]);
      return created.id;
    }
    throw new Error("Fan yaratishda xato");
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setFormLoading(true);
    try {
      const subjectId = await ensureSubject(form.subject_name);
      const payload = {
        name: form.name.trim(),
        subject: subjectId,
        description: form.description?.trim() || '',
        level: form.level,
        duration_months: Number(form.duration_months),
        total_lessons: Number(form.total_lessons) || 0,
        price: Number(form.price),
        is_active: !!form.is_active,
      };

      if (formMode === 'create') {
        await coursesService.create(payload);
        toast.success("Kurs qo'shildi");
      } else {
        await coursesService.update(selected.id, payload);
        toast.success("Kurs yangilandi");
      }
      setFormOpen(false);
      fetchCourses();
      fetchStats();
    } catch (e) {
      const data = e.response?.data;
      const msg =
        data?.error?.message ||
        data?.detail ||
        (typeof data === 'object' ? Object.values(data || {}).flat().join(', ') : null) ||
        e.message ||
        'Xatolik';
      toast.error(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await coursesService.delete(selected.id);
      toast.success("Kurs o'chirildi");
      setDeleteOpen(false);
      fetchCourses();
      fetchStats();
    } catch (e) {
      const data = e.response?.data;
      const msg = data?.error?.message || data?.detail || '';
      if (e.response?.status === 409 || msg.toLowerCase().includes('protect') || msg.toLowerCase().includes('group')) {
        toast.error("Bu kursni o'chirib bo'lmaydi — unga guruhlar bog'langan");
      } else {
        toast.error(msg || "Xatolik");
      }
    }
  };

  const exportCSV = () => {
    if (!courses.length) return toast.info("Eksport uchun ma'lumot yo'q");
    const headers = ['Nomi', 'Fan', 'Daraja', 'Davomiyligi', 'Darslar', 'Narxi', 'Holat', 'Guruhlar'];
    const rows = courses.map((c) => [
      c.name,
      c.subject_name || '',
      levelConfig[c.level]?.label || c.level || '',
      `${c.duration_months || 0} oy`,
      c.total_lessons || 0,
      c.price || 0,
      c.is_active ? 'Faol' : 'Nofaol',
      c.groups_count || 0,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kurslar_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setLevelFilter('');
    setSubjectFilter('');
    setPage(1);
  };

  const hasFilters = search || statusFilter !== 'all' || levelFilter || subjectFilter;

  // Close menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handler = () => setOpenMenuId(null);
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [openMenuId]);

  // =========================
  // RENDER
  // =========================
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Kurslar</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Jami <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{stats.total}</span> ta kurs
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="h-10 px-4 rounded-xl border font-medium flex items-center gap-2 transition-all"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
          >
            <FontAwesomeIcon icon={faFileExport} className="w-4 h-4" />
            <span className="hidden sm:inline">Eksport</span>
          </button>
          {canManage && (
            <button
              onClick={openCreate}
              className="h-10 px-5 rounded-xl text-white font-medium flex items-center gap-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
              Yangi kurs
            </button>
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="flex flex-wrap gap-3">
        <StatCard
          label="Jami kurslar"
          value={stats.total}
          icon={faBook}
          color="#3B82F6"
          bg="rgba(59, 130, 246, 0.12)"
          active={statusFilter === 'all'}
          onClick={() => { setStatusFilter('all'); setPage(1); }}
        />
        <StatCard
          label="Faol"
          value={stats.active}
          icon={faCircleCheck}
          color="#22C55E"
          bg="rgba(34, 197, 94, 0.12)"
          active={statusFilter === 'active'}
          onClick={() => { setStatusFilter('active'); setPage(1); }}
        />
        <StatCard
          label="Nofaol"
          value={stats.inactive}
          icon={faSlash}
          color="#94A3B8"
          bg="rgba(148, 163, 184, 0.12)"
          active={statusFilter === 'inactive'}
          onClick={() => { setStatusFilter('inactive'); setPage(1); }}
        />
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <FontAwesomeIcon icon={faSearch} className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kurs nomi yoki fan bo'yicha qidirish..."
              className="w-full h-11 pl-11 pr-10 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ color: 'var(--text-muted)' }}
              >
                <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
              </button>
            )}
          </div>
          <select
            value={levelFilter}
            onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
            className="h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
          >
            <option value="">Barcha darajalar</option>
            {Object.entries(levelConfig).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={subjectFilter}
            onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
            className="h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
          >
            <option value="">Barcha fanlar</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="h-11 px-4 rounded-xl border font-medium flex items-center gap-2 transition-all"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-primary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-primary)'; }}
            >
              <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
              Tozalash
            </button>
          )}
        </div>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div
          className="rounded-2xl border flex flex-col items-center justify-center py-20"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <FontAwesomeIcon icon={faBook} className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Kurslar topilmadi</h3>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
            {hasFilters ? "Filtrlarni o'zgartirib qaytadan urinib ko'ring" : "Birinchi kursni qo'shing"}
          </p>
          {!hasFilters && canManage && (
            <button
              onClick={openCreate}
              className="mt-5 h-11 px-6 rounded-xl text-white font-medium flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
            >
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
              Yangi kurs
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {courses.map((c) => {
            const lvl = levelConfig[c.level] || levelConfig.beginner;
            const accent = c.color || lvl.color;
            return (
              <div
                key={c.id}
                onClick={() => openView(c)}
                className="rounded-2xl border p-5 cursor-pointer transition-all duration-200"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = accent;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px -10px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${accent}20` }}
                  >
                    <FontAwesomeIcon icon={faGraduationCap} className="w-6 h-6" style={{ color: accent }} />
                  </div>
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === c.id ? null : c.id); }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <FontAwesomeIcon icon={faEllipsisVertical} className="w-4 h-4" />
                    </button>
                    {openMenuId === c.id && (
                      <div
                        className="absolute right-0 top-10 z-20 w-44 rounded-xl border shadow-xl py-1"
                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                      >
                        <button
                          onClick={() => openView(c)}
                          className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5" /> Ko'rish
                        </button>
                        {canManage && (
                          <button
                            onClick={() => openEdit(c)}
                            className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                            style={{ color: 'var(--text-primary)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" /> Tahrirlash
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => openDelete(c)}
                            className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-red-500 transition-colors"
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" /> O'chirish
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-base line-clamp-1 mb-1" style={{ color: 'var(--text-primary)' }}>
                  {c.name}
                </h3>

                {c.subject_name && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium mb-3"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                  >
                    <FontAwesomeIcon icon={faTags} className="w-2.5 h-2.5" />
                    {c.subject_name}
                  </span>
                )}

                {c.description && (
                  <p className="text-xs line-clamp-2 mb-4" style={{ color: 'var(--text-muted)' }}>
                    {c.description}
                  </p>
                )}

                {/* Stats row */}
                <div className="flex items-center justify-between text-xs mb-4 pb-4 border-b" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faClock} className="w-3 h-3" /> {c.duration_months} oy
                  </span>
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faBook} className="w-3 h-3" /> {c.total_lessons || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faLayerGroup} className="w-3 h-3" /> {c.groups_count || 0}
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold" style={{ color: accent }}>
                    {formatMoney(c.price)}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide"
                    style={{ backgroundColor: lvl.bg, color: lvl.color }}
                  >
                    {lvl.label}
                  </span>
                </div>

                {!c.is_active && (
                  <div className="mt-2 text-[10px] font-semibold uppercase text-center py-1 rounded-md" style={{ backgroundColor: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8' }}>
                    Nofaol
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      {!loading && courses.length > 0 && meta.total_pages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {((meta.page - 1) * PER_PAGE) + 1}–{Math.min(meta.page * PER_PAGE, meta.total)} / <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{meta.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="w-9 h-9 rounded-lg border flex items-center justify-center disabled:opacity-40 transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm px-3" style={{ color: 'var(--text-primary)' }}>
              {meta.page} / {meta.total_pages}
            </span>
            <button
              disabled={page >= meta.total_pages}
              onClick={() => setPage(p => Math.min(meta.total_pages, p + 1))}
              className="w-9 h-9 rounded-lg border flex items-center justify-center disabled:opacity-40 transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* CREATE / EDIT FORM */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === 'create' ? 'Yangi kurs' : 'Kursni tahrirlash'}
      >
        <div className="space-y-4">
          <Field label="Kurs nomi" required error={errors.name}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Masalan: General English Beginner"
              className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400"
              style={inputStyle(errors.name)}
            />
          </Field>

          <Field label="Fan" required error={errors.subject_name}>
            <input
              list="subjects-list"
              value={form.subject_name}
              onChange={(e) => setForm({ ...form, subject_name: e.target.value })}
              placeholder="Ingliz tili, Matematika, Python..."
              className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400"
              style={inputStyle(errors.subject_name)}
            />
            <datalist id="subjects-list">
              {subjects.map((s) => <option key={s.id} value={s.name} />)}
            </datalist>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Mavjud fan tanlang yoki yangi fan nomini yozing
            </p>
          </Field>

          <Field label="Tavsif">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Kurs haqida qisqacha..."
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              style={inputStyle()}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Narxi" required error={errors.price}>
              <div className="relative">
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="500000"
                  className="w-full h-12 pl-4 pr-14 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400"
                  style={inputStyle(errors.price)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }}>so'm</span>
              </div>
            </Field>
            <Field label="Davomiyligi" required error={errors.duration_months}>
              <select
                value={form.duration_months}
                onChange={(e) => setForm({ ...form, duration_months: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
                style={inputStyle(errors.duration_months)}
              >
                {durationOptions.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Daraja">
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
                style={inputStyle()}
              >
                {Object.entries(levelConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            <Field label="Darslar soni">
              <input
                type="number"
                value={form.total_lessons}
                onChange={(e) => setForm({ ...form, total_lessons: e.target.value })}
                placeholder="24"
                className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={inputStyle()}
              />
            </Field>
          </div>

          <Field label="Karta rangi">
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`w-10 h-10 rounded-xl transition-transform ${form.color === color ? 'ring-2 ring-offset-2 ring-orange-400 scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </Field>

          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-5 h-5 accent-orange-500"
            />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Faol kurs (yangi guruhlar uchun mavjud)
            </span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setFormOpen(false)}
              className="flex-1 h-12 rounded-xl border font-medium transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Bekor qilish
            </button>
            <button
              onClick={handleSubmit}
              disabled={formLoading}
              className="flex-1 h-12 rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
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

      {/* VIEW MODAL */}
      <Modal isOpen={viewOpen} onClose={() => setViewOpen(false)} title="Kurs ma'lumotlari">
        {selected && (() => {
          const lvl = levelConfig[selected.level] || levelConfig.beginner;
          const accent = selected.color || lvl.color;
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}20` }}>
                  <FontAwesomeIcon icon={faGraduationCap} className="w-8 h-8" style={{ color: accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{selected.name}</h3>
                  {selected.subject_name && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-medium" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                      {selected.subject_name}
                    </span>
                  )}
                </div>
                <span className="px-3 py-1 rounded-lg text-xs font-semibold" style={{ backgroundColor: lvl.bg, color: lvl.color }}>
                  {lvl.label}
                </span>
              </div>

              {selected.description && (
                <div>
                  <p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Tavsif</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selected.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Davomiyligi</p>
                  <p className="font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{selected.duration_months} oy</p>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Darslar</p>
                  <p className="font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{selected.total_lessons || 0}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Guruhlar</p>
                  <p className="font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{selected.groups_count || 0}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Holat</p>
                  <p className="font-semibold mt-1" style={{ color: selected.is_active ? '#22C55E' : '#94A3B8' }}>
                    {selected.is_active ? 'Faol' : 'Nofaol'}
                  </p>
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ backgroundColor: `${accent}15`, border: `1px solid ${accent}30` }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Narxi</p>
                <p className="text-2xl font-bold mt-1" style={{ color: accent }}>{formatMoney(selected.price)}</p>
              </div>

              {canManage && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { setViewOpen(false); openEdit(selected); }}
                    className="flex-1 h-11 rounded-xl border font-medium flex items-center justify-center gap-2 transition-colors"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                    Tahrirlash
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* DELETE MODAL */}
      {deleteOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteOpen(false)} />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95vw] max-w-md p-6 rounded-2xl shadow-2xl"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faTrash} className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>O'chirishni tasdiqlang</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                <strong>{selected?.name}</strong> kursini o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteOpen(false)}
                className="flex-1 h-12 rounded-xl border font-medium transition-colors"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
              >
                O'chirish
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
