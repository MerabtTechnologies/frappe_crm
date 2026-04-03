<template>
  <FrappeUIProvider>
    <SplashScreen v-if="showSplash" />
    <template v-else>
      <div v-if="banner.visible" class="bg-yellow-50 border-l-4 border-yellow-400 p-3 flex items-start justify-between gap-4 sticky top-0 z-50">
        <div class="flex-1 text-sm text-yellow-800">{{ banner.message || 'Welcome to M Nova CRM...' }}</div>
        <button @click="banner.closeBanner()" aria-label="Close warning" class="text-yellow-700 hover:text-yellow-900 font-bold">✕</button>
      </div>

      <NotPermitted v-if="$route.name === 'Not Permitted'" />
      <Layout class="isolate" v-else-if="session().isLoggedIn">
        <router-view :key="$route.fullPath" />
      </Layout>
      <Dialogs />
      <Dialog v-model="showModal" :options="{ size: 'sm' }" :disable-outside-click-to-close="true">
        <template #body>
          <div class="bg-surface-modal px-4 pb-6 pt-5 sm:px-6">
            <div class="mb-2 items-start gap-3 place-items-center">
              <div class="pt-1 mb-6">
                <LucideFrown v-if="modelData.type === 'bad'" class="size-20 text-red-500" />
                <LucideSmile v-else-if="modelData.type === 'good'" class="size-20 text-green-500" />
                <LucideBadge v-else class="size-20 text-yellow-500" />
              </div>
              <div>
                <h2 v-if="modelData.type === 'bad'" class="text-1xl font-bold text-red-500 text-center ">{{ modelData.title }}</h2>
                <h2 v-else-if="modelData.type === 'good'" class="text-1xl font-bold text-green-600 text-center">{{ modelData.title }}</h2>
                <h2 v-else class="text-1xl font-bold text-yellow-500 text-center">{{ modelData.title }}</h2>
                <div v-if="modelData.type === 'bad'" class="mt-2 text-lg text-red-500 text-center">{{ modelData.message }}</div>
                <div v-else-if="modelData.type === 'good'" class="mt-2 text-lg text-green-600 text-center">{{ modelData.message }}</div>
                <div v-else class="mt-2 text-lg text-yellow-500 text-center">{{ modelData.message }}</div>
              </div>
            </div>
          </div>

          <div class="px-4 pb-7 pt-4 sm:px-6">
            <div class="flex flex-row-reverse gap-2">
              <button
                v-for="(button, index) in modelData.buttons"
                :key="index"
                @click="button.action()"
                :class="[
                  'inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2',
                  button.variant === 'solid'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                    : 'bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
                ]"
              >
                {{ button.label }}
              </button>
            </div>
          </div>
        </template>
      </Dialog>
    </template>
  </FrappeUIProvider>
</template>

<script setup>
import NotPermitted from '@/pages/NotPermitted.vue'
import SplashScreen from '@/components/SplashScreen.vue'
import { Dialogs } from '@/utils/dialogs'
import { sessionStore as session } from '@/stores/session'
import { setTheme } from '@/stores/theme'
import { FrappeUIProvider, setConfig } from 'frappe-ui'
import { computed, defineAsyncComponent, onErrorCaptured, onMounted, onBeforeUnmount, ref, onUnmounted } from 'vue'
import { bannerStore } from '@/stores/banner'
import { useRouter } from 'vue-router'

import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { toast, createResource, Dialog } from 'frappe-ui'
import LucideBadge from '~icons/lucide/badge-info'
import LucideFrown from '~icons/lucide/frown'
import LucideSmile from '~icons/lucide/smile'
import { usersStore } from '@/stores/users'

const _merabtSettingsResource = createResource({
  url: 'merabt_crm.portal_api.api.get_merabt_settings',
  cache: 'Merabt Settings',
  auto: true,
})

let interval = null;
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-qD0A5E4I224NR-LqvSmrCYUC0cQUG-0",
  authDomain: "merabtcrm.firebaseapp.com",
  projectId: "merabtcrm",
  storageBucket: "merabtcrm.firebasestorage.app",
  messagingSenderId: "594102127532",
  appId: "1:594102127532:web:bee57cbafd666a1fb6c809",
  measurementId: "G-PVXM42V748"
};
try {
  initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization error", error);
}
const { users, getUser } = usersStore()


