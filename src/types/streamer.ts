export interface StreamsData {

	title: string;
	game_name: string;
	viewer_count: number;
	messagesPerMinute: number;
	uniqueUsers: number;
	chattersPercentage: number;
	is_active: boolean;
	timestamp: string;
}

export interface StreamerData {
	username: string;
	display_name: string;
	avatar: string;
	data: StreamsData[];
	avgViewers: number;
	maxViewers: number;
	messagesPerMinute: number;
	uniqueUsers: number;
	chattersPercentage: number;
}
