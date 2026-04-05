<template>
  <div class="bus-layout-form">
    <a-row :gutter="24">
      <!-- Form Section -->
      <a-col :xs="24" :lg="12">
        <a-card title="Layout Details" :bordered="false" class="h-full shadow-sm" :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'">
          <a-form :model="formState" layout="vertical" ref="formRef" :rules="rules">
            <a-form-item label="Name" name="name">
              <a-input v-model:value="formState.name" placeholder="e.g. 2x2 Seater" :disabled="disabled" />
            </a-form-item>

            <a-form-item label="Layout" name="layout">
              <a-select v-model:value="formState.layout" placeholder="Select a layout" @change="generateLayout" :disabled="disabled">
                <a-select-option value="layout-1">1 X 1</a-select-option>
                <a-select-option value="layout-2">1 X 2</a-select-option>
                <a-select-option value="layout-3">2 X 1</a-select-option>
                <a-select-option value="layout-4">2 X 2</a-select-option>
                <a-select-option value="layout-5">2 X 3</a-select-option>
                <a-select-option value="layout-6">3 X 2</a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item label="Max Seats" name="max_seats">
              <a-input-number 
                v-model:value="formState.max_seats" 
                :min="0" 
                style="width: 100%" 
                @change="generateLayout" 
                placeholder="Enter max seats"
                :disabled="disabled"
              />
            </a-form-item>

            <a-form-item label="Seat Numbers" name="seat_numbers">
              <a-textarea 
                v-model:value="formState.seat_numbers" 
                :rows="4" 
                placeholder="Auto-generated seat numbers" 
                class="font-mono text-emerald-600 font-bold"
                :disabled="disabled"
              />
              <small class="text-gray-400">Use comma to separate the input</small>
            </a-form-item>

            <a-form-item label="Status" name="status">
              <a-switch v-model:checked="formState.status" :disabled="disabled" />
              <span class="ml-2">{{ formState.status ? 'Active' : 'Inactive' }}</span>
            </a-form-item>

          </a-form>
        </a-card>
      </a-col>

      <!-- Preview Section -->
      <a-col :xs="24" :lg="12">
        <a-card title="Visual Preview" :bordered="false" class="h-full shadow-sm" :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50'">
             <div class="mb-4 flex flex-wrap gap-4 justify-center text-sm">
            <div class="text-center w-full mb-2 text-gray-400">
              <LucideIcon name="Info" :size="14" class="inline mr-1" />
              Click on a seat to toggle male/female status
            </div>
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 bg-cover" :style="{ backgroundImage: 'url(' + seatImg + ')' }"></div>
              <span>Normal Seat</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 bg-cover" :style="{ backgroundImage: 'url(' + pinkSeatImg + ')' }"></div>
              <span>Ladies Seat</span>
            </div>
          </div>
          
          <div class="bus-container relative mx-auto p-6 max-w-[300px] border-4 rounded-[40px] shadow-inner transition-colors duration-300"
               :class="themeStore.isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'">
            <!-- Steering Wheel -->
            <div class="flex justify-end mb-8 pr-4">
              <img src="@/assets/seats/steering.png" alt="Steering" class="w-10 h-10 opacity-70" />
            </div>

            <!-- Seats Grid -->
            <div class="flex justify-center gap-4 min-h-[400px]">
              <!-- Left Side -->
              <div class="flex gap-2">
                <div v-for="(col, index) in leftCols" :key="'left-'+index" class="flex flex-col gap-2">
                  <div v-for="seat in col" :key="seat.bus" class="relative group cursor-pointer" @click="toggleSeatStatus(seat)">
                    <div 
                      class="seat-icon transition-transform hover:scale-110 active:scale-95" 
                      :style="{ backgroundImage: 'url(' + (seat.type === 'sleeper-pink' ? pinkSeatImg : seatImg) + ')' }"
                      :title="'Click to toggle: ' + seat.seat_no"
                    ></div>
                    <span class="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-200 pointer-events-none mt-2">
                      {{ seat.seat_no }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Aisle -->
              <div class="w-4 border-l border-r border-dashed border-gray-200 dark:border-gray-700 mx-2"></div>

              <!-- Right Side -->
              <div class="flex gap-2">
                <div v-for="(col, index) in rightCols" :key="'right-'+index" class="flex flex-col gap-2">
                  <div v-for="seat in col" :key="seat.bus" class="relative group cursor-pointer" @click="toggleSeatStatus(seat)">
                    <div 
                      class="seat-icon transition-transform hover:scale-110 active:scale-95" 
                      :style="{ backgroundImage: 'url(' + (seat.type === 'sleeper-pink' ? pinkSeatImg : seatImg) + ')' }"
                      :title="'Click to toggle: ' + seat.seat_no"
                    ></div>
                    <span class="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-200 pointer-events-none mt-2">
                      {{ seat.seat_no }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Back Row indicator? (Not implemented in old code specifically but usually there) -->
          </div>
          
       
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue';
import { useThemeStore } from '@/stores/theme';
import LucideIcon from '@/components/LucideIcon.vue';
import seatImg from '@/assets/seats/seat.png';
import pinkSeatImg from '@/assets/seats/pink.png';

const themeStore = useThemeStore();
console.log('BusLayoutForm Setup Loaded, isDark:', themeStore.isDark);

const props = defineProps({
  record: {
    type: Object,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit']);

const formRef = ref(null);

const formState = reactive({
  name: '',
  layout: null,
  max_seats: 0,
  seat_numbers: '',
  status: true,
  combine_seats: [] // Array of columns [ [seats], [seats], ... ]
});

const rules = {
  name: [{ required: true, message: 'Please enter layout name' }],
  layout: [{ required: true, message: 'Please select a layout' }],
  max_seats: [{ required: true, message: 'Please enter max seats' }]
};

// Layout division configuration
const layoutDivideMap = {
  'layout-1': 2,
  'layout-2': 3,
  'layout-3': 3,
  'layout-4': 4,
  'layout-5': 5,
  'layout-6': 5
};

const layoutVarMap = {
  'layout-1': ['left_1', 'right_2'],
  'layout-2': ['left_1', 'right_1', 'right_2'],
  'layout-3': ['left_1', 'left_2', 'right_2'],
  'layout-4': ['left_1', 'left_2', 'right_1', 'right_2'],
  'layout-5': ['left_1', 'left_2', 'right_1', 'right_2', 'right_3'],
  'layout-6': ['left_1', 'left_2', 'left_3', 'right_1', 'right_2']
};

const seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

const leftCols = computed(() => {
  try {
    if (!formState.layout || !layoutVarMap[formState.layout]) return [];
    const cols = layoutVarMap[formState.layout];
    return cols
      .filter(c => c && c.startsWith('left'))
      .map(c => {
        const idx = ['left_1', 'left_2', 'left_3', 'right_1', 'right_2', 'right_3'].indexOf(c);
        return (formState.combine_seats && formState.combine_seats[idx]) || [];
      });
  } catch (err) {
    console.error('Error in leftCols computed:', err);
    return [];
  }
});

const rightCols = computed(() => {
  try {
    if (!formState.layout || !layoutVarMap[formState.layout]) return [];
    const cols = layoutVarMap[formState.layout];
    return cols
      .filter(c => c && c.startsWith('right'))
      .map(c => {
        const idx = ['left_1', 'left_2', 'left_3', 'right_1', 'right_2', 'right_3'].indexOf(c);
        return (formState.combine_seats && formState.combine_seats[idx]) || [];
      });
  } catch (err) {
    console.error('Error in rightCols computed:', err);
    return [];
  }
});

const generateLayout = () => {
  try {
    if (!formState.layout || !formState.max_seats) {
      formState.combine_seats = [[], [], [], [], [], []];
      formState.seat_numbers = '';
      return;
    }

    const layoutType = formState.layout;
    const layoutCount = layoutDivideMap[layoutType];
    if (!layoutCount) return;

    const maxSeats = parseInt(formState.max_seats);
    if (isNaN(maxSeats)) return;
    
    const eachRow = Math.floor(maxSeats / layoutCount);
    const diffCount = maxSeats - (eachRow * layoutCount);
    
    const colsToFill = layoutVarMap[layoutType];
    if (!colsToFill) return;

    const seatDetails = {
      left_1: [], left_2: [], left_3: [],
      right_1: [], right_2: [], right_3: []
    };

    const allSeats = [];
    let seatCounter = 0;
    
    colsToFill.forEach((colKey, i) => {
      let seatCount = eachRow;
      // Add extra seats to the last column of the configuration
      if (i === colsToFill.length - 1) {
        seatCount = eachRow + diffCount;
      }

      for (let j = 0; j < seatCount; j++) {
        const seatNum = j + 1;
        const seatId = seatCounter++;
        const seatNo = (seatLetters[i] || 'X') + seatNum;
        
        let isLadies = false;
        const typeNum = parseInt(layoutType.split('-')[1]);
        
        // Ladies seat logic from old project
        if (typeNum === 5 || typeNum === 6) {
          isLadies = ['A1', 'B1', 'A2', 'B2', 'C1', 'D1', 'C2', 'D2', 'E1', 'E2'].includes(seatNo);
        } else if (typeNum === 4) {
          isLadies = ['A1', 'B1', 'A2', 'B2', 'C1', 'D1', 'C2', 'D2'].includes(seatNo);
        } else if (typeNum === 3) {
          isLadies = ['A1', 'B1', 'A2', 'B2', 'C1', 'C2'].includes(seatNo);
        } else if (typeNum === 2) {
          isLadies = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(seatNo);
        }

        const seatObj = {
          bus: seatId,
          type: isLadies ? 'sleeper-pink' : 'sleeper',
          seat_no: seatNo,
          is_ladies: isLadies
        };
        
        if (seatDetails[colKey]) {
          seatDetails[colKey].push(seatObj);
          allSeats.push(seatNo);
        }
      }
    });

    formState.combine_seats = [
      seatDetails.left_1,
      seatDetails.left_2,
      seatDetails.left_3,
      seatDetails.right_1,
      seatDetails.right_2,
      seatDetails.right_3
    ];

    formState.seat_numbers = allSeats.join(' , ');
  } catch (err) {
    console.error('Error in generateLayout:', err);
  }
};

// Initial data population
watch(() => props.record, (newRecord) => {
  console.log('BusLayoutForm Watch triggered - NewRecord:', newRecord);
  if (newRecord) {
    // Handle cases where the record might be wrapped in an object with index keys (like the user provided)
    const activeData = newRecord['0'] || newRecord;
    
    // Handle cases where combine_seats might be a JSON string from the backend
    let dbCombineSeats = activeData.combine_seats;
    if (typeof dbCombineSeats === 'string') {
      try {
        dbCombineSeats = JSON.parse(dbCombineSeats);
      } catch (e) {
        dbCombineSeats = null;
      }
    }

    // Legacy layout normalization (e.g., "2 X 2" -> "layout-4")
    let layoutVal = activeData.layout;
    const legacyLayoutMap = {
      '1 X 1': 'layout-1',
      '1 X 2': 'layout-2',
      '2 X 1': 'layout-3',
      '2 X 2': 'layout-4',
      '2 X 3': 'layout-5',
      '3 X 2': 'layout-6'
    };
    if (legacyLayoutMap[layoutVal]) {
      console.log(`Normalizing layout: "${layoutVal}" to "${legacyLayoutMap[layoutVal]}"`);
      layoutVal = legacyLayoutMap[layoutVal];
    }

    Object.assign(formState, {
      name: activeData.name,
      layout: layoutVal,
      max_seats: Number(activeData.max_seats) || 0,
      seat_numbers: activeData.seat_numbers || '',
      status: activeData.status === true || activeData.status === 'true' || activeData.status === 1,
      combine_seats: Array.isArray(dbCombineSeats) ? dbCombineSeats : [[], [], [], [], [], []]
    });
    
    // Always regenerate to ensure layout is sync with the current visual logic
    generateLayout();
  } else {
    Object.assign(formState, {
      name: '',
      layout: null,
      max_seats: 0,
      seat_numbers: '',
      status: true,
      combine_seats: [[], [], [], [], [], []]
    });
  }
}, { immediate: true });

// Reactive watch for manual layout changes
watch([() => formState.layout, () => formState.max_seats], () => {
  generateLayout();
});

const toggleSeatStatus = (seat) => {
  if (props.disabled) return;
  seat.is_ladies = !seat.is_ladies;
  seat.type = seat.is_ladies ? 'sleeper-pink' : 'sleeper';
  console.log(`Toggled seat ${seat.seat_no}: is_ladies = ${seat.is_ladies}`);
};

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    // Ensure seat_numbers are synced before submitting
    emit('submit', { ...formState });
  } catch (error) {
    console.error('Validation failed:', error);
  }
};


defineExpose({
  resetFields: () => formRef.value?.resetFields(),
  submit: handleSubmit
});
</script>

<style scoped>
.seat-icon {
  width: 50px;
  height: 50px;
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
  margin-top: 5px;
}

.sleeper {
  background-image: url('@/assets/seats/seat.png');
}

.sleeper-pink {
  background-image: url('@/assets/seats/pink.png');
}

.bus-container {
  min-width: 260px;
}

/* Custom scrollbar for preview if needed */
.bus-layout-preview {
  overflow-y: auto;
  max-height: 500px;
}
</style>
