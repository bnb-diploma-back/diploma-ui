<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

// Departments
const departments = ref([])
const loadingDepts = ref(true)
const deptForm = ref({ code: '', name: '', description: '' })
const deptEditing = ref(null)
const deptError = ref(null)
const showDeptForm = ref(false)

// Majors
const majors = ref([])
const loadingMajors = ref(true)
const majorForm = ref({ code: '', name: '', description: '', departmentId: '' })
const majorEditing = ref(null)
const majorError = ref(null)
const showMajorForm = ref(false)

// Delete modals
const deleteModal = ref({ show: false, type: null, item: null })

async function fetchDepartments() {
  loadingDepts.value = true
  try {
    const { data } = await api.get('/dictionary/departments')
    departments.value = data
  } catch (e) {
    deptError.value = 'Failed to load departments'
  } finally {
    loadingDepts.value = false
  }
}

async function fetchMajors() {
  loadingMajors.value = true
  try {
    const { data } = await api.get('/dictionary/majors')
    majors.value = data
  } catch (e) {
    majorError.value = 'Failed to load majors'
  } finally {
    loadingMajors.value = false
  }
}

function openDeptForm(dept = null) {
  if (dept) {
    deptEditing.value = dept.id
    deptForm.value = { code: dept.code, name: dept.name, description: dept.description || '' }
  } else {
    deptEditing.value = null
    deptForm.value = { code: '', name: '', description: '' }
  }
  showDeptForm.value = true
  deptError.value = null
}

async function saveDepartment() {
  deptError.value = null
  try {
    if (deptEditing.value) {
      await api.put(`/dictionary/departments/${deptEditing.value}`, deptForm.value)
    } else {
      await api.post('/dictionary/departments', deptForm.value)
    }
    showDeptForm.value = false
    fetchDepartments()
    fetchMajors()
  } catch (e) {
    deptError.value = e.response?.data?.message || 'Failed to save department'
  }
}

function openMajorForm(major = null) {
  if (major) {
    majorEditing.value = major.id
    majorForm.value = { code: major.code, name: major.name, description: major.description || '', departmentId: major.departmentId }
  } else {
    majorEditing.value = null
    majorForm.value = { code: '', name: '', description: '', departmentId: '' }
  }
  showMajorForm.value = true
  majorError.value = null
}

async function saveMajor() {
  majorError.value = null
  try {
    if (majorEditing.value) {
      await api.put(`/dictionary/majors/${majorEditing.value}`, majorForm.value)
    } else {
      await api.post('/dictionary/majors', majorForm.value)
    }
    showMajorForm.value = false
    fetchMajors()
    fetchDepartments()
  } catch (e) {
    majorError.value = e.response?.data?.message || 'Failed to save major'
  }
}

function confirmDelete(type, item) {
  deleteModal.value = { show: true, type, item }
}

async function performDelete() {
  const { type, item } = deleteModal.value
  try {
    if (type === 'department') {
      await api.delete(`/dictionary/departments/${item.id}`)
      fetchDepartments()
    } else {
      await api.delete(`/dictionary/majors/${item.id}`)
      fetchMajors()
      fetchDepartments()
    }
  } catch (e) {
    // show inline
  }
  deleteModal.value = { show: false, type: null, item: null }
}

