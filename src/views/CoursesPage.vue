<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api from '@/api'
import { auth } from '@/stores/auth'

const isAdmin = auth.isAdmin
const isStudent = auth.isStudent

const courses = ref([])
const loading = ref(true)
const error = ref(null)
const deleteModal = ref({ show: false, course: null })

// Department/major filters for the main course grid (student view)
const departments = ref([])
const filterDeptId = ref(null)
const filterMajorId = ref(null)
const filterMajors = ref([])

// Student enrollment data (loaded on mount for students)
const studentData = ref(null)

// Already enrolled syllabus IDs
const enrolledIds = computed(() => {
  if (!studentData.value?.studentSyllabi) return new Set()
  return new Set(studentData.value.studentSyllabi.map(s => s.syllabusId))
})

// Helper: resolve department name from ID
function getDeptName(deptId) {
  const d = departments.value.find(d => d.id === deptId)
  return d ? d.name : null
}

// Filtered courses for main grid
const displayedCourses = computed(() => {
  if (!filterDeptId.value) return courses.value
  return courses.value.filter(c => c.departmentId === filterDeptId.value)
})

// Registration modal state
const regModal = ref(false)
const regLoading = ref(false)
const regSaving = ref(false)
const regError = ref(null)
const regDeptId = ref(null)
const regMajorId = ref(null)
const regMajors = ref([])
const selectedCourses = ref({}) // { syllabusId: { expectedGrade: '' } } — newly added
const removedCourses = ref(new Set()) // syllabusIds to unenroll

// Courses filtered in registration modal
const regFilteredCourses = computed(() => {
  if (!regDeptId.value) return courses.value
  return courses.value.filter(c => c.departmentId === regDeptId.value)
})

const selectedCount = computed(() => Object.keys(selectedCourses.value).length)
const removedCount = computed(() => removedCourses.value.size)
const hasChanges = computed(() => selectedCount.value > 0 || removedCount.value > 0)

// Fetch departments for filters
async function fetchDepartments() {
  try {
    const { data } = await api.get('/dictionary/departments')
    departments.value = data
  } catch (e) { /* ignore */ }
}

// Fetch student data for enrollment info
async function fetchStudentData() {
  if (!isStudent.value || !auth.studentId.value) return
  try {
    const { data } = await api.get(`/students/${auth.studentId.value}`)
    studentData.value = data
  } catch (e) { /* ignore */ }
}

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

// Load majors when main grid department filter changes
watch(filterDeptId, async (deptId) => {
  filterMajorId.value = null
  filterMajors.value = []
  if (!deptId) return
  try {
    const { data } = await api.get(`/dictionary/departments/${deptId}/majors`)
    filterMajors.value = data
  } catch (e) { /* ignore */ }
})

// Load majors when registration modal department filter changes
watch(regDeptId, async (deptId) => {
  regMajorId.value = null
  regMajors.value = []
  if (!deptId) return
  try {
    const { data } = await api.get(`/dictionary/departments/${deptId}/majors`)
    regMajors.value = data
  } catch (e) { /* ignore */ }
})

// Registration modal
async function openRegistration() {
  regModal.value = true
  regLoading.value = true
  regError.value = null
  regDeptId.value = null
  regMajorId.value = null
  selectedCourses.value = {}
  removedCourses.value = new Set()
  try {
    // Refresh student data and departments
    const promises = [fetchStudentData()]
    if (departments.value.length === 0) promises.push(fetchDepartments())
    await Promise.all(promises)
  } catch (e) {
    regError.value = 'Failed to load registration data'
  } finally {
    regLoading.value = false
  }
}

function toggleCourse(courseId) {
  // Already enrolled — toggle removal
  if (enrolledIds.value.has(courseId)) {
    const updated = new Set(removedCourses.value)
    if (updated.has(courseId)) {
      updated.delete(courseId)
    } else {
      updated.add(courseId)
    }
    removedCourses.value = updated
    return
  }
  // New course — toggle selection
  if (selectedCourses.value[courseId]) {
    delete selectedCourses.value[courseId]
  } else {
    selectedCourses.value[courseId] = { expectedGrade: '' }
  }
}

