<script lang="ts">
	import type Graph from 'graphology';
	import { graphCharacteristics } from '../utils/graph.svelte';
	import { type Guideline, getGuidelines, applyGuideline } from '../utils/guideline.svelte';
	import { getContext } from 'svelte';
	import type { GraphSettingsClass } from '../utils/graphSettings.svelte';

	let graphSettings = getContext('graphSettings') as GraphSettingsClass;

	let guidelines: Guideline[] = getGuidelines();
</script>

<div class="cardStack">
	{#each guidelines as guideline}
		<div class="card cardSpacing">
			<div class="text-lg font-bold">{guideline.id}</div>
			<div class="text-sm">{guideline.description}</div>
			<div class="text-sm">{guideline.score}</div>
			<button class="text-sm" on:click={() => applyGuideline(guideline, graphSettings)}
				>apply</button
			>
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
	.cardStack {
		height: 100%;
		width: 100%;
		overflow-y: scroll;
		padding: 0px 40px 0px 40px;
		margin: 0px -40px;
		width: 380px;

		scroll-behavior: smooth;
		pointer-events: none;

		/* Hide scrollbar for IE, Edge, and Firefox */
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */

		/* Hide scrollbar for Chrome, Safari, and Opera */
		&::-webkit-scrollbar {
			display: none;
		}
	}
</style>
