import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import api from '@/services/api';
import { analyticsService } from '@/services/analytics';

// ============================================
// STAT CARD COMPONENT
// ============================================
const StatCard = ({ title, value, icon, color, bgColor, change, changeType }) => (
  <div className="card p-5 hover:shadow-lg transition-all duration-300">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          {title}
        </p>
        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
        {change && (
          <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${
            changeType === 'up' ? 'text-success-500' : 'text-danger-500'
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={changeType === 'up' ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"}
              />
            </svg>
            {change}
          </div>
        )}
      </div>
      <div className={`w-14 h-14 ${bgColor} rounded-2xl flex items-center justify-center`}>
        <div className={color}>{icon}</div>
      </div>
    </div>
  </div>
);

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentPayments, setRecentPayments] = useState([]);
  const [topGroups, setTopGroups] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [studentsBySource, setStudentsBySource] = useState([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await analyticsService.getDashboard();
      const data = res.data?.data || res.data;

      setStats({
        students: data.students || { total: 0, active: 0, new_this_month: 0, with_debt: 0 },
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
      // Fallback demo data if API is unavailable
      setStats({
        students: { total: 0, active: 0, new_this_month: 0, with_debt: 0 },
        groups: { total: 0, active: 0 },
        teachers: { total: 0, active: 0 },
        finance: { income: 0, expense: 0, salary: 0, profit: 0 },
        leads: { total: 0, converted: 0, conversion_rate: 0 },
        attendance: { today_total: 0, today_present: 0, rate: 0 },
      });
      setRevenueData([]);
      setStudentsBySource([]);
      setWeeklyAttendance([]);
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
          <button onClick={() => navigate('/students')} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Yangi o'quvchi
          </button>
          <button onClick={() => navigate('/payments')} className="px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            To'lov qabul
          </button>
        </div>
      </div>

      {/* MAIN STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.totalStudents')}
          value={stats?.students?.total || 0}
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          color="text-primary-600"
          bgColor="bg-primary-100 dark:bg-primary-900/30"
          change={stats?.students?.new_this_month ? `+${stats.students.new_this_month} bu oy` : null}
          changeType="up"
        />
        <StatCard
          title={t('dashboard.activeGroups')}
          value={stats?.groups?.active || 0}
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
          color="text-success-600"
          bgColor="bg-success-100 dark:bg-success-900/30"
        />
        <StatCard
          title={t('dashboard.totalTeachers')}
          value={stats?.teachers?.active || 0}
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
          color="text-secondary-600"
          bgColor="bg-secondary-100 dark:bg-secondary-900/30"
        />
        <StatCard
          title={t('dashboard.monthlyIncome')}
          value={`${formatCurrency(stats?.finance?.income || 0)}`}
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="text-warning-600"
          bgColor="bg-warning-100 dark:bg-warning-900/30"
        />
      </div>

      {/* MINI STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Bugungi davomat</div>
          <div className="text-xl font-bold mt-1" style={{ color: '#22C55E' }}>{stats?.attendance?.rate || 0}%</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{stats?.attendance?.today_present || 0}/{stats?.attendance?.today_total || 0}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Leadlar</div>
          <div className="text-xl font-bold mt-1" style={{ color: 'var(--primary-600)' }}>{stats?.leads?.total || 0}</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Konversiya: {stats?.leads?.conversion_rate || 0}%</div>
        </div>
        <div className="card p-4">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Qarzdorlar</div>
          <div className="text-xl font-bold mt-1" style={{ color: '#EF4444' }}>{stats?.students?.with_debt || 0}</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>To'lov muddati o'tgan</div>
        </div>
        <div className="card p-4">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Sof foyda</div>
          <div className="text-xl font-bold mt-1" style={{ color: '#22C55E' }}>{formatCurrency(stats?.finance?.profit || 0)}</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Bu oy</div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Daromad va xarajatlar</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B365D" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1B365D" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F28C28" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F28C28" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `${v}M`} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} formatter={(value) => [`${value}M so'm`]} />
                <Area type="monotone" dataKey="income" stroke="#1B365D" strokeWidth={2} fill="url(#incomeGradient)" name="Daromad" />
                <Area type="monotone" dataKey="expense" stroke="#F28C28" strokeWidth={2} fill="url(#expenseGradient)" name="Xarajat" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary-700" /><span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Daromad</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-secondary-500" /><span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Xarajat</span></div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card p-5">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>O'quvchilar manbasi</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={studentsBySource} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
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

      {/* MIDDLE ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Attendance */}
        <div className="card p-5">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Haftalik davomat</h3>
          <div className="h-[160px]">
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>So'nggi to'lovlar</h3>
            <button onClick={() => navigate('/payments')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">Barchasi</button>
          </div>
          <div className="space-y-3">
            {recentPayments.length > 0 ? recentPayments.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.student_name || item.student}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.payment_method || item.type}</p>
                </div>
                <p className="text-sm font-semibold text-success-600">+{Number(item.amount || 0).toLocaleString()}</p>
              </div>
            )) : (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>To'lovlar yo'q</p>
            )}
          </div>
        </div>

        {/* Top Groups */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Top guruhlar</h3>
            <button onClick={() => navigate('/groups')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">Barchasi</button>
          </div>
          <div className="space-y-3">
            {topGroups.length > 0 ? topGroups.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--bg-tertiary)', color: i < 3 ? '#1A202C' : 'var(--text-primary)' }}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.teacher_name || item.teacher}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.students_count || item.students}/{item.max_students || item.capacity}</p>
                  <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                    <div className="h-full bg-primary-600 rounded-full" style={{ width: `${((item.students_count || item.students) / (item.max_students || item.capacity || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>Guruhlar yo'q</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}