<script lang="ts">
	let { selected = $bindable(), disabled = false }: { selected: string; disabled: boolean } =
		$props();

	let checked = $state(false);

	$effect(() => {
		selected = checked ? 'OR' : 'AND';
	});
</script>

<label class="switch">
	<input type="checkbox" bind:checked {disabled} />
	<span class="slider" />
</label>

<style>
	.switch {
		position: relative;
		display: inline-block;
		width: 60px;
		height: 24px;
	}

	.switch input {
		display: none;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: black;
		transition: 0.3s;
		border-radius: 34px;
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 16px;
		width: 16px;
		left: 4px;
		bottom: 4px;
		background-color: white;
		transition: 0.4s;
		border-radius: 12px;
		box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.4);
	}

	.slider:hover:before {
		height: 16px;
		width: 20px;
	}

	input:checked + .slider {
		background-color: var(--default-bg-color);
		box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
	}

	input:focus + .slider {
		box-shadow: 0 0 1px #2196f3;
	}

	input:checked + .slider:before {
		transform: translateX(36px);
		background-color: black;
		box-shadow: 0 0 4px 2px rgba(0, 0, 0, 0.2);
	}

	input:checked + .slider:hover:before {
		transform: translateX(32px);
	}

	.slider:after {
		content: 'AND';
		color: white;
		display: block;
		position: absolute;
		transform: translate(-50%, -50%);
		top: 50%;
		left: 65%;
		font-size: 10px;
		font-family: Verdana, sans-serif;
		transition: left 0.4s;
	}

	input:checked + .slider:after {
		content: 'OR';
		left: 30%;
		color: black;
	}
</style>
