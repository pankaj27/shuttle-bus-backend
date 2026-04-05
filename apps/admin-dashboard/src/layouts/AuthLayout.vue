<template>
  <div class="auth-layout" :class="{ 'dark': isDark }">
    <a-row class="h-screen overflow-hidden">
      <!-- Left Side: Auth Form -->
      <a-col :xs="24" :lg="10" :xl="8" class="flex flex-col h-full auth-form-bg relative z-10 transition-colors duration-300">
        <div class="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-12 xl:px-20">
          <div class="mb-12 mt-12  flex items-center justify-between animate-fade-in">
            <div class="flex items-center gap-3">
              <div class="w-32 h-16 flex items-center justify-center p-1">
                <img
                  v-if="logoUrl"
                  :src="logoUrl"
                  alt="Logo"
                  class="w-full h-full object-contain"
                />
                <span v-else class="text-white font-black text-xl italic">{{
                  siteName.charAt(0)
                }}</span>
              </div>
              <span class="text-xl font-black tracking-tighter text-gray-800 dark:text-white uppercase">
                {{ siteName }}
              </span>
            </div>
            <ThemeSwitch />
          </div>
          <div class="animate-slide-up mt-14">
            <router-view />
          </div>
        </div>
        <div class="p-8 text-center auth-footer-text text-xs italic tracking-wide">
          &copy; {{ new Date().getFullYear() }} {{ siteName }} 
        </div>
      </a-col>

      <!-- Right Side: Image Slider -->
      <a-col :xs="0" :lg="14" :xl="16" class="h-full relative overflow-hidden bg-gray-900 border-l border-gray-100 dark:border-gray-800">
        <a-carousel autoplay effect="fade" class="h-full">
          <div v-for="(slide, index) in slides" :key="index" class="h-screen relative">
            <div 
              class="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] hover:scale-110"
              :style="{ backgroundImage: `url(${slide.image})` }"
            ></div>
            <div class="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/40 to-transparent"></div>
            <div class="absolute bottom-20 left-20 right-20 text-white z-20">
              <div class="w-12 h-1 bg-primary rounded-full mb-6"></div>
              <h2 class="text-5xl font-black mb-4 tracking-tight leading-tight slide-title">{{ slide.title }}</h2>
              <p class="text-xl text-gray-300 max-w-lg opacity-90 font-medium leading-relaxed">{{ slide.description }}</p>
            </div>
          </div>
        </a-carousel>
        

        <!-- Float Info -->
        <!-- <div class="absolute top-10 left-10 glass px-4 py-2 rounded-xl border-white/10 z-20 hidden xl:flex items-center gap-3">
          <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span class="text-white text-[10px] font-bold tracking-widest uppercase">System Status: Optimal</span>
        </div> -->
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue';
import ThemeSwitch from '@/components/ThemeSwitch.vue';
import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/stores/auth';
import { useSettings } from '@/composables/useSettings';
import { storeToRefs } from 'pinia';

// Use placeholders or local paths for images
import slide1 from '@/assets/auth/slide1.png';
import slide2 from '@/assets/auth/slide2.jpg';

const themeStore = useThemeStore();
const { isDark } = storeToRefs(themeStore);

const authStore = useAuthStore();
const { generalSettings } = storeToRefs(authStore);
const defaultAppName = import.meta.env.VITE_APP_NAME || 'Jadliride';
const { fetchSettings, fetchBranding } = useSettings();

// Computed for dynamic logo based on theme
const logoUrl = computed(() => {
  if (isDark.value) {
    return generalSettings.value?.light_logo || generalSettings.value?.logo;
  }
  return generalSettings.value?.dark_logo || generalSettings.value?.logo;
});

const siteName = computed(() => generalSettings.value?.name || defaultAppName);

onMounted(async () => {
  // Try to fetch branding publicly first (safe branding info)
  const brandingData = await fetchBranding();
  if (brandingData) {
    authStore.updateGeneralSettings(brandingData);
  }

  // If branding is missing (e.g. after a hard clear), try fetching it via settings (requires auth usually)
  // This is a fallback or for when we are already partially authenticated
  if (!generalSettings.value?.name && authStore.isAuthenticated) {
    const data = await fetchSettings('general');
    if (data) {
      authStore.updateGeneralSettings(data);
    }
  }
});

const slides = computed(() => [
  {
    title: `Smart Transit for ${siteName.value}`,
    description: 'Transforming urban mobility with real-time tracking and efficient routing systems.',
    image: slide1
  },
  {
    title: 'Shuttle Fleet Optimization Platform',
    description: 'Powering efficient routes, reliable schedules, and seamless passenger management.',
    image: slide2
  }
]);
</script>

<style scoped>
@reference "tailwindcss";

.auth-layout {
  @apply min-h-screen overflow-hidden;
}

:deep(.ant-carousel .slick-slider) {
  height: 100vh;
}

:deep(.ant-carousel .slick-list),
:deep(.ant-carousel .slick-track) {
  height: 100%;
}

.animate-slide-up {

  animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-fade-in {
  animation: fadeIn 1s ease-out forwards;
}

@keyframes slideUp {
  from { transform: translateY(40px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.slide-title {
  text-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
</style>

<style>
/* Unscoped styles for global dark mode variables */
.auth-form-bg {
  background-color: white;
}

.dark .auth-form-bg {
  background-color: var(--color-dark-bg);
}

.auth-footer-text {
  color: #9ca3af;
}

.dark .auth-footer-text {
  color: #4b5563;
}
</style>
