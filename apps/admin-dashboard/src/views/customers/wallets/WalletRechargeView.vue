
<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { customerService } from '@/services/customer.service'
import  { useAuthStore } from '@/stores/auth'
const route = useRoute()
const router = useRouter()

const submitting = ref(false)
const fetchingCustomers = ref(false)
const customerList = ref([])
const selectedCustomer = ref(null)


const authStore = useAuthStore()
const default_currency = computed(() => authStore.generalSettings?.default_currency || '$')

const formState = reactive({
  user_id: undefined,
  amount: 0,
  type: '0', // 0 =credit or  1 =debit
  reason: 'Manual Adjustment',
  note: ''
})

onMounted(async () => {
  const userId = route.query.user_id
  if (userId) {
    await fetchSingleCustomer(userId)
  }
})

const fetchSingleCustomer = async (id) => {
  try {
    const response = await customerService.getById(id)
    const data = response.data || response
    if (data) {
       selectedCustomer.value = data
       formState.user_id = data.id 
       // Ensure it's in the list for selection
       customerList.value = [data]
    }
  } catch (error) {
    message.error('Failed to load customer details')
  }
}

let searchTimeout = null
const handleCustomerSearch = (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!val) return

  fetchingCustomers.value = true
  searchTimeout = setTimeout(async () => {
    try {
      const response = await customerService.getSearch(val)
      customerList.value = response.items || response.data?.items || []
    } catch (error) {
      console.error(error)
    } finally {
      fetchingCustomers.value = false
    }
  }, 300)
}

const onCustomerChange = (val) => {
  selectedCustomer.value = customerList.value.find(c => c.id === val)
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    const response = await customerService.rechargeWallet({
        userId: formState.user_id,
        amount: formState.amount,
        type: formState.type,
        reason: formState.reason,
        note: formState.note
    })
    
    message.success('Wallet transaction successful')
    router.push({ name: 'transaction-histories', query: { id: formState.user_id } })
  } catch (error) {
    message.error(error.response?.data?.message || 'Transaction failed')
  } finally {
    submitting.value = false
  }
}

