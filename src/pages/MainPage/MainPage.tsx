import axios from 'axios';
import React, { useEffect, useState } from 'react';
import StreamersTable from '../../components/StreamersTable/StreamersTable';
import { StatsGrid } from '../../components/StatsGrid/StatsGrid';
import { StatCard } from '../../components/StatCard/StatCard';
import { StreamerData } from '../../types/streamer';
import apiUrl from '../../utils/constants';


const MainPage = () => {
	const [isCheckerEnabled, setIsCheckerEnabled] = useState(false);
	const [streamers, setStreamers] = useState<StreamerData[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		// Получаем начальное состояние чекера при загрузке
		const getInitialStatus = async () => {
			try {
				const response = await axios.get(`${apiUrl}/api/checker-status`);
				setIsCheckerEnabled(response.data.enabled);
			} catch (error) {
				console.error('Error when getting the checker status:', error);
			}
		};

		getInitialStatus();
		fetchStreamersData();
	}, []);

	// Функция для получения данных стримеров
	const fetchStreamersData = async () => {
		setLoading(true);
		try {
			const response = await axios.get(`${apiUrl}/api/streams-history`);
			setStreamers(response.data.streamers || []);
			console.log(response.data.streamers);
		} catch (error) {
			console.error('Error when fetching streamers data:', error);
			setStreamers([]);
		} finally {
			setLoading(false);
		}
	};


	const fetchChecker = async (enable: boolean) => {
		try {
			const response = await axios.post(
				`${apiUrl}/api/enable-checker`,
				{ enabled: enable }
			);
			setIsCheckerEnabled(response.data.enabled);
		} catch (error) {
			console.error('Error when toggling checker:', error);
		}
	};

	return (
		<div className={'full_body'}>
			{/*<div>*/}
			{/*	<button onClick={() => fetchChecker(!isCheckerEnabled)}>*/}
			{/*		{isCheckerEnabled ? 'Disable checker' : 'Enable checker'}*/}
			{/*	</button>*/}
			{/*	<button*/}
			{/*		onClick={fetchStreamersData}*/}
			{/*		style={{ marginLeft: '10px' }}*/}
			{/*		disabled={loading}*/}
			{/*	>*/}
			{/*		{loading ? 'Updating...' : 'Update data'}*/}
			{/*	</button>*/}
			{/*</div>*/}

			<StreamersTable
				streamers={streamers}
				loading={loading} />

			<StatsGrid>
				<StatCard
					title="Всего каналов"
					value={streamers.length}
					valueType="viewers"
				/>
				<StatCard
					title="AVG Чатерсов %"
					value={streamers.length > 0 ? (streamers.reduce((acc, streamer) => acc + streamer.chattersPercentage, 0) / streamers.length).toFixed(2) : '0'}
					valueType="users"
					tooltipContent={'Уникальных пользователей * 100 / AVG Зрителей'}
				/>
			</StatsGrid>
		</div>
	);
};

export default MainPage;
