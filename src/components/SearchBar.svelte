<script lang="ts">
  let { value = $bindable(''), focused = $bindable(false) }: {
    value: string;
    focused: boolean;
  } = $props();

  let inputRef: HTMLInputElement;

  export function focus() {
    if (inputRef) {
      inputRef.focus();
    }
  }
</script>

<div class="sticky top-0 bg-zinc-950 py-4 z-10">
  <input
    bind:this={inputRef}
    bind:value
    type="text"
    placeholder="Search items by name..."
    class="w-full px-5 py-4 md:px-6 md:py-4 bg-zinc-900 border-2 border-zinc-700
           rounded-lg text-zinc-100 placeholder-zinc-500 text-base md:text-lg
           focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20
           transition-[border-color,box-shadow,transform] duration-200 active:scale-[0.995]"
    onfocus={() => focused = true}
    onblur={() => focused = false}
  />
</div>
