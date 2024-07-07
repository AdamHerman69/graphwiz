<script lang="ts">
	import { type Guideline, isComposite } from '../utils/guideline.svelte';
	import { type GraphSettingsClass } from '../utils/graphSettings.svelte';
	import WeightedCondition from './WeightedCondition.svelte';
	import autoAnimate from '@formkit/auto-animate';

	let { guideline }: { guideline: Guideline } = $props();
	let collapsed = $state(true);

	function toggleCollapse() {
		collapsed = !collapsed;
	}
</script>

<div class="flex justify-between align-middle">
	<div class="flex justify-center align-middle">
		<span class="material-symbols-outlined"> readiness_score </span>
		<div>
			{guideline.score?.toFixed(2)}
		</div>
	</div>
	<button onclick={toggleCollapse}>
		<span class="material-symbols-outlined">
			{collapsed ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
		</span>
	</button>
</div>
<div use:autoAnimate>
	{#if !collapsed}
		{#if isComposite(guideline.rootCondition.condition)}
			{#each guideline.rootCondition.condition.conditions as weightedCondition}
				<WeightedCondition {weightedCondition} />
			{/each}
		{/if}
	{/if}
</div>
