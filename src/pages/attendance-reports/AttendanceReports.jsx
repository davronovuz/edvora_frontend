import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFileExport, faFilter, faChartBar } from '@fortawesome/free-solid-svg-icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '@/services/api';
import { attendanceService } from '@/services/attendance';

export default function AttendanceReports() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [groups, setGroups] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [filterGroup, setFilterGroup] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [filterGroup, dateFrom, dateTo]);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups/', { params: { page_size: 100 } });
      setGroups(res.data?.data || res.data?.results || []);
    } catch {}
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {
        date_from: dateFrom,
        date_to: dateTo,
        page_size: 500,
      };
      if (filterGroup) params.group = filterGroup;

      // Try report endpoint first
      let data = [];
      try {
        const res = await attendanceService.report(params);
        data = res.data?.data || res.data?.results || [];
      } catch {
        // Fallback: get raw attendance and aggregate
        const res = await api.get('/attendance/', { params });
        const rawData = res.data?.data || res.data?.results || [];

        // Aggregate by student
        const studentMap = {};
        rawData.forEach(a => {
          const key = a.student || a.student_id;
          if (!studentMap[key]) {
            studentMap[key] = {
              id: key,
              student_name: a.student_name || `Talaba #${key}`,
              group_name: a.group_name || '-',
              present: 0,
              absent: 0,
              late: 0,
              total: 0,
            };
          }
          studentMap[key].total++;
          if (a.status === 'present') studentMap[key].present++;
          else if (a.status === 'absent') studentMap[key].absent++;
          else if (a.status === 'late') studentMap[key].late++;
        });

        data = Object.values(studentMap).map(s => ({
          ...s,
          rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
        }));
      }

      // Sort by attendance rate descending
      data.sort((a, b) => (b.rate || 0) - (a.rate || 0));
      setReportData(data);
    } catch {
      toast.error("Hisobotni yuklashda xato");
    }
    setLoading(false);
  };

  const filtered = reportData.filter(s => {
    if (search && !s.student_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getRateColor = (rate) => {
    if (rate >= 80) return '#22C55E';
    if (rate >= 60) return '#EAB308';
    if (rate >= 40) return '#F97316';
    return '#EF4444';
  };

  const totalPresent = filtered.reduce((sum, s) => sum + (s.present || 0), 0);
  const totalAbsent = filtered.reduce((sum, s) => sum + (s.absent || 0), 0);
  const totalLate = filtered.reduce((sum, s) => sum + (s.late || 0), 0);
  const totalAll = filtered.reduce((sum, s) => sum + (s.total || 0), 0);
  const avgRate = totalAll > 0 ? Math.round((totalPresent / totalAll) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Davomat hisobotlari</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>O'quvchilar davomati bo'yicha hisobotlar</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card p-4 border-t-4" style={{ borderTopColor: '#22C55E' }}>
          <div className="text-xl font-bold text-green-600">{totalPresent}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Kelgan</div>
        </div>
        <div className="card p-4 border-t-4" style={{ borderTopColor: '#EF4444' }}>
          <div className="text-xl font-bold text-red-500">{totalAbsent}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Kelmagan</div>
        </div>
        <div className="card p-4 border-t-4" style={{ borderTopColor: '#EAB308' }}>
          <div className="text-xl font-bold text-yellow-500">{totalLate}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Kechikkan</div>
        </div>
        <div className="card p-4 border-t-4" style={{ borderTopColor: '#3B82F6' }}>
          <div className="text-xl font-bold text-blue-500">{totalAll}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Jami</div>
        </div>
        <div className="card p-4 border-t-4" style={{ borderTopColor: '#8B5CF6' }}>
          <div className="text-xl font-bold text-purple-500">{avgRate}%</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>O'rtacha davomat</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Boshlanish</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-10 px-3 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Tugash</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-10 px-3 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Guruh</label>
            <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} className="w-full h-10 px-3 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">Barcha guruhlar</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Qidirish</label>
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism bo'yicha..." className="w-full h-10 pl-9 pr-3 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
        </div>

        <div className="flex gap-1 mt-3">
          <button onClick={() => setViewMode('table')} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-primary-600 text-white' : ''}`} style={viewMode !== 'table' ? { color: 'var(--text-secondary)' } : {}}>
            Jadval
          </button>
          <button onClick={() => setViewMode('chart')} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === 'chart' ? 'bg-primary-600 text-white' : ''}`} style={viewMode !== 'chart' ? { color: 'var(--text-secondary)' } : {}}>
            Grafik
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} />
        </div>
      ) : viewMode === 'chart' ? (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Davomat foizi</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filtered.slice(0, 30)} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} />
                <YAxis type="category" dataKey="student_name" stroke="var(--text-muted)" fontSize={10} width={75} tickFormatter={v => v?.split(' ')[0] || ''} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} formatter={(value) => [`${value}%`, 'Davomat']} />
                <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                  {filtered.slice(0, 30).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getRateColor(entry.rate)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <th className="px-4 py-3 text-left font-medium w-10" style={{ color: 'var(--text-muted)' }}>N</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-muted)' }}>Ism</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-muted)' }}>Guruh</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: 'var(--text-muted)' }}>Kelgan</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: 'var(--text-muted)' }}>Kelmagan</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: 'var(--text-muted)' }}>Kechikkan</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: 'var(--text-muted)' }}>Davomat</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: 'var(--text-muted)' }}>Holat</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center" style={{ color: 'var(--text-muted)' }}>Ma'lumot yo'q</td></tr>
                ) : filtered.map((s, i) => (
                  <tr key={s.id} className="border-t hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{s.student_name}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.group_name}</td>
                    <td className="px-4 py-3 text-center font-medium text-green-600">{s.present}</td>
                    <td className="px-4 py-3 text-center font-medium text-red-500">{s.absent}</td>
                    <td className="px-4 py-3 text-center font-medium text-yellow-500">{s.late || 0}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(s.rate, 100)}%`, backgroundColor: getRateColor(s.rate) }} />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: getRateColor(s.rate) }}>{s.rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                        color: getRateColor(s.rate),
                        backgroundColor: `${getRateColor(s.rate)}15`,
                      }}>
                        {s.rate >= 80 ? "A'lo" : s.rate >= 60 ? "Yaxshi" : s.rate >= 40 ? "Qoniqarli" : "Yomon"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
