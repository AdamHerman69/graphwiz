<script lang="ts">
	import type { Snippet } from 'svelte';

	let { icon, content, data }: { icon: string; content: Snippet; data: any } = $props();
</script>

<div class="settingDisplay">
	<div class="iconWrapper">
		<span class="material-symbols-outlined">{icon}</span>
	</div>
	<div class="valueDisplay">
		{@render content()}
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
		background-color: #f0f0f0;
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
</style>
