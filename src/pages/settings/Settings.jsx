import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faLock, faUsers, faEdit, faTrash, faPlus, faTimes,
  faShieldAlt, faEnvelope, faPhone, faSave, faEye, faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { useAuthStore } from '@/stores/authStore';
import { usersService } from '@/services/users';
import api from '@/services/api';

const roleConfig = {
  owner: { label: 'Egasi', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  admin: { label: 'Admin', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  teacher: { label: "O'qituvchi", color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  accountant: { label: 'Buxgalter', color: '#F97316', bg: 'rgba(249,115,22,0.15)' },
  registrar: { label: 'Registrator', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
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

export default function Settings() {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const [tab, setTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [showPassword, setShowPassword] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userEditId, setUserEditId] = useState(null);
  const [userForm, setUserForm] = useState({ first_name: '', last_name: '', email: '', phone: '', role: 'admin', password: '' });
  const [showPermissions, setShowPermissions] = useState(null);
  const [permissionsData, setPermissionsData] = useState({});
  const [customPerms, setCustomPerms] = useState({});

  useEffect(() => {
    if (user) {
      setProfileForm({ first_name: user.first_name || '', last_name: user.last_name || '', email: user.email || '', phone: user.phone || '' });
    }
  }, [user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersService.getAll();
      setUsers(res.data?.data || res.data?.results || []);
    } catch { toast.error("Xato"); }
    setLoading(false);
  };

  useEffect(() => { if (tab === 'users') fetchUsers(); }, [tab]);

  const handleUpdateProfile = async () => {
    try {
      const res = await api.patch('/auth/me/', profileForm);
      setUser(res.data?.data || res.data);
      toast.success("Profil yangilandi");
    } catch (e) { toast.error(e.response?.data?.error?.message || "Xato"); }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("Parollar mos kelmaydi"); return;
    }
    if (passwordForm.new_password.length < 8) {
      toast.error("Parol kamida 8 ta belgidan iborat bo'lishi kerak"); return;
    }
    try {
      await api.post('/auth/change-password/', { old_password: passwordForm.old_password, new_password: passwordForm.new_password });
      toast.success("Parol o'zgartirildi");
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (e) { toast.error(e.response?.data?.error?.message || "Xato"); }
  };

  const handleSaveUser = async () => {
    try {
      const payload = { ...userForm };
      if (userEditId) {
        if (!payload.password) delete payload.password;
        await usersService.update(userEditId, payload);
        toast.success("Foydalanuvchi yangilandi");
      } else {
        await usersService.create(payload);
        toast.success("Foydalanuvchi yaratildi");
      }
      setShowUserForm(false); setUserEditId(null);
      setUserForm({ first_name: '', last_name: '', email: '', phone: '', role: 'admin', password: '' });
      fetchUsers();
    } catch (e) { toast.error(e.response?.data?.error?.message || "Xato"); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Foydalanuvchini o'chirishni tasdiqlaysizmi?")) return;
    try { await usersService.delete(id); toast.success("O'chirildi"); fetchUsers(); }
    catch { toast.error("Xato"); }
  };

  const permissionGroups = {
    "O'quvchilar": ['students.view', 'students.create', 'students.update', 'students.delete'],
    "O'qituvchilar": ['teachers.view', 'teachers.create', 'teachers.update', 'teachers.delete'],
    "Kurslar": ['courses.view', 'courses.create', 'courses.update', 'courses.delete'],
    "Guruhlar": ['groups.view', 'groups.create', 'groups.update', 'groups.delete'],
    "Davomat": ['attendance.view', 'attendance.mark'],
    "To'lovlar": ['payments.view', 'payments.create', 'payments.refund'],
    "Moliya": ['finance.view', 'finance.export'],
    "Oyliklar": ['salaries.view', 'salaries.calculate', 'salaries.approve', 'salaries.pay'],
    "Leadlar": ['leads.view', 'leads.create', 'leads.update', 'leads.convert'],
    "Sozlamalar": ['settings.view', 'settings.update'],
    "Foydalanuvchilar": ['users.view', 'users.create', 'users.update', 'users.delete'],
  };

  const permLabels = {
    view: "Ko'rish", create: "Yaratish", update: "Tahrirlash", delete: "O'chirish",
    mark: "Belgilash", refund: "Qaytarish", export: "Export", calculate: "Hisoblash",
    approve: "Tasdiqlash", pay: "To'lash", convert: "Konvertatsiya", view_own: "O'zini ko'rish",
  };

  const openPermissions = async (u) => {
    setShowPermissions(u);
    try {
      const res = await usersService.getPermissions(u.id);
      const data = res.data?.data || res.data;
      setPermissionsData(data.permissions || {});
      setCustomPerms(data.custom_permissions || {});
    } catch { toast.error("Ruxsatlarni yuklab bo'lmadi"); }
  };

  const togglePermission = (perm) => {
    const current = customPerms[perm] !== undefined ? customPerms[perm] : permissionsData[perm];
    setCustomPerms({ ...customPerms, [perm]: !current });
    setPermissionsData({ ...permissionsData, [perm]: !current });
  };

  const savePermissions = async () => {
    try {
      await usersService.updatePermissions(showPermissions.id, { custom_permissions: customPerms });
      toast.success("Ruxsatlar saqlandi");
      setShowPermissions(null);
    } catch (e) { toast.error(e.response?.data?.error?.message || "Xato"); }
  };

  const allTabs = [
    { key: 'profile', label: t('auth.login') === 'Kirish' ? 'Profil' : 'Profile', icon: faUser },
    { key: 'password', label: t('auth.password'), icon: faLock },
    { key: 'users', label: t('nav.settings') === 'Sozlamalar' ? 'Foydalanuvchilar' : 'Users', icon: faUsers, roles: ['owner', 'admin'] },
  ];
  const tabs = allTabs.filter(t => !t.roles || t.roles.includes(user?.role));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('nav.settings')}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('nav.settings')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'shadow-sm' : ''}`}
            style={{ backgroundColor: tab === t.key ? 'var(--bg-secondary)' : 'transparent', color: tab === t.key ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            <FontAwesomeIcon icon={t.icon} /> {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="rounded-2xl border p-6 max-w-xl" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: 'var(--primary-600)', color: 'white' }}>
              {(user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')}
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.first_name} {user?.last_name}</h3>
              <span style={{ color: roleConfig[user?.role]?.color, backgroundColor: roleConfig[user?.role]?.bg, padding: '3px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 500 }}>{roleConfig[user?.role]?.label}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Ism</label>
                <input value={profileForm.first_name} onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Familiya</label>
                <input value={profileForm.last_name} onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Email</label>
              <input type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Telefon</label>
              <input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} placeholder="+998..." />
            </div>
            <button onClick={handleUpdateProfile} className="h-11 px-6 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>
              <FontAwesomeIcon icon={faSave} className="mr-2" /> Saqlash
            </button>
          </div>
        </div>
      )}

      {/* Password Tab */}
      {tab === 'password' && (
        <div className="rounded-2xl border p-6 max-w-xl" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Parolni o'zgartirish</h3>
          <div className="space-y-4">
            {[
              { key: 'old_password', label: 'Joriy parol' },
              { key: 'new_password', label: 'Yangi parol' },
              { key: 'confirm_password', label: 'Parolni tasdiqlash' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{field.label}</label>
                <div className="relative">
                  <input type={showPassword[field.key] ? 'text' : 'password'} value={passwordForm[field.key]} onChange={e => setPasswordForm({ ...passwordForm, [field.key]: e.target.value })} className="w-full h-11 px-4 pr-11 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                  <button type="button" onClick={() => setShowPassword(p => ({ ...p, [field.key]: !p[field.key] }))} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    <FontAwesomeIcon icon={showPassword[field.key] ? faEyeSlash : faEye} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <button onClick={handleChangePassword} className="h-11 px-6 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>
              <FontAwesomeIcon icon={faLock} className="mr-2" /> Parolni o'zgartirish
            </button>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => { setUserForm({ first_name: '', last_name: '', email: '', phone: '', role: 'admin', password: '' }); setUserEditId(null); setShowUserForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>
              <FontAwesomeIcon icon={faPlus} /> Foydalanuvchi qo'shish
            </button>
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            {loading ? (
              <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} /></div>
            ) : (
              <table className="w-full">
                <thead><tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                  {['Ism', 'Email', 'Telefon', 'Rol', 'Holat', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: 'var(--border-color)' }}>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.first_name} {u.last_name}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{u.phone || '—'}</td>
                      <td className="px-4 py-3"><span style={{ color: roleConfig[u.role]?.color, backgroundColor: roleConfig[u.role]?.bg, padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 500 }}>{roleConfig[u.role]?.label || u.role}</span></td>
                      <td className="px-4 py-3"><span style={{ color: u.is_active ? '#22C55E' : '#EF4444', fontSize: '13px' }}>{u.is_active ? 'Faol' : 'Nofaol'}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openPermissions(u)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="Ruxsatlar"><FontAwesomeIcon icon={faShieldAlt} className="w-4 h-4" style={{ color: '#8B5CF6' }} /></button>
                          <button onClick={() => { setUserForm({ first_name: u.first_name, last_name: u.last_name, email: u.email, phone: u.phone || '', role: u.role, password: '' }); setUserEditId(u.id); setShowUserForm(true); }} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faEdit} className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} /></button>
                          <button onClick={() => handleDeleteUser(u.id)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faTrash} className="w-4 h-4" style={{ color: '#EF4444' }} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>Foydalanuvchilar topilmadi</td></tr>}
                </tbody>
              </table>
            )}
          </div>

          {/* User Form Modal */}
          <Modal isOpen={showUserForm} onClose={() => { setShowUserForm(false); setUserEditId(null); }} title={userEditId ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi"}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Ism *</label><input value={userForm.first_name} onChange={e => setUserForm({ ...userForm, first_name: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
                <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Familiya *</label><input value={userForm.last_name} onChange={e => setUserForm({ ...userForm, last_name: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
              </div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Email *</label><input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /></div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Telefon</label><input value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} placeholder="+998..." /></div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Rol *</label><select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{Object.entries(roleConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Parol {!userEditId && '*'}</label><input type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className="w-full h-11 px-4 rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} placeholder={userEditId ? "O'zgartirmaslik uchun bo'sh qoldiring" : ''} /></div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowUserForm(false); setUserEditId(null); }} className="flex-1 h-11 rounded-xl border font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Bekor</button>
                <button onClick={handleSaveUser} className="flex-1 h-11 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>Saqlash</button>
              </div>
            </div>
          </Modal>

          {/* Permissions Modal */}
          {showPermissions && (
            <>
              <div onClick={() => setShowPermissions(null)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Ruxsatlarni boshqarish</h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {showPermissions.first_name} {showPermissions.last_name}
                      <span className="ml-2" style={{ color: roleConfig[showPermissions.role]?.color, backgroundColor: roleConfig[showPermissions.role]?.bg, padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 500 }}>{roleConfig[showPermissions.role]?.label}</span>
                    </p>
                  </div>
                  <button onClick={() => setShowPermissions(null)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5"><FontAwesomeIcon icon={faTimes} style={{ color: 'var(--text-secondary)' }} /></button>
                </div>

                {showPermissions.role === 'owner' ? (
                  <div className="text-center py-8">
                    <FontAwesomeIcon icon={faShieldAlt} className="w-12 h-12 mb-3" style={{ color: '#22C55E' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Egasi barcha ruxsatlarga ega</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(permissionGroups).map(([group, perms]) => (
                      <div key={group} className="rounded-xl border p-4" style={{ borderColor: 'var(--border-color)' }}>
                        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{group}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {perms.map(perm => {
                            const action = perm.split('.')[1];
                            const isActive = permissionsData[perm] || false;
                            return (
                              <button key={perm} onClick={() => togglePermission(perm)}
                                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all"
                                style={{ backgroundColor: isActive ? 'rgba(34,197,94,0.1)' : 'var(--bg-tertiary)', color: isActive ? '#22C55E' : 'var(--text-muted)' }}>
                                <span>{permLabels[action] || action}</span>
                                <div className={`w-8 h-5 rounded-full transition-all relative ${isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isActive ? 'left-3.5' : 'left-0.5'}`} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <button onClick={savePermissions} className="w-full h-11 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-600)' }}>
                      <FontAwesomeIcon icon={faSave} className="mr-2" /> Ruxsatlarni saqlash
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}