import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faSearch, faEdit, faTrash, faTimes, faPhone, faEnvelope,
  faUser, faChevronRight, faEye, faComment, faCalendarAlt, faFlag,
  faArrowRight, faPhoneAlt, faSms, faHandshake, faClipboard, faStar
} from '@fortawesome/free-solid-svg-icons';
import { faTelegram, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { leadsService, leadActivitiesService } from '@/services/leads';
import api from '@/services/api';

const statusConfig = {
  new: { label: 'Yangi', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  contacted: { label: "Bog'lanildi", color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  interested: { label: 'Qiziqgan', color: '#EAB308', bg: 'rgba(234,179,8,0.15)' },
  trial: { label: 'Sinov darsi', color: '#F97316', bg: 'rgba(249,115,22,0.15)' },
  negotiation: { label: 'Muzokara', color: '#EC4899', bg: 'rgba(236,72,153,0.15)' },
  converted: { label: 'Konvertatsiya', color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  lost: { label: 'Yo\'qotildi', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
};

const sourceOptions = [
  { value: 'website', label: 'Website' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'referral', label: 'Tavsiya' },
  { value: 'walk_in', label: "O'zi kelgan" },
  { value: 'phone', label: 'Telefon' },
  { value: 'other', label: 'Boshqa' },
];

const priorityConfig = {
  low: { label: 'Past', color: '#94A3B8' },
  medium: { label: "O'rta", color: '#EAB308' },
  high: { label: 'Yuqori', color: '#EF4444' },
};

const activityTypes = [
  { value: 'call', label: "Qo'ng'iroq", icon: faPhoneAlt },
  { value: 'sms', label: 'SMS', icon: faSms },
  { value: 'email', label: 'Email', icon: faEnvelope },
  { value: 'meeting', label: 'Uchrashuv', icon: faHandshake },
  { value: 'trial', label: 'Sinov darsi', icon: faStar },
  { value: 'note', label: 'Eslatma', icon: faClipboard },
];

function Modal({ isOpen, onClose, title, children, wide }) {
  if (!isOpen) return null;
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto rounded-2xl p-6`} style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5">
            <FontAwesomeIcon icon={faTimes} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

const emptyForm = { first_name: '', last_name: '', phone: '', email: '', interested_course: '', source: 'phone', priority: 'medium', status: 'new', notes: '' };

export default function Leads() {
  const { t } = useTranslation();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [viewLead, setViewLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [showActivity, setShowActivity] = useState(false);
  const [activityForm, setActivityForm] = useState({ activity_type: 'call', description: '' });
  const [viewMode, setViewMode] = useState('table'); // table or pipeline

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      const res = await leadsService.getAll(params);
      setLeads(res.data?.data || res.data?.results || []);
    } catch { toast.error("Leadlarni yuklashda xato"); }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const [c, u] = await Promise.all([api.get('/courses/'), api.get('/users/')]);
        setCourses(c.data?.data || c.data?.results || []);
        setUsers(u.data?.data || u.data?.results || []);
      } catch {}
    })();
  }, []);

  useEffect(() => { fetchLeads(); }, [search, filterStatus, filterPriority]);

  const handleSave = async () => {
    try {
      const payload = { ...form };
      if (!payload.email) delete payload.email;
      if (!payload.interested_course) delete payload.interested_course;
      if (editId) { await leadsService.update(editId, payload); toast.success("Lead yangilandi"); }
      else { await leadsService.create(payload); toast.success("Lead qo'shildi"); }
      setShowForm(false); setEditId(null); setForm(emptyForm); fetchLeads();
    } catch (e) { toast.error(e.response?.data?.error?.message || "Xato"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    try { await leadsService.delete(id); toast.success("O'chirildi"); fetchLeads(); }
    catch { toast.error("Xato"); }
  };

  const handleStatusChange = async (id, status) => {
    try { await leadsService.update(id, { status }); toast.success("Holat yangilandi"); fetchLeads(); }
    catch { toast.error("Xato"); }
  };

  const openDetails = async (lead) => {
    setViewLead(lead);
    try {
      const res = await leadActivitiesService.getAll({ lead: lead.id });
      setActivities(res.data?.data || res.data?.results || []);
    } catch {}
  };

  const handleAddActivity = async () => {
    try {
      await leadActivitiesService.create({ ...activityForm, lead: viewLead.id });
      toast.success("Faoliyat qo'shildi");
      setShowActivity(false);
      setActivityForm({ activity_type: 'call', description: '' });
      const res = await leadActivitiesService.getAll({ lead: viewLead.id });
      setActivities(res.data?.data || res.data?.results || []);
    } catch { toast.error("Xato"); }
  };

  // Pipeline view grouped by status
  const pipelineStatuses = ['new', 'contacted', 'interested', 'trial', 'negotiation', 'converted', 'lost'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('nav.leads')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Potensial o'quvchilarni boshqaring</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode(viewMode === 'table' ? 'pipeline' : 'table')} className="px-4 py-2.5 rounded-xl border font-medium text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
            {viewMode === 'table' ? 'Pipeline' : 'Jadval'}
          </button>
          <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>
            <FontAwesomeIcon icon={faPlus} /> Yangi lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..." className="w-full h-11 pl-11 pr-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="">Barcha holatlar</option>
          {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="">Barcha muhimlik</option>
          {Object.entries(priorityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} /></div>
      ) : viewMode === 'pipeline' ? (
        /* Pipeline View */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineStatuses.map(status => {
            const cfg = statusConfig[status];
            const items = leads.filter(l => l.status === status);
            return (
              <div key={status} className="min-w-[280px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-3 px-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{cfg.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.color }}>{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map(lead => (
                    <div key={lead.id} onClick={() => openDetails(lead)} className="rounded-xl p-4 border cursor-pointer hover:shadow-md transition-all" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{lead.first_name} {lead.last_name}</span>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityConfig[lead.priority]?.color }} />
                      </div>
                      {lead.phone && <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}><FontAwesomeIcon icon={faPhone} className="w-3 h-3 mr-1" />{lead.phone}</div>}
                      {lead.interested_course_name && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{lead.interested_course_name}</div>}
                      <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{sourceOptions.find(s => s.value === lead.source)?.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <table className="w-full">
            <thead><tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
              {['Ism', 'Telefon', 'Kurs', 'Manba', 'Muhimlik', 'Holat', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} className="border-b hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer" style={{ borderColor: 'var(--border-color)' }} onClick={() => openDetails(lead)}>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{lead.first_name} {lead.last_name}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{lead.phone}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{lead.interested_course_name || '—'}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{sourceOptions.find(s => s.value === lead.source)?.label || lead.source}</td>
                  <td className="px-4 py-3"><span style={{ color: priorityConfig[lead.priority]?.color, fontWeight: 600, fontSize: '13px' }}><FontAwesomeIcon icon={faFlag} className="mr-1" />{priorityConfig[lead.priority]?.label}</span></td>
                  <td className="px-4 py-3"><span style={{ color: statusConfig[lead.status]?.color, backgroundColor: statusConfig[lead.status]?.bg, padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>{statusConfig[lead.status]?.label}</span></td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setForm({ first_name: lead.first_name, last_name: lead.last_name, phone: lead.phone, email: lead.email || '', interested_course: lead.interested_course || '', source: lead.source, priority: lead.priority, status: lead.status, notes: lead.notes || '' }); setEditId(lead.id); setShowForm(true); }} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faEdit} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} /></button>
                      <button onClick={() => handleDelete(lead.id)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faTrash} className="w-4 h-4" style={{ color: '#EF4444' }} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>Leadlar topilmadi</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead Form Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditId(null); }} title={editId ? "Lead tahrirlash" : "Yangi lead"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Ism *</label>
              <input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Familiya *</label>
              <input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Telefon *</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} placeholder="+998..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Qiziqtirayotgan kurs</label>
            <select value={form.interested_course} onChange={e => setForm({ ...form, interested_course: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">Tanlang</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Manba</label>
              <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                {sourceOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Muhimlik</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                {Object.entries(priorityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Holat</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Izoh</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="flex-1 h-11 rounded-xl border font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Bekor</button>
            <button onClick={handleSave} className="flex-1 h-11 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>Saqlash</button>
          </div>
        </div>
      </Modal>

      {/* Lead Details Modal */}
      <Modal isOpen={!!viewLead} onClose={() => setViewLead(null)} title="Lead tafsilotlari" wide>
        {viewLead && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Ism</div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{viewLead.first_name} {viewLead.last_name}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Telefon</div>
                <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{viewLead.phone}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Holat</div>
                <div><span style={{ color: statusConfig[viewLead.status]?.color, backgroundColor: statusConfig[viewLead.status]?.bg, padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>{statusConfig[viewLead.status]?.label}</span></div>
              </div>
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Muhimlik</div>
                <div className="text-sm font-medium" style={{ color: priorityConfig[viewLead.priority]?.color }}>{priorityConfig[viewLead.priority]?.label}</div>
              </div>
            </div>

            {/* Status Change Buttons */}
            <div>
              <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Holatni o'zgartirish</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusConfig).filter(([k]) => k !== viewLead.status).map(([k, v]) => (
                  <button key={k} onClick={() => { handleStatusChange(viewLead.id, k); setViewLead({ ...viewLead, status: k }); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                    style={{ color: v.color, backgroundColor: v.bg }}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Activities */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Faoliyatlar</span>
                <button onClick={() => setShowActivity(true)} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ color: 'var(--primary-600)', backgroundColor: 'rgba(59,130,246,0.1)' }}>
                  <FontAwesomeIcon icon={faPlus} className="mr-1" /> Qo'shish
                </button>
              </div>
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map(a => (
                    <div key={a.id} className="flex gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
                        <FontAwesomeIcon icon={activityTypes.find(t => t.value === a.activity_type)?.icon || faClipboard} className="w-4 h-4" style={{ color: 'var(--primary-600)' }} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{activityTypes.find(t => t.value === a.activity_type)?.label || a.activity_type}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{a.description}</div>
                        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleString('uz-UZ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>Faoliyatlar yo'q</div>
              )}
            </div>

            {/* Add Activity Form */}
            {showActivity && (
              <div className="border-t pt-4 space-y-3" style={{ borderColor: 'var(--border-color)' }}>
                <select value={activityForm.activity_type} onChange={e => setActivityForm({ ...activityForm, activity_type: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                  {activityTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <textarea value={activityForm.description} onChange={e => setActivityForm({ ...activityForm, description: e.target.value })} rows={2} placeholder="Tavsif..." className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                <div className="flex gap-2">
                  <button onClick={() => setShowActivity(false)} className="px-4 py-2 rounded-xl border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Bekor</button>
                  <button onClick={handleAddActivity} className="px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>Saqlash</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}