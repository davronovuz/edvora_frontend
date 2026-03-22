import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faSearch, faEdit, faTrash, faTimes, faMapMarkerAlt, faPhone,
  faClock, faUsers, faChalkboardTeacher, faDoorOpen, faLayerGroup, faStar, faChartBar
} from '@fortawesome/free-solid-svg-icons';
import { branchesService } from '@/services/branches';

const statusConfig = {
  active: { color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  inactive: { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
};

const emptyForm = {
  name: '', address: '', phone: '', city: '', district: '', landmark: '',
  latitude: '', longitude: '', manager_name: '', manager_phone: '',
  working_hours: { open: '09:00', close: '21:00' },
  working_days: [0, 1, 2, 3, 4, 5],
  status: 'active', is_main: false,
};

const dayNames = { uz: ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'], ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'], en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] };

export default function Branches() {
  const { t, i18n } = useTranslation();
  const days = dayNames[i18n.language] || dayNames.uz;

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showStats, setShowStats] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await branchesService.getAll(params);
      setBranches(res.data?.data || res.data?.results || []);
    } catch { toast.error('Xato'); }
    setLoading(false);
  };

  useEffect(() => { fetchBranches(); }, []);
  useEffect(() => { fetchBranches(); }, [search]);

  const handleSave = async () => {
    try {
      const payload = { ...form };
      if (!payload.latitude) delete payload.latitude;
      if (!payload.longitude) delete payload.longitude;
      if (!payload.landmark) delete payload.landmark;
      if (editId) { await branchesService.update(editId, payload); toast.success(t('branches.title') + ' ' + t('common.updated')); }
      else { await branchesService.create(payload); toast.success(t('branches.title') + ' ' + t('common.created')); }
      setShowForm(false); setEditId(null); setForm(emptyForm); fetchBranches();
    } catch (e) { toast.error(e.response?.data?.error?.message || 'Xato'); }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('common.delete') + '?')) return;
    try { await branchesService.delete(id); toast.success(t('common.delete') + ' ✓'); fetchBranches(); }
    catch { toast.error('Xato'); }
  };

  const handleEdit = (b) => {
    setForm({
      name: b.name, address: b.address || '', phone: b.phone || '', city: b.city || '',
      district: b.district || '', landmark: b.landmark || '', latitude: b.latitude || '',
      longitude: b.longitude || '', manager_name: b.manager_name || '', manager_phone: b.manager_phone || '',
      working_hours: b.working_hours || { open: '09:00', close: '21:00' },
      working_days: b.working_days || [0, 1, 2, 3, 4, 5],
      status: b.status, is_main: b.is_main || false,
    });
    setEditId(b.id); setShowForm(true);
  };

  const viewStats = async (branch) => {
    try {
      const res = await branchesService.getStatistics(branch.id);
      setStats(res.data?.data || res.data);
      setShowStats(branch);
    } catch { toast.error('Xato'); }
  };

  const toggleDay = (d) => {
    setForm(f => ({
      ...f,
      working_days: f.working_days.includes(d) ? f.working_days.filter(x => x !== d) : [...f.working_days, d]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('branches.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{branches.length} ta {t('branches.title').toLowerCase()}</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>
          <FontAwesomeIcon icon={faPlus} /> {t('branches.addBranch')}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('common.search')} className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
      </div>

      {/* Branch Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} /></div>
      ) : branches.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <FontAwesomeIcon icon={faMapMarkerAlt} className="w-12 h-12 mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.noData')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(b => (
            <div key={b.id} className="rounded-2xl border p-5 hover:shadow-md transition-shadow" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{b.name}</h3>
                  {b.is_main && (
                    <FontAwesomeIcon icon={faStar} className="w-3.5 h-3.5 text-amber-500" title={t('branches.mainBranch')} />
                  )}
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ color: statusConfig[b.status]?.color, backgroundColor: statusConfig[b.status]?.bg }}>
                  {b.status === 'active' ? t('common.active') : t('common.inactive')}
                </span>
              </div>

              {b.address && (
                <div className="flex items-start gap-2 mb-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{b.city && `${b.city}, `}{b.address}</p>
                </div>
              )}

              {b.phone && (
                <div className="flex items-center gap-2 mb-2">
                  <FontAwesomeIcon icon={faPhone} className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{b.phone}</p>
                </div>
              )}

              {b.working_hours && (
                <div className="flex items-center gap-2 mb-3">
                  <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{b.working_hours.open} — {b.working_hours.close}</p>
                </div>
              )}

              {b.manager_name && (
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{t('branches.manager')}: {b.manager_name}</p>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-4 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <FontAwesomeIcon icon={faLayerGroup} className="w-3 h-3" /> {b.groups_count || 0}
                </div>
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <FontAwesomeIcon icon={faUsers} className="w-3 h-3" /> {b.students_count || 0}
                </div>
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <FontAwesomeIcon icon={faChalkboardTeacher} className="w-3 h-3" /> {b.teachers_count || 0}
                </div>
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <FontAwesomeIcon icon={faDoorOpen} className="w-3 h-3" /> {b.rooms_count || 0}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 mt-3">
                <button onClick={() => viewStats(b)} className="flex-1 py-2 rounded-lg text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5" style={{ color: 'var(--primary-600)' }}>
                  <FontAwesomeIcon icon={faChartBar} className="mr-1" /> {t('branches.statistics')}
                </button>
                <button onClick={() => handleEdit(b)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title={t('common.edit')}>
                  <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5 text-amber-500" />
                </button>
                <button onClick={() => handleDelete(b.id)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title={t('common.delete')}>
                  <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg mx-4 rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{editId ? t('common.edit') : t('branches.addBranch')}</h2>
              <button onClick={() => setShowForm(false)}><FontAwesomeIcon icon={faTimes} style={{ color: 'var(--text-secondary)' }} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('common.name')} *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('common.address')}</label>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('branches.city')}</label>
                  <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('branches.district')}</label>
                  <input value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('common.phone')}</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+998..." className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('common.status')}</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                    <option value="active">{t('common.active')}</option>
                    <option value="inactive">{t('common.inactive')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('branches.manager')}</label>
                  <input value={form.manager_name} onChange={e => setForm({ ...form, manager_name: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('branches.manager')} {t('common.phone').toLowerCase()}</label>
                  <input value={form.manager_phone} onChange={e => setForm({ ...form, manager_phone: e.target.value })} placeholder="+998..." className="w-full px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('branches.workingHours')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="time" value={form.working_hours?.open || '09:00'} onChange={e => setForm({ ...form, working_hours: { ...form.working_hours, open: e.target.value } })} className="px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                  <input type="time" value={form.working_hours?.close || '21:00'} onChange={e => setForm({ ...form, working_hours: { ...form.working_hours, close: e.target.value } })} className="px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('groups.days')}</label>
                <div className="flex gap-1.5">
                  {days.map((d, i) => (
                    <button key={i} onClick={() => toggleDay(i)} className={`w-9 h-9 rounded-lg text-xs font-medium transition-colors ${form.working_days.includes(i) ? 'bg-blue-500 text-white' : 'border'}`} style={!form.working_days.includes(i) ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' } : {}}>{d}</button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_main} onChange={e => setForm({ ...form, is_main: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{t('branches.mainBranch')}</span>
              </label>
              <button onClick={handleSave} className="w-full py-2.5 rounded-lg text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>
                {editId ? t('common.save') : t('branches.addBranch')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStats && stats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowStats(null)}>
          <div className="w-full max-w-md mx-4 rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-secondary)' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{showStats.name} — {t('branches.statistics')}</h2>
              <button onClick={() => setShowStats(null)}><FontAwesomeIcon icon={faTimes} style={{ color: 'var(--text-secondary)' }} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t('groups.title'), value: stats.groups_count || 0, icon: faLayerGroup, color: '#3B82F6' },
                { label: t('students.title'), value: stats.students_count || 0, icon: faUsers, color: '#22C55E' },
                { label: t('teachers.title'), value: stats.teachers_count || 0, icon: faChalkboardTeacher, color: '#F97316' },
                { label: t('nav.rooms'), value: stats.rooms_count || 0, icon: faDoorOpen, color: '#8B5CF6' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-4 border text-center" style={{ borderColor: 'var(--border-color)' }}>
                  <FontAwesomeIcon icon={s.icon} className="w-5 h-5 mb-2" style={{ color: s.color }} />
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
