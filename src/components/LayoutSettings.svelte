<script lang="ts">
	import { layoutSettings } from '../utils/graphSettings.svelte';
	import SettingsHeader from './SettingsHeader.svelte';

	let collapsed = $state(false);
</script>

<div class="card">
	<SettingsHeader title="layout" {collapsed} />
	{#if !collapsed}
		<div class="flex mx-2 my-2">
			<div>ALGORITHM</div>
			<select bind:value={layoutSettings.value} class="bg-transparent ml-auto">
				{#each layoutSettings.values as val}
					<option value={val}>{val}</option>
				{/each}
			</select>
		</div>
	{/if}
</div>
