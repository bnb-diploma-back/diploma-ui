<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'
import { auth } from '@/stores/auth'

const isAdmin = auth.isAdmin

const courses = ref([])
const loading = ref(true)
const error = ref(null)
const deleteModal = ref({ show: false, course: null })

async function fetchCourses() {
  loading.value = true
  error.value = null
  try {
    const { data } = await api.get('/syllabi')
    courses.value = data
  } catch (e) {
    error.value = 'Failed to load courses'
  } finally {
    loading.value = false
  }
}

function confirmDelete(course) {
  deleteModal.value = { show: true, course }
}

async function deleteCourse() {
  try {
    await api.delete(`/syllabi/${deleteModal.value.course.id}`)
    deleteModal.value = { show: false, course: null }
    fetchCourses()
  } catch (e) {
    error.value = 'Failed to delete course'
  }
}

onMounted(fetchCourses)
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold">Courses</h1>
        <p class="text-text-secondary text-sm mt-1">Manage course syllabi and weekly plans</p>
      </div>
      <router-link
        v-if="isAdmin"
        to="/courses/new"
        class="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Course
      </router-link>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-danger/10 text-danger px-4 py-3 rounded-xl mb-6 text-sm">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="courses.length === 0" class="text-center py-20">
      <div class="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <h3 class="font-semibold text-lg mb-1">No courses yet</h3>
      <p class="text-text-secondary text-sm mb-4">Add your first course syllabus to get started.</p>
      <router-link to="/courses/new" class="text-primary hover:text-primary-dark font-medium text-sm">
        + Add Course
      </router-link>
    </div>

    <!-- Cards Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="c in courses"
        :key="c.id"
        class="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow group"
      >
        <!-- Card Header -->
        <div class="p-5 pb-0">
          <div class="flex items-start justify-between">
            <div>
              <span class="inline-flex px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-semibold mb-2">
                {{ c.courseCode }}
              </span>
              <h3 class="font-semibold text-base">
                <router-link :to="`/courses/${c.id}`" class="hover:text-primary transition-colors">
                  {{ c.title }}
                </router-link>
              </h3>
            </div>
            <div v-if="isAdmin" class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <router-link :to="`/courses/${c.id}/edit`" class="p-1.5 hover:bg-surface-dark rounded-lg text-text-secondary hover:text-accent transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </router-link>
              <button @click="confirmDelete(c)" class="p-1.5 hover:bg-danger/10 rounded-lg text-text-secondary hover:text-danger transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Card Body -->
        <div class="p-5">
          <p class="text-text-secondary text-sm line-clamp-2 mb-4">{{ c.description || 'No description' }}</p>
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-xs text-text-secondary">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {{ c.instructor || 'No instructor' }}
            </div>
            <div class="flex items-center gap-2 text-xs text-text-secondary">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {{ c.department || 'No department' }}
            </div>
          </div>
          <div class="flex items-center gap-2 mt-4 pt-4 border-t border-border">
            <span class="px-2.5 py-1 bg-secondary/10 text-secondary rounded-lg text-xs font-medium">{{ c.credits }} credits</span>
            <span v-if="c.semester" class="px-2.5 py-1 bg-accent/10 text-accent rounded-lg text-xs font-medium">{{ c.semester }}</span>
            <span v-if="c.weeklyPlans?.length" class="px-2.5 py-1 bg-success/10 text-success rounded-lg text-xs font-medium">{{ c.weeklyPlans.length }} weeks</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <Teleport to="body">
      <div v-if="deleteModal.show" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" @click.self="deleteModal.show = false">
        <div class="bg-surface rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
          <h3 class="text-lg font-semibold mb-2">Delete Course</h3>
          <p class="text-text-secondary text-sm mb-6">
            Are you sure you want to delete <strong>{{ deleteModal.course?.courseCode }} — {{ deleteModal.course?.title }}</strong>?
          </p>
          <div class="flex gap-3 justify-end">
            <button @click="deleteModal.show = false" class="px-4 py-2 rounded-xl text-sm font-medium hover:bg-surface-dark transition-colors">Cancel</button>
            <button @click="deleteCourse" class="px-4 py-2 bg-danger text-white rounded-xl text-sm font-medium hover:bg-danger/90 transition-colors">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>