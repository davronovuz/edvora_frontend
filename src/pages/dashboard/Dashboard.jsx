import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserGraduate, faUsers, faChalkboardTeacher, faLayerGroup,
  faGraduationCap, faArchive, faCalendarCheck, faClock, faExclamationTriangle,
  faPlus, faMoneyBill, faArrowUp, faArrowDown, faChevronLeft, faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { analyticsService } from '@/services/analytics';
import { groupsService } from '@/services/groups';
import { roomsService } from '@/services/rooms';

// ============================================
// STAT CARD — IT-TAT style colored top border
// ============================================
const StatCard = ({ title, value, icon, color, onClick }) => (
  <div
    onClick={onClick}
    className={`card p-4 border-t-4 hover:shadow-lg transition-all duration-200 ${onClick ? 'cursor-pointer' : ''}`}
    style={{ borderTopColor: color }}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="text-2xl font-bold" style={{ color }}>{value}</div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{title}</div>
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <FontAwesomeIcon icon={icon} className="w-5 h-5" style={{ color }} />
      </div>
    </div>
  </div>
);

// ============================================
// TIMETABLE — Room schedule grid like IT-TAT
// ============================================
const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

const lessonColors = [
  '#22C55E', '#3B82F6', '#EAB308', '#EF4444', '#8B5CF6',
  '#EC4899', '#F97316', '#06B6D4', '#14B8A6', '#6366F1',
];

