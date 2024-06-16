<script lang="ts">
	import { graphSettings } from '../utils/graphSettings.svelte';
	import SettingsHeader from './SettingsHeader.svelte';

	let collapsed = $state(false);
</script>

<div class="card">
	<SettingsHeader title="layout" bind:collapsed />
	{#if !collapsed}
		<div class="flex mx-2 my-2">
			<div>ALGORITHM</div>
			<select bind:value={graphSettings.layout.value} class="bg-transparent ml-auto">
				{#each graphSettings.layout.values as val}
					<option value={val}>{val}</option>
				{/each}
			</select>
		</div>
	{/if}
</div>
