<template>
  <div class="bg-zinc-900">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import "../assets/css/main.css";
import { useAuth } from "../auth";

console.log(useAuth())



</script>