<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

const router = useRouter()
const students = ref([])
const loading = ref(true)
const error = ref(null)
const deleteModal = ref({ show: false, student: null })

async function fetchStudents() {
  loading.value = true
  error.value = null
  try {
    const { data } = await api.get('/students')
    students.value = data
  } catch (e) {
    error.value = 'Failed to load students'
  } finally {
    loading.value = false
  }
}

function confirmDelete(student) {
  deleteModal.value = { show: true, student }
}

async function deleteStudent() {
  try {
    await api.delete(`/students/${deleteModal.value.student.id}`)
    deleteModal.value = { show: false, student: null }
    fetchStudents()
  } catch (e) {
    error.value = 'Failed to delete student'
  }
}

onMounted(fetchStudents)
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold">Students</h1>
        <p class="text-text-secondary text-sm mt-1">Manage student profiles and enrollments</p>
      </div>
      <router-link
        to="/students/new"
        class="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Student
      </router-link>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-danger/10 text-danger px-4 py-3 rounded-xl mb-6 text-sm">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="students.length === 0" class="text-center py-20">
      <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <h3 class="font-semibold text-lg mb-1">No students yet</h3>
      <p class="text-text-secondary text-sm mb-4">Get started by adding your first student.</p>
      <router-link to="/students/new" class="text-primary hover:text-primary-dark font-medium text-sm">
        + Add Student
      </router-link>
    </div>

    <!-- Table -->
    <div v-else class="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="border-b border-border">
            <th class="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Student</th>
            <th class="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Student ID</th>
            <th class="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Department</th>
            <th class="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Semester</th>
            <th class="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="s in students"
            :key="s.id"
            class="border-b border-border last:border-0 hover:bg-surface-dark transition-colors"
          >
            <td class="px-6 py-4">
              <router-link :to="`/students/${s.id}`" class="hover:text-primary transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                    {{ s.firstName?.[0] }}{{ s.lastName?.[0] }}
                  </div>
                  <div>
                    <p class="font-medium">{{ s.firstName }} {{ s.lastName }}</p>
                    <p class="text-text-secondary text-xs">{{ s.email }}</p>
                  </div>
                </div>
              </router-link>
            </td>
            <td class="px-6 py-4">
              <span class="inline-flex px-2.5 py-1 bg-surface-dark rounded-lg text-xs font-mono">{{ s.studentId }}</span>
            </td>
            <td class="px-6 py-4 text-sm text-text-secondary">{{ s.departmentName || '—' }}</td>
            <td class="px-6 py-4">
              <span class="inline-flex px-2.5 py-1 bg-secondary/10 text-secondary rounded-lg text-xs font-medium">
                {{ s.currentSemester }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <router-link
                  :to="`/students/${s.id}`"
                  class="p-2 hover:bg-surface-dark rounded-lg transition-colors text-text-secondary hover:text-primary"
                  title="View"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </router-link>
                <router-link
                  :to="`/students/${s.id}/edit`"
                  class="p-2 hover:bg-surface-dark rounded-lg transition-colors text-text-secondary hover:text-accent"
                  title="Edit"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </router-link>
                <button
                  @click="confirmDelete(s)"
                  class="p-2 hover:bg-danger/10 rounded-lg transition-colors text-text-secondary hover:text-danger"
                  title="Delete"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete Modal -->
    <Teleport to="body">
      <div v-if="deleteModal.show" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" @click.self="deleteModal.show = false">
        <div class="bg-surface rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
          <h3 class="text-lg font-semibold mb-2">Delete Student</h3>
          <p class="text-text-secondary text-sm mb-6">
            Are you sure you want to delete <strong>{{ deleteModal.student?.firstName }} {{ deleteModal.student?.lastName }}</strong>? This action cannot be undone.
          </p>
          <div class="flex gap-3 justify-end">
            <button @click="deleteModal.show = false" class="px-4 py-2 rounded-xl text-sm font-medium hover:bg-surface-dark transition-colors">
              Cancel
            </button>
            <button @click="deleteStudent" class="px-4 py-2 bg-danger text-white rounded-xl text-sm font-medium hover:bg-danger/90 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
