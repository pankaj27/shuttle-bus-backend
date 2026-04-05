<template>
  <a-drawer
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    title="Booking Details"
    width="700"
    :body-style="{ paddingBottom: '80px', backgroundColor: '#f8fafc' }"
    @close="onClose"
    class="booking-detail-drawer"
  >
    <div v-if="booking" class="space-y-6">
      <!-- Status & PNR Header -->
      <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div class="flex flex-col">
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">PNR Number</span>
            <span class="text-xl font-black text-blue-600 font-mono">#{{ booking.pnr_no }}</span>
          </div>
          <a-tag :color="getStatusColor(booking.status)" class="rounded-xl px-4 py-1 uppercase text-xs font-black">
            {{ booking.status }}
          </a-tag>
        </div>
        
        <div class="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-gray-100">
          <div>
            <span class="text-[10px] text-gray-400 font-bold uppercase block mb-1">Booking Date</span>
            <span class="text-gray-900 font-semibold text-sm">{{ formatDate(booking.booking_date) }}</span>
          </div>
          <div class="text-right">
            <span class="text-[10px] text-gray-400 font-bold uppercase block mb-1">Total Amount</span>
            <span class="text-gray-900 font-black text-2xl">{{ booking.amount }}</span>
          </div>
          <div>
            <span class="text-[10px] text-gray-400 font-bold uppercase block mb-1">Is Pass?</span>
            <a-tag :color="booking.is_pass === 'Yes' ? 'purple' : 'default'" class="font-bold m-0 rounded-lg">
              {{ booking.is_pass || 'No' }}
            </a-tag>
          </div>
          <div class="text-right" v-if="booking.is_pass === 'Yes'">
            <span class="text-[10px] text-gray-400 font-bold uppercase block mb-1">No of Pass</span>
            <span class="text-gray-900 font-black text-lg">{{ booking.no_of_pass }}</span>
          </div>
        </div>
      </div>

      <!-- Route Information -->
      <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div class="absolute right-0 top-0 opacity-10 p-4">
           <LucideIcon name="MapPin" :size="80" class="text-blue-500" />
        </div>
        
        <h3 class="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
           <LucideIcon name="Navigation" :size="16" class="text-blue-500" />
           Route Information
        </h3>

        <div class="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-blue-50 before:border-l-2 before:border-dotted before:border-blue-200">
          <div class="relative">
             <div class="absolute -left-[23px] top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm z-10"></div>
             <span class="text-[10px] text-gray-400 font-bold uppercase block mb-1">Pickup Location</span>
             <span class="text-gray-900 font-semibold text-sm leading-tight block">{{ booking.location?.pickup_location || 'N/A' }}</span>
             <span class="text-blue-600 font-bold text-[10px] mt-1 block">{{ booking.start_time }}</span>
          </div>
          
          <div class="relative">
             <div class="absolute -left-[23px] top-1 w-4 h-4 rounded-full bg-red-500 border-4 border-white shadow-sm z-10"></div>
             <span class="text-[10px] text-gray-400 font-bold uppercase block mb-1">Drop-off Location</span>
             <span class="text-gray-900 font-semibold text-sm leading-tight block">{{ booking.location?.drop_location || 'N/A' }}</span>
             <span class="text-red-500 font-bold text-[10px] mt-1 block">{{ booking.drop_time }}</span>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
           <div class="flex items-center gap-2">
              <span class="text-[10px] text-gray-400 font-bold uppercase">Distance</span>
              <span class="text-xs font-bold text-gray-700">{{ booking.distance }} KM</span>
           </div>
           <div class="flex items-center gap-2">
              <span class="text-[10px] text-gray-400 font-bold uppercase">Seats</span>
              <a-tag v-for="seat in booking.seat_nos" color="success">
                {{seat}}
              </a-tag>  
              
           </div>
        </div>
      </div>

      <!-- Bus & Vehicle Details -->
      <div class="bg-blue-600 p-6 rounded-3xl shadow-lg shadow-blue-100 text-white relative overflow-hidden">
        <div class="absolute right-[-20px] bottom-[-20px] opacity-20">
           <LucideIcon name="Bus" :size="120" />
        </div>
        
        <h3 class="text-sm font-bold opacity-80 mb-4 uppercase tracking-wider">Vehicle Details</h3>
        <div class="flex items-center gap-4">
           <div class="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <LucideIcon name="Bus" :size="24" />
           </div>
           <div>
              <div class="text-lg font-black leading-tight">{{ booking.bus_name }}</div>
              <div class="text-xs opacity-70 font-medium">Model: {{ booking.bus_model_no }} | Reg: {{ booking.bus_reg_no }}</div>
           </div>
        </div>
      </div>

      <!-- Passenger Details -->
      <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 class="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
           <LucideIcon name="Users" :size="16" class="text-blue-500" />
           Passenger Details ({{ booking.passengers }})
        </h3>
        
        <div class="space-y-3">
          <div v-for="(p, idx) in booking.passenger_details" :key="idx" class="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
             <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                   {{ p.fullname?.charAt(0) }}
                </div>
                <div class="flex flex-col">
                   <span class="text-xs font-bold text-gray-900">{{ p.fullname }}</span>
                   <span class="text-[10px] text-gray-400 font-medium">{{ p.gender }} {{ p.age ? `| ${p.age} years` : '' }}</span>
                </div>
             </div>
             <a-tag color="blue" class="rounded-lg m-0 border-none px-2 py-0 text-[10px] font-black italic">{{ p.seat }}</a-tag>
          </div>
        </div>
      </div>

      <!-- Payment Summary -->
      <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 class="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
           <LucideIcon name="Receipt" :size="16" class="text-blue-500" />
           Payment Summary
        </h3>
        
        <div class="space-y-3">
          <div class="flex justify-between text-xs">
            <span class="text-gray-500">Sub Total</span>
            <span class="text-gray-900 font-bold">{{ booking.sub_total }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-gray-500">Tax ({{ booking.tax }}%)</span>
            <span class="text-gray-900 font-bold">+{{ booking.tax_amount }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-gray-500">Booking Fee</span>
            <span class="text-gray-900 font-bold">+{{ booking.fee }}</span>
          </div>
          <div v-if="booking.discount > 0" class="flex justify-between text-xs">
            <span class="text-green-500">Discount</span>
            <span class="text-green-600 font-bold">-{{ booking.discount }}</span>
          </div>
          <div class="pt-3 border-t border-gray-100 mt-2 flex justify-between items-center">
             <div class="flex flex-col">
                <span class="text-[10px] text-gray-400 font-bold uppercase">Paid via {{ booking.method }}</span>
                <span class="text-xs font-medium text-gray-400">Order ID: {{ booking.orderId }}</span>
             </div>
             <span class="text-xl font-black text-gray-900">{{ booking.amount }}</span>
          </div>
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<script setup>
import { computed } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { formatDate } from '@/utils/date'

const props = defineProps({
  visible: Boolean,
  booking: Object
})

const emit = defineEmits(['update:visible', 'close'])

const onClose = () => {
  emit('update:visible', false)
  emit('close')
}

const getStatusColor = (status) => {
  const colors = {
    completed: 'success',
    pending: 'warning',
    expired: 'error',
    cancelled: 'error',
    refunded: 'default',
  }
  return colors[status?.toLowerCase()] || 'processing'
}
</script>

<style scoped>
@reference "tailwindcss";

.booking-detail-drawer :deep(.ant-drawer-content-wrapper) {
  border-radius: 40px 0 0 40px;
  overflow: hidden;
}

.booking-detail-drawer :deep(.ant-drawer-header) {
  @apply border-none bg-white pt-8 px-8;
}

.booking-detail-drawer :deep(.ant-drawer-title) {
  @apply text-xl font-black text-gray-900;
}

.booking-detail-drawer :deep(.ant-drawer-close) {
  @apply mt-2;
}
</style>
