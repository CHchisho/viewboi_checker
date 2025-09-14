import React, { useCallback, useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { StreamerData } from '../../types/streamer';
import { renderTooltip } from './renderTooltip';
import s from './LineChart.module.scss';
import { StatsGrid } from '../StatsGrid/StatsGrid';
import { StatCard } from '../StatCard/StatCard';

interface LineChartProps {
	data: StreamerData;
}

interface SelectedAreaStats {
	avgViewers: number;
	maxViewers: number;
	messagesPerMinute: number;
	uniqueUsers: number;
	chattersPercentage: number;
}

const LineChart: React.FC<LineChartProps> = ({ data }) => {
	const [selectedAreaStats, setSelectedAreaStats] = useState<SelectedAreaStats | null>(null);

	// Подготавливаем данные для графика
	// const activeData = data.data.filter(item => item.is_active);
	const activeData = data.data;

	// Функция для расчета статистики выделенной области
	const calculateSelectedAreaStats = useCallback((startTime: number, endTime: number) => {
		const filteredData = activeData.filter(item => {
			const itemTime = new Date(item.timestamp).getTime();
			return item.is_active && itemTime >= startTime && itemTime <= endTime;
		});

		if (filteredData.length === 0) {
			return null;
		}

		const totalViewers = filteredData.reduce((sum, item) => sum + item.viewer_count, 0);
		const totalMessages = filteredData.reduce((sum, item) => sum + item.messagesPerMinute, 0);
		const totalUniqueUsers = filteredData.reduce((sum, item) => sum + item.uniqueUsers, 0);

		const avgViewers = totalViewers / filteredData.length;
		const maxViewers = Math.max(...filteredData.map(item => item.viewer_count));
		const messagesPerMinute = totalMessages / filteredData.length;
		const uniqueUsers = totalUniqueUsers / filteredData.length;
		const chattersPercentage = avgViewers > 0 ? (uniqueUsers / avgViewers) * 100 : 0;

		return {
			avgViewers,
			maxViewers,
			messagesPerMinute,
			uniqueUsers,
			chattersPercentage
		};
	}, [activeData]);

	const chartData = activeData.map(item => ({
		x: new Date(item.timestamp).getTime(),
		y: item.viewer_count
	}));

	const uniqueUsersData = activeData.map(item => ({
		x: new Date(item.timestamp).getTime(),
		y: item.uniqueUsers
	}));

	// Находим моменты смены игры для аннотаций
	const gameChangeAnnotations = [];
	for (let i = 1; i < activeData.length; i++) {
		const currentGame = activeData[i].game_name;
		const previousGame = activeData[i - 1].game_name;

		// Проверяем смену игры (исключаем пустые значения)
		if (currentGame && previousGame && currentGame !== previousGame) {
			gameChangeAnnotations.push({
				x: new Date(activeData[i].timestamp).getTime(),
				borderColor: '#52b788',
				borderWidth: 2,
				borderDashArray: 5,
				label: {
					text: `${currentGame}`,
					style: {
						color: '#020817',
						background: '#52b788',
						fontSize: '12px',
						fontFamily: 'sans-serif'
					},
					offsetY: -10,
					offsetX: 10
				}
			});
		}
	}

	const series = [
		{
			name: 'Количество зрителей',
			data: chartData,
			yAxisIndex: 0
		},
		{
			name: 'Уникальные пользователи',
			data: uniqueUsersData,
			yAxisIndex: 1
		}
	];

	const options: ApexOptions = {
		chart: {
			type: 'area',
			height: 350,
			toolbar: {
				show: true
			},
			zoom: {
				enabled: true,
				type: 'x',
				autoScaleYaxis: true,
				zoomedArea: {
					fill: {
						color: '#52b788',
						opacity: 0.2
					},
					stroke: {
						color: '#52b788',
						opacity: 0.8,
						width: 1
					}
				}
			}
		},
		stroke: {
			curve: 'smooth',
			width: 3
		},
		fill: {
			type: 'gradient',
			gradient: {
				// shadeIntensity: 1,
				opacityFrom: 0.7,
				opacityTo: 0.9,
				stops: [0, 90, 100]
			}
		},
		xaxis: {
			type: 'datetime',
			title: {
				text: 'Время'
			},
			labels: {
				datetimeUTC: false,
				format: 'HH:mm'
			}
		},
		yaxis: [
			{
				title: {
					text: 'Среднее количество зрителей'
				},
				labels: {
					style: {
						colors: '#008FFB'
					}
				}
			},
			{
				opposite: true,
				title: {
					text: 'Уникальные пользователи'
				},
				labels: {
					style: {
						colors: '#40916c',
						fontWeight: 'bold'
					}
				}
			}
		],
		legend: {
			position: 'top'
		},
		colors: ['#008FFB', '#74c69d'],
		markers: {
			size: 0
		},
		dataLabels: {
			enabled: true,
			formatter: function (val: number) {
				return val >= 2 ? val : '';
			}
		},
		tooltip: {
			custom: function ({ series, seriesIndex, dataPointIndex, w }) {
				const timestamp = w.globals.initialSeries[0].data[dataPointIndex].x;
				const dataPoint = activeData[dataPointIndex];

				if (!dataPoint) return '';

				return renderTooltip(dataPoint, timestamp);
			}
		},
		grid: {
			borderColor: '#f1f1f1'
		},
		annotations: {
			xaxis: gameChangeAnnotations
		}
	};

	return (
		<div className={s.root}>
			<Chart
				options={options}
				series={series}
				type="area"
				height={350}
			/>

			{/* Блоки статистики для выделенной области */}
			{selectedAreaStats && (
				<div className={s.statsContainer}>
					<h3 className={s.statsTitle}>Статистика выделенной области</h3>
					<StatsGrid>
						<StatCard
							title="Avg зрителей"
							value={selectedAreaStats.avgViewers?.toLocaleString() || '0'}
							valueType="viewers"
							tooltipContent="Среднее количество зрителей за время измерений"
						/>
						<StatCard
							title="Max зрителей"
							value={selectedAreaStats.maxViewers?.toLocaleString() || '0'}
							valueType="maxViewers"
							tooltipContent="Максимальное количество зрителей за время измерений"
						/>
						<StatCard
							title="Сообщений в минуту"
							value={selectedAreaStats.messagesPerMinute || '0'}
							valueType="messages"
							tooltipContent="Среднее за 10 минут: количество сообщений в минуту"
						/>
						<StatCard
							title="Уникальные пользователи"
							value={selectedAreaStats.uniqueUsers || '0'}
							valueType="users"
							tooltipContent="Среднее за 10 минут: количество уникальных пользователей, которые отправили хотя бы одно сообщение в минуту"
						/>
						<StatCard
							title="Чатерсы %"
							value={`${selectedAreaStats.chattersPercentage?.toFixed(2) || '0'}%`}
							valueType="users"
							tooltipContent="Процент уникальных пользователей, которые отправили сообщение из общего количества зрителей"
							containerClassName={selectedAreaStats.chattersPercentage > 1 ? 'green' : selectedAreaStats.chattersPercentage > 0.5 ? 'yellow' : 'red'}
						/>
					</StatsGrid>
				</div>
			)}

			{/* <p style={{color:'black'}}>JSON: {JSON.stringify(data)}</p> */}
		</div>
	);
};

export default LineChart;
