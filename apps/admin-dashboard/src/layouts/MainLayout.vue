<template>
  <a-layout style="min-height: 100vh" :class="{ 'dark': isDark }">
    <!-- Sidebar -->
    <SidebarLayout 
      v-model:collapsed="collapsed" 
      :userName="authStore.user?.firstname || 'Admin'"
      :userAvatar="authStore.user?.picture || 'https://via.placeholder.com/150'"
      :userRole="authStore.user?.role || 'Admin'"
      @logout="handleLogout"
    />

    <a-layout>
      <!-- Header -->
      <HeaderLayout 
        :userName="authStore.user?.firstname || 'Admin'" 
        v-model:collapsed="collapsed"
        @logout="handleLogout" 
      />

      <!-- Content Area -->
      <a-layout-content class="main-content-scroll">
        <div class="content-wrapper">
          <router-view />
        </div>
        <!-- Footer moved inside content or kept outside based on scroll preference -->
        <FooterLayout />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import SidebarLayout from './components/SidebarLayout.vue';
import HeaderLayout from './components/HeaderLayout.vue';
import FooterLayout from './components/FooterLayout.vue';
import { useThemeStore } from '@/stores/theme';
import { storeToRefs } from 'pinia';

import { Modal } from 'ant-design-vue';
import { createVNode } from 'vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';

const authStore = useAuthStore();
const themeStore = useThemeStore();
const { isDark } = storeToRefs(themeStore);
const router = useRouter();

const collapsed = ref(false);

const handleLogout = async () => {
  Modal.confirm({
    title: 'Confirm Logout',
    icon: createVNode(ExclamationCircleOutlined),
    content: 'Are you sure you want to log out?',
    okText: 'Logout',
    cancelText: 'Cancel',
    async onOk() {
      await authStore.logout();
      router.push({ name: 'login' });
    },
    onCancel() {},
  });
};
</script>

<style scoped>
.main-content-scroll {
  height: calc(100vh - 72px);
  overflow-y: auto;
}

.content-wrapper {
  margin: 24px;
  min-height: calc(100vh - 180px);
}
</style>

<style>
/* Unscoped styles for dark mode */
.main-content-scroll {
  background: #f9fafb !important;
  transition: background-color 0.3s ease;
}

.dark .main-content-scroll {
  background: var(--color-dark-bg) !important;
}

.dark .content-wrapper {
  background: transparent;
}

.dark .ant-layout {
  background: var(--color-dark-bg) !important;
}
</style>

