import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse,
  faUserGraduate,
  faChalkboardTeacher,
  faUsers,
  faChartLine,
  faCog,
  faSignOutAlt,
  faSun,
  faMoon,
  faBook,
  faBell,
  faBars,
  faChevronLeft,
  faWallet,
  faChartPie,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import Logo from '@/assets/logo.png';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';

// Navigation items grouped by sections with role access
// Names are i18n keys, resolved in render via t()
// Rollar: owner (direktor) = to'liq ruxsat, admin = cheklangan, teacher, registrar, accountant
const getNavigation = (t) => [
  { name: t('nav.dashboard'), href: '/app', icon: faHouse },

  { section: t('nav.groups') || "O'quv jarayoni" },
  { name: t('nav.students'), href: '/app/students', icon: faUserGraduate, permission: 'students.view' },
  { name: t('nav.teachers'), href: '/app/teachers', icon: faChalkboardTeacher, permission: 'teachers.view' },
  { name: t('nav.groups'), href: '/app/groups', icon: faUsers, permission: 'groups.view' },
  { name: t('nav.courses'), href: '/app/courses', icon: faBook, permission: 'courses.view' },

  { section: t('nav.finance') || 'Moliya' },
  { name: 'Moliya', href: '/app/moliya', icon: faWallet, permission: 'payments.view', matchPrefix: true },
  { name: t('nav.leads'), href: '/app/leads', icon: faChartLine, permission: 'leads.view' },

  { section: 'Tizim' },
  { name: 'Hisobotlar', href: '/app/hisobotlar', icon: faChartPie, permission: 'attendance.view', matchPrefix: true },
  { name: t('nav.settings'), href: '/app/settings', icon: faCog },
];

