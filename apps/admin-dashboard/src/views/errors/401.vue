<script setup>
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import LucideIcon from '@/components/LucideIcon.vue'

const router = useRouter()
const themeStore = useThemeStore()

const goBack = () => {
  router.push('/auth/login')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 transition-colors duration-300" 
       :class="themeStore.isDark ? 'bg-gray-900' : 'bg-gray-50'">
    <div class="max-w-md w-full text-center">
      <div class="relative mb-8">
        <h1 class="text-[150px] font-black line-height-none opacity-5 select-none text-red-500">
          401
        </h1>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center">
            <LucideIcon name="ShieldAlert" :size="48" class="text-red-500" />
          </div>
        </div>
      </div>
      
      <h2 class="text-3xl font-bold mb-4" :class="themeStore.isDark ? 'text-white' : 'text-gray-800'">
        Access Denied
      </h2>
      <p class="text-lg mb-10 transition-colors duration-300"
         :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
        You don't have permission to access this area. Please log in with an authorized account.
      </p>

      <div class="flex flex-col gap-4 max-w-[240px] mx-auto">
        <a-button type="primary" size="large" @click="goBack" 
                  class="h-14 px-10 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 flex items-center gap-3 justify-center">
          <LucideIcon name="LogIn" :size="20" />
          Login Again
        </a-button>
        <a-button type="link" @click="router.push('/')"
                  :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
          Go to Dashboard
        </a-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-height-none {
  line-height: 1;
}
</style>
