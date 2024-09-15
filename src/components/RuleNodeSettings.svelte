<script lang="ts">
	import { type NodeSettingsName, nodeSettingsDefaults } from '../utils/graphSettings.svelte';
	import { type GraphSettings, type NodeSettings } from '../utils/graphSettings.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import Rules from './Rules.svelte';
	import SettingsSlider from './SettingsSlider.svelte';
	import SettingsColor from './SettingsColor.svelte';
	import SettingsNodeLabel from './SettingsNodeLabel.svelte';
	import SettingsSelect from './SettingsSelect.svelte';
	import { getContext } from 'svelte';

	let { graphSettings }: { graphSettings: GraphSettings } = getContext('graphSettings');
	let side: 'left' | 'right' = getContext('side');

	let { nodeSettings }: { nodeSettings: NodeSettings } = $props();

	function toggleSetting(setting: NodeSettingsName) {
		// todo can't reassign! going to be the same object
		nodeSettings[setting] = nodeSettings[setting]
			? undefined
			: structuredClone(nodeSettingsDefaults[setting]);
	}

	// delete self
	function deleteRuleSettings() {
		const index = graphSettings.nodeSettings.findIndex((ns) => ns === nodeSettings);
		if (index !== -1) {
			graphSettings.nodeSettings.splice(index, 1);
		}
	}
</script>

<!-- TODO Reverse because of stacking context -->

<div class="relative">
	<!-- Delete rules button -->
	<div class="card deleteRuleButton" style={side === 'right' ? 'left: -48px;' : 'right: -48px;'}>
		<button onclick={deleteRuleSettings}>
			<span class="material-symbols-outlined text-base"> close </span>
		</button>
	</div>

	<div class="reverse">
		<div use:autoAnimate={{ duration: 300 }} class="settingsContainer">
			{#if nodeSettings.shape}
				<div>
					<SettingsSelect selectSetting={nodeSettings.shape} />
				</div>
			{/if}
			{#if nodeSettings.size}
				<div>
					<SettingsSlider numSettings={nodeSettings.size} />
				</div>
			{/if}

			{#if nodeSettings.strokeWidth}
				<div>
					<SettingsSlider numSettings={nodeSettings.strokeWidth} />
				</div>
			{/if}

			{#if nodeSettings.color}
				<div>
					<SettingsColor colorSetting={nodeSettings.color} />
				</div>
			{/if}

			{#if nodeSettings.strokeColor}
				<div>
					<SettingsColor colorSetting={nodeSettings.strokeColor} />
				</div>
			{/if}

			{#if nodeSettings.labels}
				<div>
					<SettingsNodeLabel labels={nodeSettings.labels} />
				</div>
			{/if}
		</div>
		<div class="ruleToggleSettings">
			<button onclick={() => toggleSetting('shape')} class={nodeSettings['shape'] ? 'active' : ''}>
				<span class="material-symbols-outlined"> shapes </span>
			</button>
			<button onclick={() => toggleSetting('size')} class={nodeSettings['size'] ? 'active' : ''}>
				<span class="material-symbols-outlined"> open_in_full </span>
			</button>
			<button onclick={() => toggleSetting('color')} class={nodeSettings['color'] ? 'active' : ''}>
				<span class="material-symbols-outlined"> palette </span>
			</button>
			<button
				onclick={() => toggleSetting('strokeWidth')}
				class={nodeSettings['strokeWidth'] ? 'active' : ''}
			>
				<span class="material-symbols-outlined"> line_weight </span>
			</button>
			<button
				onclick={() => toggleSetting('strokeColor')}
				class={nodeSettings['strokeColor'] ? 'active' : ''}
			>
				<span class="material-symbols-outlined"> format_color_fill </span>
			</button>

			<button
				onclick={() => toggleSetting('labels')}
				class={nodeSettings['labels'] ? 'active' : ''}
			>
				<span class="material-symbols-outlined"> label </span>
			</button>
		</div>
		<Rules rule={nodeSettings.rule} type="node" />
	</div>
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
