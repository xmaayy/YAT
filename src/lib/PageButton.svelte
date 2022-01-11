<script lang="ts">
	export let dir: string;
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';

	const dispatch = createEventDispatcher();
</script>

<div
	class="circle {dir === 'left' ? 'left' : 'right'}"
	on:click={() => dispatch('click', dir + ' clicked')}
	transition:fade|local={{ duration: 250 }}
>
	{#if dir === 'left'}
		{'<'}
	{:else}
		{'>'}
	{/if}
</div>

<style>
	.circle {
		text-align: center;
		width: 40px;
		height: 40px;
		font-size: 30px;
		background-color: var(--primary-orange);
		border-radius: 30px;
		border: 2.5px solid var(--border-color);
		-webkit-user-select: none; /* Safari */
		-moz-user-select: none; /* Firefox */
		-ms-user-select: none; /* IE10+/Edge */
		user-select: none; /* Standard */
		position: fixed;
		top: 57%;
	}
	.right {
		right: 2vw;
	}

	.left {
		left: 2vw;
	}

	.circle:hover {
		background-color: var(--selected-orange);
		border: 2.5px solid var(--selected-border);
	}
</style>
