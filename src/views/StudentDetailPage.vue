<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'

const route = useRoute()
const router = useRouter()
const student = ref(null)
const loading = ref(true)
const error = ref(null)

async function fetchStudent() {
  loading.value = true
  try {
    const { data } = await api.get(`/students/${route.params.id}`)
    student.value = data
  } catch (e) {
    error.value = 'Failed to load student'
  } finally {
    loading.value = false
  }
}

onMounted(fetchStudent)
</script>

<template>
  <div class="p-8">
    <!-- Back -->
    <router-link to="/students" class="inline-flex items-center gap-2 text-text-secondary hover:text-primary text-sm mb-6 transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to Students
    </router-link>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>

    <div v-else-if="error" class="bg-danger/10 text-danger px-4 py-3 rounded-xl text-sm">{{ error }}</div>

    <template v-else-if="student">
      <!-- Profile Header -->
      <div class="bg-surface rounded-2xl shadow-sm border border-border p-8 mb-6">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-5">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-xl">
              {{ student.firstName?.[0] }}{{ student.lastName?.[0] }}
            </div>
            <div>
              <h1 class="text-2xl font-bold">{{ student.firstName }} {{ student.lastName }}</h1>
              <p class="text-text-secondary text-sm mt-1">{{ student.email }}</p>
              <div class="flex gap-2 mt-2">
                <span class="inline-flex px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">{{ student.studentId }}</span>
                <span class="inline-flex px-2.5 py-1 bg-secondary/10 text-secondary rounded-lg text-xs font-medium">{{ student.currentSemester }}</span>
              </div>
            </div>
          </div>
          <router-link
            :to="`/students/${student.id}/edit`"
            class="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-surface-dark transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </router-link>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Personal Info -->
        <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
          <h2 class="font-semibold mb-4">Personal Information</h2>
          <dl class="space-y-3">
            <div class="flex justify-between text-sm">
              <dt class="text-text-secondary">Department</dt>
              <dd class="font-medium">{{ student.departmentName || '—' }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-text-secondary">Major</dt>
              <dd class="font-medium">{{ student.majorName || '—' }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-text-secondary">Enrollment Year</dt>
              <dd class="font-medium">{{ student.enrollmentYear || '—' }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-text-secondary">Date of Birth</dt>
              <dd class="font-medium">{{ student.dateOfBirth || '—' }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-text-secondary">Phone</dt>
              <dd class="font-medium">{{ student.phone || '—' }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-text-secondary">Address</dt>
              <dd class="font-medium">{{ student.address || '—' }}</dd>
            </div>
          </dl>
        </div>

        <!-- Enrolled Courses -->
        <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
          <h2 class="font-semibold mb-4">Enrolled Courses</h2>
          <div v-if="!student.studentSyllabi?.length" class="text-text-secondary text-sm">No courses enrolled.</div>
          <div v-else class="space-y-3">
            <div
              v-for="ss in student.studentSyllabi"
              :key="ss.id"
              class="flex items-center justify-between p-3 bg-surface-dark rounded-xl"
            >
              <div>
                <p class="font-medium text-sm">{{ ss.syllabusTitle }}</p>
                <p class="text-text-secondary text-xs">{{ ss.syllabusCourseCode }}</p>
              </div>
              <span
                v-if="ss.expectedGrade"
                class="px-2.5 py-1 bg-success/10 text-success rounded-lg text-xs font-semibold"
              >
                {{ ss.expectedGrade }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Career Cards -->
      <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <h2 class="font-semibold mb-4">Career Goals</h2>
        <div v-if="!student.studentCareers?.length" class="text-text-secondary text-sm">No career goals set.</div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="c in student.studentCareers"
            :key="c.id"
            class="p-4 bg-surface-dark rounded-xl"
          >
            <h3 class="font-semibold text-sm mb-1">{{ c.profession }}</h3>
            <p class="text-text-secondary text-xs mb-2">{{ c.description }}</p>
            <div v-if="c.requiredSkills" class="flex flex-wrap gap-1">
              <span
                v-for="skill in c.requiredSkills.split(',')"
                :key="skill"
                class="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs"
              >
                {{ skill.trim() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
