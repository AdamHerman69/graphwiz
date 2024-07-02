<script lang="ts">
	import { type Guideline, getGuidelines } from '../utils/guideline.svelte';

	let guidelines: Guideline[] = getGuidelines();
</script>

<div class="cardStack">
	{#each guidelines as guideline}
		<div class="card cardSpacing">
			<div class="text-lg font-bold">{guideline.id}</div>
			<div class="text-sm">{guideline.description}</div>
			<div class="text-sm">{guideline.score}</div>
		</div>{/each}
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
