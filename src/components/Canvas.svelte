<script lang="ts">
	import { onMount } from 'svelte';
	import { CanvasHandler } from '../utils/canvas.svelte';
	import type Graph from 'graphology';
	import { loadSampleGraph, computeAttributes, graph } from '../utils/graph.svelte';
	import { graphSettings, getNodeStyles, getEdgeStyles } from '../utils/graphSettings.svelte';
	import DynamicIsland from './DynamicIsland.svelte';
	import ReadabilityMetrics from './ReadabilityMetrics.svelte';

	let canvas: HTMLCanvasElement;
	let width: number;
	let height: number;

	// todo refactor elsewhere
	loadSampleGraph();
	computeAttributes(graph);

	let canvasHandler = new CanvasHandler();

	onMount(() => {
		canvasHandler.initialize(canvas, width, height, graph);
		canvasHandler.startForceSimulation(getNodeStyles(), getEdgeStyles());

		const interval = setInterval(() => {
			canvasHandler.computeReadability();
		}, 1000); // Run every 1000 milliseconds (1 second)

		return () => {
			clearInterval(interval); // Clear the interval when the component is destroyed
		};
	});

	$effect(() => {
		canvasHandler.updateNodeStyles(getNodeStyles());
	});

	$effect(() => {
		canvasHandler.updateEdgeStyles(getEdgeStyles());
	});
</script>

<div class="relative h-full w-full">
	<!-- on:mousemove={detectHover}
		on:click={canvasClicked} -->
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

	<!-- {#if selectedNode}
		<div class="nodeInfo" style="left: {$selectedNodeXspring}px; top: {$selectedNodeYspring}px;">
			<NodeInfo nodeID={selectedNode.id} />
		</div>
	{/if} -->
</div>

<style>
	canvas {
		/* background-color: lightpink; */
	}

	.nodeInfo {
		position: absolute;
		transform: translate(-50%, 20px);
	}
</style>
