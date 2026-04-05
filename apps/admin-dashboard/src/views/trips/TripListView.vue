<template>
  <div class="trip-list">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Trip Scheduling</h2>
        <p class="text-gray-500 text-sm">Manage bus assignments, routes, and schedules.</p>
      </div>
      <a-button type="primary" size="large" @click="handleCreate">
        <template #icon><calendar-plus :size="18" class="mr-2" /></template>
        New Trip
      </a-button>
    </div>

    <a-card :bordered="false" class="shadow-sm">
      <div class="mb-4 flex gap-4">
        <a-input-search
          v-model:value="searchText"
          placeholder="Search route or bus..."
          style="width: 300px"
          @search="handleSearch"
        />
        <a-range-picker v-model:value="dateRange" />
      </div>

      <a-table
        :columns="columns"
        :data-source="trips"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'routeName'">
            <div class="flex flex-col">
              <span class="font-semibold text-gray-800">{{ record.routeName }}</span>
              <span class="text-xs text-gray-400">{{ record.startToEnd }}</span>
            </div>
          </template>

          <template v-if="column.key === 'schedule'">
            <div class="flex items-center gap-2">
              <a-tag color="blue">{{ record.departureTime }}</a-tag>
              <arrow-right :size="12" class="text-gray-300" />
              <a-tag color="cyan">{{ record.arrivalTime }}</a-tag>
            </div>
          </template>

          <template v-if="column.key === 'status'">
            <a-badge :status="record.status ? 'success' : 'default'" :text="record.status ? 'Scheduled' : 'Draft'" />
          </template>

          <template v-if="column.key === 'action'">
            <div class="flex gap-2">
              <a-tooltip title="Edit Schedule">
                <a-button type="text" @click="handleEdit(record)">
                  <template #icon><pencil :size="16" class="text-blue-500" /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="Cancel Trip">
                <a-button type="text" @click="handleCancel(record)">
                  <template #icon><x-circle :size="16" class="text-red-500" /></template>
                </a-button>
              </a-tooltip>
            </div>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { CalendarPlus, ArrowRight, Pencil, XCircle } from 'lucide-vue-next';
import { busScheduleService } from '@/services/busschedule.service';
import { message, Modal } from 'ant-design-vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const loading = ref(false);
const searchText = ref('');
const dateRange = ref([]);
const trips = ref([]);

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const columns = [
  { title: 'Route / Path', key: 'routeName', width: '30%' },
  { title: 'Bus Name', dataIndex: 'busName', key: 'busName' },
  { title: 'Departure -> Arrival', key: 'schedule' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Actions', key: 'action', align: 'right' },
];

const fetchTrips = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.current,
      limit: pagination.pageSize,
      search: searchText.value,
    };
    const response = await busScheduleService.getAll(params);
    if (response.success) {
      trips.value = busScheduleService.transform(response.data.items);
      pagination.total = response.data.total;
    }
  } catch (error) {
    console.error(error);
    // Mock for demo
    trips.value = [
      { key: '1', routeName: 'Airport Link', busName: 'Bus-A102', departureTime: '08:00', arrivalTime: '09:30', startToEnd: 'Terminal 1 -> Downtown', status: true },
      { key: '2', routeName: 'City Express', busName: 'Bus-B205', departureTime: '10:00', arrivalTime: '11:15', startToEnd: 'North Station -> South Gate', status: true },
    ];
  } finally {
    loading.value = false;
  }
};

const handleCreate = () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Creating a new trip is disabled in Demo Mode.',
    });
    return;
  }
  // Original logic (placeholder if not dynamic)
  message.info('Create trip functionality would open here.');
};

const handleEdit = (record) => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Editing trip schedules is disabled in Demo Mode.',
    });
    return;
  }
  message.info(`Editing trip: ${record.routeName}`);
};

const handleCancel = (record) => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Cancelling trips is disabled in Demo Mode.',
    });
    return;
  }
  Modal.confirm({
    title: 'Are you sure you want to cancel this trip?',
    content: 'This action will notify all booked passengers.',
    okText: 'Yes, Cancel',
    okType: 'danger',
    cancelText: 'No',
    onOk() {
       message.success('Trip cancelled successfully');
    }
  });
};

const handleTableChange = (pag) => {
  pagination.current = pag.current;
  fetchTrips();
};

const handleSearch = () => {
  pagination.current = 1;
  fetchTrips();
};

onMounted(() => {
  fetchTrips();
});
</script>
