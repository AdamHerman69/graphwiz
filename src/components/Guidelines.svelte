<script lang="ts">
	import type Graph from 'graphology';
	import { graphCharacteristics } from '../utils/graph.svelte';
	import { type Guideline, applyGuideline, isComposite } from '../utils/guideline.svelte';
	import { getContext } from 'svelte';
	import type { GraphSettingsClass } from '../utils/graphSettings.svelte';
	import GuidelineCard from './GuidelineCard.svelte';

	let guidelines: Guideline[] = getContext('guidelines') as Guideline[];
</script>

<div>
	{#each guidelines as guideline, index}
		<div
			class="{guideline.status?.applied === 'fully' ? 'cardInset' : 'card'} cardSpacing"
			class:first={index === 0}
		>
			<GuidelineCard {guideline} />
		</div>
	{/each}
	<div class="card cardSpacing">
		<div class="text-lg font-bold">graphCharacteristics</div>
		{#each Object.keys(graphCharacteristics) as key}
			<div class="text-sm">{key} : {graphCharacteristics[key].value}</div>
		{/each}
	</div>
</div>

<style>
	.first {
		margin-top: 10px;
	}
</style>
