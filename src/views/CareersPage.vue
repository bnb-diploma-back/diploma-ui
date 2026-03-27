<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'
import { auth } from '@/stores/auth'

const isAdmin = auth.isAdmin
const isStudent = auth.isStudent
const studentId = ref(auth.studentId.value || '1')

const data = ref(null)
const loading = ref(true)
const generating = ref(false)
const error = ref(null)
const expandedCard = ref(null)

const demandColors = {
  HIGH: { bg: 'bg-success/10', text: 'text-success' },
  MEDIUM: { bg: 'bg-secondary/10', text: 'text-secondary' },
  LOW: { bg: 'bg-warning/10', text: 'text-warning' },
  EMERGING: { bg: 'bg-primary/10', text: 'text-primary' },
}

function matchColor(pct) {
  if (pct >= 80) return 'text-success'
  if (pct >= 60) return 'text-warning'
  return 'text-danger'
}

function matchBg(pct) {
  if (pct >= 80) return 'stroke-success'
  if (pct >= 60) return 'stroke-warning'
  return 'stroke-danger'
}

function careersUrl() {
  return isStudent.value ? '/careers/me' : `/careers/students/${studentId.value}`
}

function generateUrl() {
  return isStudent.value ? '/careers/me/generate' : `/careers/students/${studentId.value}/generate`
}

async function fetchCareers() {
  loading.value = true
  error.value = null
  try {
    const { data: d } = await api.get(careersUrl())
    data.value = d
  } catch (e) {
    if (e.response?.status !== 404) {
      error.value = 'Failed to load career cards'
    }
    data.value = null
  } finally {
    loading.value = false
  }
}

async function generateCareers() {
  generating.value = true
  error.value = null
  try {
    const { data: d } = await api.post(generateUrl())
    data.value = d
    expandedCard.value = null
  } catch (e) {
    error.value = 'Failed to generate career cards. Make sure the student has enrolled courses.'
  } finally {
    generating.value = false
  }
}

function toggleCard(i) {
  expandedCard.value = expandedCard.value === i ? null : i
}

