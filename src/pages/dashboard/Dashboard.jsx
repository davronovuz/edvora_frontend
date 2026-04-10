import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserGraduate, faUsers, faChalkboardTeacher, faLayerGroup,
  faCalendarCheck, faExclamationTriangle,
  faPlus, faMoneyBill, faArrowTrendUp, faArrowTrendDown,
  faChartLine, faUserPlus, faClock,
} from '@fortawesome/free-solid-svg-icons';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { analyticsService } from '@/services/analytics';
import { groupsService } from '@/services/groups';
import { roomsService } from '@/services/rooms';
import { toast } from 'sonner';

// ============================================
// STAT CARD
// ============================================
const StatCard = ({ title, value, icon, color, onClick, subtitle }) => (
  <div
    onClick={onClick}
    className={`card p-4 border-t-4 hover:shadow-lg transition-all duration-200 ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
    style={{ borderTopColor: color }}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="text-2xl font-bold" style={{ color }}>{value}</div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{title}</div>
        {subtitle && (
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</div>
        )}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <FontAwesomeIcon icon={icon} className="w-5 h-5" style={{ color }} />
      </div>
    </div>
  </div>
);

// ============================================
// FINANCE SUMMARY CARD
// ============================================
const FinanceCard = ({ label, amount, icon, color, trend }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: `${color}08` }}>
    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
      <FontAwesomeIcon icon={icon} className="w-4 h-4" style={{ color }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm font-bold" style={{ color }}>{formatCurrency(amount)} so'm</p>
    </div>
  </div>
);

// ============================================
// TIMETABLE
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
  const { t } = useTranslation();
  const today = new Date();
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;

  const todayGroups = groups.filter(g =>
    g.status === 'active' && g.days?.includes(dayOfWeek)
  );

  const activeRooms = rooms.filter(r =>
    todayGroups.some(g => g.room === r.id || g.room_name === r.name)
  );

  if (activeRooms.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
        <FontAwesomeIcon icon={faCalendarCheck} className="w-8 h-8 mb-2" />
        <p className="text-sm">{t('dashboard.noLessonsToday') || "Bugun darslar yo'q"}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 px-3 py-2 text-left font-medium border-b" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-muted)', minWidth: '60px' }}>
              {t('common.time') || 'Vaqt'}
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
                            <div className="text-[10px] opacity-70">{group.start_time?.slice(0, 5)}-{group.end_time?.slice(0, 5)}</div>
                          </div>
                        </td>
                      );
                    }
                    return null;
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
// FORMAT HELPERS
// ============================================
function formatCurrency(value) {
  const num = Number(value) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toLocaleString('uz-UZ');
}

const MONTH_NAMES_UZ = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
const DAY_NAMES_UZ = ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'];

// ============================================
// MAIN DASHBOARD
// ============================================
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topGroups, setTopGroups] = useState([]);
  const [financeChart, setFinanceChart] = useState([]);
  const [attendanceChart, setAttendanceChart] = useState([]);
  const [groups, setGroups] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('timetable');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const isOwnerOrAdmin = user?.role === 'owner' || user?.role === 'admin';

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      // Parallel so'rovlar — har biri mustaqil, biri xato bo'lsa qolganlari ishlaydi
      const results = await Promise.allSettled([
        analyticsService.getSummary(),                                          // 0
        groupsService.getAll({ status: 'active', page_size: 100 }),             // 1
        roomsService.getAll({ page_size: 50 }),                                 // 2
        isOwnerOrAdmin ? analyticsService.getFinanceChart() : Promise.resolve(), // 3
        isOwnerOrAdmin ? analyticsService.getTopGroups() : Promise.resolve(),    // 4
        isOwnerOrAdmin ? analyticsService.getRecentActivity() : Promise.resolve(), // 5
        analyticsService.getAttendanceChart(),                                   // 6
      ]);

      // Summary
      if (results[0].status === 'fulfilled') {
        const data = results[0].value?.data?.data || results[0].value?.data || {};
        setStats(data);
      } else {
        console.error('Dashboard summary error:', results[0].reason);
        setError(t('dashboard.loadError') || "Ma'lumotlarni yuklashda xatolik");
      }

      // Groups (timetable uchun)
      if (results[1].status === 'fulfilled') {
        const gData = results[1].value?.data;
        setGroups(gData?.data || gData?.results || []);
      }

      // Rooms (timetable uchun)
      if (results[2].status === 'fulfilled') {
        const rData = results[2].value?.data;
        setRooms(rData?.data || rData?.results || []);
      }

      // Finance chart — backend: labels + datasets
      if (results[3]?.status === 'fulfilled' && results[3].value?.data) {
        const fData = results[3].value.data?.data;
        if (fData?.labels && fData?.datasets) {
          const chartData = fData.labels.map((label, i) => {
            const monthNum = parseInt(label.split('/')[0]);
            return {
              month: MONTH_NAMES_UZ[monthNum - 1] || label,
              income: fData.datasets[0]?.data?.[i] || 0,
              expense: fData.datasets[1]?.data?.[i] || 0,
            };
          });
          setFinanceChart(chartData);
        }
      }

      // Top groups
      if (results[4]?.status === 'fulfilled' && results[4].value?.data) {
        setTopGroups(results[4].value.data?.data || []);
      }

      // Recent activity
      if (results[5]?.status === 'fulfilled' && results[5].value?.data) {
        setRecentActivity(results[5].value.data?.data || []);
      }

      // Attendance chart — backend: labels + datasets
      if (results[6]?.status === 'fulfilled' && results[6].value?.data) {
        const aData = results[6].value.data?.data;
        if (aData?.labels && aData?.datasets) {
          // Oxirgi 7 kunni olish (haftalik ko'rinish uchun)
          const fullData = aData.labels.map((label, i) => ({
            day: label,
            rate: aData.datasets[0]?.data?.[i] || 0,
          }));
          setAttendanceChart(fullData.slice(-7));
        }
      }

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(t('dashboard.loadError') || "Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
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

  if (error && !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <button onClick={fetchDashboard} className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">
            {t('dashboard.retry') || "Qayta yuklash"}
          </button>
        </div>
      </div>
    );
  }

  // Salomlashish — vaqtga qarab
  const hour = new Date().getHours();
  const greeting = hour < 12
    ? (t('dashboard.goodMorning') || 'Xayrli tong')
    : hour < 18
    ? (t('dashboard.goodAfternoon') || 'Xayrli kun')
    : (t('dashboard.goodEvening') || 'Xayrli kech');

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {greeting}{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          {(user?.role === 'owner' || user?.role === 'admin' || user?.role === 'registrar') && (
            <button onClick={() => navigate('/app/students')} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
              {t('dashboard.newStudent') || "Yangi o'quvchi"}
            </button>
          )}
          {(user?.role === 'owner' || user?.role === 'admin' || user?.role === 'accountant') && (
            <button onClick={() => navigate('/app/payments')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <FontAwesomeIcon icon={faMoneyBill} className="w-3.5 h-3.5" />
              {t('dashboard.acceptPayment') || "To'lov qabul"}
            </button>
          )}
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <StatCard
          title={t('dashboard.activeStudents') || "Faol o'quvchilar"}
          value={stats?.students?.active || 0}
          icon={faUsers}
          color="#22C55E"
          onClick={() => navigate('/app/students')}
          subtitle={`${t('common.total') || 'Jami'}: ${stats?.students?.total || 0}`}
        />
        <StatCard
          title={t('dashboard.newStudentsMonth') || "Yangi (shu oy)"}
          value={stats?.students?.new_this_month || 0}
          icon={faUserPlus}
          color="#3B82F6"
          onClick={() => navigate('/app/students')}
        />
        <StatCard
          title={t('dashboard.totalTeachers') || "O'qituvchilar"}
          value={stats?.teachers?.active || stats?.teachers?.total || 0}
          icon={faChalkboardTeacher}
          color="#8B5CF6"
          onClick={() => navigate('/app/teachers')}
        />
        <StatCard
          title={t('dashboard.activeGroups') || "Faol guruhlar"}
          value={stats?.groups?.active || 0}
          icon={faLayerGroup}
          color="#F97316"
          onClick={() => navigate('/app/groups')}
          subtitle={`${t('common.total') || 'Jami'}: ${stats?.groups?.total || 0}`}
        />
        <StatCard
          title={t('dashboard.debtors') || "Qarzdorlar"}
          value={stats?.students?.with_debt || 0}
          icon={faExclamationTriangle}
          color="#EF4444"
          onClick={() => navigate('/app/payments')}
        />
        <StatCard
          title={t('dashboard.todayAttendance') || "Bugungi davomat"}
          value={`${stats?.attendance?.rate || 0}%`}
          icon={faCalendarCheck}
          color="#14B8A6"
          onClick={() => navigate('/app/attendance')}
          subtitle={`${stats?.attendance?.today_present || 0}/${stats?.attendance?.today_total || 0}`}
        />
      </div>

      {/* FINANCE SUMMARY (faqat owner/admin/accountant uchun) */}
      {isOwnerOrAdmin && stats?.finance && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <FinanceCard
            label={t('dashboard.monthlyIncome') || "Oylik daromad"}
            amount={stats.finance.income}
            icon={faArrowTrendUp}
            color="#22C55E"
          />
          <FinanceCard
            label={t('finance.expense') || "Xarajat"}
            amount={stats.finance.expense}
            icon={faArrowTrendDown}
            color="#EF4444"
          />
          <FinanceCard
            label={t('teachers.salary') || "Ish haqi"}
            amount={stats.finance.salary}
            icon={faUsers}
            color="#F97316"
          />
          <FinanceCard
            label={t('finance.profit') || "Foyda"}
            amount={stats.finance.profit}
            icon={faChartLine}
            color={Number(stats.finance.profit) >= 0 ? '#22C55E' : '#EF4444'}
          />
        </div>
      )}

      {/* BILLING KPI (yangi invoice tizimi) */}
      {isOwnerOrAdmin && stats?.billing && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Billing (shu oy)</h3>
            <button onClick={() => navigate('/app/billing')} className="text-xs text-primary-600 hover:underline">Batafsil</button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="rounded-xl p-3" style={{ backgroundColor: '#3B82F610' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Kutilayotgan</p>
              <p className="text-lg font-bold" style={{ color: '#3B82F6' }}>{formatCurrency(stats.billing.expected)} so'm</p>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: '#22C55E10' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Yig'ilgan</p>
              <p className="text-lg font-bold" style={{ color: '#22C55E' }}>{formatCurrency(stats.billing.collected)} so'm</p>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: '#EF444410' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Qarz</p>
              <p className="text-lg font-bold" style={{ color: '#EF4444' }}>{formatCurrency(stats.billing.debt)} so'm</p>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: '#F9731610' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Muddati o'tgan</p>
              <p className="text-lg font-bold" style={{ color: '#F97316' }}>{stats.billing.overdue_count}</p>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: '#8B5CF610' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Yig'ish darajasi</p>
              <p className="text-lg font-bold" style={{ color: '#8B5CF6' }}>{stats.billing.collection_rate}%</p>
            </div>
          </div>
        </div>
      )}

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
            {t('dashboard.timetable') || "Dars jadvali"}
          </button>
          {isOwnerOrAdmin && (
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'charts'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent'
              }`}
              style={activeTab !== 'charts' ? { color: 'var(--text-secondary)' } : {}}
            >
              {t('dashboard.statistics') || "Statistika"}
            </button>
          )}
        </div>

        <div className="p-4">
          {activeTab === 'timetable' ? (
            <Timetable groups={groups} rooms={rooms} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Revenue Chart */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  {t('dashboard.revenueExpense') || "Daromad va xarajatlar"} ({t('dashboard.last12months') || "oxirgi 12 oy"})
                </h3>
                <div className="h-[250px]">
                  {financeChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={financeChart}>
                        <defs>
                          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                          formatter={(value) => [`${Number(value).toLocaleString()} so'm`]}
                        />
                        <Area type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={2} fill="url(#incomeGradient)" name={t('finance.income') || "Daromad"} />
                        <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} fill="url(#expenseGradient)" name={t('finance.expense') || "Xarajat"} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
                      <p className="text-sm">{t('common.noData') || "Ma'lumot topilmadi"}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('finance.income') || 'Daromad'}</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('finance.expense') || 'Xarajat'}</span></div>
                </div>
              </div>

              {/* Attendance Chart */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  {t('dashboard.weeklyAttendance') || "Haftalik davomat"}
                  <span className="text-xs font-normal ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
                    {stats?.attendance?.rate || 0}%
                  </span>
                </h3>
                <div className="h-[250px]">
                  {attendanceChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attendanceChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} />
                        <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                          formatter={(value) => [`${value}%`, t('attendance.attendanceRate') || 'Davomat']}
                        />
                        <Bar dataKey="rate" fill="#22C55E" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
                      <p className="text-sm">{t('common.noData') || "Ma'lumot topilmadi"}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            {t('dashboard.recentActivity') || "So'nggi faoliyat"}
          </h3>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {recentActivity.length > 0 ? recentActivity.slice(0, 8).map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs ${
                  item.type === 'payment' ? 'bg-green-500' :
                  item.type === 'student' ? 'bg-blue-500' :
                  item.type === 'lead' ? 'bg-orange-500' :
                  'bg-gray-400'
                }`}>
                  <FontAwesomeIcon icon={
                    item.type === 'payment' ? faMoneyBill :
                    item.type === 'student' ? faUserGraduate :
                    item.type === 'lead' ? faUserPlus :
                    faClock
                  } className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
                </div>
                {item.time && (
                  <span className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    {new Date(item.time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            )) : (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
                {t('common.noData') || "Ma'lumot topilmadi"}
              </p>
            )}
          </div>
        </div>

        {/* Top Groups */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('dashboard.topGroups') || "Top guruhlar"}
            </h3>
            <button onClick={() => navigate('/app/groups')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              {t('common.all') || 'Barchasi'}
            </button>
          </div>
          <div className="space-y-2">
            {topGroups.length > 0 ? topGroups.slice(0, 6).map((item, i) => (
              <div key={item.id || i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--bg-tertiary)',
                    color: i < 3 ? '#1A202C' : 'var(--text-primary)',
                  }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{item.teacher || item.course}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {item.students_count}/{item.max_students}
                  </p>
                  <div className="w-14 h-1.5 rounded-full mt-1" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all"
                      style={{ width: `${Math.min(item.fill_rate || 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
                {t('common.noData') || "Ma'lumot topilmadi"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
