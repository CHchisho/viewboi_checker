import React from 'react';
import { StreamsData } from '../../types/streamer';
import s from './TooltipContent.module.scss';

interface TooltipContentProps {
	dataPoint: StreamsData;
	timestamp: number;
}

const TooltipContent: React.FC<TooltipContentProps> = ({ dataPoint, timestamp }) => {
	const date = new Date(timestamp);
	const formattedDate = date.toLocaleString('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	return (
		<div className={s.tooltip}>
			<div className={s.header}>
				{dataPoint.is_active && <div className={s.activeIndicator}></div>}
				{formattedDate}
				{/*{JSON.stringify(date)}*/}
			</div>

			<div className={s.metric}>
				<span className={s.viewersIndicator}>●</span>
				<strong>Зрители:</strong> {dataPoint.viewer_count.toLocaleString('ru-RU')}
			</div>

			<div className={s.metric}>
				<span className={s.usersIndicator}>●</span>
				<strong>Уникальные пользователи:</strong> {dataPoint.uniqueUsers.toLocaleString('ru-RU')}
			</div>

			<div className={s.metric}>
				<strong>Сообщений в минуту:</strong> {dataPoint.messagesPerMinute}
			</div>

			<div className={s.metric}>
				<strong>Процент чатерсов:</strong> {dataPoint.chattersPercentage.toFixed(2)}%
			</div>

			{dataPoint.title && (
				<div className={s.metric}>
					<strong>Название стрима:</strong> {dataPoint.title}
				</div>
			)}

			{dataPoint.game_name && (
				<div className={s.metric}>
					<strong>Игра:</strong> {dataPoint.game_name}
				</div>
			)}
		</div>
	);
};

export default TooltipContent;
