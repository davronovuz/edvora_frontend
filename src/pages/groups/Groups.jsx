import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faEdit, faTrash, faUsers, faTimes, faExchangeAlt, faExclamationTriangle, faUserPlus, faEye, faArchive } from '@fortawesome/free-solid-svg-icons';
import { groupsService } from '@/services/groups';
import { branchesService } from '@/services/branches';
import api from '@/services/api';

const dayNames = { uz: ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'], ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'], en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] };

const emptyForm = { name: '', course: '', teacher: '', start_date: '', end_date: '', days: [], start_time: '09:00', end_time: '11:00', room: '', max_students: 15, price: '', status: 'forming', branch: '' };

export default function Groups() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language || 'uz';
  const days = dayNames[lang] || dayNames.uz;

  const statusConfig = {
    forming: { label: t('groups.forming'), color: '#EAB308', bg: 'rgba(234,179,8,0.15)' },
    active: { label: t('common.active'), color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
    completed: { label: t('groups.completed'), color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
    cancelled: { label: t('groups.cancelled'), color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
    archived: { label: 'Arxiv', color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
  };

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showStudents, setShowStudents] = useState(null);
  const [groupStudents, setGroupStudents] = useState([]);
  const [showConflicts, setShowConflicts] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [showTransfer, setShowTransfer] = useState(null);
  const [transferForm, setTransferForm] = useState({ student_id: '', target_group_id: '', reason: '' });
  const [showAddStudent, setShowAddStudent] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [addStudentId, setAddStudentId] = useState('');

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterBranch) params.branch = filterBranch;
      const res = await groupsService.getAll(params);
      setGroups(res.data?.data || res.data?.results || []);
    } catch { toast.error(t('common.loading') + ' xato'); }
    setLoading(false);
  };

  const fetchMeta = async () => {
    try {
      const [c, tc, r, b] = await Promise.all([
        api.get('/courses/'), api.get('/teachers/'), api.get('/rooms/'), branchesService.getAll()
      ]);
      setCourses(c.data?.data || c.data?.results || []);
      setTeachers(tc.data?.data || tc.data?.results || []);
      setRooms(r.data?.data || r.data?.results || []);
      setBranches(b.data?.data || b.data?.results || []);
    } catch {}
  };

  useEffect(() => { fetchGroups(); fetchMeta(); }, []);
  useEffect(() => { fetchGroups(); }, [search, filterStatus, filterBranch]);

  const handleSave = async () => {
    try {
      const payload = { ...form, days: form.days.map(Number) };
      if (!payload.price) delete payload.price;
      if (!payload.room) delete payload.room;
      if (!payload.end_date) delete payload.end_date;
      if (!payload.branch) delete payload.branch;
      if (editId) { await groupsService.update(editId, payload); toast.success(t('groups.title') + ' ' + t('common.updated')); }
      else { await groupsService.create(payload); toast.success(t('groups.title') + ' ' + t('common.created')); }
      setShowForm(false); setEditId(null); setForm(emptyForm); fetchGroups();
    } catch (e) { toast.error(e.response?.data?.error?.message || 'Xato'); }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('common.delete') + '?')) return;
    try { await groupsService.delete(id); toast.success(t('common.delete') + ' ✓'); fetchGroups(); }
    catch { toast.error('Xato'); }
  };

  const handleArchive = async (g) => {
    if (!confirm(`"${g.name}" guruhni arxivga o'tkazilsinmi?`)) return;
    try {
      await groupsService.update(g.id, { status: 'archived' });
      toast.success('Guruh arxivga o\'tkazildi');
      fetchGroups();
    } catch { toast.error('Xato'); }
  };

  const handleEdit = (g) => {
    setForm({ name: g.name, course: g.course, teacher: g.teacher || '', start_date: g.start_date, end_date: g.end_date || '', days: g.days || [], start_time: g.start_time, end_time: g.end_time, room: g.room || '', max_students: g.max_students, price: g.price || '', status: g.status, branch: g.branch || '' });
    setEditId(g.id); setShowForm(true);
  };

  const viewStudents = async (group) => {
    try {
      const res = await groupsService.getStudents(group.id);
      setGroupStudents(res.data?.data || []);
      setShowStudents(group);
    } catch { toast.error('Xato'); }
  };

  const removeStudent = async (studentId) => {
    try {
      await groupsService.removeStudent(showStudents.id, studentId);
      toast.success(t('groups.removeStudent') + ' ✓');
      viewStudents(showStudents);
    } catch { toast.error('Xato'); }
  };

  const openAddStudent = async (group) => {
    try {
      const res = await api.get('/students/');
      setAllStudents(res.data?.data || res.data?.results || []);
      setShowAddStudent(group);
      setAddStudentId('');
    } catch { toast.error('Xato'); }
  };

  const handleAddStudent = async () => {
    if (!addStudentId) return;
    try {
      await groupsService.addStudent(showAddStudent.id, { student_id: addStudentId });
      toast.success(t('groups.addStudent') + ' ✓');
      setShowAddStudent(null); setAddStudentId('');
      fetchGroups();
    } catch (e) { toast.error(e.response?.data?.error?.message || 'Xato'); }
  };

  const checkConflicts = async () => {
    try {
      const res = await groupsService.getScheduleConflicts();
      setConflicts(res.data?.data?.conflicts || []);
      setShowConflicts(true);
    } catch { toast.error('Xato'); }
  };

  const handleTransfer = async () => {
    try {
      await groupsService.transferStudent(showTransfer.id, transferForm);
      toast.success(t('groups.transfer') + ' ✓');
      setShowTransfer(null); setTransferForm({ student_id: '', target_group_id: '', reason: '' });
    } catch (e) { toast.error(e.response?.data?.error?.message || 'Xato'); }
  };

  const toggleDay = (d) => {
    setForm(f => ({ ...f, days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('groups.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{groups.length} ta {t('groups.title').toLowerCase()}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={checkConflicts} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />{t('groups.schedule')}
          </button>
          <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: 'var(--primary-600)' }}>
            <FontAwesomeIcon icon={faPlus} className="mr-2" />{t('groups.addGroup')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('common.search')} className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="">{t('common.all')} {t('common.status').toLowerCase()}</option>
          {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {branches.length > 0 && (
          <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="px-3 py-2.5 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
            <option value="">{t('common.all')} {t('branches.title').toLowerCase()}</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {[t('common.name'), t('groups.course'), t('groups.teacher'), t('groups.schedule'), t('groups.room'), t('groups.studentsCount'), t('common.status'), t('common.actions')].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center" style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</td></tr>
              ) : groups.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center" style={{ color: 'var(--text-muted)' }}>{t('common.noData')}</td></tr>
              ) : groups.map(g => (
                <tr key={g.id} className="border-t hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-4 py-3 font-medium">
                    <button onClick={() => navigate(`/app/groups/${g.id}`)} className="text-left hover:text-primary-600 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {g.name}
                    </button>
                    {g.branch_name && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{g.branch_name}</span>}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{g.course_name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{g.teacher_name || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    <div className="text-xs">{g.days_display || g.days?.map(d => days[d]).join(', ')}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{g.start_time?.slice(0,5)} - {g.end_time?.slice(0,5)}</div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{g.room_name || g.room || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{g.students_count}/{g.max_students}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ color: statusConfig[g.status]?.color, backgroundColor: statusConfig[g.status]?.bg }}>
                      {statusConfig[g.status]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => navigate(`/app/groups/${g.id}`)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Batafsil"><FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5 text-primary-600" /></button>
                      <button onClick={() => viewStudents(g)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title={t('groups.studentsCount')}><FontAwesomeIcon icon={faUsers} className="w-3.5 h-3.5 text-blue-500" /></button>
                      <button onClick={() => openAddStudent(g)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title={t('groups.addStudent')}><FontAwesomeIcon icon={faUserPlus} className="w-3.5 h-3.5 text-green-500" /></button>
                      <button onClick={() => { setShowTransfer(g); }} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title={t('groups.transfer')}><FontAwesomeIcon icon={faExchangeAlt} className="w-3.5 h-3.5 text-purple-500" /></button>
                      <button onClick={() => handleEdit(g)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title={t('common.edit')}><FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5 text-amber-500" /></button>
                      {g.status !== 'archived' && (
                        <button onClick={() => handleArchive(g)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Arxivga"><FontAwesomeIcon icon={faArchive} className="w-3.5 h-3.5 text-gray-500" /></button>
                      )}
                      <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title={t('common.delete')}><FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg mx-4 rounded-xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{editId ? t('common.edit') : t('groups.addGroup')}</h2>
              <button onClick={() => setShowForm(false)}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('common.name')} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              <select value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                <option value="">{t('groups.course')} {t('common.search').replace('...', '')}</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                <option value="">{t('groups.teacher')} {t('common.search').replace('...', '')}</option>
                {teachers.map(tc => <option key={tc.id} value={tc.id}>{tc.first_name} {tc.last_name}</option>)}
              </select>
              <select value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                <option value="">{t('groups.room')} {t('common.search').replace('...', '')}</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.number} - {r.name}</option>)}
              </select>
              {branches.length > 0 && (
                <select value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                  <option value="">{t('branches.title')} ({t('common.all')})</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>{t('groups.startTime')}</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>{t('groups.endTime')}</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>{t('groups.days')}</label>
                <div className="flex gap-1.5">
                  {days.map((d, i) => (
                    <button key={i} onClick={() => toggleDay(i)} className={`w-9 h-9 rounded-lg text-xs font-medium transition-colors ${form.days.includes(i) ? 'bg-blue-500 text-white' : 'border'}`} style={!form.days.includes(i) ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' } : {}}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>{t('common.time')} ({t('common.from')})</label>
                  <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>{t('common.time')} ({t('common.to')})</label>
                  <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={form.max_students} onChange={e => setForm({ ...form, max_students: e.target.value })} placeholder={t('groups.maxStudents')} className="px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder={t('groups.price')} className="px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <button onClick={handleSave} className="w-full py-2.5 rounded-lg text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>
                {editId ? t('common.save') : t('groups.addGroup')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Students Modal */}
      {showStudents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowStudents(null)}>
          <div className="w-full max-w-lg mx-4 rounded-xl p-6 max-h-[80vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{showStudents.name} — {t('students.title')}</h2>
              <button onClick={() => setShowStudents(null)}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            {groupStudents.length === 0 ? <p className="text-center py-4" style={{ color: 'var(--text-muted)' }}>{t('common.noData')}</p> : (
              <div className="space-y-2">
                {groupStudents.map(gs => (
                  <div key={gs.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{gs.student_name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{gs.student_phone}</p>
                    </div>
                    <button onClick={() => removeStudent(gs.student)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">{t('groups.removeStudent')}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddStudent(null)}>
          <div className="w-full max-w-md mx-4 rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('groups.addStudent')}</h2>
              <button onClick={() => setShowAddStudent(null)}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>"{showAddStudent.name}" {t('groups.title').toLowerCase()}</p>
            <div className="space-y-3">
              <select value={addStudentId} onChange={e => setAddStudentId(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                <option value="">{t('payments.student')} tanlang</option>
                {allStudents.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} — {s.phone}</option>)}
              </select>
              <button onClick={handleAddStudent} disabled={!addStudentId} className="w-full py-2.5 rounded-lg text-white font-medium disabled:opacity-50" style={{ backgroundColor: 'var(--primary-600)' }}>{t('groups.addStudent')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowTransfer(null)}>
          <div className="w-full max-w-md mx-4 rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)' }} onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{t('groups.transfer')}</h2>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>"{showTransfer.name}" {t('common.from').toLowerCase()}</p>
            <div className="space-y-3">
              <input value={transferForm.student_id} onChange={e => setTransferForm({ ...transferForm, student_id: e.target.value })} placeholder={t('payments.student') + ' ID'} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              <select value={transferForm.target_group_id} onChange={e => setTransferForm({ ...transferForm, target_group_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                <option value="">{t('groups.title')} tanlang</option>
                {groups.filter(g => g.id !== showTransfer.id).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <input value={transferForm.reason} onChange={e => setTransferForm({ ...transferForm, reason: e.target.value })} placeholder={t('payments.discount') === 'Chegirma' ? 'Sabab' : 'Reason'} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              <button onClick={handleTransfer} className="w-full py-2.5 rounded-lg text-white font-medium bg-purple-600">{t('groups.transfer')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Conflicts Modal */}
      {showConflicts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowConflicts(false)}>
          <div className="w-full max-w-lg mx-4 rounded-xl p-6 max-h-[80vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('groups.schedule')} ({conflicts.length})</h2>
              <button onClick={() => setShowConflicts(false)}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            {conflicts.length === 0 ? <p className="text-center py-4 text-green-500">{t('common.noData')}</p> : (
              <div className="space-y-3">
                {conflicts.map((c, i) => (
                  <div key={i} className="p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">{c.type === 'room' ? t('groups.room') : t('groups.teacher')}: {c.room || c.teacher}</span>
                    <div className="mt-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                      <p>{c.group_1.name} ({c.group_1.time})</p>
                      <p>{c.group_2.name} ({c.group_2.time})</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
