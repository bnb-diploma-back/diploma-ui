<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'
import { auth } from '@/stores/auth'

const router = useRouter()
const isStudent = auth.isStudent

const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const success = ref(false)
const editing = ref(false)

// Original student data from backend
const studentData = ref(null)

// Form for editing
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
})

// Lookups
const departments = ref([])
const filteredMajors = ref([])

async function fetchDepartments() {
  try {
    const { data } = await api.get('/dictionary/departments')
    departments.value = data
  } catch (e) { /* ignore */ }
}

async function loadMajors(deptId) {
  if (!deptId) {
    filteredMajors.value = []
    return
  }
  try {
    const { data } = await api.get(`/dictionary/departments/${deptId}/majors`)
    filteredMajors.value = data
  } catch (e) {
    filteredMajors.value = []
  }
}

watch(() => form.value.departmentId, async (deptId, oldDeptId) => {
  if (!deptId) {
    filteredMajors.value = []
    form.value.majorId = null
    return
  }
  await loadMajors(deptId)
  if (oldDeptId !== undefined && oldDeptId !== deptId) {
    if (form.value.majorId && !filteredMajors.value.some(m => m.id === form.value.majorId)) {
      form.value.majorId = null
    }
  }
})

async function fetchProfile() {
  loading.value = true
  error.value = null
  try {
    const { data } = await api.get(`/students/${auth.studentId.value}`)
    studentData.value = data
    // Pre-load majors before setting form so <select> options exist
    if (data.departmentId) {
      await loadMajors(data.departmentId)
    }
    populateForm(data)
  } catch (e) {
    error.value = 'Failed to load profile'
  } finally {
    loading.value = false
  }
}

function populateForm(data) {
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
  }
}

function startEditing() {
  editing.value = true
  success.value = false
}

function cancelEditing() {
  editing.value = false
  error.value = null
  success.value = false
  if (studentData.value) populateForm(studentData.value)
}

async function saveProfile() {
  saving.value = true
  error.value = null
  success.value = false
  try {
    const payload = {
      ...form.value,
      // Preserve existing syllabi and careers
      studentSyllabi: (studentData.value.studentSyllabi || []).map(s => ({
        syllabusId: s.syllabusId,
        expectedGrade: s.expectedGrade || '',
        notes: s.notes || '',
      })),
      studentCareers: (studentData.value.studentCareers || []).map(c => ({
        profession: c.profession || '',
        description: c.description || '',
        requiredSkills: c.requiredSkills || '',
      })),
    }
    await api.put(`/students/${studentData.value.id}`, payload)
    // Refresh auth user info (name may have changed)
    await auth.fetchMe()
    // Refresh profile data
    await fetchProfile()
    editing.value = false
    success.value = true
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to save profile'
  } finally {
    saving.value = false
  }
}

// Resolve department/major names from IDs
function getDeptName(id) {
  const d = departments.value.find(d => d.id === id)
  return d ? `${d.code} — ${d.name}` : null
}
function getMajorName(id) {
  const m = filteredMajors.value.find(m => m.id === id)
  return m ? `${m.code} — ${m.name}` : null
}

onMounted(async () => {
  if (!isStudent.value || !auth.studentId.value) {
    router.replace('/')
    return
  }
  await fetchDepartments()
  await fetchProfile()
})
</script>

