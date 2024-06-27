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
	import GraphSettingsPanel from './GraphSettingsPanel.svelte';

	let canvas: HTMLCanvasElement;
	let width: number = $state(0);
	let height: number = $state(0);

	let canvasHandler: ICanvasHandler = new WebWorkerCanvasHandler();

	// react to graph change
	$effect(() => {
		console.log('Graph changed');
		let g = getGraph();

		untrack(() => {
			canvasHandler.initialize(canvas, width, height, g);
			canvasHandler.startForceSimulation(getNodeStyles(), getEdgeStyles());
		});
	});

	// React to graph settings changes
	// todo layout effect
	$effect(() => {
		console.log('Layout changed', graphSettings.layout.value);
		// ;
		untrack(() => {
			saveState();
			canvasHandler.changeLayout(graphSettings.layout.value);
		});
	});
	$effect(() => {
		//console.log('Node styles changed');
		canvasHandler.updateNodeStyles(getNodeStyles());
		untrack(() => saveState());
	});
	$effect(() => {
		//console.log('Edge styles changed');
		canvasHandler.updateEdgeStyles(getEdgeStyles());
		untrack(() => saveState());
	});

	// Node Info location, when a node is selected
	let selectedNodeSpring: Spring<{ x: number; y: number }>;
	onMount(() => {
		// initialize spring with the middle of canvas
		selectedNodeSpring = spring({ x: width / 2, y: height / 2 }, { stiffness: 0.05, damping: 0.2 });
	});
	$effect(() => {
		if (canvasHandler.selectedNode && canvasHandler.selectedNodePosition) {
			selectedNodeSpring.set({
				x: canvasHandler.selectedNodePosition.x,
				y: canvasHandler.selectedNodePosition.y
			});
		}
	});

	$effect(() => {
		canvasHandler.resize(width, height);
		console.log('resize effect');
	});
</script>

<div class="relative h-full w-full">
	<canvas
		resize="true"
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

<!-- State stack debug tool -->
<!-- <div class="flex">
			<div>
				<div>Index</div>
				<div>Size</div>
			</div>
			{#each getUndoStack() as state, index}
				<div class={index === getStateIndex() ? 'text-red-500 font-bold p-1' : 'p-1'}>
					<div>{index}</div>
					<div>{state.nodeSettings[0].size?.value}</div>
				</div>
			{/each}
		</div> -->

<style>
	.nodeInfo {
		position: absolute;
		transform: translate(-50%, 20px);
	}
</style>
