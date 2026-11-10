import {
  Award,
  Banknote,
  BarChart3,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FileText,
  FolderOpen,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  MessageCircle,
  Package,
  Palette,
  Presentation,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Sun,
  Target,
  TrendingUp,
  Trophy,
  Users,
  UsersRound,
  UserCheck,
  Video,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { Audience } from '../data/content'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  hint?: string
}

export interface RoleConfig {
  role: Audience
  label: string
  portal: string
  emoji: string
  accent: string
  soft: string
  ink: string
  nav: NavItem[]
  home: string
  sidebar: 'solid' | 'light'
  wideSidebar?: boolean
  shellBg?: string
  user: {
    name: string
    meta: string
    emoji?: string
    initials?: string
    avatarBg: string
    avatarColor: string
  }
  footer: 'streak' | 'special' | 'waec' | 'earnings' | 'asd' | 'ops'
  marketing: {
    title: string
    level: string
    description: string
    chips: string[]
  }
}

export const roleConfigs: Record<Audience, RoleConfig> = {
  junior: {
    role: 'junior',
    label: 'Junior Student',
    portal: 'Junior Secondary',
    emoji: '🐯',
    accent: '#8a4403',
    soft: '#f9ecdd',
    ink: '#5f3102',
    home: '/junior',
    sidebar: 'solid',
    nav: [
      { to: '/junior', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/junior/classes', label: 'My Classes', icon: Video },
      { to: '/junior/assignments', label: 'Assignments', icon: ClipboardList },
      { to: '/junior/subjects', label: 'Subjects', icon: BookOpen },
      { to: '/junior/leaderboard', label: 'Leaderboard', icon: Trophy },
      { to: '/junior/messages', label: 'Messages', icon: MessageCircle },
    ],
    user: {
      name: 'Tunde Bakare',
      meta: 'JSS2 · 1,180 pts',
      emoji: '🐯',
      avatarBg: '#8a4403',
      avatarColor: '#ffffff',
    },
    footer: 'streak',
    marketing: {
      title: 'Junior Student',
      level: 'JSS1 – JSS3',
      description: 'Fun learning with games, badges, and interactive lessons.',
      chips: ['Live Classes', 'Gamification', 'Assignments'],
    },
  },
  senior: {
    role: 'senior',
    label: 'Senior Student',
    portal: 'Senior Secondary',
    emoji: '🎓',
    accent: '#0ea5e9',
    soft: '#e8f4fd',
    ink: '#0369a1',
    home: '/senior',
    sidebar: 'light',
    nav: [
      { to: '/senior', label: 'Overview', icon: LayoutDashboard },
      { to: '/senior/classes', label: 'Live Classes', icon: Video },
      { to: '/senior/assignments', label: 'Assignments', icon: ClipboardList },
      { to: '/senior/subjects', label: 'Subjects', icon: BookOpen },
      { to: '/senior/exams', label: 'Exam Prep', icon: Target },
      { to: '/senior/tutoring', label: 'Private Tutoring', icon: GraduationCap },
      { to: '/senior/resources', label: 'Study Resources', icon: FolderOpen },
      { to: '/senior/messages', label: 'Messages', icon: MessageCircle },
    ],
    user: {
      name: 'Amaka Achebe',
      meta: 'SSS3 · Science',
      initials: 'AA',
      avatarBg: '#6c3fc5',
      avatarColor: '#ffffff',
    },
    footer: 'waec',
    marketing: {
      title: 'Senior Student',
      level: 'SSS1 – SSS3',
      description: 'Exam prep, private tutoring, and in-depth subject mastery.',
      chips: ['WAEC Prep', 'Private Tutoring', 'Analytics'],
    },
  },
  special: {
    role: 'special',
    label: 'Special',
    portal: 'Special Needs Learning',
    emoji: '🦋',
    accent: '#a855f7',
    soft: '#f6eefe',
    ink: '#7e22ce',
    home: '/special',
    sidebar: 'light',
    wideSidebar: true,
    shellBg: '#f0f9ff',
    nav: [
      { to: '/special', label: 'My Day', icon: Sun },
      { to: '/special/activities', label: 'Activities', icon: Palette },
      { to: '/special/lessons', label: 'My Lessons', icon: GraduationCap },
      { to: '/special/progress', label: 'My Progress', icon: TrendingUp },
      { to: '/special/awards', label: 'My Awards', icon: Award },
      { to: '/special/talk', label: 'Talk to Teacher', icon: MessageCircle },
    ],
    user: {
      name: 'Chidi Eze',
      meta: 'Age 13 · ASD Support',
      emoji: '🦋',
      avatarBg: '#ffffff',
      avatarColor: '#a855f7',
    },
    footer: 'special',
    marketing: {
      title: 'Special Needs',
      level: 'ASD & ADHD Support',
      description: 'Calm, sensory-friendly learning with specialist support.',
      chips: ['Sensory-Friendly', 'Specialists', 'Therapy Activities'],
    },
  },
  teacher: {
    role: 'teacher',
    label: 'Teacher / Tutor',
    portal: 'Teacher Portal',
    emoji: '👩‍🏫',
    accent: '#10b981',
    soft: '#ecfdf5',
    ink: '#047857',
    home: '/teacher',
    sidebar: 'light',
    nav: [
      { to: '/teacher', label: 'Overview', icon: LayoutDashboard },
      { to: '/teacher/classes', label: 'My Classes', icon: Presentation },
      { to: '/teacher/students', label: 'Students', icon: Users },
      { to: '/teacher/assignments', label: 'Assignments', icon: ClipboardList },
      { to: '/teacher/tutoring', label: 'Private Tutoring', icon: GraduationCap },
      { to: '/teacher/earnings', label: 'Earnings', icon: Wallet },
      { to: '/teacher/content', label: 'Content', icon: FolderOpen },
      { to: '/teacher/messages', label: 'Messages', icon: MessageCircle },
      { to: '/teacher/settings', label: 'Settings', icon: Settings },
    ],
    user: {
      name: 'Dr. Kelechi Azu',
      meta: 'Mathematics · 4.9★',
      initials: 'KA',
      avatarBg: '#10b981',
      avatarColor: '#ffffff',
    },
    footer: 'earnings',
    marketing: {
      title: 'Teacher / Tutor',
      level: 'Teach & Earn',
      description: 'Manage classes, grade work, and take private tutoring sessions.',
      chips: ['Class Management', 'Grading', 'Earnings'],
    },
  },
  parent: {
    role: 'parent',
    label: 'Parent / Guardian',
    portal: 'Parent Portal',
    emoji: '👪',
    accent: '#64748b',
    soft: '#f1f5f9',
    ink: '#334155',
    home: '/parent',
    sidebar: 'light',
    nav: [
      { to: '/parent', label: 'Overview', icon: LayoutDashboard },
      { to: '/parent/progress', label: 'Academic Progress', icon: LineChart },
      { to: '/parent/attendance', label: 'Attendance', icon: CalendarCheck },
      { to: '/parent/assignments', label: 'Assignments', icon: ClipboardList },
      { to: '/parent/teachers', label: 'Teachers', icon: UsersRound },
      { to: '/parent/subscriptions', label: 'Subscriptions', icon: CreditCard },
      { to: '/parent/billing', label: 'My Billing', icon: Receipt },
      { to: '/parent/access', label: 'Parent Access', icon: UserCheck, hint: 'Optional' },
      { to: '/parent/messages', label: 'Messages', icon: MessageCircle },
      { to: '/parent/safety', label: 'Safety & Reports', icon: ShieldCheck },
      { to: '/parent/support', label: 'Special Support', icon: HeartHandshake },
    ],
    user: {
      name: 'Mrs. Ngozi Bakare',
      meta: 'Parent · 2 children',
      initials: 'NB',
      avatarBg: '#64748b',
      avatarColor: '#ffffff',
    },
    footer: 'asd',
    marketing: {
      title: 'Parent / Guardian',
      level: 'Monitor & Support',
      description: "Track your child's progress, manage subscriptions and communicate with teachers.",
      chips: ['Progress Reports', 'Subscriptions', 'Teacher Chat'],
    },
  },
  admin: {
    role: 'admin',
    label: 'Administrator',
    portal: 'Admin Manager',
    emoji: '🛡️',
    accent: '#475569',
    soft: '#eef1f4',
    ink: '#1e293b',
    home: '/admin',
    sidebar: 'solid',
    wideSidebar: true,
    nav: [
      { to: '/admin', label: 'Overview', icon: LayoutDashboard },
      { to: '/admin/sales', label: 'Sales', icon: TrendingUp },
      { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { to: '/admin/products', label: 'Products', icon: Package },
      { to: '/admin/finance', label: 'Finance', icon: Wallet },
      { to: '/admin/invoices', label: 'Invoices', icon: Receipt },
      { to: '/admin/payroll', label: 'Teacher Payroll', icon: Banknote },
      { to: '/admin/users', label: 'Users & Approvals', icon: Users },
      { to: '/admin/moderation', label: 'Moderation', icon: ShieldCheck },
      { to: '/admin/reports', label: 'Reports', icon: FileText },
      { to: '/admin/feedback', label: 'Feedback', icon: Star },
      { to: '/admin/support', label: 'Help & Support', icon: LifeBuoy },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
    user: {
      name: 'Zainab Yusuf',
      meta: 'Super Admin · Full access',
      initials: 'ZY',
      avatarBg: '#475569',
      avatarColor: '#ffffff',
    },
    footer: 'ops',
    marketing: {
      title: 'Admin / Super Admin',
      level: 'Platform operations',
      description: 'Approve teachers, moderate content, track revenue, payouts and platform health.',
      chips: ['Approvals', 'Moderation', 'Revenue'],
    },
  },
}

export const landingRoles: Audience[] = ['junior', 'senior', 'special', 'teacher', 'parent']
