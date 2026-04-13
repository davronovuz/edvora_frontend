import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function ProtectedRoute({ children, allowedRoles, permission }) {
  const { isAuthenticated, user, hasPermission } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Owner hamma narsaga kirishi mumkin
  if (user?.role === 'owner') {
    return children;
  }

  // Permission-based tekshirish (yangi tizim)
  if (permission && hasPermission(permission)) {
    return children;
  }

  // Role-based tekshirish (legacy — rooms, exams kabi)
  if (allowedRoles && user?.role && allowedRoles.includes(user.role)) {
    return children;
  }

  // Hech qaysi tekshiruvdan o'tmasa — ruxsat yo'q
  if (allowedRoles || permission) {
    return <Navigate to="/app" replace />;
  }

  return children;
}
