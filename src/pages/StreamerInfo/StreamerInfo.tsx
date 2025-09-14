import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { StreamerData } from '../../types/streamer';
import { Link, useParams } from 'react-router-dom';
import LineChart from '../../components/LineChart/LineChart';
import { StatsGrid } from '../../components/StatsGrid/StatsGrid';
import { StatCard } from '../../components/StatCard/StatCard';
import s from './StreamerInfo.module.scss';
import { User } from 'lucide-react';
import apiUrl from '../../utils/constants';

const StreamerInfo = () => {
	const { streamer } = useParams();
	const [streamerData, setStreamerData] = useState<StreamerData>({} as StreamerData);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		document.title = `${streamer} - ViewBoi Checker`;
		console.log(document.title);
		fetchStreamerData();
	}, [streamer]);

	// Функция для получения данных стримеров
	const fetchStreamerData = async () => {
		setLoading(true);
		try {
			const response = await axios.get(`${apiUrl}/api/streams-history/${streamer}`);

			const sd: StreamerData = {
				username: response.data.username,
				display_name: response.data.display_name,
				avatar: response.data.avatar,
				data: response.data.data,
				avgViewers: response.data.avgViewers,
				maxViewers: response.data.maxViewers,
				messagesPerMinute: response.data.messagesPerMinute,
				uniqueUsers: response.data.uniqueUsers,
				chattersPercentage: response.data.chattersPercentage
			}
			setStreamerData(sd || []);
			console.log(response.data);
		} catch (error) {
			console.error('Error when fetching streamers data:', error);
			setStreamerData({} as StreamerData);
		} finally {
			setLoading(false);
		}
	};


	if (loading) {
		return (
			<div className={'full_body'}>
				<p>Загрузка...</p>
			</div>
		);
	}

	if (!streamerData.data || streamerData.data.length === 0) {
		return (
			<div className={'full_body'}>
				<div className={s.notFound}>
					<User size={128} stroke={'#ff7070'} />
					<p>Данные не найдены</p>
				</div>
			</div>
		);
	}

	return (
		<div className={'full_body'}>
			<Link className={s.streamerHeader} to={`https://twitch.tv/${streamerData.username}`}>
				<div className={s.avatar}>
					<img
						src={streamerData.avatar}
						alt={streamerData.display_name}
						width={40}
						height={40}
					/>
				</div>
				<span>{streamerData.display_name || streamerData.username}</span>
			</Link>

			<div>
				<div>
					<LineChart data={streamerData} />
				</div>
				{/* <div>
					<PieChart data={streamerData} />
				</div> */}
			</div>

			<StatsGrid>
				<StatCard
					title="Avg зрителей"
					value={streamerData.avgViewers?.toLocaleString() || '0'}
					valueType="viewers"
					tooltipContent="Среднее количество зрителей за время измерений"
				/>
				<StatCard
					title="Max зрителей"
					value={streamerData.maxViewers?.toLocaleString() || '0'}
					valueType="maxViewers"
					tooltipContent="Максимальное количество зрителей за время измерений"
				/>
				<StatCard
					title="Сообщений в минуту"
					value={streamerData.messagesPerMinute || '0'}
					valueType="messages"
					tooltipContent="Среднее за 10 минут: количество сообщений в минуту"
				/>
				<StatCard
					title="Уникальные пользователи"
					value={streamerData.uniqueUsers || '0'}
					valueType="users"
					tooltipContent="Среднее за 10 минут: количество уникальных пользователей, которые отправили хотя бы одно сообщение в минуту"
				/>
				<StatCard
					title="Чатерсы %"
					value={`${streamerData.chattersPercentage?.toFixed(2) || '0'}%`}
					valueType="maxViewers"
					tooltipContent="Процент уникальных пользователей, которые отправили сообщение от общего количества зрителей"
					containerClassName={streamerData.chattersPercentage > 1 ? 'green' : streamerData.chattersPercentage > 0.5 ? 'yellow' : 'red'}
				/>
			</StatsGrid>
		</div>
	);
};

export default StreamerInfo;
