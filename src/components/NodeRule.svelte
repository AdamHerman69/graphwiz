<script lang="ts">
	import type { AtomicRule } from '../utils/rules.svelte';
	import type { Attribute } from '../utils/graph.svelte';
	import AttributePicker from './AttributePicker.svelte';

	let { rule }: { rule: AtomicRule } = $props();
</script>

<div class="flex justify-between">
	<!-- todo proper filter -->
	<AttributePicker
		bind:selectedAttribute={rule.property}
		filter={(attribute: Attribute) => (attribute.owner === 'node')}
	/>

	<!-- Numerical Operator -->
	{#if rule.property?.type === 'number'}
		<select class="bg-transparent w-1/4" bind:value={rule.operator}>
			<option value="=">=</option>
			<option value=">">&gt</option>
			<option value="<">&lt</option>
			<option value=">=">≥</option>
			<option value="<=">≤</option>
		</select>
		<!-- <RadialSelector bind:selected={rule.operator} options={['=', '>', '<', '≥', '≤']} width={25} /> -->
		<input type="number" class="bg-transparent w-1/4" bind:value={rule.value} />
	{:else}
		is
		<input type="string" class="bg-transparent mx-1 w-1/2" bind:value={rule.value} />
	{/if}
</div>

<style>
	select,
	input {
		flex: 1;
		border-radius: 0.5rem;
		padding: 0.25rem;
		transition: box-shadow 0.2s ease-in-out;
		text-align: center;
	}

	/* select:hover,
	input:hover {
		box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.3);
	} */

	select:focus,
	input:focus {
		outline: none;
	}
</style>
