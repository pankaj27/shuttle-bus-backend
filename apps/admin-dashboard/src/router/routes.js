const MainLayout = () => import('../layouts/MainLayout.vue')
const AuthLayout = () => import('../layouts/AuthLayout.vue')
const HomeView = () => import('../views/HomeView.vue')

const routes = [
  {
    path: '/terms',
    name: 'public-terms',
    component: () => import('../views/public/PublicDocumentView.vue'),
    meta: { title: 'Terms & Conditions', requiresAuth: false, hidden: true },
  },
  {
    path: '/privacy-policy',
    name: 'public-privacy',
    component: () => import('../views/public/PublicDocumentView.vue'),
    meta: { title: 'Privacy Policy', requiresAuth: false, hidden: true },
  },
  {
    path: '/delete-account',
    name: 'public-delete-account',
    component: () => import('../views/public/PublicDocumentView.vue'),
    meta: { title: 'Delete Account', requiresAuth: false, hidden: true },
  },
  {
    path: '/auth',
    component: AuthLayout,
    meta: { guest: true },
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('../views/auth/LoginView.vue'),
        meta: { title: 'Login', requiresAuth: false },
      },
      // {
      //   path: 'forgot-password',
      //   name: 'forgot-password',
      //   component: () => import('../views/auth/ForgotPasswordView.vue'),
      // },
    ],
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: HomeView,
        meta: { title: 'Dashboard', icon: 'LayoutDashboard', permissions: ['manage.dashboard'] },
      },
      {
        path: 'eagle-eye',
        name: 'eagle-eye',
        component: () => import('../views/eagle-eye/EagleEyeView.vue'),
        meta: { title: 'Eagle Eye', icon: 'MapPinned', permissions: ['manage.eagle.eye'] },
      },
      // Personnel Management
      {
        path: 'drivers',
        name: 'drivers',
        component: () => import('../views/drivers/DriverListView.vue'),
        meta: { title: 'Manage Drivers', icon: 'UserRound', permissions: ['driver.view'] },
      },
      {
        path: 'drivers/create',
        name: 'driver-create',
        component: () => import('../views/drivers/DriverCreateView.vue'),
        meta: { hidden: true, permissions: ['driver.create'], demoRestricted: true },
      },
      {
        path: 'drivers/edit/:id',
        name: 'driver-edit',
        component: () => import('../views/drivers/DriverEditView.vue'),
        meta: { hidden: true, permissions: ['driver.edit'] },
      },

      // Fleet Management
      {
        path: 'fleet',
        name: 'fleet',
        meta: { title: 'Fleet', icon: 'Bus', permissions: ['bus.view'] },
        children: [
          {
            path: 'buses',
            name: 'bus-list',
            component: () => import('../views/buses/BusListView.vue'),
            meta: { title: 'Bus List', permissions: ['bus.view'] },
          },
          {
            path: 'layouts',
            name: 'bus-layouts',
            component: () => import('../views/buses/buslayouts/BusLayoutListView.vue'),
            meta: { title: 'Bus Layouts', permissions: ['bus.layout.view'] },
          },
          {
            path: 'types',
            name: 'bus-types',
            component: () => import('../views/buses/bustypes/BusTypeListView.vue'),
            meta: { title: 'Bus Types', permissions: ['bus.type.view'] },
          },
        ],
      },

      // Operations

      {
        path: 'stops',
        name: 'stops',
        meta: { title: 'Stops/Locations', icon: 'Ticket', permissions: ['stop.view'] },
        children: [
          {
            path: 'list',
            name: 'stop-list',
            component: () => import('../views/stops/StopListView.vue'),
            meta: { title: 'Lists', icon: 'LocateFixed', permissions: ['stop.view'] },
          },
          {
            path: 'create',
            name: 'stop-create',
            component: () => import('../views/stops/StopCreateView.vue'),
            meta: { hidden: true, permissions: ['stop.create'], demoRestricted: true },
          },
          {
            path: 'edit/:id',
            name: 'stop-edit',
            component: () => import('../views/stops/StopEditView.vue'),
            meta: { hidden: true, permissions: ['stop.edit'] },
          },
        ],
      },
      {
        path: 'routes',
        name: 'routes',
        meta: { title: 'Routes', icon: 'MapPin', permissions: ['route.view'] },
        children: [
          {
            path: 'list',
            name: 'route-list',
            component: () => import('../views/routes/RouteListView.vue'),
            meta: { title: 'Route Lists', icon: 'LocateFixed', permissions: ['route.view'] },
          },
          {
            path: 'create',
            name: 'route-create',
            component: () => import('../views/routes/RouteCreateView.vue'),
            meta: { title: 'Route Create', permissions: ['route.create'], demoRestricted: true },
          },
          {
            path: 'edit/:id',
            name: 'route-edit',
            component: () => import('../views/routes/RouteEditView.vue'),
            meta: { title: 'Route Edit', hidden: true, permissions: ['route.edit'] },
          },
        ],
      },
      {
        path: 'bus-schedules',
        name: 'bus-schedules',
        meta: { title: 'Bus Schedules', icon: 'Bus', permissions: ['busschedule.view'] },
        children: [
          {
            path: 'bus-schedule-list',
            name: 'bus-schedule-list',
            component: () => import('../views/bus-schedules/BusScheduleListView.vue'),
            meta: {
              title: 'Bus Schedule Lists',
              icon: 'LocateFixed',
              permissions: ['busschedule.view'],
            },
          },

          {
            path: 'bus-schedule-create',
            name: 'bus-schedule-create',
            component: () => import('../views/bus-schedules/BusScheduleCreateView.vue'),
            meta: {
              title: 'Bus Schedule Create',
              permissions: ['busschedule.create'],
              demoRestricted: true,
            },
          },
          {
            path: 'bus-schedule-edit/:id',
            name: 'bus-schedule-edit',
            component: () => import('../views/bus-schedules/BusScheduleEditView.vue'),
            meta: { title: 'Bus Schedule Edit', hidden: true, permissions: ['busschedule.edit'] },
          },
        ],
      },

      {
        path: 'trips',
        name: 'trips',
        meta: {
          title: 'Trip Assign',
          icon: 'CalendarDays',
          permissions: ['booking.assigns.view'],
        },
        children: [
          {
            path: 'list',
            name: 'trips-list',
            component: () => import('../views/trip-assigns/TripAssignListView.vue'),
            meta: {
              title: 'Trip Assign Lists',
              icon: 'LocateFixed',
              permissions: ['booking.assigns.view'],
            },
          },
          {
            path: 'trip-assign-create',
            name: 'trips-create',
            component: () => import('../views/trip-assigns/TripAssignCreateView.vue'),
            meta: {
              title: 'Trip Assign Create',
              icon: 'Plus',
              permissions: ['booking.assigns.create'],
            },
          },
          {
            path: 'edit/:id',
            name: 'trips-edit',
            component: () => import('../views/trip-assigns/TripAssignEditView.vue'),
            meta: {
              title: 'Trip Assign Edit',
              hidden: true,
              permissions: ['booking.assigns.edit'],
            },
          },
        ],
      },
      // Engagement & Marketing
      {
        path: 'offers',
        name: 'offers',
        component: () => import('../views/offers/OfferListView.vue'),
        meta: { title: 'Offers', icon: 'Tag', permissions: ['offer.view'] },
      },
      {
        path: 'offers/create',
        name: 'offer-create',
        component: () => import('../views/offers/OfferCreateView.vue'),
        meta: {
          title: 'Offer Create',
          hidden: true,
          permissions: ['offer.create'],
          demoRestricted: true,
        },
      },
      {
        path: 'offers/edit/:id',
        name: 'offer-edit',
        component: () => import('../views/offers/OfferEditView.vue'),
        meta: { title: 'Offer Edit', hidden: true, permissions: ['offer.edit'] },
      },
      {
        path: 'passes',
        name: 'passes',
        meta: { title: 'Passes', icon: 'Ticket', permissions: ['pass.view'] },
        children: [
          {
            path: 'list',
            name: 'pass-list',
            component: () => import('../views/passes/PassListView.vue'),
            meta: { title: 'Pass List', permissions: ['pass.view'] },
          },
          {
            path: 'create',
            name: 'pass-create',
            component: () => import('../views/passes/PassCreateView.vue'),
            meta: { title: 'Pass Create', permissions: ['pass.create'], demoRestricted: true },
          },
          {
            path: 'edit/:id',
            name: 'pass-edit',
            component: () => import('../views/passes/PassEditView.vue'),
            meta: { hidden: true, title: 'Pass Edit', permissions: ['pass.edit'] },
          },
        ],
      },
      {
        path: 'notifications',
        name: 'notifications',
        component: () => import('../views/notifications/NotificationListView.vue'),
        meta: { title: 'Notifications', icon: 'Bell', permissions: ['manage.notification'] },
      },
      {
        path: 'customers',
        name: 'customers',
        meta: { title: 'Customers', icon: 'Users', permissions: ['customer.view'] },
        children: [
          {
            path: 'lists',
            name: 'customer-lists',
            component: () => import('../views/customers/CustomerListView.vue'),
            meta: { title: 'Customer Lists', icon: 'Users', permissions: ['customer.view'] },
          },
          {
            path: 'create',
            name: 'customer-create',
            component: () => import('../views/customers/CustomerCreateView.vue'),
            meta: {
              title: 'Customer Create',
              hidden: true,
              permissions: ['customer.create'],
              demoRestricted: true,
            },
          },
          {
            path: 'edit/:id',
            name: 'customer-edit',
            component: () => import('../views/customers/CustomerEditView.vue'),
            meta: {
              hidden: true,
              title: 'Customer Edit',
              permissions: ['customer.edit'],
            },
          },
          {
            path: 'view/:id',
            name: 'customer-view',
            component: () => import('../views/customers/CustomerDetailView.vue'),
            meta: {
              hidden: true,
              title: 'View Details',
              permissions: ['customer.view'],
            },
          },
          {
            path: 'transaction-histories',
            name: 'transaction-histories',
            component: () => import('../views/customers/wallets/WalletHistoryView.vue'),
            meta: {
              hidden: true,
              title: 'Transaction Histories',
              permissions: ['customer.edit'],
            },
          },
          {
            path: 'wallet-recharge',
            name: 'wallet-recharge',
            component: () => import('../views/customers/wallets/WalletRechargeView.vue'),
            meta: {
              title: 'Wallet Recharge',
              permissions: ['customer.edit'],
            },
          },
          {
            path: 'booking-history',
            name: 'booking-histories',
            component: () => import('../views/customers/bookings/BookingHistoryView.vue'),
            meta: { title: 'Booking Histories', hidden: true, permissions: ['customer.view'] },
          },
          {
            path: 'referrals',
            name: 'referrals',
            component: () => import('../views/customers/referrals/ReferralListView.vue'),
            meta: { title: 'Referrals', icon: 'User', permissions: ['customer.view'] },
          },
          {
            path: 'suggestions',
            name: 'suggestions',
            component: () => import('../views/customers/suggestions/SuggestionListView.vue'),
            meta: { title: 'Suggestions', icon: 'User', permissions: ['customer.view'] },
          },
        ],
      },

      {
        path: 'bookings',
        name: 'bookings',
        component: () => import('../views/bookings/BookingView.vue'),
        meta: { title: 'Bookings', icon: 'Ticket', permissions: ['manage.trips.view'] },
      },

      {
        path: 'payments',
        name: 'payments',
        component: () => import('../views/payments/PaymentView.vue'),
        meta: { title: 'Payments', icon: 'CreditCard', permissions: ['payment.view'] },
      },

      // Settings & Admin
      {
        path: 'admin',
        name: 'admin',
        meta: {
          title: 'Administration',
          icon: 'ShieldCheck',
          requiresAuth: true,
        },
        children: [
          {
            path: 'list',
            name: 'users-list',
            component: () => import('../views/users/UserListView.vue'),
            meta: { title: 'Manage Users ', icon: 'Users', permissions: ['user.view'] },
          },
          {
            path: 'create',
            name: 'users-create',
            component: () => import('../views/users/UserCreateView.vue'),
            meta: {
              title: 'Create User',
              icon: 'Users',
              permissions: ['user.view'],
              demoRestricted: true,
            },
          },
          {
            path: 'edit/:id',
            name: 'users-edit',
            component: () => import('../views/users/UserEditView.vue'),
            meta: { title: 'Edit Staff', hidden: true, permissions: ['user.view'] },
          },
          {
            path: 'roles',
            name: 'roles',
            component: () => import('../views/roles/RoleListView.vue'),
            meta: { title: 'Roles and Permissions', icon: 'Users', permissions: ['role.view'] },
          },
          {
            path: 'role-edit/:id',
            name: 'role-edit',
            component: () => import('../views/roles/RoleEditView.vue'),
            meta: { hidden: true, permissions: ['role.edit'] },
          },
        ],
      },
      {
        path: 'settings',
        name: 'settings',
        meta: { title: 'Settings', icon: 'Settings', permissions: ['manage.application.settings'] },
        children: [
          {
            path: 'profile',
            name: 'profile',
            component: () => import('../views/settings/ProfileView.vue'),
            meta: { hidden: true, title: 'My Profile', permissions: ['manage.admin.profile'] },
          },
          {
            path: 'change-password',
            name: 'change-password',
            component: () => import('../views/settings/ChangePasswordView.vue'),
            meta: { hidden: true, title: 'Security', permissions: ['manage.admin.profile.update'] },
          },
          {
            path: 'help-support',
            name: 'help-support',
            component: () => import('../views/helpAndSupports/HelpAndSupportView.vue'),
            meta: { title: 'Help & Support', permissions: ['help.support.view'] },
          },
          {
            path: 'countries',
            name: 'countries',
            component: () => import('../views/settings/CountryListView.vue'),
            meta: {
              title: 'Countries',
              icon: 'Globe',
              permissions: ['country.view'],
            },
          },
          {
            path: 'languages',
            name: 'languages',
            component: () => import('../views/settings/components/LanguageListView.vue'),
            meta: {
              title: 'Languages',
              icon: 'Languages',
              permissions: ['language.view'],
            },
          },
          {
            path: 'currencies',
            name: 'currencies',
            component: () => import('../views/settings/CurrencyListView.vue'),
            meta: {
              title: 'Currencies',
              icon: 'Globe',
              permissions: ['currency.view'],
            },
          },
          {
            path: 'payment-gateways',
            name: 'payment-gateways',
            component: () => import('../views/settings/PaymentGatewayView.vue'),
            meta: {
              title: 'Payment Gateways',
              icon: 'Globe',
              permissions: ['manage.application.settings'],
            },
          },
          {
            path: 'site-settings',
            name: 'site-settings',
            component: () => import('../views/settings/SiteSettingView.vue'),
            meta: {
              title: 'Site Settings',
              icon: 'Settings',
              permissions: ['manage.application.settings'],
            },
          },
        ],
      },
      // {
      //   path: 'about',
      //   name: 'about',
      //   component: () => import('../views/AboutView.vue'),
      //   meta: { title: 'About', icon: 'Info' },
      // },
    ],
  },
  {
    path: '/401',
    name: '401',
    component: () => import('../views/errors/401.vue'),
    meta: { title: 'Unauthorized', hidden: true },
  },
  {
    path: '/404',
    name: '404',
    component: () => import('../views/errors/404.vue'),
    meta: { title: 'Not Found', hidden: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/errors/404.vue'),
    meta: { hidden: true },
  },
]

export default routes
