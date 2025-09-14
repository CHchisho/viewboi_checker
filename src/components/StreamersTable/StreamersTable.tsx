import React, { useMemo, useState } from 'react';
import { StreamerData } from '../../types/streamer';
import styles from './StreamersTable.module.scss';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';

interface StreamersTableProps {
	streamers: StreamerData[];
	loading?: boolean;
}

type SortField =
	'display_name'
	| 'avgViewers'
	| 'maxViewers'
	| 'messagesPerMinute'
	| 'uniqueUsers'
	| 'chattersPercentage';
type SortDirection = 'asc' | 'desc' | null;

interface SortState {
	field: SortField | null;
	direction: SortDirection;
}

const StreamersTable: React.FC<StreamersTableProps> = ({ streamers, loading = false }) => {
	const [sortState, setSortState] = useState<SortState>({ field: null, direction: null });

	const handleSort = (field: SortField) => {
		setSortState(prevState => {
			if (prevState.field === field) {
				// Если кликаем по той же колонке, меняем направление
				if (prevState.direction === 'asc') {
					return { field: null, direction: null };
				} else if (prevState.direction === 'desc') {
					return { field, direction: 'asc' };
				} else {
					return { field, direction: 'asc' };
				}
			} else {
				// Если кликаем по новой колонке, начинаем с asc
				return { field, direction: 'desc' };
			}
		});
	};

	const sortedStreamers = useMemo(() => {
		if (!sortState.field || !sortState.direction) {
			return streamers;
		}

		return [...streamers].sort((a, b) => {
			let aValue: string | number;
			let bValue: string | number;

			if (sortState.field === 'display_name') {
				aValue = a.display_name || a.username;
				bValue = b.display_name || b.username;
			} else {
				aValue = a[sortState.field as keyof StreamerData] as number;
				bValue = b[sortState.field as keyof StreamerData] as number;
			}

			if (typeof aValue === 'string' && typeof bValue === 'string') {
				return sortState.direction === 'asc'
					? aValue.localeCompare(bValue)
					: bValue.localeCompare(aValue);
			} else {
				return sortState.direction === 'asc'
					? (aValue as number) - (bValue as number)
					: (bValue as number) - (aValue as number);
			}
		});
	}, [streamers, sortState]);

	const getSortIcon = (field: SortField) => {
		if (sortState.field !== field) {
			return <ChevronsUpDown size={16} />;
		}
		return sortState.direction === 'asc'
			? <ChevronUp size={16} />
			: <ChevronDown size={16} />;
	};

	if (loading) {
		return (
			<div className={styles.tableContainer}>
				<div className={styles.loading}>Загрузка данных...</div>
			</div>
		);
	}

	if (!streamers || streamers.length === 0) {
		return (
			<div className={styles.tableContainer}>
				<div className={styles.noData}>Нет данных для отображения</div>
			</div>
		);
	}

	return (
		<div className={styles.tableContainer}>
			<table className={styles.table}>
				<thead>
				<tr>
					<th className={styles.sortableHeader}>
						<div className={styles.headerContent}>
							№
						</div>
					</th>
					<th
						className={styles.sortableHeader}
						onClick={() => handleSort('display_name')}
					>
						<div className={styles.headerContent}>
							<span>Стример</span>
							{getSortIcon('display_name')}
						</div>
					</th>
					<th
						className={styles.sortableHeader}
						onClick={() => handleSort('avgViewers')}
					>
						<div className={styles.headerContent}>
							<span>AVG Зрителей</span>
							{getSortIcon('avgViewers')}
						</div>
					</th>
					<th
						className={styles.sortableHeader}
						onClick={() => handleSort('maxViewers')}
					>
						<div className={styles.headerContent}>
							<span>MAX Зрителей</span>
							{getSortIcon('maxViewers')}
						</div>
					</th>
					<th
						className={styles.sortableHeader}
						onClick={() => handleSort('messagesPerMinute')}
					>
						<div className={styles.headerContent}>
							<span>Сообщений в минуту</span>
							{getSortIcon('messagesPerMinute')}
						</div>
					</th>
					<th
						className={styles.sortableHeader}
						onClick={() => handleSort('uniqueUsers')}
					>
						<div className={styles.headerContent}>
							<span>Уникальных пользователей</span>
							{getSortIcon('uniqueUsers')}
						</div>
					</th>
					<th
						className={styles.sortableHeader}
						onClick={() => handleSort('chattersPercentage')}
						data-tooltip-id="info-tooltip"
						data-tooltip-content={'Уникальных пользователей * 100 / AVG Зрителей'}
					>
						<div className={styles.headerContent}>
							<span>Чаттерсы %</span>
							{getSortIcon('chattersPercentage')}
						</div>
					</th>
				</tr>
				</thead>
				<tbody>
				{sortedStreamers.map((streamer, index) => (
					<tr key={streamer.username}>
						<td className={styles.numberCell}>#{index + 1}</td>
						<td className={styles.streamerCell}>
							<div className={styles.streamerInfo}>
								<img
									src={streamer.avatar}
									alt={streamer.username}
									className={styles.avatar}
								/>
								<Link to={`/streamer/${streamer.username}`}
								      className={styles.username}>{streamer.display_name || streamer.username}</Link>
							</div>
						</td>
						<td className={styles.numberCell}>{streamer.avgViewers.toLocaleString()}</td>
						<td className={styles.numberCell}>{streamer.maxViewers.toLocaleString()}</td>
						<td className={styles.numberCell}>{streamer.messagesPerMinute}</td>
						<td className={styles.numberCell}>{streamer.uniqueUsers}</td>
						<td className={styles.numberCell}>
                <span
	                className={`${styles.vmmCoefficient} ${streamer.chattersPercentage > 1 ? styles.high : streamer.chattersPercentage > 0.5 ? styles.medium : styles.low}`}>
                  {streamer.chattersPercentage.toFixed(2)}
                </span>
						</td>
					</tr>
				))}
				</tbody>
			</table>
		</div>
	);
};

export default StreamersTable;
