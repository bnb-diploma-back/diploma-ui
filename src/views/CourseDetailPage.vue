<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'
import { auth } from '@/stores/auth'

const isAdmin = auth.isAdmin

const route = useRoute()
const course = ref(null)
const loading = ref(true)
const error = ref(null)

async function fetchCourse() {
  loading.value = true
  try {
    const { data } = await api.get(`/syllabi/${route.params.id}`)
    course.value = data
  } catch (e) {
    error.value = 'Failed to load course'
  } finally {
    loading.value = false
  }
}

onMounted(fetchCourse)
</script>

<template>
  <div class="p-8">
    <!-- Back -->
    <router-link to="/courses" class="inline-flex items-center gap-2 text-text-secondary hover:text-primary text-sm mb-6 transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to Courses
    </router-link>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>

    <div v-else-if="error" class="bg-danger/10 text-danger px-4 py-3 rounded-xl text-sm">{{ error }}</div>

    <template v-else-if="course">
      <!-- Header -->
      <div class="bg-surface rounded-2xl shadow-sm border border-border p-8 mb-6">
        <div class="flex items-start justify-between">
          <div>
            <span class="inline-flex px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-semibold mb-3">{{ course.courseCode }}</span>
            <h1 class="text-2xl font-bold mb-2">{{ course.title }}</h1>
            <p class="text-text-secondary text-sm">{{ course.description }}</p>
            <div class="flex flex-wrap gap-2 mt-4">
              <span class="px-2.5 py-1 bg-secondary/10 text-secondary rounded-lg text-xs font-medium">{{ course.credits }} credits</span>
              <span v-if="course.semester" class="px-2.5 py-1 bg-accent/10 text-accent rounded-lg text-xs font-medium">{{ course.semester }} {{ course.academicYear }}</span>
              <span v-if="course.department" class="px-2.5 py-1 bg-surface-dark rounded-lg text-xs font-medium text-text-secondary">{{ course.department }}</span>
            </div>
          </div>
          <router-link
            v-if="isAdmin"
            :to="`/courses/${course.id}/edit`"
            class="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-surface-dark transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </router-link>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Course Info -->
        <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
          <h2 class="font-semibold mb-4">Course Details</h2>
          <dl class="space-y-3">
            <div class="flex justify-between text-sm">
              <dt class="text-text-secondary">Instructor</dt>
              <dd class="font-medium">{{ course.instructor || '—' }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-text-secondary">Prerequisites</dt>
              <dd class="font-medium">{{ course.prerequisites || '—' }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-text-secondary">Start Date</dt>
              <dd class="font-medium">{{ course.startDate || '—' }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-text-secondary">End Date</dt>
              <dd class="font-medium">{{ course.endDate || '—' }}</dd>
            </div>
          </dl>
        </div>

        <!-- Assessment & Resources -->
        <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
          <h2 class="font-semibold mb-4">Assessment & Resources</h2>
          <dl class="space-y-3">
            <div v-if="course.assessmentCriteria" class="text-sm">
              <dt class="text-text-secondary mb-1">Assessment Criteria</dt>
              <dd class="font-medium">{{ course.assessmentCriteria }}</dd>
            </div>
            <div v-if="course.requiredTextbooks" class="text-sm">
              <dt class="text-text-secondary mb-1">Required Textbooks</dt>
              <dd class="font-medium">{{ course.requiredTextbooks }}</dd>
            </div>
            <div v-if="course.recommendedReading" class="text-sm">
              <dt class="text-text-secondary mb-1">Recommended Reading</dt>
              <dd class="font-medium">{{ course.recommendedReading }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Objectives & Outcomes -->
      <div v-if="course.objectives || course.learningOutcomes" class="bg-surface rounded-2xl shadow-sm border border-border p-6 mb-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div v-if="course.objectives">
            <h2 class="font-semibold mb-2">Objectives</h2>
            <p class="text-text-secondary text-sm">{{ course.objectives }}</p>
          </div>
          <div v-if="course.learningOutcomes">
            <h2 class="font-semibold mb-2">Learning Outcomes</h2>
            <p class="text-text-secondary text-sm">{{ course.learningOutcomes }}</p>
          </div>
        </div>
      </div>

      <!-- Weekly Plans -->
      <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <h2 class="font-semibold mb-4">Weekly Plans</h2>
        <div v-if="!course.weeklyPlans?.length" class="text-text-secondary text-sm">No weekly plans defined.</div>
        <div v-else class="space-y-3">
          <details
            v-for="wp in course.weeklyPlans.slice().sort((a, b) => a.weekNumber - b.weekNumber)"
            :key="wp.id"
            class="group border border-border rounded-xl overflow-hidden"
          >
            <summary class="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface-dark transition-colors">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-sm font-semibold">
                  {{ wp.weekNumber }}
                </span>
                <span class="font-medium text-sm">{{ wp.topic }}</span>
              </div>
              <svg class="w-4 h-4 text-text-secondary group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div class="px-5 pb-4 border-t border-border pt-4">
              <dl class="space-y-3 text-sm">
                <div v-if="wp.learningObjectives">
                  <dt class="text-text-secondary text-xs font-medium uppercase tracking-wider mb-1">Learning Objectives</dt>
                  <dd>{{ wp.learningObjectives }}</dd>
                </div>
                <div v-if="wp.lectureContent">
                  <dt class="text-text-secondary text-xs font-medium uppercase tracking-wider mb-1">Lecture Content</dt>
                  <dd>{{ wp.lectureContent }}</dd>
                </div>
                <div v-if="wp.practiceContent">
                  <dt class="text-text-secondary text-xs font-medium uppercase tracking-wider mb-1">Practice</dt>
                  <dd>{{ wp.practiceContent }}</dd>
                </div>
                <div v-if="wp.assignments">
                  <dt class="text-text-secondary text-xs font-medium uppercase tracking-wider mb-1">Assignments</dt>
                  <dd>{{ wp.assignments }}</dd>
                </div>
                <div v-if="wp.readings">
                  <dt class="text-text-secondary text-xs font-medium uppercase tracking-wider mb-1">Readings</dt>
                  <dd>{{ wp.readings }}</dd>
                </div>
              </dl>
            </div>
          </details>
        </div>
      </div>
    </template>
  </div>
</template>