onMounted(() => {
  fetchDepartments()
  fetchMajors()
})
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-2">Departments & Majors</h1>
    <p class="text-text-secondary text-sm mb-8">Manage academic departments and their majors</p>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Departments -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Departments</h2>
          <button @click="openDeptForm()" class="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            Add
          </button>
        </div>

        <div v-if="loadingDepts" class="flex justify-center py-10">
          <div class="w-7 h-7 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>

        <div v-else-if="departments.length === 0" class="bg-surface rounded-2xl border border-border p-8 text-center">
          <p class="text-text-secondary text-sm">No departments yet.</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="dept in departments"
            :key="dept.id"
            class="bg-surface rounded-xl border border-border p-4 hover:shadow-sm transition-shadow"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1 min-w-0">
                  <span class="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-semibold shrink-0">{{ dept.code }}</span>
                  <h3 class="font-medium text-sm truncate">{{ dept.name }}</h3>
                </div>
                <p v-if="dept.description" class="text-text-secondary text-xs line-clamp-2">{{ dept.description }}</p>
                <div v-if="dept.majors?.length" class="flex flex-wrap gap-1.5 mt-2">
                  <span
                    v-for="m in dept.majors"
                    :key="m.id"
                    class="px-2 py-0.5 bg-secondary/10 text-secondary rounded text-xs"
                  >
                    {{ m.name }}
                  </span>
                </div>
              </div>
              <div class="flex gap-1 shrink-0">
                <button @click="openDeptForm(dept)" class="p-1.5 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent transition-colors" title="Edit">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button @click="confirmDelete('department', dept)" class="p-1.5 hover:bg-danger/10 rounded-lg text-text-secondary hover:text-danger transition-colors" title="Delete">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Majors -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Majors</h2>
          <button @click="openMajorForm()" class="inline-flex items-center gap-1.5 bg-secondary hover:bg-secondary/90 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            Add
          </button>
        </div>

        <div v-if="loadingMajors" class="flex justify-center py-10">
          <div class="w-7 h-7 border-3 border-secondary/30 border-t-secondary rounded-full animate-spin"></div>
        </div>

        <div v-else-if="majors.length === 0" class="bg-surface rounded-2xl border border-border p-8 text-center">
          <p class="text-text-secondary text-sm">No majors yet. Add departments first.</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="major in majors"
            :key="major.id"
            class="bg-surface rounded-xl border border-border p-4 hover:shadow-sm transition-shadow"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1 min-w-0">
                  <span class="px-2 py-0.5 bg-secondary/10 text-secondary rounded text-xs font-semibold shrink-0">{{ major.code }}</span>
                  <h3 class="font-medium text-sm truncate">{{ major.name }}</h3>
                </div>
                <p v-if="major.description" class="text-text-secondary text-xs line-clamp-2">{{ major.description }}</p>
                <p class="text-text-secondary text-xs mt-1">
                  Dept: <span class="font-medium text-text-primary">{{ major.departmentName }}</span>
                </p>
              </div>
              <div class="flex gap-1 shrink-0">
                <button @click="openMajorForm(major)" class="p-1.5 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent transition-colors" title="Edit">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button @click="confirmDelete('major', major)" class="p-1.5 hover:bg-danger/10 rounded-lg text-text-secondary hover:text-danger transition-colors" title="Delete">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Department Form Modal -->
    <Teleport to="body">
      <div v-if="showDeptForm" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" @click.self="showDeptForm = false">
        <div class="bg-surface rounded-2xl p-6 shadow-xl max-w-md w-full mx-4">
          <h3 class="text-lg font-semibold mb-4">{{ deptEditing ? 'Edit Department' : 'New Department' }}</h3>
          <div v-if="deptError" class="bg-danger/10 text-danger px-3 py-2 rounded-lg text-sm mb-4">{{ deptError }}</div>
          <form @submit.prevent="saveDepartment" class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-1">Code <span class="text-danger">*</span></label>
              <input v-model="deptForm.code" required placeholder="e.g. CS" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Name <span class="text-danger">*</span></label>
              <input v-model="deptForm.name" required placeholder="e.g. Computer Science" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Description</label>
              <textarea v-model="deptForm.description" rows="2" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"></textarea>
            </div>
            <div class="flex gap-3 justify-end pt-2">
              <button type="button" @click="showDeptForm = false" class="px-4 py-2 rounded-xl text-sm font-medium hover:bg-surface-dark transition-colors">Cancel</button>
              <button type="submit" class="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors">{{ deptEditing ? 'Update' : 'Create' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Major Form Modal -->
    <Teleport to="body">
      <div v-if="showMajorForm" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" @click.self="showMajorForm = false">
        <div class="bg-surface rounded-2xl p-6 shadow-xl max-w-md w-full mx-4">
          <h3 class="text-lg font-semibold mb-4">{{ majorEditing ? 'Edit Major' : 'New Major' }}</h3>
          <div v-if="majorError" class="bg-danger/10 text-danger px-3 py-2 rounded-lg text-sm mb-4">{{ majorError }}</div>
          <form @submit.prevent="saveMajor" class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-1">Department <span class="text-danger">*</span></label>
              <select v-model="majorForm.departmentId" required class="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">Select department...</option>
                <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.code }} — {{ d.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Code <span class="text-danger">*</span></label>
              <input v-model="majorForm.code" required placeholder="e.g. SE" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Name <span class="text-danger">*</span></label>
              <input v-model="majorForm.name" required placeholder="e.g. Software Engineering" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Description</label>
              <textarea v-model="majorForm.description" rows="2" class="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"></textarea>
            </div>
            <div class="flex gap-3 justify-end pt-2">
              <button type="button" @click="showMajorForm = false" class="px-4 py-2 rounded-xl text-sm font-medium hover:bg-surface-dark transition-colors">Cancel</button>
              <button type="submit" class="px-4 py-2 bg-secondary text-white rounded-xl text-sm font-medium hover:bg-secondary/90 transition-colors">{{ majorEditing ? 'Update' : 'Create' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Modal -->
    <Teleport to="body">
      <div v-if="deleteModal.show" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" @click.self="deleteModal.show = false">
        <div class="bg-surface rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
          <h3 class="text-lg font-semibold mb-2">Delete {{ deleteModal.type === 'department' ? 'Department' : 'Major' }}</h3>
          <p class="text-text-secondary text-sm mb-6">
            Are you sure you want to delete <strong>{{ deleteModal.item?.name }}</strong>?
            <span v-if="deleteModal.type === 'department' && deleteModal.item?.majors?.length"> This will also delete {{ deleteModal.item.majors.length }} major(s).</span>
          </p>
          <div class="flex gap-3 justify-end">
            <button @click="deleteModal.show = false" class="px-4 py-2 rounded-xl text-sm font-medium hover:bg-surface-dark transition-colors">Cancel</button>
            <button @click="performDelete" class="px-4 py-2 bg-danger text-white rounded-xl text-sm font-medium hover:bg-danger/90 transition-colors">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
