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
	import {
		layoutTypes,
		type LayoutType,
		type EdgeLayoutType,
		edgeLayoutTypes
	} from '../utils/graphSettings.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import Literature from './Literature.svelte';
	import { setContext, getContext } from 'svelte';
	import { availableAttributes } from '../utils/graph.svelte';
	import CustomSelect from './GUI/CustomSelect.svelte';

	let {
		guideline = $bindable(),
		saveFunction
	}: { guideline: Guideline; saveFunction: () => void } = $props();
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

	function toggleSettings(setting: SettingType) {
		if (guideline.recommendations[setting]) {
			guideline.recommendations[setting] = undefined;
			console.log('toggle setting:', setting);
		} else {
			switch (setting) {
				case 'layout':
					guideline.recommendations.layout = {
						...structuredClone(layoutSettingsDefaults)
					};
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

<div class="grid-container">
	<div class="grid" use:autoAnimate>
		<input class="title" bind:value={guideline.name} placeholder="Guideline name" />
		<textarea
			class="description"
			bind:value={guideline.description}
			placeholder="Guideline description"
		></textarea>

		<div>
			<h3>Conditions</h3>
			<ConditionEditor bind:weightedCondition={guideline.rootCondition} />
		</div>

		<div>
			<!-- Literature -->
			<h3>Literature</h3>
			<Literature bind:literature={guideline.literature} editable={true} />
		</div>

		<div class="recommendations">
			<div class="flex justify-between items-center">
				<h3>Vizualization settings</h3>

				<!-- class:labelContainer={guideline.recommendations.layout ||
			guideline.recommendations.nodeSettings ||
			guideline.recommendations.edgeSettings} -->
				<div class="settingToggleButtons">
					<button
						onclick={() => toggleSettings('layout')}
						class:active={guideline.recommendations.layout}
					>
						<span class="material-symbols-outlined"> linked_services </span>
					</button>
					<button
						onclick={() => toggleSettings('nodeSettings')}
						class:active={guideline.recommendations.nodeSettings}
					>
						<span class="material-symbols-outlined"> masked_transitions </span>
					</button>
					<button
						onclick={() => toggleSettings('edgeSettings')}
						class:active={guideline.recommendations.edgeSettings}
					>
						<span class="material-symbols-outlined"> diagonal_line </span>
					</button>
				</div>
			</div>

			<div class="p-1 recommendationsGrid" use:autoAnimate>
				{#if guideline.recommendations.layout}
					<div class="recommendatioContainer">
						<h4>Layout</h4>
						<div>
							<div class="flex my-2 justify-between">
								<SettingsSelect selectSetting={guideline.recommendations.layout.type} />
							</div>

							<div class="flex my-2 justify-between">
								<SettingsSelect selectSetting={guideline.recommendations.layout.edgeType} />
							</div>
						</div>
					</div>
				{/if}

				{#if guideline.recommendations.nodeSettings}
					<div class="recommendatioContainer">
						<div class="flex justify-between">
							<h4>Node</h4>
							<button
								class="buttonGeneral"
								onclick={() => addRule(guideline.recommendations.nodeSettings!, 'node')}
							>
								<span class="material-symbols-outlined"> add </span>
							</button>
						</div>
						<NodeRecommendations nodeSettings={guideline.recommendations.nodeSettings!} />
					</div>
				{/if}

				{#if guideline.recommendations.edgeSettings}
					<div class="recommendatioContainer">
						<div class="flex justify-between">
							<h4>Edge</h4>
							<button
								class="buttonGeneral"
								onclick={() => addRule(guideline.recommendations.edgeSettings!, 'edge')}
							>
								<span class="material-symbols-outlined"> add </span>
							</button>
						</div>
						<EdgeRecommendations edgeSettings={guideline.recommendations.edgeSettings!} />
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
<div class="saveButton">
	<button class="card" onclick={saveFunction}>Save Guideline</button>
</div>

<style>
	/* .guideline-editor {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow-y: scroll;
		overflow-x: hidden;
	} */

	input,
	textarea {
		width: 100%;
		background-color: transparent;
		field-sizing: content;
	}

	textarea {
		min-height: 60px;
		border-radius: 12px;
		padding: 10px;
		margin: -10px;
		outline: none;
	}

	/* textarea:focus {
		box-shadow: inset 0 0 20px 0px rgba(0, 0, 0, 0.1);
	} */

	.title {
		font-size: 30px;
		font-weight: bold;
	}

	.description {
		font-size: 18px;
		font-style: italic;
	}

	h3 {
		font-size: 20px;
		font-weight: 600;
		text-transform: uppercase;
		padding: 20px 0px;
	}

	h4 {
		font-size: 25px;
		font-weight: 600;
		text-transform: uppercase;
		font-style: italic;
		padding: 10px 0px;
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

	.grid-container {
		container-type: inline-size;
		container-name: grid;
		width: 100%;
		height: 100%;
	}

	/* Default card layout */
	.grid {
		width: 100%;
		height: 100%;
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
		overflow-y: scroll;
		padding: 1rem;
	}

	/* Card layout for larger containers */
	@container grid (min-width: 700px) {
		.grid {
			grid-template-columns: 1fr 1fr;
		}

		.recommendations,
		.title,
		.description {
			grid-column: span 2;
		}
	}

	.recommendations .recommendationsGrid {
		display: flex;
		width: 100%;
		/* flex-direction: row-reverse; */
		gap: 3rem;
		flex-wrap: wrap;
	}

	.recommendatioContainer {
		flex: 1;
		max-width: 50%;
		min-width: 200px;
	}

	.settingToggleButtons {
		display: flex;
		padding: 0.5rem;
		gap: 10px;
	}

	.settingToggleButtons button {
		border-radius: 12px;
		width: 40px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease-in-out;
	}

	.settingToggleButtons button.active {
		box-shadow: inset 0 0 10px 0px rgba(0, 0, 0, 0.1);
	}

	.settingToggleButtons button:not(.active) {
		box-shadow: 0 0 10px 0px rgba(0, 0, 0, 0.1);
	}

	.settingToggleButtons button span {
		font-size: 18px;
	}

	.saveButton {
		width: 100%;
		display: flex;
		justify-content: center;
		padding: 1rem;
		margin-top: 1rem;
	}

	.saveButton button {
		width: 180px;
		padding: 0.5rem 1rem;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
		font-size: 16px;
		text-transform: uppercase;
		font-weight: 600;
	}

	.saveButton button:hover {
		width: 200px;
	}
</style>
