<script lang="ts">
	import { timer, save_state, break_state } from '$lib/utils/timer-store';
	import { settings } from '$lib/utils/user-settings.js';
	import { onDestroy, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	const { ipcRenderer } = require('electron');

	export let id: string;

	// Length of timer will be determined by whether or not we're in a break, and if
	// we've hit the desired number of sessions before a long break
	let timer_modifier: number | null = null;

	function getTimerLen() {
		if (
			$break_state.in_break &&
			$break_state.num_consecutive_sessions == $settings.num_sess_before_long
		) {
			timer_modifier = $settings.long_break_time;
		} else {
			timer_modifier = $break_state.in_break ? $settings.break_time : $settings.work_time;
		}
		let TIMER_LEN: number = timer_modifier * 60 * 1000;
		return TIMER_LEN;
	}

	// State of timer when actually counting
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
	let timer_ids: Array<NodeJS.Timeout> = [];

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
		(accumulator -= Date.now() - delta), 0;
		accumulator = Math.max(accumulator, 0);
		delta = Date.now();
		if (accumulator <= 0 && $timer.started) {
			if (!$break_state.in_break) {
				let tmp = $break_state;
				break_state.set({
					num_consecutive_sessions: tmp.num_consecutive_sessions + 1,
					in_break: true,
				});
				ipcRenderer.send('timer_done', {
					start_time: $timer.start_time,
					length: $timer.length,
				});
			} else {
				let tmp = $break_state;
				let num_sess =
					tmp.num_consecutive_sessions == $settings.num_sess_before_long
						? 0
						: tmp.num_consecutive_sessions;
				break_state.set({
					num_consecutive_sessions: num_sess,
					in_break: false,
				});
			}
			var bell = new Audio('/bell.wav');
			bell.play();
			showtimer = false;
			// I've made the ID's into a list because sometimes they dont behave properly
			timer_ids.forEach((timer_id) => clearInterval(timer_id!));
			timer_ids = [];
			timer.set({ started: false, start_time: 0, length: 0, paused: false });
			console.log('Timer Done');
		}
	}

	function start_timer() {
		accumulator = getTimerLen();
		showbutton = false;
		delta = Date.now();
		timer.set({ start_time: delta, started: true, length: getTimerLen(), paused: false });
		timer_ids.push(setInterval(updateFn, 500)); // update about every half second
	}

	function stop_timer() {
		showtimer = false;
		// I've made the ID's into a list because sometimes they dont behave
		// properly
		timer_ids.forEach((timer_id) => clearInterval(timer_id!));
		timer_ids = [];
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
			// I've made the ID's into a list because sometimes they dont behave
			// properly
			timer_ids.forEach((timer_id) => clearInterval(timer_id!));
			timer_ids = [];
		} else {
			// Once we want to start it again, reset the delta,
			// set the update function, and unset the timer pause
			delta = Date.now();
			let tmp = $timer;
			tmp.paused = false;
			timer.set(tmp);
			timer_ids.push(setInterval(updateFn, 500)); // update about every second
		}
	}

	onMount(() => {
		if ($timer.started) {
			showbutton = false;
			delta = $save_state.delta;
			accumulator = $save_state.accumulator;
			timer_ids.push(setInterval(updateFn, 500));
			save_state.set({ accumulator: 0, delta: 0 });
		}
	});
	onDestroy(() => {
		// I've made the ID's into a list because sometimes they dont behave
		// properly
		timer_ids.forEach((timer_id) => clearInterval(timer_id!));
		timer_ids = [];
		save_state.set({ delta: delta, accumulator: accumulator });
	});
</script>

{#if showtimer && $timer.started}
	<div
		transition:fade|local={{ duration: 500 }}
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
		transition:fade|local={{ duration: 500 }}
		on:outroend={() => (showtimer = true)}
		class="startbutton"
	>
		<button {id} on:click={start_timer}>
			Start {$break_state.in_break ? 'Break' : 'Session'}
		</button>
	</div>
{/if}
<div class="session_indicators">
	{#each Array($break_state.num_consecutive_sessions) as _, i}
		<div class="blue-indicator">●</div>
	{/each}
	{#if $timer.started && !$break_state.in_break}
		<div class="yellow-indicator">●</div>
		{#each Array(3 - $break_state.num_consecutive_sessions) as _, i}
			<div class="orange-indicator">●</div>
		{/each}
	{:else}
		{#each Array(4 - $break_state.num_consecutive_sessions) as _, i}
			<div class="orange-indicator">●</div>
		{/each}
	{/if}
</div>

<style lang="scss">
	.blue-indicator {
		color: var(--primary-blue);
	}
	.yellow-indicator {
		color: var(--primary-yellow);
	}
	.orange-indicator {
		color: var(--primary-orange);
	}
	.session_indicators {
		display: flex;
		text-align: center;
		width: 20%;
		margin: 0 auto;
		justify-content: space-evenly;
		align-items: center;
		position: fixed;
		bottom: 1.5rem;
		left: 40%;
	}
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
