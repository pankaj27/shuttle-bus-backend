<template>
  <a-row :gutter="[24, 24]">
    <!-- Loading Skeletons -->
    <template v-if="loading">
      <a-col :xs="24" :sm="12" :lg="6" v-for="i in 4" :key="`skeleton-${i}`">
        <div class="card-premium p-6 relative overflow-hidden border-0 shadow-premium-lg">
          <div class="flex items-start justify-between relative z-10">
            <div class="space-y-3 w-full">
              <a-skeleton-button active :size="'large'" class="w-12! h-12! rounded-2xl!" />
              <a-skeleton-input active :size="'small'" class="w-24!" />
              <a-skeleton-input active :size="'large'" class="w-20!" />
              <div class="flex items-center gap-2 pt-1">
                <a-skeleton-button active :size="'small'" class="w-16! h-6! rounded-lg!" />
                <a-skeleton-input active :size="'small'" class="w-20!" />
              </div>
            </div>
          </div>
        </div>
      </a-col>
    </template>

    <!-- Actual Cards -->
    <template v-else>
      <a-col :xs="24" :sm="12" :lg="6" v-for="(stat, index) in stats" :key="stat.title || index">
        <div class="card-premium p-6 relative overflow-hidden group cursor-pointer border-0 shadow-premium-lg">
          <div 
            class="absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-[0.03] transition-transform group-hover:scale-150 duration-700 bg-current"
            :style="{ color: stat.color }"
          ></div>
          <div class="flex items-start justify-between relative z-10">
            <div class="space-y-3">
              <div 
                class="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 mb-4 shadow-sm"
                :style="{ backgroundColor: stat.bgColor, color: stat.color }"
              >
                <component :is="stat.icon" :size="24" />
              </div>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">{{ stat.title }}</p>
              <h3 class="text-3xl font-black text-gray-900 dark:text-white mt-1.5">{{ stat.value }}</h3>
              <div class="flex items-center gap-2 pt-1">
                 <div 
                  class="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold"
                  :style="{ backgroundColor: stat.trendColor + '15', color: stat.trendColor }"
                >
                  <component :is="stat.trendIcon" :size="12" />
                  {{ stat.trend }}
                </div>
                <span class="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">vs last month</span>
              </div>
            </div>
          </div>
        </div>
      </a-col>
    </template>
  </a-row>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { 
  UserRound, 
  Bus, 
  Banknote, 
  Users, 
  TrendingUp,
  TrendingDown
} from 'lucide-vue-next';
import { dashboardService } from '@/services/dashboard.service';
import { message } from 'ant-design-vue';

const loading = ref(true);
const stats = ref([]);

// Map icon string names to actual components
const iconComponentMap = {
  'UserRound': UserRound,
  'Bus': Bus,
  'Banknote': Banknote,
  'Users': Users,
  'TrendingUp': TrendingUp,
  'TrendingDown': TrendingDown
};

// Map icon names to colors
const iconColorMap = {
  'UserRound': { color: '#f0a50b', bgColor: '#fdf4e7' },
  'Bus': { color: '#3b82f6', bgColor: '#eff6ff' },
  'Banknote': { color: '#10b981', bgColor: '#ecfdf5' },
  'Users': { color: '#8b5cf6', bgColor: '#f5f3ff' }
};

const fetchStats = async () => {
  loading.value = true;
  try {
    const response = await dashboardService.getStats();
    const data = response.data || response;
    
    // Check if data is an array (new API format)
    if (Array.isArray(data)) {
      stats.value = data.map(stat => {
        // Get icon component from string name
        const iconComponent = iconComponentMap[stat.icon] || Users;
        const trendIconComponent = iconComponentMap[stat.trendIcon] || TrendingUp;
        const colors = iconColorMap[stat.icon] || { color: '#6b7280', bgColor: '#f3f4f6' };
        
        return {
          title: stat.title,
          value: stat.value,
          icon: iconComponent,
          ...colors,
          trend: stat.trend,
          trendIcon: trendIconComponent,
          trendColor: stat.trendColor || '#10b981'
        };
      });
    } else {
      // Fallback for object format (old API)
      stats.value = Object.keys(data).map(key => {
        const statData = data[key];
        const iconComponent = iconComponentMap[statData.icon] || Users;
        const colors = iconColorMap[statData.icon] || { color: '#6b7280', bgColor: '#f3f4f6' };
        
        const trendValue = statData.trend || statData.change || 0;
        const isPositive = trendValue >= 0;
        
        return {
          title: statData.title || key.charAt(0).toUpperCase() + key.slice(1),
          value: statData.value || statData.total || '0',
          icon: iconComponent,
          ...colors,
          trend: `${Math.abs(trendValue)}%`,
          trendIcon: isPositive ? TrendingUp : TrendingDown,
          trendColor: isPositive ? '#10b981' : '#ef4444'
        };
      });
    }
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    message.error('Failed to load dashboard statistics');
    stats.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStats();
});
</script>
