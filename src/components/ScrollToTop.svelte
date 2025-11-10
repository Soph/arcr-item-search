<script lang="ts">
  import { onMount } from 'svelte';

  let visible = $state(false);

  onMount(() => {
    const handleScroll = () => {
      visible = window.scrollY > 500;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  });

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
</script>

{#if visible}
  <button
    onclick={scrollToTop}
    class="fixed bottom-6 right-6 z-50 p-4 bg-violet-600 hover:bg-violet-500 active:bg-violet-700
           text-white rounded-full shadow-lg hover:shadow-xl active:scale-95
           transition-[background-color,box-shadow,transform] duration-200 border-2 border-violet-400"
    aria-label="Scroll to top"
    title="Scroll to top"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  </button>
{/if}
