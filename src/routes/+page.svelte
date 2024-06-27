<script lang="ts">
	import GraphSettingsPanel from '../components/GraphSettingsPanel.svelte';
	import Canvas from '../components/Canvas.svelte';
	import AppView from '../components/AppView.svelte';
	import { loadSampleGraph, computeAttributes, getGraph } from '../utils/graph.svelte';
	import { onMount, setContext } from 'svelte';
	import { gsap } from 'gsap';

	// todo refactor elsewhere
	loadSampleGraph();
	computeAttributes(getGraph());

	setContext('toggleSplitView', toggleSplitView);

	let splitView = $state({ left: true, right: false });
	function toggleSplitView(left: boolean, right: boolean) {
		// close right
		if (left && !right) {
			gsap.to(width, {
				duration: 0.15,
				left: 100,
				right: 0,
				ease: 'elastic.in(1,1)',

				onComplete: () => {
					splitView.right = false;
				}
			});
		} else if (left && right) {
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
			gsap.to(width, {
				duration: 0.15,
				left: 0,
				right: 100,
				ease: 'elastic.in(1,1)',

				onComplete: () => {
					splitView.left = false;
				}
			});
		}
	}

	let width = $state({ left: 100, right: 0 });
	let fullWidth: number = $state(0);
	let dragStartLeftWidth = 0;

	let dragStartX: number;
	function dragStart(e: MouseEvent) {
		dragStartX = e.clientX;
		dragStartLeftWidth = width.left;

		document.addEventListener('mousemove', doDrag);
		document.addEventListener('mouseup', stopDrag);
	}

	function doDrag(e: MouseEvent) {
		const deltaX = e.clientX - dragStartX;
		const deltaPercentage = (deltaX / fullWidth) * 100;
		width.left = dragStartLeftWidth + deltaPercentage;
		width.right = 100 - width.left;
	}

	function stopDrag() {
		document.removeEventListener('mousemove', doDrag);
		document.removeEventListener('mouseup', stopDrag);
	}
</script>

<div class="flex h-full w-full" bind:clientWidth={fullWidth}>
	{#if splitView.left}
		<div class="h-full relative" style="width: {width.left}%">
			<AppView />
		</div>
	{/if}
	{#if splitView.left && splitView.right}
		<div class="middleContainer">
			<div class="splitButtons">
				<button onclick={() => toggleSplitView(true, false)}>
					<span class="material-symbols-outlined"> splitscreen_left </span>
				</button>

				<button onclick={() => toggleSplitView(false, true)}>
					<span class="material-symbols-outlined"> splitscreen_right </span>
				</button>
			</div>
			<div class="divider" onmousedown={dragStart}></div>
		</div>
	{/if}

	{#if splitView.right}
		<div class="h-full relative" style="width: {width.right}%">
			<AppView />
		</div>
	{/if}
</div>

<style>
	.divider {
		background-color: #ccc;
		cursor: ew-resize;
		width: 5px;
		height: 80%;
	}

	.middleContainer {
		height: 100%;
	}

	.splitButtons {
		width: 82px;
		height: 36px;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: black;
		color: white;
		border-radius: 20px;
		margin-top: 25px; /* 65px is the height of the menu bar */
		transform: translate(-50%, -50%); /* Adjust based on the exact positioning you need */
	}

	.splitButtons button {
		width: 24px;
		height: 24px;
		margin: 0 5px;
	}
</style>
