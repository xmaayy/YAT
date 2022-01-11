import { writable } from 'svelte/store'

export const settings = writable({work_time: 15, break_time: 5, account: "None",  num_sess_before_long: 4, long_break_time: 20});