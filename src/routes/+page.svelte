<script lang="ts">
	import GraphSettingsPanel from '../components/GraphSettingsPanel.svelte';
	import Canvas from '../components/Canvas.svelte';
	import AppView from '../components/AppView.svelte';
	import {
		loadSampleGraph,
		computeAttributes,
		getGraph,
		recomputeCharacteristics
	} from '../utils/graph.svelte';
	import { setContext } from 'svelte';
	import { gsap } from 'gsap';
	import {
		loadGuidelines,
		sortGuidelines,
		type Guideline,
		applyGuideline,
		type Task,
		tasks,
		assignGUIIDsToConditions
	} from '../utils/guideline.svelte';
	import DynamicIslandCenter from '../components/DynamicIslandCenter.svelte';
	import type Graph from 'graphology';
	import { GraphSettingsClass } from '../utils/graphSettings.svelte';
	import { type ICanvasHandler, WebWorkerCanvasHandler } from '../utils/canvas.svelte';
	import { blur } from 'svelte/transition';
	import GraphCharacteristics from '../components/GraphCharacteristics.svelte';
	import { getEventCoords } from '../utils/helperFunctions';

	let graphSettingsLeft = new GraphSettingsClass();
	let graphSettingsRight: GraphSettingsClass = new GraphSettingsClass();
	setContext('arbitraryGUIDI', graphSettingsLeft.newGUIID);

	let leftCanvasHandler: ICanvasHandler = new WebWorkerCanvasHandler();
	let rightCanvasHandler: ICanvasHandler = new WebWorkerCanvasHandler();

	let showTasks = $state({ anyGuidelinesVisible: false }); // an object because of context
	setContext('showTasks', showTasks);

	let graph = $state(initGraph());

	function initGraph(): Graph {
		let graph = loadSampleGraph();
		computeAttributes(getGraph());
		recomputeCharacteristics(graph);
		loadGuidelines(graphSettingsLeft.newGUIID);
		return graph;
	}

	let splitView = $state({ left: true, right: false });

	setContext('toggleSplitView', toggleSplitView);
	setContext('splitView', splitView);

	let overlay = $state({ on: false });
	setContext('overlay', overlay);

	function toggleSplitView(left: boolean, right: boolean) {
		if (splitView.left === left && splitView.right === right) return;

		// close right
		if (left && !right) {
			rightCanvasHandler.sticky = false;
			gsap.to(width, {
				duration: 0.15,
				left: 100,
				right: 0,
				ease: 'elastic.in(1,1)',

				onComplete: () => {
					splitView.right = false;
				}
			});
			leftCanvasHandler.resetTransform();
		} else if (left && right) {
			if (splitView.left) leftCanvasHandler.resetTransform();
			if (splitView.right) rightCanvasHandler.resetTransform();
			// open both
			splitView.right = true;
			splitView.left = true;
			gsap.to(width, {
				duration: 0.3,
				left: 50,
				right: 50,
				ease: 'elastic.out(1.2,0.75)'
				// onUpdate: () => {
				// 	this.paperRenderer.updatePositions(this.d3nodes as NodePositionDatum[]);
				// },
				// onComplete: () => {
				// 	delete node._gsap;
				// }
			});
		} else if (!left && right) {
			// close left
			leftCanvasHandler.sticky = false;
			gsap.to(width, {
				duration: 0.15,
				left: 0,
				right: 100,
				ease: 'elastic.in(1,1)',

				onComplete: () => {
					splitView.left = false;
				}
			});
			rightCanvasHandler.resetTransform();
		}
	}

	let width = $state({ left: 100, right: 0 });
	let fullWidth: number = $state(0);
	let dragStartLeftWidth = 0;

	let dragStartX: number;
	function dragStart(e: MouseEvent | TouchEvent) {
		dragStartX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
		dragStartLeftWidth = width.left;

		if (e instanceof MouseEvent) {
			document.addEventListener('mousemove', doDrag);
			document.addEventListener('mouseup', stopDrag);
		} else {
			document.addEventListener('touchmove', doDrag);
			document.addEventListener('touchend', stopDrag);
		}
	}

	function doDrag(e: MouseEvent | TouchEvent) {
		const currentX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
		const deltaX = currentX - dragStartX;
		const deltaPercentage = (deltaX / fullWidth) * 100;
		width.left = dragStartLeftWidth + deltaPercentage;
		width.right = 100 - width.left;
	}

	function stopDrag(e: MouseEvent | TouchEvent) {
		if (e instanceof MouseEvent) {
			document.removeEventListener('mousemove', doDrag);
			document.removeEventListener('mouseup', stopDrag);
		} else {
			document.removeEventListener('touchmove', doDrag);
			document.removeEventListener('touchend', stopDrag);
		}
	}

	// function dividerHover(e: MouseEvent) {
	// 	const hoverCircle = document.getElementById('hoverCircle');

	// 	const rect = e.currentTarget.getBoundingClientRect();
	// 	const y = e.clientY - rect.top; // x position within the element.
	// 	const x = e.clientX - rect.left; // y position within the element.
	// 	hoverCircle.setAttribute('cy', y.toString());
	// 	hoverCircle.setAttribute('cx', x.toString());
	// }

	// function showCircle() {
	// 	const hoverCircle = document.getElementById('hoverCircle');
	// 	hoverCircle.style.visibility = 'visible';
	// }

	// function hideCircle() {
	// 	const hoverCircle = document.getElementById('hoverCircle');
	// 	hoverCircle.style.visibility = 'hidden';
	// }

	let dividerWidth = $state(0.5);
