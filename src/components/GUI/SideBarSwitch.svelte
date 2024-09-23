<script lang="ts">
	let { selected = $bindable() }: { selected: 'guidelines' | 'settings' } = $props();

	function toggle() {
		selected = selected === 'guidelines' ? 'settings' : 'guidelines';
		console.log('rAN', selected);
	}
</script>

<button class="container" onclick={toggle}>
	<div class="switch-circle" class:move-down={selected === 'settings'}></div>
	<div class="icon-container">
		<span class="material-symbols-outlined" class:selected={selected === 'guidelines'}>
			book_5
		</span>
	</div>
	<div class="icon-container">
		<span class="material-symbols-outlined" class:selected={selected === 'settings'}> tune </span>
	</div>
</button>

<style>
	.container {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		width: 30px;
		height: 60px;
		border-radius: 15px;
		box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
		position: relative;
		padding: 4px 0;
		background-color: #f0f0f0;
	}

	.switch-circle {
		position: absolute;
		width: 24px;
		height: 24px;
		background-color: rgba(0, 0, 0, 1);
		box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
		border-radius: 12px;
		z-index: 1;
		top: 4px;
		transition:
			top 0.2s ease,
			transform 0.2s ease,
			height 0.2s ease,
			width 0.2s ease;
	}

	.container:hover .switch-circle {
		height: 28px;
		width: 22px;
	}

	.container:hover .move-down {
		top: calc(100% - 32px);
	}

	.move-down {
		top: calc(100% - 28px);
	}

	button {
		pointer-events: auto;
		border: none;
		cursor: pointer;
	}

	.icon-container {
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
	}

	span {
		font-size: 17px;
		transition: color 0.3s ease;
	}

	.selected {
		color: #dcdcdc;
	}

	span:not(.selected) {
		color: #333;
	}
</style>
