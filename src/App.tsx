import { useEffect, type ReactNode } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { Compass, Home } from 'lucide-react'
import Landing from './pages/Landing'
import {
  AuthCallbackPage,
  ForgotPasswordPage,
  LoginPage,
  OpsAdminLandingPage,
  OpsAdminLoginPage,
  OpsAdminSignupPage,
  ResetPasswordPage,
  SuperAdminLandingPage,
  SuperAdminSignInPage,
  SignupPage,
} from './pages/Auth'
import { PaymentCallbackPage } from './pages/PaymentCallback'
import { SuperAdminConsole } from './pages/super-admin-console'
import { ParentAccessRegisterPage } from './pages/ParentAccessRegister'
import { RequireRole } from './components/guards'
import type { Audience } from './data/content'
import {
  JuniorAssignments,
  JuniorClasses,
  JuniorHome,
  JuniorLeaderboard,
  JuniorMessages,
} from './pages/junior'
import {
  SeniorAssignments,
  SeniorClasses,
  SeniorExams,
  SeniorHome,
  SeniorMessages,
  SeniorResources,
  SeniorTutoring,
} from './pages/senior'
import {
  SpecialActivities,
  SpecialAwards,
  SpecialHome,
  SpecialLessons,
  SpecialProgress,
  SpecialTalk,
} from './pages/special'
import {
  TeacherAssignments,
  TeacherClasses,
  TeacherContent,
  TeacherEarnings,
  TeacherHome,
  TeacherMessages,
  TeacherSettings,
  TeacherStudents,
  TeacherTutoring,
} from './pages/teacher'
import {
  ParentAccess,
  ParentAssignments,
  ParentAttendance,
  ParentBilling,
  ParentHome,
  ParentMessages,
  ParentProgress,
  ParentSafety,
  ParentSubscriptions,
  ParentSupport,
  ParentTeachers,
} from './pages/parent'
import { JuniorSubjects, SeniorSubjects } from './pages/subjects'
import { AdminAnalytics, AdminFinance, AdminHome, AdminModeration, AdminUsers } from './pages/admin'
import {
  AdminFeedback,
  AdminInvoices,
  AdminOrders,
  AdminPayroll,
  AdminProducts,
  AdminProfile,
  AdminReports,
  AdminSales,
  AdminSettings,
  AdminSupport,
} from './pages/admin-ops'
import { buttonStyles } from './components/ui'

