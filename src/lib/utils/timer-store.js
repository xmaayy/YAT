import { writable } from 'svelte/store'

export const timer = writable({started: false, start_time: 0, length: 0, paused: false });