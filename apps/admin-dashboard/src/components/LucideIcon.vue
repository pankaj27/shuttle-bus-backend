<template>
  <component
    :is="iconComponent"
    :size="size"
    :stroke-width="strokeWidth"
    :class="['lucide-icon', $attrs.class]"
    v-bind="extraProps"
  />
</template>

<script setup>
import { computed } from 'vue'
import * as LucideIcons from 'lucide-vue-next'

const props = defineProps({
  name: {
    type: [String, Object, Function],
    required: true,
  },
  size: {
    type: [Number, String],
    default: 20,
  },
  strokeWidth: {
    type: Number,
    default: 2,
  },
})

const extraProps = computed(() => {
  const { class: _, ...rest } = Object.assign({}, props)
  return rest
})

const iconComponent = computed(() => {
  if (typeof props.name === 'string') {
    return LucideIcons[props.name] || LucideIcons.HelpCircle
  }
  return props.name
})
</script>

<style scoped>
.lucide-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}
</style>
