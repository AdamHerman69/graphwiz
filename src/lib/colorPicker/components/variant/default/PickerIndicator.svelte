<script lang="ts">
	/** indicator position in % */
	export let pos: { x: number; y: number };

	/** indicator whether the selected color is light or dark */
	export let isDark: boolean;
	export let color: string;
</script>

<div
	class="picker-indicator"
	class:is-dark={isDark}
	style:--pos-x={pos.x}
	style:--pos-y={pos.y}
	style="background-color: {color};"
/>

<style>
	div {
		position: absolute;
		left: calc(
			var(--pos-x) * (var(--picker-width, 200px) - var(--picker-indicator-size, 15px) - 4px) / 100 +
				2px
		);
		top: calc(
			var(--pos-y) * (var(--picker-height, 200px) - var(--picker-indicator-size, 15px) - 4px) / 100 +
				2px
		);

		width: var(--picker-indicator-size, 15px);
		height: var(--picker-indicator-size, 15px);
		background-color: white;
		box-shadow:
			0 0 6px black,
			inset 0 0 4px rgba(0, 0, 0, 0.3);
		border-radius: 50%;

		pointer-events: none;
		z-index: 1;
		transition: box-shadow 0.2s;
	}
	.is-dark {
		box-shadow:
			0 0 6px white,
			inset 0 0 4px rgba(255, 255, 255, 0.3);
	}
</style>
