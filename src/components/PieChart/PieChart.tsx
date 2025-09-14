import React from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { StreamerData } from '../../types/streamer';
import s from './PieChart.module.scss';

interface PieChartProps {
	data: StreamerData;
}

const PieChart: React.FC<PieChartProps> = ({ data }) => {
	const chattersPercentage = data.chattersPercentage || 0;
	const justWatcherPercentage = 100 - chattersPercentage;

	const series = [chattersPercentage, justWatcherPercentage];

	const options: ApexOptions = {
		chart: {
			type: 'pie',
			height: 350
		},
		labels: ['Чаттерсы', 'Просто зрители'],
		colors: ['#00E396', '#008FFB'],
		title: {
			text: 'Распределение зрителей',
			align: 'center'
		},
		legend: {
			position: 'bottom'
		},
		dataLabels: {
			enabled: true,
			formatter: function (val: string) {
				return val + '%';
			}
		},
		tooltip: {
			y: {
				formatter: function (val: number) {
					return val.toFixed(1) + '%';
				}
			}
		},
		plotOptions: {
			pie: {
				donut: {
					size: '70%'
				}
			}
		}
	};

	return (
		<div className={s.root}>
			<Chart
				options={options}
				series={series}
				type="pie"
				height={350}
			/>
		</div>
	);
};

export default PieChart;
