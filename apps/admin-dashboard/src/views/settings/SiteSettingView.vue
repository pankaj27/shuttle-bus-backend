<script setup>
import { ref } from 'vue';
import SettingLayout from '@/components/SettingLayout.vue';

// Import Settings Components
import GeneralSettings from './components/GeneralSettings.vue';
import AppSettings from './components/AppSettings.vue';
import StorageSettings from './components/StorageSettings.vue';
import EmailSettings from './components/EmailSettings.vue';
import NotificationSettings from './components/NotificationSettings.vue';
import SmsSettings from './components/SmsSettings.vue';
import ReferralSettings from './components/ReferralSettings.vue';
import RefundSettings from './components/RefundSettings.vue';
import SocialLinks from './components/SocialLinks.vue';
import TermsSettings from './components/TermsSettings.vue';
import PrivacySettings from './components/PrivacySettings.vue';
import DeleteAccountSettings from './components/DeleteAccountSettings.vue';

const activeKey = ref('general');

const menuItems = [
  { key: 'general', label: 'General Settings', icon: 'Settings' },
  { key: 'app', label: 'App Settings', icon: 'Smartphone' },
  { key: 'storage', label: 'Storage (AWS)', icon: 'HardDrive' },
  { key: 'email', label: 'Email (SMTP)', icon: 'Mail' },
    { key: 'sms', label: 'SMS Settings', icon: 'MessageSquare' },
  { key: 'notifications', label: 'Notifications', icon: 'Bell' },
  { key: 'referral', label: 'Referral Program', icon: 'Users' },
  { key: 'refunds', label: 'Refunds & Fees', icon: 'Calculator' },
//
  { key: 'terms', label: 'Terms & Conditions', icon: 'FileText' },
  { key: 'privacy', label: 'Privacy Policy', icon: 'Lock' },
   { key: 'delete', label: 'Delete Account', icon: 'Trash' },
];
</script>

<template>
  <SettingLayout
    title="Site Configuration"
    description="Global settings for your application and brand."
    :menu-items="menuItems"
    v-model:active-key="activeKey"
  >
    <!-- General Settings -->
    <template #general>
      <GeneralSettings />
    </template>

    <!-- App Settings -->
    <template #app>
      <AppSettings />
    </template>

    <!-- Storage Settings -->
    <template #storage>
      <StorageSettings />
    </template>

    <!-- Email Settings -->
    <template #email>
      <EmailSettings />
    </template>

        <!-- SMS Settings -->
    <template #sms>
      <SmsSettings />
    </template>

    <!-- Notification Settings -->
    <template #notifications>
      <NotificationSettings />
    </template>

    <!-- Referral Settings -->
    <template #referral>
      <ReferralSettings />
    </template>

    <!-- Refunds & Fees -->
    <template #refunds>
      <RefundSettings />
    </template>

    <!-- Social Settings -->
    <template #social>
      <SocialLinks />
    </template>

    <!-- Terms & Conditions -->
    <template #terms>
      <TermsSettings />
    </template>

    <!-- Privacy Policy -->
    <template #privacy>
      <PrivacySettings />
    </template>

    <!-- SEO Settings -->
    <template #delete>
      <DeleteAccountSettings />
    </template>
  </SettingLayout>
</template>

<style scoped>
/* Scoped styles are handled within individual components */
</style>