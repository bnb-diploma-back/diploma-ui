<script setup>
import { auth } from '@/stores/auth'

const user = auth.user
const isAdmin = auth.isAdmin
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-2">Welcome, {{ user?.firstName }}!</h1>
    <p class="text-text-secondary text-sm">
      {{ isAdmin ? 'Manage students, courses, and academic resources.' : 'View your courses and plan your study week.' }}
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      <!-- Admin-only cards -->
      <router-link v-if="isAdmin" to="/dictionary" class="bg-surface rounded-2xl p-8 shadow-sm border border-border hover:shadow-md transition-shadow group">
        <div class="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
          <svg class="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 class="text-lg font-semibold mb-1">Departments & Majors</h2>
        <p class="text-text-secondary text-sm">Manage academic departments and their majors.</p>
      </router-link>

      <router-link v-if="isAdmin" to="/students" class="bg-surface rounded-2xl p-8 shadow-sm border border-border hover:shadow-md transition-shadow group">
        <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h2 class="text-lg font-semibold mb-1">Students</h2>
        <p class="text-text-secondary text-sm">Manage student profiles, enrollments, and career goals.</p>
      </router-link>

      <!-- Shared cards -->
      <router-link to="/courses" class="bg-surface rounded-2xl p-8 shadow-sm border border-border hover:shadow-md transition-shadow group">
        <div class="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
          <svg class="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h2 class="text-lg font-semibold mb-1">Courses</h2>
        <p class="text-text-secondary text-sm">{{ isAdmin ? 'Manage course syllabi with weekly plans.' : 'Browse your course syllabi and weekly plans.' }}</p>
      </router-link>

      <router-link to="/weekly" class="bg-surface rounded-2xl p-8 shadow-sm border border-border hover:shadow-md transition-shadow group">
        <div class="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-success/20 transition-colors">
          <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 class="text-lg font-semibold mb-1">Weekly Planner</h2>
        <p class="text-text-secondary text-sm">{{ isAdmin ? 'View student weekly tasks and AI study plans.' : 'View your weekly tasks and generate AI study plans.' }}</p>
      </router-link>
    </div>
  </div>
</template>