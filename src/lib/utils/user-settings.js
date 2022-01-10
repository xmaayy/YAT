import { writable } from 'svelte/store'

export const settings = writable({work_time: 15, break_time: 5});