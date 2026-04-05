import { computed, ref, watch, markRaw } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  LayoutDashboard,
  UserRound,
  Bus,
  MapPin,
  Settings,
  CalendarDays,
  Info,
  Users,
  Ticket,
  Bell,
  CreditCard,
  ShieldCheck,
  HelpCircle,
  Tag,
  BusFront,
  LocateFixed,
  Wallet,
  UserCog,
  Globe,
  MapPinned,
} from 'lucide-vue-next'

export function useMenu() {
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()

  const selectedKeys = ref([])

  // Icon mapping for dynamic icons from route meta
  const iconMap = {
    LayoutDashboard: markRaw(LayoutDashboard),
    UserRound: markRaw(UserRound),
    Bus: markRaw(Bus),
    MapPin: markRaw(MapPin),
    Settings: markRaw(Settings),
    CalendarDays: markRaw(CalendarDays),
    Info: markRaw(Info),
    Users: markRaw(Users),
    Ticket: markRaw(Ticket),
    Bell: markRaw(Bell),
    CreditCard: markRaw(CreditCard),
    ShieldCheck: markRaw(ShieldCheck),
    HelpCircle: markRaw(HelpCircle),
    Tag: markRaw(Tag),
    BusFront: markRaw(BusFront),
    LocateFixed: markRaw(LocateFixed),
    Wallet: markRaw(Wallet),
    UserCog: markRaw(UserCog),
    Globe: markRaw(Globe),
    MapPinned: markRaw(MapPinned),
  }

  /**
   * Helper to check if user has permission for a route
   */
  const hasPermission = (routeMeta) => {
    if (!routeMeta || !routeMeta.permissions) return true
    const userPermissions = authStore.user?.permissions || []
    if (userPermissions.includes('master.admin')) return true
    return routeMeta.permissions.every((p) => userPermissions.includes(p))
  }

  /**
   * Generate menu items from router configuration
   */
  const menuItems = computed(() => {
    const rootRoute = router.options.routes.find((r) => r.path === '/')
    if (!rootRoute || !rootRoute.children) return []

    return rootRoute.children
      .filter((r) => {
        const isVisible = r.meta && r.meta.title && !r.meta.hidden
        return isVisible && hasPermission(r.meta)
      })
      .map((r) => {
        const fullPath = r.path.startsWith('/') ? r.path : `/${r.path}`
        const item = {
          ...r,
          path: fullPath,
          icon: r.meta?.icon ? iconMap[r.meta.icon] : null,
          title: r.meta.title,
        }

        if (r.children) {
          item.children = r.children
            .filter((c) => c.meta && c.meta.title && !c.meta.hidden && hasPermission(c.meta))
            .map((c) => ({
              ...c,
              path: c.path.startsWith('/') ? c.path : `${fullPath}/${c.path}`.replace(/\/+/g, '/'),
              title: c.meta.title,
            }))
        }
        return item
      })
  })

  // Keep selectedKeys in sync with current route path
  watch(
    () => route.path,
    (newPath) => {
      // Find matching menu item or child
      selectedKeys.value = [newPath]
    },
    { immediate: true },
  )

  return {
    menuItems,
    selectedKeys,
    iconMap,
  }
}
