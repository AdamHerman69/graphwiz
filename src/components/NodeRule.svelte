<script lang="ts">
	import type { AtomicRule } from '../utils/rules.svelte';
	import type { Attribute } from '../utils/graph.svelte';
	import AttributePicker from './AttributePicker.svelte';
	import { getContext } from 'svelte';
	import OperatorSelect from './GUI/OperatorSelect.svelte';

	let { rule, disabled = false }: { rule: AtomicRule; disabled: boolean } = $props();
	let isGuidelineEditor = getContext('isGuidelineEditor');
</script>

<div class="flex justify-between my-1 pl-2">
	<!-- todo proper filter -->
	<AttributePicker
		bind:selectedAttribute={rule.property}
		filter={(attribute: Attribute) => (attribute.owner === 'node' && (!isGuidelineEditor ||  attribute.general === true))}
		{disabled}
	/>

	<!-- Numerical Operator -->
	{#if rule.property?.type === 'number'}
		<!-- <select class="bg-transparent w-1/4" bind:value={rule.operator} {disabled}>
			<option value="=">=</option>
			<option value=">">&gt</option>
			<option value="<">&lt</option>
			<option value=">=">≥</option>
			<option value="<=">≤</option>
		</select> -->
		<OperatorSelect bind:selected={rule.operator} values={['=', '>', '<', '≥', '≤']} />
		<!-- <RadialSelector bind:selected={rule.operator} options={['=', '>', '<', '≥', '≤']} width={25} /> -->
		<input type="number" class="bg-transparent w-1/4" bind:value={rule.value} {disabled} />
	{:else}
		is
		<input type="string" class="bg-transparent mx-1 w-1/2" bind:value={rule.value} {disabled} />
	{/if}
</div>

<style>
	select,
	input {
		flex: 1;
		border-radius: 0.5rem;
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
