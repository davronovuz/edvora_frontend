import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartPie, faCalendarCheck, faStar } from '@fortawesome/free-solid-svg-icons';

const tabs = [
  { path: 'attendance', label: 'Davomat hisoboti', icon: faChartPie, permission: 'attendance.view' },
  { path: 'teachers', label: 'Ustozlar davomati', icon: faCalendarCheck, roles: ['owner'] },
  { path: 'rating', label: 'Reyting', icon: faStar, roles: ['owner', 'admin'] },
];

export default function HisobotlarLayout() {
  const { hasPermission, user } = useAuthStore();
  const location = useLocation();
  const isOwner = user?.role === 'owner';

  const isAllowed = (tab) => {
    if (isOwner) return true;
    if (tab.permission) return hasPermission(tab.permission);
    if (tab.roles) return tab.roles.includes(user?.role);
    return true;
  };

  if (location.pathname === '/app/hisobotlar' || location.pathname === '/app/hisobotlar/') {
    const firstAllowed = tabs.find(t => isAllowed(t));
    return <Navigate to={firstAllowed?.path || 'attendance'} replace />;
  }

  const visibleTabs = tabs.filter(t => isAllowed(t));

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-1 p-1.5 overflow-x-auto" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          {visibleTabs.map(tab => (
            <NavLink
              key={tab.path}
              to={`/app/hisobotlar/${tab.path}`}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-white/50'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? '#1B365D' : 'var(--text-muted)',
              })}
            >
              <FontAwesomeIcon icon={tab.icon} className="w-4 h-4" />
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Page content */}
      <Outlet />
    </div>
  );
}
