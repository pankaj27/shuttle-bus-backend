<template>
  <a-modal
    :visible="visible"
    :title="'Ticket: ' + record?.ticket_no"
    @cancel="$emit('close')"
    :footer="null"
    width="600px"
    centered
    class="custom-modal"
  >
    <div v-if="record" class="space-y-4 py-2">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">User</p>
          <p class="text-sm font-semibold text-gray-900">{{ record.fullname }}</p>
          <p class="text-xs text-gray-500">{{ record.email }}</p>
          <p class="text-xs text-gray-500">{{ record.phone }}</p>
        </div>
        <div>
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
          <a-tag :color="getStatusColor(record.status)" class="rounded-lg px-3 uppercase text-[10px] font-bold">
            {{ record.status || 'Pending' }}
          </a-tag>
        </div>
      </div>
      
      <a-divider class="my-2" />
      
      <div>
        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Subject</p>
        <p class="text-sm font-medium text-gray-900">{{ record.subject }}</p>
      </div>

      <div>
        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</p>
        <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 italic text-gray-700 text-sm whitespace-pre-wrap">
          {{ record.description }}
        </div>
      </div>

      <div v-if="record.replies">
         <a-divider class="my-2" />
         <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Replies</p>
         <div class="space-y-3">
           <!-- Handle Array of Replies -->
           <template v-if="Array.isArray(record.replies)">
             <div v-for="(reply, idx) in record.replies" :key="idx" class="bg-blue-50/50 p-3 rounded-xl">
               <p class="text-xs text-gray-600 mb-1 font-medium">{{ reply.sender || 'Admin' }}</p>
               <p class="text-sm text-gray-800">{{ reply.message || reply.content }}</p>
               <p class="text-[10px] text-gray-400 mt-1">{{ formatDateTime(reply.createdAt) }}</p>
             </div>
           </template>
           <!-- Handle Single Reply Object -->
           <template v-else-if="typeof record.replies === 'object'">
             <div class="bg-blue-50/50 p-3 rounded-xl">
               <p class="text-xs text-gray-600 mb-1 font-medium">{{ record.replies.title || 'Admin Reply' }}</p>
               <p class="text-sm text-gray-800">{{ record.replies.content || record.replies.message }}</p>
               <p class="text-[10px] text-gray-400 mt-1">{{ formatDateTime(record.replies.createdAt)  }}</p>
             </div>
           </template>
         </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { formatDateTime } from '@/utils/date'

defineProps({
  visible: Boolean,
  record: Object
})

defineEmits(['close'])

const getStatusColor = (status) => {
  const s = status?.toString().toLowerCase()
  if (s === 'resolved' || s === 'completed' || s === 'closed' || s === 'true') return 'success'
  if (s === 'inprogress' || s === 'processing') return 'processing'
  if (s === 'pending') return 'warning'
  if (s === 'false') return 'error'
  return 'default'
}
</script>
