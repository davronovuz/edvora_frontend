import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faCheck, faTimes, faClock, faShieldAlt,
  faChevronLeft, faChevronRight, faUsers, faCalendarAlt,
  faMoneyBill, faBook, faComment, faUserPlus, faPhone,
  faCircle, faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { groupsService } from '@/services/groups';
import { attendanceService } from '@/services/attendance';
import api from '@/services/api';

const statusColors = {
  present: '#22C55E',
  absent: '#EF4444',
  late: '#EAB308',
  excused: '#3B82F6',
};

const statusIcons = {
  present: faCheck,
  absent: faTimes,
  late: faClock,
  excused: faShieldAlt,
};

const dayNamesShort = ['Ya', 'Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha'];
const dayNamesFull = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [group, setGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');

  // Attendance state
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [attendanceMap, setAttendanceMap] = useState({}); // { "studentId-day": status }
  const [saving, setSaving] = useState(false);

  // Add student
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [addStudentId, setAddStudentId] = useState('');

  useEffect(() => {
    fetchGroup();
  }, [id]);

  useEffect(() => {
    if (group) fetchAttendance();
  }, [currentMonth, group]);

  const fetchGroup = async () => {
    setLoading(true);
    try {
      const [groupRes, studentsRes] = await Promise.all([
        groupsService.getById(id),
        groupsService.getStudents(id),
      ]);
      setGroup(groupRes.data?.data || groupRes.data);
      const studs = studentsRes.data?.data || studentsRes.data?.results || studentsRes.data || [];
      setStudents(studs);
    } catch {
      toast.error("Guruh topilmadi");
      navigate('/app/groups');
    }
    setLoading(false);
  };

  const fetchAttendance = async () => {
    try {
      const [year, month] = currentMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();

      const res = await api.get('/attendance/', {
        params: {
          group: id,
          date_from: `${year}-${String(month).padStart(2, '0')}-01`,
          date_to: `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`,
          page_size: 1000,
        }
      });
      const data = res.data?.data || res.data?.results || [];

      const map = {};
      data.forEach(a => {
        const day = new Date(a.date).getDate();
        const key = `${a.student}-${day}`;
        map[key] = a.status;
      });
      setAttendanceMap(map);
    } catch {
      setAttendanceMap({});
    }
  };

  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const allDaysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  // Faqat dars bo'ladigan kunlarni ko'rsatish
  const daysArray = allDaysArray.filter(day => {
    if (!group?.days || group.days.length === 0) return true; // agar kunlar belgilanmagan bo'lsa hammasini ko'rsat
    const d = new Date(year, month - 1, day);
    const weekday = d.getDay() === 0 ? 6 : d.getDay() - 1; // Mon=0
    return group.days.includes(weekday);
  });

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const nextMonth = () => {
    const d = new Date(year, month, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const getDayName = (day) => {
    const d = new Date(year, month - 1, day);
    return dayNamesShort[d.getDay()];
  };

  const getDayNameFull = (day) => {
    const d = new Date(year, month - 1, day);
    return dayNamesFull[d.getDay()];
  };

  const isWeekend = (day) => {
    const d = new Date(year, month - 1, day);
    return d.getDay() === 0;
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() + 1 === month && today.getFullYear() === year;
  };

  const isGroupDay = (day) => {
    if (!group?.days) return false;
    const d = new Date(year, month - 1, day);
    const weekday = d.getDay() === 0 ? 6 : d.getDay() - 1; // Convert to Mon=0
    return group.days.includes(weekday);
  };

  // Cycle attendance status on click
  const cycleStatus = (studentId, day) => {
    const key = `${studentId}-${day}`;
    const current = attendanceMap[key];
    const cycle = [undefined, 'present', 'absent', 'late', 'excused'];
    const idx = cycle.indexOf(current);
    const next = cycle[(idx + 1) % cycle.length];

    setAttendanceMap(prev => {
      const newMap = { ...prev };
      if (next === undefined) delete newMap[key];
      else newMap[key] = next;
      return newMap;
    });
  };

  // Save attendance for a specific day
  const saveDay = async (day) => {
    setSaving(true);
    try {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const records = [];

      students.forEach(gs => {
        const studentId = gs.student || gs.student_id || gs.id;
        const key = `${studentId}-${day}`;
        const status = attendanceMap[key];
        if (status) {
          records.push({
            group: id,
            student: studentId,
            date: dateStr,
            status,
          });
        }
      });

      if (records.length === 0) {
        toast.warning("Hech kim belgilanmagan");
        setSaving(false);
        return;
      }

      await attendanceService.bulkCreate({ records });
      toast.success(`${day}-kun davomati saqlandi (${records.length} ta)`);
    } catch (e) {
      toast.error(e.response?.data?.error?.message || "Xatolik");
    }
    setSaving(false);
  };

  // Save all attendance for the month
  const saveAllAttendance = async () => {
    setSaving(true);
    try {
      const records = [];
      students.forEach(gs => {
        const studentId = gs.student || gs.student_id || gs.id;
        daysArray.forEach(day => {
          const key = `${studentId}-${day}`;
          const status = attendanceMap[key];
          if (status) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            records.push({ group: id, student: studentId, date: dateStr, status });
          }
        });
      });

      if (records.length === 0) {
        toast.warning("Hech narsa belgilanmagan");
        setSaving(false);
        return;
      }

      await attendanceService.bulkCreate({ records });
      toast.success(`${records.length} ta davomat saqlandi`);
      fetchAttendance();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || "Xatolik");
    }
    setSaving(false);
  };

  // Mark all students for today
  const markAllPresent = (day) => {
    setAttendanceMap(prev => {
      const newMap = { ...prev };
      students.forEach(gs => {
        const studentId = gs.student || gs.student_id || gs.id;
        const key = `${studentId}-${day}`;
        newMap[key] = 'present';
      });
      return newMap;
    });
  };

  // Add student
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
      setShowAddStudent(false);
      setAddStudentId('');
      fetchGroup();
    } catch (e) { toast.error(e.response?.data?.error?.message || 'Xato'); }
  };

  const removeStudent = async (studentId) => {
    if (!confirm("Talabani guruhdan chiqarishni tasdiqlaysizmi?")) return;
    try {
      await groupsService.removeStudent(id, studentId);
      toast.success("Talaba chiqarildi");
      fetchGroup();
    } catch { toast.error('Xato'); }
  };

  // Student stats
  const getStudentStats = (studentId) => {
    let present = 0, absent = 0, late = 0, total = 0;
    daysArray.forEach(day => {
      const key = `${studentId}-${day}`;
      const status = attendanceMap[key];
      if (status) {
        total++;
        if (status === 'present') present++;
        else if (status === 'absent') absent++;
        else if (status === 'late') late++;
      }
    });
    return { present, absent, late, total };
  };

  const monthName = new Date(year, month - 1).toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' });

  const groupDays = group?.days_display || group?.days?.map(d => ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'][d]).join(', ') || '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/app/groups')} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
          <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {group.name} · {group.course_name} · {group.teacher_name}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {groupDays} | {group.start_time?.slice(0,5)} - {group.end_time?.slice(0,5)}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* LEFT SIDE — Group Info + Students */}
        <div className="lg:w-72 flex-shrink-0 space-y-4">
          {/* Group Info Card */}
          <div className="card p-4 space-y-3">
            <div className="text-xs space-y-2" style={{ color: 'var(--text-secondary)' }}>
              <div className="flex justify-between">
                <span>Kurs:</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{group.course_name}</span>
              </div>
              <div className="flex justify-between">
                <span>O'qituvchi:</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{group.teacher_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span>Xona:</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{group.room_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span>Kunlar:</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{groupDays}</span>
              </div>
              <div className="flex justify-between">
                <span>Vaqt:</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{group.start_time?.slice(0,5)} - {group.end_time?.slice(0,5)}</span>
              </div>
              <div className="flex justify-between">
                <span>Boshlanish:</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{group.start_date}</span>
              </div>
              {group.end_date && (
                <div className="flex justify-between">
                  <span>Tugash:</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{group.end_date}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Narx:</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{Number(group.price || 0).toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between">
                <span>Max talabalar:</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{group.max_students}</span>
              </div>
            </div>
          </div>

          {/* Students List */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                <FontAwesomeIcon icon={faUsers} className="mr-2 text-primary-600" />
                Talabalar ({students.length})
              </span>
              <button onClick={openAddStudent} className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600" title="Talaba qo'shish">
                <FontAwesomeIcon icon={faUserPlus} className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {students.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>Talabalar yo'q</p>
              ) : students.map((gs, i) => {
                const name = gs.student_name || `${gs.first_name || ''} ${gs.last_name || ''}`.trim();
                const studentId = gs.student || gs.student_id || gs.id;
                const isActive = gs.is_active !== false && gs.status !== 'inactive' && gs.status !== 'left';
                const isLeft = gs.status === 'left' || gs.status === 'inactive' || gs.is_active === false;
                const isPaid = gs.payment_status === 'paid' || gs.is_paid === true;
                const isPartial = gs.payment_status === 'partial';

                // Rang: to'lagan=yashil, qisman=sariq, to'lamagan=qizil bg, ketgan=kulrang
                const bgColor = isLeft ? 'rgba(148,163,184,0.1)' : isPaid ? 'rgba(34,197,94,0.08)' : isPartial ? 'rgba(234,179,8,0.08)' : 'rgba(239,68,68,0.06)';
                const borderLeft = isLeft ? '3px solid #94A3B8' : isPaid ? '3px solid #22C55E' : isPartial ? '3px solid #EAB308' : '3px solid #EF4444';

                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 py-1.5 px-2 rounded-lg group transition-colors ${isLeft ? 'opacity-50' : ''}`}
                    style={{ backgroundColor: bgColor, borderLeft }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = bgColor}
                  >
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-medium truncate block ${isLeft ? 'line-through' : ''}`} style={{ color: 'var(--text-primary)' }}>
                        {i + 1}. {name}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        {gs.student_phone && (
                          <span className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                            <FontAwesomeIcon icon={faPhone} className="w-2 h-2 mr-0.5" />{gs.student_phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isLeft ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(148,163,184,0.2)', color: '#94A3B8' }}>Chiqdi</span>
                      ) : isPaid ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>To'ladi</span>
                      ) : isPartial ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(234,179,8,0.15)', color: '#EAB308' }}>Qisman</span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>To'lamagan</span>
                      )}
                      <button onClick={() => removeStudent(studentId)} className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-opacity">
                        <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE — Tabs + Content */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="card overflow-hidden">
            <div className="flex border-b overflow-x-auto" style={{ borderColor: 'var(--border-color)' }}>
              {[
                { key: 'attendance', label: 'Davomat', icon: faCalendarAlt },
                { key: 'finance', label: 'Moliyaviy', icon: faMoneyBill },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent'
                  }`}
                  style={activeTab !== tab.key ? { color: 'var(--text-secondary)' } : {}}
                >
                  <FontAwesomeIcon icon={tab.icon} className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === 'attendance' && (
                <div>
                  {/* Month selector */}
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                        <FontAwesomeIcon icon={faChevronLeft} className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                      </button>
                      <input type="month" value={currentMonth} onChange={e => setCurrentMonth(e.target.value)}
                        className="h-9 px-3 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                      <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                        <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                      </button>
                      <span className="text-sm font-medium capitalize ml-2" style={{ color: 'var(--text-primary)' }}>{monthName}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { const today = new Date().getDate(); markAllPresent(today); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200"
                      >
                        <FontAwesomeIcon icon={faCheck} className="mr-1" /> Bugun hammasini belgilash
                      </button>
                      <button onClick={saveAllAttendance} disabled={saving}
                        className="px-4 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                        style={{ backgroundColor: 'var(--primary-600)' }}>
                        {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                      </button>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex gap-4 mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span><span className="inline-block w-4 h-4 rounded align-middle mr-1" style={{ backgroundColor: '#22C55E' }} /> Keldi</span>
                    <span><span className="inline-block w-4 h-4 rounded align-middle mr-1" style={{ backgroundColor: '#EF4444' }} /> Kelmadi</span>
                    <span><span className="inline-block w-4 h-4 rounded align-middle mr-1" style={{ backgroundColor: '#EAB308' }} /> Kechikdi</span>
                    <span><span className="inline-block w-4 h-4 rounded align-middle mr-1" style={{ backgroundColor: '#3B82F6' }} /> Sababli</span>
                    <span className="ml-2 italic">Katakni bosing statusni o'zgartirish uchun</span>
                  </div>

                  {/* Attendance Grid */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr>
                          <th className="sticky left-0 z-10 px-2 py-2 text-left font-medium border-b" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-muted)', minWidth: '130px' }}>
                            Talaba
                          </th>
                          {daysArray.map(day => (
                            <th
                              key={day}
                              className={`px-0.5 py-1 text-center font-medium border-b cursor-pointer ${isToday(day) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                              style={{ borderColor: 'var(--border-color)', color: isToday(day) ? '#F97316' : 'var(--text-primary)', minWidth: '36px' }}
                              onClick={() => markAllPresent(day)}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                              onMouseLeave={(e) => { if (!isToday(day)) e.currentTarget.style.backgroundColor = ''; }}
                              title={`${getDayNameFull(day)}, ${day}-${monthNames[month - 1]} — bosing hammasini belgilash`}
                            >
                              <div className="text-[10px] font-semibold" style={{ color: isToday(day) ? '#F97316' : 'var(--text-muted)' }}>{getDayNameFull(day).slice(0, 3)}</div>
                              <div className="text-sm">{day}</div>
                            </th>
                          ))}
                          <th className="px-2 py-2 text-center font-medium border-b" style={{ borderColor: 'var(--border-color)', color: '#22C55E', minWidth: '30px' }}>K</th>
                          <th className="px-2 py-2 text-center font-medium border-b" style={{ borderColor: 'var(--border-color)', color: '#EF4444', minWidth: '30px' }}>Y</th>
                          <th className="px-2 py-2 text-center font-medium border-b" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)', minWidth: '30px' }}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.length === 0 ? (
                          <tr><td colSpan={daysInMonth + 4} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Talabalar yo'q</td></tr>
                        ) : students.map((gs, i) => {
                          const studentId = gs.student || gs.student_id || gs.id;
                          const name = gs.student_name || `${gs.first_name || ''} ${gs.last_name || ''}`.trim();
                          const stats = getStudentStats(studentId);
                          const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

                          return (
                            <tr key={i} className="border-t hover:bg-black/[0.02] dark:hover:bg-white/[0.02]" style={{ borderColor: 'var(--border-color)' }}>
                              <td className="sticky left-0 z-10 px-2 py-1.5 font-medium" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                                <span className="truncate block max-w-[120px]">{i + 1}. {name}</span>
                              </td>
                              {daysArray.map(day => {
                                const key = `${studentId}-${day}`;
                                const status = attendanceMap[key];
                                const weekend = isWeekend(day);
                                const today = isToday(day);
                                const groupDay = isGroupDay(day);

                                return (
                                  <td
                                    key={day}
                                    onClick={() => !weekend && cycleStatus(studentId, day)}
                                    className={`px-0 py-0.5 text-center border-l cursor-pointer transition-colors ${today ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''} ${weekend ? 'bg-gray-100/50 dark:bg-gray-800/30' : ''}`}
                                    onMouseEnter={(e) => { if (!weekend) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                                    onMouseLeave={(e) => { if (!weekend && !today) e.currentTarget.style.backgroundColor = ''; }}
                                    style={{ borderColor: 'var(--border-color)' }}
                                    title={status ? `${name}: ${status}` : `${name}: belgilanmagan`}
                                  >
                                    {status ? (
                                      <div
                                        className="w-6 h-6 mx-auto rounded flex items-center justify-center"
                                        style={{ backgroundColor: statusColors[status] }}
                                      >
                                        <FontAwesomeIcon icon={statusIcons[status]} className="w-3 h-3 text-white" />
                                      </div>
                                    ) : weekend ? (
                                      <div className="w-6 h-6 mx-auto" />
                                    ) : groupDay ? (
                                      <div className="w-6 h-6 mx-auto rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
                                    ) : null}
                                  </td>
                                );
                              })}
                              <td className="px-2 py-1.5 text-center font-semibold text-green-600">{stats.present}</td>
                              <td className="px-2 py-1.5 text-center font-semibold text-red-500">{stats.absent}</td>
                              <td className="px-2 py-1.5 text-center font-semibold" style={{ color: rate >= 80 ? '#22C55E' : rate >= 60 ? '#EAB308' : '#EF4444' }}>{rate}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'finance' && (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                  <FontAwesomeIcon icon={faMoneyBill} className="w-8 h-8 mb-3" />
                  <p className="text-sm">Moliyaviy ma'lumotlar — Payments sahifasidan ko'ring</p>
                  <button onClick={() => navigate('/app/payments')} className="mt-3 px-4 py-2 rounded-lg text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20">
                    To'lovlarga o'tish
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
