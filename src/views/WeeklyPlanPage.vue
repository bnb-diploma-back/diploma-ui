<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'
import { auth } from '@/stores/auth'

const route = useRoute()

const isStudent = auth.isStudent
const isAdmin = auth.isAdmin
const studentId = ref(route.query.studentId || auth.studentId.value || '1')
const weekNumber = ref(Number(route.query.week) || 1)
const plan = ref(null)
const loading = ref(false)
const generating = ref(false)
const error = ref(null)
const activeDay = ref(0)

const effortColors = {
  HIGH_FOCUS: { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/30', bar: 'bg-danger' },
  MODERATE: { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/30', bar: 'bg-secondary' },
  LOW_EFFORT: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30', bar: 'bg-success' },
  REST: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200', bar: 'bg-gray-400' },
}

const activityIcons = {
  DEEP_WORK: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  LIGHT_REVIEW: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  PRACTICE: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  READING: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  BREAK: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  ACTIVE_REST: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
}

const wellBeingIcons = {
  activeRestSuggestions: { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Active Rest', color: 'text-success' },
  breakStrategies: { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Break Strategies', color: 'text-secondary' },
  nutritionTips: { icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', label: 'Nutrition', color: 'text-danger' },
  sleepRecommendations: { icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z', label: 'Sleep', color: 'text-primary' },
  mindfulnessTips: { icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', label: 'Mindfulness', color: 'text-accent' },
}

function weekBase() {
  return isStudent.value
    ? `/weekly/me/weeks/${weekNumber.value}`
    : `/weekly/students/${studentId.value}/weeks/${weekNumber.value}`
}

async function fetchPlan() {
  loading.value = true
  error.value = null
  try {
    const { data } = await api.get(`${weekBase()}/organize`)
    plan.value = data
  } catch (e) {
    // Backend throws RuntimeException (500) or 404 when no plan exists yet — both are expected
    const status = e.response?.status
    const message = e.response?.data?.message || e.response?.data || ''
    const isNoPlan = status === 404 || (status === 500 && String(message).includes('No organizer found'))
    if (!isNoPlan) {
      error.value = 'Failed to load study plan'
    }
    plan.value = null
  } finally {
    loading.value = false
  }
}

async function generatePlan() {
  generating.value = true
  error.value = null
  try {
    const { data } = await api.post(`${weekBase()}/organize`)
    plan.value = data
  } catch (e) {
    error.value = 'Failed to generate study plan. Make sure the student has tasks for this week.'
  } finally {
    generating.value = false
  }
}

function totalMinutes(day) {
  return day.timeBlocks?.reduce((sum, b) => sum + (b.estimatedMinutes || 0), 0) || 0
}

function formatMinutes(m) {
  const h = Math.floor(m / 60)
  const mins = m % 60
  if (h === 0) return `${mins}m`
  if (mins === 0) return `${h}h`
  return `${h}h ${mins}m`
}

onMounted(fetchPlan)
</script>

<template>
  <div class="p-8">
    <!-- Back -->
    <router-link
      :to="isAdmin ? `/weekly?studentId=${studentId}&week=${weekNumber}` : `/weekly?week=${weekNumber}`"
      class="inline-flex items-center gap-2 text-text-secondary hover:text-primary text-sm mb-6 transition-colors"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to Weekly Tasks
    </router-link>

    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold">AI Study Plan</h1>
        <p class="text-text-secondary text-sm mt-1">Week {{ weekNumber }} — AI-generated daily schedule</p>
      </div>
      <button
        @click="generatePlan"
        :disabled="generating"
        class="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
      >
        <svg v-if="generating" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {{ generating ? 'Generating...' : (plan ? 'Regenerate Plan' : 'Generate Plan') }}
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-danger/10 text-danger px-4 py-3 rounded-xl mb-6 text-sm">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>

    <!-- Generating overlay -->
    <div v-else-if="generating" class="flex flex-col items-center justify-center py-20">
      <div class="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
      <h3 class="font-semibold text-lg mb-2">Creating your study plan...</h3>
      <p class="text-text-secondary text-sm">AI is analyzing your tasks and building an optimized schedule. This takes 5-15 seconds.</p>
    </div>

    <!-- No plan yet -->
    <div v-else-if="!plan" class="text-center py-20">
      <div class="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-5">
        <svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      <h3 class="font-semibold text-xl mb-2">No study plan yet</h3>
      <p class="text-text-secondary text-sm mb-6 max-w-md mx-auto">
        Click "Generate Plan" to let AI create a personalized daily schedule based on your Week {{ weekNumber }} tasks, goals, and effort levels.
      </p>
      <button
        @click="generatePlan"
        :disabled="generating"
        class="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Generate Study Plan
      </button>
    </div>

    <!-- Plan Content -->
    <template v-else>
      <!-- Weekly Summary -->
      <div class="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-6">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-sm text-primary mb-1">Weekly Summary</h3>
            <p class="text-sm">{{ plan.weeklySummary }}</p>
          </div>
        </div>
      </div>

      <!-- Day Tabs -->
      <div class="flex gap-2 mb-6 overflow-x-auto pb-2" v-if="plan.dailyPlans?.length">
        <button
          v-for="(day, i) in plan.dailyPlans"
          :key="day.day"
          @click="activeDay = i"
          class="shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          :class="i === activeDay
            ? 'bg-primary text-white shadow-lg shadow-primary/25'
            : 'bg-surface border border-border text-text-secondary hover:border-primary hover:text-primary'"
        >
          <span>{{ day.day }}</span>
          <span class="ml-1.5 text-xs opacity-70">{{ formatMinutes(totalMinutes(day)) }}</span>
        </button>
      </div>

      <!-- Active Day Content -->
      <div v-if="plan.dailyPlans?.[activeDay]" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Timeline (2/3) -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Daily Tip -->
          <div v-if="plan.dailyPlans[activeDay].dailyTip" class="bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-start gap-3">
            <svg class="w-5 h-5 text-accent shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p class="text-sm">{{ plan.dailyPlans[activeDay].dailyTip }}</p>
          </div>

          <!-- Time Blocks -->
          <div class="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            <div class="px-6 py-4 border-b border-border">
              <h2 class="font-semibold">Schedule</h2>
            </div>
            <div class="divide-y divide-border">
              <div
                v-for="(block, bi) in plan.dailyPlans[activeDay].timeBlocks"
                :key="bi"
                class="px-6 py-4 flex gap-4 hover:bg-surface-dark/50 transition-colors"
              >
                <!-- Time -->
                <div class="w-24 shrink-0 text-right">
                  <p class="text-sm font-semibold">{{ block.startTime }}</p>
                  <p class="text-xs text-text-secondary">{{ block.endTime }}</p>
                </div>

                <!-- Effort Bar -->
                <div class="w-1 rounded-full shrink-0" :class="effortColors[block.effortLevel]?.bar || 'bg-gray-300'"></div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <svg class="w-4 h-4 shrink-0" :class="effortColors[block.effortLevel]?.text || 'text-gray-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="activityIcons[block.activityType] || activityIcons.DEEP_WORK" />
                    </svg>
                    <h3 class="font-medium text-sm">{{ block.taskTitle }}</h3>
                    <span v-if="block.courseCode" class="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">{{ block.courseCode }}</span>
                    <span class="px-2 py-0.5 rounded text-xs"
                      :class="[effortColors[block.effortLevel]?.bg, effortColors[block.effortLevel]?.text]">
                      {{ block.effortLevel?.replace('_', ' ') }}
                    </span>
                  </div>
                  <p v-if="block.courseName" class="text-text-secondary text-xs mt-0.5">{{ block.courseName }}</p>
                  <p v-if="block.focusTip" class="text-text-secondary text-xs mt-1.5 italic flex items-start gap-1.5">
                    <svg class="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    {{ block.focusTip }}
                  </p>
                  <span class="text-xs text-text-secondary mt-1 inline-block">{{ block.estimatedMinutes }} min</span>
                </div>
              </div>

              <div v-if="!plan.dailyPlans[activeDay].timeBlocks?.length" class="px-6 py-8 text-center text-text-secondary text-sm">
                No schedule blocks for this day
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar (1/3) -->
        <div class="space-y-4">
          <!-- Additional Tasks -->
          <div v-if="plan.additionalTasks?.length" class="bg-surface rounded-2xl shadow-sm border border-border p-5">
            <h3 class="font-semibold text-sm mb-3">Extra Tasks to Reach Your Goals</h3>
            <div class="space-y-3">
              <div
                v-for="(task, ti) in plan.additionalTasks"
                :key="ti"
                class="p-3 rounded-xl border border-border"
              >
                <div class="flex items-center gap-2 mb-1">
                  <span v-if="task.courseCode" class="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">{{ task.courseCode }}</span>
                  <span class="px-2 py-0.5 rounded text-xs"
                    :class="[effortColors[task.effortLevel]?.bg, effortColors[task.effortLevel]?.text]">
                    {{ task.activityType?.replace('_', ' ') }}
                  </span>
                </div>
                <h4 class="font-medium text-sm">{{ task.taskTitle }}</h4>
                <p v-if="task.description" class="text-text-secondary text-xs mt-1">{{ task.description }}</p>
                <p v-if="task.reason" class="text-xs mt-1.5 text-primary/80 italic">{{ task.reason }}</p>
                <span class="text-xs text-text-secondary mt-1 inline-block">{{ task.estimatedMinutes }} min</span>
              </div>
            </div>
          </div>

          <!-- Well-Being -->
          <div v-if="plan.wellBeing" class="bg-surface rounded-2xl shadow-sm border border-border p-5">
            <h3 class="font-semibold text-sm mb-3">Well-Being Tips</h3>

            <!-- Overall Advice -->
            <div v-if="plan.wellBeing.overallAdvice" class="p-3 bg-success/5 border border-success/20 rounded-xl mb-3 text-sm">
              {{ plan.wellBeing.overallAdvice }}
            </div>

            <div class="space-y-3">
              <div
                v-for="(meta, key) in wellBeingIcons"
                :key="key"
              >
                <div v-if="plan.wellBeing[key]?.length" class="space-y-1">
                  <div class="flex items-center gap-2 mb-1">
                    <svg class="w-4 h-4" :class="meta.color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="meta.icon" />
                    </svg>
                    <span class="text-xs font-semibold uppercase tracking-wider text-text-secondary">{{ meta.label }}</span>
                  </div>
                  <ul class="space-y-1">
                    <li v-for="(tip, ti) in plan.wellBeing[key]" :key="ti" class="text-xs text-text-secondary flex items-start gap-2">
                      <span class="w-1 h-1 rounded-full bg-text-secondary shrink-0 mt-1.5"></span>
                      {{ tip }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>