<script lang="ts">
	import { fade } from 'svelte/transition';
	import '../app.css';

	let { children } = $props();
</script>

{@render children()}
