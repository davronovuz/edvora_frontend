import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell, faCheckDouble, faTimes, faMoneyBill, faCalendarAlt,
  faUsers, faCog, faBullhorn, faClipboardCheck, faSms, faPlus,
  faEdit, faTrash, faClock, faCalendarDay, faToggleOn, faToggleOff
} from '@fortawesome/free-solid-svg-icons';
import { notificationsService, autoSmsService, remindersService, holidaysService } from '@/services/notifications';
import Modal from '@/components/ui/Modal';

const typeConfig = {
  payment: { color: '#22C55E', icon: faMoneyBill },
  payment_reminder: { color: '#EAB308', icon: faMoneyBill },
  attendance: { color: '#3B82F6', icon: faClipboardCheck },
  group: { color: '#8B5CF6', icon: faUsers },
  schedule: { color: '#F97316', icon: faCalendarAlt },
  system: { color: '#94A3B8', icon: faCog },
  marketing: { color: '#EC4899', icon: faBullhorn },
};

const priorityConfig = {
  low: { color: '#94A3B8' },
  normal: { color: '#3B82F6' },
  high: { color: '#F97316' },
  urgent: { color: '#EF4444' },
};

const emptyReminder = { title: '', description: '', remind_at: '', priority: 'normal' };
const emptyHoliday = { name: '', date: '', description: '', is_recurring: false };
const emptyAutoSms = { name: '', trigger_event: 'payment_reminder', message_template: '', is_active: true, days_before: 3 };

