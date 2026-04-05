<template>
  <div class="card-premium h-full p-8 border-0 shadow-premium-lg">
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
        <Bell :size="22" class="text-primary" />
        Support Ticker
      </h3>
      <span v-if="newCount > 0" class="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-lg">
        {{ newCount }} NEW
      </span>
    </div>
    
    <div v-if="loading" class="space-y-4">
      <a-skeleton active :paragraph="{ rows: 1 }" v-for="i in 4" :key="i" />
    </div>
    
    <div v-else-if="activities.length > 0" class="space-y-4">
      <div 
        v-for="(item, index) in activities" 
        :key="index" 
        class="flex gap-4 p-3 rounded-[20px] transition-all hover:bg-gray-50/80 dark:hover:bg-gray-800/30 group cursor-pointer"
        @click="handleActivityClick(item)"
      >
        <div 
          class="w-12 h-12 rounded-[14px] shrink-0 flex items-center justify-center transition-all group-hover:shadow-lg group-hover:-translate-y-1"
          :style="{ backgroundColor: item.color + '15', color: item.color }"
        >
          <component :is="item.icon" :size="22" />
        </div>
        <div class="flex-1 min-w-0 flex flex-col justify-center">
          <p class="text-sm font-bold text-gray-800 dark:text-gray-200 truncate leading-tight">
            {{ item.title }}
          </p>
          <p class="text-[11px] text-gray-400 font-medium mt-1 uppercase tracking-tighter">{{ item.time }}</p>
        </div>
        <div class="self-center">
          <ChevronRight :size="16" class="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
    
    <div v-else class="text-center py-8">
      <Bell :size="48" class="mx-auto text-gray-300 mb-3" />
      <p class="text-sm text-gray-400 font-medium">No recent activities</p>
    </div>
    
    <a-button 
      block 
      class="mt-8 h-12 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 text-gray-400 font-bold hover:border-primary hover:text-primary transition-all"
      @click="$router.push({ name: 'help-support' })"
    >
      View All Support Tickets
    </a-button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Bell, 
  ChevronRight, 
  UserPlus, 
  Ticket, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  MessageSquare
} from 'lucide-vue-next';
import { helpAndSupportService } from '@/services/helpandsupport.service';
import { customerService } from '@/services/customer.service';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const router = useRouter();
const loading = ref(false);
const activities = ref([]);
const newCount = ref(0);

const activityTypeConfig = {
  'new_customer': { icon: UserPlus, color: '#10b981', route: 'customer-lists' },
  'pending_ticket': { icon: MessageSquare, color: '#f59e0b', route: 'help-support' },
  'resolved_ticket': { icon: CheckCircle, color: '#52c41a', route: 'help-support' },
  'high_priority': { icon: AlertCircle, color: '#ef4444', route: 'help-support' },
  'revenue_milestone': { icon: TrendingUp, color: '#8b5cf6', route: 'payments' },
  'new_booking': { icon: Ticket, color: '#3b82f6', route: 'bookings' }
};

const fetchRecentActivities = async () => {
  loading.value = true;
  try {
    const activityList = [];
    
    // Fetch recent customers (last 5)
    try {
      const customerResponse = await customerService.getAll({ 
        page: 1, 
        limit: 3, 
        sortBy: 'createdAt', 
        sortDesc: true 
      });
      const customers = customerResponse.items || customerResponse.data?.items || [];
      
      customers.forEach(customer => {
        activityList.push({
          type: 'new_customer',
          title: `New customer: ${customer.firstname} ${customer.lastname}`,
          time: dayjs(customer.createdAt).fromNow(),
          timestamp: new Date(customer.createdAt),
          icon: UserPlus,
          color: '#10b981',
          route: 'customer-lists'
        });
      });
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
    
    // Fetch pending support tickets
    try {
      const ticketResponse = await helpAndSupportService.getAll({ 
        page: 1, 
        limit: 3, 
        status: 'Pending',
        sortBy: 'createdAt',
        sortDesc: 'desc'
      });
      const tickets = ticketResponse.items || ticketResponse.data?.items || [];
      
      tickets.forEach(ticket => {
        activityList.push({
          type: 'pending_ticket',
          title: `Support ticket: ${ticket.subject || ticket.ticket_no}`,
          time: dayjs(ticket.createdAt).fromNow(),
          timestamp: new Date(ticket.createdAt),
          icon: MessageSquare,
          color: '#f59e0b',
          route: 'help-support'
        });
      });
    } catch (error) {
      console.error('Failed to fetch support tickets:', error);
    }
    
    // Sort by timestamp (most recent first) and take top 5
    activityList.sort((a, b) => b.timestamp - a.timestamp);
    activities.value = activityList.slice(0, 5);
    
    // Count activities from last hour as "new"
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    newCount.value = activityList.filter(a => a.timestamp > oneHourAgo).length;
    
  } catch (error) {
    console.error('Failed to fetch activities:', error);
  } finally {
    loading.value = false;
  }
};

const handleActivityClick = (activity) => {
  if (activity.route) {
    router.push({ name: activity.route });
  }
};

onMounted(() => {
  fetchRecentActivities();
});
</script>
