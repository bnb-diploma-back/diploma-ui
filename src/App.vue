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
  <div v-else class="h-screen overflow-hidden">
    <AppSidebar />
    <main class="ml-16 h-screen overflow-y-auto">
      <router-view />
    </main>
  </div>
</template>