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
		applyGuideline
	} from '../utils/guideline.svelte';
	import DynamicIslandCenter from '../components/DynamicIslandCenter.svelte';

	// todo refactor elsewhere
	let graph = loadSampleGraph();
	computeAttributes(getGraph());
	recomputeCharacteristics(graph);
	loadGuidelines();

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

	function dividerHover(e: MouseEvent) {
		const hoverCircle = document.getElementById('hoverCircle');

		const rect = e.currentTarget.getBoundingClientRect();
		const y = e.clientY - rect.top; // x position within the element.
		const x = e.clientX - rect.left; // y position within the element.
		hoverCircle.setAttribute('cy', y.toString());
		hoverCircle.setAttribute('cx', x.toString());
	}

	function showCircle() {
		const hoverCircle = document.getElementById('hoverCircle');
		hoverCircle.style.visibility = 'visible';
	}

	function hideCircle() {
		const hoverCircle = document.getElementById('hoverCircle');
		hoverCircle.style.visibility = 'hidden';
	}

	let stickyLeft = $state(false);
	let stickyRight = $state(false);
</script>

<div class="flex h-full w-full" bind:clientWidth={fullWidth}>
	{#if splitView.left}
		<div class="h-full relative" style="width: {width.left}%">
			<AppView side={splitView.right ? 'left' : 'full'} />
		</div>
	{/if}

	{#if splitView.right}
		<div class="h-full relative" style="width: {width.right}%">
			<AppView side={splitView.left ? 'right' : 'full'} />
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
				onmouseover={dividerHover}
				onmouseenter={showCircle}
				onmouseleave={hideCircle}
				height="100%"
				width="30"
			>
				<defs>
					<filter id="split-effect" width="400%" x="-150%" height="400%" y="-150%">
						<feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
						<feColorMatrix
							in="blur"
							type="matrix"
							values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 25 -10"
							result="matrix"
						/>
					</filter>
					<filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
						<feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="rgba(0,0,0,0.5)" />
					</filter>
				</defs>
				<!-- <g filter="url(#drop-shadow)">
						<g filter="url(#split-effect)">
							<rect width="100%" height="100%" fill="#000000"></rect>
						</g>
					</g> -->
				<g filter="url(#split-effect)">
					<rect x="12.3" width="5.4" height="100%" fill="black"></rect>
					<circle id="hoverCircle" cx="-100" cy="-100" r="6" fill="black" visibility="hidden" />
				</g>
				<g><rect x="13.3" width="2" height="100%" fill="black"></rect></g>
			</svg>
		</div>
	{/if}

	<div class="absolute top-10 z-50 left-1/2 transform -translate-x-1/2 pointer-events-none">
		<DynamicIslandCenter exportSVG={() => 'export svg'} bind:stickyLeft bind:stickyRight />
	</div>
</div>

<style>
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
	}

	.splitButtons button {
		width: 24px;
		height: 24px;
		margin: 0 5px;
	}
</style>
