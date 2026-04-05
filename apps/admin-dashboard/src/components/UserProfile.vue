<template>
  <div class="user-profile-container" :class="{ 'collapsed': collapsed }">
    <a-dropdown :trigger="['click']" placement="topRight">
      <div 
        class="user-profile-card glass flex items-center transition-all duration-300 cursor-pointer overflow-hidden shadow-sm"
        :class="collapsed ? 'p-1 rounded-xl justify-center w-12 h-12' : 'p-3 rounded-2xl gap-3 w-full'"
      >
        <div class="relative shrink-0">
          <a-avatar 
            :size="collapsed ? 36 : 42" 
            :src="userAvatar || 'https://xsgames.co/randomusers/avatar.php?g=pixel'" 
            class="border-2 border-white dark:border-gray-700 shadow-sm"
          />
          <div 
            class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"
            :class="{ 'opacity-0': collapsed }"
          ></div>
        </div>
        
        <div class="flex-1 min-w-0 transition-all duration-300" :class="{ 'opacity-0 w-0': collapsed }">
          <p class="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">{{ userName }}</p>
          <p class="text-[10px] font-medium text-gray-400 uppercase tracking-wider truncate">{{userRole}}</p>
        </div>
        
        <chevron-up :size="16" class="text-gray-400 transition-all duration-300" :class="{ 'opacity-0 w-0': collapsed }" />
      </div>
      
      <template #overlay>
        <a-menu class="profile-dropdown rounded-2xl shadow-xl border-none p-2 mb-2 w-64 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-50 dark:border-gray-800 mb-2">
            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ userName }}</p>
            <p class="text-xs text-gray-400">Super Admin</p>
          </div>
          <a-menu-item key="profile" class="rounded-xl! px-4! py-2.5!">
            <template #icon><user :size="16" class="mr-2" /></template>
            <router-link to="/settings/profile" class="font-medium">My Profile</router-link>
          </a-menu-item>
          <a-menu-item key="security" class="rounded-xl! px-4! py-2.5!" @click="showChangePassword">
            <template #icon><lock :size="16" class="mr-2" /></template>
            <span class="font-medium">Change Password</span>
          </a-menu-item>
          <a-menu-divider class="my-2" />
          <a-menu-item key="logout" danger @click="$emit('logout')" class="rounded-xl! px-4! py-2.5!">
            <template #icon><log-out :size="16" class="mr-2" /></template>
            <span class="font-bold">Sign Out</span>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
    
    <!-- Change Password Modal -->
    <ChangePassword v-model:open="changePasswordVisible" @success="handlePasswordChanged" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { 
  User, 
  Lock, 
  LogOut,
  ChevronUp
} from 'lucide-vue-next'
import { message } from 'ant-design-vue'
import ChangePassword from './ChangePassword.vue'

defineProps({
  userName: {
    type: String,
    default: 'Admin User'
  },
  userAvatar: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  userRole: {
    type: String,
    default: 'Admin'
  },
  collapsed: {
    type: Boolean,
    default: false
  }
})

defineEmits(['logout'])

const changePasswordVisible = ref(false)

const showChangePassword = () => {
  changePasswordVisible.value = true
}

const handlePasswordChanged = () => {
  message.success('Password changed successfully! Please login again with your new password.')
}
</script>

<style scoped>
@reference "tailwindcss";

.user-profile-container {
  @apply transition-all duration-300;
}

.user-profile-card {
  @apply hover:bg-gray-100/50 dark:hover:bg-gray-800/50;
}

.dark .profile-dropdown {
  background-color: #1f2937 !important;
  border: 1px solid #374151 !important;
}

/* Custom spacing for menu items */
.rounded-xl\! {
  border-radius: 12px !important;
}

.px-4\! {
  padding-left: 16px !important;
  padding-right: 16px !important;
}

.py-2\.5\! {
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}
</style>
