import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/sonner';

// Layout
import MainLayout from './components/layout/MainLayout';
import { useEffect } from 'react';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load landing page (has Three.js - heavy)
const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Students from './pages/students/Students';
import StudentFinanceDetail from './pages/students/StudentFinanceDetail';
import Teachers from './pages/teachers/Teachers';
import Courses from './pages/courses/Courses';
import Groups from './pages/groups/Groups';
import GroupDetail from './pages/groups/GroupDetail';
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
import Rating from './pages/rating/Rating';
import TeacherAttendance from './pages/teacher-attendance/TeacherAttendance';
import AttendanceReports from './pages/attendance-reports/AttendanceReports';
import Reminders from './pages/reminders/Reminders';

// Subdomen tekshirish — markazedu.uz yoki www.markazedu.uz bo'lmasa = tenant (o'quv markaz)
const isMainDomain = () => {
  const host = window.location.hostname;
  return host === 'markazedu.uz' || host === 'www.markazedu.uz' || host === 'localhost' || host === '127.0.0.1';
};

const LandingLoader = (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-3 border-t-transparent border-blue-500 rounded-full animate-spin" />
  </div>
);

export default function App() {
  const mainDomain = isMainDomain();

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />

      <Routes>
        {/* Landing page faqat asosiy domen uchun, subdomen bo'lsa login ga */}
        <Route path="/" element={
          mainDomain
            ? <Suspense fallback={LandingLoader}><LandingPage /></Suspense>
            : <Navigate to="/login" replace />
        } />
        <Route path="/landing" element={
          mainDomain
            ? <Suspense fallback={LandingLoader}><LandingPage /></Suspense>
            : <Navigate to="/login" replace />
        } />

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
          <Route path="students/:id/finance" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'accountant', 'registrar']}><StudentFinanceDetail /></ProtectedRoute>} />
          <Route path="teachers" element={<ProtectedRoute allowedRoles={['owner']}><Teachers /></ProtectedRoute>} />
          <Route path="courses" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'teacher']}><Courses /></ProtectedRoute>} />
          <Route path="groups" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'teacher', 'registrar']}><Groups /></ProtectedRoute>} />
          <Route path="groups/:id" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'teacher', 'registrar']}><GroupDetail /></ProtectedRoute>} />
          <Route path="payments" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'accountant', 'registrar']}><Payments /></ProtectedRoute>} />
          <Route path="attendance" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'teacher']}><Attendance /></ProtectedRoute>} />
          <Route path="leads" element={<ProtectedRoute allowedRoles={['owner', 'registrar']}><Leads /></ProtectedRoute>} />
          <Route path="finance" element={<ProtectedRoute allowedRoles={['owner', 'accountant']}><Finance /></ProtectedRoute>} />
          <Route path="rooms" element={<ProtectedRoute allowedRoles={['owner']}><Rooms /></ProtectedRoute>} />
          <Route path="exams" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'teacher']}><Exams /></ProtectedRoute>} />
          <Route path="rating" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'teacher']}><Rating /></ProtectedRoute>} />
          <Route path="reminders" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'teacher', 'registrar']}><Reminders /></ProtectedRoute>} />
          <Route path="teacher-attendance" element={<ProtectedRoute allowedRoles={['owner']}><TeacherAttendance /></ProtectedRoute>} />
          <Route path="attendance-reports" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'teacher']}><AttendanceReports /></ProtectedRoute>} />
          <Route path="branches" element={<ProtectedRoute allowedRoles={['owner']}><Branches /></ProtectedRoute>} />
          <Route path="notifications" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><Notifications /></ProtectedRoute>} />
          <Route path="audit" element={<ProtectedRoute allowedRoles={['owner']}><AuditLog /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><Settings /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
