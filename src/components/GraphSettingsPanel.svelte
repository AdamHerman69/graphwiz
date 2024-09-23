<script lang="ts">
	import LayoutSettings from './LayoutSettings.svelte';
	import NodeSettings from './NodeSettings.svelte';
	import EdgeSettings from './EdgeSettings.svelte';
	import { getContext } from 'svelte';

	let graphSettings = getContext('graphSettings');

	let collapsed = $state({
		layout: false,
		node: false,
		edge: false
	});
</script>

<div class="cardStack">
	<LayoutSettings />
	<NodeSettings />
	<EdgeSettings />
</div>

<style>
	.cardStack {
		height: 100%;
		width: 100%;
		overflow-y: scroll;
		padding: 0px 40px 0px 40px;
		margin: 0px -40px;
		width: 380px;

		scroll-behavior: smooth;
		pointer-events: none;

		/* Hide scrollbar for IE, Edge, and Firefox */
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */

		/* Hide scrollbar for Chrome, Safari, and Opera */
		&::-webkit-scrollbar {
			display: none;
		}
	}
</style>
