<script setup>
import '@wangeditor/editor/dist/css/style.css' // css
import { onBeforeUnmount, ref, shallowRef, watch, computed } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { i18nChangeLanguage } from '@wangeditor/editor'
import { useThemeStore } from '@/stores/theme'

// Set language to English
i18nChangeLanguage('en')

const themeStore = useThemeStore()

const props = defineProps({
  modelValue: {
    type: String,
    default: '<p></p>',
  },
  placeholder: {
    type: String,
    default: 'Type here...',
  },
  mode: {
    type: String,
    default: 'default', // 'default' or 'simple'
  },
  height: {
    type: [String, Number],
    default: 450,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'change', 'blur', 'focus'])

// Editor instance must be shallowRef
const editorRef = shallowRef()

// Content HTML
const valueHtml = ref(props.modelValue)

// Toolbar configuration
const toolbarConfig = {
  excludeKeys: [
    'group-more-style', // Exclude "More Styles" group
    'fontFamily',
    'codeBlock',
    'todo',
    'emotion',
    'insertTable',
    'insertLink', // Exclude Link
    'group-image', // Exclude Image (both upload and network)
    'group-video', // Exclude Video
    'video',
    'bgColor',
    'color',
    'font-color',
    'back-color',
  ],
}

// Editor configuration
const editorConfig = computed(() => ({
  placeholder: props.placeholder,
  readOnly: props.disabled,
  MENU_CONF: {},
  // Update background/color for the editor content area dynamically if needed via config,
  // but CSS overrides are usually more reliable for complete theming
}))

// Watch for external modelValue changes
watch(
  () => props.modelValue,
  (newVal) => {
    // Only update if the content is different to avoid cursor jumping
    if (newVal !== valueHtml.value) {
      valueHtml.value = newVal
    }
  },
)

// Watch for disabled prop changes
watch(
  () => props.disabled,
  (val) => {
    const editor = editorRef.value
    if (editor == null) return
    val ? editor.disable() : editor.enable()
  },
)

// Component destruction
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})

const handleCreated = (editor) => {
  editorRef.value = editor // Record editor instance
  if (props.disabled) {
    editor.disable()
  }
}

const handleChange = (editor) => {
  emit('update:modelValue', valueHtml.value)
  emit('change', editor)
}

const handleBlur = (editor) => {
  emit('blur', editor)
}

const handleFocus = (editor) => {
  emit('focus', editor)
}

const containerStyle = computed(() => {
  return {
    height: typeof props.height === 'number' ? `${props.height}px` : props.height,
  }
})
</script>

<template>
  <div
    class="rich-text-editor border rounded-xl overflow-hidden transition-colors duration-300"
    :class="themeStore.isDark ? 'dark-mode-editor border-dark-border' : 'border-gray-200 bg-white'"
  >
    <Toolbar
      class="border-b transition-colors duration-300"
      :class="themeStore.isDark ? 'border-dark-border' : 'border-gray-100'"
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      :mode="mode"
    />
    <div :style="containerStyle" class="overflow-y-hidden">
      <Editor
        style="height: 100%; overflow-y: hidden"
        v-model="valueHtml"
        :defaultConfig="editorConfig"
        :mode="mode"
        @onCreated="handleCreated"
        @onChange="handleChange"
        @onBlur="handleBlur"
        @onFocus="handleFocus"
      />
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

/* Light mode defaults */
:deep(.w-e-toolbar) {
  @apply bg-gray-50;
  border-bottom: 1px solid #e5e7eb !important;
}

:deep(.w-e-text-container) {
  @apply bg-white;
}

:deep(.w-e-bar-item button) {
  @apply text-gray-600;
}

/* Dark mode overrides */
.dark-mode-editor :deep(.w-e-toolbar) {
  background-color: var(--color-dark-border) !important;
  color: #e5e7eb !important;
  border-bottom-color: var(--color-dark) !important;
}

.dark-mode-editor :deep(.w-e-text-container) {
  background-color: var(--color-dark) !important;
  color: #f3f4f6 !important;
}

.dark-mode-editor :deep(.w-e-bar-item button) {
  @apply text-gray-300;
}

.dark-mode-editor :deep(.w-e-bar-item button:hover) {
  @apply bg-gray-800 text-white;
}

/* Dropdown menus in dark mode */
.dark-mode-editor :deep(.w-e-menu-panel) {
  background-color: var(--color-dark-border) !important;
  color: #f3f4f6 !important;
  border-color: #374151 !important;
}

.dark-mode-editor :deep(.w-e-panel-content-color) {
  background-color: var(--color-dark-border) !important;
}

/* Placeholder color in dark mode */
.dark-mode-editor :deep(.w-e-text-placeholder) {
  @apply text-gray-500;
}
</style>
