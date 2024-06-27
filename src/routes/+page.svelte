<script lang="ts">
	import GraphSettingsPanel from '../components/GraphSettingsPanel.svelte';
	import { graphSettings } from '../utils/graphSettings.svelte';
	import Canvas from '../components/Canvas.svelte';
	import AppView from '../components/AppView.svelte';
	import { loadSampleGraph, computeAttributes, getGraph } from '../utils/graph.svelte';
	import { onMount } from 'svelte';

	// todo refactor elsewhere
	loadSampleGraph();
	computeAttributes(getGraph());

	let splitView = $state(false);
	function toggleSplitView() {
		leftWidth = 50;
		rightWidth = 50;
		splitView = !splitView;
		console.log('split toggle');
	}

	let leftWidth = $state(100);
	let rightWidth = $state(0);
	let fullWidth: number = $state(0);
	let dragStartLeftWidth = 0;

	let dragStartX: number;
	function dragStart(e: MouseEvent) {
		dragStartX = e.clientX;
		dragStartLeftWidth = leftWidth;

		document.addEventListener('mousemove', doDrag);
		document.addEventListener('mouseup', stopDrag);
	}

	function doDrag(e: MouseEvent) {
		const deltaX = e.clientX - dragStartX;
		const deltaPercentage = (deltaX / fullWidth) * 100;
		leftWidth = dragStartLeftWidth + deltaPercentage;
		rightWidth = 100 - leftWidth;
	}

	function stopDrag() {
		document.removeEventListener('mousemove', doDrag);
		document.removeEventListener('mouseup', stopDrag);
	}
</script>

<button onclick={toggleSplitView}>Toggle Split View</button>
<div class="flex h-full w-full" bind:clientWidth={fullWidth}>
	<div class="h-full relative" style="width: {leftWidth}%">
		<AppView />
	</div>
	{#if splitView}
		<div class="divider" onmousedown={dragStart}></div>
		<div class="h-full relative" style="width: {rightWidth}%">
			<AppView />
		</div>
	{/if}
</div>

<style>
	.divider {
		background-color: #ccc;
		cursor: ew-resize;
		width: 5px;
		height: 100%;
	}
</style>
