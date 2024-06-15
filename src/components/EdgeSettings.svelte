<script lang="ts">
	import { edgeSettings } from '../utils/graphSettings.svelte';
	import SettingsHeader from './SettingsHeader.svelte';
	import RuleSettings from './RuleSettings.svelte';
	import SettingsSliderMultiple from './SettingsSliderMultiple.svelte';
	import SettingsSlider from './SettingsSlider.svelte';
	import SettingsColor from './SettingsColor.svelte';

	let collapsed = $state(false);

	function addRule() {}
</script>

<div class="card">
	{#each edgeSettings as setting, index}
		{#if index === 0}
			<SettingsHeader title="edge" {collapsed} />
			<!-- Settings -->
			{#if !collapsed}
				<SettingsSlider numSettings={setting.width!} />
				<SettingsSliderMultiple
					name="Partial Edge"
					numSettings={[edgeSettings[0].partialStart!, edgeSettings[0].partialEnd!]}
				/>
				<SettingsColor colorSetting={setting.color!} />
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
