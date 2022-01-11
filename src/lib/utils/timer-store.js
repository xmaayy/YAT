import { writable } from 'svelte/store'

export const timer = writable({started: false, start_time: 0, length: 0, paused: false });
export const save_state = writable({delta: 0, accumulator: 0})
export const break_state = writable({num_consecutive_sessions: 0, in_break: false,})