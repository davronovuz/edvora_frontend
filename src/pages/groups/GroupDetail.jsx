import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faCheck, faTimes, faClock, faShieldAlt,
  faChevronLeft, faChevronRight, faUsers, faCalendarAlt,
  faMoneyBill, faUserPlus, faPhone, faTrash, faWallet,
  faExclamationTriangle, faCheckCircle, faTimesCircle,
  faChartPie, faSave, faFileAlt, faBook, faClipboardList,
  faPlus, faEdit, faStar, faGraduationCap, faEye,
  faPencilAlt, faPercent, faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { groupsService } from '@/services/groups';
import { attendanceService, holidayService } from '@/services/attendance';
import { examsService, homeworksService, homeworkSubmissionsService, lessonPlansService } from '@/services/exams';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

// ─── Constants ───
const statusColors = { present: '#22C55E', absent: '#EF4444', late: '#EAB308', excused: '#3B82F6' };
const statusIcons = { present: faCheck, absent: faTimes, late: faClock, excused: faShieldAlt };
const statusLabels = { present: 'Keldi', absent: 'Kelmadi', late: 'Kechikdi', excused: 'Sababli' };
const dayNamesFull = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const formatMoney = (v) => Number(v || 0).toLocaleString('uz-UZ') + " so'm";

const examTypeLabels = { quiz: 'Quiz', midterm: 'Oraliq', final: 'Yakuniy', placement: 'Sinov', mock: 'Namunaviy' };
const examTypeColors = { quiz: '#8B5CF6', midterm: '#3B82F6', final: '#EF4444', placement: '#F59E0B', mock: '#6B7280' };
const gradeColors = { A: '#22C55E', B: '#3B82F6', C: '#EAB308', D: '#F97316', F: '#EF4444' };

// ─── Stat Card ───
const StatCard = ({ icon, label, value, color }) => (
  <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
    <div className="flex items-center gap-2 mb-1">
      <FontAwesomeIcon icon={icon} className="w-3.5 h-3.5" style={{ color }} />
      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
    <p className="text-lg font-bold" style={{ color }}>{value}</p>
  </div>
);

