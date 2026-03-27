<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './components/layout/AppSidebar.vue'

const route = useRoute()
const isAuthPage = computed(() => route.meta.guest === true || route.meta.setup === true)
</script>

<template>
  <div v-if="isAuthPage">
    <router-view />
  </div>
  <div v-else class="flex h-screen overflow-hidden">
    <AppSidebar />
    <main class="flex-1 overflow-y-auto">
      <router-view />
    </main>
  </div>
</template>