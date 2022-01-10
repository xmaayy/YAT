<script lang="ts">
	import { timer } from '$lib/utils/timer-store';
	import { settings } from '$lib/utils/user-settings.js';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	const { ipcRenderer } = require('electron');

	export let id: string;

	const TIMER_LEN: number = ($settings.work_time as number) * 60 * 1000;

	let accumulator: number = 0;
	let delta: number = 0;
	$: timer_value = formatTime(accumulator);

	// A little bit of state management. I had to make the transitions so
	// long because javascript has an interesting way of scheduling intervals
	// that makes the first few seconds seem like it skips some numbers. To
	// avoid anyone seeing that I just made the delay long enough that the
	// first few seconds are not visible
	let showbutton: boolean = true;
	let showtimer: boolean = false;
	let timer_id: NodeJS.Timeout | null = null;

	function formatTime(delta: number): string {
		let seconds: number = Math.floor(delta / 1000);
		let mins: number = Math.floor(seconds / 60);
		seconds = seconds % 60;
		return (
			(mins < 10 ? '0' + mins : mins) +
			':' +
			(seconds > 0 ? (seconds < 10 ? '0' + seconds : seconds) : '00')
		);
	}

	function updateFn() {
		// Subtract the time between the previous clock tick and
		// now from the time accumulator, then update the time
		// of the previous tick.
		accumulator -= Date.now() - delta;
		delta = Date.now();
		if (accumulator <= 0) {
			showtimer = false;
			clearInterval(timer_id!);
			// Fire off the timer completed event and reset the timer local
			// storage.
			ipcRenderer.send('timer_done', {
				start_time: $timer.start_time,
				length: $timer.length,
			});
			timer.set({ started: false, start_time: 0, length: 0, paused: false });
			console.log('Timer Done');
		}
	}

	function start_timer() {
		// Set the time accumulator to the number of milliseconds
		// the user configured for starting the timer and update
		// our state
		accumulator = TIMER_LEN;
		console.log('Accumulator ' + accumulator);
		showbutton = false;
		let start_time = Date.now();
		delta = start_time;
		timer.set({ start_time: start_time, started: true, length: TIMER_LEN, paused: false });
		timer_id = setInterval(updateFn, 500); // update about every second
	}

	function stop_timer() {
		showtimer = false;
		clearInterval(timer_id!);
		// Reset everything without sending the event
		timer.set({ started: false, start_time: 0, length: 0, paused: false });
		console.log('Timer Stopped');
	}

	function pause_timer() {
		if (!$timer.paused) {
			let tmp = $timer;
			tmp.paused = true;
			timer.set(tmp);
			// Stop counting while we wait
			clearInterval(timer_id!);
		} else {
			// Once we want to start it again, reset the delta,
			// set the update function, and unset the timer pause
			delta = Date.now();
			let tmp = $timer;
			tmp.paused = false;
			timer.set(tmp);
			timer_id = setInterval(updateFn, 500); // update about every second
		}
	}

	onMount(() => {
		if ($timer.started) {
			timer_id = setInterval(updateFn, 500);
			showbutton = false;
		}
	});
</script>

{#if showtimer}
	<div
		transition:fade|local={{ duration: 1000 }}
		on:outroend={() => (showbutton = true)}
		class="timer"
	>
		{timer_value}
		<div class="timerbutton">
			<button {id} on:click={pause_timer}>{$timer.paused ? 'Resume' : 'Pause'}</button>
			<button {id} on:click={stop_timer}>Stop</button>
		</div>
	</div>
{/if}
{#if showbutton}
	<div
		transition:fade|local={{ duration: 1000 }}
		on:outroend={() => (showtimer = true)}
		class="startbutton"
	>
		<button {id} on:click={start_timer}>Start Timer</button>
	</div>
{/if}

<style>
	@import url('https://fonts.googleapis.com/css2?family=Space+Mono&display=swap');

	.timer {
		font-family: 'Space Mono';
		font-size: 90pt;
	}
	.timerbutton {
		font-size: 12pt;
		display: flex;
		justify-content: space-around;
		align-content: center;
	}

	button {
		font-family: inherit;
		font-size: inherit;
		padding: 1em 0;
		color: var(--pure-white);
		background-color: var(--primary-blue);
		border-radius: 2em;
		border: 2.5px solid var(--border-color);
		outline: none;
		font-variant-numeric: tabular-nums;
	}
	button:hover {
		border: 2.5px solid var(--selected-border);
		background-color: var(--selected-blue);
	}
	.startbutton > button {
		width: 200px;
	}
	.timerbutton > button {
		width: 100px;
	}
</style>
