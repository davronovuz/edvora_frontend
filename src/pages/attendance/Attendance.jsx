import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { notify } from '@/lib/notify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardCheck, faSearch, faCheck, faTimes, faClock, faShieldAlt,
  faUsers, faCalendarAlt, faChartBar, faChevronLeft, faChevronRight,
  faUserGraduate, faSave, faHistory, faPercent,
  faCheckDouble, faExclamationTriangle, faCalendarDay, faListAlt,
} from '@fortawesome/free-solid-svg-icons';
import { attendanceService } from '@/services/attendance';
import { groupsService } from '@/services/groups';
import { studentsService } from '@/services/students';
import { unwrapList } from '@/services/api';
import { useGroupsList } from '@/hooks/queries/useGroups';
import { useUrlState } from '@/hooks/useUrlState';

const statusConfig = {
  present: { label: 'Keldi', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', lightBg: 'rgba(34,197,94,0.06)', icon: faCheck },
  absent:  { label: 'Kelmadi', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', lightBg: 'rgba(239,68,68,0.06)', icon: faTimes },
  late:    { label: 'Kechikdi', color: '#EAB308', bg: 'rgba(234,179,8,0.12)', lightBg: 'rgba(234,179,8,0.06)', icon: faClock },
  excused: { label: 'Sababli', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', lightBg: 'rgba(59,130,246,0.06)', icon: faShieldAlt },
};

const dayNames = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
const monthNames = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

const todayStr = new Date().toISOString().split('T')[0];
const MARK_DEFAULTS = { group: '', date: todayStr };

export default function Attendance() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('mark');

  // ── MARK TAB ──────────────────────────────────────────────────────────────
  const [markState, setMarkState] = useUrlState(MARK_DEFAULTS);
  const selectedGroup = markState.group;
  const selectedDate  = markState.date;

  const { data: groupsData, isLoading: groupsLoading } = useGroupsList({ page_size: 200, status: 'active' });
  const groups = groupsData?.items ?? [];

  // JS getDay(): 0=Sun,1=Mon…6=Sat → backend: 0=Mon…6=Sun
  const todayDow = useMemo(() => {
    const d = new Date();
    return d.getDay() === 0 ? 6 : d.getDay() - 1;
  }, []);

  const todayGroups = useMemo(() =>
    groups.filter(g => {
      const days = g.schedule?.days ?? g.days ?? [];
      return Array.isArray(days) && days.includes(todayDow);
    }),
  [groups, todayDow]);

  // Today's groups first (with status dot), rest after
  const chipGroups = useMemo(() => {
    const todayIds = new Set(todayGroups.map(g => g.id));
    return [...todayGroups, ...groups.filter(g => !todayIds.has(g.id))];
  }, [todayGroups, groups]);

  const [students, setStudents]           = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saveStatus, setSaveStatus]         = useState('idle'); // idle | saving | saved | error
  const [savedGroups, setSavedGroups]       = useState(new Set());

  const isDirtyRef    = useRef(false);
  const saveTimerRef  = useRef(null);
  const autoSelectedRef = useRef(false);

  // Auto-select first today group when chips load
  useEffect(() => {
    if (autoSelectedRef.current || selectedGroup || todayGroups.length === 0) return;
    autoSelectedRef.current = true;
    setMarkState({ group: String(todayGroups[0].id) });
  }, [todayGroups, selectedGroup, setMarkState]);

  // Load students + existing attendance when group/date changes
  useEffect(() => {
    if (!selectedGroup) { setStudents([]); setAttendanceData({}); return; }
    isDirtyRef.current = false;
    setSaveStatus('idle');
    setLoadingStudents(true);
    Promise.all([
      groupsService.getStudents(selectedGroup),
      attendanceService.byGroup({ group: selectedGroup, date: selectedDate }).catch(() => null),
    ])
      .then(([studRes, attRes]) => {
        setStudents(unwrapList(studRes));
        if (attRes) {
          const existing = unwrapList(attRes);
          const map = {};
          existing.forEach(a => { if (a.status) map[a.student] = a.status; });
          setAttendanceData(map);
        } else {
          setAttendanceData({});
        }
      })
      .catch(() => notify.error("O'quvchilarni yuklashda xato"))
      .finally(() => setLoadingStudents(false));
  }, [selectedGroup, selectedDate]);

  const doSave = useCallback(async () => {
    if (!selectedGroup || !isDirtyRef.current) return;
    const attendances = Object.entries(attendanceData)
      .filter(([, st]) => st)
      .map(([studentId, status]) => ({ student_id: Number(studentId), status, note: '' }));
    if (!attendances.length) return;
    setSaveStatus('saving');
    try {
      await attendanceService.bulkCreate({
        group_id: Number(selectedGroup),
        date: selectedDate,
        attendances,
      });
      isDirtyRef.current = false;
      setSaveStatus('saved');
      setSavedGroups(prev => new Set([...prev, selectedGroup]));
      setTimeout(() => setSaveStatus(s => s === 'saved' ? 'idle' : s), 3000);
    } catch (e) {
      setSaveStatus('error');
      notify.error(e);
    }
  }, [selectedGroup, selectedDate, attendanceData]);

  // 3-second auto-save debounce
  useEffect(() => {
    if (!isDirtyRef.current || !selectedGroup) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(doSave, 3000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [attendanceData, doSave, selectedGroup]);

  const setStatus = (studentId, status) => {
    isDirtyRef.current = true;
    setSaveStatus('idle');
    setAttendanceData(prev => ({ ...prev, [studentId]: prev[studentId] === status ? undefined : status }));
  };

  const markAll = (status) => {
    isDirtyRef.current = true;
    setSaveStatus('idle');
    const map = {};
    students.forEach(s => { map[s.id] = status; });
    setAttendanceData(map);
  };

  const shiftDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setMarkState({ date: d.toISOString().split('T')[0] });
  };

  const stats = useMemo(() => {
    const total    = students.length;
    const present  = Object.values(attendanceData).filter(s => s === 'present').length;
    const absent   = Object.values(attendanceData).filter(s => s === 'absent').length;
    const late     = Object.values(attendanceData).filter(s => s === 'late').length;
    const excused  = Object.values(attendanceData).filter(s => s === 'excused').length;
    const marked   = present + absent + late + excused;
    const progress = total > 0 ? Math.round((marked / total) * 100) : 0;
    const rate     = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, absent, late, excused, marked, rate, progress };
  }, [students, attendanceData]);

  const selectedGroupObj = groups.find(g => String(g.id) === String(selectedGroup));
  const selectedDateObj  = new Date(selectedDate);
  const isToday          = selectedDate === todayStr;

  // ── HISTORY / REPORT STATE (unchanged logic) ─────────────────────────────
  const [history, setHistory]           = useState([]);
  const [report, setReport]             = useState(null);
  const [historyStudent, setHistoryStudent] = useState('');
  const [historyMonth, setHistoryMonth]   = useState(new Date().getMonth());
  const [historyYear, setHistoryYear]     = useState(new Date().getFullYear());
  const [allStudents, setAllStudents]     = useState([]);
  const [reportGroup, setReportGroup]     = useState('');
  const [viewMode, setViewMode]           = useState('calendar');
  const [loading, setLoading]             = useState(false);

  useEffect(() => {
    studentsService.getAll({ page_size: 500, status: 'active' })
      .then(s => setAllStudents(unwrapList(s)))
      .catch(() => {});
  }, []);

  const loadHistory = async () => {
    if (!historyStudent) return;
    setLoading(true);
    try {
      const res = await attendanceService.byStudent({ student: historyStudent });
      setHistory(res.data?.data || res.data?.results || []);
    } catch { notify.error("Xato"); }
    setLoading(false);
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (reportGroup) params.group = reportGroup;
      const res = await attendanceService.report(params);
      setReport(res.data?.data || res.data);
    } catch { notify.error("Xato"); }
    setLoading(false);
  };

  useEffect(() => { if (tab === 'report') loadReport(); }, [tab, reportGroup]);

  const historyByMonth = useMemo(() =>
    history
      .filter(h => {
        const d = new Date(h.date);
        return d.getMonth() === historyMonth && d.getFullYear() === historyYear;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
  [history, historyMonth, historyYear]);

  const tabs = [
    { key: 'mark',    label: 'Davomat olish', icon: faClipboardCheck },
    { key: 'history', label: 'Tarix',         icon: faHistory },
    { key: 'report',  label: 'Hisobot',       icon: faChartBar },
  ];

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

      {/* ═══════════════════ MARK TAB ═══════════════════ */}
      {tab === 'mark' && (
        <>
          {/* Group chips */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
            {groupsLoading ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5 animate-spin" />
                Guruhlar yuklanmoqda...
              </div>
            ) : chipGroups.map(g => {
              const isActive   = String(g.id) === String(selectedGroup);
              const isSaved    = savedGroups.has(String(g.id));
              const isOnToday  = todayGroups.some(tg => tg.id === g.id);
              return (
                <button
                  key={g.id}
                  onClick={() => setMarkState({ group: String(g.id) })}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: isActive ? 'var(--primary-600)' : 'var(--bg-secondary)',
                    color: isActive ? 'white' : 'var(--text-primary)',
                    border: `1.5px solid ${isActive ? 'var(--primary-600)' : 'var(--border-color)'}`,
                    boxShadow: isActive ? '0 2px 8px rgba(var(--primary-rgb, 99,102,241),0.3)' : 'none',
                  }}>
                  {g.name}
                  {isOnToday && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: isSaved ? '#22C55E' : '#EF4444' }}
                      title={isSaved ? "Davomat olindi" : "Davomat olinmagan"}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Date navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => shiftDate(-1)}
              className="w-10 h-10 rounded-xl border flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex-shrink-0"
              style={{ borderColor: 'var(--border-color)' }}>
              <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setMarkState({ date: e.target.value })}
              className="h-10 px-3 rounded-xl border bg-transparent text-sm font-medium text-center flex-1 max-w-[180px]"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
            {isToday ? (
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
                Bugun
              </span>
            ) : (
              <button
                onClick={() => setMarkState({ date: todayStr })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 flex-shrink-0"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                Bugun
              </button>
            )}
            <div className="text-sm font-medium flex-1" style={{ color: 'var(--text-secondary)' }}>
              {dayNames[selectedDateObj.getDay()]}, {selectedDateObj.getDate()} {monthNames[selectedDateObj.getMonth()]} {selectedDateObj.getFullYear()}
            </div>
            <button
              onClick={() => shiftDate(1)}
              className="w-10 h-10 rounded-xl border flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex-shrink-0"
              style={{ borderColor: 'var(--border-color)' }}>
              <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>

          {selectedGroup ? (
            <>
              {/* Live stats bar */}
              <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                {/* Progress track */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {stats.marked}/{stats.total}
                  </span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${stats.progress}%`, background: 'linear-gradient(90deg, #22C55E, #16A34A)' }}
                    />
                  </div>
                  <span className="text-xs font-bold" style={{ color: stats.rate >= 80 ? '#22C55E' : stats.rate >= 60 ? '#EAB308' : '#EF4444' }}>
                    {stats.rate}% davomat
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Keldi',    value: stats.present, color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
                    { label: 'Kelmadi', value: stats.absent,  color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
                    { label: 'Kechikdi',value: stats.late,    color: '#EAB308', bg: 'rgba(234,179,8,0.08)' },
                    { label: 'Sababli', value: stats.excused, color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl py-3 text-center" style={{ backgroundColor: s.bg }}>
                      <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => markAll('present')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: 'white', boxShadow: '0 3px 10px rgba(34,197,94,0.3)' }}>
                  <FontAwesomeIcon icon={faCheckDouble} className="w-4 h-4" />
                  Hammasi keldi
                </button>
                <div className="h-6 w-px" style={{ backgroundColor: 'var(--border-color)' }} />
                {Object.entries(statusConfig).filter(([k]) => k !== 'present').map(([key, cfg]) => (
                  <button key={key} onClick={() => markAll(key)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                    <FontAwesomeIcon icon={cfg.icon} className="w-3 h-3" />
                    Barchasi {cfg.label.toLowerCase()}
                  </button>
                ))}
                <div className="ml-auto text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  {stats.marked}/{stats.total} belgilangan
                </div>
              </div>

              {/* Student list */}
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                {loadingStudents ? (
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
                        <div
                          key={s.id ?? idx}
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
                              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {s.first_name} {s.last_name}
                              </div>
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
                                <button
                                  key={key}
                                  onClick={() => setStatus(s.id, key)}
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

              {/* Sticky save bar */}
              {students.length > 0 && (
                <div
                  className="sticky bottom-4 rounded-2xl border px-5 py-4 flex items-center justify-between gap-4 shadow-lg"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', backdropFilter: 'blur(12px)' }}>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {stats.marked} ta o'quvchi belgilangan
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {stats.total - stats.marked} ta belgilanmagan
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {saveStatus === 'saving' && (
                      <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5 animate-spin" />
                        Saqlanmoqda...
                      </span>
                    )}
                    {saveStatus === 'saved' && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#22C55E' }}>
                        <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
                        Saqlandi!
                      </span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#EF4444' }}>
                        <FontAwesomeIcon icon={faTimes} className="w-3.5 h-3.5" />
                        Xato yuz berdi
                      </span>
                    )}
                    <button
                      onClick={doSave}
                      disabled={saveStatus === 'saving' || stats.marked === 0}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl"
                      style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', boxShadow: '0 4px 14px rgba(34,197,94,0.35)' }}>
                      <FontAwesomeIcon icon={faSave} className="w-4 h-4" />
                      Saqlash
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <FontAwesomeIcon icon={faClipboardCheck} className="w-8 h-8" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              </div>
              <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Guruhni tanlang</div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Yuqoridagi guruhlardan birini tanlang</div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════ HISTORY TAB ═══════════════════ */}
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

      {/* ═══════════════════ REPORT TAB ═══════════════════ */}
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
                    { label: 'Jami darslar',      value: report.total_sessions || 0,                                                              color: 'var(--text-primary)', icon: faCalendarAlt },
                    { label: "O'rtacha davomat",   value: (report.average_attendance_rate || 0) + '%',                                             color: (report.average_attendance_rate || 0) >= 80 ? '#22C55E' : '#EAB308', icon: faPercent },
                    { label: 'Eng yaxshi',         value: report.best_group || '—',                                                                color: '#22C55E', icon: faCheck },
                    { label: 'Eng past',           value: report.worst_group || '—',                                                               color: '#EF4444', icon: faExclamationTriangle },
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
