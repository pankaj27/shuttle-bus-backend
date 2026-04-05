<template>
  <div class="dashboard-home animate-fade-in">
    <!-- Welcome Header -->
    <DashboardHeader :role="'Admin'" :appName="appName" />

    <!-- Stat Cards -->
    <StatCards />

    <!-- Charts & Feed -->
    <a-row :gutter="[24, 24]" class="mt-8">
      <a-col :span="24" :lg="16">
        <RidershipChart />
      </a-col>

      <a-col :span="24" :lg="8">
        <SupportTicker />
      </a-col>
    </a-row>

    <!-- Route Performance HUD -->
    <RoutePerformanceHUD />
  </div>
</template>

<script setup>
// Components
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue';
import StatCards from '@/components/dashboard/StatCards.vue';
import RidershipChart from '@/components/dashboard/RidershipChart.vue';
import SupportTicker from '@/components/dashboard/SupportTicker.vue';
import LiveFleetStatus from '@/components/dashboard/LiveFleetStatus.vue';
import FleetMonitorLite from '@/components/dashboard/FleetMonitorLite.vue';
import DispatcherTimeline from '@/components/dashboard/DispatcherTimeline.vue';
import RoutePerformanceHUD from '@/components/dashboard/RoutePerformanceHUD.vue';
import DepartureBoard from '@/components/dashboard/DepartureBoard.vue';
import FleetOpsCenter from '@/components/dashboard/FleetOpsCenter.vue';
const appName = import.meta.env.VITE_APP_NAME || 'Jadliride';

const columns = [
  { title: 'TRIP ID', dataIndex: 'id', key: 'id' },
  { title: 'ROUTE', dataIndex: 'route', key: 'route' },
  { title: 'DRIVER', dataIndex: 'driver', key: 'driver' },
  { title: 'STATUS', key: 'status', dataIndex: 'status' },
  { title: 'LOAD', dataIndex: 'load', key: 'load' },
  { title: 'MAP', key: 'action' },
];

const trips = [
  { id: 'TRP-1001', route: 'Downtown -> Airport', driver: 'Adam Smith', status: 'Ongoing', load: '85%' },
  { id: 'TRP-1002', route: 'Campus Express', driver: 'Sarah Connor', status: 'Delayed', load: '100%' },
  { id: 'TRP-1003', route: 'Westside Shuttle', driver: 'Mike Ross', status: 'Ongoing', load: '40%' },
  { id: 'TRP-1004', route: 'East End Direct', driver: 'Jessica Pearson', status: 'Ongoing', load: '65%' },
];
</script>

<style scoped>
@reference "tailwindcss";

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

:deep(.premium-table .ant-table) {
  background: transparent !important;
}

:deep(.premium-table .ant-table-thead > tr > th) {
  background: transparent !important;
  @apply text-[10px] font-bold tracking-wider text-gray-400 uppercase border-b border-gray-50;
}

.dark :deep(.premium-table .ant-table-thead > tr > th) {
  @apply border-gray-800;
}

:deep(.premium-table .ant-table-tbody > tr > td) {
  @apply py-4 border-b border-gray-50;
}

.dark :deep(.premium-table .ant-table-tbody > tr > td) {
  @apply border-gray-800;
}

:deep(.premium-table .ant-table-tbody > tr:hover > td) {
  @apply bg-gray-50/50 dark:bg-gray-800/30;
}
</style>
