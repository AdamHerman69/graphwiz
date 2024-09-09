<script lang="ts">
	import { GraphSettingsClass } from '../utils/graphSettings.svelte';
	import RuleNodeSettings from './RuleNodeSettings.svelte';
	import SettingsHeader from './SettingsHeader.svelte';
	import SettingsSlider from './SettingsSlider.svelte';
	import SettingsColor from './SettingsColor.svelte';
	import SettingsNodeLabel from './SettingsNodeLabel.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import { setContext } from 'svelte';
	import { availableAttributes } from '../utils/graph.svelte';
	import { getContext } from 'svelte';
	import SettingsSelect from './SettingsSelect.svelte';

	let { side }: { side: 'left' | 'right' } = $props();
	setContext('side', side);

	setContext('type', 'node');

	let graphSettings: GraphSettingsClass = getContext('graphSettings');
	let collapsed = $state(false);

	function addRule() {
		graphSettings.graphSettings.nodeSettings.push({
			id: graphSettings.newGUIID(),
			priority: graphSettings.graphSettings.nodeSettings.length + 1,
			rule: {
				id: graphSettings.newGUIID(),
				operator: 'AND',
				rules: [
					{
						id: graphSettings.newGUIID(),
						operator: '>',
						type: 'number',
						target: 'node',
						value: 0,
						property: availableAttributes.filter((attribute) => attribute.owner === 'node')[0]
					}
				]
			},
			source: null
		});
	}
</script>

<div use:autoAnimate={{ duration: 300 }}>
	{#each graphSettings.graphSettings.nodeSettings as setting, index (setting.id)}
		{#if index === 0}
			<div use:autoAnimate={{ duration: 300 }} class="card cardSpacing">
				<SettingsHeader title="node" bind:collapsed />
				<!-- Settings -->
				{#if !collapsed}
					<SettingsSelect selectSetting={setting.shape!} />
					<SettingsSlider numSettings={setting.size!} />
					<SettingsColor colorSetting={setting.color!} />
					<SettingsSlider numSettings={setting.strokeWidth!} />
					<SettingsColor colorSetting={setting.strokeColor!} />
					<SettingsNodeLabel labels={setting.labels!} />
				{/if}
			</div>
		{:else}
			<div class="card cardSpacing">
				<RuleNodeSettings nodeSettings={setting} />
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
