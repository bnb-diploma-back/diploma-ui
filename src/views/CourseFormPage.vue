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

// Lookups
const departments = ref([])
const filteredMajors = ref([])
const allCourses = ref([])

const form = ref({
  courseCode: '',
  title: '',
  description: '',
  credits: 3,
  departmentId: null,
  majorId: null,
  instructor: '',
  prerequisites: '',
  objectives: '',
  learningOutcomes: '',
  assessmentCriteria: '',
  requiredTextbooks: '',
  recommendedReading: '',
  academicYear: '2025-2026',
  semester: 'SPRING',
  startDate: '',
  endDate: '',
  weeklyPlans: [],
})

// Prerequisites as array of selected course codes for the UI
const selectedPrereqs = ref([])
const prereqSearch = ref('')

// Other courses available for prerequisite selection (exclude current course)
const availablePrereqs = computed(() => {
  return allCourses.value.filter(c => c.courseCode !== form.value.courseCode)
})

// Sort: alphabetical by courseCode, MDE* courses at the bottom
function sortCourses(list) {
  return list.slice().sort((a, b) => {
    const aIsMde = a.courseCode?.toUpperCase().startsWith('MDE') ? 1 : 0
    const bIsMde = b.courseCode?.toUpperCase().startsWith('MDE') ? 1 : 0
    if (aIsMde !== bIsMde) return aIsMde - bIsMde
    return (a.courseCode || '').localeCompare(b.courseCode || '')
  })
}

// Filtered suggestions based on search input (only show when typing)
const prereqSuggestions = computed(() => {
  if (!prereqSearch.value.trim()) return []
  const q = prereqSearch.value.toLowerCase()
  const filtered = availablePrereqs.value.filter(c =>
    !selectedPrereqs.value.includes(c.courseCode) &&
    (c.courseCode.toLowerCase().includes(q) || c.title.toLowerCase().includes(q))
  )
  return sortCourses(filtered)
})

function addPrereq(courseCode) {
  if (!selectedPrereqs.value.includes(courseCode)) {
    selectedPrereqs.value.push(courseCode)
  }
  prereqSearch.value = ''
}

function removePrereq(courseCode) {
  const idx = selectedPrereqs.value.indexOf(courseCode)
  if (idx >= 0) selectedPrereqs.value.splice(idx, 1)
}

async function fetchDepartments() {
  try {
    const { data } = await api.get('/dictionary/departments')
    departments.value = data
  } catch (e) { /* ignore */ }
}

// Load majors for a department
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

// When user changes department, reload majors and reset major if it doesn't belong
watch(() => form.value.departmentId, async (deptId, oldDeptId) => {
  if (!deptId) {
    filteredMajors.value = []
    form.value.majorId = null
    return
  }
  await loadMajors(deptId)
  // Only reset major if user actually changed the department (not initial load)
  if (oldDeptId !== undefined && oldDeptId !== deptId) {
    if (form.value.majorId && !filteredMajors.value.some(m => m.id === form.value.majorId)) {
      form.value.majorId = null
    }
  }
})

async function fetchAllCourses() {
  try {
    const { data } = await api.get('/syllabi')
    allCourses.value = data
  } catch (e) { /* ignore */ }
}

async function fetchCourse() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const { data } = await api.get(`/syllabi/${route.params.id}`)
    // Pre-load majors before setting form so <select> options exist
    if (data.departmentId) {
      await loadMajors(data.departmentId)
    }
    form.value = {
      courseCode: data.courseCode || '',
      title: data.title || '',
      description: data.description || '',
      credits: data.credits || 3,
      departmentId: data.departmentId || null,
      majorId: data.majorId || null,
      instructor: data.instructor || '',
      prerequisites: data.prerequisites || '',
      objectives: data.objectives || '',
      learningOutcomes: data.learningOutcomes || '',
      assessmentCriteria: data.assessmentCriteria || '',
      requiredTextbooks: data.requiredTextbooks || '',
      recommendedReading: data.recommendedReading || '',
      academicYear: data.academicYear || '2025-2026',
      semester: data.semester || 'SPRING',
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      weeklyPlans: (data.weeklyPlans || []).map(wp => ({
        weekNumber: wp.weekNumber,
        topic: wp.topic || '',
        learningObjectives: wp.learningObjectives || '',
        lectureContent: wp.lectureContent || '',
        practiceContent: wp.practiceContent || '',
        assignments: wp.assignments || '',
        readings: wp.readings || '',
      })),
    }
    // Parse prerequisites string into array
    if (data.prerequisites) {
      selectedPrereqs.value = data.prerequisites.split(',').map(s => s.trim()).filter(Boolean)
    }
  } catch (e) {
    error.value = 'Failed to load course'
  } finally {
    loading.value = false
  }
}

