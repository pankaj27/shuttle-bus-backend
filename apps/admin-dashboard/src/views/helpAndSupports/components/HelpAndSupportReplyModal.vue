<template>
  <a-modal
    :visible="visible"
    :title="'Reply to: ' + record?.ticket_no"
    @ok="submitReply"
    @cancel="$emit('close')"
    :confirmLoading="loading"
    ok-text="Send Reply"
    cancel-text="Cancel"
    width="500px"
    centered
    class="custom-modal"
  >
    <div v-if="record" class="space-y-4 py-2">
      <div>
        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Reply Title</p>
        <a-input
          v-model:value="form.title"
          placeholder="Enter title"
          class="rounded-xl border-gray-200"
        />
      </div>
      <div>
        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
          Reply Message
        </p>
        <a-textarea
          v-model:value="form.message"
          placeholder="Type your reply here..."
          :rows="6"
          class="rounded-xl border-gray-200"
        />
      </div>

      <div>
        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
          Update Ticket Status
        </p>
        <a-select v-model:value="form.status" class="w-full">
          <a-select-option value="Pending">Pending</a-select-option>
          <a-select-option value="InProgress">In Progress</a-select-option>
          <a-select-option value="Resolved">Resolved</a-select-option>
          <a-select-option value="Closed">Closed</a-select-option>
        </a-select>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { message } from 'ant-design-vue'
import { helpAndSupportService } from '@/services/helpandsupport.service'

const props = defineProps({
  visible: Boolean,
  record: Object,
})

const emit = defineEmits(['close', 'success'])

const loading = ref(false)
const form = reactive({
  title: '',
  message: '',
  type: 'notification',
  status: 'Resolved',
})

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      form.message = ''
      form.status = props.record?.status || 'Resolved'
    }
  },
)

const submitReply = async () => {
  if (!form.message.trim()) {
    return message.warning('Please enter a message')
  }
  if (!form.title.trim()) {
    return message.warning('Please enter a title')
  }

  loading.value = true
  try {
    await helpAndSupportService.reply(props.record.id, {
      userId: props.record.userId,
      content: form.message,
      title: form.title,
      type: form.type,
      status: form.status,
    })
    message.success('Reply sent successfully')
    emit('success')
  } catch (error) {
    message.error('Failed to send reply')
  } finally {
    loading.value = false
  }
}
</script>
