import './assets/tailwind.css'
import 'ant-design-vue/dist/reset.css'
import 'nprogress/nprogress.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'
import LucideIcon from './components/LucideIcon.vue'
import PhoneInput from './components/PhoneInput.vue'
import OpenLayers from 'vue3-openlayers'
import 'vue3-openlayers/vue3-openlayers.css'
import 'ol/ol.css'
import VueApexCharts from 'vue3-apexcharts'

const app = createApp(App)
app.component('LucideIcon', LucideIcon)
app.component('PhoneInput', PhoneInput)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.use(OpenLayers)
app.use(VueApexCharts)

app.mount('#app')
