<script lang="ts">
	import { onMount } from 'svelte';
	const { ipcRenderer } = require('electron');

	function generateSeries(min: number, max: number, len: number): Array<object> {
		let series_data: Array<object> = [];
		for (let i = 0; i < len; i++) {
			let element = {
				y: Math.floor(Math.random() * (max - min) + min),
				x: i,
			};
			series_data.push(element);
		}
		return series_data;
	}

	var options = {
		colors: ['#f9784b', '#3bb7e8', '#fdc111'],
		chart: {
			toolbar: {
				show: false,
			},
			zoom: {
				enabled: false,
			},
			type: 'heatmap',
		},
		yaxis: {
			reversed: true,
		},
		series: [
			{
				name: 'S',
				data: generateSeries(10, 35, 24),
			},
			{
				name: 'M',
				data: generateSeries(10, 35, 24),
			},
			{
				name: 'T',
				data: generateSeries(10, 35, 24),
			},
			{
				name: 'W',
				data: generateSeries(10, 35, 24),
			},
			{
				name: 'T',
				data: generateSeries(10, 35, 24),
			},
			{
				name: 'F',
				data: generateSeries(10, 35, 24),
			},
			{
				name: 'S',
				data: generateSeries(10, 35, 24),
			},
		],
		dataLabels: {
			enabled: false,
		},
	};

	let num_sessions = 0;
	let heatmap_data = {};
	onMount(async () => {
		num_sessions = ipcRenderer.sendSync('get_num_sessions', 'Thing');
		heatmap_data = ipcRenderer.sendSync('get_heatmap', 'nan');
		options.series = heatmap_data;
		const obj = await import('apexcharts');
		const ApexCharts = obj.default;
		var chart = new ApexCharts(document.querySelector('#chart'), options);
		chart.render();
	});
</script>

<div>
	<div id="chart"><div /></div>
	<div>
		<span class="prompt">Total Sessions:</span>
		<span class="stat">{num_sessions}</span>
	</div>
</div>

<style>
	.stat {
		font-size: 30pt;
	}
	.prompt {
		font-size: 20pt;
	}
</style>
