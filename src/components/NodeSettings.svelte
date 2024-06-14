<script lang="ts">
	import { nodeSettings } from '../utils/graphSettings.svelte';
	import RuleSettings from './RuleSettings.svelte';
	import SettingsHeader from './SettingsHeader.svelte';

	let collapsed = $state(false);

	function addRule() {}
</script>

<div class="card">
	{#each nodeSettings as setting, index}
		{#if index === 0}
			<SettingsHeader title="node" {collapsed} />
			<!-- Settings -->
			{#if !collapsed}
				settings here
			{/if}
		{:else}
			<RuleSettings />
		{/if}
	{/each}
</div>

<!-- Add rule button -->
<div class="flex justify-center">
	<div class="card w-14">
		<button onclick={addRule} class="flex items-center justify-center w-full h-full">
			<span class="material-symbols-outlined">add</span>
		</button>
	</div>
</div>
