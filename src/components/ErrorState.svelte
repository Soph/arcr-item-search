<script lang="ts">
  let { error }: { error: string } = $props();
</script>

<div class="flex flex-col items-center justify-center py-12 md:py-16 text-center px-4">
  <p class="text-red-400 text-base md:text-lg mb-2">Error: {error}</p>
  <p class="text-zinc-400 text-sm md:text-base">Please try refreshing the page.</p>
</div>
