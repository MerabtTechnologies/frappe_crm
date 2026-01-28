<template>
  <div class="crm-splash" role="status" aria-live="polite">
    <div class="crm-splash__logo">
      <SplashIcon />
    </div>
    <!-- <div class="crm-splash__text">Loading CRM…</div> -->
  </div>
</template>

<script setup>
import SplashIcon from './Icons/SplashIcon.vue'
</script>

<style scoped>
.crm-splash {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #ffffff, #f8fafc);
  z-index: 9999;
}
.crm-splash__logo {
  margin-bottom: 12px;
}
.crm-splash__logo svg {
  width: 340px;
  height: auto;
  display: block;
}
.crm-splash__text {
  color: #334155;
  font-weight: 600;
}
</style>
