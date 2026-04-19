import { useState, useEffect, lazy, Suspense } from 'react';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faLock, faUsers, faEdit, faTrash, faPlus, faTimes,
  faShieldAlt, faPhone, faSave, faEye, faEyeSlash, faCheck,
  faEnvelope, faToggleOn, faToggleOff, faSearch, faUserPlus,
  faKey, faBuilding, faChevronDown, faChevronRight, faCircle,
  faCog, faUserShield, faExclamationTriangle, faUndo,
  faMapMarkerAlt, faGlobe, faPalette, faClock, faCalendarAlt,
  faDoorOpen, faBell, faHistory,
} from '@fortawesome/free-solid-svg-icons';
import { useAuthStore } from '@/stores/authStore';
import Modal from '@/components/ui/Modal';
import { usersService } from '@/services/users';
import { holidayService } from '@/services/attendance';
import { authService } from '@/services/auth';

// Lazy load embedded pages
const RoomsPage = lazy(() => import('@/pages/rooms/Rooms'));
const BranchesPage = lazy(() => import('@/pages/branches/Branches'));
const NotificationsPage = lazy(() => import('@/pages/notifications/Notifications'));
const AuditPage = lazy(() => import('@/pages/audit/AuditLog'));

function EmbeddedPage({ page }) {
  const pages = { rooms: RoomsPage, branches: BranchesPage, notifications: NotificationsPage, audit: AuditPage };
  const Component = pages[page];
  if (!Component) return null;
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: 'rgba(249,115,22,0.2)', borderTopColor: '#F97316' }} />
      </div>
    }>
      <Component />
    </Suspense>
  );
}

