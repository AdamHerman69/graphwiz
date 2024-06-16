<script lang="ts">
	import { type EdgeSettingsName, edgeSettingsDefaults } from '../utils/graphSettings.svelte';
	import { graphSettings, type EdgeSettings } from '../utils/graphSettings.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import Rules from './Rules.svelte';
	import SettingsSlider from './SettingsSlider.svelte';
	import SettingsColor from './SettingsColor.svelte';
	import SettingsEdgeLabel from './SettingsEdgeLabel.svelte';
	import SettingsSliderMultiple from './SettingsSliderMultiple.svelte';

	let { edgeSettings }: { edgeSettings: EdgeSettings } = $props();

	function toggleSetting(setting: EdgeSettingsName) {
		edgeSettings[setting] = edgeSettings[setting] ? undefined : edgeSettingsDefaults[setting];
	}

	// delete self
	function deleteRuleSettings() {
		const index = graphSettings.edgeSettings.findIndex((es) => es === edgeSettings);
		if (index !== -1) {
			graphSettings.edgeSettings.splice(index, 1);
		}
	}
</script>

<div class="relative">
	<!-- Delete rules button -->
	<div class="settingsCard p-0 absolute -left-6 m-0 w-6 h-6 flex items-center justify-center">
		<button onclick={deleteRuleSettings}>
			<span class="material-symbols-outlined text-base"> close </span>
		</button>
	</div>

	<div class="settingsCard p-4 m-2">
		<Rules rule={edgeSettings.rule} />
		<div class="ruleToggleSettings">
			<button onclick={() => toggleSetting('width')} class={edgeSettings['width'] ? 'active' : ''}>
				<span class="material-symbols-outlined"> line_weight </span>
			</button>

			<button
				onclick={() => {
					toggleSetting('partialStart');
					toggleSetting('partialEnd');
				}}
				class={edgeSettings['partialStart'] ? 'active' : ''}
			>
				<span class="material-symbols-outlined"> step_into </span>
			</button>

			<button onclick={() => toggleSetting('color')} class={edgeSettings['color'] ? 'active' : ''}>
				<span class="material-symbols-outlined"> palette </span>
			</button>

			<button
				onclick={() => toggleSetting('decorators')}
				class={edgeSettings['decorators'] ? 'active' : ''}
			>
				<span class="material-symbols-outlined"> interests </span>
			</button>

			<button
				onclick={() => toggleSetting('labels')}
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
	</div>
</div>

<style>
	.settingsContainer > * {
		margin-bottom: 5px;
	}
</style>
