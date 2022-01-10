<script lang="ts">
	import { onMount } from 'svelte';
	const { ipcRenderer } = require('electron');
	var options = {
		colors: ['#fdc111'],
		chart: {
			toolbar: {
				show: false,
			},
			zoom: {
				enabled: false,
			},
			type: 'area',
		},
		dataLabels: {
			enabled: false,
		},
		stroke: {
			curve: 'smooth',
			colors: ['#000000'],
		},
		xaxis: {
			type: 'datetime',
			categories: [
				'2018-09-19T00:00:00.000Z',
				'2018-09-19T01:30:00.000Z',
				'2018-09-19T02:30:00.000Z',
				'2018-09-19T03:30:00.000Z',
				'2018-09-19T04:30:00.000Z',
				'2018-09-19T05:30:00.000Z',
				'2018-09-19T06:30:00.000Z',
			],
		},
		tooltip: {
			x: {
				format: 'dd/MM/yy HH:mm',
			},
		},
		series: [
			{
				name: 'sessions',
				data: [30, 40, 35, 50, 49, 60, 70, 91, 125],
			},
		],
	};
	let total_minutes: number;
	onMount(async () => {
		const obj = await import('apexcharts');
		total_minutes = ipcRenderer.sendSync('get_total', 'Thing');
		let gd: object = ipcRenderer.sendSync('get_graph', 'Thing');
		console.log(gd);
		options.xaxis.categories = gd.xaxis;
		options.series[0].data = gd.yaxis;
		const ApexCharts = obj.default;
		var chart = new ApexCharts(document.querySelector('#chart'), options);
		chart.render();
	});
</script>

<div id="chart"><div /></div>

<div>
	<div>
		<span class="prompt">Total Minutes:</span>
		<span class="stat">{total_minutes}</span>
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
