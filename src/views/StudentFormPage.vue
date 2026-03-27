<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const saving = ref(false)
const error = ref(null)

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
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

// Available syllabi for dropdown
const availableSyllabi = ref([])
// Departments & majors for dropdowns
const departments = ref([])
const filteredMajors = ref([])

async function fetchSyllabi() {
  try {
    const { data } = await api.get('/syllabi')
    availableSyllabi.value = data
  } catch (e) {
    // ignore
  }
}

async function fetchDepartments() {
  try {
    const { data } = await api.get('/dictionary/departments')
    departments.value = data
  } catch (e) {
    // ignore
  }
}

// When department changes, load its majors and reset major if needed
watch(() => form.value.departmentId, async (deptId) => {
  if (!deptId) {
    filteredMajors.value = []
    form.value.majorId = null
    return
  }
  try {
    const { data } = await api.get(`/dictionary/departments/${deptId}/majors`)
    filteredMajors.value = data
    // Reset major if not in the new department's majors
    if (form.value.majorId && !data.some(m => m.id === form.value.majorId)) {
      form.value.majorId = null
    }
  } catch (e) {
    filteredMajors.value = []
  }
})

async function fetchStudent() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const { data } = await api.get(`/students/${route.params.id}`)
    form.value = {
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      studentId: data.studentId || '',
      departmentId: data.departmentId || null,
      majorId: data.majorId || null,
      enrollmentYear: data.enrollmentYear || new Date().getFullYear(),
      currentSemester: data.currentSemester || 'SPRING',
      dateOfBirth: data.dateOfBirth || '',
      phone: data.phone || '',
      address: data.address || '',
      studentSyllabi: (data.studentSyllabi || []).map(ss => ({
        syllabusId: ss.syllabusId,
        expectedGrade: ss.expectedGrade || '',
        notes: ss.notes || '',
      })),
      studentCareers: (data.studentCareers || []).map(c => ({
        profession: c.profession || '',
        description: c.description || '',
        requiredSkills: c.requiredSkills || '',
      })),
    }
  } catch (e) {
    error.value = 'Failed to load student'
  } finally {
    loading.value = false
  }
}

function addSyllabus() {
  form.value.studentSyllabi.push({ syllabusId: '', expectedGrade: '', notes: '' })
}

function removeSyllabus(index) {
  form.value.studentSyllabi.splice(index, 1)
}

function addCareer() {
  form.value.studentCareers.push({ profession: '', description: '', requiredSkills: '' })
}

function removeCareer(index) {
  form.value.studentCareers.splice(index, 1)
}

async function submit() {
  saving.value = true
  error.value = null
  try {
    const payload = {
      ...form.value,
      studentSyllabi: form.value.studentSyllabi.filter(s => s.syllabusId),
      studentCareers: form.value.studentCareers.filter(c => c.profession),
    }
    if (isEdit.value) {
      await api.put(`/students/${route.params.id}`, payload)
    } else {
      await api.post('/students', payload)
    }
    router.push('/students')
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to save student'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchDepartments()
  fetchSyllabi()
  fetchStudent()
})
</script>

<template>
  <div class="p-8 max-w-3xl">
    <!-- Back -->
    <router-link to="/students" class="inline-flex items-center gap-2 text-text-secondary hover:text-primary text-sm mb-6 transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to Students
    </router-link>

    <h1 class="text-2xl font-bold mb-8">{{ isEdit ? 'Edit Student' : 'New Student' }}</h1>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>

    <form v-else @submit.prevent="submit" class="space-y-6">
      <!-- Error -->
      <div v-if="error" class="bg-danger/10 text-danger px-4 py-3 rounded-xl text-sm">{{ error }}</div>

      <!-- Basic Info -->
      <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <h2 class="font-semibold mb-4">Basic Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1.5">First Name <span class="text-danger">*</span></label>
            <input v-model="form.firstName" required class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5">Last Name <span class="text-danger">*</span></label>
            <input v-model="form.lastName" required class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5">Email <span class="text-danger">*</span></label>
            <input v-model="form.email" type="email" required class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5">Student ID <span class="text-danger">*</span></label>
            <input v-model="form.studentId" required class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
          </div>
        </div>
      </div>

      <!-- Academic Info -->
      <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <h2 class="font-semibold mb-4">Academic Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1.5">Department</label>
            <select v-model="form.departmentId" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white">
              <option :value="null">Select department...</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.code }} — {{ d.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5">Major</label>
            <select v-model="form.majorId" :disabled="!form.departmentId" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed">
              <option :value="null">{{ form.departmentId ? 'Select major...' : 'Select department first' }}</option>
              <option v-for="m in filteredMajors" :key="m.id" :value="m.id">{{ m.code }} — {{ m.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5">Enrollment Year</label>
            <input v-model.number="form.enrollmentYear" type="number" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5">Semester</label>
            <select v-model="form.currentSemester" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white">
              <option value="FALL">Fall</option>
              <option value="SPRING">Spring</option>
              <option value="SUMMER">Summer</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Personal Details -->
      <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <h2 class="font-semibold mb-4">Personal Details</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1.5">Date of Birth</label>
            <input v-model="form.dateOfBirth" type="date" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5">Phone</label>
            <input v-model="form.phone" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-1.5">Address</label>
            <input v-model="form.address" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
          </div>
        </div>
      </div>

      <!-- Enrolled Courses -->
      <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold">Enrolled Courses</h2>
          <button type="button" @click="addSyllabus" class="text-primary hover:text-primary-dark text-sm font-medium transition-colors">+ Add Course</button>
        </div>
        <div v-if="form.studentSyllabi.length === 0" class="text-text-secondary text-sm">No courses added yet.</div>
        <div v-else class="space-y-3">
          <div v-for="(ss, i) in form.studentSyllabi" :key="i" class="flex gap-3 items-start p-4 bg-surface-dark rounded-xl">
            <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
              <select v-model="ss.syllabusId" class="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">Select course...</option>
                <option v-for="syl in availableSyllabi" :key="syl.id" :value="syl.id">
                  {{ syl.courseCode }} — {{ syl.title }}
                </option>
              </select>
              <input v-model="ss.expectedGrade" placeholder="Expected grade (e.g. A+)" class="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              <input v-model="ss.notes" placeholder="Notes" class="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <button type="button" @click="removeSyllabus(i)" class="p-2 text-text-secondary hover:text-danger transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Career Goals -->
      <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold">Career Goals</h2>
          <button type="button" @click="addCareer" class="text-primary hover:text-primary-dark text-sm font-medium transition-colors">+ Add Career</button>
        </div>
        <div v-if="form.studentCareers.length === 0" class="text-text-secondary text-sm">No careers added yet.</div>
        <div v-else class="space-y-3">
          <div v-for="(c, i) in form.studentCareers" :key="i" class="flex gap-3 items-start p-4 bg-surface-dark rounded-xl">
            <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input v-model="c.profession" placeholder="Profession" class="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              <input v-model="c.description" placeholder="Description" class="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              <input v-model="c.requiredSkills" placeholder="Skills (comma-separated)" class="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <button type="button" @click="removeCareer(i)" class="p-2 text-text-secondary hover:text-danger transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex justify-end gap-3">
        <router-link to="/students" class="px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-dark transition-colors border border-border">
          Cancel
        </router-link>
        <button
          type="submit"
          :disabled="saving"
          class="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          {{ saving ? 'Saving...' : (isEdit ? 'Update Student' : 'Create Student') }}
        </button>
      </div>
    </form>
  </div>
</template>