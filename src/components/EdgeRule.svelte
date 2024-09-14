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

<div class="flex justify-between">
	<!-- Select rule target -->
	<!-- todo disabled -->
	<CustomSelect bind:selected={rule.target} values={['edge', 'source', 'target']} width={100} />

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

	<!-- Numerical Operator -->
	{#if rule.type === 'number'}
		<OperatorSelect bind:selected={rule.operator} values={['=', '>', '<', '≥', '≤']} />
		<input type="number" class="bg-transparent w-1/6" bind:value={rule.value} />
	{:else}
		<div class="flex">
			<p>is</p>
			<input type="string" class="bg-transparent mx-1 w-1/4" bind:value={rule.value} />
		</div>
	{/if}
</div>
