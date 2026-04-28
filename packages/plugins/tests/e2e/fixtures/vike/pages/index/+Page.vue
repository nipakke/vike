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
    {{ testPlugin.msg }}
  </div>
</template>

<script lang="ts" setup>
import { useTestPlugin } from '../../plugins/test-plugin';
import Counter from './Counter.vue'


const testPlugin = useTestPlugin()

</script>
