import React from 'react';
import cn from 'classnames';
import s from './StatsGrid.module.scss';

interface StatsGridProps {
	children: React.ReactNode;
	className?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
	children,
	className
}) => {
	return (
		<div className={cn(s.statsGrid, className)}>
			{children}
		</div>
	);
};
