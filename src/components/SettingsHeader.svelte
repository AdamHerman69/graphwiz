<script lang="ts">
	import { onMount } from 'svelte';
	import lottie, { type AnimationItem } from 'lottie-web';
	import collapseAnimation from '../assets/animated_icons/alternating_arrow.json';

	let { title, collapsed }: { title: string; collapsed: boolean } = $props();

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

<div class="mx-2 mt-1 mb-2">
	<div class="flex justify-between items-center">
		<div class="settingsHeader">{title}</div>
		<button bind:this={collapseButton} on:click={collapse} class="w-10 h-10 pt-1" />
	</div>
</div>
