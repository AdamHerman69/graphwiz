<script lang="ts">
	let {
		icon,
		text
	}: {
		icon: string;
		text: string;
	} = $props();

	let hovered = $state(false);
	let textWidth = $state(0);
	let expandedWidth = $derived(`${textWidth + 40}px`);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="settingDisplay"
	class:hovered
	style="width: {hovered ? expandedWidth : '30px'};"
	onmouseenter={() => {
		hovered = true;
	}}
	onmouseleave={() => {
		hovered = false;
	}}
>
	<div class="iconWrapper">
		<span class="material-symbols-outlined">{icon}</span>
	</div>
	<div class="valueDisplay" bind:clientWidth={textWidth}>
		<div>{text}</div>
	</div>
</div>

<style>
	.settingDisplay {
		font-size: 10px;
		height: 30px;
		transition: width 0.3s ease;
		border-radius: 20px;
		padding: 2px;
		margin: 2px 2px;
		box-shadow: inset 0 0 12px 2px rgba(0, 0, 0, 0.05);

		display: flex;
		justify-content: flex-start;
		align-items: center;
		overflow: hidden;
	}

	.iconWrapper {
		width: 26px;
		height: 26px;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-shrink: 0;
	}

	.material-symbols-outlined {
		font-size: 18px;
	}

	.valueDisplay {
		opacity: 0;
		transition: opacity 0.3s ease 0.3s;
		margin: 0px 5px;
		padding-right: 5px;
		white-space: nowrap;
		display: flex;
		align-items: center;
	}

	.settingDisplay.hovered .valueDisplay {
		opacity: 1;
	}
</style>