async function submitRegistration() {
  if (!hasChanges.value) return
  regSaving.value = true
  regError.value = null
  try {
    // Keep existing enrollments minus removed ones
    const existingSyllabi = (studentData.value.studentSyllabi || [])
      .filter(s => !removedCourses.value.has(s.syllabusId))
      .map(s => ({
        syllabusId: s.syllabusId,
        expectedGrade: s.expectedGrade || '',
        notes: s.notes || '',
      }))
    // Add newly selected courses
    const newSyllabi = Object.entries(selectedCourses.value).map(([id, val]) => ({
      syllabusId: Number(id),
      expectedGrade: val.expectedGrade || '',
      notes: '',
    }))
    const payload = {
      firstName: studentData.value.firstName,
      lastName: studentData.value.lastName,
      email: studentData.value.email,
      studentId: studentData.value.studentId,
      departmentId: studentData.value.departmentId,
      majorId: studentData.value.majorId,
      enrollmentYear: studentData.value.enrollmentYear,
      currentSemester: studentData.value.currentSemester,
      dateOfBirth: studentData.value.dateOfBirth,
      phone: studentData.value.phone,
      address: studentData.value.address,
      studentSyllabi: [...existingSyllabi, ...newSyllabi],
      studentCareers: (studentData.value.studentCareers || []).map(c => ({
        profession: c.profession || '',
        description: c.description || '',
        requiredSkills: c.requiredSkills || '',
      })),
    }
    await api.put(`/students/${studentData.value.id}`, payload)
    regModal.value = false
    // Refresh student data to update enrolled badges
    await fetchStudentData()
  } catch (e) {
    regError.value = e.response?.data?.message || 'Failed to register for courses'
  } finally {
    regSaving.value = false
  }
}

