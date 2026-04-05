<script setup>
import { ref, watch, computed } from 'vue'
import { Plus, Loader2, Trash2 } from 'lucide-vue-next'
import { message } from 'ant-design-vue'
import { useUploader } from '@/composables/useUploader'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  value: {
    type: [String, Array],
    default: '',
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  maxCount: {
    type: Number,
    default: 10,
  },
  folder: {
    type: String,
    default: 'general',
  },
  accept: {
    type: String,
    default: 'image/png,image/jpeg,image/jpg',
  },
  maxSize: {
    type: Number,
    default: 2, // MB
  },
  helpText: {
    type: String,
    default: 'PNG, JPG < 2MB',
  },
  height: {
    type: String,
    default: '100%', // h-48
  },
  width: {
    type: String,
    default: '100%',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:value', 'change'])

const { loading, uploadFile, deleteFile } = useUploader()

const authStore = useAuthStore()
const isDemo = computed(() => authStore.isDemo)
const mergedDisabled = computed(() => props.disabled || isDemo.value)

// Normalize file list for internal use
const fileList = computed(() => {
  if (Array.isArray(props.value)) return props.value
  return props.value ? [props.value] : []
})

const beforeUpload = (file) => {
  if (mergedDisabled.value) {
    message.warning('File upload is disabled in Demo Mode.')
    return false
  }
  const isTypeValid = props.accept.split(',').some((type) => {
    const trimmedType = type.trim()
    if (trimmedType === 'image/*') return file.type.startsWith('image/')
    return file.type === trimmedType
  })

  if (!isTypeValid) {
    message.error('Invalid file type!')
    return false
  }
  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize
  if (!isLtMaxSize) {
    message.error(`File must be smaller than ${props.maxSize}MB!`)
    return false
  }

  if (props.multiple && fileList.value.length >= props.maxCount) {
    message.error(`Maximum ${props.maxCount} files allowed!`)
    return false
  }

  return true
}

const customRequest = async ({ file, onSuccess, onError }) => {
  try {
    const url = await uploadFile(file, props.folder, props.width, props.height)

    if (props.multiple) {
      const newList = [...fileList.value, url]
      emit('update:value', newList)
      emit('change', newList)
    } else {
      emit('update:value', url)
      emit('change', url)
    }
    onSuccess(url)
  } catch (err) {
    onError(err)
  }
}

const handleRemove = async (index) => {
  if (mergedDisabled.value) {
    message.warning('File removal is disabled in Demo Mode.')
    return
  }
  try {
    const path = fileList.value[index]
    if (path) {
      await deleteFile(path)
    }

    if (props.multiple) {
      const newList = [...fileList.value]
      newList.splice(index, 1)
      emit('update:value', newList)
      emit('change', newList)
    } else {
      emit('update:value', '')
      emit('change', '')
    }
  } catch (error) {
    console.error('Delete action failed:', error)
  }
}

const containerStyle = computed(() => {
  const h =
    props.height.toString().includes('px') || props.height.toString().includes('%')
      ? props.height
      : `${props.height}px`
  const w =
    props.width.toString().includes('px') || props.width.toString().includes('%')
      ? props.width
      : `${props.width}px`
  return { height: h, width: w }
})
</script>

<template>
  <div class="flex flex-wrap gap-4">
    <!-- Multiple Files Preview -->
    <template v-if="multiple && fileList.length > 0">
      <div
        v-for="(url, index) in fileList"
        :key="index"
        class="relative group"
        :style="{ height: '120px', width: '120px' }"
      >
        <img
          :src="url"
          alt="uploaded file"
          class="w-full h-full object-cover rounded-xl border border-gray-100 dark:border-gray-700"
        />
        <div
          class="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded-xl z-20 transition-all"
        >
          <div
            class="p-2 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors cursor-pointer"
            v-if="!mergedDisabled"
            @click="handleRemove(index)"
          >
            <Trash2 :size="16" class="text-white" />
          </div>
        </div>
      </div>
    </template>

    <!-- Upload Box -->
    <div
      v-if="!multiple || fileList.length < maxCount"
      class="file-upload-container"
      :style="multiple ? { height: '120px', width: '120px' } : containerStyle"
    >
      <a-upload
        name="file"
        list-type="picture-card"
        class="custom-uploader w-full h-full"
        :show-upload-list="false"
        :before-upload="beforeUpload"
        :custom-request="customRequest"
        :accept="accept"
        :disabled="loading || mergedDisabled"
        :multiple="multiple"
      >
        <div v-if="!multiple && fileList[0]" class="relative w-full h-full group">
          <img :src="fileList[0]" alt="uploaded file" class="w-full h-full object-cover rounded-xl" />

          <!-- Overlay loading spinner -->
          <div
            v-if="loading"
            class="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl z-20"
          >
            <Loader2 :size="24" class="animate-spin text-white" />
          </div>

          <!-- Edit/Delete overlay -->
          <div
            v-if="!mergedDisabled"
            class="hidden group-hover:flex absolute inset-0 bg-black/40 items-center justify-center gap-3 rounded-xl transition-all z-10"
          >
            <div
              class="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              title="Change Image"
            >
              <Plus :size="20" class="text-white" />
            </div>
            <div
              class="p-2 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors cursor-pointer"
              @click.stop="() => handleRemove(0)"
              title="Remove Image"
            >
              <Trash2 :size="20" class="text-white" />
            </div>
          </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center h-full w-full">
          <div v-if="loading">
            <Loader2 :size="24" class="animate-spin text-blue-500 mb-2" />
            <div class="text-gray-500 text-xs">Uploading...</div>
          </div>
          <div v-else class="flex flex-col items-center p-4">
            <Plus :size="multiple ? 20 : 24" class="text-gray-400 mb-2" />
            <div class="text-gray-500 font-medium" :class="{ 'text-xs': multiple }">
              {{ multiple ? 'Add More' : 'Upload' }}
            </div>
            <div v-if="!multiple" class="text-gray-500 text-[10px] mt-1 text-center leading-tight">
              {{ helpText }}
            </div>
          </div>
        </div>
      </a-upload>
    </div>
  </div>
</template>

<style scoped>
.custom-uploader :deep(.ant-upload) {
  width: 100% !important;
  height: 100% !important;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 0.75rem; /* rounded-xl */
  background-color: #f9fafb; /* bg-gray-50 */
  border: 1px dashed #e5e7eb; /* border-gray-200 */
  transition: all 0.3s;
  padding: 0;
  margin: 0;
}

.custom-uploader :deep(.ant-upload:hover) {
  border-color: #60a5fa; /* blue-400 */
  background-color: #f0f9ff;
}
</style>
