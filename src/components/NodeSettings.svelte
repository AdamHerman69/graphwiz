<script lang="ts">
	import { graphSettings } from '../utils/graphSettings.svelte';
	import RuleNodeSettings from './RuleNodeSettings.svelte';
	import SettingsHeader from './SettingsHeader.svelte';
	import SettingsSlider from './SettingsSlider.svelte';
	import SettingsColor from './SettingsColor.svelte';
	import SettingsNodeLabel from './SettingsNodeLabel.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import { setContext } from 'svelte';

	let collapsed = $state(false);

	setContext('type', 'node');

	function addRule() {
		// todo priority and ID
		graphSettings.nodeSettings.push({
			priority: graphSettings.nodeSettings.length + 1,
			rule: {
				id: 0,
				operator: 'AND',
				rules: [
					{
						id: 0,
						operator: '>',
						type: 'number',
						target: 'node',
						value: 0
					}
				]
			},
			source: null
		});
	}
</script>

<div use:autoAnimate={{ duration: 300 }}>
	{#each graphSettings.nodeSettings as setting, index}
		{#if index === 0}
			<div class="card">
				<SettingsHeader title="node" bind:collapsed />
				<!-- Settings -->
				{#if !collapsed}
					<SettingsSlider numSettings={setting.size!} />
					<SettingsColor colorSetting={setting.color!} />
					<SettingsSlider numSettings={setting.strokeWidth!} />
					<SettingsColor colorSetting={setting.strokeColor!} />
					<SettingsNodeLabel labels={setting.labels!} />
				{/if}
			</div>
		{:else}
			<div class="card">
				<RuleNodeSettings nodeSettings={setting} />
			</div>
		{/if}
	{/each}
</div>

<!-- Add rule button -->
<div class="flex justify-center">
	<div class="card w-14">
		<button onclick={addRule} class="flex items-center justify-center w-full h-full">
			<span class="material-symbols-outlined">add</span>
		</button>
	</div>
</div>
