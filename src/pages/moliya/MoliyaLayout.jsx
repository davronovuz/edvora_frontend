import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBill, faFileInvoiceDollar, faWallet, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const tabs = [
  { path: 'debtors', label: 'Qarzdorlar', icon: faExclamationTriangle, permission: 'payments.view' },
  { path: 'payments', label: "To'lovlar", icon: faMoneyBill, permission: 'payments.view' },
  { path: 'billing', label: 'Hisob-kitob', icon: faFileInvoiceDollar, permission: 'finance.view' },
  { path: 'finance', label: 'Xarajatlar & Ish haqi', icon: faWallet, permission: 'finance.view' },
];

export default function MoliyaLayout() {
  const { hasPermission, user } = useAuthStore();
  const location = useLocation();
  const isOwner = user?.role === 'owner';

  // Agar /app/moliya da tursa — birinchi ruxsat etilgan tab ga redirect
  if (location.pathname === '/app/moliya' || location.pathname === '/app/moliya/') {
    const firstAllowed = tabs.find(t => isOwner || hasPermission(t.permission));
    return <Navigate to={firstAllowed?.path || 'payments'} replace />;
  }

  const visibleTabs = tabs.filter(t => isOwner || hasPermission(t.permission));

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-1 p-1.5 overflow-x-auto" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          {visibleTabs.map(tab => (
            <NavLink
              key={tab.path}
              to={`/app/moliya/${tab.path}`}
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
