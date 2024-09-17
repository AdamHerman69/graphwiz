<script lang="ts">
	import { GraphSettingsClass } from '../utils/graphSettings.svelte';
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
	import SettingsSelect from './SettingsSelect.svelte';
	import { getContext } from 'svelte';

	let { side }: { side: 'left' | 'right' } = $props();
	setContext('side', side);

	let graphSettings: GraphSettingsClass = getContext('graphSettings');

	let collapsed = $state(false);

	setContext('type', 'edge');

	function addRule() {
		graphSettings.graphSettings.edgeSettings.push({
			id: graphSettings.newGUIID(),
			priority: graphSettings.graphSettings.edgeSettings.length + 1,
			rule: {
				id: graphSettings.newGUIID(),
				operator: 'AND',
				rules: [
					{
						id: graphSettings.newGUIID(),
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

	// Reverse the order of the node settings (we have to render them in reverse order because of stacking context and select dropdowns)
	let reverseIndexes = $derived.by(() => {
		return graphSettings.graphSettings.edgeSettings.map(
			(setting, index) => graphSettings.graphSettings.edgeSettings.length - index - 1
		);
	});
</script>

<div class="reverse mb-8">
	<!-- Add rule button -->
	<div class="flex justify-center addRuleWrapper">
		<div class="card buttonSpacing addRuleButton">
			<button onclick={addRule} class="flex items-center justify-center w-full h-full">
				<span class="material-symbols-outlined">add</span>
				<!-- add conditional styles -->
			</button>
		</div>
	</div>

	<div class="reverse" use:autoAnimate={{ duration: 300 }}>
		{#each reverseIndexes as index (graphSettings.graphSettings.edgeSettings[index].id)}
			{#if index === 0}
				<div use:autoAnimate={{ duration: 300 }} class="card cardSpacing settingContainer">
					<SettingsHeader title="edge" bind:collapsed />
					<!-- Settings -->
					{#if !collapsed}
						<SettingsSelect selectSetting={graphSettings.graphSettings.edgeSettings[index].type!} />
						<SettingsSlider numSettings={graphSettings.graphSettings.edgeSettings[index].width!} />
						<SettingsSliderMultiple
							name="Partial Edge"
							numSettings={[graphSettings.graphSettings.edgeSettings[0].partialStart!, graphSettings.graphSettings.edgeSettings[0].partialEnd!]}
						/>
						<SettingsColor colorSetting={graphSettings.graphSettings.edgeSettings[index].color!} />

						<!-- TODO Decorators -->
						<SettingsEdgeLabel labels={graphSettings.graphSettings.edgeSettings[index].labels!} />
					{/if}
				</div>
			{:else}
				<div class="card cardSpacing">
					<RuleEdgeSettings edgeSettings={graphSettings.graphSettings.edgeSettings[index]} />
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

	.addRuleWrapper {
		height: 25px;
		transition: all 0.3s ease;
		pointer-events: auto;
		margin-top: -9px;
	}

	.addRuleButton {
		transition: all 0.3s ease;
		width: 250px;
		height: 30px;
		margin-top: -18px;
	}

	.addRuleButton button {
		text-transform: uppercase;
	}

	.addRuleWrapper:hover {
		height: 50px;
	}

	.addRuleWrapper:hover .addRuleButton {
		width: 100%;
		margin-top: 10px;
	}
</style>
