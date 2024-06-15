<script lang="ts">
	import { nodeSettings } from '../utils/graphSettings.svelte';
	import RuleSettings from './RuleSettings.svelte';
	import SettingsHeader from './SettingsHeader.svelte';
	import SettingsSlider from './SettingsSlider.svelte';
	import SettingsColor from './SettingsColor.svelte';

	let collapsed = $state(false);

	function addRule() {}
</script>

<div class="card">
	{#each nodeSettings as setting, index}
		{#if index === 0}
			<SettingsHeader title="node" {collapsed} />
			<!-- Settings -->
			{#if !collapsed}
				<SettingsSlider numSettings={setting.size!} />
				<SettingsColor colorSetting={setting.color!} />
				<SettingsSlider numSettings={setting.strokeWidth!} />
				<SettingsColor colorSetting={setting.strokeColor!} />
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
