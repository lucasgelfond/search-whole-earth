<script lang="ts">
import { isDarkMode, toggleTheme } from '$lib';
</script>

<button
  aria-label="Toggle theme"
  class="relative w-12 h-6 rounded-full border border-black dark:border-white transition-colors cursor-pointer {$isDarkMode ? 'bg-white/20' : 'bg-black/10'}"
  on:click={toggleTheme}
>
  <span
    class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-200 {$isDarkMode ? 'translate-x-6 bg-white' : 'translate-x-0 bg-black'}"
  ></span>
</button>