</script>

<div class="graphCharacteristics">
	<GraphCharacteristics />
</div>
<div class="flex h-full w-full" bind:clientWidth={fullWidth}>
	{#if splitView.left}
		<div class="h-full relative" style="width: {width.left}%">
			<AppView
				side={splitView.right ? 'left' : 'full'}
				bind:graphSettings={graphSettingsLeft}
				bind:canvasHandler={leftCanvasHandler}
				bind:neighborGraphSettings={graphSettingsRight}
			/>
		</div>
	{/if}

	{#if splitView.right}
		<div class="h-full relative" style="width: {width.right}%">
			<AppView
				side={splitView.left ? 'right' : 'full'}
				bind:graphSettings={graphSettingsRight}
				bind:canvasHandler={rightCanvasHandler}
				bind:neighborGraphSettings={graphSettingsLeft}
			/>
		</div>
	{/if}

	{#if splitView.left && splitView.right}
		<div class="middleContainer" style="left: {width.left}%">
			<div class="splitButtons">
				<button onclick={() => toggleSplitView(false, true)}>
					<span class="material-symbols-outlined"> chevron_left </span>
				</button>

				<button onclick={() => toggleSplitView(true, false)}>
					<span class="material-symbols-outlined"> chevron_right </span>
				</button>
			</div>

			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<!-- svelte-ignore a11y_mouse_events_have_key_events -->
			<svg
				class="divider"
				onmousedown={dragStart}
				ontouchstart={dragStart}
				onmouseenter={() => (dividerWidth = 1.5)}
				onmouseleave={() => (dividerWidth = 0.5)}
				height="100%"
				width="19"
			>
				<g>
					<rect
						x="9"
						width={dividerWidth}
						height="100%"
						fill="black"
						rx="1"
						ry="1"
						class="divider-rect"
					></rect>
				</g>
			</svg>
		</div>
	{/if}

	<div
		class="fixed top-2 left-1/2 transform -translate-x-1/2 pointer-events-none {overlay.on
			? ''
			: 'z-20'}"
	>
		<DynamicIslandCenter
			bind:stickyLeft={leftCanvasHandler.sticky}
			bind:stickyRight={rightCanvasHandler.sticky}
			bind:exportSVGLeft={leftCanvasHandler.exportSVG}
			bind:exportSVGRight={rightCanvasHandler.exportSVG}
			bind:graphSettingsLeft
			bind:graphSettingsRight
			bind:splitView
		/>
	</div>
	{#if showTasks.anyGuidelinesVisible}
		<div class="tasks" transition:blur>
			<!-- <span class="material-symbols-outlined"> task_alt </span> -->
			<div>task:</div>
			<select bind:value={tasks.selectedTask} onchange={() => recomputeCharacteristics(graph)}>
				{#each tasks.tasks as task}
					<option>{task.name}</option>
				{/each}
			</select>
		</div>
	{/if}
</div>

<style>
	.tasks {
		position: absolute;
		top: 100px;
		left: 50%;
		transform: translate(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: small;
	}

	.tasks div {
		text-transform: uppercase;
		font-style: oblique;
	}

	.tasks select {
		background-color: transparent;
		outline: none;
		text-transform: capitalize;
	}

	.divider {
		cursor: ew-resize;
		height: 80%;
		z-index: 1000;
	}

	.middleContainer {
		position: absolute;
		height: 100%;
		transform: translate(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.splitButtons {
		width: 82px;
		height: 36px;
		display: flex;
		justify-content: center;
		align-items: center;
		color: black;
		border-radius: 20px;
		margin-top: 100px; /* 65px is the height of the menu bar */
		transform: translateY(80%);
	}

	.splitButtons button {
		width: 24px;
		height: 24px;
		margin: 0 5px;
	}

	.graphCharacteristics {
		position: absolute;
		bottom: 10px;
		left: 50%;
		transform: translateX(-50%);
	}
</style>
