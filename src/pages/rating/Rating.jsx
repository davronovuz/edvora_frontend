import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faSearch, faMedal, faTrophy, faAward } from '@fortawesome/free-solid-svg-icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '@/services/api';

export default function Rating() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // table | chart
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
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
    fetchRating();
  }, [filterGroup, dateFrom, dateTo]);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups/', { params: { status: 'active', page_size: 100 } });
      setGroups(res.data?.data || res.data?.results || []);
    } catch {}
  };

  const fetchRating = async () => {
    setLoading(true);
    try {
      const params = { date_from: dateFrom, date_to: dateTo };
      if (filterGroup) params.group = filterGroup;

      // Try rating endpoint first, fallback to students with exam scores
      let data = [];
      try {
        const res = await api.get('/analytics/reports/student_rating/', { params });
        data = res.data?.data || res.data?.results || [];
      } catch {
        // Fallback: get students and their exam results
        const studentsRes = await api.get('/students/', { params: { page_size: 100 } });
        const allStudents = studentsRes.data?.data || studentsRes.data?.results || [];

        // Try to get exam results
        try {
          const examsRes = await api.get('/exams/results/', { params: { page_size: 500 } });
          const results = examsRes.data?.data || examsRes.data?.results || [];

          // Calculate average score per student
          const scoreMap = {};
          results.forEach(r => {
            if (!scoreMap[r.student]) scoreMap[r.student] = { total: 0, count: 0 };
            scoreMap[r.student].total += Number(r.score || 0);
            scoreMap[r.student].count += 1;
          });

          data = allStudents.map(s => ({
            id: s.id,
            name: `${s.first_name} ${s.last_name}`,
            group_name: s.group_names?.join(', ') || s.groups?.[0]?.name || '-',
            score: scoreMap[s.id] ? Math.round(scoreMap[s.id].total / scoreMap[s.id].count) : 0,
            exams_count: scoreMap[s.id]?.count || 0,
          }));
        } catch {
          data = allStudents.map(s => ({
            id: s.id,
            name: `${s.first_name} ${s.last_name}`,
            group_name: '-',
            score: 0,
            exams_count: 0,
          }));
        }
      }

      // Sort by score descending
      data.sort((a, b) => (b.score || 0) - (a.score || 0));
      setStudents(data);
    } catch {
      toast.error("Ma'lumotlarni yuklashda xato");
    }
    setLoading(false);
  };

  const filtered = students.filter(s => {
    if (search && !s.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getMedalIcon = (index) => {
    if (index === 0) return <FontAwesomeIcon icon={faTrophy} className="w-4 h-4 text-yellow-500" />;
    if (index === 1) return <FontAwesomeIcon icon={faMedal} className="w-4 h-4 text-gray-400" />;
    if (index === 2) return <FontAwesomeIcon icon={faAward} className="w-4 h-4 text-amber-600" />;
    return <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{index + 1}</span>;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#22C55E';
    if (score >= 60) return '#EAB308';
    if (score >= 40) return '#F97316';
    return '#EF4444';
  };

  // Chart data (top 20)
  const chartData = filtered.slice(0, 20).map(s => ({
    name: s.name?.split(' ')[0] || '',
    score: s.score || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reyting</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>O'quvchilar reytingi va baholari</p>
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

        {/* View Toggle */}
        <div className="flex gap-1 mt-3">
          <button onClick={() => setViewMode('chart')} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === 'chart' ? 'bg-primary-600 text-white' : ''}`} style={viewMode !== 'chart' ? { color: 'var(--text-secondary)' } : {}}>
            Grafik
          </button>
          <button onClick={() => setViewMode('table')} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-primary-600 text-white' : ''}`} style={viewMode !== 'table' ? { color: 'var(--text-secondary)' } : {}}>
            Jadval
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} />
        </div>
      ) : viewMode === 'chart' ? (
        /* Chart View */
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top 20 o'quvchilar reytingi</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} width={55} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} formatter={(value) => [`${value} ball`, 'Baho']} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <th className="px-4 py-3 text-left font-medium w-16" style={{ color: 'var(--text-muted)' }}>N</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-muted)' }}>Ism</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-muted)' }}>Guruh</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: 'var(--text-muted)' }}>Baho</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center" style={{ color: 'var(--text-muted)' }}>Ma'lumot yo'q</td></tr>
                ) : filtered.map((s, i) => (
                  <tr key={s.id} className="border-t hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-4 py-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={i < 3 ? { backgroundColor: i === 0 ? '#FEF3C7' : i === 1 ? '#F3F4F6' : '#FEF3C7' } : {}}>
                        {getMedalIcon(i)}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.group_name}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(s.score, 100)}%`, backgroundColor: getScoreColor(s.score) }} />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: getScoreColor(s.score) }}>{s.score}</span>
                      </div>
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