function addWeek() {
  const nextWeek = form.value.weeklyPlans.length > 0
    ? Math.max(...form.value.weeklyPlans.map(w => w.weekNumber)) + 1
    : 1
  if (nextWeek > 15) return
  form.value.weeklyPlans.push({
    weekNumber: nextWeek,
    topic: '',
    learningObjectives: '',
    lectureContent: '',
    practiceContent: '',
    assignments: '',
    readings: '',
  })
}

function addAllWeeks() {
  const existing = new Set(form.value.weeklyPlans.map(w => w.weekNumber))
  for (let i = 1; i <= 15; i++) {
    if (!existing.has(i)) {
      form.value.weeklyPlans.push({
        weekNumber: i,
        topic: '',
        learningObjectives: '',
        lectureContent: '',
        practiceContent: '',
        assignments: '',
        readings: '',
      })
    }
  }
  form.value.weeklyPlans.sort((a, b) => a.weekNumber - b.weekNumber)
}

function removeWeek(index) {
  form.value.weeklyPlans.splice(index, 1)
}

async function submit() {
  saving.value = true
  error.value = null
  try {
    const payload = {
      ...form.value,
      prerequisites: selectedPrereqs.value.join(', '),
      weeklyPlans: form.value.weeklyPlans
        .filter(w => w.topic)
        .map(w => ({
          weekNumber: w.weekNumber,
          topic: w.topic,
          learningObjectives: w.learningObjectives || null,
          lectureContent: w.lectureContent || null,
          practiceContent: w.practiceContent || null,
          assignments: w.assignments || null,
          readings: w.readings || null,
        })),
    }
    // Send empty strings as null for optional fields
    for (const key of ['description', 'objectives', 'learningOutcomes', 'assessmentCriteria', 'requiredTextbooks', 'recommendedReading', 'startDate', 'endDate']) {
      if (!payload[key]) payload[key] = null
    }
    // Ensure IDs are null not empty
    if (!payload.departmentId) payload.departmentId = null
    if (!payload.majorId) payload.majorId = null
    if (isEdit.value) {
      await api.put(`/syllabi/${route.params.id}`, payload)
    } else {
      await api.post('/syllabi', payload)
    }
    router.push('/courses')
  } catch (e) {
    error.value = e.response?.data?.message || e.response?.data || 'Failed to save course'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchDepartments(), fetchAllCourses()])
  await fetchCourse()
})
</script>

