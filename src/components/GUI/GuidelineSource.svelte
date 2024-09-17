<script lang="ts">
	import { type Guideline } from '../../utils/guideline.svelte';
	import { hoverPopup } from './hoverPopup.svelte';

	let { guideline }: { guideline: Guideline } = $props();

	let popupText = guideline.name ? `Set by: ${guideline.name}` : '';
</script>

<span class="material-symbols-outlined hoverScale" use:hoverPopup={{ text: popupText }}>
	bookmark</span
>

<style>
	span {
		font-variation-settings: 'FILL' 1;
	}

	span:hover {
		cursor: help;
	}
</style>