// ============================================
// CONFIG
// ============================================
const roleConfig = {
  owner: { label: 'Egasi (Direktor)', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: faUserShield, desc: "Barcha ruxsatlarga ega, tizimni to'liq boshqaradi" },
  admin: { label: 'Administrator', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', icon: faShieldAlt, desc: "O'quvchi, guruh, kurs va davomat boshqaruvi" },
  teacher: { label: "O'qituvchi", color: '#22C55E', bg: 'rgba(34,197,94,0.1)', icon: faUser, desc: "O'z guruhlari, davomat va o'quvchilarni ko'rish" },
  accountant: { label: 'Buxgalter', color: '#F97316', bg: 'rgba(249,115,22,0.1)', icon: faUser, desc: "To'lovlar, moliya va oylik hisoblari" },
  registrar: { label: 'Registrator', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', icon: faUser, desc: "O'quvchi qabul, leadlar va to'lovlar" },
};

const permissionGroups = [
  { name: "O'quvchilar", icon: '👨‍🎓', perms: ['students.view', 'students.create', 'students.update', 'students.delete'] },
  { name: "O'qituvchilar", icon: '👨‍🏫', perms: ['teachers.view', 'teachers.create', 'teachers.update', 'teachers.delete'] },
  { name: 'Kurslar', icon: '📚', perms: ['courses.view', 'courses.create', 'courses.update', 'courses.delete'] },
  { name: 'Guruhlar', icon: '👥', perms: ['groups.view', 'groups.create', 'groups.update', 'groups.delete'] },
  { name: 'Davomat', icon: '📋', perms: ['attendance.view', 'attendance.mark'] },
  { name: "To'lovlar", icon: '💰', perms: ['payments.view', 'payments.create', 'payments.refund'] },
  { name: 'Moliya', icon: '💳', perms: ['finance.view', 'finance.export'] },
  { name: 'Oyliklar', icon: '💵', perms: ['salaries.view', 'salaries.calculate', 'salaries.approve', 'salaries.pay'] },
  { name: 'Leadlar', icon: '📊', perms: ['leads.view', 'leads.create', 'leads.update', 'leads.convert'] },
  { name: 'Sozlamalar', icon: '⚙️', perms: ['settings.view', 'settings.update'] },
  { name: 'Foydalanuvchilar', icon: '🔐', perms: ['users.view', 'users.create', 'users.update', 'users.delete'] },
];

const permLabels = {
  view: "Ko'rish", create: "Yaratish", update: "Tahrirlash", delete: "O'chirish",
  mark: "Belgilash", refund: "Qaytarish", export: "Eksport", calculate: "Hisoblash",
  approve: "Tasdiqlash", pay: "To'lash", convert: "Konvertatsiya",
};

// ============================================
// REUSABLE COMPONENTS
// ============================================
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      className={`relative rounded-full transition-all duration-200 ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ backgroundColor: checked ? '#22C55E' : 'var(--bg-tertiary)', border: checked ? 'none' : '1px solid var(--border-color)', width: '40px', height: '22px' }}
    >
      <div
        className="absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: checked ? '19px' : '2px' }}
      />
    </button>
  );
}

function InputField({ label, required, icon, type = 'text', value, onChange, placeholder, rightElement, error, disabled }) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <FontAwesomeIcon icon={icon} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-11 ${icon ? 'pl-11' : 'pl-4'} ${rightElement ? 'pr-11' : 'pr-4'} rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all ${error ? 'border-red-400' : ''} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          style={{ borderColor: error ? '#EF4444' : 'var(--border-color)', color: 'var(--text-primary)' }}
        />
        {rightElement && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function OrangeButton({ onClick, disabled, loading, icon, children, fullWidth, variant = 'primary' }) {
  if (variant === 'secondary') {
    return (
      <button onClick={onClick} disabled={disabled}
        className={`${fullWidth ? 'w-full' : ''} h-11 px-6 rounded-xl border font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50`}
        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
        {children}
      </button>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${fullWidth ? 'w-full' : ''} h-11 px-6 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-50`}
      style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
      {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : icon && <FontAwesomeIcon icon={icon} className="w-4 h-4" />}
      {children}
    </button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function Settings() {
  const { user, setUser } = useAuthStore();
  const isOwner = user?.role === 'owner';

  // Tabs
  const [tab, setTab] = useState('profile');

  // Profile
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [showPassword, setShowPassword] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showUserForm, setShowUserForm] = useState(false);
  const [userEditId, setUserEditId] = useState(null);
  const [userForm, setUserForm] = useState({ first_name: '', last_name: '', email: '', phone: '', role: 'admin', password: '', password_confirm: '' });
  const [userFormLoading, setUserFormLoading] = useState(false);

  // Permissions
  const [showPermissions, setShowPermissions] = useState(null);
  const [permissionsData, setPermissionsData] = useState({});
  const [customPerms, setCustomPerms] = useState({});
  const [permLoading, setPermLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});

  // Center settings
  const [centerForm, setCenterForm] = useState({ name: '', address: '', city: '', primary_color: '#F97316' });
  const [centerLoading, setCenterLoading] = useState(false);

  // Holidays
  const [holidays, setHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [editHolidayId, setEditHolidayId] = useState(null);
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '', end_date: '', holiday_type: 'custom' });

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'center' && isOwner) fetchCenterInfo();
    if (tab === 'holidays') fetchHolidays();
  }, [tab]);

  // ============================================
  // HANDLERS
  // ============================================
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await usersService.getAll();
      const data = res.data?.data || res.data?.results || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch { toast.error("Foydalanuvchilarni yuklab bo'lmadi"); }
    setUsersLoading(false);
  };

  const fetchCenterInfo = async () => {
    try {
      const d = await authService.getTenantInfo();
      setCenterForm({
        name: d.name || '',
        address: d.address || '',
        city: d.city || '',
        primary_color: d.primary_color || '#F97316',
      });
    } catch {}
  };

  const fetchHolidays = async () => {
    setHolidaysLoading(true);
    try {
      const res = await holidayService.getAll();
      const data = res.data?.data || res.data?.results || [];
      setHolidays(Array.isArray(data) ? data : []);
    } catch { toast.error("Dam olish kunlarini yuklab bo'lmadi"); }
    setHolidaysLoading(false);
  };

  const handleSaveHoliday = async () => {
    if (!holidayForm.name.trim() || !holidayForm.date) {
      toast.error("Nom va sanani kiriting"); return;
    }
    try {
      const payload = { name: holidayForm.name, date: holidayForm.date, holiday_type: holidayForm.holiday_type };
      if (holidayForm.end_date) payload.end_date = holidayForm.end_date;
      if (editHolidayId) {
        await holidayService.update(editHolidayId, payload);
        toast.success("Dam olish kuni yangilandi");
      } else {
        await holidayService.create(payload);
        toast.success("Dam olish kuni qo'shildi");
      }
      setShowHolidayForm(false);
      setEditHolidayId(null);
      setHolidayForm({ name: '', date: '', end_date: '', holiday_type: 'custom' });
      fetchHolidays();
    } catch (e) { toast.error(e.response?.data?.error?.message || "Xatolik"); }
  };

  const handleDeleteHoliday = async (h) => {
    if (!confirm(`"${h.name}" dam olish kunini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await holidayService.delete(h.id);
      toast.success("Dam olish kuni o'chirildi");
      fetchHolidays();
    } catch { toast.error("O'chirishda xatolik"); }
  };

  const openEditHoliday = (h) => {
    setEditHolidayId(h.id);
    setHolidayForm({ name: h.name, date: h.date, end_date: h.end_date || '', holiday_type: h.holiday_type || 'custom' });
    setShowHolidayForm(true);
  };

  const holidayTypeLabels = { national: 'Davlat bayrami', religious: 'Diniy bayram', custom: 'Markaz dam olishi' };
  const holidayTypeColors = { national: '#3B82F6', religious: '#8B5CF6', custom: '#F97316' };

  const handleUpdateProfile = async () => {
    if (!profileForm.first_name.trim() || !profileForm.last_name.trim()) {
      toast.error("Ism va familiyani kiriting"); return;
    }
    setProfileLoading(true);
    try {
      const updated = await authService.updateProfile(profileForm);
      setUser(updated?.data || updated);
      toast.success("Profil muvaffaqiyatli yangilandi");
    } catch (e) {
      toast.error(e.response?.data?.error?.message || "Profilni yangilashda xatolik");
    }
    setProfileLoading(false);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.old_password) { toast.error("Joriy parolni kiriting"); return; }
    if (passwordForm.new_password.length < 8) { toast.error("Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak"); return; }
    if (passwordForm.new_password !== passwordForm.confirm_password) { toast.error("Yangi parollar mos kelmaydi"); return; }

    setPasswordLoading(true);
    try {
      await authService.changePassword(
        passwordForm.old_password,
        passwordForm.new_password,
        passwordForm.confirm_password,
      );
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (e) {
      const msg = e.response?.data?.error?.message || e.response?.data?.detail;
      if (msg?.includes('INVALID_PASSWORD') || msg?.includes("noto'g'ri")) {
        toast.error("Joriy parol noto'g'ri");
      } else {
        toast.error(msg || "Parolni o'zgartirishda xatolik");
      }
    }
    setPasswordLoading(false);
  };

  const handleSaveUser = async () => {
    if (!userForm.first_name.trim() || !userForm.last_name.trim()) {
      toast.error("Ism va familiya majburiy"); return;
    }
    if (!userEditId && (!userForm.password || userForm.password.length < 4)) {
      toast.error("Parol kamida 4 ta belgidan iborat bo'lishi kerak"); return;
    }

    setUserFormLoading(true);
    try {
      const payload = { ...userForm };
      if (userEditId) {
        // Update — password_confirm kerak emas, password bo'sh bo'lsa o'chirish
        delete payload.password_confirm;
        if (!payload.password) delete payload.password;
      }

      if (userEditId) {
        await usersService.update(userEditId, payload);
        toast.success("Foydalanuvchi yangilandi");
      } else {
        await usersService.create(payload);
        toast.success("Foydalanuvchi muvaffaqiyatli yaratildi");
      }
      setShowUserForm(false);
      setUserEditId(null);
      setUserForm({ first_name: '', last_name: '', email: '', phone: '', role: 'admin', password: '', password_confirm: '' });
      fetchUsers();
    } catch (e) {
      const errData = e.response?.data;
      const errMsg = errData?.error?.message || errData?.detail ||
        (typeof errData === 'object' ? Object.values(errData).flat().join(', ') : null) || "Xatolik yuz berdi";
      toast.error(errMsg);
    }
    setUserFormLoading(false);
  };

  const handleDeleteUser = async (u) => {
    if (u.role === 'owner') { toast.error("Egani o'chirib bo'lmaydi"); return; }
    if (u.id === user?.id) { toast.error("O'zingizni o'chira olmaysiz"); return; }
    if (!confirm(`${u.first_name} ${u.last_name} — bu foydalanuvchini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await usersService.delete(u.id);
      toast.success("Foydalanuvchi o'chirildi");
      fetchUsers();
    } catch { toast.error("O'chirishda xatolik"); }
  };

  const handleToggleActive = async (u) => {
    if (u.role === 'owner') return;
    try {
      await usersService.update(u.id, { is_active: !u.is_active });
      toast.success(u.is_active ? "Foydalanuvchi nofaol qilindi" : "Foydalanuvchi faollashtirildi");
      fetchUsers();
    } catch { toast.error("Xatolik"); }
  };

  // Permissions
  const openPermissions = async (u) => {
    setShowPermissions(u);
    setPermLoading(true);
    setExpandedGroups({});
    try {
      const res = await usersService.getPermissions(u.id);
      const data = res.data?.data || res.data;
      setPermissionsData(data.permissions || {});
      setCustomPerms(data.custom_permissions || {});
    } catch {
      toast.error("Ruxsatlarni yuklab bo'lmadi");
      setPermissionsData({});
      setCustomPerms({});
    }
    setPermLoading(false);
  };

  const togglePermission = (perm) => {
    if (!isOwner) return;
    const current = customPerms[perm] !== undefined ? customPerms[perm] : (permissionsData[perm] || false);
    setCustomPerms(prev => ({ ...prev, [perm]: !current }));
    setPermissionsData(prev => ({ ...prev, [perm]: !current }));
  };

  const toggleGroupAll = (perms) => {
    if (!isOwner) return;
    const allActive = perms.every(p => permissionsData[p]);
    const newVal = !allActive;
    const newCustom = { ...customPerms };
    const newPermsData = { ...permissionsData };
    perms.forEach(p => { newCustom[p] = newVal; newPermsData[p] = newVal; });
    setCustomPerms(newCustom);
    setPermissionsData(newPermsData);
  };

  const resetToDefaults = () => {
    if (!isOwner || !showPermissions) return;
    setCustomPerms({});
    // Re-fetch to get defaults
    openPermissions(showPermissions);
    toast.info("Rol bo'yicha standart ruxsatlarga qaytarildi");
  };

  const savePermissions = async () => {
    setPermLoading(true);
    try {
      await usersService.updatePermissions(showPermissions.id, { custom_permissions: customPerms });
      toast.success("Ruxsatlar muvaffaqiyatli saqlandi");
      setShowPermissions(null);
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || "Ruxsatlarni saqlashda xatolik");
    }
    setPermLoading(false);
  };

  const toggleGroupExpand = (name) => {
    setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (!userSearch) return true;
    const s = userSearch.toLowerCase();
    return (u.first_name + ' ' + u.last_name).toLowerCase().includes(s) || u.phone?.includes(s) || u.email?.toLowerCase().includes(s);
  });

  // Stats
  const userStats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    byRole: Object.keys(roleConfig).reduce((acc, role) => {
      acc[role] = users.filter(u => u.role === role).length;
      return acc;
    }, {}),
  };

  const tabs = [
    { key: 'profile', label: 'Profil', icon: faUser },
    { key: 'password', label: 'Parol', icon: faLock },
    ...(isOwner || user?.role === 'admin' ? [{ key: 'users', label: 'Foydalanuvchilar', icon: faUsers }] : []),
    ...(isOwner || user?.role === 'admin' ? [{ key: 'holidays', label: 'Dam olish kunlari', icon: faCalendarAlt }] : []),
    ...(isOwner ? [{ key: 'rooms', label: 'Xonalar', icon: faDoorOpen }] : []),
    ...(isOwner ? [{ key: 'branches', label: 'Filiallar', icon: faBuilding }] : []),
    ...(isOwner || user?.role === 'admin' ? [{ key: 'notifications', label: 'Bildirishnomalar', icon: faBell }] : []),
    ...(isOwner ? [{ key: 'audit', label: 'Audit', icon: faHistory }] : []),
    ...(isOwner ? [{ key: 'center', label: 'Markaz', icon: faCog }] : []),
  ];

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Sozlamalar</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Profil, parol, foydalanuvchilar va markaz sozlamalari</p>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 p-1 rounded-xl min-w-max" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          {tabs.map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === tb.key ? 'shadow-sm' : ''}`}
              style={{
                backgroundColor: tab === tb.key ? 'var(--bg-secondary)' : 'transparent',
                color: tab === tb.key ? '#F97316' : 'var(--text-secondary)',
              }}>
              <FontAwesomeIcon icon={tb.icon} className="w-4 h-4" /> {tb.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================ */}
      {/* PROFILE TAB */}
      {/* ============================================ */}
      {tab === 'profile' && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                {(user?.first_name?.[0] || '').toUpperCase()}{(user?.last_name?.[0] || '').toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.full_name || `${user?.first_name} ${user?.last_name}`}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: roleConfig[user?.role]?.color, backgroundColor: roleConfig[user?.role]?.bg }}>
                    {roleConfig[user?.role]?.label || user?.role}
                  </span>
                  {user?.phone && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.phone}</span>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Ism" required icon={faUser} value={profileForm.first_name}
                  onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })} placeholder="Ismingiz" />
                <InputField label="Familiya" required icon={faUser} value={profileForm.last_name}
                  onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })} placeholder="Familiyangiz" />
              </div>
              <InputField label="Email" icon={faEnvelope} type="email" value={profileForm.email}
                onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} placeholder="email@example.com" />
              <InputField label="Telefon raqam" required icon={faPhone} value={profileForm.phone}
                onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+998 90 123 45 67" />

              <OrangeButton onClick={handleUpdateProfile} disabled={profileLoading} loading={profileLoading} icon={faCheck}>
                Saqlash
              </OrangeButton>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* PASSWORD TAB */}
      {/* ============================================ */}
      {tab === 'password' && (
        <div className="max-w-xl">
          <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(249,115,22,0.1)' }}>
                <FontAwesomeIcon icon={faKey} className="w-4 h-4" style={{ color: '#F97316' }} />
              </div>
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Parolni o'zgartirish</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Kamida 8 ta belgidan iborat bo'lishi kerak</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: 'old_password', label: 'Joriy parol', placeholder: 'Hozirgi parolingiz' },
                { key: 'new_password', label: 'Yangi parol', placeholder: 'Yangi parol (8+ belgi)' },
                { key: 'confirm_password', label: 'Parolni tasdiqlash', placeholder: 'Yangi parolni qayta kiriting' },
              ].map(field => (
                <InputField
                  key={field.key}
                  label={field.label}
                  required
                  icon={faLock}
                  type={showPassword[field.key] ? 'text' : 'password'}
                  value={passwordForm[field.key]}
                  onChange={e => setPasswordForm({ ...passwordForm, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  rightElement={
                    <button type="button" onClick={() => setShowPassword(p => ({ ...p, [field.key]: !p[field.key] }))}
                      className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <FontAwesomeIcon icon={showPassword[field.key] ? faEyeSlash : faEye} className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    </button>
                  }
                />
              ))}
              <OrangeButton onClick={handleChangePassword} disabled={passwordLoading} loading={passwordLoading} icon={faLock}>
                Parolni o'zgartirish
              </OrangeButton>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* USERS TAB */}
      {/* ============================================ */}
      {tab === 'users' && (
        <div className="space-y-5">
          {/* Role Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(roleConfig).map(([role, cfg]) => (
              <button key={role} onClick={() => setRoleFilter(roleFilter === role ? 'all' : role)}
                className="rounded-xl border p-3 text-left transition-all"
                style={{
                  borderColor: roleFilter === role ? cfg.color : 'var(--border-color)',
                  backgroundColor: roleFilter === role ? cfg.bg : 'var(--bg-secondary)',
                }}>
                <div className="flex items-center justify-between mb-1">
                  <FontAwesomeIcon icon={cfg.icon} className="w-4 h-4" style={{ color: cfg.color }} />
                  <span className="text-lg font-bold" style={{ color: cfg.color }}>{userStats.byRole[role] || 0}</span>
                </div>
                <p className="text-[11px] font-medium truncate" style={{ color: roleFilter === role ? cfg.color : 'var(--text-secondary)' }}>
                  {cfg.label}
                </p>
              </button>
            ))}
          </div>

          {/* Search + Add */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Ism, telefon yoki email bo'yicha qidirish..."
                className="w-full h-11 pl-11 pr-4 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            {roleFilter !== 'all' && (
              <button onClick={() => setRoleFilter('all')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                <FontAwesomeIcon icon={faTimes} className="w-3 h-3" /> Filterni tozalash
              </button>
            )}
            {isOwner && (
              <button onClick={() => { setUserForm({ first_name: '', last_name: '', email: '', phone: '', role: 'admin', password: '', password_confirm: '' }); setUserEditId(null); setShowUserForm(true); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-opacity"
                style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                <FontAwesomeIcon icon={faUserPlus} className="w-4 h-4" /> Yangi foydalanuvchi
              </button>
            )}
          </div>

          {/* Users List */}
          <div className="space-y-3">
            {usersLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-2xl border p-12 text-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <FontAwesomeIcon icon={faUsers} className="w-10 h-10 mb-3" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Foydalanuvchilar topilmadi</p>
              </div>
            ) : filteredUsers.map(u => {
              const rc = roleConfig[u.role] || roleConfig.admin;
              const isSelf = u.id === user?.id;
              const permCount = u.permissions ? Object.values(u.permissions).filter(Boolean).length : null;
              return (
                <div key={u.id} className="rounded-xl border p-4 transition-all" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = rc.color + '40'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${rc.color}, ${rc.color}cc)` }}>
                      {(u.first_name?.[0] || '').toUpperCase()}{(u.last_name?.[0] || '').toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {u.first_name} {u.last_name}
                        </span>
                        {isSelf && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: 'rgba(249,115,22,0.1)', color: '#F97316' }}>Siz</span>}
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ color: rc.color, backgroundColor: rc.bg }}>{rc.label}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {u.phone && <span><FontAwesomeIcon icon={faPhone} className="w-3 h-3 mr-1" />{u.phone}</span>}
                        {u.email && <span><FontAwesomeIcon icon={faEnvelope} className="w-3 h-3 mr-1" />{u.email}</span>}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <FontAwesomeIcon icon={faCircle} className="w-2 h-2" style={{ color: u.is_active ? '#22C55E' : '#EF4444' }} />
                      <span className="text-[11px] font-medium" style={{ color: u.is_active ? '#22C55E' : '#EF4444' }}>
                        {u.is_active ? 'Faol' : 'Nofaol'}
                      </span>
                    </div>

                    {/* Actions */}
                    {isOwner && u.role !== 'owner' && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openPermissions(u)} title="Ruxsatlar"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <FontAwesomeIcon icon={faShieldAlt} className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} />
                        </button>
                        <button onClick={() => handleToggleActive(u)} title={u.is_active ? "Nofaol qilish" : "Faollashtirish"}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <FontAwesomeIcon icon={u.is_active ? faToggleOn : faToggleOff} className="w-4 h-4" style={{ color: u.is_active ? '#22C55E' : 'var(--text-muted)' }} />
                        </button>
                        <button onClick={() => { setUserForm({ first_name: u.first_name, last_name: u.last_name, email: u.email || '', phone: u.phone || '', role: u.role, password: '', password_confirm: '' }); setUserEditId(u.id); setShowUserForm(true); }} title="Tahrirlash"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(249,115,22,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" style={{ color: '#F97316' }} />
                        </button>
                        <button onClick={() => handleDeleteUser(u)} title="O'chirish"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* CENTER SETTINGS TAB */}
      {/* ============================================ */}
      {/* ============================================ */}
      {/* HOLIDAYS TAB */}
      {/* ============================================ */}
      {tab === 'holidays' && (isOwner || user?.role === 'admin') && (
        <div className="max-w-3xl space-y-6">
          <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(249,115,22,0.1)' }}>
                  <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4" style={{ color: '#F97316' }} />
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Dam olish kunlari</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Barcha guruhlar davomati uchun amal qiladigan dam olish kunlari</p>
                </div>
              </div>
              <button onClick={() => { setEditHolidayId(null); setHolidayForm({ name: '', date: '', end_date: '', holiday_type: 'custom' }); setShowHolidayForm(true); }}
                className="px-3 py-2 rounded-lg text-xs font-medium text-white flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--primary-600)' }}>
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" /> Qo'shish
              </button>
            </div>

            {/* Holiday form */}
            {showHolidayForm && (
              <div className="mb-6 p-4 rounded-xl border space-y-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {editHolidayId ? "Dam olish kunini tahrirlash" : "Yangi dam olish kuni"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputField label="Nomi" required value={holidayForm.name}
                    onChange={e => setHolidayForm({ ...holidayForm, name: e.target.value })}
                    placeholder="Masalan: Navro'z bayrami" />
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Turi <span className="text-red-500">*</span></label>
                    <select value={holidayForm.holiday_type}
                      onChange={e => setHolidayForm({ ...holidayForm, holiday_type: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                      <option value="national">Davlat bayrami</option>
                      <option value="religious">Diniy bayram</option>
                      <option value="custom">Markaz dam olishi</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputField label="Boshlanish sanasi" required type="date" value={holidayForm.date}
                    onChange={e => setHolidayForm({ ...holidayForm, date: e.target.value })} />
                  <InputField label="Tugash sanasi (ixtiyoriy)" type="date" value={holidayForm.end_date}
                    onChange={e => setHolidayForm({ ...holidayForm, end_date: e.target.value })} />
                </div>
                <div className="flex gap-3 pt-1">
                  <OrangeButton variant="secondary" onClick={() => { setShowHolidayForm(false); setEditHolidayId(null); }}>
                    Bekor qilish
                  </OrangeButton>
                  <OrangeButton onClick={handleSaveHoliday} icon={faCheck}>
                    {editHolidayId ? 'Saqlash' : "Qo'shish"}
                  </OrangeButton>
                </div>
              </div>
            )}

            {/* Holidays list */}
            {holidaysLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
              </div>
            ) : holidays.length === 0 ? (
              <div className="text-center py-12">
                <FontAwesomeIcon icon={faCalendarAlt} className="w-10 h-10 mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Hali dam olish kunlari qo'shilmagan</p>
              </div>
            ) : (
              <div className="space-y-2">
                {holidays.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-3 rounded-xl border transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${holidayTypeColors[h.holiday_type] || '#F97316'}15` }}>
                        <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4"
                          style={{ color: holidayTypeColors[h.holiday_type] || '#F97316' }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{h.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ color: holidayTypeColors[h.holiday_type] || '#F97316', backgroundColor: `${holidayTypeColors[h.holiday_type] || '#F97316'}15` }}>
                            {holidayTypeLabels[h.holiday_type] || h.holiday_type}
                          </span>
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {h.date}{h.end_date ? ` — ${h.end_date}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditHoliday(h)}
                        className="p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        title="Tahrirlash">
                        <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                      </button>
                      <button onClick={() => handleDeleteHoliday(h)}
                        className="p-2 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="O'chirish">
                        <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'center' && isOwner && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(249,115,22,0.1)' }}>
                <FontAwesomeIcon icon={faBuilding} className="w-4 h-4" style={{ color: '#F97316' }} />
              </div>
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Markaz sozlamalari</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>O'quv markazingiz haqidagi asosiy ma'lumotlar</p>
              </div>
            </div>

            <div className="space-y-4">
              <InputField label="Markaz nomi" required icon={faBuilding} value={centerForm.name}
                onChange={e => setCenterForm({ ...centerForm, name: e.target.value })} placeholder="O'quv markaz nomi" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Shahar" icon={faGlobe} value={centerForm.city}
                  onChange={e => setCenterForm({ ...centerForm, city: e.target.value })} placeholder="Toshkent" />
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Asosiy rang</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={centerForm.primary_color}
                      onChange={e => setCenterForm({ ...centerForm, primary_color: e.target.value })}
                      className="w-11 h-11 rounded-xl border cursor-pointer" style={{ borderColor: 'var(--border-color)' }} />
                    <input type="text" value={centerForm.primary_color}
                      onChange={e => setCenterForm({ ...centerForm, primary_color: e.target.value })}
                      className="flex-1 h-11 px-4 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      placeholder="#F97316" />
                  </div>
                </div>
              </div>
              <InputField label="Manzil" icon={faMapMarkerAlt} value={centerForm.address}
                onChange={e => setCenterForm({ ...centerForm, address: e.target.value })} placeholder="To'liq manzil" />

              <div className="p-3 rounded-xl text-xs" style={{ backgroundColor: 'rgba(59,130,246,0.06)', color: '#3B82F6' }}>
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-3.5 h-3.5 mr-1.5" />
                Logo va fon rasmi admin panel orqali o'zgartiriladi
              </div>
            </div>
          </div>

          {/* Roles Overview */}
          <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(139,92,246,0.1)' }}>
                <FontAwesomeIcon icon={faShieldAlt} className="w-4 h-4" style={{ color: '#8B5CF6' }} />
              </div>
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Rollar va ruxsatlar</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Har bir rol uchun standart ruxsatlar. Foydalanuvchilar tabida maxsus ruxsat belgilash mumkin.</p>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(roleConfig).map(([role, cfg]) => (
                <div key={role} className="rounded-xl border p-4" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: cfg.bg }}>
                      <FontAwesomeIcon icon={cfg.icon} className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)' }}>
                          {userStats.byRole[role] || 0} kishi
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{cfg.desc}</p>
                    </div>
                    {role === 'owner' && (
                      <span className="text-[10px] px-2 py-1 rounded-lg font-medium" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
                        To'liq ruxsat
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* EMBEDDED PAGES — Xonalar, Filiallar, Bildirishnomalar, Audit */}
      {/* ============================================ */}
      {tab === 'rooms' && isOwner && <EmbeddedPage page="rooms" />}
      {tab === 'branches' && isOwner && <EmbeddedPage page="branches" />}
      {tab === 'notifications' && (isOwner || user?.role === 'admin') && <EmbeddedPage page="notifications" />}
      {tab === 'audit' && isOwner && <EmbeddedPage page="audit" />}

      {/* ============================================ */}
      {/* USER FORM MODAL */}
      {/* ============================================ */}
      <Modal isOpen={showUserForm} onClose={() => { setShowUserForm(false); setUserEditId(null); }}
        title={userEditId ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi yaratish"}
        subtitle={userEditId ? "Ma'lumotlarni yangilang" : "Barcha majburiy maydonlarni to'ldiring"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Ism" required icon={faUser} value={userForm.first_name}
              onChange={e => setUserForm({ ...userForm, first_name: e.target.value })} placeholder="Ism" />
            <InputField label="Familiya" required icon={faUser} value={userForm.last_name}
              onChange={e => setUserForm({ ...userForm, last_name: e.target.value })} placeholder="Familiya" />
          </div>
          <InputField label="Telefon raqam" required icon={faPhone} value={userForm.phone}
            onChange={e => setUserForm({ ...userForm, phone: e.target.value })} placeholder="+998 90 123 45 67" />
          <InputField label="Email" icon={faEnvelope} type="email" value={userForm.email}
            onChange={e => setUserForm({ ...userForm, email: e.target.value })} placeholder="email@example.com" />

          {/* Role selector */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Rol <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(roleConfig).filter(([k]) => k !== 'owner').map(([key, cfg]) => (
                <button key={key} onClick={() => setUserForm({ ...userForm, role: key })}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left"
                  style={{
                    borderColor: userForm.role === key ? cfg.color : 'var(--border-color)',
                    backgroundColor: userForm.role === key ? cfg.bg : 'transparent',
                    color: userForm.role === key ? cfg.color : 'var(--text-secondary)',
                  }}>
                  <FontAwesomeIcon icon={cfg.icon} className="w-3.5 h-3.5" />
                  <div>
                    <div>{cfg.label}</div>
                    <div className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>{cfg.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField label={userEditId ? "Yangi parol" : "Parol"} required={!userEditId} icon={faLock}
              type="password" value={userForm.password}
              onChange={e => setUserForm({ ...userForm, password: e.target.value })}
              placeholder={userEditId ? "Bo'sh = o'zgarmaydi" : "Kamida 8 belgi"} />
            <InputField label="Parol tasdiqlash" required={!userEditId} icon={faLock}
              type="password" value={userForm.password_confirm}
              onChange={e => setUserForm({ ...userForm, password_confirm: e.target.value })}
              placeholder="Parolni qaytaring" />
          </div>

          <div className="flex gap-3 pt-2">
            <OrangeButton variant="secondary" onClick={() => { setShowUserForm(false); setUserEditId(null); }} fullWidth>
              Bekor qilish
            </OrangeButton>
            <OrangeButton onClick={handleSaveUser} disabled={userFormLoading} loading={userFormLoading} icon={faCheck} fullWidth>
              {userEditId ? 'Saqlash' : "Yaratish"}
            </OrangeButton>
          </div>
        </div>
      </Modal>

      {/* ============================================ */}
      {/* PERMISSIONS MODAL */}
      {/* ============================================ */}
      <Modal isOpen={!!showPermissions} onClose={() => setShowPermissions(null)}
        title="Ruxsatlarni boshqarish"
        subtitle={showPermissions ? `${showPermissions.first_name} ${showPermissions.last_name} — ${roleConfig[showPermissions.role]?.label}` : ''}
        maxWidth="max-w-2xl">

        {showPermissions?.role === 'owner' ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
              <FontAwesomeIcon icon={faShieldAlt} className="w-7 h-7" style={{ color: '#22C55E' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Egasi barcha ruxsatlarga ega</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Eganing ruxsatlarini o'zgartirib bo'lmaydi</p>
          </div>
        ) : permLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Role info banner */}
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: roleConfig[showPermissions?.role]?.bg }}>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={roleConfig[showPermissions?.role]?.icon} className="w-4 h-4" style={{ color: roleConfig[showPermissions?.role]?.color }} />
                <span className="text-xs font-medium" style={{ color: roleConfig[showPermissions?.role]?.color }}>
                  {roleConfig[showPermissions?.role]?.desc}
                </span>
              </div>
              {isOwner && Object.keys(customPerms).length > 0 && (
                <button onClick={resetToDefaults} className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg transition-colors"
                  style={{ color: '#F97316', backgroundColor: 'rgba(249,115,22,0.1)' }}>
                  <FontAwesomeIcon icon={faUndo} className="w-3 h-3" /> Standartga qaytarish
                </button>
              )}
            </div>

            {!isOwner && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-xs" style={{ backgroundColor: 'rgba(234,179,8,0.1)', color: '#EAB308' }}>
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4" />
                Faqat egasi (owner) ruxsatlarni o'zgartira oladi
              </div>
            )}

            {/* Permission summary */}
            <div className="flex items-center gap-4 px-1">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Jami: {Object.values(permissionsData).filter(Boolean).length}/{Object.keys(permissionsData).length} ruxsat faol
              </span>
              {Object.keys(customPerms).length > 0 && (
                <span className="flex items-center gap-1 text-xs" style={{ color: '#F97316' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  {Object.keys(customPerms).length} ta maxsus o'zgartirish
                </span>
              )}
            </div>

            {permissionGroups.map(group => {
              const activeCount = group.perms.filter(p => permissionsData[p]).length;
              const allActive = activeCount === group.perms.length;
              const isExpanded = expandedGroups[group.name] !== false;

              return (
                <div key={group.name} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                  {/* Group Header */}
                  <div className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    onClick={() => toggleGroupExpand(group.name)}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{group.icon}</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{group.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{
                        color: allActive ? '#22C55E' : activeCount > 0 ? '#EAB308' : '#EF4444',
                        backgroundColor: allActive ? 'rgba(34,197,94,0.1)' : activeCount > 0 ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                      }}>{activeCount}/{group.perms.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOwner && (
                        <button onClick={(e) => { e.stopPropagation(); toggleGroupAll(group.perms); }}
                          className="text-[10px] px-2 py-1 rounded-md font-medium transition-colors"
                          style={{ color: allActive ? '#EF4444' : '#22C55E', backgroundColor: allActive ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)' }}>
                          {allActive ? 'Hammasini o\'chirish' : 'Hammasini yoqish'}
                        </button>
                      )}
                      <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  {/* Permissions */}
                  {isExpanded && (
                    <div className="p-3 grid grid-cols-2 gap-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      {group.perms.map(perm => {
                        const action = perm.split('.')[1];
                        const isActive = permissionsData[perm] || false;
                        const isCustom = customPerms[perm] !== undefined;
                        return (
                          <div key={perm}
                            className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-all cursor-pointer"
                            style={{
                              backgroundColor: isActive ? 'rgba(34,197,94,0.06)' : 'transparent',
                              border: `1px solid ${isActive ? 'rgba(34,197,94,0.2)' : 'var(--border-color)'}`,
                            }}
                            onClick={() => togglePermission(perm)}>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium" style={{ color: isActive ? '#22C55E' : 'var(--text-secondary)' }}>
                                {permLabels[action] || action}
                              </span>
                              {isCustom && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" title="O'zgartirilgan" />}
                            </div>
                            <Toggle checked={isActive} onChange={() => togglePermission(perm)} disabled={!isOwner} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {isOwner && (
              <button onClick={savePermissions} disabled={permLoading}
                className="w-full h-11 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 mt-4"
                style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                {permLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FontAwesomeIcon icon={faSave} className="w-4 h-4" />}
                Ruxsatlarni saqlash
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
