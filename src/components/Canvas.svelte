<script lang="ts">
	let canvas, width, height;
</script>

<div class="relative h-full w-full">
	<!-- on:mousemove={detectHover}
		on:click={canvasClicked} -->
	<canvas
		class="h-full w-full"
		bind:this={canvas}
		bind:clientWidth={width}
		bind:clientHeight={height}
	></canvas>

	<!-- <ReadabilityMetrics bind:readability /> -->

	<!-- {#if selectedNode}
		<div class="nodeInfo" style="left: {$selectedNodeXspring}px; top: {$selectedNodeYspring}px;">
			<NodeInfo nodeID={selectedNode.id} />
		</div>
	{/if} -->
</div>

<style>
	.canvas {
		width: 100%;
		height: 100%;
		background-color: lightpink;
	}

	.nodeInfo {
		position: absolute;
		transform: translate(-50%, 20px);
	}
</style>
