<template>
  <div class="w-screen h-screen flex flex-col overflow-hidden bg-surface-50 dark:bg-surface-950">
    <Header class="w-full h-16 shrink-0" />
    <Main class="w-full flex-1 min-h-0 overflow-hidden" />
  </div>
</template>

<script setup lang="ts">
import Header from "./header/index.vue"
import Main from "./main/index.vue"
</script>

<style lang="scss" scoped></style>