export default function Notifications() {
  const { t } = useTranslation();

  const [tab, setTab] = useState('notifications');
  const [notifications, setNotifications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [autoSms, setAutoSms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterRead, setFilterRead] = useState('');

  // Form states
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderForm, setReminderForm] = useState(emptyReminder);
  const [reminderEditId, setReminderEditId] = useState(null);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [holidayForm, setHolidayForm] = useState(emptyHoliday);
  const [holidayEditId, setHolidayEditId] = useState(null);
  const [showAutoSmsForm, setShowAutoSmsForm] = useState(false);
  const [autoSmsForm, setAutoSmsForm] = useState(emptyAutoSms);
  const [autoSmsEditId, setAutoSmsEditId] = useState(null);
  const [showSendSms, setShowSendSms] = useState(false);
  const [smsForm, setSmsForm] = useState({ phone_numbers: '', message: '' });

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.notification_type = filterType;
      if (filterRead === 'unread') params.is_read = false;
      if (filterRead === 'read') params.is_read = true;
      const res = await notificationsService.getAll(params);
      setNotifications(res.data?.data || res.data?.results || []);
    } catch { toast.error('Xato'); }
    setLoading(false);
  };

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await remindersService.getAll();
      setReminders(res.data?.data || res.data?.results || []);
    } catch { toast.error('Xato'); }
    setLoading(false);
  };

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await holidaysService.getAll();
      setHolidays(res.data?.data || res.data?.results || []);
    } catch { toast.error('Xato'); }
    setLoading(false);
  };

  const fetchAutoSms = async () => {
    setLoading(true);
    try {
      const res = await autoSmsService.getAll();
      setAutoSms(res.data?.data || res.data?.results || []);
    } catch { toast.error('Xato'); }
    setLoading(false);
  };

  useEffect(() => {
    if (tab === 'notifications') fetchNotifications();
    else if (tab === 'reminders') fetchReminders();
    else if (tab === 'holidays') fetchHolidays();
    else if (tab === 'autosms') fetchAutoSms();
  }, [tab, filterType, filterRead]);

  const markAsRead = async (id) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { toast.error('Xato'); }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success(t('notifications.markRead') + ' ✓');
    } catch { toast.error('Xato'); }
  };

  // Reminder CRUD
  const handleSaveReminder = async () => {
    try {
      if (reminderEditId) { await remindersService.update(reminderEditId, reminderForm); }
      else { await remindersService.create(reminderForm); }
      toast.success(t('notifications.reminders') + ' ✓');
      setShowReminderForm(false); setReminderEditId(null); setReminderForm(emptyReminder); fetchReminders();
    } catch (e) { toast.error(e.response?.data?.error?.message || 'Xato'); }
  };

  const handleDeleteReminder = async (id) => {
    if (!confirm(t('common.delete') + '?')) return;
    try { await remindersService.delete(id); toast.success(t('common.delete') + ' ✓'); fetchReminders(); }
    catch { toast.error('Xato'); }
  };

  const handleCompleteReminder = async (id) => {
    try { await remindersService.complete(id); toast.success('✓'); fetchReminders(); }
    catch { toast.error('Xato'); }
  };

  // Holiday CRUD
  const handleSaveHoliday = async () => {
    try {
      if (holidayEditId) { await holidaysService.update(holidayEditId, holidayForm); }
      else { await holidaysService.create(holidayForm); }
      toast.success('✓');
      setShowHolidayForm(false); setHolidayEditId(null); setHolidayForm(emptyHoliday); fetchHolidays();
    } catch (e) { toast.error(e.response?.data?.error?.message || 'Xato'); }
  };

  const handleDeleteHoliday = async (id) => {
    if (!confirm(t('common.delete') + '?')) return;
    try { await holidaysService.delete(id); toast.success(t('common.delete') + ' ✓'); fetchHolidays(); }
    catch { toast.error('Xato'); }
  };

  // Auto SMS CRUD
  const handleSaveAutoSms = async () => {
    try {
      if (autoSmsEditId) { await autoSmsService.update(autoSmsEditId, autoSmsForm); }
      else { await autoSmsService.create(autoSmsForm); }
      toast.success(t('notifications.autoSms') + ' ✓');
      setShowAutoSmsForm(false); setAutoSmsEditId(null); setAutoSmsForm(emptyAutoSms); fetchAutoSms();
    } catch (e) { toast.error(e.response?.data?.error?.message || 'Xato'); }
  };

  const handleDeleteAutoSms = async (id) => {
    if (!confirm(t('common.delete') + '?')) return;
    try { await autoSmsService.delete(id); toast.success(t('common.delete') + ' ✓'); fetchAutoSms(); }
    catch { toast.error('Xato'); }
  };

  // Send SMS
  const handleSendSms = async () => {
    try {
      const phones = smsForm.phone_numbers.split(',').map(p => p.trim()).filter(Boolean);
      await notificationsService.sendSms({ phone_numbers: phones, message: smsForm.message });
      toast.success(t('notifications.sendSms') + ' ✓');
      setShowSendSms(false); setSmsForm({ phone_numbers: '', message: '' });
    } catch (e) { toast.error(e.response?.data?.error?.message || 'Xato'); }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const tabs = [
    { key: 'notifications', label: t('notifications.title'), icon: faBell },
    { key: 'reminders', label: t('notifications.reminders'), icon: faClock },
    { key: 'holidays', label: t('common.date'), icon: faCalendarDay },
    { key: 'autosms', label: t('notifications.autoSms'), icon: faSms },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('notifications.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {tab === 'notifications' ? `${unreadCount} ${t('notifications.unread').toLowerCase()}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {tab === 'notifications' && unreadCount > 0 && (
            <button onClick={markAllAsRead} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm" style={{ color: 'var(--primary-600)', backgroundColor: 'rgba(59,130,246,0.1)' }}>
              <FontAwesomeIcon icon={faCheckDouble} /> {t('notifications.markRead')}
            </button>
          )}
          {tab === 'notifications' && (
            <button onClick={() => setShowSendSms(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>
              <FontAwesomeIcon icon={faSms} /> {t('notifications.sendSms')}
            </button>
          )}
          {tab === 'reminders' && (
            <button onClick={() => { setReminderForm(emptyReminder); setReminderEditId(null); setShowReminderForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>
              <FontAwesomeIcon icon={faPlus} /> {t('notifications.reminders')}
            </button>
          )}
          {tab === 'holidays' && (
            <button onClick={() => { setHolidayForm(emptyHoliday); setHolidayEditId(null); setShowHolidayForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>
              <FontAwesomeIcon icon={faPlus} /> {t('common.add')}
            </button>
          )}
          {tab === 'autosms' && (
            <button onClick={() => { setAutoSmsForm(emptyAutoSms); setAutoSmsEditId(null); setShowAutoSmsForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>
              <FontAwesomeIcon icon={faPlus} /> {t('notifications.autoSms')}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === tb.key ? 'shadow-sm' : ''}`}
            style={{ backgroundColor: tab === tb.key ? 'var(--bg-secondary)' : 'transparent', color: tab === tb.key ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            <FontAwesomeIcon icon={tb.icon} /> <span className="hidden sm:inline">{tb.label}</span>
          </button>
        ))}
      </div>

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <>
          <div className="flex gap-3 flex-wrap">
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">{t('common.all')}</option>
              {Object.keys(typeConfig).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <select value={filterRead} onChange={e => setFilterRead(e.target.value)} className="h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">{t('common.all')}</option>
              <option value="unread">{t('notifications.unread')}</option>
            </select>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} /></div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <FontAwesomeIcon icon={faBell} className="w-12 h-12 mb-4" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.noData')}</p>
              </div>
            ) : (
              notifications.map(n => {
                const type = typeConfig[n.notification_type] || typeConfig.system;
                return (
                  <div key={n.id} onClick={() => !n.is_read && markAsRead(n.id)}
                    className={`rounded-xl p-4 border cursor-pointer transition-all hover:shadow-sm ${!n.is_read ? 'border-l-4' : ''}`}
                    style={{
                      borderColor: !n.is_read ? type.color : 'var(--border-color)',
                      backgroundColor: !n.is_read ? type.color + '08' : 'var(--bg-secondary)',
                    }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: type.color + '15' }}>
                        <FontAwesomeIcon icon={type.icon} style={{ color: type.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{n.title}</h3>
                          {!n.is_read && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: type.color }} />}
                        </div>
                        <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-xs" style={{ color: type.color }}>{n.notification_type}</span>
                          <span className="text-xs" style={{ color: priorityConfig[n.priority]?.color }}>{n.priority}</span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleString('uz-UZ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Reminders Tab */}
      {tab === 'reminders' && (
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} /></div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <FontAwesomeIcon icon={faClock} className="w-12 h-12 mb-4" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.noData')}</p>
            </div>
          ) : reminders.map(r => (
            <div key={r.id} className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: r.is_completed ? 'var(--bg-tertiary)' : 'var(--bg-secondary)' }}>
              <div className="flex-1">
                <h3 className={`text-sm font-semibold ${r.is_completed ? 'line-through' : ''}`} style={{ color: 'var(--text-primary)' }}>{r.title}</h3>
                {r.description && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{r.description}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs" style={{ color: priorityConfig[r.priority]?.color }}>{r.priority}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.remind_at && new Date(r.remind_at).toLocaleString('uz-UZ')}</span>
                </div>
              </div>
              <div className="flex gap-1">
                {!r.is_completed && (
                  <button onClick={() => handleCompleteReminder(r.id)} className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30" title={t('common.confirm')}>
                    <FontAwesomeIcon icon={faCheckDouble} className="w-4 h-4 text-green-500" />
                  </button>
                )}
                <button onClick={() => { setReminderForm({ title: r.title, description: r.description || '', remind_at: r.remind_at || '', priority: r.priority }); setReminderEditId(r.id); setShowReminderForm(true); }} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                  <FontAwesomeIcon icon={faEdit} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </button>
                <button onClick={() => handleDeleteReminder(r.id)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                  <FontAwesomeIcon icon={faTrash} className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Holidays Tab */}
      {tab === 'holidays' && (
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} /></div>
          ) : holidays.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <FontAwesomeIcon icon={faCalendarDay} className="w-12 h-12 mb-4" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.noData')}</p>
            </div>
          ) : holidays.map(h => (
            <div key={h.id} className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{h.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{h.date}</span>
                  {h.is_recurring && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Har yili</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setHolidayForm({ name: h.name, date: h.date, description: h.description || '', is_recurring: h.is_recurring }); setHolidayEditId(h.id); setShowHolidayForm(true); }} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                  <FontAwesomeIcon icon={faEdit} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </button>
                <button onClick={() => handleDeleteHoliday(h.id)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                  <FontAwesomeIcon icon={faTrash} className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auto SMS Tab */}
      {tab === 'autosms' && (
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} /></div>
          ) : autoSms.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <FontAwesomeIcon icon={faSms} className="w-12 h-12 mb-4" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.noData')}</p>
            </div>
          ) : autoSms.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.name}</h3>
                  <FontAwesomeIcon icon={s.is_active ? faToggleOn : faToggleOff} className="w-5 h-5" style={{ color: s.is_active ? '#22C55E' : '#94A3B8' }} />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.trigger_event} — {s.message_template?.slice(0, 60)}...</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setAutoSmsForm({ name: s.name, trigger_event: s.trigger_event, message_template: s.message_template, is_active: s.is_active, days_before: s.days_before || 3 }); setAutoSmsEditId(s.id); setShowAutoSmsForm(true); }} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                  <FontAwesomeIcon icon={faEdit} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </button>
                <button onClick={() => handleDeleteAutoSms(s.id)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                  <FontAwesomeIcon icon={faTrash} className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reminder Form Modal */}
      <Modal isOpen={showReminderForm} onClose={() => { setShowReminderForm(false); setReminderEditId(null); }} title={t('notifications.reminders')}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('common.name')} *</label>
            <input value={reminderForm.title} onChange={e => setReminderForm({ ...reminderForm, title: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('students.notes')}</label>
            <textarea value={reminderForm.description} onChange={e => setReminderForm({ ...reminderForm, description: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('common.date')} *</label>
            <input type="datetime-local" value={reminderForm.remind_at} onChange={e => setReminderForm({ ...reminderForm, remind_at: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowReminderForm(false)} className="flex-1 h-11 rounded-xl border font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{t('common.cancel')}</button>
            <button onClick={handleSaveReminder} className="flex-1 h-11 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>{t('common.save')}</button>
          </div>
        </div>
      </Modal>

      {/* Holiday Form Modal */}
      <Modal isOpen={showHolidayForm} onClose={() => { setShowHolidayForm(false); setHolidayEditId(null); }} title={t('common.add')}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('common.name')} *</label>
            <input value={holidayForm.name} onChange={e => setHolidayForm({ ...holidayForm, name: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('common.date')} *</label>
            <input type="date" value={holidayForm.date} onChange={e => setHolidayForm({ ...holidayForm, date: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('students.notes')}</label>
            <textarea value={holidayForm.description} onChange={e => setHolidayForm({ ...holidayForm, description: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={holidayForm.is_recurring} onChange={e => setHolidayForm({ ...holidayForm, is_recurring: e.target.checked })} className="w-4 h-4 rounded" />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Har yili takrorlanadi</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowHolidayForm(false)} className="flex-1 h-11 rounded-xl border font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{t('common.cancel')}</button>
            <button onClick={handleSaveHoliday} className="flex-1 h-11 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>{t('common.save')}</button>
          </div>
        </div>
      </Modal>

      {/* Auto SMS Form Modal */}
      <Modal isOpen={showAutoSmsForm} onClose={() => { setShowAutoSmsForm(false); setAutoSmsEditId(null); }} title={t('notifications.autoSms')}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('common.name')} *</label>
            <input value={autoSmsForm.name} onChange={e => setAutoSmsForm({ ...autoSmsForm, name: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Trigger *</label>
            <select value={autoSmsForm.trigger_event} onChange={e => setAutoSmsForm({ ...autoSmsForm, trigger_event: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="payment_reminder">Payment Reminder</option>
              <option value="birthday">Birthday</option>
              <option value="debt_warning">Debt Warning</option>
              <option value="attendance_absent">Attendance Absent</option>
              <option value="group_start">Group Start</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>SMS matni *</label>
            <textarea value={autoSmsForm.message_template} onChange={e => setAutoSmsForm({ ...autoSmsForm, message_template: e.target.value })} rows={4} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} placeholder="{name}, {amount}, {date}..." />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={autoSmsForm.is_active} onChange={e => setAutoSmsForm({ ...autoSmsForm, is_active: e.target.checked })} className="w-4 h-4 rounded" />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{t('common.active')}</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowAutoSmsForm(false)} className="flex-1 h-11 rounded-xl border font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{t('common.cancel')}</button>
            <button onClick={handleSaveAutoSms} className="flex-1 h-11 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>{t('common.save')}</button>
          </div>
        </div>
      </Modal>

      {/* Send SMS Modal */}
      <Modal isOpen={showSendSms} onClose={() => setShowSendSms(false)} title={t('notifications.sendSms')}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('common.phone')} *</label>
            <textarea value={smsForm.phone_numbers} onChange={e => setSmsForm({ ...smsForm, phone_numbers: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} placeholder="+998901234567, +998901234568" />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Vergul bilan ajrating</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>SMS matni *</label>
            <textarea value={smsForm.message} onChange={e => setSmsForm({ ...smsForm, message: e.target.value })} rows={4} className="w-full px-4 py-3 rounded-xl border bg-transparent resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowSendSms(false)} className="flex-1 h-11 rounded-xl border font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{t('common.cancel')}</button>
            <button onClick={handleSendSms} className="flex-1 h-11 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>{t('notifications.sendSms')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
