<script lang="ts">
	import { type ModalProps, closeModal } from './modalState.svelte.js';
	import CustomSelect from './CustomSelect.svelte';

	let { modalProps }: { modalProps: ModalProps } = $props();

	let selectedValue = $state(modalProps.values?.[0] ?? '');
</script>

<div class="card cardSpacing modal">
	<div>{modalProps.text}</div>
	{#if modalProps.values}
		<CustomSelect bind:selected={selectedValue} values={modalProps.values} />

		<button onclick={() => closeModal(selectedValue)}>OK</button>
	{/if}
</div>

<style>
	.modal {
		width: 300px;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
</style>