// ─── Badge ───
const Badge = ({ text, color, bg }) => (
  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: bg, color }}>{text}</span>
);

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, hasPermission } = useAuthStore();

  // Core
  const [group, setGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Attendance
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [attendanceMap, setAttendanceMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [attendanceModal, setAttendanceModal] = useState(null);
  const [holidays, setHolidays] = useState({});
  const [autoSaveStatus, setAutoSaveStatus] = useState({}); // { [day]: 'saving'|'saved'|'error' }
  const [cellPopup, setCellPopup] = useState(null); // { studentId, day, rect }
  const autoSaveTimers = useRef({});
  const pendingChanges = useRef({});

  // Students
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [addStudentId, setAddStudentId] = useState('');

  // Finance
  const [payments, setPayments] = useState([]);

  // Exams
  const [exams, setExams] = useState([]);
  const [examResults, setExamResults] = useState(null); // { examId: results[] }
  const [showExamForm, setShowExamForm] = useState(false);
  const [editExam, setEditExam] = useState(null);
  const [bulkGradeExam, setBulkGradeExam] = useState(null);
  const [gradeInputs, setGradeInputs] = useState({});

  // Homework
  const [homeworks, setHomeworks] = useState([]);
  const [showHwForm, setShowHwForm] = useState(false);
  const [editHw, setEditHw] = useState(null);
  const [hwSubmissions, setHwSubmissions] = useState(null);

  // Lesson Plans
  const [lessonPlans, setLessonPlans] = useState([]);
  const [showLpForm, setShowLpForm] = useState(false);
  const [editLp, setEditLp] = useState(null);
  const [expandedLp, setExpandedLp] = useState(null);

  // ─── Data fetching ───
  useEffect(() => { fetchCore(); }, [id]);
  useEffect(() => { if (group && activeTab === 'attendance') { fetchAttendance(); fetchLessonPlans(); fetchExams(); } }, [currentMonth, group, activeTab]);
  useEffect(() => {
    if (activeTab === 'exams') fetchExams();
    else if (activeTab === 'homework') fetchHomeworks();
    else if (activeTab === 'lessons') fetchLessonPlans();
  }, [activeTab, id]);
  // Fetch holidays when attendance tab loads
  useEffect(() => { if (activeTab === 'attendance') fetchHolidays(); }, [activeTab]);
  // If active tab is not visible due to permissions, fall back to first available
  useEffect(() => {
    const visibleKeys = ['overview', 'attendance', 'exams', 'homework', 'lessons'];
    if (user?.role === 'owner' || hasPermission('finance.view')) visibleKeys.push('finance');
    if (!visibleKeys.includes(activeTab)) setActiveTab(visibleKeys[0]);
  }, [user?.role]);
  // Close cell popup on scroll
  useEffect(() => {
    if (!cellPopup) return;
    const close = () => setCellPopup(null);
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, [cellPopup]);

  const fetchHolidays = async () => {
    try {
      const res = await holidayService.getAll({ is_active: true });
      const data = res.data?.data || res.data?.results || [];
      const map = {};
      data.forEach(h => {
        if (h.end_date) {
          // Multi-day holiday
          const start = new Date(h.date);
          const end = new Date(h.end_date);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            map[d.toISOString().slice(0, 10)] = h.name;
          }
        } else {
          map[h.date] = h.name;
        }
      });
      setHolidays(map);
    } catch { /* holidays are optional */ }
  };

  const fetchCore = async () => {
    setLoading(true);
    try {
      const [groupRes, studentsRes, summaryRes, paymentsRes] = await Promise.allSettled([
        groupsService.getById(id),
        groupsService.getStudents(id),
        groupsService.getSummary(id),
        api.get('/payments/', { params: { group: id, page_size: 200 } }),
      ]);
      if (groupRes.status === 'fulfilled') setGroup(groupRes.value.data?.data || groupRes.value.data);
      else { toast.error("Guruh topilmadi"); navigate('/app/groups'); return; }
      setStudents(studentsRes.status === 'fulfilled' ? (studentsRes.value.data?.data || studentsRes.value.data?.results || studentsRes.value.data || []) : []);
      setSummary(summaryRes.status === 'fulfilled' ? (summaryRes.value.data?.data || null) : null);
      setPayments(paymentsRes.status === 'fulfilled' ? (paymentsRes.value.data?.data || paymentsRes.value.data?.results || []) : []);
    } catch { toast.error("Xatolik"); }
    setLoading(false);
  };

  const fetchAttendance = async () => {
    try {
      const [year, month] = currentMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      const res = await api.get('/attendance/', {
        params: { group: id, date__gte: `${year}-${String(month).padStart(2, '0')}-01`, date__lte: `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`, page_size: 1000 }
      });
      const data = res.data?.data || res.data?.results || [];
      const map = {};
      data.forEach(a => { map[`${a.student}-${new Date(a.date).getDate()}`] = a.status; });
      setAttendanceMap(map);
    } catch { setAttendanceMap({}); }
  };

  const fetchExams = async () => {
    try {
      const res = await examsService.getAll({ group: id, ordering: '-exam_date' });
      setExams(res.data?.data || res.data?.results || res.data || []);
    } catch { setExams([]); }
  };

  const fetchHomeworks = async () => {
    try {
      const res = await homeworksService.getAll({ group: id, ordering: '-due_date' });
      setHomeworks(res.data?.data || res.data?.results || res.data || []);
    } catch { setHomeworks([]); }
  };

  const fetchLessonPlans = async () => {
    try {
      const res = await lessonPlansService.getAll({ group: id, ordering: 'lesson_number' });
      setLessonPlans(res.data?.data || res.data?.results || res.data || []);
    } catch { setLessonPlans([]); }
  };

  // ─── Attendance helpers ───
  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(day => {
    if (!group?.days || group.days.length === 0) return true;
    const d = new Date(year, month - 1, day);
    const weekday = d.getDay() === 0 ? 6 : d.getDay() - 1;
    return group.days.includes(weekday);
  });

  const prevMonth = () => { const d = new Date(year, month - 2, 1); setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };
  const nextMonth = () => { const d = new Date(year, month, 1); setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };
  const getDayNameFull = (day) => dayNamesFull[new Date(year, month - 1, day).getDay()];
  const isToday = (day) => { const t = new Date(); return t.getDate() === day && t.getMonth() + 1 === month && t.getFullYear() === year; };
  const isGroupDay = (day) => { if (!group?.days) return false; const d = new Date(year, month - 1, day); const w = d.getDay() === 0 ? 6 : d.getDay() - 1; return group.days.includes(w); };

  const autoSaveDayAttendance = useCallback(async (day) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setAutoSaveStatus(prev => ({ ...prev, [day]: 'saving' }));
    try {
      const attendances = [];
      students.forEach(gs => {
        const sid = gs.student || gs.student_id || gs.id;
        const status = attendanceMap[`${sid}-${day}`];
        if (status) attendances.push({ student_id: sid, status });
      });
      if (attendances.length === 0) { setAutoSaveStatus(prev => { const n = { ...prev }; delete n[day]; return n; }); return; }
      await attendanceService.bulkCreate({ group_id: id, date: dateStr, attendances });
      setAutoSaveStatus(prev => ({ ...prev, [day]: 'saved' }));
      setTimeout(() => setAutoSaveStatus(prev => { const n = { ...prev }; if (n[day] === 'saved') delete n[day]; return n; }), 2000);
    } catch {
      setAutoSaveStatus(prev => ({ ...prev, [day]: 'error' }));
    }
  }, [year, month, students, attendanceMap, id]);

  const queueAutoSave = useCallback((day) => {
    pendingChanges.current[day] = true;
    if (autoSaveTimers.current[day]) clearTimeout(autoSaveTimers.current[day]);
    autoSaveTimers.current[day] = setTimeout(() => {
      delete pendingChanges.current[day];
      autoSaveDayAttendance(day);
    }, 800);
  }, [autoSaveDayAttendance]);

  const cycleStatus = (studentId, day) => {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (holidays[dateKey]) return;
    const key = `${studentId}-${day}`;
    const cycle = [undefined, 'present', 'absent', 'late', 'excused'];
    const idx = cycle.indexOf(attendanceMap[key]);
    const next = cycle[(idx + 1) % cycle.length];
    setAttendanceMap(prev => { const m = { ...prev }; if (next === undefined) delete m[key]; else m[key] = next; return m; });
    queueAutoSave(day);
  };

  const setModalStatus = (studentId, status) => {
    const day = attendanceModal?.day;
    if (!day) return;
    const key = `${studentId}-${day}`;
    setAttendanceMap(prev => { const m = { ...prev }; if (m[key] === status) delete m[key]; else m[key] = status; return m; });
    queueAutoSave(day);
  };

  const saveDayAttendance = async (day) => {
    if (autoSaveTimers.current[day]) clearTimeout(autoSaveTimers.current[day]);
    setSaving(true);
    try {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const attendances = [];
      students.forEach(gs => {
        const sid = gs.student || gs.student_id || gs.id;
        const status = attendanceMap[`${sid}-${day}`];
        if (status) attendances.push({ student_id: sid, status });
      });
      if (attendances.length > 0) {
        await attendanceService.bulkCreate({ group_id: id, date: dateStr, attendances });
        setAutoSaveStatus(prev => ({ ...prev, [day]: 'saved' }));
        setTimeout(() => setAutoSaveStatus(prev => { const n = { ...prev }; if (n[day] === 'saved') delete n[day]; return n; }), 2000);
      }
    } catch (e) { toast.error(e.response?.data?.error?.message || "Xatolik"); }
    setSaving(false);
  };

  const getHolidayForDay = (day) => {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays[dateKey] || null;
  };

  const getLessonTopicForDay = (day) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const lp = lessonPlans.find(p => p.date === dateStr);
    return lp ? lp.title : null;
  };

  const getExamForDay = (day) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return exams.find(e => e.exam_date === dateStr);
  };

  const markAllStatus = (day, status) => {
    setAttendanceMap(prev => {
      const m = { ...prev };
      students.forEach(gs => { m[`${(gs.student || gs.student_id || gs.id)}-${day}`] = status; });
      return m;
    });
  };

  const openAttendanceModal = (day) => {
    setCellPopup(null);
    setAttendanceModal({ day, dateStr: `${day}-${monthNames[month - 1]}, ${getDayNameFull(day)}` });
  };

  // ─── Student helpers ───
  const getStudentId = (gs) => gs.student || gs.student_id || gs.id;
  const getStudentName = (gs) => gs.student_name || `${gs.first_name || ''} ${gs.last_name || ''}`.trim();

  const openAddStudent = async () => {
    try {
      const res = await api.get('/students/', { params: { page_size: 200 } });
      setAllStudents(res.data?.data || res.data?.results || []);
      setShowAddStudent(true);
    } catch { toast.error('Xato'); }
  };

  const handleAddStudent = async () => {
    if (!addStudentId) return;
    try {
      await groupsService.addStudent(id, { student_id: addStudentId });
      toast.success("Talaba qo'shildi");
      setShowAddStudent(false); setAddStudentId('');
      fetchCore();
    } catch (e) { toast.error(e.response?.data?.error?.message || 'Xato'); }
  };

  const removeStudent = async (studentId) => {
    if (!confirm("Talabani guruhdan chiqarishni tasdiqlaysizmi?")) return;
    try { await groupsService.removeStudent(id, studentId); toast.success("Talaba chiqarildi"); fetchCore(); }
    catch { toast.error('Xato'); }
  };

  const getStudentStats = (studentId) => {
    let present = 0, absent = 0, late = 0, excused = 0, total = 0;
    daysArray.forEach(day => { const s = attendanceMap[`${studentId}-${day}`]; if (s) { total++; if (s === 'present') present++; else if (s === 'absent') absent++; else if (s === 'late') late++; else if (s === 'excused') excused++; } });
    return { present, absent, late, excused, total };
  };

  // ─── Finance helpers ───
  const getStudentPayments = (sid) => payments.filter(p => p.student === sid || p.student_id === sid);
  const getStudentTotalPaid = (sid) => getStudentPayments(sid).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const financeStats = (() => {
    const gp = Number(group?.price || 0);
    let totalExpected = 0, totalPaid = 0, debtors = 0;
    students.forEach(gs => { const p = Number(gs.custom_price || gs.monthly_price || gp); const paid = getStudentTotalPaid(getStudentId(gs)); totalExpected += p; totalPaid += paid; if (paid < p && p > 0) debtors++; });
    return { totalExpected, totalPaid, debt: totalExpected - totalPaid, debtors };
  })();

  // ─── Exam helpers ───
  // Bo'sh qiymatlarni tozalash (backend validation uchun)
  const cleanPayload = (data) => {
    const cleaned = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== '' && val !== null && val !== undefined) cleaned[key] = val;
    }
    return cleaned;
  };

  const handleExamSave = async (formData) => {
    try {
      const payload = cleanPayload({ ...formData, group: id });
      if (editExam) await examsService.update(editExam.id, payload);
      else await examsService.create(payload);
      toast.success(editExam ? "Imtihon yangilandi" : "Imtihon yaratildi");
      setShowExamForm(false); setEditExam(null);
      fetchExams();
    } catch (e) { toast.error(e.response?.data?.error?.message || e.response?.data?.detail || 'Xato'); }
  };

  const deleteExam = async (examId) => {
    if (!confirm("Imtihonni o'chirishni tasdiqlaysizmi?")) return;
    try { await examsService.delete(examId); toast.success("O'chirildi"); fetchExams(); }
    catch { toast.error('Xato'); }
  };

  const loadExamResults = async (examId) => {
    try {
      const res = await examsService.getResults(examId);
      // Backend: {data: {results: [...], exam: ..., statistics: ...}}
      const results = res.data?.data?.results || res.data?.results || res.data?.data || [];
      setExamResults({ examId, data: Array.isArray(results) ? results : [] });
    } catch { toast.error('Natijalar yuklanmadi'); }
  };

  const openBulkGrade = async (exam) => {
    setBulkGradeExam(exam);
    const inputs = {};
    // Pre-fill with existing results
    try {
      const res = await examsService.getResults(exam.id);
      const results = res.data?.data?.results || res.data?.results || res.data?.data || [];
      (Array.isArray(results) ? results : []).forEach(r => { inputs[r.student || r.student_id] = { score: r.score || '', status: r.status || 'graded' }; });
    } catch {}
    // Fill remaining students
    students.forEach(gs => { const sid = getStudentId(gs); if (!inputs[sid]) inputs[sid] = { score: '', status: 'graded' }; });
    setGradeInputs(inputs);
  };

  const saveBulkGrade = async () => {
    if (!bulkGradeExam) return;
    setSaving(true);
    try {
      const results = Object.entries(gradeInputs)
        .filter(([, v]) => v.score !== '' && v.score !== null)
        .map(([studentId, v]) => ({ student_id: studentId, score: Number(v.score), status: v.status || 'graded' }));
      if (results.length === 0) { toast.warning("Hech qanday ball kiritilmagan"); setSaving(false); return; }
      await examsService.bulkGrade(bulkGradeExam.id, { results });
      toast.success(`${results.length} ta natija saqlandi`);
      setBulkGradeExam(null); setGradeInputs({});
      fetchExams();
    } catch (e) { toast.error(e.response?.data?.error?.message || 'Xato'); }
    setSaving(false);
  };

  // ─── Homework helpers ───
  const handleHwSave = async (formData) => {
    try {
      const payload = cleanPayload({ ...formData, group: id });
      if (editHw) await homeworksService.update(editHw.id, payload);
      else await homeworksService.create(payload);
      toast.success(editHw ? "Vazifa yangilandi" : "Vazifa yaratildi");
      setShowHwForm(false); setEditHw(null);
      fetchHomeworks();
    } catch (e) { toast.error(e.response?.data?.error?.message || 'Xato'); }
  };

  const deleteHw = async (hwId) => {
    if (!confirm("Vazifani o'chirishni tasdiqlaysizmi?")) return;
    try { await homeworksService.delete(hwId); toast.success("O'chirildi"); fetchHomeworks(); }
    catch { toast.error('Xato'); }
  };

  const loadHwSubmissions = async (hwId) => {
    try {
      const res = await homeworksService.getSubmissions(hwId);
      // Backend: {data: {submissions: [...], homework: ..., statistics: ...}}
      const subs = res.data?.data?.submissions || res.data?.results || res.data?.data || [];
      setHwSubmissions({ hwId, data: Array.isArray(subs) ? subs : [] });
    } catch { toast.error('Topshiriqlar yuklanmadi'); }
  };

  const gradeSubmission = async (submissionId, score, feedback) => {
    try {
      await homeworkSubmissionsService.grade(submissionId, { score, feedback, status: 'graded' });
      toast.success('Baholandi');
      if (hwSubmissions) loadHwSubmissions(hwSubmissions.hwId);
    } catch { toast.error('Xato'); }
  };

  // ─── Lesson Plan helpers ───
  const handleLpSave = async (formData) => {
    try {
      const payload = cleanPayload({ ...formData, group: id });
      if (editLp) await lessonPlansService.update(editLp.id, payload);
      else await lessonPlansService.create(payload);
      toast.success(editLp ? "Dars rejasi yangilandi" : "Dars rejasi yaratildi");
      setShowLpForm(false); setEditLp(null);
      fetchLessonPlans();
    } catch (e) { toast.error(e.response?.data?.error?.message || 'Xato'); }
  };

  const deleteLp = async (lpId) => {
    if (!confirm("Dars rejasini o'chirishni tasdiqlaysizmi?")) return;
    try { await lessonPlansService.delete(lpId); toast.success("O'chirildi"); fetchLessonPlans(); }
    catch { toast.error('Xato'); }
  };

  // ─── Derived ───
  const monthName = new Date(year, month - 1).toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' });
  const groupDays = group?.days_display || group?.days?.map(d => ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'][d]).join(', ') || '';

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" /></div>;
  if (!group) return null;

  const allTabs = [
    { key: 'overview', label: 'Umumiy', icon: faInfoCircle },
    { key: 'attendance', label: 'Davomat', icon: faCalendarAlt },
    { key: 'exams', label: 'Imtihonlar', icon: faFileAlt },
    { key: 'homework', label: 'Vazifalar', icon: faClipboardList },
    { key: 'finance', label: 'Moliya', icon: faWallet, permission: 'finance.view' },
    { key: 'lessons', label: 'Dars rejasi', icon: faBook },
  ];

  const tabs = allTabs.filter(tab => {
    if (!tab.permission) return true;
    if (user?.role === 'owner') return true;
    return hasPermission(tab.permission);
  });

  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/app/groups')} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
          <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{group.name} · {group.course_name}</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{group.teacher_name} · {groupDays} · {group.start_time?.slice(0, 5)}–{group.end_time?.slice(0, 5)}</p>
        </div>
        <button onClick={openAddStudent} className="px-3 py-2 rounded-lg text-xs font-medium text-white flex items-center gap-1.5" style={{ backgroundColor: 'var(--primary-600)' }}>
          <FontAwesomeIcon icon={faUserPlus} className="w-3.5 h-3.5" /> Talaba qo'shish
        </button>
      </div>

      {/* ─── Tabs ─── */}
      <div className="card overflow-hidden">
        <div className="flex border-b overflow-x-auto" style={{ borderColor: 'var(--border-color)' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-primary-600 text-primary-600' : 'border-transparent'}`}
              style={activeTab !== tab.key ? { color: 'var(--text-secondary)' } : {}}>
              <FontAwesomeIcon icon={tab.icon} className="w-3.5 h-3.5" />{tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* ═══════════ UMUMIY TAB ═══════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <StatCard icon={faUsers} label="O'quvchilar" value={`${summary?.students?.total || students.length} / ${group.max_students}`} color="#3B82F6" />
                <StatCard icon={faCheckCircle} label="Davomat %" value={`${summary?.attendance?.rate || 0}%`} color="#22C55E" />
                <StatCard icon={faStar} label="O'rtacha ball" value={summary?.exams?.avg_score || 0} color="#F59E0B" />
                <StatCard icon={faMoneyBill} label="Oylik daromad" value={formatMoney(summary?.finance?.month_revenue || 0)} color="#22C55E" />
                <StatCard icon={faExclamationTriangle} label="Qarz" value={formatMoney(summary?.finance?.total_debt || 0)} color="#EF4444" />
              </div>

              {/* Group info + Students side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Group info */}
                <div className="p-4 rounded-xl border space-y-2" style={{ borderColor: 'var(--border-color)' }}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Guruh ma'lumotlari</h3>
                  {[
                    ['Kurs', group.course_name],
                    ['O\'qituvchi', group.teacher_name || '—'],
                    ['Kunlar', groupDays],
                    ['Vaqt', `${group.start_time?.slice(0, 5)} – ${group.end_time?.slice(0, 5)}`],
                    ['Boshlanish', group.start_date],
                    ['Narx', formatMoney(group.actual_price || group.price)],
                    ['Holat', group.status_display || group.status],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{val}</span>
                    </div>
                  ))}
                </div>

                {/* Quick stats */}
                <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: 'var(--border-color)' }}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Qisqa hisobot</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.08)' }}>
                      <p className="text-2xl font-bold" style={{ color: '#22C55E' }}>{summary?.attendance?.present || 0}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Kelganlar (bu oy)</p>
                    </div>
                    <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
                      <p className="text-2xl font-bold" style={{ color: '#EF4444' }}>{summary?.attendance?.absent || 0}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Kelmaganlar (bu oy)</p>
                    </div>
                    <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,0.08)' }}>
                      <p className="text-2xl font-bold" style={{ color: '#3B82F6' }}>{summary?.exams?.completed || 0}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Imtihonlar o'tdi</p>
                    </div>
                    <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(249,115,22,0.08)' }}>
                      <p className="text-2xl font-bold" style={{ color: '#F97316' }}>{summary?.homeworks?.active || 0}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Faol vazifalar</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Students list */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  <FontAwesomeIcon icon={faUsers} className="mr-2 text-primary-600" />O'quvchilar ({students.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                        {['#', 'Ism', 'Telefon', 'Oylik', 'Holat', ''].map((h, i) => (
                          <th key={i} className={`py-2 px-3 text-xs font-medium ${i < 2 ? 'text-left' : i === 5 ? 'text-right' : 'text-center'}`} style={{ color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((gs, i) => {
                        const sid = getStudentId(gs);
                        const paid = getStudentTotalPaid(sid);
                        const price = Number(gs.custom_price || gs.monthly_price || group.price || 0);
                        const isPaid = paid >= price && price > 0;
                        const isPartial = paid > 0 && paid < price;
                        return (
                          <tr key={i} className="border-t hover:bg-black/[0.02] dark:hover:bg-white/[0.02]" style={{ borderColor: 'var(--border-color)' }}>
                            <td className="py-2 px-3 text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                            <td className="py-2 px-3 font-medium" style={{ color: 'var(--text-primary)' }}>{getStudentName(gs)}</td>
                            <td className="py-2 px-3 text-center text-xs" style={{ color: 'var(--text-muted)' }}>{gs.student_phone || '—'}</td>
                            <td className="py-2 px-3 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>{formatMoney(price)}</td>
                            <td className="py-2 px-3 text-center">
                              {isPaid ? <Badge text="To'ladi" color="#22C55E" bg="rgba(34,197,94,0.12)" /> :
                               isPartial ? <Badge text="Qisman" color="#EAB308" bg="rgba(234,179,8,0.12)" /> :
                               <Badge text="To'lamagan" color="#EF4444" bg="rgba(239,68,68,0.12)" />}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button onClick={() => removeStudent(sid)} className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ DAVOMAT TAB ═══════════ */}
          {activeTab === 'attendance' && (
            <div>
              {/* Compact header: month nav + legend + holiday btn in one row */}
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faChevronLeft} className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} /></button>
                  <input type="month" value={currentMonth} onChange={e => setCurrentMonth(e.target.value)} className="h-8 px-2.5 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                  <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} /></button>
                  <span className="text-xs font-semibold capitalize ml-1" style={{ color: 'var(--text-primary)' }}>{monthName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-wrap gap-2.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <span key={key} className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: statusColors[key] }} />{label}</span>
                    ))}
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: '#9CA3AF', backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 4px)' }} />Dam olish</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-20 px-2 py-2 text-left font-medium border-b border-r" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-muted)', minWidth: '140px' }}>Talaba</th>
                      {daysArray.map(day => {
                        const holiday = getHolidayForDay(day);
                        const topic = getLessonTopicForDay(day);
                        const examForDay = getExamForDay(day);
                        const today = isToday(day);
                        const saveStatus = autoSaveStatus[day];
                        return (
                          <th key={day} className={`px-0.5 py-1 text-center font-medium border-b border-l cursor-pointer select-none relative`}
                            style={{
                              borderColor: 'var(--border-color)',
                              minWidth: '38px',
                              backgroundColor: holiday ? '#F3F4F6' : today ? 'rgba(249,115,22,0.08)' : 'transparent',
                            }}
                            onClick={() => !holiday && openAttendanceModal(day)}
                            title={holiday ? `Dam olish: ${holiday}` : `${getDayNameFull(day)}, ${day}-${monthNames[month - 1]}${topic ? ` — ${topic}` : ''}${examForDay ? ` — Imtihon: ${examForDay.title}` : ''}`}>
                            {today && <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-[7px] font-bold px-1 rounded-b" style={{ backgroundColor: '#F97316', color: '#fff' }}>Bugun</div>}
                            <div className="text-[10px] font-semibold" style={{ color: today ? '#F97316' : holiday ? '#9CA3AF' : 'var(--text-muted)' }}>{getDayNameFull(day).slice(0, 2)}</div>
                            <div className="text-sm" style={{ color: today ? '#F97316' : holiday ? '#9CA3AF' : 'var(--text-primary)', textDecoration: holiday ? 'line-through' : 'none' }}>{day}</div>
                            {topic && !holiday && <div className="text-[7px] leading-tight truncate max-w-[34px] mx-auto" style={{ color: '#3B82F6' }}>{topic.length > 6 ? topic.slice(0, 6) + '..' : topic}</div>}
                            {examForDay && !holiday && <div className="text-[7px] leading-tight truncate max-w-[34px] mx-auto flex items-center justify-center gap-0.5" style={{ color: '#EF4444' }}><FontAwesomeIcon icon={faFileAlt} className="w-2 h-2" />{examForDay.title.length > 4 ? examForDay.title.slice(0, 4) + '..' : examForDay.title}</div>}
                            {holiday && <div className="text-[7px] leading-tight truncate max-w-[34px] mx-auto" style={{ color: '#9CA3AF' }}>{holiday.length > 5 ? holiday.slice(0, 5) + '..' : holiday}</div>}
                            {saveStatus === 'saving' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />}
                            {saveStatus === 'saved' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-green-500" style={{ animation: 'fadeOut 2s forwards' }} />}
                            {saveStatus === 'error' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-500 cursor-pointer" onClick={e => { e.stopPropagation(); autoSaveDayAttendance(day); }} title="Qayta urinish" />}
                          </th>
                        );
                      })}
                      <th className="px-2 py-2 text-center font-medium border-b border-l" style={{ borderColor: 'var(--border-color)', color: '#22C55E', minWidth: '30px' }}>K</th>
                      <th className="px-2 py-2 text-center font-medium border-b border-l" style={{ borderColor: 'var(--border-color)', color: '#EF4444', minWidth: '30px' }}>Y</th>
                      <th className="px-2 py-2 text-center font-medium border-b border-l" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)', minWidth: '55px' }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr><td colSpan={daysArray.length + 4} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Talabalar yo'q</td></tr>
                    ) : students.map((gs, i) => {
                      const sid = getStudentId(gs);
                      const stats = getStudentStats(sid);
                      const rate = stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;
                      const rateColor = rate >= 80 ? '#22C55E' : rate >= 60 ? '#EAB308' : '#EF4444';
                      return (
                        <tr key={i} className="border-t group" style={{ borderColor: 'var(--border-color)' }}>
                          <td className="sticky left-0 z-10 px-2 py-1.5 font-medium border-r transition-colors group-hover:brightness-95" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                            <span className="truncate block max-w-[130px] text-[11px]">{i + 1}. {getStudentName(gs)}</span>
                          </td>
                          {daysArray.map(day => {
                            const holiday = getHolidayForDay(day);
                            const status = attendanceMap[`${sid}-${day}`];
                            const today = isToday(day);
                            if (holiday) {
                              return (
                                <td key={day} className="px-0 py-0.5 text-center border-l" style={{ borderColor: 'var(--border-color)', backgroundColor: '#F3F4F6', backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(156,163,175,0.1) 3px, rgba(156,163,175,0.1) 6px)' }}>
                                  <div className="w-7 h-7 mx-auto" />
                                </td>
                              );
                            }
                            return (
                              <td key={day} onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setCellPopup(prev => prev?.studentId === sid && prev?.day === day ? null : { studentId: sid, day, rect });
                                }}
                                className="px-0 py-0.5 text-center border-l cursor-pointer transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                                style={{ borderColor: 'var(--border-color)', backgroundColor: today ? 'rgba(249,115,22,0.04)' : 'transparent' }}>
                                {status ? (
                                  <div className="w-7 h-7 mx-auto rounded-md flex items-center justify-center transition-transform hover:scale-110" style={{ backgroundColor: statusColors[status] }}>
                                    <FontAwesomeIcon icon={statusIcons[status]} className="w-3 h-3 text-white" />
                                  </div>
                                ) : isGroupDay(day) ? (
                                  <div className="w-7 h-7 mx-auto rounded-md" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
                                ) : null}
                              </td>
                            );
                          })}
                          <td className="px-2 py-1.5 text-center font-semibold border-l" style={{ borderColor: 'var(--border-color)', color: '#22C55E' }}>{stats.present}</td>
                          <td className="px-2 py-1.5 text-center font-semibold border-l" style={{ borderColor: 'var(--border-color)', color: '#EF4444' }}>{stats.absent}</td>
                          <td className="px-1.5 py-1.5 border-l" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="flex items-center gap-1">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, backgroundColor: rateColor }} />
                              </div>
                              <span className="text-[10px] font-bold w-7 text-right" style={{ color: rateColor }}>{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Auto-save CSS animation */}
              <style>{`@keyframes fadeOut { 0% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; } }`}</style>
            </div>
          )}

          {/* ═══════════ IMTIHONLAR TAB ═══════════ */}
          {activeTab === 'exams' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Imtihonlar ({exams.length})</h3>
                <button onClick={() => { setEditExam(null); setShowExamForm(true); }} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-1.5" style={{ backgroundColor: 'var(--primary-600)' }}>
                  <FontAwesomeIcon icon={faPlus} className="w-3 h-3" /> Yangi imtihon
                </button>
              </div>

              {exams.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                  <FontAwesomeIcon icon={faFileAlt} className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">Hali imtihon yo'q</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exams.map(exam => (
                    <div key={exam.id} className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{exam.title}</h4>
                            <Badge text={examTypeLabels[exam.exam_type] || exam.exam_type} color={examTypeColors[exam.exam_type] || '#6B7280'} bg={`${examTypeColors[exam.exam_type] || '#6B7280'}20`} />
                            <Badge text={exam.status === 'completed' ? 'Tugadi' : exam.status === 'scheduled' ? 'Rejalashtirilgan' : exam.status} color={exam.status === 'completed' ? '#22C55E' : '#F59E0B'} bg={exam.status === 'completed' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)'} />
                          </div>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {exam.exam_date} {exam.start_time ? `· ${exam.start_time.slice(0, 5)}` : ''} · Max: {exam.max_score} ball {exam.passing_score ? `· O'tish: ${exam.passing_score}` : ''}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => loadExamResults(exam.id)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500" title="Natijalar"><FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5" /></button>
                          <button onClick={() => openBulkGrade(exam)} className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500" title="Baholash"><FontAwesomeIcon icon={faPencilAlt} className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setEditExam(exam); setShowExamForm(true); }} className="p-1.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-500" title="Tahrirlash"><FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteExam(exam.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400" title="O'chirish"><FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>

                      {/* Inline results */}
                      {examResults?.examId === exam.id && (
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                          {examResults.data.length === 0 ? (
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Natijalar yo'q</p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                              {examResults.data.map((r, i) => {
                                const pct = exam.max_score > 0 ? Math.round((r.score / exam.max_score) * 100) : 0;
                                const grade = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : pct >= 40 ? 'D' : 'F';
                                return (
                                  <div key={i} className="flex items-center justify-between p-2 rounded-lg text-xs" style={{ backgroundColor: 'var(--bg-primary)' }}>
                                    <span className="truncate mr-2" style={{ color: 'var(--text-primary)' }}>{r.student_name || 'Talaba'}</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{r.score}/{exam.max_score}</span>
                                      <span className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: gradeColors[grade] }}>{grade}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════ VAZIFALAR TAB ═══════════ */}
          {activeTab === 'homework' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Uy vazifalari ({homeworks.length})</h3>
                <button onClick={() => { setEditHw(null); setShowHwForm(true); }} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-1.5" style={{ backgroundColor: 'var(--primary-600)' }}>
                  <FontAwesomeIcon icon={faPlus} className="w-3 h-3" /> Yangi vazifa
                </button>
              </div>

              {homeworks.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                  <FontAwesomeIcon icon={faClipboardList} className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">Hali vazifa yo'q</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {homeworks.map(hw => {
                    const isOverdue = hw.due_date && new Date(hw.due_date) < new Date() && hw.status === 'active';
                    return (
                      <div key={hw.id} className="p-4 rounded-xl border" style={{ borderColor: isOverdue ? '#EF444440' : 'var(--border-color)' }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{hw.title}</h4>
                              {isOverdue && <Badge text="Muddati o'tgan" color="#EF4444" bg="rgba(239,68,68,0.12)" />}
                              <Badge text={hw.status === 'active' ? 'Faol' : hw.status === 'closed' ? 'Yopilgan' : hw.status} color={hw.status === 'active' ? '#22C55E' : '#6B7280'} bg={hw.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.12)'} />
                            </div>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              Berilgan: {hw.assigned_date} · Muddat: {hw.due_date || '—'} · Max: {hw.max_score} ball
                            </p>
                            {hw.description && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{hw.description}</p>}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => loadHwSubmissions(hw.id)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500" title="Topshiriqlar"><FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { setEditHw(hw); setShowHwForm(true); }} className="p-1.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-500" title="Tahrirlash"><FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteHw(hw.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400" title="O'chirish"><FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>

                        {hwSubmissions?.hwId === hw.id && (
                          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                            {hwSubmissions.data.length === 0 ? (
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Topshiriqlar yo'q</p>
                            ) : (
                              <div className="space-y-2">
                                {hwSubmissions.data.map((sub, i) => (
                                  <div key={i} className="flex items-center justify-between p-2 rounded-lg text-xs" style={{ backgroundColor: 'var(--bg-primary)' }}>
                                    <div>
                                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{sub.student_name || 'Talaba'}</span>
                                      <span className="ml-2" style={{ color: 'var(--text-muted)' }}>{sub.submitted_at?.slice(0, 10) || '—'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {sub.status === 'graded' ? (
                                        <span className="font-bold" style={{ color: '#22C55E' }}>{sub.score}/{hw.max_score}</span>
                                      ) : (
                                        <Badge text={sub.status === 'submitted' ? 'Topshirilgan' : sub.status === 'pending' ? 'Kutilmoqda' : sub.status} color={sub.status === 'submitted' ? '#3B82F6' : '#F59E0B'} bg={sub.status === 'submitted' ? 'rgba(59,130,246,0.12)' : 'rgba(245,158,11,0.12)'} />
                                      )}
                                      {sub.status !== 'graded' && (
                                        <button onClick={() => {
                                          const score = prompt(`${sub.student_name} uchun ball (max ${hw.max_score}):`);
                                          if (score !== null && score !== '') gradeSubmission(sub.id, Number(score), '');
                                        }} className="p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500" title="Baholash">
                                          <FontAwesomeIcon icon={faPencilAlt} className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════ MOLIYA TAB ═══════════ */}
          {activeTab === 'finance' && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatCard icon={faChartPie} label="Kutilayotgan" value={formatMoney(financeStats.totalExpected)} color="#3B82F6" />
                <StatCard icon={faCheckCircle} label="Yig'ilgan" value={formatMoney(financeStats.totalPaid)} color="#22C55E" />
                <StatCard icon={faExclamationTriangle} label="Qarz" value={formatMoney(financeStats.debt)} color="#EF4444" />
                <StatCard icon={faTimesCircle} label="Qarzdorlar" value={`${financeStats.debtors} ta`} color="#EAB308" />
              </div>

              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Talabalar moliyaviy holati</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                      {['#', 'Talaba', 'Oylik', 'To\'langan', 'Qarz', 'Holat'].map((h, i) => (
                        <th key={i} className={`py-2.5 px-3 font-medium text-xs ${i < 2 ? 'text-left' : 'text-right'}`} style={{ color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((gs, i) => {
                      const sid = getStudentId(gs);
                      const price = Number(gs.custom_price || gs.monthly_price || group.price || 0);
                      const paid = getStudentTotalPaid(sid);
                      const debt = price - paid;
                      const isPaid = paid >= price && price > 0;
                      const isPartial = paid > 0 && paid < price;
                      return (
                        <tr key={i} className="border-t hover:bg-black/[0.02] dark:hover:bg-white/[0.02]" style={{ borderColor: 'var(--border-color)' }}>
                          <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                          <td className="py-2.5 px-3"><span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{getStudentName(gs)}</span></td>
                          <td className="py-2.5 px-3 text-right text-xs" style={{ color: 'var(--text-secondary)' }}>{formatMoney(price)}</td>
                          <td className="py-2.5 px-3 text-right text-xs font-medium" style={{ color: '#22C55E' }}>{formatMoney(paid)}</td>
                          <td className="py-2.5 px-3 text-right text-xs font-medium" style={{ color: debt > 0 ? '#EF4444' : '#22C55E' }}>{debt > 0 ? formatMoney(debt) : '—'}</td>
                          <td className="py-2.5 px-3 text-right">
                            {isPaid ? <Badge text="To'ladi" color="#22C55E" bg="rgba(34,197,94,0.12)" /> :
                             isPartial ? <Badge text="Qisman" color="#EAB308" bg="rgba(234,179,8,0.12)" /> :
                             <Badge text="To'lamagan" color="#EF4444" bg="rgba(239,68,68,0.12)" />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {payments.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>So'nggi to'lovlar</h3>
                  <div className="space-y-2">
                    {payments.slice(0, 10).map((p, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        <div>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{students.find(s => getStudentId(s) === (p.student || p.student_id))?.student_name || "Noma'lum"}</span>
                          <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{p.payment_date || p.created_at?.slice(0, 10)}</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#22C55E' }}>+{formatMoney(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════ DARS REJASI TAB ═══════════ */}
          {activeTab === 'lessons' && (() => {
            const completed = lessonPlans.filter(l => l.status === 'completed').length;
            const ready = lessonPlans.filter(l => l.status === 'ready').length;
            const draft = lessonPlans.filter(l => l.status === 'draft').length;
            const progressPct = lessonPlans.length > 0 ? Math.round((completed / lessonPlans.length) * 100) : 0;
            return (
            <div>
              {/* Header + Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Dars rejasi</h3>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>{completed} tugadi</span>
                    <span className="px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>{ready} tayyor</span>
                    <span className="px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>{draft} qoralama</span>
                  </div>
                </div>
                <button onClick={() => { setEditLp(null); setShowLpForm(true); }} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-1.5" style={{ backgroundColor: 'var(--primary-600)' }}>
                  <FontAwesomeIcon icon={faPlus} className="w-3 h-3" /> Yangi dars
                </button>
              </div>

              {/* Progress bar */}
              {lessonPlans.length > 0 && (
                <div className="mb-4 p-3 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>Umumiy progress</span>
                    <span className="text-xs font-bold" style={{ color: progressPct >= 80 ? '#22C55E' : progressPct >= 40 ? '#3B82F6' : '#F59E0B' }}>{progressPct}% · {completed}/{lessonPlans.length} dars</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, background: progressPct >= 80 ? 'linear-gradient(90deg, #22C55E, #16A34A)' : progressPct >= 40 ? 'linear-gradient(90deg, #3B82F6, #2563EB)' : 'linear-gradient(90deg, #F59E0B, #D97706)' }} />
                  </div>
                </div>
              )}

              {lessonPlans.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                  <FontAwesomeIcon icon={faBook} className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">Hali dars rejasi yo'q</p>
                  <p className="text-xs mt-1">Yangi dars qo'shish uchun yuqoridagi tugmani bosing</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {lessonPlans.map((lp, idx) => {
                    const isCompleted = lp.status === 'completed';
                    const isReady = lp.status === 'ready';
                    const statusColor = isCompleted ? '#22C55E' : isReady ? '#3B82F6' : '#F59E0B';
                    const hasDetails = lp.objectives || lp.materials || lp.homework_description || lp.notes;
                    return (
                      <div key={lp.id} className="rounded-xl border overflow-hidden transition-colors" style={{ borderColor: 'var(--border-color)', borderLeftWidth: '3px', borderLeftColor: statusColor }}>
                        {/* Main row */}
                        <div className="flex items-center gap-3 p-3">
                          {/* Number circle */}
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                            style={{ backgroundColor: statusColor + '18', color: statusColor }}>
                            {lp.lesson_number || idx + 1}
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)', textDecoration: isCompleted ? 'line-through' : 'none', opacity: isCompleted ? 0.7 : 1 }}>{lp.title}</h4>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {lp.date && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{lp.date}</span>}
                              {lp.duration_minutes && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{lp.duration_minutes} daq</span>}
                              <Badge text={isCompleted ? 'Tugadi' : isReady ? 'Tayyor' : 'Qoralama'} color={statusColor} bg={statusColor + '18'} />
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center gap-0.5">
                            {hasDetails && (
                              <button onClick={() => setExpandedLp(expandedLp === lp.id ? null : lp.id)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="Tafsilotlar">
                                <FontAwesomeIcon icon={faEye} className="w-3 h-3" style={{ color: expandedLp === lp.id ? 'var(--primary-600)' : 'var(--text-muted)' }} />
                              </button>
                            )}
                            {!isCompleted && (
                              <button onClick={async () => {
                                try {
                                  await lessonPlansService.update(lp.id, { status: lp.status === 'draft' ? 'ready' : 'completed' });
                                  toast.success(lp.status === 'draft' ? 'Tayyor deb belgilandi' : 'Tugadi deb belgilandi');
                                  fetchLessonPlans();
                                } catch { toast.error('Xato'); }
                              }} className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20" title={lp.status === 'draft' ? 'Tayyor' : 'Tugadi'}>
                                <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5" style={{ color: lp.status === 'draft' ? '#3B82F6' : '#22C55E' }} />
                              </button>
                            )}
                            <button onClick={() => { setEditLp(lp); setShowLpForm(true); }} className="p-1.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-500"><FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteLp(lp.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400"><FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        {/* Expanded details */}
                        {expandedLp === lp.id && hasDetails && (
                          <div className="px-3 pb-3 pt-0 ml-11 space-y-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                            {lp.objectives && (
                              <div className="pt-2">
                                <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Maqsadlar</span>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{lp.objectives}</p>
                              </div>
                            )}
                            {lp.materials && (
                              <div>
                                <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Materiallar</span>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{lp.materials}</p>
                              </div>
                            )}
                            {lp.homework_description && (
                              <div>
                                <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Uy vazifasi</span>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{lp.homework_description}</p>
                              </div>
                            )}
                            {lp.notes && (
                              <div>
                                <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Eslatmalar</span>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{lp.notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            );
          })()}
        </div>
      </div>

      {/* Cell popup for attendance */}
      {cellPopup && (
        <>
          <div onClick={() => setCellPopup(null)} className="fixed inset-0 z-40" />
          <div className="fixed z-50 p-1.5 rounded-xl shadow-xl border"
            style={{
              top: cellPopup.rect.bottom + 4,
              left: cellPopup.rect.left - 30,
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
            }}>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(statusColors).map(([key, color]) => (
                <button key={key} onClick={() => {
                  const k = `${cellPopup.studentId}-${cellPopup.day}`;
                  setAttendanceMap(prev => ({ ...prev, [k]: key }));
                  queueAutoSave(cellPopup.day);
                  setCellPopup(null);
                }} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors hover:brightness-95"
                  style={{ backgroundColor: color + '18', color }}>
                  <FontAwesomeIcon icon={statusIcons[key]} className="w-3 h-3" />
                  {statusLabels[key]}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ═══════════ MODALLAR ═══════════ */}

      {/* Yo'qlama modal */}
      {attendanceModal && (() => {
        const modalTopic = getLessonTopicForDay(attendanceModal.day);
        const modalSaveStatus = autoSaveStatus[attendanceModal.day];
        return (
          <>
            <div onClick={() => { saveDayAttendance(attendanceModal.day); setAttendanceModal(null); }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Yo'qlama</h2>
                    {modalSaveStatus === 'saving' && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(234,179,8,0.12)', color: '#EAB308' }}>Saqlanmoqda...</span>}
                    {modalSaveStatus === 'saved' && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>Saqlandi</span>}
                    {modalSaveStatus === 'error' && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium cursor-pointer" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }} onClick={() => autoSaveDayAttendance(attendanceModal.day)}>Xato - qayta urinish</span>}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{attendanceModal.dateStr}</p>
                  {modalTopic && <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#3B82F6' }}><FontAwesomeIcon icon={faBook} className="w-2.5 h-2.5" /> {modalTopic}</p>}
                </div>
                <button onClick={() => { saveDayAttendance(attendanceModal.day); setAttendanceModal(null); }} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faTimes} className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /></button>
              </div>
              <div className="flex gap-2 mb-4">
                <button onClick={() => { markAllStatus(attendanceModal.day, 'present'); queueAutoSave(attendanceModal.day); }} className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }}><FontAwesomeIcon icon={faCheck} className="w-3 h-3" /> Hammasi keldi</button>
                <button onClick={() => { markAllStatus(attendanceModal.day, 'absent'); queueAutoSave(attendanceModal.day); }} className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}><FontAwesomeIcon icon={faTimes} className="w-3 h-3" /> Hammasi kelmadi</button>
              </div>
              <div className="flex gap-2 mb-3 p-2.5 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <div key={key} className="flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg text-[11px] font-semibold" style={{ backgroundColor: statusColors[key] + '20', color: statusColors[key] }}><FontAwesomeIcon icon={statusIcons[key]} className="w-3 h-3" />{label}</div>
                ))}
              </div>
              <div className="space-y-2">
                {students.map((gs, i) => {
                  const sid = getStudentId(gs);
                  const cur = attendanceMap[`${sid}-${attendanceModal.day}`];
                  return (
                    <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block" style={{ color: 'var(--text-primary)' }}>{i + 1}. {getStudentName(gs)}</span>
                        {cur && <span className="text-[10px] font-medium" style={{ color: statusColors[cur] }}>{statusLabels[cur]}</span>}
                      </div>
                      <div className="flex gap-1.5">
                        {Object.entries(statusColors).map(([key, color]) => (
                          <button key={key} onClick={() => setModalStatus(sid, key)} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                            style={{ backgroundColor: cur === key ? color : 'transparent', border: `2px solid ${cur === key ? color : 'var(--border-color)'}`, color: cur === key ? '#fff' : 'var(--text-muted)' }} title={statusLabels[key]}>
                            <FontAwesomeIcon icon={statusIcons[key]} className="w-3.5 h-3.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-center mt-3" style={{ color: 'var(--text-muted)' }}>O'zgarishlar avtomatik saqlanadi</p>
            </div>
          </>
        );
      })()}

      {/* Add Student Modal */}
      {showAddStudent && (
        <>
          <div onClick={() => setShowAddStudent(false)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Talaba qo'shish</h2>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>"{group.name}" guruhiga</p>
            <select value={addStudentId} onChange={e => setAddStudentId(e.target.value)} className="w-full h-11 px-4 rounded-xl border bg-transparent mb-3" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">Talaba tanlang</option>
              {allStudents.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} — {s.phone}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowAddStudent(false)} className="flex-1 h-11 rounded-xl border font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Bekor</button>
              <button onClick={handleAddStudent} disabled={!addStudentId} className="flex-1 h-11 rounded-xl text-white font-medium disabled:opacity-50" style={{ backgroundColor: 'var(--primary-600)' }}>Qo'shish</button>
            </div>
          </div>
        </>
      )}

      {/* Exam Form Modal */}
      {showExamForm && <FormModal title={editExam ? "Imtihon tahrirlash" : "Yangi imtihon"} onClose={() => { setShowExamForm(false); setEditExam(null); }}
        onSave={handleExamSave} initial={editExam} fields={[
          { name: 'title', label: 'Nomi', required: true },
          { name: 'exam_type', label: 'Turi', type: 'select', options: Object.entries(examTypeLabels).map(([v, l]) => ({ value: v, label: l })) },
          { name: 'max_score', label: 'Max ball', type: 'number', required: true },
          { name: 'passing_score', label: "O'tish bali", type: 'number' },
          { name: 'exam_date', label: 'Sana', type: 'date', required: true },
          { name: 'start_time', label: 'Boshlanish vaqti', type: 'time' },
          { name: 'duration_minutes', label: 'Davomiyligi (daqiqa)', type: 'number' },
          { name: 'description', label: 'Izoh', type: 'textarea' },
        ]} />}

      {/* Homework Form Modal */}
      {showHwForm && <FormModal title={editHw ? "Vazifa tahrirlash" : "Yangi vazifa"} onClose={() => { setShowHwForm(false); setEditHw(null); }}
        onSave={handleHwSave} initial={editHw} fields={[
          { name: 'title', label: 'Nomi', required: true },
          { name: 'max_score', label: 'Max ball', type: 'number', required: true },
          { name: 'assigned_date', label: 'Berilgan sana', type: 'date', required: true },
          { name: 'due_date', label: 'Muddat', type: 'date' },
          { name: 'description', label: 'Tavsif', type: 'textarea' },
        ]} />}

      {/* Lesson Plan Form Modal */}
      {showLpForm && <FormModal title={editLp ? "Dars rejasi tahrirlash" : "Yangi dars rejasi"} onClose={() => { setShowLpForm(false); setEditLp(null); }}
        onSave={handleLpSave} initial={editLp} fields={[
          { name: 'lesson_number', label: 'Dars raqami', type: 'number', required: true },
          { name: 'title', label: 'Mavzu', required: true },
          { name: 'date', label: 'Sana', type: 'date' },
          { name: 'duration_minutes', label: 'Davomiyligi (daqiqa)', type: 'number' },
          { name: 'objectives', label: 'Maqsadlar', type: 'textarea' },
          { name: 'materials', label: 'Materiallar', type: 'textarea' },
          { name: 'homework_description', label: 'Uy vazifasi', type: 'textarea' },
          { name: 'status', label: 'Holat', type: 'select', options: [{ value: 'draft', label: 'Qoralama' }, { value: 'ready', label: 'Tayyor' }, { value: 'completed', label: 'Tugadi' }] },
          { name: 'notes', label: 'Eslatmalar', type: 'textarea' },
        ]} />}

      {/* Bulk Grade Modal */}
      {bulkGradeExam && (
        <>
          <div onClick={() => setBulkGradeExam(null)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center justify-between mb-4">
              <div><h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Baholash</h2><p className="text-sm" style={{ color: 'var(--text-muted)' }}>{bulkGradeExam.title} · Max: {bulkGradeExam.max_score}</p></div>
              <button onClick={() => setBulkGradeExam(null)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faTimes} className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="space-y-2">
              {students.map((gs, i) => {
                const sid = getStudentId(gs);
                const val = gradeInputs[sid]?.score ?? '';
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{i + 1}. {getStudentName(gs)}</span>
                    <input type="number" min="0" max={bulkGradeExam.max_score} value={val} placeholder="Ball"
                      onChange={e => setGradeInputs(prev => ({ ...prev, [sid]: { ...prev[sid], score: e.target.value } }))}
                      className="w-20 h-9 px-2 rounded-lg border text-center text-sm" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                    <span className="text-xs w-6 text-center font-bold" style={{ color: 'var(--text-muted)' }}>/{bulkGradeExam.max_score}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={saveBulkGrade} disabled={saving} className="w-full mt-4 py-3 rounded-xl text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--primary-600)' }}>
              <FontAwesomeIcon icon={faSave} className="w-4 h-4" />{saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Reusable Form Modal ───
function FormModal({ title, onClose, onSave, initial, fields }) {
  const [form, setForm] = useState(() => {
    const f = {};
    fields.forEach(field => { f[field.name] = initial?.[field.name] ?? ''; });
    return f;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faTimes} className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {fields.map(field => (
            <div key={field.name}>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>{field.label}{field.required && ' *'}</label>
              {field.type === 'textarea' ? (
                <textarea value={form[field.name]} onChange={e => setForm(prev => ({ ...prev, [field.name]: e.target.value }))}
                  rows={3} className="w-full px-3 py-2 rounded-xl border text-sm resize-none" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
              ) : field.type === 'select' ? (
                <select value={form[field.name]} onChange={e => setForm(prev => ({ ...prev, [field.name]: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border text-sm" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  <option value="">Tanlang</option>
                  {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              ) : (
                <input type={field.type || 'text'} value={form[field.name]} onChange={e => setForm(prev => ({ ...prev, [field.name]: e.target.value }))}
                  required={field.required} className="w-full h-10 px-3 rounded-xl border text-sm" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
              )}
            </div>
          ))}
          <button type="submit" className="w-full py-3 rounded-xl text-white font-semibold" style={{ backgroundColor: 'var(--primary-600)' }}>Saqlash</button>
        </form>
      </div>
    </>
  );
}
