<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  company: {
    type: Object,
    default: () => ({}),
  },
  logoMode: {
    type: String,
    default: 'auto' // 'auto', 'text', 'image'
  }
});

const primaryColor = computed(() => props.company?.primary_color || '#3a8697');

// Formatter for currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value || 0).replace('INR', '₹');
};

const customer = computed(() => ({
  fullname: props.data.customer_name || 'N/A',
  address: props.data.customer_address || 'N/A',
  phone: props.data.customer_phone || 'N/A',
  email: props.data.customer_email || 'N/A',
}));

const isOffer = computed(() => !!props.data.offer || (props.data.offer && props.data.offer.discount_amount > 0));
</script>

<template>
  <div class="invoice-wrapper" :style="{ '--primary-color': primaryColor }">
    <header class="header">
      <div class="logo-section">
        <template v-if="(company.light_logo || company.logo) && logoMode !== 'text'">
          <img :src="company.light_logo || company.logo" :alt="company.name" />
        </template>
        <h1 v-else>{{ company.name }}</h1>
        
        <p v-if="company.site_description" class="site-desc">
          {{ company.site_description }}
        </p>
      </div>
      <div class="invoice-meta">
        <h2>INVOICE</h2>
        <p class="pnr">#{{ data.pnr_no }}</p>
        <p>Date: {{ data.created_date }}</p>
        <p>Status: Paid via {{ data.payment_method || 'Online' }}</p>
      </div>
    </header>

    <section class="billing-grid">
      <div class="bill-box">
        <h3>FROM</h3>
        <strong>{{ company.name }}</strong>
        <p>{{ company.address }}</p>
        <p>Phone: {{ company.phone }}</p>
        <p>Email: {{ company.email }}</p>
      </div>
      <div class="bill-box">
        <h3>BILL TO</h3>
        <strong>{{ customer.fullname }}</strong>
        <p>{{ customer.address }}</p>
        <p>Phone: {{ customer.phone }}</p>
        <p>Email: {{ customer.email }}</p>
      </div>
    </section>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50%">Description</th>
          <th style="text-align: right">Subtotal</th>
          <th style="text-align: right">Tax</th>
          <th v-if="isOffer" style="text-align: right">Discount</th>
          <th style="text-align: right">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <span class="service-desc">Transportation Service</span>
            <div class="service-meta">
              Trip: {{ data.pickup_name }} &rarr; {{ data.dropoff_name }}<br />
              Scheduled: {{ data.booking_date }} @ {{ data.start_time }}
            </div>
            <div v-if="data.isPass" class="ride-pass-badge">
              Ride Pass Applied ({{ data.pass?.no_of_rides }} Rides)
            </div>
          </td>
          <td style="text-align: right">{{ formatCurrency(data.sub_total) }}</td>
          <td style="text-align: right">{{ formatCurrency(data.tax_amount) }}</td>
          <td v-if="isOffer" style="text-align: right; color: #d97706">
            -{{ formatCurrency(data.offer?.discount_amount) }}
          </td>
          <td style="text-align: right; font-weight: 600">
            {{ formatCurrency(data.final_total_fare) }}
          </td>
        </tr>
      </tbody>
    </table>

    <section class="summary-section">
      <div class="summary-box">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>{{ formatCurrency(data.sub_total) }}</span>
        </div>
        <div class="summary-row">
          <span>Tax</span>
          <span>{{ formatCurrency(data.tax_amount) }}</span>
        </div>
        <div v-if="isOffer" class="summary-row discount-row">
          <span>Discount ({{ data.offer?.code }})</span>
          <span>-{{ formatCurrency(data.offer?.discount_amount) }}</span>
        </div>
        <div class="summary-row total">
          <span>Final Amount</span>
          <span v-if="isOffer">{{ formatCurrency(data.offer?.final_total_after_discount) }}</span>
          <span v-else>{{ formatCurrency(data.final_total_fare) }}</span>
        </div>
      </div>
    </section>

    <footer class="footer-note">
      <p>Thank you for choosing {{ company.name }}!</p>
      <p>
        This is a computer-generated invoice and does not require a signature.
      </p>
    </footer>
  </div>
</template>

<style scoped>
.invoice-wrapper {
  max-width: 800px;
  margin: auto;
  padding: 40px;
  background-color: white;
  color: #333;
  font-family: Arial, Helvetica, sans-serif;
  line-height: 1.5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 20px;
}

.logo-section h1 {
  color: var(--primary-color);
  margin: 0;
  font-size: 28px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.logo-section img {
  max-height: 60px;
  margin-bottom: 10px;
}

.site-desc {
  margin: 5px 0 0 0;
  font-size: 13px;
  color: #666;
}

.invoice-meta {
  text-align: right;
}

.invoice-meta h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.invoice-meta p {
  margin: 5px 0;
  color: #666;
  font-size: 14px;
}

.invoice-meta .pnr {
  font-weight: bold;
  color: #333;
}

.billing-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-bottom: 40px;
}

.bill-box h3 {
  font-size: 12px;
  text-transform: uppercase;
  color: var(--primary-color);
  margin-bottom: 10px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 5px;
}

.bill-box p {
  margin: 4px 0;
  font-size: 14px;
}

.bill-box strong {
  display: block;
  font-size: 16px;
  margin-bottom: 5px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
}

.items-table th {
  background-color: #f9fafb;
  text-align: left;
  padding: 12px 15px;
  font-size: 12px;
  text-transform: uppercase;
  color: #666;
  border-bottom: 2px solid #e5e7eb;
}

.items-table td {
  padding: 15px;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: top;
  font-size: 14px;
}

.service-desc {
  font-weight: 600;
  display: block;
  margin-bottom: 5px;
}

.service-meta {
  font-size: 13px;
  color: #666;
}

.ride-pass-badge {
  background-color: #ecfdf5;
  color: #059669;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
  margin-top: 5px;
}

.summary-section {
  display: flex;
  justify-content: flex-end;
}

.summary-box {
  width: 300px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.summary-row.total {
  border-top: 2px solid var(--primary-color);
  margin-top: 10px;
  padding-top: 15px;
  font-weight: bold;
  font-size: 18px;
  color: var(--primary-color);
}

.discount-row {
  color: #d97706;
}

.footer-note {
  margin-top: 60px;
  text-align: center;
  font-size: 12px;
  color: #666;
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
}

@media print {
  body {
    padding: 0;
  }
  .invoice-wrapper {
    max-width: 100%;
    padding: 0;
  }
}
</style>
