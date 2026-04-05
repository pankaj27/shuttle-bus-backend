<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { paymentGatewayService } from '@/services/paymentGateway.service'
import LucideIcon from '@/components/LucideIcon.vue'
import { message, Modal } from 'ant-design-vue'

// Import brand logos
import razorpayLogo from '@/assets/images/gateways/razorpay.png'
import paystackLogo from '@/assets/images/gateways/paystack.png'
import paymobLogo from '@/assets/images/gateways/paymob.png'
import mercadopagoLogo from '@/assets/images/gateways/mercadopago.png'
import flutterwaveLogo from '@/assets/images/gateways/flutterwave.svg'

const isModalOpen = ref(false)
const submitLoading = ref(false)
const fetching = ref(false)
const currentSite = ref('')

const authStore = useAuthStore()
const { isDemo } = storeToRefs(authStore)
const canEdit = computed(() => authStore.hasPermission('manage.application.settings'))

const gateways = ref([
  {
    name: 'Razorpay',
    title: 'Razorpay',
    icon: 'CreditCard',
    image: razorpayLogo,
    color: '#CCFFFF',
    gradient: 'linear-gradient(135deg, #CCFFFF 0%, #1e70e6 100%)',
    is_enabled: false,
  },
  {
    name: 'Paystack',
    title: 'Paystack',
    icon: 'Wallet',
    image: paystackLogo,
    color: '#99FFFF',
    gradient: 'linear-gradient(135deg, #99FFFF 0%, #f0f0f0 100%)',
    is_enabled: false,
  },
  {
    name: 'Paymob',
    title: 'Paymob',
    icon: 'Banknote',
    image: paymobLogo,
    color: '#3395FF',
    gradient: 'linear-gradient(135deg, #3395FF 0%, #f0f0f0 100%)',
    is_enabled: false,
  },
  {
    name: 'Mercadopago',
    title: 'Mercadopago',
    icon: 'Banknote',
    image: mercadopagoLogo,
    color: '#AAFFFF',
    gradient: 'linear-gradient(135deg, #AAFFFF 0%, #f0f0f0 100%)',
    is_enabled: false,
  },
  {
    name: 'Flutterwave',
    title: 'Flutterwave',
    icon: 'CreditCard',
    image: flutterwaveLogo,
    color: '#FFFFCC',
    gradient: 'linear-gradient(135deg, #FFFFCC 0%, #f0f0f0 100%)',
    is_enabled: false,
  },
])

const formState = reactive({
  is_enabled: false,
  mode: 'sandbox',
  key: '',
  secret: '',
  public_key: '',
  access_token: '',
  hash:'',
  currency: 'INR',
  username: '',
  password: '',
  integration_id: '',
  frame_id: '',
  webhook_url: '',
  webhook_secret: '',
})

const refreshAllStatus = async () => {
  fetching.value = true
  try {
    const response = await paymentGatewayService.fetch()
    if (response && response.data) {
      const remoteGateways = response.data

      gateways.value.forEach((localGateway) => {
        const remoteData = remoteGateways.find(
          (rg) => rg._id?.toLowerCase() === localGateway.name.toLowerCase(),
        )

        if (remoteData) {
          // Transform the 'name' array into a flat object
          const config = {}
          remoteData.name.forEach((item) => {
            // Convert '1'/'0' to boolean for is_enabled
            if (item.name === 'is_enabled') {
              config[item.name] = item.value === '1'
            } else {
              config[item.name] = item.value
            }
          })
          gateways.value.find((g) => g.name === localGateway.name).is_enabled = config.is_enabled
          localGateway.config = {
            ...config,
            site_slug: remoteData.site_slug,
          }
        }
      })
    }
  } catch (e) {
    console.error(`Error fetching gateway statuses:`, e)
  } finally {
    fetching.value = false
  }
}

onMounted(() => {
  refreshAllStatus()
})

