import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faCheck, faTimes, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import api from '@/services/api';

const dayNames = ['Ya', 'Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha'];

export default function TeacherAttendance() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [activeTab, setActiveTab] = useState('attendance'); // attendance | schedule
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [year, month] = currentMonth.split('-');
      const [teachersRes] = await Promise.all([
        api.get('/teachers/', { params: { page_size: 100 } }),
      ]);

      const allTeachers = teachersRes.data?.data || teachersRes.data?.results || [];
      setTeachers(allTeachers);

      // Try to fetch teacher attendance data
      try {
        const attRes = await api.get('/attendance/', { params: {
          date_from: `${year}-${month}-01`,
          date_to: `${year}-${month}-${new Date(year, month, 0).getDate()}`,
          page_size: 1000,
        }});
        const attData = attRes.data?.data || attRes.data?.results || [];

        // Build attendance map: { teacherId: { dayNumber: status } }
        const attMap = {};
        attData.forEach(a => {
          const teacherId = a.teacher || a.teacher_id;
          if (!teacherId) return;
          const day = new Date(a.date).getDate();
          if (!attMap[teacherId]) attMap[teacherId] = {};
          attMap[teacherId][day] = a.status || 'present';
        });
        setAttendance(attMap);
      } catch {
        setAttendance({});
      }
    } catch {
      toast.error("Ma'lumotlarni yuklashda xato");
    }
    setLoading(false);
  };

  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const nextMonth = () => {
    const d = new Date(year, month, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthName = new Date(year, month - 1).toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' });

  const getDayName = (day) => {
    const d = new Date(year, month - 1, day);
    return dayNames[d.getDay()];
  };

  const isWeekend = (day) => {
    const d = new Date(year, month - 1, day);
    return d.getDay() === 0; // Sunday
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() + 1 === month && today.getFullYear() === year;
  };

  const getTeacherStats = (teacherId) => {
    const att = attendance[teacherId] || {};
    let present = 0, absent = 0, totalHours = 0;
    Object.values(att).forEach(status => {
      if (status === 'present' || status === true) { present++; totalHours += 8; }
      else absent++;
    });
    return { present, absent, totalHours };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Ustozlar davomati</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>O'qituvchilarning oylik davomati</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'attendance' ? 'bg-primary-600 text-white' : ''
          }`}
          style={activeTab !== 'attendance' ? { color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)' } : {}}
        >
          Ustozlar davomati
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'schedule' ? 'bg-primary-600 text-white' : ''
          }`}
          style={activeTab !== 'schedule' ? { color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)' } : {}}
        >
          Ustozlar ish jadvali
        </button>
      </div>

      {/* Month Selector */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
            <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4" style={{ color: 'var(--primary-600)' }} />
            <input
              type="month"
              value={currentMonth}
              onChange={e => setCurrentMonth(e.target.value)}
              className="h-10 px-3 rounded-lg border text-sm"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
            <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
          <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{monthName}</span>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <th className="sticky left-0 z-10 px-3 py-2 text-left font-medium border-b" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-muted)', minWidth: '160px' }}>
                    Ustozlar
                  </th>
                  {daysArray.map(day => (
                    <th
                      key={day}
                      className={`px-1 py-2 text-center font-medium border-b ${isToday(day) ? 'bg-primary-100 dark:bg-primary-900/30' : ''} ${isWeekend(day) ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
                      style={{ borderColor: 'var(--border-color)', color: isWeekend(day) ? '#EF4444' : 'var(--text-muted)', minWidth: '32px' }}
                    >
                      <div>{day}</div>
                      <div className="text-[9px]">{getDayName(day)}</div>
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center font-medium border-b" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)', minWidth: '60px' }}>
                    To'liq ish<br/>kuni
                  </th>
                  <th className="px-2 py-2 text-center font-medium border-b" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)', minWidth: '50px' }}>
                    Keldi
                  </th>
                  <th className="px-2 py-2 text-center font-medium border-b" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)', minWidth: '60px' }}>
                    Qo'llanmadi
                  </th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr><td colSpan={daysInMonth + 4} className="px-4 py-12 text-center" style={{ color: 'var(--text-muted)' }}>O'qituvchilar yo'q</td></tr>
                ) : teachers.map(teacher => {
                  const teacherId = teacher.id;
                  const teacherAtt = attendance[teacherId] || {};
                  const stats = getTeacherStats(teacherId);

                  return (
                    <tr key={teacherId} className="border-t hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: 'var(--border-color)' }}>
                      <td className="sticky left-0 z-10 px-3 py-2 font-medium" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                        {teacher.first_name} {teacher.last_name}
                      </td>
                      {daysArray.map(day => {
                        const status = teacherAtt[day];
                        const weekend = isWeekend(day);
                        const today = isToday(day);

                        return (
                          <td
                            key={day}
                            className={`px-1 py-2 text-center border-l ${today ? 'bg-primary-50 dark:bg-primary-900/20' : ''} ${weekend ? 'bg-red-50/50 dark:bg-red-900/5' : ''}`}
                            style={{ borderColor: 'var(--border-color)' }}
                          >
                            {status === 'present' || status === true ? (
                              <div className="w-6 h-6 mx-auto rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-green-600" />
                              </div>
                            ) : status === 'absent' || status === false ? (
                              <div className="w-6 h-6 mx-auto rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <FontAwesomeIcon icon={faTimes} className="w-3 h-3 text-red-500" />
                              </div>
                            ) : weekend ? (
                              <div className="w-6 h-6 mx-auto rounded bg-gray-100 dark:bg-gray-800" />
                            ) : null}
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 text-center font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {stats.totalHours}
                      </td>
                      <td className="px-2 py-2 text-center font-semibold text-green-600">
                        {stats.present}
                      </td>
                      <td className="px-2 py-2 text-center font-semibold text-red-500">
                        {stats.absent}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
