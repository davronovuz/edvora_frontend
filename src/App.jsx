import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from 'sonner';

// Layout
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load landing page (has Three.js - heavy)
const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Students from './pages/students/Students';
import StudentDetail from './pages/students/StudentDetail';
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
import Billing from './pages/billing/Billing';
import Debtors from './pages/moliya/Debtors';
import MoliyaLayout from './pages/moliya/MoliyaLayout';
import HisobotlarLayout from './pages/hisobotlar/HisobotlarLayout';

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
          <Route path="students" element={<ProtectedRoute permission="students.view"><Students /></ProtectedRoute>} />
          <Route path="students/:id" element={<ProtectedRoute permission="students.view"><StudentDetail /></ProtectedRoute>} />
          <Route path="students/:id/finance" element={<ProtectedRoute permission="finance.view"><StudentFinanceDetail /></ProtectedRoute>} />
          <Route path="teachers" element={<ProtectedRoute permission="teachers.view"><Teachers /></ProtectedRoute>} />
          <Route path="courses" element={<ProtectedRoute permission="courses.view"><Courses /></ProtectedRoute>} />
          <Route path="groups" element={<ProtectedRoute permission="groups.view"><Groups /></ProtectedRoute>} />
          <Route path="groups/:id" element={<ProtectedRoute permission="groups.view"><GroupDetail /></ProtectedRoute>} />
          <Route path="leads" element={<ProtectedRoute permission="leads.view"><Leads /></ProtectedRoute>} />
          <Route path="settings" element={<Settings />} />

          {/* Moliya — tabbed layout */}
          <Route path="moliya" element={<ProtectedRoute permission="payments.view"><MoliyaLayout /></ProtectedRoute>}>
            <Route path="payments" element={<Payments />} />
            <Route path="billing" element={<ProtectedRoute permission="finance.view"><Billing /></ProtectedRoute>} />
            <Route path="debtors" element={<Debtors />} />
            <Route path="finance" element={<ProtectedRoute permission="finance.view"><Finance /></ProtectedRoute>} />
          </Route>

          {/* Hisobotlar — tabbed layout */}
          <Route path="hisobotlar" element={<ProtectedRoute permission="attendance.view"><HisobotlarLayout /></ProtectedRoute>}>
            <Route path="attendance" element={<AttendanceReports />} />
            <Route path="teachers" element={<ProtectedRoute allowedRoles={['owner']}><TeacherAttendance /></ProtectedRoute>} />
            <Route path="rating" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><Rating /></ProtectedRoute>} />
          </Route>

          {/* Legacy redirects — eski URLlar uchun */}
          <Route path="payments" element={<Navigate to="/app/moliya/payments" replace />} />
          <Route path="billing" element={<Navigate to="/app/moliya/billing" replace />} />
          <Route path="finance" element={<Navigate to="/app/moliya/finance" replace />} />
          <Route path="attendance-reports" element={<Navigate to="/app/hisobotlar/attendance" replace />} />
          <Route path="teacher-attendance" element={<Navigate to="/app/hisobotlar/teachers" replace />} />
          <Route path="rating" element={<Navigate to="/app/hisobotlar/rating" replace />} />
          <Route path="rooms" element={<Navigate to="/app/settings" replace />} />
          <Route path="branches" element={<Navigate to="/app/settings" replace />} />
          <Route path="notifications" element={<Navigate to="/app/settings" replace />} />
          <Route path="audit" element={<Navigate to="/app/settings" replace />} />
          <Route path="reminders" element={<Navigate to="/app/settings" replace />} />

          {/* Still standalone — faqat GroupDetail ichida bor, lekin URL to'g'ridan-to'g'ri ham ishlaydi */}
          <Route path="attendance" element={<ProtectedRoute permission="attendance.view"><Attendance /></ProtectedRoute>} />
          <Route path="exams" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><Exams /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
