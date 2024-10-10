<script lang="ts">
	import type { AtomicRule } from '../utils/rules.svelte';
	import type { Attribute } from '../utils/graph.svelte';
	import AttributePicker from './AttributePicker.svelte';
	import { getContext } from 'svelte';
	import OperatorSelect from './GUI/OperatorSelect.svelte';

	let { rule, disabled = false }: { rule: AtomicRule; disabled?: boolean } = $props();
	let isGuidelineEditor = getContext('isGuidelineEditor');
</script>

<div class="flex justify-between items-center flex-1 my-1">
	<!-- todo proper filter -->
	<AttributePicker
		bind:selectedAttribute={rule.property}
		filter={(attribute: Attribute) => (attribute.owner === 'node' && (!isGuidelineEditor ||  attribute.general === true))}
		{disabled}
	/>

	<!-- Numerical Operator -->
	{#if rule.property?.type === 'number'}
		<OperatorSelect bind:selected={rule.operator} values={['=', '>', '<', '≥', '≤']} {disabled} />
	{:else}
		<div>is</div>
	{/if}

	<input
		type={rule.property?.type === 'string' ? 'text' : 'number'}
		bind:value={rule.value}
		{disabled}
	/>
</div>

<style>
	input {
		flex: 1;
		text-align: center;
		background-color: transparent;
		margin: 0 5px;
		max-width: 70px;
		min-width: none;
	}

	input:focus {
		outline: none;
	}
</style>
