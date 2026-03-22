import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse,
  faUserGraduate,
  faChalkboardTeacher,
  faUsers,
  faMoneyBill,
  faClipboardCheck,
  faChartLine,
  faCog,
  faSignOutAlt,
  faSun,
  faMoon,
  faBook,
  faBell,
  faBars,
  faChevronLeft,
  faChevronRight,
  faDoorOpen,
  faFileAlt,
  faWallet,
  faHistory,
  faBuilding,
} from '@fortawesome/free-solid-svg-icons';
import Logo from '@/assets/logo.png';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

// Navigation items grouped by sections with role access
// Names are i18n keys, resolved in render via t()
const getNavigation = (t) => [
  { name: t('nav.dashboard'), href: '/app', icon: faHouse },

  { section: t('nav.groups') },
  { name: t('nav.students'), href: '/app/students', icon: faUserGraduate, roles: ['owner', 'admin', 'teacher', 'registrar'] },
  { name: t('nav.teachers'), href: '/app/teachers', icon: faChalkboardTeacher, roles: ['owner', 'admin'] },
  { name: t('nav.courses'), href: '/app/courses', icon: faBook, roles: ['owner', 'admin', 'teacher'] },
  { name: t('nav.groups'), href: '/app/groups', icon: faUsers, roles: ['owner', 'admin', 'teacher', 'registrar'] },
  { name: t('nav.rooms'), href: '/app/rooms', icon: faDoorOpen, roles: ['owner', 'admin'] },
  { name: t('nav.attendance'), href: '/app/attendance', icon: faClipboardCheck, roles: ['owner', 'admin', 'teacher'] },
  { name: t('nav.exams'), href: '/app/exams', icon: faFileAlt, roles: ['owner', 'admin', 'teacher'] },

  { section: t('nav.finance') },
  { name: t('nav.payments'), href: '/app/payments', icon: faMoneyBill, roles: ['owner', 'admin', 'accountant', 'registrar'] },
  { name: t('nav.finance'), href: '/app/finance', icon: faWallet, roles: ['owner', 'admin', 'accountant'] },

  { section: t('nav.settings') },
  { name: t('nav.leads'), href: '/app/leads', icon: faChartLine, roles: ['owner', 'admin', 'registrar'] },
  { name: t('nav.branches'), href: '/app/branches', icon: faBuilding, roles: ['owner', 'admin'] },
  { name: t('nav.notifications'), href: '/app/notifications', icon: faBell },
  { name: t('nav.audit'), href: '/app/audit', icon: faHistory, roles: ['owner', 'admin'] },
  { name: t('nav.settings'), href: '/app/settings', icon: faCog },
];

export default function MainLayout() {
  const { t } = useTranslation();
  const navigation = getNavigation(t);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop collapse
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, initTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initTheme();
    // LocalStorage'dan collapse holatini olish
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) setSidebarCollapsed(JSON.parse(saved));
  }, []);

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
        className={`sidebar fixed top-0 left-0 z-50 h-full transform transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
        `}
      >
        {/* Logo */}
        <div className={`h-20 flex items-center justify-center px-1 border-b transition-all duration-300`} style={{ borderColor: 'var(--border-color)' }}>
          {!sidebarCollapsed ? (
            <img src={Logo} alt="MarkazEdu" className=" relative h-50 left-0" />
          ) : (
            <img src={Logo} alt="MarkazEdu" className="h-0  mx-auto" style={{ maxWidth: '80px', objectFit: 'contain' }} />
          )}
          
          {/* Mobile close */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setSidebarOpen(false)}
          >
            <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">
          {navigation.filter(item => {
            if (item.section) return true;
            if (!item.roles) return true;
            return item.roles.includes(user?.role);
          }).map((item, idx) =>
            item.section ? (
              !sidebarCollapsed ? (
                <div key={item.section} className={`px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider ${idx === 0 ? '' : ''}`} style={{ color: 'var(--text-muted)' }}>
                  {item.section}
                </div>
              ) : (
                <div key={item.section} className="border-t my-2 mx-3" style={{ borderColor: 'var(--border-color)' }} />
              )
            ) : (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? item.name : ''}
                className={({ isActive }) =>
                  `sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                  ${sidebarCollapsed ? 'justify-center' : ''}
                  ${isActive ? 'active' : ''}`
                }
              >
                <FontAwesomeIcon icon={item.icon} className={`w-5 h-5 ${sidebarCollapsed ? '' : 'min-w-[20px]'}`} />
                {!sidebarCollapsed && <span className="truncate text-sm">{item.name}</span>}
              </NavLink>
            )
          )}
        </nav>

        {/* Collapse Button - Desktop only */}
        <div className="hidden lg:block p-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <FontAwesomeIcon 
              icon={sidebarCollapsed ? faChevronRight : faChevronLeft} 
              className="w-4 h-4" 
            />
            {!sidebarCollapsed && <span>Yopish</span>}
          </button>
        </div>

        {/* User Section */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary-600 text-white text-sm">
                    {getInitials(user?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {user?.full_name || 'User'}
                  </p>
                  <p className="text-xs truncate capitalize" style={{ color: 'var(--text-muted)' }}>
                    {user?.role || 'Admin'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 mt-2 rounded-lg text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
                <span>Chiqish</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary-600 text-white text-sm">
                  {getInitials(user?.full_name)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleLogout}
                title="Chiqish"
                className="p-2 rounded-lg text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
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
              {navigation.find(n => n.href && n.href === location.pathname)?.name || 'Dashboard'}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary-600 text-white text-xs">
                      {getInitials(user?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-medium">{user?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <FontAwesomeIcon icon={faCog} className="w-4 h-4 mr-2" />
                  Sozlamalar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-danger-500">
                  <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4 mr-2" />
                  Chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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