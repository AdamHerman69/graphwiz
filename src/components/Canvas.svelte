<script lang="ts">
	import { getContext, onMount, untrack } from 'svelte';
	import { type ICanvasHandler, WebWorkerCanvasHandler } from '../utils/canvas.svelte';
	import { getGraph, performance } from '../utils/graph.svelte';
	import { GraphSettingsClass } from '../utils/graphSettings.svelte';
	import DynamicIsland from './DynamicIsland.svelte';
	import ReadabilityMetrics from './ReadabilityMetrics.svelte';
	import { spring, type Spring } from 'svelte/motion';
	import NodeInfo from './NodeInfo.svelte';
	import { computeGuidelineStatuses } from '../utils/guideline.svelte';
	import { type Guideline } from '../utils/guideline.svelte';
	import { blur } from 'svelte/transition';
	import { hoverPopup } from './GUI/hoverPopup.svelte';
	import { graphCharacteristics } from '../utils/graph.svelte';

	let graphSettings: GraphSettingsClass = getContext('graphSettings');
	let guidelines = getContext('guidelines') as Guideline[];

	let canvas: HTMLCanvasElement;
	let width: number = $state(0);
	let height: number = $state(0);

	let canvasHandler: ICanvasHandler = getContext('canvasHandler');

	// react to graph change
	$effect(() => {
		console.log('Graph changed');
		let g = getGraph();

		untrack(() => {
			console.log('----------------------canvasHandler init');
			canvasHandler.initialize(canvas, width, height, g);

			if (canvasHandler.started) {
				canvasHandler.graphChange(
					graphSettings.graphSettings.layout,
					graphSettings.graphSettings.edgeLayout,
					graphSettings.computeNodeStyles(),
					graphSettings.computeEdgeStyles()
				);
			} else {
				canvasHandler.start(
					graphSettings.graphSettings.layout,
					graphSettings.graphSettings.edgeLayout,
					graphSettings.computeNodeStyles(),
					graphSettings.computeEdgeStyles()
				);
			}
		});
	});

	// React to graph settings changes
	// todo layout effect
	$effect(() => {
		console.log('Layout changed', graphSettings.graphSettings.layout.value);
		// ;
		untrack(() => {
			graphSettings.saveState();
			canvasHandler.changeLayout(graphSettings.graphSettings.layout);
		});
	});

	let nodeDebounceTimer: number;
	const DEBOUNCE_TIME = 50;

	$effect(() => {
		JSON.stringify(graphSettings.graphSettings.nodeSettings); // just to make the effect run

		if (performance().shouldDebouce) {
			console.log('Node settings changed, debounced');
			clearTimeout(nodeDebounceTimer);
			nodeDebounceTimer = setTimeout(() => {
				canvasHandler.updateNodeStyles(graphSettings.computeNodeStyles());
				computeGuidelineStatuses(guidelines, graphSettings);
				graphSettings.saveState();
			}, DEBOUNCE_TIME);
		} else {
			untrack(() => {
				canvasHandler.updateNodeStyles(graphSettings.computeNodeStyles());
				computeGuidelineStatuses(guidelines, graphSettings);
				graphSettings.saveState();
				console.log('Node settings changed, ran');
			});
		}
	});

	let edgeDebounceTimer: number;
	$effect(() => {
		JSON.stringify(graphSettings.graphSettings.edgeSettings); // just to make the effect run
		console.log('Edge layout changed', graphSettings.graphSettings.edgeLayout.value);

		if (performance().shouldDebouce) {
			clearTimeout(edgeDebounceTimer);
			edgeDebounceTimer = setTimeout(() => {
				canvasHandler.updateEdgeStyles(
					graphSettings.computeEdgeStyles(),
					graphSettings.graphSettings.edgeLayout
				);
				computeGuidelineStatuses(guidelines, graphSettings);
				graphSettings.saveState();
			}, DEBOUNCE_TIME);
		} else {
			untrack(() => {
				canvasHandler.updateEdgeStyles(
					graphSettings.computeEdgeStyles(),
					graphSettings.graphSettings.edgeLayout
				);
				computeGuidelineStatuses(guidelines, graphSettings);
				graphSettings.saveState();
			});
		}
	});

	// Node Info location, when a node is selected
	let selectedNodeSpring: Spring<{ x: number; y: number }>;
	onMount(() => {
		// initialize spring with the middle of canvas
		selectedNodeSpring = spring({ x: width / 2, y: height / 2 }, { stiffness: 0.05, damping: 0.2 });
		console.log('----------------canvas mounting');
	});
	$effect(() => {
		if (canvasHandler.selectedNode && canvasHandler.selectedNodePosition) {
			selectedNodeSpring.set({
				x: canvasHandler.selectedNodePosition.x,
				y: canvasHandler.selectedNodePosition.y
			});
		}
	});

	// todo throttle?
	$effect(() => {
		canvasHandler.resize(width, height);
	});
</script>

<div class="relative h-full w-full">
	<canvas
		resize={true}
		class="h-full w-full"
		bind:this={canvas}
		bind:clientWidth={width}
		bind:clientHeight={height}
		onmousemove={canvasHandler.detectHover}
		onclick={canvasHandler.canvasClicked}
	></canvas>
	<!-- <div class="absolute top-10 left-1/2 transform -translate-x-1/2 pointer-events-none">
		<DynamicIsland exportSVG={canvasHandler.exportSVG} bind:sticky={canvasHandler.sticky} />
	</div> -->
	<ReadabilityMetrics bind:readability={canvasHandler.readability} />

	{#if canvasHandler.selectedNode}
		<div
			class="nodeInfo"
			style="left: {$selectedNodeSpring.x}px; top: {$selectedNodeSpring.y}px;"
			transition:blur
		>
			<NodeInfo nodeID={canvasHandler.selectedNode.id} />
		</div>
	{/if}

	{#if canvasHandler.zoomed}
		<div class="resetTransform" transition:blur>
			<button
				onclick={canvasHandler.resetTransform}
				use:hoverPopup={{ text: 'reset zoom', delay: 300, position: 'left' }}
			>
				<span class="material-symbols-outlined"> reset_focus </span>
			</button>
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
		z-index: 100;
	}

	.resetTransform {
		position: absolute;
		bottom: 10px;
		right: 10px;
	}
</style>
