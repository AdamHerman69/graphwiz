<script lang="ts">
	import type {
		EdgeSettings,
		NodeSettings,
		LayoutType,
		nodeSettingsDefaults
	} from '../utils/graphSettings.svelte';
	import SettingValue from './SettingValue.svelte';
	import Collapser from './GUI/Collapser.svelte';
	import type { Conflict } from '../utils/guideline.svelte';

	let {
		recommendations,
		conflicts
	}: {
		recommendations: {
			layout?: LayoutType;
			edgeSettings?: EdgeSettings[];
			nodeSettings?: NodeSettings[];
		};
		conflicts: Conflict[];
	} = $props();

	let nodeCollapsed = $state(true);
	let edgeCollapsed = $state(true);
</script>

<!-- <div class="mt-1">
	<div class="flex justify-between items-center">
		<div class="text-m uppercase">Values</div>
		
	</div>
</div> -->

<div class="">
	{#if recommendations.layout}
		<div>{recommendations.layout}</div>
	{/if}

	{#if recommendations.nodeSettings}
		<div>
			<div class="flex flex-wrap">
				{#each recommendations.nodeSettings as ns, index}
					{#each Object.keys(ns) as key}
						{#if key != 'source' && key != 'rule' && key != 'id' && ns[key]}
							{console.log('key:', key, ns[key])}
							<SettingValue
								setting={ns[key]}
								rule={index > 0 ? ns.rule : null}
								bind:collapsed={nodeCollapsed}
								conflict={conflicts?.find((c) => c.property === key)}
							/>
						{/if}
					{/each}
				{/each}
				<div class="flex justify-center align-middle">
					<Collapser bind:collapsed={nodeCollapsed} horizontal={true} />
				</div>
			</div>
		</div>
	{/if}

	{#if recommendations.edgeSettings}
		<div class="flex flex-wrap">
			{#each recommendations.edgeSettings as es, index}
				{#each Object.keys(es) as key}
					{#if key != 'source' && key != 'rule' && key != 'id' && es[key]}
						<SettingValue
							setting={es[key]}
							rule={index > 0 ? es.rule : null}
							bind:collapsed={edgeCollapsed}
						/>
					{/if}
				{/each}
			{/each}
			<div class="flex justify-center align-middle collapserDiv">
				<Collapser bind:collapsed={edgeCollapsed} horizontal={true} />
			</div>
		</div>
	{/if}
</div>

<style>
	.collapserDiv {
		font-size: 4px;
	}
</style>
