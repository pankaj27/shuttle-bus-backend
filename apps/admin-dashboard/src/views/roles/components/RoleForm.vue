<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { permissionService } from '@/services/permission.service'
import { useThemeStore } from '@/stores/theme'

const props = defineProps({
  initialData: { type: Object, default: null },
  isEdit: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['submit'])
const themeStore = useThemeStore()
const formRef = ref(null)
const permissions = ref([])
const loadingPermissions = ref(false)

const getDefaultState = () => ({
  name: '',
  slug: '',
  permissions: [],
  status: true,
})

const formState = reactive(getDefaultState())

const rules = {
  name: [{ required: true, message: 'Role name is required' }],
  slug: [{ required: true, message: 'Role slug is required' }],
}

const fetchPermissions = async () => {
  loadingPermissions.value = true
  try {
    // Attempting to fetch from /permissions/list which usually returns flat array or specific structure
    const response = await permissionService.getList()
    const rawData = response.data || response || []
    
    // Group them dynamically using our new service utility
    permissions.value = permissionService.groupPermissions(rawData)
  } catch (error) {
    console.error('Failed to fetch permissions:', error)
    // Mock permissions if API fails
    permissions.value = [
      { 
        group: 'Dashboard', 
        items: [
          { label: 'View Analytics', value: 'analytics.view' },
          { label: 'View Revenue', value: 'revenue.view' }
        ] 
      },
      { 
        group: 'Drivers', 
        items: [
          { label: 'View Drivers', value: 'drivers.view' },
          { label: 'Create Drivers', value: 'drivers.create' },
          { label: 'Edit Drivers', value: 'drivers.edit' }
        ] 
      }
    ]
  } finally {
    loadingPermissions.value = false
  }
}

watch(() => props.initialData, (newData) => {
  if (newData) {
    Object.assign(formState, {
      name: newData.name || '',
      slug: newData.slug || '',
      permissions: newData.permissions || [],
      status: newData.status !== undefined ? newData.status : true,
    })
  } else {
    Object.assign(formState, getDefaultState())
  }
}, { immediate: true })

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    emit('submit', { ...formState })
  } catch (error) {
    console.error('Validation failed:', error)
  }
}

const reset = () => {
  Object.assign(formState, getDefaultState())
}

onMounted(fetchPermissions)

defineExpose({ submit: handleSubmit, reset })
</script>

<template>
  <a-form ref="formRef" :model="formState" :rules="rules" layout="vertical" class="role-form">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <a-form-item label="Role Name" name="name">
        <a-input v-model:value="formState.name" placeholder="e.g. Operation Manager" class="rounded-xl h-11" :disabled="disabled" />
      </a-form-item>
      
      <a-form-item label="Role Slug / Key" name="slug">
        <a-input v-model:value="formState.slug" placeholder="e.g. operation-manager" class="rounded-xl h-11" :disabled="disabled || isEdit" />
        <span class="text-[10px] text-gray-400 mt-1 block">Unique identifier used for permission checks</span>
      </a-form-item>
    </div>


    <div class="mt-8">
      <div class="flex items-center gap-2 mb-4">
        <LucideIcon name="ShieldCheck" class="text-blue-500" :size="20" />
        <h3 class="text-lg font-bold m-0">Permissions Assignment</h3>
      </div>
      
      <div class="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        <div v-for="group in permissions" :key="group.group" class="p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700">
          <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
            <span class="text-xs font-black uppercase tracking-widest text-indigo-500">{{ group.group }}</span>
            <a-checkbox 
              :checked="group.items.every(p => formState.permissions.includes(p.value))"
              :indeterminate="group.items.some(p => formState.permissions.includes(p.value)) && !group.items.every(p => formState.permissions.includes(p.value))"
              :disabled="disabled"
              @change="(e) => {
                const values = group.items.map(p => p.value)
                if (e.target.checked) {
                  formState.permissions = [...new Set([...formState.permissions, ...values])]
                } else {
                  formState.permissions = formState.permissions.filter(p => !values.includes(p))
                }
              }"
            >
              Select All
            </a-checkbox>
          </div>
          
          <div class="w-full">
            <div class="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-5 gap-6">
              <div v-for="perm in group.items" :key="perm.value" class="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700/50 transition-colors">
                <a-checkbox 
                  :checked="formState.permissions.includes(perm.value)"
                  :disabled="disabled"
                  @change="(e) => {
                    if (e.target.checked) {
                      formState.permissions = [...new Set([...formState.permissions, perm.value])]
                    } else {
                      formState.permissions = formState.permissions.filter(p => p !== perm.value)
                    }
                  }"
                >
                  <span class="text-md text-gray-700 dark:text-gray-300">{{ perm.label }}</span>
                </a-checkbox>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- <div class="mt-8 flex items-center justify-between p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20">
      <div class="flex items-center gap-3">
         <LucideIcon name="Power" :size="18" class="text-blue-600" />
         <div>
            <p class="font-bold text-gray-900 dark:text-gray-100 m-0">Role Status</p>
            <p class="text-xs text-gray-500 m-0">Inactive roles will restrict all associated users</p>
         </div>
      </div>
      <a-switch v-model:checked="formState.status" />
    </div> -->
  </a-form>
</template>

<style scoped>
@reference "tailwindcss";

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-gray-200 dark:bg-gray-700 rounded-full;
}
</style>
