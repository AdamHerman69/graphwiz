<script lang="ts">
	import type { SelectSetting } from '../utils/graphSettings.svelte';

	let { selectSetting }: { selectSetting: SelectSetting } = $props();
</script>

<div class="flex justify-between items-center">
	<div class="text-m uppercase">
		{selectSetting.name}

		<!-- {numSettings.source} -->
	</div>
	<div class="flex justify-end items-center">
		<select bind:value={selectSetting.value} class="bg-transparent">
			{#each selectSetting.values as value}
				<option {value}>{value}</option>
			{/each}
		</select>
	</div>
</div>
