import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faTimes, faClock, faExclamationTriangle, faCalendarAlt,
  faCheck, faEdit, faTrash, faUser, faPhone, faBell,
} from '@fortawesome/free-solid-svg-icons';
import api from '@/services/api';

export default function Reminders() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', due_date: '', priority: 'medium', related_student: '', related_type: 'payment',
  });
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchReminders();
    fetchStudents();
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      // Try notifications endpoint as reminders
      const res = await api.get('/notifications/', { params: { page_size: 200 } });
      const data = res.data?.data || res.data?.results || [];
      setReminders(data);
    } catch {
      // Fallback: generate reminders from students with debts
      try {
        const debtors = await api.get('/students/', { params: { has_debt: true, page_size: 100 } });
        const debtStudents = debtors.data?.data || debtors.data?.results || [];
        const generated = debtStudents.map(s => ({
          id: s.id,
          title: `To'lov eslatmasi: ${s.first_name} ${s.last_name}`,
          description: `${s.phone || ''} — Qarz: ${Number(s.balance || 0).toLocaleString()} so'm`,
          due_date: s.payment_due_date || new Date().toISOString().slice(0, 10),
          priority: 'high',
          related_type: 'payment',
          is_completed: false,
        }));
        setReminders(generated);
      } catch {
        setReminders([]);
      }
    }
    setLoading(false);
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students/', { params: { page_size: 200 } });
      setStudents(res.data?.data || res.data?.results || []);
    } catch {}
  };

  const today = new Date().toISOString().slice(0, 10);

  // Categorize reminders into 3 columns like IT-TAT
  const overdue = reminders.filter(r => !r.is_completed && !r.is_read && r.due_date && r.due_date < today);
  const todayReminders = reminders.filter(r => !r.is_completed && !r.is_read && (!r.due_date || r.due_date === today));
  const future = reminders.filter(r => !r.is_completed && !r.is_read && r.due_date && r.due_date > today);

  const handleSave = async () => {
    try {
      const payload = {
        title: form.title,
        message: form.description,
        notification_type: 'reminder',
        due_date: form.due_date,
      };
      if (form.related_student) payload.recipient = form.related_student;

      if (editId) {
        await api.patch(`/notifications/${editId}/`, payload);
        toast.success("Eslatma yangilandi");
      } else {
        await api.post('/notifications/', payload);
        toast.success("Eslatma qo'shildi");
      }
      setShowForm(false);
      setEditId(null);
      setForm({ title: '', description: '', due_date: '', priority: 'medium', related_student: '', related_type: 'payment' });
      fetchReminders();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || "Xato");
    }
  };

  const markDone = async (id) => {
    try {
      await api.patch(`/notifications/${id}/`, { is_read: true });
      toast.success("Bajarildi");
      fetchReminders();
    } catch { toast.error("Xato"); }
  };

  const deleteReminder = async (id) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/notifications/${id}/`);
      toast.success("O'chirildi");
      fetchReminders();
    } catch { toast.error("Xato"); }
  };

  const priorityColors = {
    high: '#EF4444',
    medium: '#EAB308',
    low: '#22C55E',
  };

  const ReminderCard = ({ item }) => (
    <div className="rounded-xl p-4 border hover:shadow-md transition-all" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
          {(item.description || item.message) && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{item.description || item.message}</p>
          )}
          {item.due_date && (
            <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: item.due_date < today ? '#EF4444' : 'var(--text-muted)' }}>
              <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
              {item.due_date}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={() => markDone(item.id)} className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600" title="Bajarildi">
            <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => deleteReminder(item.id)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500" title="O'chirish">
            <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  const Column = ({ title, icon, color, items, count }) => (
    <div className="flex-1 min-w-[280px]">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <FontAwesomeIcon icon={icon} className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</span>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${color}15`, color }}>{count}</span>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>Eslatmalar yo'q</div>
        ) : items.map(item => (
          <ReminderCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Eslatmalar</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>To'lov va boshqa eslatmalar</p>
        </div>
        <button onClick={() => { setForm({ title: '', description: '', due_date: '', priority: 'medium', related_student: '', related_type: 'payment' }); setEditId(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>
          <FontAwesomeIcon icon={faPlus} /> Yangi eslatma
        </button>
      </div>

      {/* 3-Column Layout like IT-TAT */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          <Column title="Muddati o'tgan" icon={faExclamationTriangle} color="#EF4444" items={overdue} count={overdue.length} />
          <Column title="Bugun" icon={faClock} color="#EAB308" items={todayReminders} count={todayReminders.length} />
          <Column title="Kelajak" icon={faCalendarAlt} color="#22C55E" items={future} count={future.length} />
        </div>
      )}

      {/* Add/Edit Reminder Modal */}
      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{editId ? "Tahrirlash" : "Yangi eslatma"}</h2>
              <button onClick={() => setShowForm(false)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5">
                <FontAwesomeIcon icon={faTimes} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Sarlavha *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Tavsif</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Sana</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Muhimlik</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                    <option value="high">Yuqori</option>
                    <option value="medium">O'rta</option>
                    <option value="low">Past</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Talaba (ixtiyoriy)</label>
                <select value={form.related_student} onChange={e => setForm({ ...form, related_student: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                  <option value="">Tanlang</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 h-11 rounded-xl border font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Bekor</button>
                <button onClick={handleSave} className="flex-1 h-11 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>Saqlash</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