const formatNumber = (val) => {
  return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>


<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8">
      <a-button
        @click="$router.back()"
        type="text"
        class="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <template #icon><LucideIcon name="ArrowLeft" :size="20" /></template>
      </a-button>
      <div>
        <h2 class="text-2xl font-bold text-gray-900 m-0">Wallet Recharge</h2>
        <p class="text-gray-500 m-0 text-sm">Add or deduct credits from customer wallet</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Selection & Info -->
      <div class="lg:col-span-1 space-y-6">
        <a-card title="Select Customer" :bordered="false" class="shadow-sm rounded-3xl overflow-hidden">
          <div class="space-y-4">
            <a-form-item label="Customer" class="mb-0">
              <a-select
                v-model:value="formState.user_id"
                show-search
                placeholder="Search by name or phone"
                :filter-option="false"
                :not-found-content="fetchingCustomers ? undefined : null"
                class="w-full"
                size="large"
                allowClear
                @search="handleCustomerSearch"
                @change="onCustomerChange"
              >
                <template v-if="fetchingCustomers" #notFoundContent>
                  <a-spin size="small" />
                </template>
                <a-select-option v-for="c in customerList" :key="c.id" :value="c.id">
                  {{ c.firstname }} {{ c.lastname }} ({{ c.phone }})
                </a-select-option>
              </a-select>
            </a-form-item>

            <div v-if="selectedCustomer" class="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 mt-4">
              <div class="flex items-center gap-3 mb-3">
                <a-avatar :src="selectedCustomer.picture" :size="48" class="border-2 border-white shadow-sm">
                   <template #icon><LucideIcon name="User" :size="20" /></template>
                </a-avatar>
                <div>
                  <h4 class="font-bold text-gray-900 m-0">{{ selectedCustomer.firstname }} {{ selectedCustomer.lastname }}</h4>
                  <p class="text-xs text-blue-600 font-medium m-0">+{{ selectedCustomer.country_code }} {{ selectedCustomer.phone }}</p>
                </div>
              </div>
              <div class="flex justify-between items-center py-2 border-t border-blue-100">
                <span class="text-xs text-gray-500 uppercase tracking-wider">Current Balance</span>
                <span class="text-lg font-bold text-blue-700"> {{ selectedCustomer.wallet_balance }}</span>
              </div>
            </div>
          </div>
        </a-card>
      </div>

      <!-- Right: Recharge Form -->
      <div class="lg:col-span-2">
        <a-card title="Transaction Details" :bordered="false" class="shadow-sm rounded-3xl">
          <a-form :model="formState" layout="vertical" @finish="handleSubmit">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <a-form-item label="Transaction Type" name="type" required>
                <a-radio-group v-model:value="formState.type" button-style="solid" class="w-full flex">
                  <a-radio-button value="0" class="flex-1 text-center">
                     <div class="flex items-center justify-center gap-2">
                        <LucideIcon name="PlusCircle" :size="16" class="text-green-500" />
                        Credit (Add)
                     </div>
                  </a-radio-button>
                  <a-radio-button value="1" class="flex-1 text-center">
                     <div class="flex items-center justify-center gap-2">
                        <LucideIcon name="MinusCircle" :size="16" class="text-red-500" />
                        Debit (Deduct)
                     </div>
                  </a-radio-button>
                </a-radio-group>
              </a-form-item>

              <a-form-item label="Amount" name="amount" required>
                <a-input-number
                  v-model:value="formState.amount"
                  placeholder="0.00"
                  class="w-full md:w-80"
                  :min="0.01"
                  :formatter="(value) => `${default_currency} ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                  :parser="(value) => value.replace(new RegExp(`${default_currency.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s?|(,*)`, 'g'), '')"
                />
              </a-form-item>
            </div>

            <a-form-item label="Transaction Reason" name="reason">
               <a-select v-model:value="formState.reason" placeholder="Why this transaction?">
                 <a-select-option  v-if="formState.type === '0'" value="Wallet Recharge">Wallet Recharge</a-select-option>
                 <a-select-option  v-if="formState.type === '0'" value="Promotional Offer / Cashback">Promotional Offer / Cashback</a-select-option>
                 <a-select-option   v-if="formState.type === '0'" value="Cancellation Refund">Cancellation Refund</a-select-option>
                 <a-select-option v-if="formState.type === '0'"  value="Other">Other</a-select-option>
                 
                 <a-select-option  v-if="formState.type === '1'" value="Fine">Fine</a-select-option>
                 <a-select-option  v-if="formState.type === '1'" value="Cancellation Fee">Cancellation Fee</a-select-option>
                 <a-select-option  v-if="formState.type === '1'" value="Manual Adjustment">Manual Adjustment</a-select-option>
                 <a-select-option  v-if="formState.type === '1'" value="Vehicle Damage Penalty">Vehicle Damage Penalty</a-select-option>
                 <a-select-option  v-if="formState.type === '1'" value="Others">Others</a-select-option>
               </a-select>
            </a-form-item>

            <a-form-item label="Note / Reference" name="note">
              <a-textarea 
                v-model:value="formState.note" 
                placeholder="Enter additional details or reference number..." 
                :rows="4"
                class="rounded-2xl"
              />
            </a-form-item>

            <div class="flex justify-end gap-4 mt-6 border-t pt-8">
              <a-button size="large" @click="$router.back()" class="rounded-xl px-8">Cancel</a-button>
              <a-button
                type="primary"
                size="large"
                html-type="submit"
                :loading="submitting"
                :disabled="!formState.user_id || !formState.amount"
                class="rounded-xl px-12 bg-blue-600 shadow-lg shadow-blue-200"
              >
                Execute Transaction
              </a-button>
            </div>
          </a-form>
        </a-card>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>