export default function MainLayout() {
  const { t } = useTranslation();
  const { user, logout, hasPermission, refreshUser } = useAuthStore();
  const navigation = getNavigation(t);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop collapse
  const [tenantLogo, setTenantLogo] = useState(null);
  const [tenantName, setTenantName] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const { theme, toggleTheme, initTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initTheme();
    // LocalStorage'dan collapse holatini olish
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) setSidebarCollapsed(JSON.parse(saved));
    // Tenant logosini yuklash
    api.get('/tenant-info/').then(res => {
      if (res.data?.logo) setTenantLogo(res.data.logo);
      if (res.data?.name && !res.data?.is_main) setTenantName(res.data.name);
    }).catch(() => {});
  }, []);

  // User menu — tashqariga bosilganda yopilsin
  useEffect(() => {
    if (!userMenuOpen) return;
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    const onEsc = (e) => { if (e.key === 'Escape') setUserMenuOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [userMenuOpen]);

  // Sahifa o'zgarganda permissionlarni yangilash (30s throttle)
  useEffect(() => {
    const lastRefresh = parseInt(sessionStorage.getItem('last-perm-refresh') || '0', 10);
    const now = Date.now();
    if (now - lastRefresh > 30000) {
      sessionStorage.setItem('last-perm-refresh', String(now));
      refreshUser();
    }
  }, [location.pathname]);

  const toggleCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar fixed top-0 left-0 z-50 h-full flex flex-col transform transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}
          w-64
        `}
      >
        {/* Logo + Collapse toggle */}
        <div className="h-14 flex-shrink-0 flex items-center border-b px-3" style={{ borderColor: 'var(--border-color)' }}>
          {!sidebarCollapsed ? (
            <>
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <img src={tenantLogo || Logo} alt={tenantName || 'MarkazEdu'} className="h-8 w-auto object-contain flex-shrink-0" />
                {tenantName && <span className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{tenantName}</span>}
              </div>
              {/* Desktop collapse */}
              <button
                onClick={toggleCollapse}
                className="hidden lg:flex w-7 h-7 rounded-md items-center justify-center transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Sidebarni yig'ish"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="w-3.5 h-3.5" />
              </button>
              {/* Mobile close */}
              <button
                className="lg:hidden w-7 h-7 rounded-md flex items-center justify-center"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => setSidebarOpen(false)}
              >
                <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={toggleCollapse}
              className="w-full flex items-center justify-center"
              title="Sidebarni ochish"
            >
              <img src={tenantLogo || Logo} alt="M" className="h-9 w-auto object-contain transition-transform hover:scale-105" />
            </button>
          )}
        </div>

        {/* Navigation - scrollable */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
          {(() => {
            // Avval filterdan o'tkazamiz
            const filtered = navigation.filter(item => {
              if (item.section) return true;
              if (user?.role === 'owner') return true;
              if (item.permission) return hasPermission(item.permission);
              if (item.roles) return item.roles.includes(user?.role);
              return true;
            });

            // Bo'sh section'larni olib tashlash
            // Section dan keyin yana section yoki hech narsa kelmasa — bo'sh
            const visible = filtered.filter((item, idx) => {
              if (!item.section) return true;
              // Keyingi element link bo'lishi kerak (section emas)
              const next = filtered[idx + 1];
              return next && !next.section;
            });

            return visible.map((item, idx) =>
              item.section ? (
                !sidebarCollapsed ? (
                  <div key={item.section + idx} className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {item.section}
                  </div>
                ) : (
                  <div key={item.section + idx} className="border-t my-2 mx-2" style={{ borderColor: 'var(--border-color)' }} />
                )
              ) : (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/app' || !item.matchPrefix}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.name : ''}
                  className={({ isActive }) => {
                    // matchPrefix: /app/moliya/* da ham active
                    const prefixActive = item.matchPrefix && location.pathname.startsWith(item.href);
                    return `sidebar-item flex items-center rounded-lg transition-all duration-200
                    ${sidebarCollapsed ? 'flex-col gap-0.5 justify-center px-1 py-2 mx-auto' : 'gap-3 px-3 py-2'}
                    ${isActive || prefixActive ? 'active' : ''}`;
                  }}
                >
                  <FontAwesomeIcon icon={item.icon} className={`${sidebarCollapsed ? 'w-4 h-4' : 'w-[18px] h-[18px] min-w-[18px]'}`} />
                  {sidebarCollapsed ? (
                    <span className="text-[9px] leading-tight text-center w-full truncate">{item.name.split(' ')[0]}</span>
                  ) : (
                    <span className="truncate text-[13px]">{item.name}</span>
                  )}
                </NavLink>
              )
            );
          })()}
        </nav>

        {/* User Section */}
        <div className="flex-shrink-0 p-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div
                className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-white text-xs font-medium"
                style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
              >
                {getInitials(user?.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {user?.full_name || 'User'}
                </p>
                <p className="text-[10px] truncate capitalize" style={{ color: 'var(--text-muted)' }}>
                  {user?.role || 'Admin'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Chiqish"
                className="w-7 h-7 rounded-md flex items-center justify-center text-red-400 transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
              >
                {getInitials(user?.full_name)}
              </div>
              <button
                onClick={handleLogout}
                title="Chiqish"
                className="w-8 h-8 rounded-md flex items-center justify-center text-red-400 transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
        {/* Top Header */}
        <header
          className="h-16 flex items-center justify-between px-4 lg:px-6 border-b sticky top-0 z-30"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)'
          }}
        >
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{ color: 'var(--text-primary)' }}
            onClick={() => setSidebarOpen(true)}
          >
            <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
          </button>

          {/* Page Title - Desktop */}
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {navigation.find(n => n.href && (n.href === location.pathname || (n.matchPrefix && location.pathname.startsWith(n.href))))?.name || 'Dashboard'}
            </h1>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title="Bildirishnomalar"
            >
              <FontAwesomeIcon icon={faBell} className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-medium">
                  {getInitials(user?.full_name)}
                </div>
              </button>
              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg border overflow-hidden z-50"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                >
                  <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{user?.full_name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                  </div>
                  <button
                    role="menuitem"
                    onClick={() => { setUserMenuOpen(false); navigate('/app/settings'); }}
                    className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <FontAwesomeIcon icon={faCog} className="w-4 h-4" />
                    Sozlamalar
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                    className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
                    Chiqish
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}