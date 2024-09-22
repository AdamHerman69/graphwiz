<script lang="ts">
	import { type NodeSettingsName, nodeSettingsDefaults } from '../utils/graphSettings.svelte';
	import { type GraphSettings, type NodeSettings } from '../utils/graphSettings.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import Rules from './Rules.svelte';
	import SettingsSlider from './SettingsSlider.svelte';
	import SettingsColor from './SettingsColor.svelte';
	import SettingsNodeLabel from './SettingsNodeLabel.svelte';
	import { getContext } from 'svelte';
	import { node } from 'graphology-metrics';
	import SettingsSelect from './SettingsSelect.svelte';
	import { setContext } from 'svelte';
	let { nodeSettings }: { nodeSettings: NodeSettings[] } = $props();
	setContext('type', 'node');

	function toggleSetting(nodeSettings: NodeSettings, setting: NodeSettingsName) {
		// todo can't reassign! going to be the same object
		console.log('toggle setting:', setting);
		console.log(nodeSettings);
		nodeSettings[setting] = nodeSettings[setting]
			? undefined
			: structuredClone(nodeSettingsDefaults[setting]);
		console.log(nodeSettings);
	}

	let noGlobalSettings: boolean = $derived(
		nodeSettings.find((ns) => ns.rule === undefined) === undefined
	);
</script>

{#snippet nodeSettingsEditor(nodeSettings: NodeSettings, deleteFunction: () => void)}
	<div>
		{#if nodeSettings.rule}
			<!-- Rule can be deleted only if there are no global settings present (settings without a rule) -->

			<Rules
				rule={nodeSettings.rule}
				type="node"
				deleteFunction={noGlobalSettings ? () => (nodeSettings.rule = undefined) : undefined}
			/>
		{/if}
	</div>
	<div class="ruleToggleSettings">
		<button
			onclick={() => toggleSetting(nodeSettings, 'shape')}
			class={nodeSettings['shape'] ? 'active' : ''}
		>
			<span class="material-symbols-outlined"> shapes </span>
		</button>
		<button
			onclick={() => toggleSetting(nodeSettings, 'size')}
			class={nodeSettings['size'] ? 'active' : ''}
		>
			<span class="material-symbols-outlined"> open_in_full </span>
		</button>
		<button
			onclick={() => toggleSetting(nodeSettings, 'color')}
			class={nodeSettings['color'] ? 'active' : ''}
		>
			<span class="material-symbols-outlined"> palette </span>
		</button>
		<button
			onclick={() => toggleSetting(nodeSettings, 'strokeWidth')}
			class={nodeSettings['strokeWidth'] ? 'active' : ''}
		>
			<span class="material-symbols-outlined"> line_weight </span>
		</button>
		<button
			onclick={() => toggleSetting(nodeSettings, 'strokeColor')}
			class={nodeSettings['strokeColor'] ? 'active' : ''}
		>
			<span class="material-symbols-outlined"> format_color_fill </span>
		</button>

		<button
			onclick={() => toggleSetting(nodeSettings, 'labels')}
			class={nodeSettings['labels'] ? 'active' : ''}
		>
			<span class="material-symbols-outlined"> label </span>
		</button>
	</div>

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
				<SettingsNodeLabel labels={nodeSettings.labels} onlyGeneral={true} />
			</div>
		{/if}
	</div>
	<div class="flex justify-end">
		<button class="buttonGeneral" onclick={deleteFunction}
			><span class="material-symbols-outlined"> close </span></button
		>
	</div>
{/snippet}

<div class="relative" use:autoAnimate>
	{console.log(nodeSettings.map((ns) => ns.id))}
	{#each nodeSettings as ns, index (ns.id)}
		{@render nodeSettingsEditor(ns, () => nodeSettings.splice(index, 1))}
		<div class={`mb-4 ${index < nodeSettings.length - 1 ? 'border-b border-gray-200' : ''}`}></div>
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

	.buttonGeneral span {
		font-size: 24px;
		padding: 5px;
	}
</style>