onMounted(async () => {
  await fetchCourses()
  // For students, also load enrollment data and departments
  if (isStudent.value) {
    fetchStudentData()
    fetchDepartments()
  }
  // For admins, load departments for reference
  if (isAdmin.value) {
    fetchDepartments()
  }
})
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Courses</h1>
        <p class="text-text-secondary text-sm mt-1">{{ isAdmin ? 'Manage course syllabi and weekly plans' : 'Browse available courses and register' }}</p>
      </div>
      <div class="flex gap-3">
        <button
          v-if="isStudent"
          @click="openRegistration"
          class="inline-flex items-center gap-2 bg-success hover:bg-success/90 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Registration
        </button>
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
    </div>

    <!-- Filters (student view) -->
    <div v-if="isStudent && !loading && courses.length > 0" class="flex flex-wrap items-center gap-4 mb-6">
      <div>
        <select v-model="filterDeptId" class="px-4 py-2 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
          <option :value="null">All Departments</option>
          <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.code }} — {{ d.name }}</option>
        </select>
      </div>
      <div>
        <select v-model="filterMajorId" :disabled="!filterDeptId" class="px-4 py-2 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <option :value="null">{{ filterDeptId ? 'All Majors' : 'Select department first' }}</option>
          <option v-for="m in filterMajors" :key="m.id" :value="m.id">{{ m.code }} — {{ m.name }}</option>
        </select>
      </div>
      <span v-if="filterDeptId" class="text-xs text-text-secondary">{{ displayedCourses.length }} course{{ displayedCourses.length !== 1 ? 's' : '' }} found</span>
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
      <p class="text-text-secondary text-sm mb-4">{{ isAdmin ? 'Add your first course syllabus to get started.' : 'No courses are available at the moment.' }}</p>
      <router-link v-if="isAdmin" to="/courses/new" class="text-primary hover:text-primary-dark font-medium text-sm">
        + Add Course
      </router-link>
    </div>

    <!-- Cards Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="c in displayedCourses"
        :key="c.id"
        class="bg-surface rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow group"
        :class="isStudent && enrolledIds.has(c.id) ? 'border-success/40' : 'border-border'"
      >
        <!-- Card Header -->
        <div class="p-5 pb-0">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="inline-flex px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-semibold">
                  {{ c.courseCode }}
                </span>
                <span v-if="isStudent && enrolledIds.has(c.id)" class="inline-flex px-2.5 py-1 bg-success/10 text-success rounded-lg text-xs font-medium">
                  Enrolled
                </span>
              </div>
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
              {{ c.departmentName || getDeptName(c.departmentId) || 'No department' }}
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

    <!-- Registration Modal -->
    <Teleport to="body">
      <div v-if="regModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" @click.self="regModal = false">
        <div class="bg-surface rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col">
          <!-- Modal Header -->
          <div class="p-6 border-b border-border flex-shrink-0">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-bold">Course Registration</h2>
                <p class="text-text-secondary text-sm mt-0.5">Pick courses by department and major to register</p>
              </div>
              <button @click="regModal = false" class="p-2 hover:bg-surface-dark rounded-xl transition-colors text-text-secondary">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="p-6 overflow-y-auto flex-1">
            <!-- Loading -->
            <div v-if="regLoading" class="flex items-center justify-center py-12">
              <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>

            <template v-else>
              <!-- Error -->
              <div v-if="regError" class="bg-danger/10 text-danger px-4 py-3 rounded-xl text-sm mb-4">{{ regError }}</div>

              <!-- Student info banner -->
              <div v-if="studentData" class="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-sm">
                    {{ studentData.firstName?.[0] }}{{ studentData.lastName?.[0] }}
                  </div>
                  <div>
                    <p class="font-medium text-sm">{{ studentData.firstName }} {{ studentData.lastName }}</p>
                    <p class="text-text-secondary text-xs">
                      {{ studentData.departmentName || getDeptName(studentData.departmentId) || 'No department' }}
                      <span v-if="studentData.major"> / {{ studentData.major }}</span>
                      <span class="mx-1.5">·</span>
                      {{ enrolledIds.size }} course{{ enrolledIds.size !== 1 ? 's' : '' }} enrolled
                    </p>
                  </div>
                </div>
              </div>

              <!-- Filters -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label class="block text-sm font-medium mb-1.5">Department</label>
                  <select v-model="regDeptId" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
                    <option :value="null">All departments</option>
                    <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.code }} — {{ d.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1.5">Major</label>
                  <select v-model="regMajorId" :disabled="!regDeptId" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <option :value="null">{{ regDeptId ? 'All majors' : 'Select department first' }}</option>
                    <option v-for="m in regMajors" :key="m.id" :value="m.id">{{ m.code }} — {{ m.name }}</option>
                  </select>
                </div>
              </div>

              <!-- Course List -->
              <div v-if="regFilteredCourses.length === 0" class="text-center py-8 text-text-secondary text-sm">
                No courses available{{ regDeptId ? ' for this department' : '' }}.
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="c in regFilteredCourses"
                  :key="c.id"
                  @click="toggleCourse(c.id)"
                  class="flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer"
                  :class="[
                    enrolledIds.has(c.id) && removedCourses.has(c.id)
                      ? 'border-danger/30 bg-danger/5'
                      : enrolledIds.has(c.id)
                        ? 'border-success/30 bg-success/5'
                        : selectedCourses[c.id]
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/30 hover:bg-surface-dark'
                  ]"
                >
                  <!-- Checkbox -->
                  <div class="flex-shrink-0 mt-0.5">
                    <!-- Enrolled but marked for removal -->
                    <div
                      v-if="enrolledIds.has(c.id) && removedCourses.has(c.id)"
                      class="w-5 h-5 rounded-md border-2 border-danger"
                    ></div>
                    <!-- Enrolled (active) -->
                    <div
                      v-else-if="enrolledIds.has(c.id)"
                      class="w-5 h-5 rounded-md bg-success flex items-center justify-center"
                    >
                      <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <!-- Newly selected -->
                    <div
                      v-else-if="selectedCourses[c.id]"
                      class="w-5 h-5 rounded-md bg-primary flex items-center justify-center"
                    >
                      <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <!-- Not selected -->
                    <div v-else class="w-5 h-5 rounded-md border-2 border-border"></div>
                  </div>

                  <!-- Course Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="inline-flex px-2 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-semibold">{{ c.courseCode }}</span>
                      <span v-if="enrolledIds.has(c.id) && removedCourses.has(c.id)" class="inline-flex px-2 py-0.5 bg-danger/10 text-danger rounded-md text-xs font-medium">Will unenroll</span>
                      <span v-else-if="enrolledIds.has(c.id)" class="inline-flex px-2 py-0.5 bg-success/10 text-success rounded-md text-xs font-medium">Enrolled</span>
                    </div>
                    <h4 class="font-medium text-sm">{{ c.title }}</h4>
                    <p class="text-text-secondary text-xs mt-0.5 line-clamp-1">{{ c.description || 'No description' }}</p>
                    <div class="flex items-center gap-3 mt-2">
                      <span class="text-xs text-text-secondary">{{ c.instructor || 'No instructor' }}</span>
                      <span class="text-xs text-text-secondary">{{ c.credits }} credits</span>
                      <span v-if="c.departmentId" class="text-xs text-text-secondary">{{ c.departmentName || getDeptName(c.departmentId) }}</span>
                      <span v-if="c.semester" class="text-xs text-text-secondary">{{ c.semester }}</span>
                    </div>
                    <!-- Expected Grade input for selected courses -->
                    <div v-if="selectedCourses[c.id]" class="mt-3" @click.stop>
                      <input
                        v-model="selectedCourses[c.id].expectedGrade"
                        placeholder="Expected grade (e.g. A+)"
                        class="px-3 py-1.5 border border-border rounded-lg text-xs w-48 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Modal Footer -->
          <div class="p-6 border-t border-border flex-shrink-0 flex items-center justify-between">
            <div class="flex items-center gap-3 text-sm text-text-secondary">
              <span v-if="selectedCount > 0" class="text-primary font-medium">+{{ selectedCount }} new</span>
              <span v-if="removedCount > 0" class="text-danger font-medium">-{{ removedCount }} remove</span>
              <span v-if="!hasChanges">No changes</span>
            </div>
            <div class="flex gap-3">
              <button @click="regModal = false" class="px-4 py-2 rounded-xl text-sm font-medium hover:bg-surface-dark transition-colors">Cancel</button>
              <button
                @click="submitRegistration"
                :disabled="!hasChanges || regSaving"
                class="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ regSaving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

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