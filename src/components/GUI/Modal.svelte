<script lang="ts">
	import { type ModalProps, closeModal } from './modalState.svelte.js';
	import CustomSelect from './CustomSelect.svelte';

	let { modalProps }: { modalProps: ModalProps } = $props();

	let selectedValue = $state(modalProps.values?.[0] ?? '');
</script>

<div class="card cardSpacing modal">
	<div class="modalText">{modalProps.text}</div>
	{#if modalProps.values}
		<div class="flex justify-between items-center">
			<CustomSelect bind:selected={selectedValue} values={modalProps.values} />
			<button class="applyButton" onclick={() => closeModal(selectedValue)}>apply</button>
		</div>
	{/if}
</div>

<style>
	.modal {
		width: 300px;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 13px;
	}

	.modalText {
		margin-bottom: 10px;
		text-transform: uppercase;
		font-weight: 500;
	}

	.applyButton {
		padding: 5px 20px;
		background-color: black;
		color: white;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
		border-radius: 10px;
		text-transform: uppercase;
		font-weight: bold;
	}
</style>
