<script lang="ts">
	import Timer from '$lib/Timer.svelte';
	import PageButton from '$lib/PageButton.svelte';
	import NumericStats from '$lib/ProductiveHeatmap.svelte';
	import ProductiveHeatmap from '$lib/NumericStats.svelte';

	const { ipcRenderer } = require('electron');
	import { onMount } from 'svelte';

	const pages = [Timer, NumericStats, ProductiveHeatmap];
	let page_ind = 0;

	function handle_left() {
		console.log('left');
		page_ind -= 1;
		if (page_ind < 0) {
			page_ind = pages.length - 1;
		}
	}
	function handle_right() {
		console.log('right');
		page_ind += 1;
		if (page_ind >= pages.length) {
			page_ind = 0;
		}
	}
	onMount(() => {
		console.log('Contacting main...');
		console.log(ipcRenderer.sendSync('ready', 'Thing'));
	});
</script>

<a href="/settings" class="settings-icon">⚙</a>
<PageButton dir="left" on:click={handle_left} />
<PageButton dir="right" on:click={handle_right} />
<main>
	<div class="main-area">
		<h1>
			<span class="blue">Y</span>
			<span class="yellow">A</span>
			<span class="orange">T</span>
		</h1>
		<div class="timerbox">
			<div class="content-area">
				{#if page_ind == 0}
					<Timer id="0" />
				{:else if page_ind == 1}
					<NumericStats />
				{:else if page_ind == 2}
					<ProductiveHeatmap />
				{/if}
			</div>
		</div>
	</div>
</main>

<style style="SASS">
	:global(body) {
		margin: 0;
		padding: 0;
	}
	.settings-icon {
		font-size: 40pt;
		position: fixed;
		margin: 1rem;
		top: 5%;
	}
	.content-area {
		padding: 2.5rem;
		width: 100%;
	}
	.main-area {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
	}
	.timerbox {
		height: 50vh;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0 2rem;
		width: 100%;
	}
	h1 {
		/* 1 pixel black shadow to left, top, right and bottom */
		text-shadow: -2.5px 0 black, 0 2.5px black, 2.5px 0 black, 0 -2.5px black;
		font-size: 85pt;
		margin: 0 auto;
	}
	.blue {
		color: var(--primary-blue);
	}
	.orange {
		color: var(--primary-orange);
	}
	.yellow {
		color: var(--primary-yellow);
	}

	main {
		padding: 5vh 0;
		text-align: center;
		animation: fade 1s;
		margin: 0 1rem;
		height: 100vh;
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