<template>
  <div class="p-8 max-w-3xl">
    <!-- Back -->
    <router-link to="/courses" class="inline-flex items-center gap-2 text-text-secondary hover:text-primary text-sm mb-6 transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to Courses
    </router-link>

    <h1 class="text-2xl font-bold mb-8">{{ isEdit ? 'Edit Course' : 'New Course' }}</h1>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>

    <form v-else @submit.prevent="submit" class="space-y-6">
      <!-- Error -->
      <div v-if="error" class="bg-danger/10 text-danger px-4 py-3 rounded-xl text-sm whitespace-pre-wrap">{{ error }}</div>

      <!-- Basic Info -->
      <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <h2 class="font-semibold mb-4">Basic Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1.5">Course Code <span class="text-danger">*</span></label>
            <input v-model="form.courseCode" required placeholder="e.g. CS301" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5">Title <span class="text-danger">*</span></label>
            <input v-model="form.title" required placeholder="e.g. Data Structures" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5">Credits <span class="text-danger">*</span></label>
            <input v-model.number="form.credits" type="number" min="1" max="12" required class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5">Instructor</label>
            <input v-model="form.instructor" placeholder="e.g. Dr. Smith" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
          </div>
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
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-1.5">Description</label>
            <textarea v-model="form.description" rows="3" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"></textarea>
          </div>
        </div>
      </div>

      <!-- Prerequisites -->
      <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <h2 class="font-semibold mb-4">Prerequisites</h2>
        <p class="text-text-secondary text-xs mb-3">Search and select courses that students must complete before taking this course.</p>

        <!-- Selected prerequisites chips -->
        <div v-if="selectedPrereqs.length" class="flex flex-wrap gap-2 mb-3">
          <span
            v-for="code in selectedPrereqs"
            :key="code"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium"
          >
            {{ code }}
            <button type="button" @click="removePrereq(code)" class="hover:text-white/70 transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        </div>

        <!-- Search input -->
        <div class="relative">
          <input
            v-model="prereqSearch"
            type="text"
            placeholder="Type to search courses..."
            class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
          <!-- Suggestions dropdown -->
          <div
            v-if="prereqSuggestions.length"
            class="absolute z-10 left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto"
          >
            <button
              v-for="c in prereqSuggestions"
              :key="c.id"
              type="button"
              @click="addPrereq(c.courseCode)"
              class="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-dark transition-colors flex items-center gap-2"
            >
              <span class="font-semibold text-primary">{{ c.courseCode }}</span>
              <span class="text-text-secondary">{{ c.title }}</span>
            </button>
          </div>
          <!-- No results -->
          <div
            v-if="prereqSearch.trim() && !prereqSuggestions.length"
            class="absolute z-10 left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg px-4 py-3 text-sm text-text-secondary"
          >
            No matching courses found
          </div>
        </div>
      </div>

      <!-- Academic Period -->
      <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <h2 class="font-semibold mb-4">Academic Period</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1.5">Academic Year</label>
            <input v-model="form.academicYear" placeholder="e.g. 2025-2026" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5">Semester</label>
            <select v-model="form.semester" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white">
              <option value="FALL">Fall</option>
              <option value="SPRING">Spring</option>
              <option value="SUMMER">Summer</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5">Start Date</label>
            <input v-model="form.startDate" type="date" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5">End Date</label>
            <input v-model="form.endDate" type="date" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
          </div>
        </div>
      </div>

      <!-- Learning -->
      <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <h2 class="font-semibold mb-4">Learning & Assessment</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1.5">Objectives</label>
            <textarea v-model="form.objectives" rows="2" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5">Learning Outcomes</label>
            <textarea v-model="form.learningOutcomes" rows="2" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5">Assessment Criteria</label>
            <input v-model="form.assessmentCriteria" placeholder="e.g. Midterm 30%, Final 40%, Labs 30%" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1.5">Required Textbooks</label>
              <input v-model="form.requiredTextbooks" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1.5">Recommended Reading</label>
              <input v-model="form.recommendedReading" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly Plans -->
      <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="font-semibold">Weekly Plans</h2>
            <p class="text-text-secondary text-xs mt-0.5">{{ form.weeklyPlans.length }} / 15 weeks</p>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              @click="addAllWeeks"
              v-if="form.weeklyPlans.length < 15"
              class="text-text-secondary hover:text-primary text-sm font-medium transition-colors"
            >
              Add All 15
            </button>
            <button
              type="button"
              @click="addWeek"
              v-if="form.weeklyPlans.length < 15"
              class="text-primary hover:text-primary-dark text-sm font-medium transition-colors"
            >
              + Add Week
            </button>
          </div>
        </div>
        <div v-if="form.weeklyPlans.length === 0" class="text-text-secondary text-sm">No weekly plans yet. Click "Add Week" or "Add All 15" to start.</div>
        <div v-else class="space-y-3">
          <details
            v-for="(wp, i) in form.weeklyPlans"
            :key="wp.weekNumber"
            class="border border-border rounded-xl overflow-hidden group"
            :open="form.weeklyPlans.length <= 3"
          >
            <summary class="flex items-center justify-between px-4 py-3 bg-surface-dark cursor-pointer hover:bg-surface-dark/80 transition-colors">
              <div class="flex items-center gap-3">
                <span class="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-xs font-semibold">{{ wp.weekNumber }}</span>
                <span class="font-medium text-sm">{{ wp.topic || `Week ${wp.weekNumber}` }}</span>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" @click.prevent="removeWeek(i)" class="p-1.5 text-text-secondary hover:text-danger transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <svg class="w-4 h-4 text-text-secondary group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>
            <div class="p-4 space-y-3">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-text-secondary mb-1">Week Number</label>
                  <input v-model.number="wp.weekNumber" type="number" min="1" max="15" class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-text-secondary mb-1">Topic <span class="text-danger">*</span></label>
                  <input v-model="wp.topic" placeholder="Week topic" class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-text-secondary mb-1">Learning Objectives</label>
                <input v-model="wp.learningObjectives" class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label class="block text-xs font-medium text-text-secondary mb-1">Lecture Content</label>
                <input v-model="wp.lectureContent" class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-medium text-text-secondary mb-1">Practice</label>
                  <input v-model="wp.practiceContent" class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-text-secondary mb-1">Assignments</label>
                  <input v-model="wp.assignments" class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-text-secondary mb-1">Readings</label>
                  <input v-model="wp.readings" class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex justify-end gap-3">
        <router-link to="/courses" class="px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-dark transition-colors border border-border">
          Cancel
        </router-link>
        <button
          type="submit"
          :disabled="saving"
          class="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          {{ saving ? 'Saving...' : (isEdit ? 'Update Course' : 'Create Course') }}
        </button>
      </div>
    </form>
  </div>
</template>