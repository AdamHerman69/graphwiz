<script lang="ts">
	import { onMount } from 'svelte';
	import lottie, { type AnimationItem } from 'lottie-web';
	import collapseAnimation from '../assets/animated_icons/alternating_arrow.json';

	let { title, collapsed = $bindable() }: { title: string; collapsed: boolean } = $props();

	let collapseAnimationInstance: AnimationItem;
	let collapseButton: HTMLButtonElement;

	onMount(() => {
		collapseAnimationInstance = lottie.loadAnimation({
			container: collapseButton,
			loop: false,
			autoplay: false,
			animationData: collapseAnimation,
			initialSegment: [7, 11],
			rendererSettings: {
				preserveAspectRatio: 'xMidYMid slice',
				progressiveLoad: true
			}
		});
	});

	function collapse() {
		collapsed
			? collapseAnimationInstance.playSegments([0, 5], true)
			: collapseAnimationInstance.playSegments([7, 11], true);
		collapsed = !collapsed;
	}
</script>

<div class="mt-1 mb-2">
	<div class="flex justify-between items-center">
		<div class="settingsHeader">{title}</div>
		<!-- <button bind:this={collapseButton} on:click={collapse} class="w-10 h-10 pt-1" /> -->
		<!-- <button class="plusButton"><span class="material-symbols-outlined">add</span></button> -->
	</div>
</div>

<style>
	.settingsHeader {
		font-size: 45px;
		font-weight: 900;
		font-family: 'UncutSans';
		text-transform: uppercase;
		height: auto;
		line-height: normal;
		/* font-family: 'WhyteInktrap'; */
		/* font-weight: 600; */
	}

	.plusButton {
		width: 45px;
		height: 45px;
		border-radius: 50%;
		background-color: #f5f5f5;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.plusButton span {
		font-size: 40px;
		transition: all 0.2s ease;
	}

	.plusButton span:hover {
		transform: rotate(90deg);
	}
</style>
