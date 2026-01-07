<template>
  <FrappeUIProvider>
    <NotPermitted v-if="$route.name === 'Not Permitted'" />
    <Layout class="isolate" v-else-if="session().isLoggedIn">
      <router-view :key="$route.fullPath" />
    </Layout>
    <Dialogs />
  </FrappeUIProvider>
</template>

<script setup>
import NotPermitted from '@/pages/NotPermitted.vue'
import { Dialogs } from '@/utils/dialogs'
import { sessionStore as session } from '@/stores/session'
import { setTheme } from '@/stores/theme'
import { FrappeUIProvider, setConfig } from 'frappe-ui'
import { computed, defineAsyncComponent, onErrorCaptured, onMounted } from 'vue'

import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { toast, createResource} from 'frappe-ui'
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
const app = initializeApp(firebaseConfig);

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
      console.log('current token for client: ', currentToken);
      // send token to frappe server
      const fcmToken = {
        token: currentToken,
        user: getUser().name,
      }
      
      // console.log('doc: ', fcmToken);
    
      try {

        createResource({
          url: 'merabt_crm.portal_api.api.create_new_doc',
          params: { args: fcmToken, doctype: 'Merabt FCM Token' },
          auto: true,
          onError(err) {
            // console.log('Error saving FCM Token2: ', err);

          },
          
        })
      } catch (error) {
        // console.log('Error saving FCM Token: ', error);
        
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
}).catch((err) => {
  // console.log('An error occurred while retrieving token. ', err);
  toast.error(
        __(
          'Error retrieving notification token: {0} - {1}',
          [err.code, err.message],
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

onMounted(() => setTheme())

setConfig('systemTimezone', window.timezone?.system || null)
setConfig('localTimezone', window.timezone?.user || null)
</script>
