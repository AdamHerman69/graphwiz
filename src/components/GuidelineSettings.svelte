<script lang="ts">
	import type {
		EdgeSettings,
		NodeSettings,
		LayoutSettings,
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
			layout?: LayoutSettings;
			edgeSettings?: EdgeSettings[];
			nodeSettings?: NodeSettings[];
			attributes?: {
				discrete: boolean;
				bind: { target: string; setting: string; name?: string }[];
			};
		};
		conflicts: Conflict[];
	} = $props();

	let nodeCollapsed = $state(true);
	let edgeCollapsed = $state(true);

	const settingTypes = [
		'shape',
		'size',
		'color',
		'strokeWidth',
		'strokeColor',
		'labels',
		'width',
		'partialStart',
		'partialEnd',
		'decorators',
		'type'
	];
</script>

<!-- <div class="mt-1">
	<div class="flex justify-between items-center">
		<div class="text-m uppercase">Values</div>
		
	</div>
</div> -->

<div class="">
	<div class="flex flex-wrap">
		{#if recommendations.layout?.type}
			<!-- todo conflicts -->
			<SettingValue
				setting={recommendations.layout.type}
				rule={null}
				bind:collapsed={nodeCollapsed}
			/>
		{/if}

		{#if recommendations.layout?.edgeType}
			<!-- todo conflicts -->
			<SettingValue
				setting={recommendations.layout.edgeType}
				rule={null}
				bind:collapsed={nodeCollapsed}
			/>
		{/if}
	</div>

	{#if recommendations.nodeSettings}
		<!-- <div class="settingAreaName">node</div> -->
		<div>
			<div class="flex flex-wrap">
				{#each recommendations.nodeSettings as ns, index}
					{#each Object.keys(ns) as key}
						{#if settingTypes.includes(key) && ns[key] !== undefined}
							<SettingValue
								setting={ns[key]}
								rule={index > 0 ? ns.rule : null}
								bind:collapsed={nodeCollapsed}
								conflict={conflicts?.find((c) => c.property === key)}
								{index}
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
		<!-- <div class="settingAreaName">edge</div> -->
		<div class="flex flex-wrap">
			{#each recommendations.edgeSettings as es, index}
				{#each Object.keys(es) as key}
					{#if settingTypes.includes(key) && es[key] !== undefined}
						<SettingValue
							setting={es[key]}
							rule={index > 0 ? es.rule : null}
							bind:collapsed={edgeCollapsed}
							conflict={conflicts?.find((c) => c.property === key)}
							{index}
						/>
					{/if}
				{/each}
			{/each}
			<div class="flex justify-center align-middle collapserDiv">
				<Collapser bind:collapsed={edgeCollapsed} horizontal={true} />
			</div>
		</div>
	{/if}

	{#if recommendations.attributes}
		<div class="flex flex-wrap">
			{#if recommendations.attributes.discrete}
				discrete
			{/if}

			{#each recommendations.attributes.bind as attr, index}
				<SettingValue
					setting={{
						name: 'bind',
						value: attr.name ? attr.setting + ' - ' + attr.name : attr.setting
					}}
					{index}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.collapserDiv {
		font-size: 4px;
	}

	.settingAreaName {
		font-size: 12px;
		font-weight: bold;
		margin-bottom: 4px;
	}
</style>
