<script>
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
</script>

<div class="landing-page" in:fade>
	<header>
		<h1>Welcome to GraphWiz</h1>
		<p>Your powerful graph visualization tool</p>
	</header>

	<main>
		<button on:click={() => goto('/app')} class="cta-button"> Launch App </button>
	</main>
</div>

<style>
	.landing-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 2rem;
	}

	.cta-button {
		padding: 1rem 2rem;
		font-size: 1.2rem;
		background-color: #4caf50;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.3s;
	}

	.cta-button:hover {
		background-color: #45a049;
	}
</style>
