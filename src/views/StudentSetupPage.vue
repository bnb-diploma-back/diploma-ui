<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'
import { auth } from '@/stores/auth'

const router = useRouter()
const saving = ref(false)
const error = ref(null)

// Lookups
const departments = ref([])
const filteredMajors = ref([])

const form = ref({
  firstName: auth.user.value?.firstName || '',
  lastName: auth.user.value?.lastName || '',
  email: auth.user.value?.email || '',
  studentId: '',
  departmentId: null,
  majorId: null,
  enrollmentYear: new Date().getFullYear(),
  currentSemester: 'SPRING',
  dateOfBirth: '',
  phone: '',
  address: '',
  studentSyllabi: [],
  studentCareers: [],
})

async function fetchDepartments() {
  try {
    const { data } = await api.get('/dictionary/departments')
    departments.value = data
  } catch (e) { /* ignore */ }
}

watch(() => form.value.departmentId, async (deptId) => {
  if (!deptId) {
    filteredMajors.value = []
    form.value.majorId = null
    return
  }
  try {
    const { data } = await api.get(`/dictionary/departments/${deptId}/majors`)
    filteredMajors.value = data
    if (form.value.majorId && !data.some(m => m.id === form.value.majorId)) {
      form.value.majorId = null
    }
  } catch (e) {
    filteredMajors.value = []
  }
})

async function submit() {
  saving.value = true
  error.value = null
  try {
    await api.post('/students', form.value)
    // Refresh user info to get the linked studentId
    await auth.fetchMe()
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.message || e.response?.data || 'Failed to create student profile'
  } finally {
    saving.value = false
  }
}

const checking = ref(true)

onMounted(async () => {
  // Always check /me first — if studentId exists, redirect away
  try {
    await auth.fetchMe()
    if (auth.studentId.value) {
      router.replace('/')
      return
    }
  } catch (e) {
    // token invalid — will be caught by router guard
    router.replace('/login')
    return
  }
  checking.value = false
  fetchDepartments()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-12 px-4">
    <!-- Loading while checking /me -->
    <div v-if="checking" class="flex items-center justify-center py-32">
      <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>
    <div v-else class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg shadow-primary/25">
          B
        </div>
        <h1 class="text-2xl font-bold">Complete Your Profile</h1>
        <p class="text-text-secondary text-sm mt-1">Set up your student profile to get started with BNB</p>
      </div>

      <!-- Form -->
      <div class="bg-surface rounded-2xl shadow-xl border border-border p-8">
        <div v-if="error" class="bg-danger/10 text-danger px-4 py-3 rounded-xl text-sm mb-6">{{ error }}</div>

        <form @submit.prevent="submit" class="space-y-6">
          <!-- Personal -->
          <div>
            <h2 class="font-semibold mb-4">Personal Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1.5">First Name <span class="text-danger">*</span></label>
                <input v-model="form.firstName" required class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5">Last Name <span class="text-danger">*</span></label>
                <input v-model="form.lastName" required class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5">Email <span class="text-danger">*</span></label>
                <input v-model="form.email" type="email" required class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface-dark" readonly />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5">Student ID <span class="text-danger">*</span></label>
                <input v-model="form.studentId" required placeholder="e.g. SDU_220107" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
            </div>
          </div>

          <!-- Academic -->
          <div>
            <h2 class="font-semibold mb-4">Academic Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1.5">Department</label>
                <select v-model="form.departmentId" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option :value="null">Select department...</option>
                  <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.code }} — {{ d.name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5">Major</label>
                <select v-model="form.majorId" :disabled="!form.departmentId" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed">
                  <option :value="null">{{ form.departmentId ? 'Select major...' : 'Select department first' }}</option>
                  <option v-for="m in filteredMajors" :key="m.id" :value="m.id">{{ m.code }} — {{ m.name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5">Enrollment Year</label>
                <input v-model.number="form.enrollmentYear" type="number" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5">Semester</label>
                <select v-model="form.currentSemester" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="FALL">Fall</option>
                  <option value="SPRING">Spring</option>
                  <option value="SUMMER">Summer</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Optional details -->
          <div>
            <h2 class="font-semibold mb-4">Additional Details <span class="text-text-secondary text-xs font-normal">(optional)</span></h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1.5">Date of Birth</label>
                <input v-model="form.dateOfBirth" type="date" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5">Phone</label>
                <input v-model="form.phone" placeholder="+7 700 123 4567" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium mb-1.5">Address</label>
                <input v-model="form.address" placeholder="City, Country" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            :disabled="saving"
            class="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50 shadow-sm"
          >
            {{ saving ? 'Creating profile...' : 'Complete Setup' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>