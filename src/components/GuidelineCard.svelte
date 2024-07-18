<script lang="ts">
	import { type Guideline, isComposite, applyGuideline } from '../utils/guideline.svelte';
	import { type GraphSettingsClass } from '../utils/graphSettings.svelte';
	import { getContext } from 'svelte';
	import Score from './Score.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';
	import WeightedCondition from './WeightedCondition.svelte';

	let { guideline }: { guideline: Guideline } = $props();
	let graphSettings = getContext('graphSettings') as GraphSettingsClass;
</script>

<div class="text-lg font-bold">{guideline.name}</div>
<ScoreBar score={guideline.score} />
<div class="text-sm">{guideline.description}</div>

{#if guideline.status}
	<div class="text-sm">{guideline.status.applied}</div>

	<br />
	{#if guideline.status.conflicts.length > 0}
		<div class="text-sm">Conflicts:</div>

		{#each guideline.status.conflicts as conflict}
			<div class="text-sm">{conflict.property} with {conflict.conflictingGuidelineId}</div>
		{/each}
	{/if}
{/if}

<Score {guideline} />

<button class="text-sm" onclick={() => applyGuideline(guideline, graphSettings)}>apply</button>
<button class="text-sm" onclick={() => console.log($state.snapshot(guideline))}>log</button>