const routeTitles: Record<string, string> = {
  '/': 'NeuroBloom LearningSphere',
  '/login': 'Sign in · NeuroBloom',
  '/ops-admin': 'Ops Admin · NeuroBloom',
  '/ops-admin/sign-in': 'Ops Admin sign-in · NeuroBloom',
  '/ops-admin/sign-up': 'Admin account request · NeuroBloom',
  '/super-admin': 'Super Admin · NeuroBloom',
  '/super-admin/sign-in': 'Super Admin sign-in · NeuroBloom',
  '/super-admin/console': 'Super Admin console · NeuroBloom',
  '/super-admin/console/access': 'Access & roles · Super Admin · NeuroBloom',
  '/super-admin/console/safeguarding': 'Safeguarding · Super Admin · NeuroBloom',
  '/super-admin/console/compliance': 'Data & compliance · Super Admin · NeuroBloom',
  '/super-admin/console/platform': 'Platform & live ops · Super Admin · NeuroBloom',
  '/super-admin/console/admins': 'Admins & activity · Super Admin · NeuroBloom',
  '/super-admin/console/vendors': 'Vendors & licences · Super Admin · NeuroBloom',
  '/super-admin/console/reports': 'Reports · Super Admin · NeuroBloom',
  '/signup': 'Create account · NeuroBloom',
  '/parent-access/register': 'Parent Access registration · NeuroBloom',
  '/auth/callback': 'Signing you in · NeuroBloom',
  '/forgot-password': 'Reset your password · NeuroBloom',
  '/reset-password': 'Choose a new password · NeuroBloom',
  '/payment/callback': 'Confirming payment · NeuroBloom',
  '/junior': 'Junior dashboard · NeuroBloom',
  '/junior/classes': 'My classes · Junior · NeuroBloom',
  '/junior/assignments': 'Assignments · Junior · NeuroBloom',
  '/junior/subjects': 'Subjects & topics · Junior · NeuroBloom',
  '/junior/leaderboard': 'Leaderboard · Junior · NeuroBloom',
  '/junior/messages': 'Messages · Junior · NeuroBloom',
  '/senior': 'Senior dashboard · NeuroBloom',
  '/senior/classes': 'Live classes · Senior · NeuroBloom',
  '/senior/assignments': 'Assignments · Senior · NeuroBloom',
  '/senior/subjects': 'Subjects & topics · Senior · NeuroBloom',
  '/senior/exams': 'Exam prep · Senior · NeuroBloom',
  '/senior/tutoring': 'Private tutoring · Senior · NeuroBloom',
  '/senior/resources': 'Study resources · Senior · NeuroBloom',
  '/senior/messages': 'Messages · Senior · NeuroBloom',
  '/special': 'My day · Special needs · NeuroBloom',
  '/special/activities': 'Activities · Special needs · NeuroBloom',
  '/special/lessons': 'My lessons · Special needs · NeuroBloom',
  '/special/progress': 'My progress · Special needs · NeuroBloom',
  '/special/awards': 'My awards · Special needs · NeuroBloom',
  '/special/talk': 'Talk to teacher · Special needs · NeuroBloom',
  '/teacher': 'Overview · Teacher · NeuroBloom',
  '/teacher/classes': 'My classes · Teacher · NeuroBloom',
  '/teacher/students': 'Students · Teacher · NeuroBloom',
  '/teacher/assignments': 'Assignments · Teacher · NeuroBloom',
  '/teacher/tutoring': 'Private tutoring · Teacher · NeuroBloom',
  '/teacher/earnings': 'Earnings · Teacher · NeuroBloom',
  '/teacher/content': 'Content · Teacher · NeuroBloom',
  '/teacher/messages': 'Messages · Teacher · NeuroBloom',
  '/teacher/settings': 'Settings · Teacher · NeuroBloom',
  '/parent': 'Overview · Parent · NeuroBloom',
  '/parent/progress': 'Academic progress · Parent · NeuroBloom',
  '/parent/attendance': 'Attendance · Parent · NeuroBloom',
  '/parent/assignments': 'Assignments · Parent · NeuroBloom',
  '/parent/teachers': 'Teachers · Parent · NeuroBloom',
  '/parent/subscriptions': 'Subscriptions · Parent · NeuroBloom',
  '/parent/billing': 'My Billing · Parent · NeuroBloom',
  '/parent/access': 'Parent Access · Parent · NeuroBloom',
  '/parent/messages': 'Messages · Parent · NeuroBloom',
  '/parent/safety': 'Safety & reports · Parent · NeuroBloom',
  '/parent/support': 'Special support · Parent · NeuroBloom',
  '/admin': 'Platform overview · Admin Manager · NeuroBloom',
  '/admin/profile': 'Administrator profile · Admin Manager · NeuroBloom',
  '/admin/sales': 'Sales · Admin Manager · NeuroBloom',
  '/admin/orders': 'Orders · Admin Manager · NeuroBloom',
  '/admin/products': 'Products · Admin Manager · NeuroBloom',
  '/admin/users': 'Users & approvals · Admin Manager · NeuroBloom',
  '/admin/moderation': 'Content moderation · Admin Manager · NeuroBloom',
  '/admin/finance': 'Finance · Admin Manager · NeuroBloom',
  '/admin/invoices': 'Invoices · Admin Manager · NeuroBloom',
  '/admin/payroll': 'Teacher payroll · Admin Manager · NeuroBloom',
  '/admin/reports': 'Reports · Admin Manager · NeuroBloom',
  '/admin/feedback': 'Feedback · Admin Manager · NeuroBloom',
  '/admin/support': 'Help & support · Admin Manager · NeuroBloom',
  '/admin/settings': 'Settings · Admin Manager · NeuroBloom',
  '/admin/analytics': 'Analytics · Admin Manager · NeuroBloom',
}

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    document.title = routeTitles[pathname] ?? 'Page not found · NeuroBloom'
    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    document.getElementById('main-content')?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  }, [pathname, hash])
  return null
}

function NotFound() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center outline-none"
    >
      <span className="text-5xl" aria-hidden>
        🌱
      </span>
      <h1 className="text-2xl font-extrabold text-foreground">This path hasn’t sprouted yet</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you’re looking for doesn’t exist. Head back to the dashboards and pick up where you left off.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link to="/" className={buttonStyles('primary', 'md')}>
          <Home size={16} /> Home
        </Link>
        <Link to="/#dashboards" className={buttonStyles('outline', 'md')}>
          <Compass size={16} /> All dashboards
        </Link>
      </div>
    </main>
  )
}

function guard(role: Audience, element: ReactNode) {
  return <RequireRole role={role}>{element}</RequireRole>
}

