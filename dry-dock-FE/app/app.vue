<script setup lang="ts">
useHead({
  titleTemplate: (chunk?: string) =>
    chunk && chunk !== "Dry Dock" ? `${chunk} · Dry Dock` : "Dry Dock",
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
