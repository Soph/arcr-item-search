<script lang="ts">
  import { formatValue, formatWeight } from '../../lib/filterUtils';

  let { value, weightKg, stackSize }: {
    value: number | undefined;
    weightKg: number | undefined;
    stackSize: number | undefined;
  } = $props();
</script>

<div class="flex flex-wrap gap-3 md:gap-4 mt-2.5 text-sm md:text-base text-zinc-400">
  <span class="flex items-center gap-1.5" title="Value">
    💰 {formatValue(value)}
  </span>
  <span class="flex items-center gap-1.5" title="Weight">
    ⚖️ {formatWeight(weightKg)}
  </span>
  <span class="flex items-center gap-1.5" title="Stack size">
    📦 {stackSize ?? 'N/A'}
  </span>
</div>
