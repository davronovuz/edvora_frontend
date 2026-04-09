import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, refreshUser } = useAuthStore();
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);

  // Sahifa birinchi marta ochilganda token hali amal qilishini tekshirish
  useEffect(() => {
    if (isAuthenticated && !checked) {
      setChecking(true);
      refreshUser().finally(() => {
        setChecking(false);
        setChecked(true);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Birinchi tekshiruvda loading ko'rsatish
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/app" replace />;
  }

  return children;
}
