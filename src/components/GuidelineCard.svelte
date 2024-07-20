<script lang="ts">
	import { type Guideline, isComposite, applyGuideline } from '../utils/guideline.svelte';
	import { type GraphSettingsClass } from '../utils/graphSettings.svelte';
	import { getContext } from 'svelte';
	import Score from './Score.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';
	import WeightedCondition from './WeightedCondition.svelte';
	import GuidelineHeader from './GuidelineHeader.svelte';
	import GuidelineSettings from './GuidelineSettings.svelte';

	let { guideline }: { guideline: Guideline } = $props();
	let graphSettings = getContext('graphSettings') as GraphSettingsClass;
</script>

<GuidelineHeader {guideline} />
<div class="text-sm mt-2">{guideline.description}</div>

<GuidelineSettings recommendations={guideline.recommendations} />

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

<button class="text-sm" onclick={() => applyGuideline(guideline, graphSettings)}>apply</button>
<button class="text-sm" onclick={() => console.log($state.snapshot(guideline))}>log</button>
