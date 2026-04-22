import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faSearch, faEdit, faTrash, faTimes, faCheck, faUsers,
  faClock, faCalendarAlt, faMoneyBillWave, faExchangeAlt,
  faUserPlus, faEye, faChalkboardTeacher, faDoorOpen,
  faChevronLeft, faChevronRight, faFileExport, faXmark,
  faEllipsisVertical, faExclamationTriangle, faCircleCheck,
  faHourglassHalf, faBan, faLayerGroup, faGraduationCap,
} from '@fortawesome/free-solid-svg-icons';
import { groupsService } from '@/services/groups';
import { coursesService } from '@/services/courses';
import { teachersService } from '@/services/teachers';
import { studentsService } from '@/services/students';
import { roomsService } from '@/services/rooms';
import { useAuthStore } from '@/stores/authStore';
import { formatMoney } from '@/utils/format';
import Modal from '@/components/ui/Modal';
import { unwrap, unwrapList } from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';

// =========================
// CONFIG
// =========================
const statusConfig = {
  forming:   { label: 'Formayotgan', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.12)', icon: faHourglassHalf },
  active:    { label: 'Faol',         color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)', icon: faCircleCheck },
  completed: { label: 'Yakunlangan',  color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', icon: faCheck },
  cancelled: { label: 'Bekor qilingan',color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', icon: faBan },
};

const dayShort = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'];
const dayFull = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];

const PER_PAGE = 12;

// =========================
// HELPERS
// =========================
const formatTime = (t) => (t || '').slice(0, 5);

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
export default function Groups() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isOwner, isOwnerOrAdmin, isRegistrar } = usePermissions();
  const canManage = isOwnerOrAdmin;
  const canDelete = isOwner;
  const canAddStudent = isOwnerOrAdmin || isRegistrar;

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, total_pages: 1 });
  const [stats, setStats] = useState({ total: 0, active: 0, forming: 0, completed: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const debounceRef = useRef(null);

  // Meta
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allStudents, setAllStudents] = useState([]);

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formLoading, setFormLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const [studentsOpen, setStudentsOpen] = useState(false);
  const [groupStudents, setGroupStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addStudentForm, setAddStudentForm] = useState({ student_id: '', custom_price: '', discount_percent: '' });

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({ student_id: '', target_group_id: '', reason: '' });
  const [transferSourceStudents, setTransferSourceStudents] = useState([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferStudentsLoading, setTransferStudentsLoading] = useState(false);
  const [transferSearch, setTransferSearch] = useState('');

  const [conflictsOpen, setConflictsOpen] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [conflictsLoading, setConflictsLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const initialForm = {
    name: '',
    course: '',
    teacher: '',
    room: '',
    days: [],
    start_time: '09:00',
    end_time: '11:00',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    max_students: 15,
    price: '',
    status: 'forming',
  };
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  // ============== Fetch ==============
  const fetchGroups = async (opts = {}) => {
    setLoading(true);
    try {
      const params = {
        page: opts.page ?? page,
        per_page: PER_PAGE,
      };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (courseFilter) params.course = courseFilter;
      if (teacherFilter) params.teacher = teacherFilter;

      const res = await groupsService.getAll(params);
      const body = unwrap(res);
      const list = Array.isArray(body) ? body : (body?.results ?? body?.data ?? []);
      const m = body?.meta || {};
      setGroups(Array.isArray(list) ? list : []);
      setMeta({
        total: m.total ?? list.length ?? 0,
        page: m.page ?? params.page,
        total_pages: m.total_pages ?? 1,
      });
    } catch (e) {
      toast.error("Guruhlarni yuklashda xatolik");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [c, t, r] = await Promise.allSettled([
        coursesService.getAll({ per_page: 200, is_active: true }),
        teachersService.getAll({ per_page: 200 }),
        roomsService.getAll({ per_page: 200 }),
      ]);
      if (c.status === 'fulfilled') setCourses(unwrapList(c.value));
      if (t.status === 'fulfilled') setTeachers(unwrapList(t.value));
      if (r.status === 'fulfilled') setRooms(unwrapList(r.value));
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const [all, active, forming, completed] = await Promise.allSettled([
        groupsService.getAll({ per_page: 1 }),
        groupsService.getAll({ per_page: 1, status: 'active' }),
        groupsService.getAll({ per_page: 1, status: 'forming' }),
        groupsService.getAll({ per_page: 1, status: 'completed' }),
      ]);
      const t = (r) => (r.status === 'fulfilled' ? r.value?.data?.meta?.total ?? 0 : 0);
      setStats({ total: t(all), active: t(active), forming: t(forming), completed: t(completed) });
    } catch {
      setStats({ total: 0, active: 0, forming: 0, completed: 0 });
    }
  };

  useEffect(() => { fetchMeta(); fetchStats(); }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchGroups({ page: 1 });
    }, 400);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line
  }, [search]);

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line
  }, [page, statusFilter, courseFilter, teacherFilter]);

  // ============== Helpers ==============
  const openCreate = () => {
    if (!canManage) return toast.error("Sizda ruxsat yo'q");
    setForm(initialForm);
    setErrors({});
    setFormMode('create');
    setSelected(null);
    setFormOpen(true);
  };

  const openEdit = (g) => {
    if (!canManage) return toast.error("Sizda ruxsat yo'q");
    setSelected(g);
    setForm({
      name: g.name || '',
      course: g.course || '',
      teacher: g.teacher || '',
      room: g.room || '',
      days: g.days || [],
      start_time: formatTime(g.start_time) || '09:00',
      end_time: formatTime(g.end_time) || '11:00',
      start_date: g.start_date || new Date().toISOString().slice(0, 10),
      end_date: g.end_date || '',
      max_students: g.max_students || 15,
      price: g.price || '',
      status: g.status || 'forming',
    });
    setErrors({});
    setFormMode('edit');
    setFormOpen(true);
    setOpenMenuId(null);
  };

  const openDelete = (g) => {
    if (!canDelete) return toast.error("O'chirish faqat egasiga ruxsat etiladi");
    setSelected(g);
    setDeleteOpen(true);
    setOpenMenuId(null);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Guruh nomi kerak';
    if (!form.course) e.course = 'Kursni tanlang';
    if (!form.teacher) e.teacher = "O'qituvchini tanlang";
    if (!form.days.length) e.days = "Kunlar tanlanmagan";
    if (!form.start_time || !form.end_time) e.time = 'Vaqt kerak';
    if (form.start_time >= form.end_time) e.time = "Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak";
    if (!form.start_date) e.start_date = "Boshlanish sanasi kerak";
    if (!form.max_students || form.max_students < 1) e.max_students = "Maksimal o'quvchilar soni kerak";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setFormLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        course: form.course,
        teacher: form.teacher,
        days: form.days.map(Number),
        start_time: form.start_time,
        end_time: form.end_time,
        start_date: form.start_date,
        max_students: Number(form.max_students),
        status: form.status,
      };
      if (form.room) payload.room = form.room;
      if (form.end_date) payload.end_date = form.end_date;
      if (form.price) payload.price = Number(form.price);

      if (formMode === 'create') {
        await groupsService.create(payload);
        toast.success("Guruh qo'shildi");
      } else {
        await groupsService.update(selected.id, payload);
        toast.success("Guruh yangilandi");
      }
      setFormOpen(false);
      fetchGroups();
      fetchStats();
    } catch (e) {
      const data = e.response?.data;
      const msg =
        data?.error?.message ||
        data?.detail ||
        (typeof data === 'object' ? Object.values(data || {}).flat().join(', ') : null) ||
        'Xatolik';
      toast.error(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await groupsService.delete(selected.id);
      toast.success("Guruh o'chirildi");
      setDeleteOpen(false);
      fetchGroups();
      fetchStats();
    } catch (e) {
      const msg = e.response?.data?.error?.message || e.response?.data?.detail || "Xatolik";
      toast.error(msg);
    }
  };

  const toggleDay = (d) => {
    setForm((f) => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d].sort((a, b) => a - b),
    }));
  };

  const openStudents = async (g) => {
    setSelected(g);
    setStudentsOpen(true);
    setStudentsLoading(true);
    setOpenMenuId(null);
    try {
      const res = await groupsService.getStudents(g.id);
      const body = res?.data || res;
      const list = body?.data || body?.results || [];
      setGroupStudents(Array.isArray(list) ? list : []);
    } catch {
      setGroupStudents([]);
      toast.error("O'quvchilarni yuklashda xato");
    } finally {
      setStudentsLoading(false);
    }
  };

  const removeStudentFromGroup = async (studentId) => {
    if (!confirm("O'quvchini guruhdan chiqarmoqchimisiz?")) return;
    try {
      await groupsService.removeStudent(selected.id, studentId);
      toast.success("O'quvchi guruhdan chiqarildi");
      openStudents(selected);
      fetchGroups();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || "Xatolik");
    }
  };

  const openAddStudent = async (g) => {
    if (!canAddStudent) return toast.error("Sizda ruxsat yo'q");
    setSelected(g);
    setAddStudentForm({ student_id: '', custom_price: '', discount_percent: '' });
    setOpenMenuId(null);
    if (!allStudents.length) {
      try {
        const res = await studentsService.getAll({ per_page: 500, status: 'active' });
        const body = res?.data || res;
        const list = body?.data || body?.results || [];
        setAllStudents(Array.isArray(list) ? list : []);
      } catch {
        setAllStudents([]);
      }
    }
    setAddStudentOpen(true);
  };

  const handleAddStudent = async () => {
    if (!addStudentForm.student_id) return toast.error("O'quvchini tanlang");
    try {
      const payload = { student_id: Number(addStudentForm.student_id) };
      if (addStudentForm.custom_price) payload.custom_price = Number(addStudentForm.custom_price);
      if (addStudentForm.discount_percent) payload.discount_percent = Number(addStudentForm.discount_percent);
      await groupsService.addStudent(selected.id, payload);
      toast.success("O'quvchi qo'shildi");
      setAddStudentOpen(false);
      fetchGroups();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || "Xatolik");
    }
  };

  const openTransfer = async (g) => {
    if (!canManage) return toast.error("Sizda ruxsat yo'q");
    setSelected(g);
    setTransferForm({ student_id: '', target_group_id: '', reason: '' });
    setTransferSearch('');
    setTransferSourceStudents([]);
    setTransferOpen(true);
    setOpenMenuId(null);
    setTransferStudentsLoading(true);
    try {
      const res = await groupsService.getStudents(g.id);
      const list = res.data?.data || res.data?.results || res.data || [];
      setTransferSourceStudents(Array.isArray(list) ? list : []);
    } catch {
      toast.error("O'quvchilar yuklanmadi");
    } finally {
      setTransferStudentsLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferForm.student_id || !transferForm.target_group_id) {
      return toast.error("O'quvchi va guruhni tanlang");
    }
    setTransferLoading(true);
    try {
      await groupsService.transferStudent(selected.id, {
        student_id: Number(transferForm.student_id),
        target_group_id: Number(transferForm.target_group_id),
        reason: transferForm.reason || undefined,
      });
      toast.success("O'quvchi ko'chirildi");
      setTransferOpen(false);
      fetchGroups();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || "Xatolik");
    } finally {
      setTransferLoading(false);
    }
  };

  const checkConflicts = async () => {
    setConflictsOpen(true);
    setConflictsLoading(true);
    try {
      const res = await groupsService.getScheduleConflicts();
      const body = res?.data || res;
      const list = body?.data?.conflicts || body?.data || body?.conflicts || [];
      setConflicts(Array.isArray(list) ? list : []);
    } catch {
      setConflicts([]);
      toast.error("Konfliktlarni yuklashda xato");
    } finally {
      setConflictsLoading(false);
    }
  };

  const exportCSV = () => {
    if (!groups.length) return toast.info("Eksport uchun ma'lumot yo'q");
    const headers = ['Nomi', 'Kurs', "O'qituvchi", 'Kunlar', 'Vaqt', 'Xona', "O'quvchilar", 'Holat'];
    const rows = groups.map((g) => [
      g.name,
      g.course_name || '',
      g.teacher_name || '',
      (g.days || []).map((d) => dayShort[d]).join(' '),
      `${formatTime(g.start_time)} - ${formatTime(g.end_time)}`,
      g.room_name || g.room || '',
      `${g.students_count || 0}/${g.max_students || 0}`,
      statusConfig[g.status]?.label || g.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guruhlar_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCourseFilter('');
    setTeacherFilter('');
    setPage(1);
  };

  const hasFilters = search || statusFilter !== 'all' || courseFilter || teacherFilter;

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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Guruhlar</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Jami <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{stats.total}</span> ta guruh
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={checkConflicts}
            className="h-10 px-4 rounded-xl border font-medium flex items-center gap-2 transition-all"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
            title="Jadval konfliktlarini tekshirish"
          >
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Konfliktlar</span>
          </button>
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
              Yangi guruh
            </button>
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="flex flex-wrap gap-3">
        <StatCard
          label="Jami"
          value={stats.total}
          icon={faLayerGroup}
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
          label="Formayotgan"
          value={stats.forming}
          icon={faHourglassHalf}
          color="#EAB308"
          bg="rgba(234, 179, 8, 0.12)"
          active={statusFilter === 'forming'}
          onClick={() => { setStatusFilter('forming'); setPage(1); }}
        />
        <StatCard
          label="Yakunlangan"
          value={stats.completed}
          icon={faCheck}
          color="#94A3B8"
          bg="rgba(148, 163, 184, 0.12)"
          active={statusFilter === 'completed'}
          onClick={() => { setStatusFilter('completed'); setPage(1); }}
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
              placeholder="Guruh, kurs yoki o'qituvchi bo'yicha qidirish..."
              className="w-full h-11 pl-11 pr-10 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400"
              style={inputStyle()}
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
            value={courseFilter}
            onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }}
            className="h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
            style={inputStyle()}
          >
            <option value="">Barcha kurslar</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={teacherFilter}
            onChange={(e) => { setTeacherFilter(e.target.value); setPage(1); }}
            className="h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
            style={inputStyle()}
          >
            <option value="">Barcha o'qituvchilar</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
          </select>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="h-11 px-4 rounded-xl border font-medium flex items-center gap-2 transition-colors"
              style={inputStyle()}
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
      ) : groups.length === 0 ? (
        <div
          className="rounded-2xl border flex flex-col items-center justify-center py-20"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <FontAwesomeIcon icon={faLayerGroup} className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Guruhlar topilmadi</h3>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
            {hasFilters ? "Filtrlarni o'zgartiring" : "Birinchi guruhni qo'shing"}
          </p>
          {!hasFilters && canManage && (
            <button
              onClick={openCreate}
              className="mt-5 h-11 px-6 rounded-xl text-white font-medium flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
            >
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
              Yangi guruh
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => {
            const cfg = statusConfig[g.status] || statusConfig.forming;
            const fillRatio = g.max_students ? (g.students_count || 0) / g.max_students : 0;
            const fillColor = fillRatio >= 1 ? '#EF4444' : fillRatio >= 0.8 ? '#F59E0B' : '#22C55E';
            return (
              <div
                key={g.id}
                className="rounded-2xl border p-5 cursor-pointer transition-all duration-200"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                onClick={() => navigate(`/app/groups/${g.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = cfg.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px -10px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                      {g.name}
                    </h3>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                      <FontAwesomeIcon icon={faGraduationCap} className="w-3 h-3 mr-1" />
                      {g.course_name || '—'}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span
                      className="px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide flex items-center gap-1"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}
                    >
                      <FontAwesomeIcon icon={cfg.icon} className="w-2.5 h-2.5" />
                      {cfg.label}
                    </span>
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === g.id ? null : g.id); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <FontAwesomeIcon icon={faEllipsisVertical} className="w-4 h-4" />
                      </button>
                      {openMenuId === g.id && (
                        <div
                          className="absolute right-0 top-9 z-20 w-48 rounded-xl border shadow-xl py-1"
                          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                        >
                          <button
                            onClick={() => { setOpenMenuId(null); navigate(`/app/groups/${g.id}`); }}
                            className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                            style={{ color: 'var(--text-primary)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5" /> Batafsil
                          </button>
                          <button
                            onClick={() => openStudents(g)}
                            className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                            style={{ color: 'var(--text-primary)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <FontAwesomeIcon icon={faUsers} className="w-3.5 h-3.5" /> O'quvchilar
                          </button>
                          {canAddStudent && (
                            <button
                              onClick={() => openAddStudent(g)}
                              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                              style={{ color: 'var(--text-primary)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                              <FontAwesomeIcon icon={faUserPlus} className="w-3.5 h-3.5" /> O'quvchi qo'shish
                            </button>
                          )}
                          {canManage && (
                            <>
                              <button
                                onClick={() => openTransfer(g)}
                                className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <FontAwesomeIcon icon={faExchangeAlt} className="w-3.5 h-3.5" /> Ko'chirish
                              </button>
                              <button
                                onClick={() => openEdit(g)}
                                className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" /> Tahrirlash
                              </button>
                            </>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => openDelete(g)}
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
                </div>

                {/* Teacher */}
                <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <FontAwesomeIcon icon={faChalkboardTeacher} className="w-3 h-3" />
                  <span className="line-clamp-1">{g.teacher_name || '—'}</span>
                </div>

                {/* Days */}
                <div className="flex gap-1 mb-3">
                  {dayShort.map((d, i) => {
                    const active = (g.days || []).includes(i);
                    return (
                      <span
                        key={i}
                        className="flex-1 h-7 rounded-md text-[10px] font-semibold flex items-center justify-center"
                        style={{
                          backgroundColor: active ? cfg.bg : 'var(--bg-tertiary)',
                          color: active ? cfg.color : 'var(--text-muted)',
                          opacity: active ? 1 : 0.5,
                        }}
                      >
                        {d}
                      </span>
                    );
                  })}
                </div>

                {/* Time + Room */}
                <div className="flex items-center justify-between text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                    {formatTime(g.start_time)} – {formatTime(g.end_time)}
                  </span>
                  {(g.room_name || g.room) && (
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faDoorOpen} className="w-3 h-3" />
                      {g.room_name || g.room}
                    </span>
                  )}
                </div>

                {/* Students bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-muted)' }}>O'quvchilar</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {g.students_count || 0} / {g.max_students || 0}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${Math.min(100, fillRatio * 100)}%`,
                        backgroundColor: fillColor,
                      }}
                    />
                  </div>
                </div>

                {/* Price footer */}
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <span className="text-sm font-semibold" style={{ color: cfg.color }}>
                    {formatMoney(g.actual_price || g.price)}
                  </span>
                  {g.branch_name && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                      {g.branch_name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      {!loading && groups.length > 0 && meta.total_pages > 1 && (
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
            <span className="text-sm px-3" style={{ color: 'var(--text-primary)' }}>{meta.page} / {meta.total_pages}</span>
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
        title={formMode === 'create' ? 'Yangi guruh' : 'Guruhni tahrirlash'}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <Field label="Guruh nomi" required error={errors.name}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Masalan: English-A1-Morning"
              className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400"
              style={inputStyle(errors.name)}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Kurs" required error={errors.course}>
              <select
                value={form.course}
                onChange={(e) => {
                  const c = courses.find(x => x.id === Number(e.target.value));
                  setForm({ ...form, course: e.target.value, price: form.price || c?.price || '' });
                }}
                className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
                style={inputStyle(errors.course)}
              >
                <option value="">Tanlang...</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="O'qituvchi" required error={errors.teacher}>
              <select
                value={form.teacher}
                onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
                style={inputStyle(errors.teacher)}
              >
                <option value="">Tanlang...</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Dars kunlari" required error={errors.days}>
            <div className="grid grid-cols-7 gap-1.5">
              {dayShort.map((d, i) => {
                const active = form.days.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className="h-11 rounded-xl text-xs font-semibold transition-all border-2"
                    style={{
                      backgroundColor: active ? '#F97316' : 'var(--bg-primary)',
                      borderColor: active ? '#F97316' : 'var(--border-color)',
                      color: active ? '#fff' : 'var(--text-secondary)',
                    }}
                    title={dayFull[i]}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Boshlanish vaqti" required error={errors.time}>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={inputStyle(errors.time)}
              />
            </Field>
            <Field label="Tugash vaqti" required>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={inputStyle(errors.time)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Boshlanish sanasi" required error={errors.start_date}>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={inputStyle(errors.start_date)}
              />
            </Field>
            <Field label="Tugash sanasi (ixtiyoriy)">
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={inputStyle()}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Xona">
              <select
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
                style={inputStyle()}
              >
                <option value="">—</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.name || r.number}</option>)}
              </select>
            </Field>
            <Field label="Maks. o'quvchilar" required error={errors.max_students}>
              <input
                type="number"
                min="1"
                value={form.max_students}
                onChange={(e) => setForm({ ...form, max_students: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={inputStyle(errors.max_students)}
              />
            </Field>
            <Field label="Narxi (ixtiyoriy)">
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="Kurs narxi"
                className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={inputStyle()}
              />
            </Field>
          </div>

          <Field label="Holat">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
              style={inputStyle()}
            >
              {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>

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

      {/* STUDENTS MODAL */}
      <Modal
        isOpen={studentsOpen}
        onClose={() => setStudentsOpen(false)}
        title={selected ? `${selected.name} — O'quvchilar` : "O'quvchilar"}
      >
        {studentsLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : groupStudents.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
            <FontAwesomeIcon icon={faUsers} className="w-10 h-10 mb-2 opacity-50" />
            <p>Bu guruhda o'quvchilar yo'q</p>
          </div>
        ) : (
          <div className="space-y-2">
            {groupStudents.map((gs) => (
              <div
                key={gs.id}
                className="flex items-center justify-between p-3 rounded-xl border transition-colors"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-primary)'; }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                    {(gs.student_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{gs.student_name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{gs.student_phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {gs.is_debtor && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' }}>
                      Qarzdor
                    </span>
                  )}
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {formatMoney(gs.monthly_price || gs.custom_price)}
                  </span>
                  {canManage && (
                    <button
                      onClick={() => removeStudentFromGroup(gs.student)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 transition-colors"
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      title="Chiqarish"
                    >
                      <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ADD STUDENT MODAL */}
      <Modal
        isOpen={addStudentOpen}
        onClose={() => setAddStudentOpen(false)}
        title="O'quvchi qo'shish"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong>{selected?.name}</strong> guruhiga o'quvchi qo'shish
          </p>
          <Field label="O'quvchi" required>
            <select
              value={addStudentForm.student_id}
              onChange={(e) => setAddStudentForm({ ...addStudentForm, student_id: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
              style={inputStyle()}
            >
              <option value="">Tanlang...</option>
              {allStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} {s.phone ? `— ${s.phone}` : ''}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Maxsus narx (ixtiyoriy)">
              <input
                type="number"
                value={addStudentForm.custom_price}
                onChange={(e) => setAddStudentForm({ ...addStudentForm, custom_price: e.target.value })}
                placeholder="Kurs narxi"
                className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={inputStyle()}
              />
            </Field>
            <Field label="Chegirma %">
              <input
                type="number"
                min="0"
                max="100"
                value={addStudentForm.discount_percent}
                onChange={(e) => setAddStudentForm({ ...addStudentForm, discount_percent: e.target.value })}
                placeholder="0"
                className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={inputStyle()}
              />
            </Field>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setAddStudentOpen(false)}
              className="flex-1 h-12 rounded-xl border font-medium transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Bekor qilish
            </button>
            <button
              onClick={handleAddStudent}
              className="flex-1 h-12 rounded-xl text-white font-medium"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
            >
              Qo'shish
            </button>
          </div>
        </div>
      </Modal>

      {/* TRANSFER MODAL */}
      <Modal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="O'quvchini ko'chirish"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong>{selected?.name}</strong> guruhidan boshqa guruhga ko'chirish
          </p>
          <Field label="O'quvchi" required>
            {transferStudentsLoading ? (
              <div className="w-full h-12 px-4 rounded-xl border flex items-center text-sm" style={{ ...inputStyle(), color: 'var(--text-muted)' }}>
                O'quvchilar yuklanmoqda...
              </div>
            ) : transferSourceStudents.length === 0 ? (
              <div className="w-full h-12 px-4 rounded-xl border flex items-center text-sm" style={{ ...inputStyle(), color: 'var(--text-muted)' }}>
                Bu guruhda o'quvchi yo'q
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={transferSearch}
                  onChange={e => setTransferSearch(e.target.value)}
                  placeholder="Qidirish (ism yoki telefon)..."
                  className="w-full h-11 px-4 mb-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                  style={inputStyle()}
                />
                <select
                  value={transferForm.student_id}
                  onChange={(e) => setTransferForm({ ...transferForm, student_id: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
                  style={inputStyle()}
                >
                  <option value="">Tanlang...</option>
                  {transferSourceStudents
                    .filter(s => {
                      if (!transferSearch.trim()) return true;
                      const q = transferSearch.toLowerCase();
                      const name = (s.student_name || '').toLowerCase();
                      const phone = (s.student_phone || '').toLowerCase();
                      return name.includes(q) || phone.includes(q);
                    })
                    .map(s => (
                      <option key={s.student || s.id} value={s.student || s.id}>
                        {s.student_name || '—'}{s.student_phone ? ` — ${s.student_phone}` : ''}
                      </option>
                    ))}
                </select>
              </>
            )}
          </Field>
          <Field label="Maqsadli guruh" required>
            <select
              value={transferForm.target_group_id}
              onChange={(e) => setTransferForm({ ...transferForm, target_group_id: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
              style={inputStyle()}
            >
              <option value="">Tanlang...</option>
              {groups.filter(g => g.id !== selected?.id).map((g) => {
                const count = g.students_count ?? 0;
                const max = g.max_students ?? 0;
                const full = max > 0 && count >= max;
                return (
                  <option key={g.id} value={g.id} disabled={full}>
                    {g.name} {max > 0 ? `(${count}/${max})` : ''}{full ? " — to'lgan" : ''}
                  </option>
                );
              })}
            </select>
          </Field>
          <Field label="Sabab (ixtiyoriy)">
            <input
              value={transferForm.reason}
              onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
              placeholder="Ko'chirish sababi"
              className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400"
              style={inputStyle()}
            />
          </Field>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setTransferOpen(false)}
              className="flex-1 h-12 rounded-xl border font-medium transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Bekor qilish
            </button>
            <button
              onClick={handleTransfer}
              disabled={transferLoading || !transferForm.student_id || !transferForm.target_group_id}
              className="flex-1 h-12 rounded-xl text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
            >
              {transferLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Ko'chirish"}
            </button>
          </div>
        </div>
      </Modal>

      {/* CONFLICTS MODAL */}
      <Modal
        isOpen={conflictsOpen}
        onClose={() => setConflictsOpen(false)}
        title="Jadval konfliktlari"
      >
        {conflictsLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : conflicts.length === 0 ? (
          <div className="text-center py-10">
            <FontAwesomeIcon icon={faCircleCheck} className="w-12 h-12 text-green-500 mb-2" />
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Konfliktlar yo'q</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Barcha guruhlar to'g'ri rejalashtirilgan
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conflicts.map((c, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border-l-4 border"
                style={{
                  borderLeftColor: '#EF4444',
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                }}
              >
                <div className="flex items-start gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 text-red-500 mt-0.5" />
                  <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {c.message || c.description || JSON.stringify(c)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
                <strong>{selected?.name}</strong> guruhini o'chirmoqchimisiz?
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
