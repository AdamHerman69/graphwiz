<script lang="ts">
	import { onMount } from 'svelte';
	import { CanvasHandler } from '../utils/canvas.svelte';
	import type Graph from 'graphology';
	import { loadSampleGraph, computeAttributes } from '../utils/graph.svelte';

	let canvas: HTMLCanvasElement, width: number, height: number;

	// todo refactor elsewhere
	let graph = loadSampleGraph();
	computeAttributes(graph);
	let canvasHandler: CanvasHandler;
	console.log('graph: ', graph);

	onMount(() => {
		console.log('canvas: ', canvas);
		canvasHandler = new CanvasHandler(canvas, width, height, graph);
		canvasHandler.startForceSimulation();
	});
</script>

<div class="relative h-full w-full">
	<!-- on:mousemove={detectHover}
		on:click={canvasClicked} -->
	<canvas
		class="h-full w-full"
		bind:this={canvas}
		bind:clientWidth={width}
		bind:clientHeight={height}
	></canvas>

	<!-- <ReadabilityMetrics bind:readability /> -->

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
