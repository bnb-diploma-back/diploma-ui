<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import { auth } from '@/stores/auth'

const route = useRoute()
const router = useRouter()

const isAdmin = auth.isAdmin
const isStudent = auth.isStudent
const studentId = ref(route.query.studentId || auth.studentId.value || '1')
const weekNumber = ref(Number(route.query.week) || 1)
const weeklyData = ref(null)
const loading = ref(true)
const error = ref(null)

const weeks = Array.from({ length: 15 }, (_, i) => i + 1)

const statusColors = {
  OVERDUE: { bg: 'bg-danger/10', text: 'text-danger', dot: 'bg-danger' },
  PENDING: { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning' },
  IN_PROGRESS: { bg: 'bg-secondary/10', text: 'text-secondary', dot: 'bg-secondary' },
  SUBMITTED: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
  GRADED: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
  RETURNED: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
}

const taskTypeIcons = {
  HOMEWORK: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  LAB: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  PROJECT: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
  QUIZ: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  MIDTERM: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  FINAL: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  PRESENTATION: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z',
  ESSAY: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
}

function daysRemaining(dueDate) {
  if (!dueDate) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  return diff
}

function daysLabel(days) {
  if (days === null) return ''
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `${days}d left`
}

function daysColor(days) {
  if (days === null) return 'text-text-secondary'
  if (days <= 0) return 'text-danger font-semibold'
  if (days <= 2) return 'text-danger'
  if (days <= 5) return 'text-warning'
  return 'text-text-secondary'
}

async function fetchWeekly() {
  loading.value = true
  error.value = null
  try {
    const url = isStudent.value
      ? `/weekly/me/weeks/${weekNumber.value}`
      : `/weekly/students/${studentId.value}/weeks/${weekNumber.value}`
    const { data } = await api.get(url)
    weeklyData.value = data
  } catch (e) {
    error.value = 'Failed to load weekly tasks'
    weeklyData.value = null
  } finally {
    loading.value = false
  }
}

function changeWeek(w) {
  weekNumber.value = w
  router.replace({ query: { ...route.query, week: w } })
}

watch([studentId, weekNumber], fetchWeekly)
onMounted(fetchWeekly)
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold">Weekly Planner</h1>
        <p class="text-text-secondary text-sm mt-1" v-if="weeklyData">
          {{ weeklyData.studentFirstName }} {{ weeklyData.studentLastName }} — Week {{ weekNumber }}
        </p>
      </div>
      <router-link
        :to="isAdmin ? `/weekly/plan?studentId=${studentId}&week=${weekNumber}` : `/weekly/plan?week=${weekNumber}`"
        class="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        AI Study Plan
      </router-link>
    </div>

    <!-- Week Selector -->
    <div class="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
      <button
        v-for="w in weeks"
        :key="w"
        @click="changeWeek(w)"
        class="shrink-0 w-10 h-10 rounded-xl text-sm font-medium transition-all duration-200"
        :class="w === weekNumber
          ? 'bg-primary text-white shadow-lg shadow-primary/25'
          : 'bg-surface border border-border text-text-secondary hover:border-primary hover:text-primary'"
      >
        {{ w }}
      </button>
    </div>

    <!-- Student ID input (admin only) -->
    <div v-if="isAdmin" class="mb-6 flex items-center gap-3">
      <label class="text-sm text-text-secondary">Student ID:</label>
      <input
        v-model="studentId"
        class="px-3 py-1.5 border border-border rounded-lg text-sm w-24 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        placeholder="1"
      />
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-danger/10 text-danger px-4 py-3 rounded-xl mb-6 text-sm">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="!weeklyData || !weeklyData.courses?.length" class="text-center py-20">
      <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 class="font-semibold text-lg mb-1">No tasks for Week {{ weekNumber }}</h3>
      <p class="text-text-secondary text-sm">Try selecting a different week or check that the student has enrolled courses.</p>
    </div>

    <!-- Course Cards -->
    <div v-else class="space-y-6">
      <div
        v-for="course in weeklyData.courses"
        :key="course.syllabusId"
        class="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden"
      >
        <!-- Course Header -->
        <div class="px-6 py-4 border-b border-border flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <span class="text-primary font-bold text-sm">{{ course.courseCode?.slice(-3) }}</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="font-semibold">{{ course.courseTitle }}</h2>
                <span class="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">{{ course.courseCode }}</span>
              </div>
              <p class="text-text-secondary text-xs mt-0.5">{{ course.instructor }} · {{ course.credits }} credits</p>
            </div>
          </div>
          <span
            v-if="course.expectedGrade"
            class="px-3 py-1.5 bg-success/10 text-success rounded-xl text-sm font-bold"
          >
            {{ course.expectedGrade }}
          </span>
        </div>

        <!-- Tasks -->
        <div class="divide-y divide-border">
          <div
            v-for="task in course.tasks"
            :key="task.id"
            class="px-6 py-4 hover:bg-surface-dark/50 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <!-- Task Type Icon -->
                <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  :class="statusColors[task.status]?.bg || 'bg-surface-dark'">
                  <svg class="w-4 h-4" :class="statusColors[task.status]?.text || 'text-text-secondary'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="taskTypeIcons[task.taskType] || taskTypeIcons.HOMEWORK" />
                  </svg>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="font-medium text-sm">{{ task.title }}</h3>
                    <span class="px-2 py-0.5 rounded text-xs font-medium"
                      :class="[statusColors[task.status]?.bg, statusColors[task.status]?.text]">
                      {{ task.status?.replace('_', ' ') }}
                    </span>
                    <span class="px-2 py-0.5 bg-surface-dark rounded text-xs text-text-secondary">
                      {{ task.taskType }}
                    </span>
                  </div>
                  <p v-if="task.description" class="text-text-secondary text-xs mt-1 line-clamp-1">{{ task.description }}</p>
                  <div class="flex items-center gap-4 mt-2 text-xs">
                    <span v-if="task.dueDate" :class="daysColor(daysRemaining(task.dueDate))">
                      {{ task.dueDate }} · {{ daysLabel(daysRemaining(task.dueDate)) }}
                    </span>
                    <span v-if="task.maxScore" class="text-text-secondary">
                      Max: {{ task.maxScore }} pts
                    </span>
                    <span v-if="task.score !== null && task.score !== undefined" class="text-success font-medium">
                      Score: {{ task.score }}/{{ task.maxScore }}
                    </span>
                  </div>
                  <p v-if="task.instructions" class="text-text-secondary text-xs mt-1 italic">{{ task.instructions }}</p>
                  <p v-if="task.feedback" class="text-primary text-xs mt-1">Feedback: {{ task.feedback }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty tasks -->
          <div v-if="!course.tasks?.length" class="px-6 py-8 text-center text-text-secondary text-sm">
            No tasks for this course in Week {{ weekNumber }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>