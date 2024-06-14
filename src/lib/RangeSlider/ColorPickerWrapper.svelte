<script lang="ts">
	export let wrapper: HTMLElement;
	export let isOpen: boolean;
	export let isPopup: boolean;
	/* svelte-ignore unused-export-let */
	export let toRight: boolean;
	export let colorPickerOpen: boolean;
</script>

<div
	class="wrapper w-full"
	bind:this={wrapper}
	class:isOpen
	class:isPopup
	role={isPopup ? 'dialog' : undefined}
	aria-label="color picker"
>
	<slot />
</div>

<style>
	div {
		/* background-color: pink; */
		display: none;
		width: 100%;
		padding-bottom: 10px;
	}
	.isOpen {
		display: block;
	}
	.isPopup {
		position: absolute;
		top: 30px;
		z-index: var(--picker-z-index, 2);
	}
</style>
