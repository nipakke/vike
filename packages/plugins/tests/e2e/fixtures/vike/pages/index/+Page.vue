<template>
  <h1>Welcome</h1>
  This page is:
  <ul>
    <li>Rendered to HTML.</li>
    <li>Interactive.
      <Counter />
    </li>
  </ul>

  <div>
    hello from {{ isClient ? 'client' : 'server' }}
  </div>
</template>

<script lang="ts" setup>
import { usePageContext } from '../../renderer/usePageContext';
import Counter from './Counter.vue'

const pageContext = usePageContext()
const isClient = pageContext.value?.isClientSide
</script>
