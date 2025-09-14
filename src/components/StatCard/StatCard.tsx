import React from 'react';
import cn from 'classnames';
import s from './StatCard.module.scss';

interface StatCardProps {
	title: string;
	value: string | number;
	valueType?: 'viewers' | 'maxViewers' | 'messages' | 'users' | 'chattersPercentage';
	tooltipContent?: string;
	className?: string;
	containerClassName?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
	title,
	value,
	valueType = 'viewers',
	tooltipContent,
	className,
	containerClassName
}) => {
	const getValueClassName = () => {
		switch (valueType) {
			case 'viewers':
				return s.statValueViewers;
			case 'maxViewers':
				return s.statValueMaxViewers;
			case 'messages':
				return s.statValueMessages;
			case 'users':
				return s.statValueUsers;
			default:
				return s.statValueViewers;
		}
	};

	const cardProps = tooltipContent ? {
		'data-tooltip-id': 'info-tooltip',
		'data-tooltip-content': tooltipContent
	} : {};

	return (
		<div
			className={cn(s.statCard, className)}
			data-tooltip-id="info-tooltip"
			data-tooltip-content={tooltipContent}
		>
			<h3>{title}</h3>
			<div className={cn(s.statValueContainer, containerClassName)}>
				<p className={cn(s.statValue, getValueClassName())}>
					{value}
				</p>
			</div>
		</div>
	);
};
