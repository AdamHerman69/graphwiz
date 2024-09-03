<script lang="ts">
	import { type EdgeSettingsName, edgeSettingsDefaults } from '../utils/graphSettings.svelte';
	import { type GraphSettings, type EdgeSettings } from '../utils/graphSettings.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import Rules from './Rules.svelte';
	import SettingsSlider from './SettingsSlider.svelte';
	import SettingsColor from './SettingsColor.svelte';
	import SettingsEdgeLabel from './SettingsEdgeLabel.svelte';
	import SettingsSliderMultiple from './SettingsSliderMultiple.svelte';

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

	let showRules = $state(edgeSettings.map(() => false));
</script>

{#snippet edgeSettingsEditor(edgeSettings: EdgeSettings, showRule: boolean)}
	<div>
		{#if showRule}
			<Rules rule={edgeSettings.rule} type="edge" />
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
{/snippet}

<div class="relative">
	{#each edgeSettings as ns, index}
		{@render edgeSettingsEditor(ns, showRules[index])}
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
