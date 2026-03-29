<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '@/stores/auth'

const route = useRoute()
const router = useRouter()

const user = auth.user
const isAdmin = auth.isAdmin

const navItems = computed(() => {
  const items = [
    { name: 'Dashboard', path: '/', icon: 'home' },
  ]

  if (isAdmin.value) {
    items.push(
      { name: 'Departments', path: '/dictionary', icon: 'building' },
      { name: 'Students', path: '/students', icon: 'users' },
    )
  }

  items.push(
    { name: 'Courses', path: '/courses', icon: 'book' },
  )

  if (!isAdmin.value) {
    items.push(
      { name: 'Weekly', path: '/weekly', icon: 'calendar' },
      { name: 'Careers', path: '/careers', icon: 'briefcase' },
      { name: 'AI Chat', path: '/chat', icon: 'chat' },
    )
  }

  return items
})

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <aside class="group/sidebar fixed inset-y-0 left-0 z-40 w-16 hover:w-64 bg-sidebar text-white flex flex-col transition-all duration-300 overflow-hidden">
    <!-- Logo -->
    <div class="p-4 border-b border-white/10 shrink-0">
      <router-link to="/" class="flex items-center gap-3">
        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-sm font-bold shrink-0">
          B
        </div>
        <div class="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          <h1 class="text-base font-bold tracking-tight leading-tight">BNB</h1>
          <p class="text-[10px] text-white/50">Academic Planner</p>
        </div>
      </router-link>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap"
        :class="isActive(item.path)
          ? 'bg-primary text-white shadow-lg shadow-primary/25'
          : 'text-white/60 hover:text-white hover:bg-sidebar-hover'"
        :title="item.name"
      >
        <!-- Icons -->
        <div class="w-5 h-5 shrink-0 flex items-center justify-center">
          <svg v-if="item.icon === 'home'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <svg v-if="item.icon === 'building'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <svg v-if="item.icon === 'users'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <svg v-if="item.icon === 'book'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <svg v-if="item.icon === 'calendar'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <svg v-if="item.icon === 'briefcase'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <svg v-if="item.icon === 'chat'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <span class="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">{{ item.name }}</span>
      </router-link>
    </nav>

    <!-- User / Profile + Logout -->
    <div class="p-2 border-t border-white/10 shrink-0">
      <!-- Profile link (students only) -->
      <router-link
        v-if="!isAdmin"
        to="/profile"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap"
        :class="isActive('/profile')
          ? 'bg-primary text-white shadow-lg shadow-primary/25'
          : 'hover:bg-sidebar-hover'"
      >
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 bg-primary/20 text-primary-light">
          {{ user?.firstName?.[0] }}{{ user?.lastName?.[0] }}
        </div>
        <div class="flex-1 min-w-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
          <p class="text-sm font-medium truncate">{{ user?.firstName }} {{ user?.lastName }}</p>
          <p class="text-xs text-white/40 truncate">{{ user?.email }}</p>
        </div>
        <button @click.prevent="logout" class="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover/sidebar:opacity-100" title="Sign out">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </router-link>

      <!-- Admin user card -->
      <div v-else class="flex items-center gap-3 px-3 py-2.5">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 bg-accent/20 text-accent">
          {{ user?.firstName?.[0] }}{{ user?.lastName?.[0] }}
        </div>
        <div class="flex-1 min-w-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          <p class="text-sm font-medium truncate">{{ user?.firstName }} {{ user?.lastName }}</p>
          <p class="text-xs text-white/40 truncate">{{ user?.role }}</p>
        </div>
        <button @click="logout" class="p-1.5 text-white/40 hover:text-white hover:bg-sidebar-hover rounded-lg transition-colors opacity-0 group-hover/sidebar:opacity-100" title="Sign out">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>