<template>
  <div class="p-8 max-w-3xl">
    <h1 class="text-2xl font-bold mb-2">My Profile</h1>
    <p class="text-text-secondary text-sm mb-8">View and edit your personal and academic information</p>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>

    <template v-else-if="studentData">
      <!-- Success message -->
      <div v-if="success" class="bg-success/10 text-success px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        Profile updated successfully.
      </div>

      <!-- Error -->
      <div v-if="error" class="bg-danger/10 text-danger px-4 py-3 rounded-xl text-sm mb-6">{{ error }}</div>

      <!-- View Mode -->
      <template v-if="!editing">
        <!-- Profile Header Card -->
        <div class="bg-surface rounded-2xl shadow-sm border border-border p-8 mb-6">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-5">
              <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-xl">
                {{ studentData.firstName?.[0] }}{{ studentData.lastName?.[0] }}
              </div>
              <div>
                <h2 class="text-xl font-bold">{{ studentData.firstName }} {{ studentData.lastName }}</h2>
                <p class="text-text-secondary text-sm mt-0.5">{{ studentData.email }}</p>
                <div class="flex gap-2 mt-2">
                  <span class="inline-flex px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">{{ studentData.studentId }}</span>
                  <span v-if="studentData.currentSemester" class="inline-flex px-2.5 py-1 bg-secondary/10 text-secondary rounded-lg text-xs font-medium">{{ studentData.currentSemester }}</span>
                </div>
              </div>
            </div>
            <button
              @click="startEditing"
              class="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-surface-dark transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- Academic Info -->
          <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
            <h3 class="font-semibold mb-4">Academic Information</h3>
            <dl class="space-y-3">
              <div class="flex justify-between text-sm">
                <dt class="text-text-secondary">Department</dt>
                <dd class="font-medium">{{ studentData.department || studentData.departmentName || '—' }}</dd>
              </div>
              <div class="flex justify-between text-sm">
                <dt class="text-text-secondary">Major</dt>
                <dd class="font-medium">{{ studentData.major || studentData.majorName || '—' }}</dd>
              </div>
              <div class="flex justify-between text-sm">
                <dt class="text-text-secondary">Enrollment Year</dt>
                <dd class="font-medium">{{ studentData.enrollmentYear || '—' }}</dd>
              </div>
              <div class="flex justify-between text-sm">
                <dt class="text-text-secondary">Semester</dt>
                <dd class="font-medium">{{ studentData.currentSemester || '—' }}</dd>
              </div>
            </dl>
          </div>

          <!-- Personal Details -->
          <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
            <h3 class="font-semibold mb-4">Personal Details</h3>
            <dl class="space-y-3">
              <div class="flex justify-between text-sm">
                <dt class="text-text-secondary">Date of Birth</dt>
                <dd class="font-medium">{{ studentData.dateOfBirth || '—' }}</dd>
              </div>
              <div class="flex justify-between text-sm">
                <dt class="text-text-secondary">Phone</dt>
                <dd class="font-medium">{{ studentData.phone || '—' }}</dd>
              </div>
              <div class="flex justify-between text-sm">
                <dt class="text-text-secondary">Address</dt>
                <dd class="font-medium">{{ studentData.address || '—' }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Enrolled Courses -->
        <div class="bg-surface rounded-2xl shadow-sm border border-border p-6 mb-6">
          <h3 class="font-semibold mb-4">Enrolled Courses</h3>
          <div v-if="!studentData.studentSyllabi?.length" class="text-text-secondary text-sm">No courses enrolled.</div>
          <div v-else class="space-y-3">
            <div
              v-for="ss in studentData.studentSyllabi"
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

        <!-- Career Goals -->
        <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
          <h3 class="font-semibold mb-4">Career Goals</h3>
          <div v-if="!studentData.studentCareers?.length" class="text-text-secondary text-sm">No career goals set.</div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="c in studentData.studentCareers"
              :key="c.id"
              class="p-4 bg-surface-dark rounded-xl"
            >
              <h4 class="font-semibold text-sm mb-1">{{ c.profession }}</h4>
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

      <!-- Edit Mode -->
      <form v-else @submit.prevent="saveProfile" class="space-y-6">
        <!-- Personal Info -->
        <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
          <h3 class="font-semibold mb-4">Personal Information</h3>
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
              <label class="block text-sm font-medium mb-1.5">Email</label>
              <input v-model="form.email" type="email" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-surface-dark transition-colors" readonly />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1.5">Student ID</label>
              <input v-model="form.studentId" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-surface-dark transition-colors" readonly />
            </div>
          </div>
        </div>

        <!-- Academic Info -->
        <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
          <h3 class="font-semibold mb-4">Academic Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1.5">Department</label>
              <select v-model="form.departmentId" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
                <option :value="null">Select department...</option>
                <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.code }} — {{ d.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1.5">Major</label>
              <select v-model="form.majorId" :disabled="!form.departmentId" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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
              <select v-model="form.currentSemester" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
                <option value="FALL">Fall</option>
                <option value="SPRING">Spring</option>
                <option value="SUMMER">Summer</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Personal Details -->
        <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
          <h3 class="font-semibold mb-4">Additional Details</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1.5">Date of Birth</label>
              <input v-model="form.dateOfBirth" type="date" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1.5">Phone</label>
              <input v-model="form.phone" placeholder="+7 700 123 4567" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium mb-1.5">Address</label>
              <input v-model="form.address" placeholder="City, Country" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="cancelEditing"
            class="px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-dark transition-colors border border-border"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>