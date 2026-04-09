import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardCheck, faSearch, faCheck, faTimes, faClock, faShieldAlt,
  faUsers, faCalendarAlt, faChartBar, faChevronLeft, faChevronRight,
  faUserGraduate, faFilter, faSave, faHistory, faPercent, faArrowRight,
  faCheckDouble, faExclamationTriangle, faCalendarDay, faListAlt
} from '@fortawesome/free-solid-svg-icons';
import { attendanceService } from '@/services/attendance';
import api from '@/services/api';

const statusConfig = {
  present: { label: 'Keldi', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', lightBg: 'rgba(34,197,94,0.06)', icon: faCheck, emoji: '' },
  absent: { label: 'Kelmadi', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', lightBg: 'rgba(239,68,68,0.06)', icon: faTimes, emoji: '' },
  late: { label: 'Kechikdi', color: '#EAB308', bg: 'rgba(234,179,8,0.12)', lightBg: 'rgba(234,179,8,0.06)', icon: faClock, emoji: '' },
  excused: { label: 'Sababli', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', lightBg: 'rgba(59,130,246,0.06)', icon: faShieldAlt, emoji: '' },
};

const dayNames = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
const monthNames = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

export default function Attendance() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('mark');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [report, setReport] = useState(null);
  const [historyStudent, setHistoryStudent] = useState('');
  const [historyMonth, setHistoryMonth] = useState(new Date().getMonth());
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
  const [allStudents, setAllStudents] = useState([]);
  const [reportGroup, setReportGroup] = useState('');
  const [viewMode, setViewMode] = useState('calendar'); // calendar or list

  useEffect(() => {
    (async () => {
      try {
        const [g, s] = await Promise.all([api.get('/groups/'), api.get('/students/')]);
        setGroups(g.data?.data || g.data?.results || []);
        setAllStudents(s.data?.data || s.data?.results || []);
      } catch {}
    })();
  }, []);

  const loadGroupStudents = async (groupId) => {
    if (!groupId) return;
    setLoading(true);
    try {
      const res = await api.get(`/groups/${groupId}/students/`);
      const studs = res.data?.data || res.data?.results || res.data || [];
      setStudents(studs);
      try {
        const att = await attendanceService.byGroup({ group: groupId, date: selectedDate });
        const existing = att.data?.data || att.data?.results || [];
        const map = {};
        existing.forEach(a => { map[a.student] = a.status; });
        setAttendanceData(map);
      } catch {
        setAttendanceData({});
      }
    } catch { toast.error("O'quvchilarni yuklashda xato"); }
    setLoading(false);
  };

  useEffect(() => { if (selectedGroup) loadGroupStudents(selectedGroup); }, [selectedGroup, selectedDate]);

  const setStatus = (studentId, status) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: prev[studentId] === status ? undefined : status }));
  };

  const markAll = (status) => {
    const map = {};
    students.forEach(s => { map[s.id] = status; });
    setAttendanceData(map);
  };

  const handleSaveAttendance = async () => {
    const records = Object.entries(attendanceData)
      .filter(([_, status]) => status)
      .map(([student, status]) => ({ group: selectedGroup, student, date: selectedDate, status }));
    if (records.length === 0) { toast.warning("Hech qanday davomat belgilanmagan"); return; }
    setSaving(true);
    try {
      await attendanceService.bulkCreate({ records });
      toast.success(`${records.length} ta o'quvchi davomati saqlandi`);
    } catch (e) { toast.error(e.response?.data?.error?.message || "Saqlashda xato"); }
    setSaving(false);
  };

  const loadHistory = async () => {
    if (!historyStudent) return;
    setLoading(true);
    try {
      const res = await attendanceService.byStudent({ student: historyStudent });
      setHistory(res.data?.data || res.data?.results || []);
    } catch { toast.error("Xato"); }
    setLoading(false);
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (reportGroup) params.group = reportGroup;
      const res = await attendanceService.report(params);
      setReport(res.data?.data || res.data);
    } catch { toast.error("Xato"); }
    setLoading(false);
  };

  useEffect(() => { if (tab === 'report') loadReport(); }, [tab, reportGroup]);

  const tabs = [
    { key: 'mark', label: 'Davomat olish', icon: faClipboardCheck },
    { key: 'history', label: 'Tarix', icon: faHistory },
    { key: 'report', label: 'Hisobot', icon: faChartBar },
  ];

  const stats = useMemo(() => {
    const total = students.length;
    const present = Object.values(attendanceData).filter(s => s === 'present').length;
    const absent = Object.values(attendanceData).filter(s => s === 'absent').length;
    const late = Object.values(attendanceData).filter(s => s === 'late').length;
    const excused = Object.values(attendanceData).filter(s => s === 'excused').length;
    const marked = present + absent + late + excused;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, absent, late, excused, marked, rate };
  }, [students, attendanceData]);

  // Calendar data for history - faqat dars bo'lgan kunlar
  const historyByMonth = useMemo(() => {
    return history
      .filter(h => {
        const d = new Date(h.date);
        return d.getMonth() === historyMonth && d.getFullYear() === historyYear;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [history, historyMonth, historyYear]);

  const selectedGroupObj = groups.find(g => String(g.id) === String(selectedGroup));
  const selectedDateObj = new Date(selectedDate);
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Davomat nazorati</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>O'quvchilar davomatini qayd eting va kuzating</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1.5 rounded-2xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${tab === tb.key ? 'shadow-sm' : ''}`}
            style={{ backgroundColor: tab === tb.key ? 'var(--bg-secondary)' : 'transparent', color: tab === tb.key ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            <FontAwesomeIcon icon={tb.icon} className="w-4 h-4" /> {tb.label}
          </button>
        ))}
      </div>

      {/* === MARK TAB === */}
      {tab === 'mark' && (
        <>
          {/* Group & Date Selection */}
          <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Guruh</label>
                <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border bg-transparent text-sm font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                  <option value="">Guruhni tanlang...</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.students_count || 0} ta)</option>
                  ))}
                </select>
              </div>
              <div className="sm:w-56">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Sana</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() - 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }} className="w-10 h-12 rounded-xl border flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                    <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                  </button>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                    className="flex-1 h-12 px-3 rounded-xl border bg-transparent text-sm font-medium text-center" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                  <button onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() + 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }} className="w-10 h-12 rounded-xl border flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                    <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick info */}
            {selectedGroupObj && (
              <div className="flex items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUsers} className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedGroupObj.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendarDay} className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {dayNames[selectedDateObj.getDay()]}, {selectedDateObj.getDate()} {monthNames[selectedDateObj.getMonth()]}
                    {isToday && <span className="ml-1 text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>Bugun</span>}
                  </span>
                </div>
              </div>
            )}
          </div>

          {selectedGroup && (
            <>
              {/* Live Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Jami', value: stats.total, color: 'var(--text-primary)', bg: 'var(--bg-secondary)', border: 'var(--border-color)' },
                  { label: 'Keldi', value: stats.present, color: '#22C55E', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.2)' },
                  { label: 'Kelmadi', value: stats.absent, color: '#EF4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)' },
                  { label: 'Kechikdi', value: stats.late, color: '#EAB308', bg: 'rgba(234,179,8,0.06)', border: 'rgba(234,179,8,0.2)' },
                  { label: 'Sababli', value: stats.excused, color: '#3B82F6', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.2)' },
                  { label: 'Davomat %', value: stats.rate + '%', color: stats.rate >= 80 ? '#22C55E' : stats.rate >= 60 ? '#EAB308' : '#EF4444', bg: stats.rate >= 80 ? 'rgba(34,197,94,0.06)' : stats.rate >= 60 ? 'rgba(234,179,8,0.06)' : 'rgba(239,68,68,0.06)', border: 'transparent' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4 text-center border transition-all" style={{ backgroundColor: s.bg, borderColor: s.border }}>
                    <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[11px] font-medium mt-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider py-2" style={{ color: 'var(--text-muted)' }}>Tez belgilash:</span>
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <button key={key} onClick={() => markAll(key)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                      <FontAwesomeIcon icon={cfg.icon} className="w-3 h-3" />
                      Barchasi {cfg.label.toLowerCase()}
                    </button>
                  ))}
                </div>
                <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  {stats.marked}/{stats.total} belgilangan
                </div>
              </div>

              {/* Student List */}
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} />
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</span>
                  </div>
                ) : students.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <FontAwesomeIcon icon={faUserGraduate} className="w-12 h-12 mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                    <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Bu guruhda o'quvchilar yo'q</div>
                  </div>
                ) : (
                  <div>
                    {students.map((s, idx) => {
                      const currentStatus = attendanceData[s.id];
                      const rowBg = currentStatus ? statusConfig[currentStatus]?.lightBg : 'transparent';
                      return (
                        <div key={s.id || idx}
                          className="flex items-center justify-between px-5 py-3.5 transition-all"
                          style={{ backgroundColor: rowBg, borderBottom: '1px solid var(--border-color)' }}>
                          <div className="flex items-center gap-4">
                            <div className="w-7 text-center">
                              <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{idx + 1}</span>
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                              style={{ backgroundColor: currentStatus ? statusConfig[currentStatus]?.bg : 'var(--bg-tertiary)', color: currentStatus ? statusConfig[currentStatus]?.color : 'var(--text-secondary)' }}>
                              {currentStatus ? (
                                <FontAwesomeIcon icon={statusConfig[currentStatus].icon} className="w-4 h-4" />
                              ) : (
                                (s.first_name?.[0] || '') + (s.last_name?.[0] || '')
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.first_name} {s.last_name}</div>
                              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {s.phone || ''}
                                {currentStatus && (
                                  <span className="ml-2 font-semibold" style={{ color: statusConfig[currentStatus]?.color }}>
                                    {statusConfig[currentStatus]?.label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {Object.entries(statusConfig).map(([key, cfg]) => {
                              const isActive = currentStatus === key;
                              return (
                                <button key={key} onClick={() => setStatus(s.id, key)}
                                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                                  style={{
                                    backgroundColor: isActive ? cfg.color : 'var(--bg-tertiary)',
                                    color: isActive ? 'white' : 'var(--text-muted)',
                                    boxShadow: isActive ? `0 3px 10px ${cfg.color}35` : 'none',
                                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                                  }}
                                  title={cfg.label}>
                                  <FontAwesomeIcon icon={cfg.icon} className="w-4 h-4" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Save Button */}
              {students.length > 0 && (
                <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{stats.marked} ta o'quvchi belgilangan</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stats.total - stats.marked} ta belgilanmagan</div>
                  </div>
                  <button onClick={handleSaveAttendance} disabled={saving || stats.marked === 0}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold text-sm shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl"
                    style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', boxShadow: '0 4px 14px rgba(34,197,94,0.35)' }}>
                    <FontAwesomeIcon icon={saving ? faClock : faSave} className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                    {saving ? 'Saqlanmoqda...' : 'Davomatni saqlash'}
                  </button>
                </div>
              )}
            </>
          )}

          {!selectedGroup && (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <FontAwesomeIcon icon={faClipboardCheck} className="w-8 h-8" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              </div>
              <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Guruhni tanlang</div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Davomat olish uchun guruhni tanlang</div>
            </div>
          )}
        </>
      )}

      {/* === HISTORY TAB === */}
      {tab === 'history' && (
        <>
          {/* Filters */}
          <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>O'quvchi</label>
                <select value={historyStudent} onChange={e => setHistoryStudent(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border bg-transparent text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                  <option value="">O'quvchini tanlang...</option>
                  {allStudents.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 items-end">
                <button onClick={loadHistory}
                  className="h-12 px-6 rounded-xl text-white font-semibold text-sm transition-all"
                  style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                  <FontAwesomeIcon icon={faSearch} className="mr-2" />Ko'rish
                </button>
              </div>
            </div>
          </div>

          {history.length > 0 && (
            <>
              {/* View Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Jami: {history.length} ta yozuv
                </div>
                <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <button onClick={() => setViewMode('calendar')}
                    className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{ backgroundColor: viewMode === 'calendar' ? 'var(--bg-secondary)' : 'transparent', color: viewMode === 'calendar' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" /> Kalendar
                  </button>
                  <button onClick={() => setViewMode('list')}
                    className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{ backgroundColor: viewMode === 'list' ? 'var(--bg-secondary)' : 'transparent', color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    <FontAwesomeIcon icon={faListAlt} className="mr-1" /> Ro'yxat
                  </button>
                </div>
              </div>

              {/* Calendar View */}
              {viewMode === 'calendar' && (
                <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-5">
                    <button onClick={() => {
                      if (historyMonth === 0) { setHistoryMonth(11); setHistoryYear(historyYear - 1); }
                      else setHistoryMonth(historyMonth - 1);
                    }} className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                    </button>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      {monthNames[historyMonth]} {historyYear}
                    </h3>
                    <button onClick={() => {
                      if (historyMonth === 11) { setHistoryMonth(0); setHistoryYear(historyYear + 1); }
                      else setHistoryMonth(historyMonth + 1);
                    }} className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                    </button>
                  </div>

                  {/* Dars bo'lgan kunlar ro'yxati */}
                  {historyByMonth.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {historyByMonth.map((h, i) => {
                        const d = new Date(h.date);
                        const cfg = statusConfig[h.status];
                        return (
                          <div key={i} className="rounded-xl p-3 text-center transition-all"
                            style={{ backgroundColor: cfg?.bg || 'var(--bg-tertiary)' }}>
                            <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                              {dayNames[d.getDay()]}
                            </div>
                            <div className="text-lg font-bold" style={{ color: cfg?.color || 'var(--text-primary)' }}>
                              {d.getDate()}
                            </div>
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <FontAwesomeIcon icon={cfg?.icon || faCheck} className="w-3 h-3" style={{ color: cfg?.color }} />
                              <span className="text-[10px] font-semibold" style={{ color: cfg?.color }}>{cfg?.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Bu oyda davomat yozuvlari yo'q</div>
                    </div>
                  )}

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                      <div key={key} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: cfg.color }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{cfg.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        {['Sana', 'Guruh', 'Holat', 'Izoh'].map(h => (
                          <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(h => (
                        <tr key={h.id} className="border-b hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon={faCalendarAlt} className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{h.date}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{h.group_name || h.group}</td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                              style={{ color: statusConfig[h.status]?.color, backgroundColor: statusConfig[h.status]?.bg }}>
                              <FontAwesomeIcon icon={statusConfig[h.status]?.icon} className="w-3 h-3" />
                              {statusConfig[h.status]?.label || h.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>{h.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Stats Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(statusConfig).map(([key, cfg]) => {
                  const count = history.filter(h => h.status === key).length;
                  const percent = history.length > 0 ? Math.round((count / history.length) * 100) : 0;
                  return (
                    <div key={key} className="rounded-xl p-4 border" style={{ borderColor: cfg.color + '20', backgroundColor: cfg.lightBg }}>
                      <div className="flex items-center justify-between mb-2">
                        <FontAwesomeIcon icon={cfg.icon} className="w-4 h-4" style={{ color: cfg.color }} />
                        <span className="text-xs font-bold" style={{ color: cfg.color }}>{percent}%</span>
                      </div>
                      <div className="text-xl font-bold" style={{ color: cfg.color }}>{count}</div>
                      <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{cfg.label}</div>
                      <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: cfg.color + '20' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: cfg.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {history.length === 0 && historyStudent && !loading && (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <FontAwesomeIcon icon={faHistory} className="w-12 h-12 mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
              <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Davomat tarixi topilmadi</div>
            </div>
          )}
        </>
      )}

      {/* === REPORT TAB === */}
      {tab === 'report' && (
        <>
          {/* Group Filter */}
          <div className="flex gap-3">
            <select value={reportGroup} onChange={e => setReportGroup(e.target.value)}
              className="h-11 px-4 rounded-xl border bg-transparent text-sm flex-1 sm:flex-none sm:w-64" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">Barcha guruhlar</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Hisobot yuklanmoqda...</span>
              </div>
            ) : report ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Jami darslar', value: report.total_sessions || 0, color: 'var(--text-primary)', icon: faCalendarAlt },
                    { label: "O'rtacha davomat", value: (report.average_attendance_rate || 0) + '%', color: (report.average_attendance_rate || 0) >= 80 ? '#22C55E' : '#EAB308', icon: faPercent },
                    { label: 'Eng yaxshi', value: report.best_group || '—', color: '#22C55E', icon: faCheck },
                    { label: 'Eng past', value: report.worst_group || '—', color: '#EF4444', icon: faExclamationTriangle },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-5 text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <FontAwesomeIcon icon={s.icon} className="w-5 h-5 mb-2" style={{ color: s.color, opacity: 0.7 }} />
                      <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-[11px] font-medium mt-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Group Breakdown */}
                {report.by_group && Array.isArray(report.by_group) && report.by_group.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Guruhlar bo'yicha</h4>
                    <div className="space-y-3">
                      {report.by_group.map((g, i) => {
                        const rate = g.attendance_rate || 0;
                        const rateColor = rate >= 80 ? '#22C55E' : rate >= 60 ? '#EAB308' : '#EF4444';
                        const rateLabel = rate >= 80 ? "A'lo" : rate >= 60 ? 'Yaxshi' : rate >= 40 ? "Qoniqarli" : 'Yomon';
                        return (
                          <div key={i} className="flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold" style={{ backgroundColor: rateColor + '15', color: rateColor }}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{g.group_name || g.group}</div>
                              <div className="mt-1.5 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, backgroundColor: rateColor }} />
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold" style={{ color: rateColor }}>{rate}%</div>
                              <div className="text-[10px] font-semibold" style={{ color: rateColor }}>{rateLabel}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <FontAwesomeIcon icon={faChartBar} className="w-12 h-12 mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Hisobot mavjud emas</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