const openModal = (siteName) => {
  if (!canEdit.value) {
    message.error('You do not have permission to configure payment gateways')
    return
  }
  currentSite.value = siteName
  const gateway = gateways.value.find((g) => g.name === siteName)

  resetForm()

  if (gateway && gateway.config) {
    Object.assign(formState, {
      ...gateway.config,
      is_enabled: gateway.config.is_enabled === '1' || gateway.config.is_enabled === true,
    })
  }

  isModalOpen.value = true
}

const resetForm = () => {
  Object.assign(formState, {
    is_enabled: false,
    mode: 'sandbox',
    key: '',
    secret: '',
    public_key: '',
    access_token: '',
    hash:'',
    currency: 'USD',
    username: '',
    password: '',
    integration_id: '',
    frame_id: '',
    webhook_url: '',
    webhook_secret: '',
  })
}

const handleSubmit = async () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating payment gateway configuration is disabled in Demo Mode.',
    });
    return;
  }
  if (!canEdit.value) {
    message.error('You do not have permission to update payment gateways')
    return
  }
  submitLoading.value = true
  try {
    const enabledStr = formState.is_enabled ? '1' : '0';

    // Verify only one gateway can be active at a time
    if (formState.is_enabled) {
      // Look at our local gateway mapping to check if we're trying to enable a disabled gateway
      const currentGatewayLocal = gateways.value.find((g) => g.name === currentSite.value);
      if (currentGatewayLocal && !currentGatewayLocal.is_enabled) {
        const checkRes = await paymentGatewayService.isEnabled(currentSite.value);
        if (checkRes && checkRes.status === false) {
          message.error(checkRes.message || 'Another payment gateway is already active. Please disable it first.');
          submitLoading.value = false;
          return;
        }
      }
    }

    let payload = { is_enabled: enabledStr, mode: formState.mode };

    switch (currentSite.value) {
      case 'Razorpay':
        payload = { ...payload, key: formState.key, secret: formState.secret, currency: formState.currency, webhook_url: formState.webhook_url, webhook_secret: formState.webhook_secret };
        break;
      case 'Paystack':
        payload = { ...payload, key: formState.key, secret: formState.secret, currency: formState.currency };
        break;
      case 'Paymob':
        payload = { ...payload, username: formState.username, password: formState.password, key: formState.key, integration_id: formState.integration_id, frame_id: formState.frame_id };
        break;
      case 'Mercadopago':
        payload = { ...payload, public_key: formState.public_key, access_token: formState.access_token, webhook_secret: formState.webhook_secret };
        break;
      case 'Flutterwave':
        payload = { ...payload, key: formState.key, secret: formState.secret, hash: formState.hash };
        break;
      default:
        // fallback generic
        payload = { ...payload, ...formState, is_enabled: enabledStr };
    }

    const response = await paymentGatewayService.update(currentSite.value, payload)
    if (response.status) {
      message.success(`${currentSite.value} updated successfully`)
      isModalOpen.value = false
      refreshAllStatus()
    } else {
      message.error(response.message || 'Update failed')
    }
  } catch (err) {
    message.error('An unexpected error occurred')
  } finally {
    submitLoading.value = false
  }
}
</script>

