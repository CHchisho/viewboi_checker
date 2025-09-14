import ReactDOMServer from 'react-dom/server';
import TooltipContent from './TooltipContent';
import { StreamsData } from '../../types/streamer';

export const renderTooltip = (dataPoint: StreamsData, timestamp: number): string => {
	return ReactDOMServer.renderToString(
		<TooltipContent dataPoint={dataPoint} timestamp={timestamp} />
	);
};
