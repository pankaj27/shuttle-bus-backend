<template>
  <div class="profile-container animate-fade-in">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
      <div class="flex items-center gap-6">
        <div>
          <FileUpload
            v-model:value="formState.picture"
            folder="avatars"
            height="128px"
            width="128px"
            :max-size="2"
            accept="image/*"
            help-text="Upload Avatar"
            :disabled="authStore.isDemo"
            class="rounded-3xl overflow-hidden shadow-xl"
          />
        </div>

        <div>
          <h1
            class="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1"
          >
            {{ authStore.user?.firstname || 'Admin' }}
            {{ authStore.user?.lastname || 'User' }}
          </h1>
          <p
            class="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2"
          >
            <LucideIcon name="Shield" :size="16" class="text-primary" />
            {{ authStore.user?.role.toUpperCase() || ' Super Administrator' }} 
          </p>
          <div class="flex gap-2 mt-3">
            <span
              class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider rounded-lg"
              >Active</span
            >
            <span
              class="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-lg"
              >Verified Fleet Manager</span
            >
          </div>
        </div>
      </div>

      <div class="flex gap-3">

        <a-button
          v-if="!authStore.isDemo"
          type="primary"
          class="rounded-xl h-11 px-6 font-bold shadow-lg shadow-primary/20"
          :loading="loading"
          @click="handleSave"
        >
          Save Changes
        </a-button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left Column: Primary Info -->
      <div class="lg:col-span-2 space-y-8">
        <a-alert
          v-if="authStore.isDemo"
          message="Demo Mode Active"
          description="Profile modifications and account security settings are disabled in this demonstration."
          type="warning"
          show-icon
          class="mb-6 rounded-2xl shadow-sm ring-1 ring-amber-100"
        />
        <a-card :bordered="false" class="card-premium">
          <div class="flex items-center gap-3 mb-6">
            <div class="p-2 bg-primary/10 rounded-lg text-primary">
              <LucideIcon name="User" :size="20" />
            </div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white m-0">
              Personal Information
            </h3>
          </div>

          <a-form layout="vertical" :model="formState">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <a-form-item label="First Name">
                <a-input
                  v-model:value="formState.firstname"
                  class="premium-input"
                  :disabled="authStore.isDemo"
                  placeholder="Enter first name"
                />
              </a-form-item>
              <a-form-item label="Last Name">
                <a-input
                  v-model:value="formState.lastname"
                  class="premium-input"
                  :disabled="authStore.isDemo"
                  placeholder="Enter last name"
                />
              </a-form-item>
              <a-form-item label="Email Address">
                <a-input
                  v-model:value="formState.email"
                  class="premium-input"
                  :disabled="authStore.isDemo"
                  placeholder="email@example.com"
                >
                  <template #prefix
                    ><LucideIcon name="Mail" :size="16" class="text-gray-400"
                  /></template>
                </a-input>
              </a-form-item>
              <a-form-item label="Phone Number">
                <PhoneInput
                  v-model:number="formState.phone"
                  v-model:code="formState.country_code"
                  class="premium-input"
                  :disabled="authStore.isDemo"
                />
              </a-form-item>
            </div>

          </a-form>
        </a-card>

        <!-- <a-card :bordered="false" class="card-premium">
          <div class="flex items-center gap-3 mb-6">
            <div class="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <LucideIcon name="Globe" :size="20" />
            </div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white m-0">
              Regional Settings
            </h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <a-form-item label="Language">
              <a-select
                v-model:value="formState.language"
                class="premium-select"
                size="large"
              >
                <a-select-option value="en">English (US)</a-select-option>
                <a-select-option value="es">Spanish</a-select-option>
                <a-select-option value="fr">French</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="Timezone">
              <a-select
                v-model:value="formState.timezone"
                class="premium-select"
                size="large"
              >
                <a-select-option value="utc"
                  >UTC (Coordinated Universal Time)</a-select-option
                >
                <a-select-option value="est"
                  >EST (Eastern Standard Time)</a-select-option
                >
                <a-select-option value="nst"
                  >NST (Nepal Standard Time)</a-select-option
                >
              </a-select>
            </a-form-item>
          </div> 
        </a-card> -->
      </div>

      <!-- Right Column: Sidebar Stats & Security -->
      <div class="space-y-8">
        <!-- Activity Card -->
        <a-card
          :bordered="false"
          class="card-premium bg-gradient-to-br from-gray-900 to-gray-800 border-none"
        >
          <h3 class="text-lg font-bold text-white mb-6">Quick Actions</h3>
          <div class="space-y-3 space-x-3">
            <a-button
              block
              @click="showChangePassword"
              class="group h-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-white flex items-center justify-start px-4 gap-3 transition-all"
            >
              <LucideIcon
                name="Key"
                :size="18"
                class="text-primary group-hover:scale-110 transition-transform"
              />
              <span
                class="font-semibold"
                >Change Password</span
              >
            </a-button>
            <!-- <a-button
              block
              class="group h-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-white flex items-center justify-start px-4 gap-3 transition-all"
            >
              <LucideIcon
                name="Bell"
                :size="18"
                class="text-primary group-hover:scale-110 transition-transform"
              />
              <span class="font-semibold">Notification Preferences</span>
            </a-button>
            <a-button
              block
              class="group h-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-white flex items-center justify-start px-4 gap-3 transition-all"
            >
              <LucideIcon
                name="ShieldCheck"
                :size="18"
                class="text-primary group-hover:scale-110 transition-transform"
              />
              <span class="font-semibold">2FA Configuration</span>
            </a-button> -->
          </div>

          <div class="mt-8 pt-8 border-t border-white/5">
            <p
              class="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4"
            >
              Last Login Activity
            </p>
            <div class="flex items-center gap-3">
              <div class="p-2 bg-green-500/20 rounded-lg">
                <LucideIcon name="Monitor" :size="16" class="text-green-500" />
              </div>
              <div>
                <p class="text-xs font-bold text-white m-0">Chrome on MacOS</p>
                <p class="text-[14px] text-gray-400 m-0">
                 {{formatDateTime(authStore.user.last_login)}}
                </p>
              </div>
            </div>
          </div>
        </a-card>

        <!-- Danger Zone -->
        <!-- <a-card
          :bordered="false"
          class="card-premium border-red-100 dark:border-red-900/30"
        >
          <h3 class="text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Actions here are permanent and cannot be undone.
          </p>
          <a-button danger block class="rounded-xl h-11 font-bold">
            Delete My Account
          </a-button>
        </a-card> -->
           <!-- Change Password Modal -->
    <ChangePassword v-model:open="changePasswordVisible" @success="handlePasswordChanged" />
 
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import FileUpload from '@/components/FileUpload.vue'
import PhoneInput from '@/components/PhoneInput.vue'
import { useAuthStore } from '@/stores/auth'
import { message, Modal } from 'ant-design-vue'
import { userService } from "@/services/user.service";
import { formatDateTime } from '@/utils/date'
import ChangePassword from "@/components/ChangePassword.vue"
const authStore = useAuthStore()
const loading = ref(false)

