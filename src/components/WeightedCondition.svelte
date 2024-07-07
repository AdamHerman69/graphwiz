<script lang="ts">
	import { type WeightedCondition, isComposite } from '../utils/guideline.svelte';

	let { weightedCondition }: { weightedCondition: WeightedCondition } = $props();
	console.log(weightedCondition);
	let condition = weightedCondition?.condition;
	let collapsed = $state(true);

	function toggleCollapse() {
		collapsed = !collapsed;
	}
</script>

<div class="flex justify-between">
	{#if isComposite(condition)}
		<div>composite</div>
	{:else}
		<div>{weightedCondition.condition.property!}</div>
	{/if}

	<div class="flex">
		<div class="text-sm flex justify-center align-middle">
			<span class="material-symbols-outlined"> scale </span>
			{weightedCondition.scoreWeighted?.toFixed(2)}
		</div>
		<div class="text-sm flex justify-center align-middle">
			<span class="material-symbols-outlined"> weight </span>
			{weightedCondition.weight}
		</div>
		<div class="text-sm flex justify-center align-middle">
			<span class="material-symbols-outlined"> readiness_score </span>
			{weightedCondition.score?.toFixed(2)}
		</div>

		{#if isComposite(condition)}
			<button onclick={toggleCollapse}>
				<span class="material-symbols-outlined">
					{collapsed ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
				</span>
			</button>
		{/if}
	</div>
</div>
{#if !collapsed}
	<div class="flex">
		<span class="material-symbols-outlined"> subdirectory_arrow_right </span>
		<div class="flex-1">
			{#each condition.conditions as wc}
				<div>
					<svelte:self weightedCondition={wc} />
				</div>
			{/each}
		</div>
	</div>
{/if}
