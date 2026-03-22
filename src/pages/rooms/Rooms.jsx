import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faSearch, faEdit, faTrash, faTimes, faDoorOpen, faUsers,
  faDesktop, faChalkboard, faSnowflake, faProjectDiagram, faCalendarAlt,
  faCheckCircle, faWrench, faBan
} from '@fortawesome/free-solid-svg-icons';
import { roomsService } from '@/services/rooms';

const statusConfig = {
  active: { label: 'Faol', color: '#22C55E', bg: 'rgba(34,197,94,0.15)', icon: faCheckCircle },
  maintenance: { label: 'Ta\'mirda', color: '#EAB308', bg: 'rgba(234,179,8,0.15)', icon: faWrench },
  inactive: { label: 'Nofaol', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', icon: faBan },
};

const typeConfig = {
  classroom: { label: 'Sinf xonasi', icon: faChalkboard },
  lab: { label: 'Laboratoriya', icon: faDesktop },
  conference: { label: 'Konferens-zal', icon: faUsers },
  office: { label: 'Ofis', icon: faDoorOpen },
};

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faTimes} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>
        {children}
      </div>
    </>
  );
}

const emptyForm = { name: '', number: '', floor: 1, room_type: 'classroom', capacity: 20, status: 'active', has_projector: false, has_whiteboard: true, has_computers: false, has_air_conditioning: false, description: '' };

export default function Rooms() {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showSchedule, setShowSchedule] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterType) params.room_type = filterType;
      if (filterStatus) params.status = filterStatus;
      const res = await roomsService.getAll(params);
      setRooms(res.data?.data || res.data?.results || []);
    } catch { toast.error("Xonalarni yuklashda xato"); }
    setLoading(false);
  };

  useEffect(() => { fetchRooms(); }, [search, filterType, filterStatus]);

  const handleSave = async () => {
    try {
      if (editId) { await roomsService.update(editId, form); toast.success("Xona yangilandi"); }
      else { await roomsService.create(form); toast.success("Xona yaratildi"); }
      setShowForm(false); setEditId(null); setForm(emptyForm); fetchRooms();
    } catch (e) { toast.error(e.response?.data?.error?.message || "Xato"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    try { await roomsService.delete(id); toast.success("O'chirildi"); fetchRooms(); }
    catch { toast.error("Xato"); }
  };

  const viewSchedule = async (room) => {
    setShowSchedule(room);
    try {
      const res = await roomsService.getSchedule(room.id, scheduleDate);
      setSchedule(res.data?.data || res.data?.results || res.data || []);
    } catch { setSchedule([]); }
  };

  useEffect(() => { if (showSchedule) viewSchedule(showSchedule); }, [scheduleDate]);

  const equipmentIcons = [
    { key: 'has_projector', label: 'Proyektor', icon: faProjectDiagram },
    { key: 'has_whiteboard', label: 'Doska', icon: faChalkboard },
    { key: 'has_computers', label: 'Kompyuterlar', icon: faDesktop },
    { key: 'has_air_conditioning', label: 'Konditsioner', icon: faSnowflake },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('nav.rooms')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>O'quv xonalarini boshqaring</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>
          <FontAwesomeIcon icon={faPlus} /> {t('nav.rooms')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..." className="w-full h-11 pl-11 pr-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="">Barcha turlar</option>
          {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="">Barcha holatlar</option>
          {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Room Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} /></div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>Xonalar topilmadi</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map(room => {
            const type = typeConfig[room.room_type] || typeConfig.classroom;
            const status = statusConfig[room.status] || statusConfig.active;
            return (
              <div key={room.id} className="rounded-2xl border p-5 hover:shadow-lg transition-all" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
                      <FontAwesomeIcon icon={type.icon} className="w-5 h-5" style={{ color: 'var(--primary-600)' }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{room.name}</h3>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#{room.number} | {room.floor}-qavat</p>
                    </div>
                  </div>
                  <span style={{ color: status.color, backgroundColor: status.bg, padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 500 }}>{status.label}</span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <FontAwesomeIcon icon={faUsers} className="w-3.5 h-3.5" /> {room.capacity} o'rin
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{type.label}</div>
                </div>

                {/* Equipment */}
                <div className="flex gap-2 mb-4">
                  {equipmentIcons.map(eq => (
                    <div key={eq.key} className="w-8 h-8 rounded-lg flex items-center justify-center" title={eq.label}
                      style={{ backgroundColor: room[eq.key] ? 'rgba(34,197,94,0.1)' : 'var(--bg-tertiary)', color: room[eq.key] ? '#22C55E' : 'var(--text-muted)' }}>
                      <FontAwesomeIcon icon={eq.icon} className="w-3.5 h-3.5" />
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <button onClick={() => viewSchedule(room)} className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ color: 'var(--primary-600)', backgroundColor: 'rgba(59,130,246,0.1)' }}>
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" /> Jadval
                  </button>
                  <button onClick={() => { setForm({ name: room.name, number: room.number, floor: room.floor, room_type: room.room_type, capacity: room.capacity, status: room.status, has_projector: room.has_projector, has_whiteboard: room.has_whiteboard, has_computers: room.has_computers, has_air_conditioning: room.has_air_conditioning, description: room.description || '' }); setEditId(room.id); setShowForm(true); }} className="py-2 px-3 rounded-lg text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button onClick={() => handleDelete(room.id)} className="py-2 px-3 rounded-lg text-xs" style={{ color: '#EF4444' }}>
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Room Form Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditId(null); }} title={editId ? "Xonani tahrirlash" : "Yangi xona"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Nomi *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Raqami *</label>
              <input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} placeholder="101" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Qavat</label>
              <input type="number" min={1} value={form.floor} onChange={e => setForm({ ...form, floor: parseInt(e.target.value) })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Sig'imi</label>
              <input type="number" min={1} value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Turi</label>
              <select value={form.room_type} onChange={e => setForm({ ...form, room_type: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Jihozlar</label>
            <div className="grid grid-cols-2 gap-3">
              {equipmentIcons.map(eq => (
                <label key={eq.key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form[eq.key]} onChange={e => setForm({ ...form, [eq.key]: e.target.checked })} className="w-4 h-4 rounded" />
                  <FontAwesomeIcon icon={eq.icon} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{eq.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Tavsif</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="flex-1 h-11 rounded-xl border font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Bekor</button>
            <button onClick={handleSave} className="flex-1 h-11 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>Saqlash</button>
          </div>
        </div>
      </Modal>

      {/* Schedule Modal */}
      <Modal isOpen={!!showSchedule} onClose={() => setShowSchedule(null)} title={`${showSchedule?.name} - Jadval`}>
        <div className="space-y-4">
          <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          {schedule.length > 0 ? (
            <div className="space-y-2">
              {schedule.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.group_name || s.group}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.teacher_name || ''}</div>
                  </div>
                  <div className="text-sm font-medium" style={{ color: 'var(--primary-600)' }}>{s.start_time} - {s.end_time}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Bu kunga jadval yo'q</div>
          )}
        </div>
      </Modal>
    </div>
  );
}