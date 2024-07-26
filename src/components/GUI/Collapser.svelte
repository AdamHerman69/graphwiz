<script lang="ts">
	import { onMount } from 'svelte';
	import lottie, { type AnimationItem } from 'lottie-web';
	import collapseAnimation from '../../assets/animated_icons/alternating_arrow.json';

	let { collapsed = $bindable(), horizontal = false }: { collapsed: boolean; horizontal: boolean } =
		$props();

	let collapseAnimationInstance: AnimationItem;
	let collapseButton: HTMLButtonElement;

	onMount(() => {
		collapseAnimationInstance = lottie.loadAnimation({
			container: collapseButton,
			loop: false,
			autoplay: false,
			animationData: collapseAnimation,
			initialSegment: [0, 5],
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

<button bind:this={collapseButton} on:click={collapse} class:rotate={horizontal} />

<style>
	.rotate {
		transform: rotate(270deg);
	}
</style>
