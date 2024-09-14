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
	import { graph } from 'graphology-metrics';

	let { side }: { side: 'left' | 'right' } = $props();
	setContext('side', side);

	setContext('type', 'node');

	let graphSettings: GraphSettingsClass = getContext('graphSettings');
	let collapsed = $state(false);

	function addRule() {
		console.log('addRule');
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

	// Reverse the order of the node settings (we have to render them in reverse order because of stacking context and select dropdowns)
	let reverseIndexes = $derived.by(() => {
		return graphSettings.graphSettings.nodeSettings.map(
			(setting, index) => graphSettings.graphSettings.nodeSettings.length - index - 1
		);
	});
</script>

<div class="reverse">
	<!-- Add rule button -->
	<div class="flex justify-center">
		<div class="card buttonSpacing w-14">
			<button onclick={addRule} class="flex items-center justify-center w-full h-full">
				<span class="material-symbols-outlined">add</span>
			</button>
		</div>
	</div>

	<div class="reverse" use:autoAnimate={{ duration: 300 }}>
		{#each reverseIndexes as index (graphSettings.graphSettings.nodeSettings[index].id)}
			{#if index === 0}
				<div use:autoAnimate={{ duration: 300 }} class="card cardSpacing">
					<SettingsHeader title="node" bind:collapsed />
					<!-- Settings -->
					{#if !collapsed}
						<SettingsSelect
							selectSetting={graphSettings.graphSettings.nodeSettings[index].shape!}
						/>
						<SettingsSlider numSettings={graphSettings.graphSettings.nodeSettings[index].size!} />
						<SettingsColor colorSetting={graphSettings.graphSettings.nodeSettings[index].color!} />
						<SettingsSlider
							numSettings={graphSettings.graphSettings.nodeSettings[index].strokeWidth!}
						/>
						<SettingsColor
							colorSetting={graphSettings.graphSettings.nodeSettings[index].strokeColor!}
						/>
						<SettingsNodeLabel labels={graphSettings.graphSettings.nodeSettings[index].labels!} />
					{/if}
				</div>
			{:else}
				<div class="card cardSpacing">
					<RuleNodeSettings nodeSettings={graphSettings.graphSettings.nodeSettings[index]} />
				</div>
			{/if}
		{/each}
	</div>
</div>

<style>
	.reverse {
		display: flex;
		flex-direction: column-reverse;
	}
</style>
