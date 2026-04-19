import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faSearch, faEdit, faTrash, faTimes, faFileAlt, faClipboardList,
  faChevronLeft, faChevronRight, faCheckDouble, faUsers, faCalendarAlt,
  faClock, faStar, faBook, faUpload, faGraduationCap
} from '@fortawesome/free-solid-svg-icons';
import { examsService, examResultsService, homeworksService, homeworkSubmissionsService, lessonPlansService } from '@/services/exams';
import api from '@/services/api';
import Modal from '@/components/ui/Modal';

const examStatusConfig = {
  draft: { label: 'Qoralama', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
  scheduled: { label: 'Rejalashtirilgan', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  in_progress: { label: 'Jarayonda', color: '#EAB308', bg: 'rgba(234,179,8,0.15)' },
  completed: { label: 'Tugallangan', color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  cancelled: { label: 'Bekor', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
};

const examTypeConfig = {
  quiz: { label: 'Quiz', color: '#8B5CF6' },
  midterm: { label: 'Oraliq', color: '#3B82F6' },
  final: { label: 'Yakuniy', color: '#EF4444' },
  placement: { label: 'Darajani aniqlash', color: '#F97316' },
  mock: { label: 'Sinov', color: '#22C55E' },
};

const hwStatusConfig = {
  active: { label: 'Faol', color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  closed: { label: 'Yopilgan', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
  cancelled: { label: 'Bekor', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
};

const lpStatusConfig = {
  draft: { label: 'Qoralama', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
  ready: { label: 'Tayyor', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  completed: { label: "O'tildi", color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  cancelled: { label: 'Bekor', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
};

const emptyExam = { group: '', title: '', description: '', exam_type: 'quiz', max_score: 100, passing_score: 60, exam_date: '', start_time: '09:00', duration_minutes: 60, status: 'draft' };
const emptyHomework = { group: '', title: '', description: '', max_score: 100, assigned_date: new Date().toISOString().split('T')[0], due_date: '', status: 'active' };
const emptyLessonPlan = { group: '', lesson_number: '', title: '', description: '', objectives: '', materials: '', homework_description: '', date: '', duration_minutes: 90, status: 'draft', notes: '' };

export default function Exams() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('exams');
  const [exams, setExams] = useState([]);
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyExam);
  const [showHwForm, setShowHwForm] = useState(false);
  const [hwEditId, setHwEditId] = useState(null);
  const [hwForm, setHwForm] = useState(emptyHomework);
  const [groups, setGroups] = useState([]);
  const [showResults, setShowResults] = useState(null);
  const [results, setResults] = useState([]);
  const [showBulkGrade, setShowBulkGrade] = useState(null);
  const [bulkGrades, setBulkGrades] = useState([]);
  const [showSubmissions, setShowSubmissions] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [lessonPlans, setLessonPlans] = useState([]);
  const [showLpForm, setShowLpForm] = useState(false);
  const [lpEditId, setLpEditId] = useState(null);
  const [lpForm, setLpForm] = useState(emptyLessonPlan);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/groups/');
        setGroups(res.data?.data || res.data?.results || []);
      } catch {}
    })();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (tab === 'exams') {
        const res = await examsService.getAll(params);
        setExams(res.data?.data || res.data?.results || []);
      } else if (tab === 'homeworks') {
        const res = await homeworksService.getAll(params);
        setHomeworks(res.data?.data || res.data?.results || []);
      } else if (tab === 'lesson_plans') {
        const res = await lessonPlansService.getAll(params);
        setLessonPlans(res.data?.data || res.data?.results || []);
      }
    } catch { toast.error("Xato"); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tab, search]);

  // Exam CRUD
  const handleSaveExam = async () => {
    try {
      if (editId) { await examsService.update(editId, form); toast.success("Imtihon yangilandi"); }
      else { await examsService.create(form); toast.success("Imtihon yaratildi"); }
      setShowForm(false); setEditId(null); setForm(emptyExam); fetchData();
    } catch (e) { toast.error(e.response?.data?.error?.message || "Xato"); }
  };

  const handleDeleteExam = async (id) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    try { await examsService.delete(id); toast.success("O'chirildi"); fetchData(); }
    catch { toast.error("Xato"); }
  };

  // Homework CRUD
  const handleSaveHomework = async () => {
    try {
      if (hwEditId) { await homeworksService.update(hwEditId, hwForm); toast.success("Uy vazifasi yangilandi"); }
      else { await homeworksService.create(hwForm); toast.success("Uy vazifasi yaratildi"); }
      setShowHwForm(false); setHwEditId(null); setHwForm(emptyHomework); fetchData();
    } catch (e) { toast.error(e.response?.data?.error?.message || "Xato"); }
  };

  const handleDeleteHomework = async (id) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    try { await homeworksService.delete(id); toast.success("O'chirildi"); fetchData(); }
    catch { toast.error("Xato"); }
  };

  // Lesson Plan CRUD
  const handleSaveLessonPlan = async () => {
    try {
      if (lpEditId) { await lessonPlansService.update(lpEditId, lpForm); toast.success("Dars rejasi yangilandi"); }
      else { await lessonPlansService.create(lpForm); toast.success("Dars rejasi yaratildi"); }
      setShowLpForm(false); setLpEditId(null); setLpForm(emptyLessonPlan); fetchData();
    } catch (e) { toast.error(e.response?.data?.error?.message || "Xato"); }
  };

  const handleDeleteLessonPlan = async (id) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    try { await lessonPlansService.delete(id); toast.success("O'chirildi"); fetchData(); }
    catch { toast.error("Xato"); }
  };

  // Results & Grading
  const viewResults = async (exam) => {
    setShowResults(exam);
    try {
      const res = await examsService.getResults(exam.id);
      setResults(res.data?.data || res.data?.results || res.data || []);
    } catch { setResults([]); }
  };

  const openBulkGrade = async (exam) => {
    setShowBulkGrade(exam);
    try {
      const res = await examsService.getResults(exam.id);
      const existingResults = res.data?.data || res.data?.results || res.data || [];
      setBulkGrades(existingResults.map(r => ({ student: r.student, score: r.score || '' })));
    } catch { setBulkGrades([]); }
  };

  const handleBulkGrade = async () => {
    try {
      const grades = bulkGrades.filter(g => g.score !== '' && g.score !== null);
      await examsService.bulkGrade(showBulkGrade.id, { results: grades });
      toast.success("Natijalar saqlandi");
      setShowBulkGrade(null);
    } catch (e) { toast.error(e.response?.data?.error?.message || "Xato"); }
  };

  const viewSubmissions = async (hw) => {
    setShowSubmissions(hw);
    try {
      const res = await homeworksService.getSubmissions(hw.id);
      setSubmissions(res.data?.data || res.data?.results || res.data || []);
    } catch { setSubmissions([]); }
  };

  const gradeSubmission = async (id, score, feedback) => {
    try {
      await homeworkSubmissionsService.grade(id, { score, feedback });
      toast.success("Baholandi");
      viewSubmissions(showSubmissions);
    } catch { toast.error("Xato"); }
  };

  const tabs = [
    { key: 'exams', label: 'Imtihonlar', icon: faFileAlt },
    { key: 'homeworks', label: 'Uy vazifalari', icon: faBook },
    { key: 'lesson_plans', label: 'Dars rejalari', icon: faClipboardList },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('nav.exams')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Baholash tizimini boshqaring</p>
        </div>
        <button onClick={() => { if (tab === 'exams') { setForm(emptyExam); setEditId(null); setShowForm(true); } else if (tab === 'homeworks') { setHwForm(emptyHomework); setHwEditId(null); setShowHwForm(true); } else { setLpForm(emptyLessonPlan); setLpEditId(null); setShowLpForm(true); } }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>
          <FontAwesomeIcon icon={faPlus} /> {tab === 'exams' ? 'Imtihon qo\'shish' : tab === 'homeworks' ? 'Uy vazifasi qo\'shish' : 'Dars rejasi qo\'shish'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'shadow-sm' : ''}`}
            style={{ backgroundColor: tab === t.key ? 'var(--bg-secondary)' : 'transparent', color: tab === t.key ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            <FontAwesomeIcon icon={t.icon} /> {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..." className="w-full h-11 pl-11 pr-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
      </div>

      {/* Content */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} /></div>
        ) : tab === 'exams' ? (
          <table className="w-full">
            <thead><tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
              {['Nomi', 'Guruh', 'Turi', 'Sana', 'Max ball', 'Holat', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {exams.map(exam => (
                <tr key={exam.id} className="border-b hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{exam.title}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{exam.group_name || exam.group}</td>
                  <td className="px-4 py-3"><span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: examTypeConfig[exam.exam_type]?.color, backgroundColor: examTypeConfig[exam.exam_type]?.color + '15' }}>{examTypeConfig[exam.exam_type]?.label}</span></td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{exam.exam_date} {exam.start_time}</td>
                  <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{exam.max_score}</td>
                  <td className="px-4 py-3"><span style={{ color: examStatusConfig[exam.status]?.color, backgroundColor: examStatusConfig[exam.status]?.bg, padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>{examStatusConfig[exam.status]?.label}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => viewResults(exam)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="Natijalar"><FontAwesomeIcon icon={faClipboardList} className="w-4 h-4" style={{ color: 'var(--primary-600)' }} /></button>
                      <button onClick={() => openBulkGrade(exam)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="Baholash"><FontAwesomeIcon icon={faCheckDouble} className="w-4 h-4" style={{ color: '#22C55E' }} /></button>
                      <button onClick={() => { setForm({ group: exam.group, title: exam.title, description: exam.description || '', exam_type: exam.exam_type, max_score: exam.max_score, passing_score: exam.passing_score, exam_date: exam.exam_date, start_time: exam.start_time, duration_minutes: exam.duration_minutes, status: exam.status }); setEditId(exam.id); setShowForm(true); }} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faEdit} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} /></button>
                      <button onClick={() => handleDeleteExam(exam.id)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faTrash} className="w-4 h-4" style={{ color: '#EF4444' }} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {exams.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>Imtihonlar topilmadi</td></tr>}
            </tbody>
          </table>
        ) : tab === 'homeworks' ? (
          <table className="w-full">
            <thead><tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
              {['Nomi', 'Guruh', 'Max ball', 'Berilgan', 'Muddat', 'Holat', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {homeworks.map(hw => (
                <tr key={hw.id} className="border-b hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{hw.title}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{hw.group_name || hw.group}</td>
                  <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{hw.max_score}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{hw.assigned_date}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{hw.due_date}</td>
                  <td className="px-4 py-3"><span style={{ color: hwStatusConfig[hw.status]?.color, backgroundColor: hwStatusConfig[hw.status]?.bg, padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>{hwStatusConfig[hw.status]?.label}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => viewSubmissions(hw)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="Topshiriqlar"><FontAwesomeIcon icon={faUpload} className="w-4 h-4" style={{ color: 'var(--primary-600)' }} /></button>
                      <button onClick={() => { setHwForm({ group: hw.group, title: hw.title, description: hw.description || '', max_score: hw.max_score, assigned_date: hw.assigned_date, due_date: hw.due_date, status: hw.status }); setHwEditId(hw.id); setShowHwForm(true); }} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faEdit} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} /></button>
                      <button onClick={() => handleDeleteHomework(hw.id)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faTrash} className="w-4 h-4" style={{ color: '#EF4444' }} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {homeworks.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>Uy vazifalari topilmadi</td></tr>}
            </tbody>
          </table>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
              {['#', 'Mavzu', 'Guruh', 'Sana', 'Davomiylik', 'Holat', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {lessonPlans.map(lp => (
                <tr key={lp.id} className="border-b hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--primary-600)' }}>{lp.lesson_number}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{lp.title}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{lp.group_name || lp.group}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{lp.date || '—'}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{lp.duration_minutes} daq</td>
                  <td className="px-4 py-3"><span style={{ color: lpStatusConfig[lp.status]?.color, backgroundColor: lpStatusConfig[lp.status]?.bg, padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>{lpStatusConfig[lp.status]?.label}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setLpForm({ group: lp.group, lesson_number: lp.lesson_number, title: lp.title, description: lp.description || '', objectives: lp.objectives || '', materials: lp.materials || '', homework_description: lp.homework_description || '', date: lp.date || '', duration_minutes: lp.duration_minutes, status: lp.status, notes: lp.notes || '' }); setLpEditId(lp.id); setShowLpForm(true); }} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faEdit} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} /></button>
                      <button onClick={() => handleDeleteLessonPlan(lp.id)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faTrash} className="w-4 h-4" style={{ color: '#EF4444' }} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {lessonPlans.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>Dars rejalari topilmadi</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Exam Form Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditId(null); }} title={editId ? "Imtihon tahrirlash" : "Yangi imtihon"}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Nomi *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
          <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Guruh *</label><select value={form.group} onChange={e => setForm({ ...form, group: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}><option value="">Tanlang</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Turi</label><select value={form.exam_type} onChange={e => setForm({ ...form, exam_type: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{Object.entries(examTypeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Max ball</label><input type="number" value={form.max_score} onChange={e => setForm({ ...form, max_score: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
            <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>O'tish balli</label><input type="number" value={form.passing_score} onChange={e => setForm({ ...form, passing_score: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Sana</label><input type="date" value={form.exam_date} onChange={e => setForm({ ...form, exam_date: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
            <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Vaqt</label><input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
            <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Davomiylik (daq)</label><input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
          </div>
          <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Tavsif</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="flex-1 h-11 rounded-xl border font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Bekor</button>
            <button onClick={handleSaveExam} className="flex-1 h-11 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>Saqlash</button>
          </div>
        </div>
      </Modal>

      {/* Homework Form Modal */}
      <Modal isOpen={showHwForm} onClose={() => { setShowHwForm(false); setHwEditId(null); }} title={hwEditId ? "Uy vazifasini tahrirlash" : "Yangi uy vazifasi"}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Nomi *</label><input value={hwForm.title} onChange={e => setHwForm({ ...hwForm, title: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
          <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Guruh *</label><select value={hwForm.group} onChange={e => setHwForm({ ...hwForm, group: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}><option value="">Tanlang</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Max ball</label><input type="number" value={hwForm.max_score} onChange={e => setHwForm({ ...hwForm, max_score: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
            <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Berilgan sana</label><input type="date" value={hwForm.assigned_date} onChange={e => setHwForm({ ...hwForm, assigned_date: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
            <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Muddat</label><input type="date" value={hwForm.due_date} onChange={e => setHwForm({ ...hwForm, due_date: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
          </div>
          <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Tavsif</label><textarea value={hwForm.description} onChange={e => setHwForm({ ...hwForm, description: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowHwForm(false); setHwEditId(null); }} className="flex-1 h-11 rounded-xl border font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Bekor</button>
            <button onClick={handleSaveHomework} className="flex-1 h-11 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>Saqlash</button>
          </div>
        </div>
      </Modal>

      {/* Results Modal */}
      <Modal isOpen={!!showResults} onClose={() => setShowResults(null)} title={`${showResults?.title} - Natijalar`} wide>
        {results.length > 0 ? (
          <table className="w-full">
            <thead><tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
              {["O'quvchi", 'Ball', 'Foiz', 'Baho', 'Holat'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {results.map(r => (
                <tr key={r.id} className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>{r.student_name || r.student}</td>
                  <td className="px-3 py-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{r.score || '—'}</td>
                  <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{r.percentage ? r.percentage + '%' : '—'}</td>
                  <td className="px-3 py-2 text-sm font-bold" style={{ color: r.is_passed ? '#22C55E' : '#EF4444' }}>{r.grade_letter || '—'}</td>
                  <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Natijalar topilmadi</div>}
      </Modal>

      {/* Bulk Grade Modal */}
      <Modal isOpen={!!showBulkGrade} onClose={() => setShowBulkGrade(null)} title={`${showBulkGrade?.title} - Baholash`} wide>
        {bulkGrades.length > 0 ? (
          <div className="space-y-4">
            {bulkGrades.map((g, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{g.student_name || g.student}</span>
                <input type="number" value={g.score} onChange={e => { const updated = [...bulkGrades]; updated[i].score = e.target.value; setBulkGrades(updated); }} className="w-24 h-9 px-3 rounded-lg border bg-transparent text-center text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} placeholder="Ball" />
              </div>
            ))}
            <button onClick={handleBulkGrade} className="w-full h-11 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>Natijalarni saqlash</button>
          </div>
        ) : <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>O'quvchilar topilmadi</div>}
      </Modal>

      {/* Submissions Modal */}
      <Modal isOpen={!!showSubmissions} onClose={() => setShowSubmissions(null)} title={`${showSubmissions?.title} - Topshiriqlar`} wide>
        {submissions.length > 0 ? (
          <div className="space-y-3">
            {submissions.map(s => (
              <div key={s.id} className="p-3 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.student_name || s.student}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.submitted_at ? new Date(s.submitted_at).toLocaleString('uz-UZ') : '—'}</span>
                </div>
                {s.comment && <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{s.comment}</p>}
                <div className="flex items-center gap-2">
                  <input type="number" defaultValue={s.score || ''} placeholder="Ball" className="w-20 h-8 px-2 rounded-lg border bg-transparent text-sm text-center" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    onBlur={e => { if (e.target.value && e.target.value !== String(s.score)) gradeSubmission(s.id, parseFloat(e.target.value), ''); }} />
                  <span className="text-xs" style={{ color: s.status === 'graded' ? '#22C55E' : 'var(--text-muted)' }}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Topshiriqlar topilmadi</div>}
      </Modal>

      {/* Lesson Plan Form Modal */}
      <Modal isOpen={showLpForm} onClose={() => { setShowLpForm(false); setLpEditId(null); }} title={lpEditId ? "Dars rejasini tahrirlash" : "Yangi dars rejasi"} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Guruh *</label><select value={lpForm.group} onChange={e => setLpForm({ ...lpForm, group: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}><option value="">Tanlang</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Dars raqami *</label><input type="number" value={lpForm.lesson_number} onChange={e => setLpForm({ ...lpForm, lesson_number: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} placeholder="1" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Mavzu *</label><input value={lpForm.title} onChange={e => setLpForm({ ...lpForm, title: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
          <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Tavsif</label><textarea value={lpForm.description} onChange={e => setLpForm({ ...lpForm, description: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
          <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Dars maqsadlari</label><textarea value={lpForm.objectives} onChange={e => setLpForm({ ...lpForm, objectives: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} placeholder="Dars yakunida o'quvchi nimalarni bilishi kerak..." /></div>
          <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Materiallar</label><textarea value={lpForm.materials} onChange={e => setLpForm({ ...lpForm, materials: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} placeholder="Darslik, video, linklar..." /></div>
          <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Uy vazifasi tavsifi</label><textarea value={lpForm.homework_description} onChange={e => setLpForm({ ...lpForm, homework_description: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Sana</label><input type="date" value={lpForm.date} onChange={e => setLpForm({ ...lpForm, date: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
            <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Davomiylik (daq)</label><input type="number" value={lpForm.duration_minutes} onChange={e => setLpForm({ ...lpForm, duration_minutes: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
            <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Holat</label><select value={lpForm.status} onChange={e => setLpForm({ ...lpForm, status: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{Object.entries(lpStatusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Eslatmalar</label><textarea value={lpForm.notes} onChange={e => setLpForm({ ...lpForm, notes: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowLpForm(false); setLpEditId(null); }} className="flex-1 h-11 rounded-xl border font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Bekor</button>
            <button onClick={handleSaveLessonPlan} className="flex-1 h-11 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>Saqlash</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}