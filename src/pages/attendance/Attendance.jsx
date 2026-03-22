import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardCheck, faSearch, faCheck, faTimes, faClock, faShieldAlt,
  faUsers, faCalendarAlt, faChartBar, faChevronLeft, faChevronRight,
  faUserGraduate, faFilter
} from '@fortawesome/free-solid-svg-icons';
import { attendanceService } from '@/services/attendance';
import api from '@/services/api';

const statusConfig = {
  present: { label: 'Keldi', color: '#22C55E', bg: 'rgba(34,197,94,0.15)', icon: faCheck },
  absent: { label: 'Kelmadi', color: '#EF4444', bg: 'rgba(239,68,68,0.15)', icon: faTimes },
  late: { label: 'Kechikdi', color: '#EAB308', bg: 'rgba(234,179,8,0.15)', icon: faClock },
  excused: { label: 'Sababli', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', icon: faShieldAlt },
};

export default function Attendance() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('mark');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [report, setReport] = useState(null);
  const [historyStudent, setHistoryStudent] = useState('');
  const [allStudents, setAllStudents] = useState([]);

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
      // Load existing attendance for this date
      try {
        const att = await attendanceService.byGroup(groupId, { date: selectedDate });
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

  const handleSaveAttendance = async () => {
    const records = Object.entries(attendanceData)
      .filter(([_, status]) => status)
      .map(([student, status]) => ({ group: selectedGroup, student, date: selectedDate, status }));
    if (records.length === 0) { toast.warning("Hech qanday davomat belgilanmagan"); return; }
    try {
      await attendanceService.bulkCreate({ records });
      toast.success(`${records.length} ta davomat saqlandi`);
    } catch (e) { toast.error(e.response?.data?.error?.message || "Xato"); }
  };

  const loadHistory = async () => {
    if (!historyStudent) return;
    setLoading(true);
    try {
      const res = await attendanceService.byStudent(historyStudent);
      setHistory(res.data?.data || res.data?.results || []);
    } catch { toast.error("Xato"); }
    setLoading(false);
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedGroup) params.group = selectedGroup;
      const res = await attendanceService.report(params);
      setReport(res.data?.data || res.data);
    } catch { toast.error("Xato"); }
    setLoading(false);
  };

  useEffect(() => { if (tab === 'report') loadReport(); }, [tab]);

  const tabs = [
    { key: 'mark', label: 'Davomat olish', icon: faClipboardCheck },
    { key: 'history', label: 'Tarix', icon: faCalendarAlt },
    { key: 'report', label: 'Hisobot', icon: faChartBar },
  ];

  const getStats = () => {
    const total = students.length;
    const present = Object.values(attendanceData).filter(s => s === 'present').length;
    const absent = Object.values(attendanceData).filter(s => s === 'absent').length;
    const late = Object.values(attendanceData).filter(s => s === 'late').length;
    const excused = Object.values(attendanceData).filter(s => s === 'excused').length;
    return { total, present, absent, late, excused, marked: present + absent + late + excused };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('attendance.title')}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>O'quvchilar davomatini qayd eting va kuzating</p>
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

      {tab === 'mark' && (
        <>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="h-11 px-4 rounded-xl border bg-transparent flex-1" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">Guruhni tanlang</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>

          {selectedGroup && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Jami', value: stats.total, color: 'var(--text-primary)', bg: 'var(--bg-secondary)' },
                  { label: 'Keldi', value: stats.present, color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
                  { label: 'Kelmadi', value: stats.absent, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
                  { label: 'Kechikdi', value: stats.late, color: '#EAB308', bg: 'rgba(234,179,8,0.1)' },
                  { label: 'Sababli', value: stats.excused, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: s.bg }}>
                    <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Student List */}
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                {loading ? (
                  <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} /></div>
                ) : students.length === 0 ? (
                  <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>Bu guruhda o'quvchilar yo'q</div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                    {students.map((s, idx) => (
                      <div key={s.id || idx} className="flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                            {(s.first_name?.[0] || '') + (s.last_name?.[0] || '')}
                          </div>
                          <div>
                            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.first_name} {s.last_name}</div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.phone || ''}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {Object.entries(statusConfig).map(([key, cfg]) => (
                            <button key={key} onClick={() => setStatus(s.id, key)}
                              className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                              style={{
                                backgroundColor: attendanceData[s.id] === key ? cfg.bg : 'transparent',
                                color: attendanceData[s.id] === key ? cfg.color : 'var(--text-muted)',
                                border: `2px solid ${attendanceData[s.id] === key ? cfg.color : 'var(--border-color)'}`,
                              }}
                              title={cfg.label}>
                              <FontAwesomeIcon icon={cfg.icon} className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {students.length > 0 && (
                <div className="flex justify-end">
                  <button onClick={handleSaveAttendance} className="px-6 py-3 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>
                    <FontAwesomeIcon icon={faCheck} className="mr-2" /> Davomatni saqlash ({stats.marked}/{stats.total})
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === 'history' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <select value={historyStudent} onChange={e => setHistoryStudent(e.target.value)} className="h-11 px-4 rounded-xl border bg-transparent flex-1" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">O'quvchini tanlang</option>
              {allStudents.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
            <button onClick={loadHistory} className="h-11 px-6 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>Ko'rish</button>
          </div>

          {history.length > 0 && (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <table className="w-full">
                <thead><tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                  {['Sana', 'Guruh', 'Holat', 'Izoh'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id} className="border-b hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: 'var(--border-color)' }}>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>{h.date}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{h.group_name || h.group}</td>
                      <td className="px-4 py-3">
                        <span style={{ color: statusConfig[h.status]?.color, backgroundColor: statusConfig[h.status]?.bg, padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>
                          {statusConfig[h.status]?.label || h.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{h.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'report' && (
        <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} /></div>
          ) : report ? (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Davomat hisoboti</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Jami darslar', value: report.total_sessions || 0 },
                  { label: "O'rtacha davomat", value: (report.average_attendance_rate || 0) + '%' },
                  { label: 'Eng yaxshi guruh', value: report.best_group || '—' },
                  { label: 'Eng past guruh', value: report.worst_group || '—' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {report.by_group && Array.isArray(report.by_group) && (
                <div>
                  <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Guruhlar bo'yicha</h4>
                  {report.by_group.map((g, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{g.group_name || g.group}</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--primary-600)' }}>{g.attendance_rate || 0}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>Hisobot mavjud emas</div>
          )}
        </div>
      )}
    </div>
  );
}