onMounted(fetchCareers)
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold">AI Career Cards</h1>
        <p class="text-text-secondary text-sm mt-1">
          {{ data?.studentName ? `${data.studentName} — ${data.major || ''}` : 'AI-powered career recommendations based on your profile' }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Admin student selector -->
        <div v-if="isAdmin" class="flex items-center gap-2">
          <label class="text-sm text-text-secondary">Student ID:</label>
          <input
            v-model="studentId"
            @change="fetchCareers"
            class="px-3 py-1.5 border border-border rounded-lg text-sm w-24 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <button
          @click="generateCareers"
          :disabled="generating"
          class="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
        >
          <svg v-if="generating" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          {{ generating ? 'Generating...' : (data?.careerCards?.length ? 'Regenerate' : 'Generate') }}
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-danger/10 text-danger px-4 py-3 rounded-xl mb-6 text-sm">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>

    <!-- Generating -->
    <div v-else-if="generating" class="flex flex-col items-center justify-center py-20">
      <div class="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
      <h3 class="font-semibold text-lg mb-2">Analyzing your profile...</h3>
      <p class="text-text-secondary text-sm">AI is matching your courses and grades to career paths. This takes 5-15 seconds.</p>
    </div>

    <!-- Empty -->
    <div v-else-if="!data?.careerCards?.length" class="text-center py-20">
      <div class="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-5">
        <svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 class="font-semibold text-xl mb-2">No career cards yet</h3>
      <p class="text-text-secondary text-sm mb-6 max-w-md mx-auto">
        Click "Generate" to let AI analyze your courses, grades, and goals to recommend matching career paths.
      </p>
    </div>

    <!-- Career Cards -->
    <div v-else class="space-y-6">
      <div
        v-for="(card, i) in data.careerCards"
        :key="i"
        class="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden"
      >
        <!-- Card Header (always visible) -->
        <div
          class="px-6 py-5 cursor-pointer hover:bg-surface-dark/30 transition-colors"
          @click="toggleCard(i)"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-4 flex-1 min-w-0">
              <!-- Match percentage circle -->
              <div v-if="card.matchPercentage" class="relative w-14 h-14 shrink-0">
                <svg class="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="#e2e8f0" stroke-width="4" />
                  <circle
                    cx="28" cy="28" r="24" fill="none"
                    :class="matchBg(card.matchPercentage)"
                    stroke-width="4"
                    stroke-linecap="round"
                    :stroke-dasharray="`${card.matchPercentage * 1.508} 150.8`"
                  />
                </svg>
                <span class="absolute inset-0 flex items-center justify-center text-xs font-bold" :class="matchColor(card.matchPercentage)">
                  {{ card.matchPercentage }}%
                </span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <h2 class="text-lg font-semibold">{{ card.profession }}</h2>
                  <span v-if="card.demandLevel" class="px-2.5 py-0.5 rounded-lg text-xs font-medium"
                    :class="[demandColors[card.demandLevel]?.bg, demandColors[card.demandLevel]?.text]">
                    {{ card.demandLevel }}
                  </span>
                </div>
                <p class="text-text-secondary text-sm line-clamp-2">{{ card.description }}</p>
                <div class="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                  <span v-if="card.averageSalaryRange" class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ card.averageSalaryRange }}
                  </span>
                  <span v-if="card.industryDomain" class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                    </svg>
                    {{ card.industryDomain }}
                  </span>
                </div>
              </div>
            </div>

            <svg class="w-5 h-5 text-text-secondary shrink-0 transition-transform" :class="expandedCard === i ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <!-- Expanded details -->
        <div v-if="expandedCard === i" class="border-t border-border">
          <!-- Seniority Path -->
          <div v-if="card.seniorityPath" class="px-6 py-4 bg-surface-dark/30 border-b border-border">
            <p class="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Growth Path</p>
            <div class="flex items-center gap-2 overflow-x-auto text-sm">
              <template v-for="(step, si) in card.seniorityPath.split('→')" :key="si">
                <span class="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium whitespace-nowrap">{{ step.trim() }}</span>
                <svg v-if="si < card.seniorityPath.split('→').length - 1" class="w-4 h-4 text-text-secondary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </template>
            </div>
          </div>

          <div class="px-6 py-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Matching Courses -->
            <div v-if="card.matchingCourses?.length">
              <p class="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Matching Courses</p>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="c in card.matchingCourses" :key="c" class="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
                  {{ c }}
                </span>
              </div>
            </div>

            <!-- Required Skills -->
            <div v-if="card.requiredSkills">
              <p class="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Required Skills</p>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="s in card.requiredSkills.split(',')" :key="s" class="px-2.5 py-1 bg-secondary/10 text-secondary rounded-lg text-xs">
                  {{ s.trim() }}
                </span>
              </div>
            </div>

            <!-- Strengths -->
            <div v-if="card.strengthAreas?.length">
              <p class="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Your Strengths</p>
              <ul class="space-y-1.5">
                <li v-for="s in card.strengthAreas" :key="s" class="flex items-start gap-2 text-sm">
                  <svg class="w-4 h-4 text-success shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ s }}
                </li>
              </ul>
            </div>

            <!-- Gaps -->
            <div v-if="card.gapAreas?.length">
              <p class="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Areas to Improve</p>
              <ul class="space-y-1.5">
                <li v-for="g in card.gapAreas" :key="g" class="flex items-start gap-2 text-sm">
                  <svg class="w-4 h-4 text-warning shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  {{ g }}
                </li>
              </ul>
            </div>

            <!-- Recommended Actions -->
            <div v-if="card.recommendedActions?.length" class="lg:col-span-2">
              <p class="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Recommended Actions</p>
              <ul class="space-y-1.5">
                <li v-for="a in card.recommendedActions" :key="a" class="flex items-start gap-2 text-sm">
                  <svg class="w-4 h-4 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {{ a }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Why this fits -->
          <div v-if="card.whyThisFits" class="px-6 py-4 border-t border-border bg-primary/5">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Why This Fits You</p>
                <p class="text-sm">{{ card.whyThisFits }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
