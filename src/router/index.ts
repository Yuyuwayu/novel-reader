import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// ── Route meta type augmentation ──────────────────────────────────────────────
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresAdmin?: boolean
    requiresGuest?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ── Existing public routes ────────────────────────────────────────────────
    {
      path: '/',
      component: () => import('@/pages/HomePage.vue'),
    },
    {
      path: '/catalog',
      redirect: (to) => ({ path: '/finder', query: to.query }),
    },
    {
      path: '/discovery',
      redirect: '/',
    },
    {
      path: '/leaderboard',
      component: () => import('@/pages/LeaderboardPage.vue'),
    },
    {
      path: '/finder',
      component: () => import('@/pages/FinderPage.vue'),
    },
    {
      path: '/user/:username',
      component: () => import('@/pages/UserProfilePage.vue'),
    },
    {
      path: '/novel/:novelId',
      component: () => import('@/pages/DetailPage.vue'),
    },
    {
      path: '/novel/:novelId/chapter/:chapterNumber',
      component: () => import('@/pages/ReadingPage.vue'),
    },

    // ── Auth routes (guest only) ──────────────────────────────────────────────
    {
      path: '/login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/register',
      component: () => import('@/pages/RegisterPage.vue'),
      meta: { requiresGuest: true },
    },

    // ── Protected routes (user + admin) ──────────────────────────────────────
    {
      path: '/notifications',
      component: () => import('@/pages/NotificationsPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/library',
      component: () => import('@/pages/LibraryPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/notes',
      component: () => import('@/pages/NotesPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/bookmarks',
      component: () => import('@/pages/BookmarkPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/history',
      component: () => import('@/pages/HistoryPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      component: () => import('@/pages/ProfilePage.vue'),
      meta: { requiresAuth: true },
    },

    // ── Admin routes (admin only) ─────────────────────────────────────────────
    {
      path: '/admin',
      component: () => import('@/pages/admin/AdminDashboardPage.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/novels',
      component: () => import('@/pages/admin/AdminNovelsPage.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/novels/new',
      component: () => import('@/pages/admin/AdminNovelFormPage.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/novels/:novelId/edit',
      component: () => import('@/pages/admin/AdminNovelFormPage.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/novels/:novelId/chapters',
      component: () => import('@/pages/admin/AdminChaptersPage.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/novels/:novelId/chapters/new',
      component: () => import('@/pages/admin/AdminChapterFormPage.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/novels/:novelId/chapters/:chapterNumber/edit',
      component: () => import('@/pages/admin/AdminChapterFormPage.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/genres',
      component: () => import('@/pages/admin/AdminGenresPage.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/tags',
      component: () => import('@/pages/admin/AdminTagsPage.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/reports',
      component: () => import('@/pages/admin/AdminReportsPage.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },

    // ── Error pages ───────────────────────────────────────────────────────────
    {
      path: '/403',
      component: () => import('@/pages/ForbiddenPage.vue'),
    },

    // ── Catch-all (must remain last) ──────────────────────────────────────────
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/pages/NotFoundPage.vue'),
    },
  ],
})

// ── Navigation guard ──────────────────────────────────────────────────────────
router.beforeEach(async (to, _from) => {
  const auth = useAuthStore()

  // Guest guard: redirect to / if already logged in
  if (to.meta.requiresGuest && auth.isAuthenticated) {
    return { path: '/' }
  }

  // Auth guard
  if (to.meta.requiresAuth) {
    if (!auth.isAuthenticated) {
      const refreshed = await auth.tryRefreshToken()
      if (!refreshed) {
        return { path: '/login', query: { redirect: to.fullPath } }
      }
    }

    // Role guard
    if (to.meta.requiresAdmin && !auth.isAdmin) {
      return { path: '/403' }
    }
  }
})

export default router