const formState = reactive({
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  country_code: '91',
  picture: '',
   language: 'en',
})

const changePasswordVisible = ref(false)

const showChangePassword = () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Changing account password is disabled in Demo Mode.',
    });
    return;
  }
  changePasswordVisible.value = true
}


onMounted(() => {
  if (authStore.user) {
    formState.firstname = authStore.user.firstname || ''
    formState.lastname = authStore.user.lastname || ''
    formState.email = authStore.user.email || ''
    formState.phone = authStore.user.phone || ''
    formState.picture = authStore.user.picture || ''
    formState.country_code = authStore.user.country_code || '91'
  }
})

const handleSave = () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating profile information is disabled in Demo Mode.',
    });
    return;
  }
  loading.value = true
  // Simulate API call
  setTimeout(() => {
    loading.value = false
    userService.update(authStore.user.id, formState).then(() => {
        authStore.setProfile(formState)
      message.success({
        content: 'Profile configuration updated successfully!',
        class: 'premium-message',
      })
    })
  }, 1200)
}
</script>

<style scoped>
@reference "tailwindcss";

.profile-container {
  @apply max-w-7xl mx-auto py-4;
}

.premium-input {
  @apply rounded-xl transition-all duration-200 border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white;
}

.premium-input:focus {
  @apply ring-4 bg-white dark:bg-gray-800;
  border-color: var(--color-primary);
  --tw-ring-color: color-mix(in srgb, var(--color-primary), transparent 90%);
}

:deep(.ant-form-item-label label) {
  @apply font-bold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider;
}

.premium-select :deep(.ant-select-selector) {
  @apply h-11! rounded-xl! border-gray-200! dark:border-gray-700! dark:bg-gray-800/50! flex items-center!;
}

.animate-fade-in {
  animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
