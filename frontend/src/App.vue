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
import { computed, defineAsyncComponent, onErrorCaptured, onMounted, ref } from 'vue'
import { bannerStore } from '@/stores/banner'
import { useRouter } from 'vue-router'

import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { toast, createResource } from 'frappe-ui'
import { usersStore } from '@/stores/users'

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
      // TODO: Show permission request UI

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

setConfig('systemTimezone', window.timezone?.system || null)
setConfig('localTimezone', window.timezone?.user || null)
</script>
