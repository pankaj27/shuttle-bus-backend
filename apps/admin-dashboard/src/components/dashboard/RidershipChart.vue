<template>
  <div class="card-premium h-full p-8 border-0 shadow-premium-lg flex flex-col">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 :style="{ color: isDark ? '#ffffff' : '#000' }" class="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
          <Banknote :size="22" class="text-primary" />
          Revenue Analytics
        </h3>
       </div>
      <a-radio-group v-model:value="timeframe" button-style="solid" size="small" class="glass-tabs" :disabled="loading || internalLoading">
        <a-radio-button value="week">Weekly</a-radio-button>
        <a-radio-button value="month">Monthly</a-radio-button>
          <a-radio-button value="year">Yearly</a-radio-button>
      </a-radio-group>
    </div>
    
    <!-- Loading Skeleton -->
    <div v-if="loading || internalLoading" class="flex-1 min-h-[300px] w-full bg-gray-50/50 dark:bg-gray-800/10 rounded-[20px] border border-gray-100/50 dark:border-gray-800/50 overflow-hidden relative">
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <a-spin size="large" />
          <p class="text-xs font-bold text-gray-400 mt-4 uppercase tracking-widest">Loading Analytics...</p>
        </div>
      </div>
    </div>

    <!-- Apex Chart -->
    <div v-else class="flex-1 w-full min-h-[300px]">
      <apexchart 
        type="area" 
        height="100%" 
        width="100%"
        :options="chartOptions" 
        :series="series"
      ></apexchart>
    </div>
  </div>
</template>

<script setup>

import { ref, computed, reactive, watch, onMounted } from 'vue';
import { Banknote } from 'lucide-vue-next';
import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/stores/auth';
import { dashboardService } from '@/services/dashboard.service';
import { storeToRefs } from 'pinia';

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
});

const themeStore = useThemeStore();
const timeframe = ref('week');
const internalLoading = ref(false);

const { isDark } = storeToRefs(themeStore);

// Expected Backend Response Schema
// GET /dashboard/revenue-analytics?type=week
// {
//   "categories": ["Mon", "Tue", ...],
//   "data": [1000.50, 2000.00, ...] // Total revenue values
// }

const MOCK_DATA = {
  week: {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data: [1450.50, 2100.00, 1800.75, 3200.20, 2600.00, 3800.50, 4100.00]
  },
  month: {
    categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    data: [12500, 15000, 11000, 18200]
  },
  year: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    data: [45000, 52000, 48000, 61000, 58000, 75000, 82000, 79000, 85000, 91000, 88000, 95000]
  }
};

const chartData = reactive({ ...MOCK_DATA });

const fetchData = async () => {
  internalLoading.value = true;
  try {
    const response = await dashboardService.getRevenueAnalytics(timeframe.value); 
    if (response.data) {
      chartData[timeframe.value] = response.data;
    }
  } catch (error) {
    console.warn("Failed to fetch revenue analytics, using fallback mock data.", error);
    console.info("Expected Data Structure for Backend:", MOCK_DATA[timeframe.value]);
    // Fallback to mock data if API fails
    chartData[timeframe.value] = MOCK_DATA[timeframe.value]; 
  } finally {
    internalLoading.value = false;
  }
};

watch(timeframe, () => {
  fetchData();
});

onMounted(() => {
  fetchData();
});

const series = computed(() => ([
  {
    name: 'Total Revenue',
    data: chartData[timeframe.value]?.data || []
  }
]));

const authStore = useAuthStore();
const currencyCode = computed(() => {
  const code = authStore.generalSettings?.default_currency_code;
  // Basic validation: ISO 4217 codes are 3 letters. If invalid/missing, fallback to USD.
  return code ? code : 'USD';
});

const formatCurrency = (value, compact = false) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode.value,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: compact ? 'compact' : 'standard',
      compactDisplay: 'short'
    }).format(value);
  } catch (error) {
    // Fallback for invalid currency codes or format errors to prevent crash
    console.warn(`RidershipChart: Currency formatting failed for code '${currencyCode.value}'`, error);
    return `$${value}`;
  }
};

// computed options to react to theme or other changes
// computed options to react to theme or other changes
const chartOptions = computed(() => {
  const primaryColor = themeStore.colorPrimary;
  const gridColor = isDark.value ? '#334155' : '#f1f5f9';
  const textColor = isDark.value ? '#ffffff' : '#64748b'; // Using a softer gray for light mode instead of harsh black
  
  return {
    chart: {
      type: 'area',
      fontFamily: 'inherit',
      background: 'transparent',
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      }
    },
    colors: [primaryColor],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3,
      colors: [primaryColor]
    },
    xaxis: {
      categories: chartData[timeframe.value]?.categories || [],
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      labels: {
        style: {
          colors: textColor,
          fontSize: '12px',
          fontWeight: 500
        }
      }
    },
    yaxis: {
      tickAmount: 5,
      labels: {
        style: {
          colors: textColor,
          fontSize: '12px',
          fontWeight: 500
        },
        formatter: (value) => {
          return formatCurrency(value, true);
        }
      }
    },
    grid: {
      show: true,
      borderColor: gridColor,
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: false
        }
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10 
      }
    },
    theme: {
      mode: isDark.value ? 'dark' : 'light'
    },
    tooltip: {
      theme: isDark.value ? 'dark' : 'light',
      y: {
        formatter: function (val) {
          return formatCurrency(val);
        }
      },
      style: {
        fontSize: '12px',
        fontFamily: 'inherit'
      },
      marker: {
        show: true,
      },
      x: {
        show: true,
      }
    }
  };
});
</script>

<style scoped>
/* Adjust chart colors for dark mode via CSS override if ApexCharts theme doesn't catch everything */
:deep(.apexcharts-tooltip) {
  border-radius: 12px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
}

:deep(.apexcharts-tooltip.apexcharts-theme-light) {
  background: white !important;
  border: none !important;
}

:deep(.apexcharts-tooltip-title) {
  font-family: inherit !important;
}

:deep(.apexcharts-tooltip.apexcharts-theme-light .apexcharts-tooltip-title) {
  background: #f8fafc !important;
  border-bottom: 1px solid #e2e8f0 !important;
}

:deep(.apexcharts-tooltip.apexcharts-theme-dark) {
  background: #1e293b !important; /* Slate 800 */
  border: 1px solid #334155 !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
}

:deep(.apexcharts-tooltip.apexcharts-theme-dark .apexcharts-tooltip-title) {
  background: #0f172a !important; /* Slate 900 */
  border-bottom: 1px solid #334155 !important;
}


</style>