export default function App() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[300]"
      >
        Skip to content
      </a>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/ops-admin" element={<OpsAdminLandingPage />} />
        <Route path="/super-admin" element={<SuperAdminLandingPage />} />
        <Route path="/super-admin/sign-in" element={<SuperAdminSignInPage />} />
        <Route path="/super-admin/console" element={guard('admin', <SuperAdminConsole />)} />
        <Route path="/super-admin/console/:section" element={guard('admin', <SuperAdminConsole />)} />
        <Route path="/ops-admin/sign-in" element={<OpsAdminLoginPage />} />
        <Route path="/ops-admin/sign-up" element={<OpsAdminSignupPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/parent-access/register" element={<ParentAccessRegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route path="/junior" element={guard('junior', <JuniorHome />)} />
        <Route path="/junior/classes" element={guard('junior', <JuniorClasses />)} />
        <Route path="/junior/assignments" element={guard('junior', <JuniorAssignments />)} />
        <Route path="/junior/subjects" element={guard('junior', <JuniorSubjects />)} />
        <Route path="/junior/leaderboard" element={guard('junior', <JuniorLeaderboard />)} />
        <Route path="/junior/messages" element={guard('junior', <JuniorMessages />)} />

        <Route path="/senior" element={guard('senior', <SeniorHome />)} />
        <Route path="/senior/classes" element={guard('senior', <SeniorClasses />)} />
        <Route path="/senior/assignments" element={guard('senior', <SeniorAssignments />)} />
        <Route path="/senior/subjects" element={guard('senior', <SeniorSubjects />)} />
        <Route path="/senior/exams" element={guard('senior', <SeniorExams />)} />
        <Route path="/senior/tutoring" element={guard('senior', <SeniorTutoring />)} />
        <Route path="/senior/resources" element={guard('senior', <SeniorResources />)} />
        <Route path="/senior/messages" element={guard('senior', <SeniorMessages />)} />

        <Route path="/special" element={guard('special', <SpecialHome />)} />
        <Route path="/special/activities" element={guard('special', <SpecialActivities />)} />
        <Route path="/special/lessons" element={guard('special', <SpecialLessons />)} />
        <Route path="/special/progress" element={guard('special', <SpecialProgress />)} />
        <Route path="/special/awards" element={guard('special', <SpecialAwards />)} />
        <Route path="/special/talk" element={guard('special', <SpecialTalk />)} />

        <Route path="/teacher" element={guard('teacher', <TeacherHome />)} />
        <Route path="/teacher/classes" element={guard('teacher', <TeacherClasses />)} />
        <Route path="/teacher/students" element={guard('teacher', <TeacherStudents />)} />
        <Route path="/teacher/assignments" element={guard('teacher', <TeacherAssignments />)} />
        <Route path="/teacher/tutoring" element={guard('teacher', <TeacherTutoring />)} />
        <Route path="/teacher/earnings" element={guard('teacher', <TeacherEarnings />)} />
        <Route path="/teacher/content" element={guard('teacher', <TeacherContent />)} />
        <Route path="/teacher/messages" element={guard('teacher', <TeacherMessages />)} />
        <Route path="/teacher/settings" element={guard('teacher', <TeacherSettings />)} />

        <Route path="/parent" element={guard('parent', <ParentHome />)} />
        <Route path="/parent/progress" element={guard('parent', <ParentProgress />)} />
        <Route path="/parent/attendance" element={guard('parent', <ParentAttendance />)} />
        <Route path="/parent/assignments" element={guard('parent', <ParentAssignments />)} />
        <Route path="/parent/teachers" element={guard('parent', <ParentTeachers />)} />
        <Route path="/parent/subscriptions" element={guard('parent', <ParentSubscriptions />)} />
        <Route path="/parent/billing" element={guard('parent', <ParentBilling />)} />
        <Route path="/parent/access" element={guard('parent', <ParentAccess />)} />
        <Route path="/payment/callback" element={guard('parent', <PaymentCallbackPage />)} />
        <Route path="/parent/messages" element={guard('parent', <ParentMessages />)} />
        <Route path="/parent/safety" element={guard('parent', <ParentSafety />)} />
        <Route path="/parent/support" element={guard('parent', <ParentSupport />)} />

        <Route path="/admin" element={guard('admin', <AdminHome />)} />
        <Route path="/admin/profile" element={guard('admin', <AdminProfile />)} />
        <Route path="/admin/sales" element={guard('admin', <AdminSales />)} />
        <Route path="/admin/orders" element={guard('admin', <AdminOrders />)} />
        <Route path="/admin/products" element={guard('admin', <AdminProducts />)} />
        <Route path="/admin/users" element={guard('admin', <AdminUsers />)} />
        <Route path="/admin/moderation" element={guard('admin', <AdminModeration />)} />
        <Route path="/admin/finance" element={guard('admin', <AdminFinance />)} />
        <Route path="/admin/invoices" element={guard('admin', <AdminInvoices />)} />
        <Route path="/admin/payroll" element={guard('admin', <AdminPayroll />)} />
        <Route path="/admin/reports" element={guard('admin', <AdminReports />)} />
        <Route path="/admin/feedback" element={guard('admin', <AdminFeedback />)} />
        <Route path="/admin/support" element={guard('admin', <AdminSupport />)} />
        <Route path="/admin/settings" element={guard('admin', <AdminSettings />)} />
        <Route path="/admin/analytics" element={guard('admin', <AdminAnalytics />)} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
