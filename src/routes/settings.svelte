<script lang="ts">
	import { settings } from '$lib/utils/user-settings.js';

	// The old transition
	/*
	transition:fly={{
			delay: 0,
			duration: 300,
			x: 500,
			opacity: 0.5,
			easing: quintOut,
		}}
	*/

	let tmp = $settings;
	function settingUpdated(e) {
		console.log(e.target.value);
		tmp[e.target.id] = e.target.value;
		settings.set(tmp);
		console.log($settings);
	}
</script>

<a href="/" class="timer-icon">✕</a>
<main>
	<div>
		<h1>
			<span class="blue">Y</span>
			<span class="yellow">A</span>
			<span class="orange">T</span>
		</h1>
		<div class="timerbox">
			<div>
				Work Duration (mins): <input
					type="text"
					id="work_time"
					value={$settings.work_time}
					on:input={settingUpdated}
				/>
			</div>
			<div>
				Break Duration (mins): <input
					type="text"
					id="break_time"
					value={$settings.break_time}
					on:input={settingUpdated}
				/>
			</div>
			<div>More coming soon . . . 😉</div>
		</div>
	</div>
</main>

<style style="SASS">
	:global(body) {
		margin: 0;
		padding: 0;
	}
	input[type='text'] {
		margin-left: 1rem;
		border: 2px solid black;
		border-radius: 5px;
		padding: 3px;
	}
	.timer-icon {
		font-size: 30pt;
		position: fixed;
		margin: 1.3rem;
		top: 5%;
	}
	.timerbox {
		height: 50vh;
		display: flex;
		flex-direction: column;
		justify-content: space-evenly;
		align-items: center;
		width: 100%;
	}
	h1 {
		/* 1 pixel black shadow to left, top, right and bottom */
		text-shadow: -2px 0 black, 0 2px black, 2px 0 black, 0 -2px black;
		font-size: 120px;
		margin: 5vh auto;
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
		margin: 0 auto;
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
