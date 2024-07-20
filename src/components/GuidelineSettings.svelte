<script lang="ts">
	import type {
		EdgeSettings,
		NodeSettings,
		LayoutType,
		nodeSettingsDefaults
	} from '../utils/graphSettings.svelte';
	import SettingValue from './SettingValue.svelte';

	let {
		recommendations
	}: {
		recommendations: {
			layout?: LayoutType;
			edgeSettings?: EdgeSettings[];
			nodeSettings?: NodeSettings[];
		};
	} = $props();
</script>

{#if recommendations.layout}
	<div>{recommendations.layout}</div>
{/if}

{#if recommendations.nodeSettings}
	<div>

		{#each recommendations.nodeSettings as ns, index}
			<div class="flex">
				{#if index > 0}
					rule - 
				{/if}

				{#each Object.keys(ns) as key}
					<SettingValue setting={ns[key]} />
				{/each}
			</div>
		{/each}
	</div>
{/if}

{#if recommendations.edgeSettings}{/if}
