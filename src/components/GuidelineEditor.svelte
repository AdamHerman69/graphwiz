<script lang="ts">
	import { type Guideline, type WeightedCondition } from '../utils/guideline.svelte';
	import { type NodeSettings, type EdgeSettings } from '../utils/graphSettings.svelte';
	import ConditionEditor from './ConditionEditor.svelte';
	import RuleNodeSettings from './RuleNodeSettings.svelte';
	import RuleEdgeSettings from './RuleEdgeSettings.svelte';
	import { bin } from 'd3';
	import NodeRecommendations from './NodeRecommendations.svelte';
	import {
		nodeSettingsDefaults,
		edgeSettingsDefaults,
		layoutSettingsDefaults
	} from '../utils/graphSettings.svelte';
	import EdgeRecommendations from './EdgeRecommendations.svelte';
	import SettingsSelect from './SettingsSelect.svelte';
	import { layoutTypes, type LayoutType } from '../utils/graphSettings.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import Literature from './Literature.svelte';
	import { setContext, getContext } from 'svelte';
	import { availableAttributes } from '../utils/graph.svelte';

	let { guideline = $bindable() }: { guideline: Guideline } = $props();
	setContext('isGuidelineEditor', true);
	let { newGUIID } = getContext('graphSettings');

	type SettingType = 'layout' | 'nodeSettings' | 'edgeSettings';

	function addCondition() {
		guideline.rootCondition.condition.conditions.push({
			weight: 1,
			condition: {
				type: 'numeric',
				property: 'nodeCount',
				ideal: 0,
				tolerance: 0
			}
		});
	}

	function saveGuideline() {
		// TODO: Implement save functionality
		console.log('Saving guideline:', guideline);
	}

	function toggleSettings(setting: SettingType) {
		if (guideline.recommendations[setting]) {
			guideline.recommendations[setting] = undefined;
			console.log('toggle setting:', setting);
		} else {
			switch (setting) {
				case 'layout':
					guideline.recommendations[setting] = 'force-graph';
					console.log('layout');
					break;
				case 'nodeSettings':
					guideline.recommendations[setting] = [
						{
							...structuredClone(nodeSettingsDefaults),
							id: 1,
							priority: 0,
							source: null
						}
					];
					break;
				case 'edgeSettings':
					guideline.recommendations[setting] = [
						{
							...structuredClone(edgeSettingsDefaults),
							id: 1,
							priority: 0,
							source: null
						}
					];
					break;
			}
		}
	}

	function addRule(settings: NodeSettings[] | EdgeSettings[], type: 'node' | 'edge') {
		settings.push({
			id: newGUIID(),
			priority: settings.length + 1,
			rule: {
				id: newGUIID(),
				operator: 'AND',
				rules: [
					{
						id: newGUIID(),
						operator: '>',
						type: 'number',
						target: 'node',
						value: 0,
						property: availableAttributes.filter(
							(attribute) => attribute.owner === type && attribute.general === true
						)[0]
					}
				]
			},
			source: null
		});
	}
</script>

<div class="guideline-editor" use:autoAnimate>
	<input class="title" bind:value={guideline.name} placeholder="Guideline name" />
	<textarea
		class="description"
		bind:value={guideline.description}
		placeholder="Guideline description"
	/>

	<h3>Conditions</h3>
	{#each guideline.rootCondition.condition.conditions as weightedCondition, index}
		<ConditionEditor bind:weightedCondition={guideline.rootCondition.condition.conditions[index]} />
	{/each}
	<button onclick={addCondition}>Add Condition</button>

	<h3>Recommendations</h3>

	<div class="labelContainer p-1" use:autoAnimate>
		<div class="ruleToggleSettings">
			<button onclick={() => toggleSettings('layout')}
				><span class="material-symbols-outlined"> linked_services </span></button
			>
			<button onclick={() => toggleSettings('nodeSettings')}
				><span class="material-symbols-outlined"> masked_transitions </span></button
			>
			<button onclick={() => toggleSettings('edgeSettings')}
				><span class="material-symbols-outlined"> diagonal_line </span></button
			>
		</div>

		{#if guideline.recommendations.layout}
			<h3>Layout</h3>
			<div use:autoAnimate={{ duration: 300 }} class="flex mx-2 my-2">
				<div>ALGORITHM</div>
				<select bind:value={guideline.recommendations.layout} class="bg-transparent ml-auto">
					{#each layoutTypes as layoutType}
						<option value={layoutType}>{layoutType}</option>
					{/each}
				</select>
			</div>
		{/if}
		{#if guideline.recommendations.nodeSettings}
			<div class="flex">
				<h3>Node</h3>
				<button onclick={() => addRule(guideline.recommendations.nodeSettings!, 'node')}>
					<span class="material-symbols-outlined"> add </span>
				</button>
			</div>
			<NodeRecommendations nodeSettings={guideline.recommendations.nodeSettings!} />
		{/if}

		{#if guideline.recommendations.edgeSettings}
			<div class="flex">
				<h3>Edge</h3>
				<button onclick={() => addRule(guideline.recommendations.edgeSettings!, 'edge')}>
					<span class="material-symbols-outlined"> add </span>
				</button>
			</div>
			<EdgeRecommendations edgeSettings={guideline.recommendations.edgeSettings!} />
		{/if}
	</div>

	<!-- Literature -->
	<h3>Literature</h3>
	<Literature bind:literature={guideline.literature} editable={true} />

	<button onclick={saveGuideline}>Save Guideline</button>
</div>

<style>
	.guideline-editor {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow: scroll;
	}

	input,
	textarea {
		width: 100%;
		background-color: transparent;
	}

	.title {
		font-size: 1.25rem;
		font-weight: bold;
	}

	.description {
		font-size: 1rem;
	}

	/* button {
		padding: 0.5rem 1rem;
		background-color: #f0f0f0;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	} */
	/* 
	button:hover {
		background-color: #e0e0e0;
	} */
</style>
