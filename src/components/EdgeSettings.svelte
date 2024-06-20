<script lang="ts">
	import { graphSettings, newGUIID } from '../utils/graphSettings.svelte';
	import SettingsHeader from './SettingsHeader.svelte';
	import RuleSettings from './RuleNodeSettings.svelte';
	import SettingsSliderMultiple from './SettingsSliderMultiple.svelte';
	import SettingsSlider from './SettingsSlider.svelte';
	import SettingsColor from './SettingsColor.svelte';
	import SettingsEdgeLabel from './SettingsEdgeLabel.svelte';
	import RuleEdgeSettings from './RuleEdgeSettings.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import { setContext } from 'svelte';
	import { availableAttributes } from '../utils/graph.svelte';

	let collapsed = $state(false);

	setContext('type', 'edge');

	function addRule() {
		graphSettings.edgeSettings.push({
			id: newGUIID(),
			priority: graphSettings.edgeSettings.length + 1,
			rule: {
				id: newGUIID(),
				operator: 'AND',
				rules: [
					{
						id: newGUIID(),
						operator: '>',
						type: 'number',
						target: 'edge',
						value: 0,
						property: availableAttributes.filter((attribute) => attribute.owner === 'edge')[0]
					}
				]
			},
			source: null
		});
	}
</script>

<div use:autoAnimate={{ duration: 300 }}>
	{#each graphSettings.edgeSettings as setting, index (setting.id)}
		{#if index === 0}
			<div class="card cardSpacing">
				<SettingsHeader title="edge" bind:collapsed />
				<!-- Settings -->
				{#if !collapsed}
					<!-- TODO Edge Type -->
					<SettingsSlider numSettings={setting.width!} />
					<SettingsSliderMultiple
						name="Partial Edge"
						numSettings={[graphSettings.edgeSettings[0].partialStart!, graphSettings.edgeSettings[0].partialEnd!]}
					/>
					<SettingsColor colorSetting={setting.color!} />
					<!-- TODO Decorators -->
					<SettingsEdgeLabel labels={setting.labels!} />
				{/if}
			</div>
		{:else}
			<div class="card cardSpacing">
				<RuleEdgeSettings edgeSettings={setting} />
			</div>
		{/if}
	{/each}
</div>

<!-- Add rule button -->
<div class="flex justify-center">
	<div class="card buttonSpacing w-14">
		<button onclick={addRule} class="flex items-center justify-center w-full h-full">
			<span class="material-symbols-outlined">add</span>
		</button>
	</div>
</div>
