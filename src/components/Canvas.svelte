<script lang="ts">
	import { getContext, onMount, untrack } from 'svelte';
	import {
		CanvasHandler,
		type ICanvasHandler,
		WebWorkerCanvasHandler
	} from '../utils/canvas.svelte';
	import { loadSampleGraph, computeAttributes, getGraph } from '../utils/graph.svelte';
	import { GraphSettingsClass, checkAll, getNodeStyle } from '../utils/graphSettings.svelte';
	import DynamicIsland from './DynamicIsland.svelte';
	import ReadabilityMetrics from './ReadabilityMetrics.svelte';
	import { spring, type Spring } from 'svelte/motion';
	import NodeInfo from './NodeInfo.svelte';
	import GraphSettingsPanel from './GraphSettingsPanel.svelte';

	let graphSettings: GraphSettingsClass = getContext('graphSettings');

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
			canvasHandler.startForceSimulation(
				graphSettings.getNodeStyles(),
				graphSettings.getEdgeStyles()
			);
		});
	});

	// React to graph settings changes
	// todo layout effect
	$effect(() => {
		console.log('Layout changed', graphSettings.graphSettings.layout.value);
		// ;
		untrack(() => {
			graphSettings.saveState();
			canvasHandler.changeLayout(graphSettings.graphSettings.layout.value);
		});
	});
	let nodeStyleTimer: number;
	$effect(() => {
		console.log('Node styles effect');
		// debounce
		clearTimeout(nodeStyleTimer);
		console.time('checkAll');
		// checkAll(graphSettings.graphSettings.nodeSettings);
		getNodeStyle(getGraph().nodes()[0], graphSettings.graphSettings.nodeSettings);
		console.timeEnd('checkAll');
		nodeStyleTimer = setTimeout(() => {
			canvasHandler.updateNodeStyles(graphSettings.getNodeStyles());
			untrack(() => graphSettings.saveState());
		}, 500);
	});
	$effect(() => {
		//console.log('Edge styles changed');
		canvasHandler.updateEdgeStyles(graphSettings.edgeStyles);
		untrack(() => graphSettings.saveState());
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

	// todo throttle
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