<template>
  <div class="payment-settings">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight">Payment Gateways</h2>
        <p class="text-gray-500 mt-1">Configure your API credentials and transaction settings.</p>
      </div>
    </div>

    <!-- Gateway Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
        v-for="gateway in gateways"
        :key="gateway.name"
        class="group relative bg-white rounded-3xl p-1 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-gray-100"
      >
        <!-- Card Header with Image/Icon -->
        <div
          class="h-32 rounded-t-[22px] flex items-center justify-center relative overflow-hidden transition-all duration-500"
          :style="{ background: gateway.gradient }"
        >
          <!-- Background Pattern or Glow -->
          <div
            class="absolute inset-0 opacity-20 bg-white/10 group-hover:scale-150 transition-transform duration-1000"
          ></div>

          <img
            v-if="gateway.image"
            :src="gateway.image"
            class="w-30 h-30 object-contain transition-all duration-300 group-hover:scale-110 drop-shadow-lg"
            :alt="gateway.title"
          />
          <LucideIcon
            v-else
            :name="gateway.icon"
            :size="48"
            class="text-white/80 transition-all duration-300 group-hover:scale-110 drop-shadow-md"
          />
        </div>

        <div class="px-6 pb-6 pt-6 text-center">
          <h3 class="text-xl font-bold text-gray-800">{{ gateway.title }}</h3>
          <div class="mt-2 mb-4">
            <a-tag
              :color="gateway.is_enabled ? 'success' : 'default'"
              class="rounded-full px-4 py-0.5 border-0 font-medium"
            >
              {{ gateway.is_enabled ? 'Active' : 'Inactive' }}

            </a-tag>
          </div>

          <p class="text-gray-500 text-sm leading-relaxed mb-6">
            Manage your {{ gateway.title }} integration and payment flows.
          </p>

          <a-tooltip :title="canEdit ? '' : 'No Permission to Configure'">
            <a-button
              type="primary"
              :disabled="!canEdit"
              class="w-full h-11 rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              @click="openModal(gateway.name)"
            >
              <LucideIcon name="Settings" :size="18" />
              Configure
            </a-button>
          </a-tooltip>
        </div>
      </div>
    </div>

    <!-- Configuration Modal -->
    <a-modal
      v-model:open="isModalOpen"
      :title="`Configure ${currentSite}`"
      @ok="handleSubmit"
      :confirmLoading="submitLoading"
      width="550px"
      centered
      :bodyStyle="{ padding: '20px' }"
      :maskClosable="false"
    >
      <div v-if="fetching" class="flex flex-col items-center justify-center py-12">
        <a-spin size="large" />
        <p class="mt-4 text-gray-500">Loading configuration...</p>
      </div>

      <a-form v-else layout="vertical" :model="formState" class="mt-2">
        <div
          class="grid grid-cols-2 gap-6 mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center items-center"
        >
          <a-form-item label="Gateway Status" class="mb-0">
            <a-switch v-model:checked="formState.is_enabled" :disabled="isDemo" />
            <span class="ml-3 font-medium text-gray-700">
              {{ formState.is_enabled ? 'Enabled' : 'Disabled' }}
            </span>
          </a-form-item>

          <a-form-item label="Environment Mode" class="mb-0">
            <a-radio-group v-model:value="formState.mode" button-style="solid" :disabled="isDemo">
              <a-radio-button value="sandbox">Sandbox</a-radio-button>
              <a-radio-button value="production">Production</a-radio-button>
            </a-radio-group>
          </a-form-item>
        </div>

        <div class="space-y-4">
          <a-alert
            v-if="isDemo"
            message="Demo Mode Active"
            description="Payment credentials cannot be modified in this demonstration."
            type="warning"
            show-icon
            class="mb-6"
          />
          <!-- Common Fields -->
          <template v-if="currentSite === 'Razorpay' || currentSite === 'Paystack' || currentSite === 'Flutterwave'">
            <a-form-item label="Public Key / Client ID">
              <a-input v-model:value="formState.key" placeholder="Enter public key" size="large" :disabled="isDemo" />
            </a-form-item>

            <a-form-item label="Secret Key / Secret ID">
              <a-input-password
                v-model:value="formState.secret"
                placeholder="Enter secret key"
                size="large"
                :disabled="isDemo"
              />
            </a-form-item>


          </template>

          <!-- Mercadopago Specific -->
          <template v-if="currentSite === 'Mercadopago'">
            <a-form-item label="Public Key">
              <a-input
                v-model:value="formState.public_key"
                placeholder="Enter public key"
                size="large"
                :disabled="isDemo"
              />
            </a-form-item>

            <a-form-item label="Access Token">
              <a-input-password
                v-model:value="formState.access_token"
                placeholder="Enter secret key"
                size="large"
                :disabled="isDemo"
              />
            </a-form-item>
            <a-form-item label="Webhook Secret">
              <a-input-password
                v-model:value="formState.webhook_secret"
                placeholder="e.g. mercadopago123"
                size="large"
                :disabled="isDemo"
              />
            </a-form-item>
          </template>

          <!-- Razorpay Specific -->
          <template v-if="currentSite === 'Razorpay'">
                        <a-form-item label="Default Currency">
              <a-input
                v-model:value="formState.currency"
                placeholder="e.g. USD, NGN, INR"
                size="large"
                :disabled="isDemo"
              />
            </a-form-item>
            <a-form-item label="Webhook Url">
              <a-input
                v-model:value="formState.webhook_url"
                placeholder="e.g. /api/payments/webhook"
                size="large"
                :disabled="isDemo"
              />
            </a-form-item>
            <a-form-item label="Webhook Secret">
              <a-input-password
                v-model:value="formState.webhook_secret"
                placeholder="e.g. razorpay123"
                size="large"
                :disabled="isDemo"
              />
            </a-form-item>
          </template>

          <!-- Flutterwave Specific -->
          <template v-if="currentSite === 'Flutterwave'">
            <a-form-item label="Hash">
              <a-input-password
                v-model:value="formState.hash"
                placeholder="Enter hash key"
                size="large"
                :disabled="isDemo"
              />
            </a-form-item>
          </template>

          <!-- Paymob Specific -->
          <template v-if="currentSite === 'Paymob'">
            <div class="grid grid-cols-2 gap-4">
              <a-form-item label="Username">
                <a-input v-model:value="formState.username" placeholder="Username" size="large" :disabled="isDemo" />
              </a-form-item>
              <a-form-item label="Password">
                <a-input-password
                  v-model:value="formState.password"
                  placeholder="Password"
                  size="large"
                  :disabled="isDemo"
                />
              </a-form-item>
            </div>

            <a-form-item label="API Key">
              <a-input v-model:value="formState.key" placeholder="API Key" size="large" :disabled="isDemo" />
            </a-form-item>

            <div class="grid grid-cols-2 gap-4">
              <a-form-item label="Integration ID">
                <a-input v-model:value="formState.integration_id" placeholder="ID" size="large" :disabled="isDemo" />
              </a-form-item>
              <a-form-item label="Frame ID">
                <a-input v-model:value="formState.frame_id" placeholder="ID" size="large" :disabled="isDemo" />
              </a-form-item>
            </div>
          </template>
        </div>
      </a-form>

      <template #footer>
        <div class="flex gap-3 justify-end pt-4 border-t border-gray-100 mt-2">
          <a-button @click="isModalOpen = false" class="h-10 rounded-lg px-6">Cancel</a-button>
          <a-button
            v-if="!isDemo"
            type="primary"
            :loading="submitLoading"
            @click="handleSubmit"
            class="h-10 rounded-lg px-8 font-bold"
          >
            Save Changes
          </a-button>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<style scoped lang="postcss">
@reference "tailwindcss";

.payment-settings {
  @apply min-h-screen bg-transparent p-2;
}

:deep(.ant-input),
:deep(.ant-input-password) {
  @apply rounded-xl border-gray-200 transition-all duration-200;
}

:deep(.ant-input:hover),
:deep(.ant-input:focus) {
  @apply border-blue-400 ring-4 ring-blue-50;
}

:deep(.ant-modal-content) {
  @apply rounded-[32px] overflow-hidden shadow-2xl;
}

:deep(.ant-modal-header) {
  @apply border-b-0 pb-0 pt-8 px-8 bg-transparent;
}

:deep(.ant-modal-title) {
  @apply text-2xl font-black text-gray-800 tracking-tight;
}

:deep(.ant-radio-button-wrapper) {
  @apply h-10 flex items-center justify-center font-medium;
}

:deep(.ant-switch-checked) {
  @apply bg-blue-500;
}
</style>
