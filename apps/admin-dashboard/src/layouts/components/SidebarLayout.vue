<template>
  <a-layout-sider
    :collapsed="collapsed"
    collapsible
    class="sidebar-container"
    :theme="isDark ? 'dark' : 'light'"
    :class="{ dark: isDark }"
    @collapse="onCollapse"
    width="280"
    :trigger="null"
  >
    <!-- Logo Section -->
    <div class="logo-wrapper flex items-center justify-center py-2">
      <div
        class="flex items-center gap-3 px-2 py-2 rounded-2xl transition-all duration-300 overflow-hidden"
        :class="collapsed ? 'bg-transparent' : 'glass'"
      >
        <div
          class="logo-icon  w-16 h-16 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 p-1"
        >
          <img
            v-if="logoUrl"
            :src="logoUrl"
            alt="Logo"
            class="w-full h-full brightness-110"
          />
          <span v-else class="text-white font-black text-xl italic">{{
            siteName.charAt(0)
          }}</span>
        </div>
        <div class="flex flex-col">
          <span
            v-if="!collapsed"
            class="logo-text text-xl font-black tracking-tighter text-gray-800 dark:text-white uppercase truncate max-w-[160px]"
          >
            {{ siteName }}
          </span>
          <a-tag v-if="!collapsed && isDemo" color="error" class="demo-sidebar-badge border-none m-0 py-0 px-2 h-4 flex items-center w-max scale-90 origin-left">
            DEMO MODE
          </a-tag>
        </div>
      </div>
    </div>

    <!-- Scrollable Menu -->
    <div class="menu-container py-2">
      <a-menu
        v-model:selectedKeys="selectedKeys"
        :theme="isDark ? 'dark' : 'light'"
        mode="inline"
        class="premium-menu"
      >
        <template v-for="item in menuItems" :key="item.name || item.path">
          <!-- Submenu -->
          <a-sub-menu
            v-if="item.children && item.children.length > 0"
            :key="`${item.path}-submenu`"
          >
            <template #icon>
              <div class="menu-icon-wrapper">
                <LucideIcon :name="item.icon" v-if="item.icon" :size="20" />
              </div>
            </template>
            <template #title>
              <span class="menu-title">{{ item.title }}</span>
            </template>
            <a-menu-item v-for="child in item.children" :key="child.path" class="sub-item">
              <router-link :to="child.path" class="flex items-center gap-2">
                <div
                  class="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 dot transition-colors"
                ></div>
                {{ child.title }}
              </router-link>
            </a-menu-item>
          </a-sub-menu>

          <!-- Single Item -->
          <a-menu-item v-else :key="item.path">
            <template #icon>
              <div class="menu-icon-wrapper">
                <LucideIcon :name="item.icon" v-if="item.icon" :size="20" />
              </div>
            </template>
            <router-link :to="item.path" class="menu-title">{{ item.title }}</router-link>
          </a-menu-item>
        </template>
      </a-menu>
    </div>

    <!-- Sidebar Footer -->
    <div class="sidebar-footer mt-auto px-4 py-6 border-t border-gray-100 dark:border-gray-800/50">
      <UserProfile :userName="userName" :userAvatar="userAvatar" :collapsed="collapsed" @logout="$emit('logout')" />
    </div>
  </a-layout-sider>
</template>

<script setup>
import { useMenu } from '@/composables/useMenu'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { ref, watch, onMounted, computed } from 'vue'
import UserProfile from '@/components/UserProfile.vue'

const themeStore = useThemeStore()
const { isDark, colorPrimary } = storeToRefs(themeStore)

const authStore = useAuthStore()
const isDemo = computed(() => authStore.isDemo)
const { generalSettings } = storeToRefs(authStore)
const defaultAppName = import.meta.env.VITE_APP_NAME || 'Jadliride'

defineProps({
  collapsed: Boolean,
  userName: {
    type: String,
    default: 'Admin User',
  },
  userAvatar: {
    type: String,
    default: 'https://via.placeholder.com/150',
  },
  userRole: {
    type: String,
    default: 'Admin',
  },
})

const emit = defineEmits(['update:collapsed', 'update:selectedKeys', 'logout'])

const { menuItems, selectedKeys } = useMenu()

const onCollapse = (val) => {
  emit('update:collapsed', val)
}

// Computed for dynamic logo based on theme
const logoUrl = computed(() => {
  if (isDark.value) {
    return generalSettings.value?.light_logo || generalSettings.value?.logo
  }
  return generalSettings.value?.dark_logo || generalSettings.value?.logo
})

const siteName = computed(() => generalSettings.value?.name || defaultAppName)

// Update CSS variables for dynamic primary color
const updatePrimaryColorVar = () => {
  document.documentElement.style.setProperty('--sidebar-primary-color', '#F4A632')

  // Calculate lighter shade (10% opacity)
  const r = 244, g = 166, b = 50;
  const lightBg = `rgba(${r}, ${g}, ${b}, 0.1)`
  document.documentElement.style.setProperty('--sidebar-primary-light', lightBg)

  // Calculate shadow color (30% opacity)
  const shadowColor = `rgba(${r}, ${g}, ${b}, 0.3)`
  document.documentElement.style.setProperty('--sidebar-primary-shadow', shadowColor)
}

// Watch for primary color changes
watch(colorPrimary, updatePrimaryColorVar, { immediate: true })

// Initialize on mount
onMounted(() => {
  updatePrimaryColorVar()
})
</script>

<style scoped>
@reference "tailwindcss";

.sidebar-container {
  @apply h-screen sticky top-0 left-0 transition-all duration-300 ease-in-out border-r border-gray-100;
}

.dark .sidebar-container {
  background-color: var(--color-dark-bg);
  border-right-color: var(--color-dark-border);
}

:deep(.ant-layout-sider-children) {
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
}

.logo-wrapper {
  @apply shrink-0;
}

.menu-container {
  @apply flex-1 overflow-y-auto px-1;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
}

.dark .menu-container {
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.menu-container::-webkit-scrollbar {
  width: 4px;
}

.menu-container::-webkit-scrollbar-track {
  background: transparent;
}

.menu-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

.dark .menu-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}

.menu-container:hover::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
}

.dark .menu-container:hover::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.sidebar-footer {
  @apply transition-all duration-300 shrink-0;
}

.demo-sidebar-badge {
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 0.5px;
  background-color: #ff4d4f !important;
  color: white !important;
  border-radius: 4px;
}
</style>

<style>
/* Modern premium menu overrides */
.premium-menu {
  border-inline-end: none !important;
  background: transparent !important;
  padding: 0 12px !important;
}

.premium-menu .ant-menu-item,
.premium-menu .ant-menu-submenu-title {
  height: 42px !important;
  line-height: 42px !important;
  border-radius: 12px !important;
  margin-bottom: 8px !important;
}

.ant-menu-light .ant-menu-item-selected {
  background-color: var(--sidebar-primary-color) !important;
  color: white !important;
  font-weight: 700 !important;
  box-shadow: 0 8px 16px -4px var(--sidebar-primary-shadow) !important;
}

.dark .ant-menu-dark .ant-menu-item-selected {
  background-color: var(--sidebar-primary-color) !important;
  color: white !important;
  font-weight: 700 !important;
  box-shadow: 0 8px 16px -4px var(--sidebar-primary-shadow) !important;
}
</style>
