<script lang="ts">
	import type { AtomicRule } from '../utils/rules.svelte';
	import type { Attribute } from '../utils/graph.svelte';
	import AttributePicker from './AttributePicker.svelte';
	import { getContext } from 'svelte';
	import OperatorSelect from './GUI/OperatorSelect.svelte';
	import CustomSelect from './GUI/CustomSelect.svelte';

	let { rule, disabled = false }: { rule: AtomicRule; disabled: boolean } = $props();

	let isGuidelineEditor = getContext('isGuidelineEditor');
</script>

<div class="flex justify-between items-center flex-1">
	<!-- Select rule target -->
	<!-- todo disabled -->
	<div class="beforeOperator">
		<CustomSelect
			bind:selected={rule.target}
			values={['edge', 'source', 'target']}
			width={100}
			fontSize={12}
			{disabled}
		/>

		<!-- Left operator settings -->
		<!-- todo proper filter -->
		{#if rule.target === 'edge'}
			<AttributePicker
				bind:selectedAttribute={rule.property}
				filter={(attribute: Attribute) =>
				attribute.owner === 'edge' &&
				(!isGuidelineEditor || attribute.general === true)}
				{disabled}
			/>
		{:else}
			<AttributePicker
				bind:selectedAttribute={rule.property}
				filter={(attribute: Attribute) =>
			attribute.owner === 'node' &&
			(!isGuidelineEditor || attribute.general === true)}
				{disabled}
			/>
		{/if}
	</div>

	<div class="flex-grow">
		{#if rule.type === 'number'}
			<OperatorSelect bind:selected={rule.operator} values={['=', '>', '<', '≥', '≤']} {disabled} />
		{:else}
			<p>is</p>
		{/if}
	</div>

	<!-- Numerical Operator -->
	{#if rule.type === 'number'}
		<input type="number" bind:value={rule.value} />
	{:else}
		<input type="string" bind:value={rule.value} />
	{/if}
</div>

<style>
	.beforeOperator {
		display: flex;
		max-width: 150px;
		flex-wrap: wrap;
		flex-grow: 1;
	}

	input {
		text-align: center;
		background-color: transparent;
		margin: 0 5px;
		width: 100%;
		max-width: 70px;
	}
</style>
