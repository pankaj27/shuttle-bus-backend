<template>
  <div class="mt-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h3 class="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-3">
          <LucideIcon name="MessageSquareHeart" class="text-pink-500" :size="24" />
          Live Sentiment Feed
        </h3>
        <p class="text-sm text-gray-400 font-medium mt-1">
          Real-time activity and sentiment from your passengers
        </p>
      </div>
      
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-xl border border-green-100 dark:border-green-800">
           <span class="text-[10px] font-black text-green-600 uppercase tracking-widest">Happiness: 94%</span>
        </div>
      </div>
    </div>

    <!-- Feed Container -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Activity Stream -->
      <div class="lg:col-span-8 space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
        <div 
          v-for="feed in feedbackData" 
          :key="feed.id"
          class="sentiment-card group"
        >
          <div class="flex gap-4 p-5">
            <a-avatar :src="feed.avatar" :size="48" class="border-2 border-white dark:border-gray-700 shadow-sm shrink-0" />
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-black text-gray-800 dark:text-gray-100">{{ feed.user }}</span>
                  <span class="text-[10px] font-bold text-gray-400 uppercase">• {{ feed.time }}</span>
                </div>
                <!-- Mini Rating -->
                <div class="flex items-center gap-1">
                  <LucideIcon v-for="i in 5" :key="i" name="Star" :size="10" :fill="i <= feed.rating ? 'currentColor' : 'none'" :class="i <= feed.rating ? 'text-yellow-500' : 'text-gray-200'" />
                </div>
              </div>
              
              <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic mb-3">
                "{{ feed.comment }}"
              </p>

              <!-- Mention Tags -->
              <div class="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span class="flex items-center gap-1.5"><LucideIcon name="Bus" :size="12" /> {{ feed.route }}</span>
                <span class="flex items-center gap-1.5"><LucideIcon name="User" :size="12" /> {{ feed.driver }}</span>
              </div>
            </div>

            <!-- Sentiment Emoji HUD -->
            <div 
              class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-gray-100 dark:border-gray-700"
              :class="getSentimentBg(feed.rating)"
            >
              {{ getSentimentEmoji(feed.rating) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Sidebar -->
      <div class="lg:col-span-4 space-y-6">
        <div class="card-premium p-6">
          <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 dark:border-gray-700 pb-3">Sentiment Trend</h4>
          <div class="space-y-6">
            <div v-for="stat in sentimentStats" :key="stat.label" class="flex flex-col">
              <div class="flex justify-between items-end mb-2">
                <span class="text-[10px] font-black text-gray-500 uppercase">{{ stat.label }}</span>
                <span class="text-sm font-black text-gray-800 dark:text-gray-100">{{ stat.count }}</span>
              </div>
              <div class="h-2 w-full bg-gray-50 dark:bg-gray-900 rounded-full overflow-hidden">
                <div class="h-full rounded-full" :class="stat.color" :style="{ width: (stat.count / totalFeedback * 100) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="card-premium p-6 bg-linear-to-br from-primary/5 to-transparent">
          <LucideIcon name="Quote" :size="24" class="text-primary/20 mb-4" />
          <h5 class="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Dispatcher Note</h5>
          <p class="text-xs text-gray-500 leading-relaxed font-medium">
            Customer joy is currently 4% higher than last week. Driver Adam Smith is being praised for his new cleanliness routine.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';

const feedbackData = [
  {
    id: 1,
    user: 'Sarah Miller',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&id=10',
    time: '2 mins ago',
    comment: 'The bus was exceptionally clean today! Driver Adam was very polite and arrived exactly on time.',
    rating: 5,
    route: 'Downtown Exp',
    driver: 'Adam S.'
  },
  {
    id: 2,
    user: 'Marcus Chen',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&id=11',
    time: '12 mins ago',
    comment: 'A bit crowded on the Airport route, but the AC was working well so the ride was comfortable.',
    rating: 4,
    route: 'Airport Shutt',
    driver: 'Sarah C.'
  },
  {
    id: 3,
    user: 'Elena Rodriguez',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&id=12',
    time: '25 mins ago',
    comment: 'The driver missed the first stop which added 5 minutes to my trip. Hope this gets fixed.',
    rating: 2,
    route: 'University Loop',
    driver: 'Mike R.'
  },
  {
    id: 4,
    user: 'James Wilson',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&id=13',
    time: '45 mins ago',
    comment: 'Best commute app in the city. Smooth payment and real-time tracking is spot on!',
    rating: 5,
    route: 'Tech Park Direct',
    driver: 'Jessica P.'
  }
];

const sentimentStats = [
  { label: 'Positive', count: 412, color: 'bg-green-500' },
  { label: 'Neutral', count: 85, color: 'bg-blue-400' },
  { label: 'Critical', count: 12, color: 'bg-pink-500' }
];

const totalFeedback = computed(() => sentimentStats.reduce((acc, s) => acc + s.count, 0));

const getSentimentEmoji = (rating) => {
  if (rating >= 5) return '😍';
  if (rating >= 4) return '😊';
  if (rating >= 3) return '😐';
  return '😞';
};

const getSentimentBg = (rating) => {
  if (rating >= 5) return 'bg-pink-50 dark:bg-pink-900/10 text-pink-500';
  if (rating >= 4) return 'bg-green-50 dark:bg-green-900/10 text-green-500';
  if (rating >= 3) return 'bg-blue-50 dark:bg-blue-900/10 text-blue-500';
  return 'bg-gray-50 dark:bg-gray-800 text-gray-400';
};
</script>

<style scoped>
@reference "tailwindcss";

.sentiment-card {
  @apply bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/50 shadow-sm transition-all duration-300;
}

.sentiment-card:hover {
  @apply shadow-md;
  border-color: var(--color-primary);
}

.card-premium {
  @apply bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  @apply bg-transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-gray-100 dark:bg-gray-700 rounded-full;
}
</style>
