import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/stores/auth'

const routes = [
  // Auth (no layout)
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginPage.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterPage.vue'),
    meta: { guest: true },
  },
  {
    path: '/setup',
    name: 'StudentSetup',
    component: () => import('@/views/StudentSetupPage.vue'),
    meta: { setup: true },
  },

  // App routes (require auth)
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/DashboardPage.vue'),
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfilePage.vue'),
  },
  {
    path: '/dictionary',
    name: 'Dictionary',
    component: () => import('@/views/DictionaryPage.vue'),
    meta: { adminOnly: true },
  },
  {
    path: '/students',
    name: 'Students',
    component: () => import('@/views/StudentsPage.vue'),
    meta: { adminOnly: true },
  },
  {
    path: '/students/new',
    name: 'StudentCreate',
    component: () => import('@/views/StudentFormPage.vue'),
    meta: { adminOnly: true },
  },
  {
    path: '/students/:id/edit',
    name: 'StudentEdit',
    component: () => import('@/views/StudentFormPage.vue'),
    meta: { adminOnly: true },
  },
  {
    path: '/students/:id',
    name: 'StudentDetail',
    component: () => import('@/views/StudentDetailPage.vue'),
    meta: { adminOnly: true },
  },
  {
    path: '/weekly',
    name: 'Weekly',
    component: () => import('@/views/WeeklyPage.vue'),
    meta: { studentOnly: true },
  },
  {
    path: '/weekly/plan',
    name: 'WeeklyPlan',
    component: () => import('@/views/WeeklyPlanPage.vue'),
    meta: { studentOnly: true },
  },
  {
    path: '/careers',
    name: 'Careers',
    component: () => import('@/views/CareersPage.vue'),
    meta: { studentOnly: true },
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/ChatPage.vue'),
    meta: { studentOnly: true },
  },
  {
    path: '/courses',
    name: 'Courses',
    component: () => import('@/views/CoursesPage.vue'),
  },
  {
    path: '/courses/new',
    name: 'CourseCreate',
    component: () => import('@/views/CourseFormPage.vue'),
    meta: { adminOnly: true },
  },
  {
    path: '/courses/:id/edit',
    name: 'CourseEdit',
    component: () => import('@/views/CourseFormPage.vue'),
    meta: { adminOnly: true },
  },
  {
    path: '/courses/:id',
    name: 'CourseDetail',
    component: () => import('@/views/CourseDetailPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authenticated = auth.isAuthenticated.value
  const isAdmin = auth.isAdmin.value
  const isStudent = auth.isStudent.value
  const hasStudentProfile = !!auth.studentId.value

  // Guest-only pages (login/register): redirect to home if already logged in
  if (to.meta.guest && authenticated) {
    // If student without profile, redirect to setup instead of home
    if (isStudent && !hasStudentProfile) return next('/setup')
    return next('/')
  }

  // Protected pages: redirect to login if not authenticated
  if (!to.meta.guest && !to.meta.setup && !authenticated) {
    return next('/login')
  }

  // Setup page: only for authenticated students without a profile
  if (to.meta.setup) {
    if (!authenticated) return next('/login')
    if (isAdmin || hasStudentProfile) return next('/')
    return next()
  }

  // Student without profile must complete setup first
  if (authenticated && isStudent && !hasStudentProfile && !to.meta.guest) {
    return next('/setup')
  }

  // Admin-only pages: redirect to home if student
  if (to.meta.adminOnly && !isAdmin) {
    return next('/')
  }

  // Student-only pages: redirect to home if admin
  if (to.meta.studentOnly && isAdmin) {
    return next('/')
  }

  next()
})

export default router