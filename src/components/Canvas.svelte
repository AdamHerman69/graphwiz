<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import {
		CanvasHandler,
		type ICanvasHandler,
		WebWorkerCanvasHandler
	} from '../utils/canvas.svelte';
	import { loadSampleGraph, computeAttributes, getGraph } from '../utils/graph.svelte';
	import { graphSettings, getNodeStyles, getEdgeStyles } from '../utils/graphSettings.svelte';
	import DynamicIsland from './DynamicIsland.svelte';
	import ReadabilityMetrics from './ReadabilityMetrics.svelte';
	import { spring, type Spring } from 'svelte/motion';
	import NodeInfo from './NodeInfo.svelte';
	import { saveState } from '../utils/undoStack.svelte';

	let canvas: HTMLCanvasElement;
	let width: number;
	let height: number;

	// todo refactor elsewhere
	loadSampleGraph();
	computeAttributes(getGraph());

	let canvasHandler: ICanvasHandler = new WebWorkerCanvasHandler();

	onMount(() => {
		// initialize spring with the middle of canvas
		selectedNodeSpring = spring({ x: width / 2, y: height / 2 }, { stiffness: 0.05, damping: 0.2 });
	});

	$effect(() => {
		console.log('Graph changed');
		let g = getGraph();

		untrack(() => {
			canvasHandler.initialize(canvas, width, height, g);
			canvasHandler.startForceSimulation(getNodeStyles(), getEdgeStyles());
		});
	});

	// todo layout effect

	$effect(() => {
		canvasHandler.updateNodeStyles(getNodeStyles());
		untrack(() => {
			if (!graphSettings.byUndo) saveState();
		});
	});

	$effect(() => {
		canvasHandler.updateEdgeStyles(getEdgeStyles());
		untrack(() => {
			if (!graphSettings.byUndo) saveState();
		});
	});

	let selectedNodeSpring: Spring<{ x: number; y: number }>;
	$effect(() => {
		if (canvasHandler.selectedNode && canvasHandler.selectedNodePosition) {
			selectedNodeSpring.set({
				x: canvasHandler.selectedNodePosition.x,
				y: canvasHandler.selectedNodePosition.y
			});
		}
	});
</script>

<div class="relative h-full w-full">
	<canvas
		resize
		class="h-full w-full"
		bind:this={canvas}
		bind:clientWidth={width}
		bind:clientHeight={height}
		onmousemove={canvasHandler.detectHover}
		onclick={canvasHandler.canvasClicked}
	></canvas>
	<div class="absolute top-10 left-1/2 transform -translate-x-1/2 pointer-events-none">
		<DynamicIsland exportSVG={canvasHandler.exportSVG} bind:sticky={canvasHandler.sticky} />
	</div>

	<ReadabilityMetrics bind:readability={canvasHandler.readability} />

	{#if canvasHandler.selectedNode}
		<div class="nodeInfo" style="left: {$selectedNodeSpring.x}px; top: {$selectedNodeSpring.y}px;">
			<NodeInfo nodeID={canvasHandler.selectedNode.id} />
		</div>
	{/if}
</div>

<style>
	.nodeInfo {
		position: absolute;
		transform: translate(-50%, 20px);
	}
</style>
