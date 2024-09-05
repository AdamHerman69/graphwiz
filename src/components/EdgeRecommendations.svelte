<script lang="ts">
	import { type EdgeSettingsName, edgeSettingsDefaults } from '../utils/graphSettings.svelte';
	import { type GraphSettings, type EdgeSettings } from '../utils/graphSettings.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import Rules from './Rules.svelte';
	import SettingsSlider from './SettingsSlider.svelte';
	import SettingsColor from './SettingsColor.svelte';
	import SettingsEdgeLabel from './SettingsEdgeLabel.svelte';
	import SettingsSliderMultiple from './SettingsSliderMultiple.svelte';
	import { edge } from 'graphology-metrics';

	let { edgeSettings }: { edgeSettings: EdgeSettings[] } = $props();

	function toggleSetting(edgeSettings: EdgeSettings, setting: EdgeSettingsName) {
		// todo can't reassign! going to be the same object
		console.log('toggle setting:', setting);
		console.log(edgeSettings);
		edgeSettings[setting] = edgeSettings[setting]
			? undefined
			: structuredClone(edgeSettingsDefaults[setting]);
		console.log(edgeSettings);
	}

	let noGlobalSettings: boolean = $derived(
		edgeSettings.find((es) => es.rule === undefined) === undefined
	);
</script>

{#snippet edgeSettingsEditor(edgeSettings: EdgeSettings, deleteFunction: () => void)}
	<div>
		{#if edgeSettings.rule}
			<!-- Rule can be deleted only if there are no global settings present (settings without a rule) -->
			<Rules
				rule={edgeSettings.rule}
				type="edge"
				deleteFunction={noGlobalSettings ? () => (edgeSettings.rule = undefined) : undefined}
			/>
		{/if}
	</div>
	<div class="ruleToggleSettings">
		<button
			onclick={() => toggleSetting(edgeSettings, 'width')}
			class={edgeSettings['width'] ? 'active' : ''}
		>
			<span class="material-symbols-outlined"> line_weight </span>
		</button>

		<button
			onclick={() => {
				toggleSetting(edgeSettings, 'partialStart');
				toggleSetting(edgeSettings, 'partialEnd');
			}}
			class={edgeSettings['partialStart'] ? 'active' : ''}
		>
			<span class="material-symbols-outlined"> step_into </span>
		</button>

		<button
			onclick={() => toggleSetting(edgeSettings, 'color')}
			class={edgeSettings['color'] ? 'active' : ''}
		>
			<span class="material-symbols-outlined"> palette </span>
		</button>

		<button
			onclick={() => toggleSetting(edgeSettings, 'decorators')}
			class={edgeSettings['decorators'] ? 'active' : ''}
		>
			<span class="material-symbols-outlined"> interests </span>
		</button>

		<button
			onclick={() => toggleSetting(edgeSettings, 'labels')}
			class={edgeSettings['labels'] ? 'active' : ''}
		>
			<span class="material-symbols-outlined"> label </span>
		</button>
	</div>

	<div use:autoAnimate={{ duration: 300 }} class="settingsContainer">
		{#if edgeSettings.width}
			<div>
				<SettingsSlider numSettings={edgeSettings.width} />
			</div>
		{/if}

		{#if edgeSettings.partialStart && edgeSettings.partialEnd}
			<SettingsSliderMultiple
				name="Partial Edge"
				numSettings={[edgeSettings.partialStart, edgeSettings.partialEnd]}
			/>
		{/if}

		{#if edgeSettings.color}
			<div>
				<SettingsColor colorSetting={edgeSettings.color} />
			</div>
		{/if}

		{#if edgeSettings.decorators}
			<div>decorators</div>
		{/if}

		{#if edgeSettings.labels}
			<div>
				<SettingsEdgeLabel labels={edgeSettings.labels} />
			</div>
		{/if}
	</div>

	<div>
		<button onclick={deleteFunction}><span class="material-symbols-outlined"> close </span></button>
	</div>
{/snippet}

<div class="relative" use:autoAnimate>
	{#each edgeSettings as es, index (es.id)}
		{@render edgeSettingsEditor(es, () => edgeSettings.splice(index, 1))}
	{/each}
</div>

<style>
	.settingsContainer > * {
		margin-bottom: 5px;
	}

	.deleteRuleButton {
		position: absolute;
		padding: 0;
		margin: 0;
		width: 24px;
		height: 24px;

		display: flex;
		align-items: center;
		justify-content: center;

		/* left: -48px; */
		top: -16px;
	}
</style>