function Timetable({ groups, rooms }) {
  const today = new Date();
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1; // 0=Mon, 6=Sun

  // Filter groups that have lessons today
  const todayGroups = groups.filter(g =>
    g.status === 'active' && g.days?.includes(dayOfWeek)
  );

  // Get rooms that have groups
  const activeRooms = rooms.filter(r =>
    todayGroups.some(g => g.room === r.id || g.room_name === r.name)
  );

  if (activeRooms.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
        <FontAwesomeIcon icon={faCalendarCheck} className="w-8 h-8 mb-2" />
        <p className="text-sm">Bugun darslar yo'q</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 px-3 py-2 text-left font-medium border-b" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-muted)', minWidth: '60px' }}>
              Vaqt
            </th>
            {activeRooms.map(room => (
              <th key={room.id} className="px-3 py-2 text-center font-medium border-b" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', minWidth: '120px' }}>
                {room.name || `Xona ${room.number}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map(time => {
            const hour = parseInt(time);
            return (
              <tr key={time}>
                <td className="sticky left-0 z-10 px-3 py-2 border-b font-mono" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                  {time}
                </td>
                {activeRooms.map(room => {
                  const group = todayGroups.find(g => {
                    const matchesRoom = g.room === room.id || g.room_name === room.name;
                    const startHour = parseInt(g.start_time);
                    const endHour = parseInt(g.end_time);
                    return matchesRoom && hour >= startHour && hour < endHour;
                  });

                  if (group) {
                    const startHour = parseInt(group.start_time);
                    if (hour === startHour) {
                      const endHour = parseInt(group.end_time);
                      const span = endHour - startHour;
                      const colorIdx = groups.indexOf(group) % lessonColors.length;
                      return (
                        <td key={room.id} rowSpan={span} className="px-1 py-1 border-b" style={{ borderColor: 'var(--border-color)' }}>
                          <div className="rounded-lg px-2 py-1.5 h-full text-white" style={{ backgroundColor: lessonColors[colorIdx] }}>
                            <div className="font-semibold truncate">{group.name}</div>
                            <div className="text-[10px] opacity-80 truncate">{group.course_name}</div>
                            <div className="text-[10px] opacity-80 truncate">{group.teacher_name}</div>
                            <div className="text-[10px] opacity-70">{group.start_time?.slice(0,5)}-{group.end_time?.slice(0,5)}</div>
                          </div>
                        </td>
                      );
                    }
                    return null; // Covered by rowSpan
                  }
                  return (
                    <td key={room.id} className="px-1 py-2 border-b" style={{ borderColor: 'var(--border-color)' }} />
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// MAIN DASHBOARD
// ============================================
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentPayments, setRecentPayments] = useState([]);
  const [topGroups, setTopGroups] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [studentsBySource, setStudentsBySource] = useState([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState([]);
  const [groups, setGroups] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('timetable'); // timetable | charts
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [dashRes, groupsRes, roomsRes] = await Promise.all([
        analyticsService.getDashboard().catch(() => ({ data: {} })),
        groupsService.getAll({ status: 'active', page_size: 100 }).catch(() => ({ data: {} })),
        roomsService.getAll({ page_size: 50 }).catch(() => ({ data: {} })),
      ]);

      const data = dashRes.data?.data || dashRes.data || {};
      setGroups(groupsRes.data?.data || groupsRes.data?.results || []);
      setRooms(roomsRes.data?.data || roomsRes.data?.results || []);

      setStats({
        students: data.students || { total: 0, active: 0, new_this_month: 0, with_debt: 0, graduated: 0, archived: 0 },
        groups: data.groups || { total: 0, active: 0 },
        teachers: data.teachers || { total: 0, active: 0 },
        finance: data.finance || { income: 0, expense: 0, salary: 0, profit: 0 },
        leads: data.leads || { total: 0, converted: 0, conversion_rate: 0 },
        attendance: data.attendance || { today_total: 0, today_present: 0, rate: 0 },
      });

      setRecentPayments(data.recent_payments || []);
      setTopGroups(data.top_groups || []);

      if (data.revenue_chart) setRevenueData(data.revenue_chart);
      else setRevenueData([
        { month: 'Yan', income: 0, expense: 0 }, { month: 'Fev', income: 0, expense: 0 },
        { month: 'Mar', income: 0, expense: 0 }, { month: 'Apr', income: 0, expense: 0 },
        { month: 'May', income: 0, expense: 0 }, { month: 'Iyn', income: 0, expense: 0 },
      ]);

      if (data.students_by_source) setStudentsBySource(data.students_by_source);
      else setStudentsBySource([
        { name: 'Instagram', value: 0, color: '#E1306C' },
        { name: 'Telegram', value: 0, color: '#0088cc' },
        { name: 'Tavsiya', value: 0, color: '#22C55E' },
        { name: 'Website', value: 0, color: '#F28C28' },
      ]);

      if (data.weekly_attendance) setWeeklyAttendance(data.weekly_attendance);
      else setWeeklyAttendance([
        { day: 'Dush', rate: 0 }, { day: 'Sesh', rate: 0 }, { day: 'Chor', rate: 0 },
        { day: 'Pay', rate: 0 }, { day: 'Jum', rate: 0 }, { day: 'Shan', rate: 0 },
      ]);
    } catch {
      setStats({
        students: { total: 0, active: 0, new_this_month: 0, with_debt: 0, graduated: 0, archived: 0 },
        groups: { total: 0, active: 0 },
        teachers: { total: 0, active: 0 },
        finance: { income: 0, expense: 0, salary: 0, profit: 0 },
        leads: { total: 0, converted: 0, conversion_rate: 0 },
        attendance: { today_total: 0, today_present: 0, rate: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value?.toLocaleString() || '0';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Assalomu alaykum!
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Bugun {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/app/students')} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
            Yangi o'quvchi
          </button>
          <button onClick={() => navigate('/app/payments')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <FontAwesomeIcon icon={faMoneyBill} className="w-3.5 h-3.5" />
            To'lov qabul
          </button>
        </div>
      </div>

      {/* IT-TAT STYLE 9 STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        <StatCard
          title="Yangi talabalar"
          value={stats?.students?.new_this_month || 0}
          icon={faUserGraduate}
          color="#3B82F6"
          onClick={() => navigate('/app/students')}
        />
        <StatCard
          title="Faol talabalar"
          value={stats?.students?.active || stats?.students?.total || 0}
          icon={faUsers}
          color="#22C55E"
          onClick={() => navigate('/app/students')}
        />
        <StatCard
          title="O'qituvchilar"
          value={stats?.teachers?.active || stats?.teachers?.total || 0}
          icon={faChalkboardTeacher}
          color="#8B5CF6"
          onClick={() => navigate('/app/teachers')}
        />
        <StatCard
          title="Guruhlar"
          value={stats?.groups?.total || 0}
          icon={faLayerGroup}
          color="#F97316"
          onClick={() => navigate('/app/groups')}
        />
        <StatCard
          title="Bitirganlar"
          value={stats?.students?.graduated || 0}
          icon={faGraduationCap}
          color="#06B6D4"
        />
        <StatCard
          title="Arxiv talabalar"
          value={stats?.students?.archived || 0}
          icon={faArchive}
          color="#94A3B8"
        />
        <StatCard
          title="Faol guruhlar"
          value={stats?.groups?.active || 0}
          icon={faCalendarCheck}
          color="#14B8A6"
          onClick={() => navigate('/app/groups')}
        />
        <StatCard
          title="Qarzdorlar"
          value={stats?.students?.with_debt || 0}
          icon={faExclamationTriangle}
          color="#EF4444"
          onClick={() => navigate('/app/payments')}
        />
        <StatCard
          title="Shu oy muddati"
          value={stats?.leads?.total || 0}
          icon={faClock}
          color="#EAB308"
          onClick={() => navigate('/app/leads')}
        />
      </div>

      {/* TABS: Timetable / Charts */}
      <div className="card overflow-hidden">
        <div className="flex items-center border-b" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('timetable')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'timetable'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent'
            }`}
            style={activeTab !== 'timetable' ? { color: 'var(--text-secondary)' } : {}}
          >
            Dars jadvali
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'charts'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent'
            }`}
            style={activeTab !== 'charts' ? { color: 'var(--text-secondary)' } : {}}
          >
            Statistika
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'timetable' ? (
            <Timetable groups={groups} rooms={rooms} />
          ) : (
            /* CHARTS VIEW */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Revenue Chart */}
              <div className="lg:col-span-2">
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Daromad va xarajatlar</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} formatter={(value) => [`${Number(value).toLocaleString()} so'm`]} />
                      <Area type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={2} fill="url(#incomeGradient)" name="Daromad" />
                      <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} fill="url(#expenseGradient)" name="Xarajat" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Daromad</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Xarajat</span></div>
                </div>
              </div>

              {/* Pie Chart */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>O'quvchilar manbasi</h3>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={studentsBySource} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="value">
                        {studentsBySource.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} formatter={(value) => [`${value}%`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {studentsBySource.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                      <span className="text-xs font-medium ml-auto" style={{ color: 'var(--text-primary)' }}>{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Attendance */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Haftalik davomat
            <span className="text-xs font-normal ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
              {stats?.attendance?.rate || 0}%
            </span>
          </h3>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAttendance}>
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} formatter={(value) => [`${value}%`, 'Davomat']} />
                <Bar dataKey="rate" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>So'nggi to'lovlar</h3>
            <button onClick={() => navigate('/app/payments')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Barchasi</button>
          </div>
          <div className="space-y-2">
            {recentPayments.length > 0 ? recentPayments.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.student_name || item.student}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.payment_method || item.type}</p>
                </div>
                <p className="text-sm font-semibold text-green-600">+{Number(item.amount || 0).toLocaleString()}</p>
              </div>
            )) : (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>To'lovlar yo'q</p>
            )}
          </div>
        </div>

        {/* Top Groups */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Top guruhlar</h3>
            <button onClick={() => navigate('/app/groups')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Barchasi</button>
          </div>
          <div className="space-y-2">
            {topGroups.length > 0 ? topGroups.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--bg-tertiary)', color: i < 3 ? '#1A202C' : 'var(--text-primary)' }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{item.teacher_name || item.teacher}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{item.students_count || item.students}/{item.max_students || item.capacity}</p>
                  <div className="w-14 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                    <div className="h-full bg-primary-600 rounded-full" style={{ width: `${Math.min(((item.students_count || item.students) / (item.max_students || item.capacity || 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>Guruhlar yo'q</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
