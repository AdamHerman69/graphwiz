<script lang="ts">
	import { type Guideline } from '../../utils/guideline.svelte';
	import { hoverPopup } from './hoverPopup.svelte';

	let { guidelineName }: { guidelineName: string } = $props();

	let popupText = guidelineName ? `Set by: ${guidelineName}` : '';
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