// Get registration token. Initially this makes a network call, once retrieved
// subsequent calls to getToken will return from cache.
const messaging = getMessaging();
getToken(messaging,
  { vapidKey: 'BCVG3-dOFvV09zxecE0uHqK1fXzIxXw0aGKzFNb9Ukzz3_jhySXEvnGMEFvsOtUgrnXAe2eOQn1aflh5LQ80ZGo' })
  .then((currentToken) => {
    if (currentToken) {
      // Send the token to your server and update the UI if necessary
      // ...
      // console.log('current token for client: ', currentToken);
      // send token to frappe server
      const fcmToken = {
        token: currentToken,
        user: getUser().name,
      }

      // console.log('doc: ', fcmToken);

      try {

        createResource({
          url: 'merabt_crm.portal_api.api.save_fcm_token',
          params: { fcm_token: currentToken },
          auto: true,
          onError(error) {
            // console.log('Error saving FCM Token2: ', error);
            toast.error(
              __('Error saving FCM Token: {0}', [String(error)]),
            )
          },

        })

      } catch (error) {
        // console.log('Error saving FCM Token: ', error);

        toast.error(
              __('Error saving FCM Token: {0}', [String(error)]),
          )
      }

    } else {

      // console.log('No registration token available. Request permission to generate one.');
      toast.info(
        __(
          'No registration token available. Request permission to generate one.'
        ),
      )
    }
    banner.closeBanner()
  }).catch((err) => {
    // ignore known permission / suspended consumer errors from FCM unsubscribe
    const msg = (err && err.message) ? String(err.message) : ''
    const code = err && err.code ? String(err.code) : ''
    if (
      code === 'messaging/token-unsubscribe-failed' ||
      msg.includes('Permission denied') ||
      msg.includes('has been suspended') ||
      msg.includes('token-unsubscribe-failed')
    ) {
      console.warn('FCM token issue (ignored):', code || msg)
      return
    }

    if (code === 'messaging/permission-blocked') {
      toast.error(
        __(
          'Notification Permission Issue:The notification permission was not granted and blocked instead. Please enable notifications permission in your browser settings.',
          [msg],
        ),
      )
      try {
        // debug: log before showing banner
        // eslint-disable-next-line no-console
        console.debug('[App] permission-blocked, showing banner', msg)
        banner.showBanner(
          __(
            'Notification Permission Issue: The notification permission was not granted and blocked instead. Please enable notifications permission in your browser settings.',
            [msg],
          ),
        )
      } catch (e) {
        console.warn('Unable to show banner for permission error', e)
      }
      return
    }

    // console.log('An error occurred while retrieving token. ', err);
    toast.error(
      __(
        'Error: {0} - {1}',
        [code || err, msg],
      ),
    )
  });

onMessage(messaging, (payload) => {
  // console.log('Message received. ', payload);

  toast.info(
    __(
      'New Notification: {0} - {1}',
      [payload.notification.title, payload.notification.body],
    ),
  )

});

const MobileLayout = defineAsyncComponent(
  () => import('./components/Layouts/MobileLayout.vue'),
)
const DesktopLayout = defineAsyncComponent(
  () => import('./components/Layouts/DesktopLayout.vue'),
)
const Layout = computed(() => {
  if (window.innerWidth < 640) {
    return MobileLayout
  } else {
    return DesktopLayout
  }
})

const showSplash = ref(true)

// Modal state for sales performance warning
const salesPerformance = ref('') // This would come from an API in a real app
const showModal = ref(false)
const modelData = ref({
  title: 'Welcome to M Nova CRM',
  message: 'Welcome to M Nova CRM! We are excited to have you on board. Explore the features and let us know if you have any questions.',
  type: 'good',
  buttons: [
    // { label: 'Update Now', action: updateNow },
    { label: 'Close', action: () => (showModal.value = false) },
  ],
})


// Use banner store for global warnings
const banner = bannerStore()
const router = useRouter()

onMounted(async () => {
  setTheme()
  try {
    await router.isReady()
  } catch (e) {
    // ignore
  }
  // small delay so the transition looks smooth
  setTimeout(() => {
    showSplash.value = false
  }, 400)
  if (import.meta.env.DEV) {
    // expose a quick debug helper to trigger the banner from console
    // eslint-disable-next-line no-console
    console.debug('[App] exposing window.showBanner for debug')
    // eslint-disable-next-line no-undef
    window.showBanner = (m) => banner.showBanner(m)
  }
})

function closeWarning() {
  banner.closeBanner()
}

// function updateNow() {
//   // Close modal for now; extend to route to billing/upgrade page if desired
//   console.log("Clicked Update Now");
  
//   showModal.value = false
// }

onMounted(async () => {
  // checking sales performance on mount

  const {settings: merabtSettings} = await _merabtSettingsResource.submit()

  if (merabtSettings.performance_banner === 0){
    return
  }

  const timeInterval = merabtSettings.performance_interval || 15 // default to 15 minutes if not set
  const good_title = merabtSettings.good_banner_title || 'Your Performance is Good'
  const good_message = merabtSettings.good_banner_content || 'Great job! Your sales performance is good. Keep up the good work and continue striving for excellence.'
  const poor_title = merabtSettings.bad_banner_title || 'Your Performance is Below Expectations'
  const poor_message = merabtSettings.bad_banner_content || 'Your sales performance is currently below the expected threshold. Please review your sales activities and take necessary actions to improve your performance.'
  
  const performance_data = await createResource({
    url: 'merabt_crm.portal_api.sales_target.get_sales_user_performance',
    auto: true,
    onError(error) {
      console.error('Error fetching sales performance:', error)
    },
  })


  interval = setInterval(() => {
    salesPerformance.value = performance_data.data

    if (salesPerformance.value === 'poor') {
      modelData.value = {
        title: poor_title,
        message: poor_message,
        type: 'bad',
        buttons: [
          { label: 'Close', action: () => (showModal.value = false) },
        ],
      }
      showModal.value = true
    } else if (salesPerformance.value === 'good' && merabtSettings.show_good_banner === 1) {
      modelData.value = {
        title: good_title,
        message: good_message,
        type: 'good',
        buttons: [
          { label: 'Close', action: () => (showModal.value = false) },
        ],
      }
      showModal.value = true
    }
    
    performance_data.submit() // re-fetch performance data
    // console.log("intrival: ",salesPerformance.value );
  
  }, timeInterval * 1000 * 60)// set interval based on settings, default to 15 minutes
})

onUnmounted(() => {
  // Clean up any intervals or listeners if needed
  clearInterval(interval)
})


setConfig('systemTimezone', window.timezone?.system || null)
setConfig('localTimezone', window.timezone?.user || null)
</script>
