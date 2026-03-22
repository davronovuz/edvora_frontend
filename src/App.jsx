import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/sonner';

// Layout
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load landing page (has Three.js - heavy)
const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Students from './pages/students/Students';
import Teachers from './pages/teachers/Teachers';
import Courses from './pages/courses/Courses';
import Groups from './pages/groups/Groups';
import Payments from './pages/payments/Payments';
import Attendance from './pages/attendance/Attendance';
import Leads from './pages/leads/Leads';
import Finance from './pages/finance/Finance';
import Rooms from './pages/rooms/Rooms';
import Exams from './pages/exams/Exams';
import Notifications from './pages/notifications/Notifications';
import AuditLog from './pages/audit/AuditLog';
import Settings from './pages/settings/Settings';
import Branches from './pages/branches/Branches';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />

      <Routes>
        {/* Landing Page - First page (lazy loaded) */}
        <Route path="/" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-3 border-t-transparent border-blue-500 rounded-full animate-spin" /></div>}><LandingPage /></Suspense>} />
        <Route path="/landing" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-3 border-t-transparent border-blue-500 rounded-full animate-spin" /></div>}><LandingPage /></Suspense>} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes - Dashboard & App */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="students" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'teacher', 'registrar']}><Students /></ProtectedRoute>} />
          <Route path="teachers" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><Teachers /></ProtectedRoute>} />
          <Route path="courses" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'teacher']}><Courses /></ProtectedRoute>} />
          <Route path="groups" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'teacher', 'registrar']}><Groups /></ProtectedRoute>} />
          <Route path="payments" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'accountant', 'registrar']}><Payments /></ProtectedRoute>} />
          <Route path="attendance" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'teacher']}><Attendance /></ProtectedRoute>} />
          <Route path="leads" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'registrar']}><Leads /></ProtectedRoute>} />
          <Route path="finance" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'accountant']}><Finance /></ProtectedRoute>} />
          <Route path="rooms" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><Rooms /></ProtectedRoute>} />
          <Route path="exams" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'teacher']}><Exams /></ProtectedRoute>} />
          <Route path="branches" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><Branches /></ProtectedRoute>} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="audit" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><AuditLog /></ProtectedRoute>} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
