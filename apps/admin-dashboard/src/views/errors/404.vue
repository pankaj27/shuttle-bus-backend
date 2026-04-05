<script setup>
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import LucideIcon from '@/components/LucideIcon.vue'

const router = useRouter()
const themeStore = useThemeStore()

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 transition-colors duration-300" 
       :class="themeStore.isDark ? 'bg-gray-900' : 'bg-gray-50'">
    <div class="max-w-md w-full text-center">
      <div class="relative mb-8">
        <h1 class="text-[150px] font-black line-height-none opacity-5 select-none"
            :class="themeStore.isDark ? 'text-white' : 'text-primary'">
          404
        </h1>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center animate-bounce">
            <LucideIcon name="MapPinOff" :size="48" class="text-primary" />
          </div>
        </div>
      </div>
      
      <h2 class="text-3xl font-bold mb-4" :class="themeStore.isDark ? 'text-white' : 'text-gray-800'">
        Lost in Transit?
      </h2>
      <p class="text-lg mb-10 transition-colors duration-300"
         :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
        The page you are looking for might have been moved, deleted, or never existed in our schedule.
      </p>

      <a-button type="primary" size="large" @click="goBack" 
                class="h-14 px-10 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 flex items-center gap-3 mx-auto">
        <LucideIcon name="Home" :size="20" />
        Back to Dashboard
      </a-button>
    </div>
  </div>
</template>

<style scoped>
.line-height-none {
  line-height: 1;
}
</style>
