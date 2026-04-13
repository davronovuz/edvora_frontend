import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserGraduate, faUsers, faChalkboardTeacher, faLayerGroup,
  faCalendarCheck, faExclamationTriangle,
  faPlus, faMoneyBill, faArrowTrendUp, faArrowTrendDown,
  faChartLine, faUserPlus, faClock, faClipboardCheck,
  faChevronRight, faDoorOpen, faWallet,
  faArrowRight, faCircleCheck, faCircleXmark,
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
// BREND RANGLAR
// ============================================
const C = {
  primary: '#F97316',
  primaryDark: '#EA580C',
  navy: '#1B365D',
  navyLight: '#2D4A7A',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  text: '#1A202C',
  textSec: '#4A5568',
  muted: '#A0AEC0',
  border: '#E2E8F0',
  bgSoft: '#F8FAFC',
};

// ============================================
// STAT CARD — professional
// ============================================
const StatCard = ({ title, value, icon, accent = C.primary, onClick, subtitle, trend }) => (
  <div
    onClick={onClick}
    className={`card p-5 transition-all duration-200 hover:shadow-md ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs font-medium mb-2" style={{ color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
        <p className="text-2xl font-bold" style={{ color: C.navy }}>{value}</p>
        {subtitle && (
          <p className="text-[11px] mt-1" style={{ color: C.muted }}>{subtitle}</p>
        )}
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1.5">
            <FontAwesomeIcon icon={trend >= 0 ? faArrowTrendUp : faArrowTrendDown} className="w-3 h-3" style={{ color: trend >= 0 ? C.success : C.danger }} />
            <span className="text-[11px] font-medium" style={{ color: trend >= 0 ? C.success : C.danger }}>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}12` }}>
        <FontAwesomeIcon icon={icon} className="w-5 h-5" style={{ color: accent }} />
      </div>
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
  '#F97316', '#3B82F6', '#22C55E', '#8B5CF6', '#EC4899',
  '#06B6D4', '#EAB308', '#14B8A6', '#6366F1', '#EF4444',
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
      <div className="text-center py-12" style={{ color: C.muted }}>
        <FontAwesomeIcon icon={faCalendarCheck} className="w-8 h-8 mb-2 opacity-40" />
        <p className="text-sm">Bugun darslar yo'q</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 px-3 py-2.5 text-left font-semibold border-b" style={{ backgroundColor: C.bgSoft, borderColor: C.border, color: C.textSec, minWidth: '60px' }}>
              Vaqt
            </th>
            {activeRooms.map(room => (
              <th key={room.id} className="px-3 py-2.5 text-center font-semibold border-b" style={{ borderColor: C.border, color: C.navy, minWidth: '120px' }}>
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
                <td className="sticky left-0 z-10 px-3 py-2 border-b font-mono text-[11px]" style={{ backgroundColor: C.bgSoft, borderColor: C.border, color: C.muted }}>
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
                        <td key={room.id} rowSpan={span} className="px-1 py-1 border-b" style={{ borderColor: C.border }}>
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
                  return <td key={room.id} className="px-1 py-2 border-b" style={{ borderColor: C.border }} />;
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

// ============================================
// TEACHER DASHBOARD
// ============================================
function TeacherDashboard({ stats, navigate, greeting, user }) {
  const today = new Date();
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const myGroups = stats?.my_groups || [];
  const todayGroups = myGroups.filter(g => g.days?.includes(dayOfWeek));
  const unmarkedGroups = todayGroups.filter(g => !g.today_marked);

  if (stats?.no_profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.navy }}>
            {greeting}{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!
          </h1>
        </div>
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${C.warning}12` }}>
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-7 h-7" style={{ color: C.warning }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: C.navy }}>O'qituvchi profili topilmadi</h3>
          <p className="text-sm" style={{ color: C.muted }}>
            Sizning foydalanuvchi hisobingiz o'qituvchi profiliga ulanmagan. Iltimos, administratorga murojaat qiling.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: C.navy }}>
          {greeting}{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>
          {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Guruhlarim" value={stats?.groups?.active || 0} icon={faLayerGroup} onClick={() => navigate('/app/groups')} />
        <StatCard title="O'quvchilarim" value={stats?.students?.total || 0} icon={faUserGraduate} />
        <StatCard title="Bugungi davomat" value={`${stats?.attendance?.rate || 0}%`} icon={faCalendarCheck} accent={C.success} subtitle={`${stats?.attendance?.today_present || 0}/${stats?.attendance?.today_total || 0}`} />
        <StatCard title="Oylik davomat" value={`${stats?.attendance?.month_rate || 0}%`} icon={faClipboardCheck} accent={C.navyLight} />
      </div>

      {unmarkedGroups.length > 0 && (
        <div className="card p-4" style={{ borderColor: C.primary, borderWidth: '1px', borderStyle: 'solid' }}>
          <div className="flex items-center gap-2 mb-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4" style={{ color: C.primary }} />
            <span className="text-sm font-semibold" style={{ color: C.primary }}>
              Davomat olinmagan ({unmarkedGroups.length})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {unmarkedGroups.map(g => (
              <button key={g.id} onClick={() => navigate(`/app/groups/${g.id}`)}
                className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:shadow-md"
                style={{ borderColor: C.border, backgroundColor: C.bgSoft }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: C.primary }}>
                  {g.start_time?.slice(0, 5)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: C.navy }}>{g.name}</p>
                  <p className="text-xs" style={{ color: C.muted }}>{g.course_name} · {g.students_count} o'quvchi</p>
                </div>
                <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" style={{ color: C.primary }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bugungi darslar */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: C.border }}>
          <h3 className="text-sm font-semibold" style={{ color: C.navy }}>
            Bugungi darslarim
            <span className="text-xs font-normal ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${C.primary}12`, color: C.primary }}>
              {todayGroups.length} ta
            </span>
          </h3>
        </div>
        <div className="p-4">
          {todayGroups.length === 0 ? (
            <div className="text-center py-8" style={{ color: C.muted }}>
              <FontAwesomeIcon icon={faCalendarCheck} className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Bugun darslar yo'q</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayGroups.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')).map((g, i) => (
                <div key={g.id} onClick={() => navigate(`/app/groups/${g.id}`)}
                  className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md"
                  style={{ borderColor: C.border }}>
                  <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white" style={{ backgroundColor: C.primary }}>
                    <span className="text-sm font-bold leading-none">{g.start_time?.slice(0, 5)}</span>
                    <span className="text-[9px] opacity-70 mt-0.5">{g.end_time?.slice(0, 5)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold" style={{ color: C.navy }}>{g.name}</span>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>{g.course_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs flex items-center gap-1" style={{ color: C.muted }}>
                        <FontAwesomeIcon icon={faUsers} className="w-3 h-3" /> {g.students_count}/{g.max_students}
                      </span>
                      {g.room_name && (
                        <span className="text-xs flex items-center gap-1" style={{ color: C.muted }}>
                          <FontAwesomeIcon icon={faDoorOpen} className="w-3 h-3" /> {g.room_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {g.today_marked ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ backgroundColor: `${C.success}12`, color: C.success }}>
                        <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3" /> {g.today_present}/{g.today_total}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${C.primary}12`, color: C.primary }}>
                        Kutilmoqda
                      </span>
                    )}
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3 flex-shrink-0" style={{ color: C.muted }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Barcha guruhlar */}
      {myGroups.length > todayGroups.length && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: C.border }}>
            <h3 className="text-sm font-semibold" style={{ color: C.navy }}>
              Barcha guruhlarim
              <span className="text-xs font-normal ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${C.navyLight}12`, color: C.navyLight }}>
                {myGroups.length} ta
              </span>
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myGroups.map((g) => {
                const dayNames = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
                const schedule = (g.days || []).map(d => dayNames[d]).join(', ');
                return (
                  <div key={g.id} onClick={() => navigate(`/app/groups/${g.id}`)}
                    className="p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md"
                    style={{ borderColor: C.border, borderLeftWidth: '3px', borderLeftColor: C.primary }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold" style={{ color: C.navy }}>{g.name}</span>
                      <span className="text-xs font-medium" style={{ color: C.primary }}>
                        {g.students_count}/{g.max_students}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: C.muted }}>{g.course_name}</p>
                    <div className="flex items-center gap-2 mt-2 text-[11px]" style={{ color: C.muted }}>
                      <span>{schedule}</span>
                      <span>·</span>
                      <span>{g.start_time?.slice(0, 5)}-{g.end_time?.slice(0, 5)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [debtorsSummary, setDebtorsSummary] = useState(null);
  const [leadsData, setLeadsData] = useState(null);
  const [groups, setGroups] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('timetable');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const isOwnerOrAdmin = user?.role === 'owner' || user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      if (isTeacher) {
        const res = await analyticsService.getSummary();
        setStats(res.data?.data || res.data || {});
        setLoading(false);
        return;
      }

      const results = await Promise.allSettled([
        analyticsService.getSummary(),
        groupsService.getAll({ status: 'active', page_size: 100 }),
        roomsService.getAll({ page_size: 50 }),
        isOwnerOrAdmin ? analyticsService.getFinanceChart() : Promise.resolve(),
        isOwnerOrAdmin ? analyticsService.getTopGroups() : Promise.resolve(),
        isOwnerOrAdmin ? analyticsService.getRecentActivity() : Promise.resolve(),
        analyticsService.getAttendanceChart(),
        isOwnerOrAdmin ? analyticsService.getDebtorsSummary() : Promise.resolve(),
        isOwnerOrAdmin ? analyticsService.getLeadsChart() : Promise.resolve(),
      ]);

      if (results[0].status === 'fulfilled') {
        setStats(results[0].value?.data?.data || results[0].value?.data || {});
      } else {
        setError("Ma'lumotlarni yuklashda xatolik");
      }

      if (results[1].status === 'fulfilled') {
        const gData = results[1].value?.data;
        setGroups(gData?.data || gData?.results || []);
      }
      if (results[2].status === 'fulfilled') {
        const rData = results[2].value?.data;
        setRooms(rData?.data || rData?.results || []);
      }
      if (results[3]?.status === 'fulfilled' && results[3].value?.data) {
        const fData = results[3].value.data?.data;
        if (fData?.labels && fData?.datasets) {
          setFinanceChart(fData.labels.map((label, i) => ({
            month: MONTH_NAMES_UZ[parseInt(label.split('/')[0]) - 1] || label,
            income: fData.datasets[0]?.data?.[i] || 0,
            expense: fData.datasets[1]?.data?.[i] || 0,
          })));
        }
      }
      if (results[4]?.status === 'fulfilled' && results[4].value?.data) {
        setTopGroups(results[4].value.data?.data || []);
      }
      if (results[5]?.status === 'fulfilled' && results[5].value?.data) {
        setRecentActivity(results[5].value.data?.data || []);
      }
      if (results[6]?.status === 'fulfilled' && results[6].value?.data) {
        const aData = results[6].value.data?.data;
        if (aData?.labels && aData?.datasets) {
          setAttendanceChart(aData.labels.map((label, i) => ({
            day: label,
            rate: aData.datasets[0]?.data?.[i] || 0,
          })).slice(-7));
        }
      }
      if (results[7]?.status === 'fulfilled' && results[7].value?.data) {
        setDebtorsSummary(results[7].value.data?.data || null);
      }
      if (results[8]?.status === 'fulfilled' && results[8].value?.data) {
        setLeadsData(results[8].value.data?.data || null);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Xayrli tong' : hour < 18 ? 'Xayrli kun' : 'Xayrli kech';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 rounded-full animate-spin mx-auto" style={{ borderColor: `${C.primary}30`, borderTopColor: C.primary }} />
          <p className="mt-4 text-sm" style={{ color: C.muted }}>Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="w-10 h-10 mb-3" style={{ color: C.danger }} />
          <p className="text-sm" style={{ color: C.textSec }}>{error}</p>
          <button onClick={fetchDashboard} className="mt-3 px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ backgroundColor: C.primary }}>
            Qayta yuklash
          </button>
        </div>
      </div>
    );
  }

  if (isTeacher) {
    return <TeacherDashboard stats={stats} navigate={navigate} greeting={greeting} user={user} />;
  }

  // ============================================
  // OWNER / ADMIN
  // ============================================
  const billingRate = stats?.billing?.collection_rate || 0;

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.navy }}>
            {greeting}{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-sm mt-0.5" style={{ color: C.muted }}>
            {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          {(user?.role === 'owner' || user?.role === 'admin' || user?.role === 'registrar') && (
            <button onClick={() => navigate('/app/students')}
              className="px-4 py-2.5 text-white rounded-xl text-sm font-medium transition-all hover:shadow-lg flex items-center gap-2"
              style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` }}>
              <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
              Yangi o'quvchi
            </button>
          )}
          {(user?.role === 'owner' || user?.role === 'admin' || user?.role === 'accountant') && (
            <button onClick={() => navigate('/app/payments')}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-md flex items-center gap-2 border"
              style={{ borderColor: C.border, color: C.navy }}>
              <FontAwesomeIcon icon={faMoneyBill} className="w-3.5 h-3.5" style={{ color: C.success }} />
              To'lov qabul
            </button>
          )}
        </div>
      </div>

      {/* STAT CARDS — 6 ta */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Faol o'quvchilar"
          value={stats?.students?.active || 0}
          icon={faUsers}
          accent={C.primary}
          onClick={() => navigate('/app/students')}
          subtitle={`Jami: ${stats?.students?.total || 0}`}
        />
        <StatCard
          title="Yangi (shu oy)"
          value={stats?.students?.new_this_month || 0}
          icon={faUserPlus}
          accent={C.success}
          onClick={() => navigate('/app/students')}
        />
        <StatCard
          title="O'qituvchilar"
          value={stats?.teachers?.active || stats?.teachers?.total || 0}
          icon={faChalkboardTeacher}
          accent={C.navyLight}
          onClick={() => navigate('/app/teachers')}
        />
        <StatCard
          title="Faol guruhlar"
          value={stats?.groups?.active || 0}
          icon={faLayerGroup}
          accent={C.primary}
          onClick={() => navigate('/app/groups')}
          subtitle={`Jami: ${stats?.groups?.total || 0}`}
        />
        <StatCard
          title="Qarzdorlar"
          value={stats?.students?.with_debt || 0}
          icon={faExclamationTriangle}
          accent={C.danger}
          onClick={() => navigate('/app/billing')}
        />
        <StatCard
          title="Bugungi davomat"
          value={`${stats?.attendance?.rate || 0}%`}
          icon={faCalendarCheck}
          accent={C.success}
          subtitle={`${stats?.attendance?.today_present || 0}/${stats?.attendance?.today_total || 0}`}
        />
      </div>

      {/* MOLIYA + BILLING — ikki ustun */}
      {isOwnerOrAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Moliya (3/5) */}
          {stats?.finance && (
            <div className="lg:col-span-3 card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: C.navy }}>Oylik moliya</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Daromad', value: stats.finance.income, icon: faArrowTrendUp, color: C.success },
                  { label: 'Xarajat', value: stats.finance.expense, icon: faArrowTrendDown, color: C.danger },
                  { label: 'Ish haqi', value: stats.finance.salary, icon: faUsers, color: C.primary },
                  { label: 'Foyda', value: stats.finance.profit, icon: faChartLine, color: Number(stats.finance.profit) >= 0 ? C.success : C.danger },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: C.bgSoft }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}12` }}>
                      <FontAwesomeIcon icon={item.icon} className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium" style={{ color: C.muted }}>{item.label}</p>
                      <p className="text-base font-bold" style={{ color: C.navy }}>{formatCurrency(item.value)} <span className="text-xs font-normal" style={{ color: C.muted }}>so'm</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Billing KPI (2/5) */}
          {stats?.billing && (
            <div className="lg:col-span-2 card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: C.navy }}>Billing</h3>
                <button onClick={() => navigate('/app/billing')} className="text-xs font-medium flex items-center gap-1" style={{ color: C.primary }}>
                  Batafsil <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
                </button>
              </div>

              {/* Collection rate — katta */}
              <div className="text-center mb-4">
                <p className="text-3xl font-bold" style={{ color: billingRate >= 80 ? C.success : billingRate >= 50 ? C.warning : C.danger }}>
                  {billingRate}%
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>yig'ish darajasi</p>
                <div className="w-full h-2 rounded-full mt-2" style={{ backgroundColor: `${C.border}` }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{
                    width: `${Math.min(billingRate, 100)}%`,
                    backgroundColor: billingRate >= 80 ? C.success : billingRate >= 50 ? C.warning : C.danger,
                  }} />
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: 'Kutilayotgan', value: stats.billing.expected, color: C.navyLight },
                  { label: 'Yig\'ilgan', value: stats.billing.collected, color: C.success },
                  { label: 'Qarz', value: stats.billing.debt, color: C.danger },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs" style={{ color: C.textSec }}>{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: C.navy }}>{formatCurrency(item.value)} so'm</span>
                  </div>
                ))}
                {stats.billing.overdue_count > 0 && (
                  <div className="flex items-center justify-between pt-2 mt-1 border-t" style={{ borderColor: C.border }}>
                    <span className="text-xs" style={{ color: C.danger }}>Muddati o'tgan</span>
                    <span className="text-sm font-bold" style={{ color: C.danger }}>{stats.billing.overdue_count} ta</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TIMETABLE / CHARTS */}
      <div className="card overflow-hidden">
        <div className="flex items-center border-b" style={{ borderColor: C.border }}>
          {['timetable', 'charts'].map(tab => (
            (tab === 'charts' && !isOwnerOrAdmin) ? null : (
              <button key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-5 py-3 text-sm font-medium border-b-2 transition-colors"
                style={{
                  borderColor: activeTab === tab ? C.primary : 'transparent',
                  color: activeTab === tab ? C.primary : C.muted,
                }}>
                {tab === 'timetable' ? 'Dars jadvali' : 'Statistika'}
              </button>
            )
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'timetable' ? (
            <Timetable groups={groups} rooms={rooms} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Finance chart */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: C.navy }}>
                  Daromad va xarajatlar <span className="font-normal text-xs" style={{ color: C.muted }}>(oxirgi 12 oy)</span>
                </h3>
                <div className="h-[250px]">
                  {financeChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={financeChart}>
                        <defs>
                          <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={C.success} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={C.success} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={C.danger} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={C.danger} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                        <XAxis dataKey="month" stroke={C.muted} fontSize={11} />
                        <YAxis stroke={C.muted} fontSize={11} tickFormatter={v => formatCurrency(v)} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '12px' }}
                          formatter={v => [`${Number(v).toLocaleString()} so'm`]}
                        />
                        <Area type="monotone" dataKey="income" stroke={C.success} strokeWidth={2} fill="url(#gIncome)" name="Daromad" />
                        <Area type="monotone" dataKey="expense" stroke={C.danger} strokeWidth={2} fill="url(#gExpense)" name="Xarajat" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full" style={{ color: C.muted }}>
                      <p className="text-sm">Ma'lumot topilmadi</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-6 mt-2">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.success }} /><span className="text-[11px]" style={{ color: C.textSec }}>Daromad</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.danger }} /><span className="text-[11px]" style={{ color: C.textSec }}>Xarajat</span></div>
                </div>
              </div>

              {/* Attendance chart */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: C.navy }}>
                  Haftalik davomat
                  <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${C.success}12`, color: C.success }}>
                    {stats?.attendance?.rate || 0}%
                  </span>
                </h3>
                <div className="h-[250px]">
                  {attendanceChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attendanceChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                        <XAxis dataKey="day" stroke={C.muted} fontSize={11} />
                        <YAxis stroke={C.muted} fontSize={11} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '12px' }}
                          formatter={v => [`${v}%`, 'Davomat']}
                        />
                        <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                          {attendanceChart.map((entry, i) => (
                            <Cell key={i} fill={entry.rate >= 80 ? C.success : entry.rate >= 50 ? C.warning : C.danger} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full" style={{ color: C.muted }}>
                      <p className="text-sm">Ma'lumot topilmadi</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* So'nggi faoliyat */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: C.navy }}>So'nggi faoliyat</h3>
          <div className="space-y-1 max-h-[320px] overflow-y-auto">
            {recentActivity.length > 0 ? recentActivity.slice(0, 10).map((item, i) => {
              const icons = { payment: faMoneyBill, student: faUserGraduate, lead: faUserPlus };
              const colors = { payment: C.success, student: C.primary, lead: C.warning };
              return (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: C.border }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${colors[item.type] || C.muted}12` }}>
                    <FontAwesomeIcon icon={icons[item.type] || faClock} className="w-3.5 h-3.5" style={{ color: colors[item.type] || C.muted }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: C.navy }}>{item.title}</p>
                    <p className="text-xs truncate" style={{ color: C.muted }}>{item.description}</p>
                  </div>
                  {item.time && (
                    <span className="text-[10px] whitespace-nowrap flex-shrink-0" style={{ color: C.muted }}>
                      {new Date(item.time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              );
            }) : (
              <p className="text-xs text-center py-6" style={{ color: C.muted }}>Ma'lumot topilmadi</p>
            )}
          </div>
        </div>

        {/* Top guruhlar */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: C.navy }}>Top guruhlar</h3>
            <button onClick={() => navigate('/app/groups')} className="text-xs font-medium" style={{ color: C.primary }}>Barchasi</button>
          </div>
          <div className="space-y-1 max-h-[320px] overflow-y-auto">
            {topGroups.length > 0 ? topGroups.slice(0, 8).map((item, i) => {
              const fillRate = item.fill_rate || 0;
              return (
                <div key={item.id || i} onClick={() => navigate(`/app/groups/${item.id}`)}
                  className="flex items-center gap-3 cursor-pointer rounded-lg p-2 -mx-2 transition-colors hover:bg-[var(--bg-tertiary)]">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      backgroundColor: i === 0 ? '#F97316' : i === 1 ? `${C.primary}30` : i === 2 ? `${C.primary}15` : C.bgSoft,
                      color: i === 0 ? '#fff' : i < 3 ? C.primaryDark : C.textSec,
                    }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: C.navy }}>{item.name}</p>
                    <p className="text-[11px] truncate" style={{ color: C.muted }}>{item.teacher || item.course}</p>
                  </div>
                  <div className="text-right flex-shrink-0 w-16">
                    <p className="text-xs font-semibold" style={{ color: C.navy }}>
                      {item.students_count}/{item.max_students}
                    </p>
                    <div className="w-full h-1.5 rounded-full mt-1" style={{ backgroundColor: C.bgSoft }}>
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${Math.min(fillRate, 100)}%`,
                        backgroundColor: fillRate >= 80 ? C.success : fillRate >= 50 ? C.warning : C.primary,
                      }} />
                    </div>
                  </div>
                </div>
              );
            }) : (
              <p className="text-xs text-center py-6" style={{ color: C.muted }}>Ma'lumot topilmadi</p>
            )}
          </div>
        </div>

        {/* Qarzdorlar + Leadlar */}
        <div className="card p-5">
          {/* Qarzdorlar */}
          <h3 className="text-sm font-semibold mb-3" style={{ color: C.navy }}>Qarzdorlar</h3>
          {debtorsSummary && debtorsSummary.total_debtors > 0 ? (
            <div>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-2xl font-bold" style={{ color: C.danger }}>{debtorsSummary.total_debtors}</p>
                  <p className="text-[11px]" style={{ color: C.muted }}>nafar</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: C.navy }}>{formatCurrency(debtorsSummary.total_debt)} so'm</p>
                  <p className="text-[11px]" style={{ color: C.muted }}>umumiy qarz</p>
                </div>
              </div>
              <div className="space-y-2">
                {(debtorsSummary.by_range || []).map((r, i) => {
                  const pct = debtorsSummary.total_debtors > 0 ? (r.count / debtorsSummary.total_debtors) * 100 : 0;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[11px] w-16 flex-shrink-0" style={{ color: C.muted }}>{r.label}</span>
                      <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: C.bgSoft }}>
                        <div className="h-full rounded-full" style={{
                          width: `${Math.max(pct, 4)}%`,
                          backgroundColor: i <= 1 ? C.warning : C.danger,
                        }} />
                      </div>
                      <span className="text-[11px] font-semibold w-6 text-right" style={{ color: C.navy }}>{r.count}</span>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => navigate('/app/billing')}
                className="w-full mt-3 py-2 text-xs font-medium rounded-lg transition-colors"
                style={{ backgroundColor: `${C.danger}08`, color: C.danger }}>
                Batafsil ko'rish
              </button>
            </div>
          ) : (
            <div className="text-center py-4" style={{ color: C.muted }}>
              <FontAwesomeIcon icon={faCircleCheck} className="w-5 h-5 mb-1" style={{ color: C.success }} />
              <p className="text-xs">Qarzdor yo'q</p>
            </div>
          )}

          {/* Leadlar */}
          {leadsData?.by_status?.length > 0 && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: C.border }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: C.navy }}>Leadlar</h3>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadsData.by_status.map(s => ({
                        name: { new: 'Yangi', contacted: "Bog'langan", trial: 'Sinov', converted: 'Konvert', lost: "Yo'qotilgan" }[s.status] || s.status,
                        value: s.count,
                      }))}
                      cx="50%" cy="50%"
                      innerRadius={40} outerRadius={65}
                      paddingAngle={3} dataKey="value"
                    >
                      {leadsData.by_status.map((s, i) => (
                        <Cell key={i} fill={{
                          new: C.primary, contacted: C.warning, trial: C.navyLight, converted: C.success, lost: C.danger
                        }[s.status] || C.muted} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '12px' }}
                      formatter={v => [`${v} ta`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                {leadsData.by_status.map((s, i) => {
                  const colors = { new: C.primary, contacted: C.warning, trial: C.navyLight, converted: C.success, lost: C.danger };
                  const labels = { new: 'Yangi', contacted: "Bog'langan", trial: 'Sinov', converted: 'Konvert', lost: "Yo'qotilgan" };
                  return (
                    <div key={i} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[s.status] || C.muted }} />
                      <span className="text-[10px]" style={{ color: C.muted }}>{labels[s.status] || s.status} ({s.count})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
