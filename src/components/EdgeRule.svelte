<script lang="ts">
	import type { AtomicRule } from '../utils/rules.svelte';
	import type { Attribute } from '../utils/graph.svelte';
	import AttributePicker from './AttributePicker.svelte';

	let { rule }: { rule: AtomicRule } = $props();
</script>

<div class="flex justify-between">
	<!-- Select rule target -->
	<select class="flex-auto bg-transparent w-1/4" bind:value={rule.target}>
		<option value="edge">edge</option>
		<option value="source">source</option>
		<option value="target">target</option>
	</select>

	<!-- Left operator settings -->
	<!-- todo proper filter -->
	<AttributePicker
		bind:selectedAttribute={rule.property}
		filter={(attribute: Attribute) => (attribute.owner === (rule.target === 'edge' ? 'edge' : 'node'))}
	/>

	<!-- Numerical Operator -->
	{#if rule.type === 'number'}
		<select class="bg-transparent w-1/4" bind:value={rule.operator}>
			<option value="=">=</option>
			<option value=">">&gt</option>
			<option value="<">&lt</option>
			<option value=">=">≥</option>
			<option value="<=">≤</option>
		</select>
		<input type="number" class="bg-transparent w-1/6" bind:value={rule.value} />
	{:else}
		<div class="flex">
			<p>is</p>
			<input type="string" class="bg-transparent mx-1 w-1/4" bind:value={rule.value} />
		</div>
	{/if}
</div>
