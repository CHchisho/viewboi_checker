// Temporary logs storage
const tempLogs = [];

// Кеш данных по 10 минутам для каждого канала
const tempPerTenMinutesLogs = {};

/**
 * Обрабатывает данные по минутам и добавляет их в tempPerTenMinutesLogs
 */
function processMinuteData(force = false) {
	if (tempLogs.length === 0) return;

	const now = new Date();
	const firstMessageTime = new Date(tempLogs[0].timestamp);
	const timeDiff = now.getTime() - firstMessageTime.getTime();

	// Если прошла минута или больше
	if (timeDiff >= 60 * 1000 || force) {
		// Группируем сообщения по каналам
		const channelData = {};

		tempLogs.forEach(log => {
			const channelName = log.channelName;
			if (!channelData[channelName]) {
				channelData[channelName] = {
					messages: [],
					uniqueUsers: new Set()
				};
			}
			channelData[channelName].messages.push(log);
			channelData[channelName].uniqueUsers.add(log.username);
		});

		// Обрабатываем каждый канал
		Object.keys(channelData).forEach(channelName => {
			const data = channelData[channelName];
			const messagesPerMinute = data.messages.length;
			const uniqueUsers = data.uniqueUsers.size;

			// Добавляем данные в tempPerTenMinutesLogs
			if (!tempPerTenMinutesLogs[channelName]) {
				tempPerTenMinutesLogs[channelName] = [];
			}

			tempPerTenMinutesLogs[channelName].push({
				messagesPerMinute: messagesPerMinute,
				uniqueUsers: uniqueUsers,
				timestampStart: firstMessageTime.toISOString(),
				timestampEnd: now.toISOString()
			});

			console.log(`[${channelName}] Минута завершена: ${messagesPerMinute} сообщений, ${uniqueUsers} уникальных пользователей`);
		});

		// Очищаем tempLogs
		tempLogs.length = 0;
	}
}

/**
 * Получает данные чата для сохранения
 */
function getChatDataForSaving() {
	return {
		tempPerTenMinutesLogs: { ...tempPerTenMinutesLogs },
		tempLogs: [...tempLogs]
	};
}

/**
 * Очищает все временные данные
 */
function clearAllTempData() {
	tempLogs.length = 0;
	Object.keys(tempPerTenMinutesLogs).forEach(key => {
		tempPerTenMinutesLogs[key] = [];
	});
	console.log('Все временные данные очищены');
}

/**
 * Обработчик сообщений в чате
 */
function handleMessage(channel, tags, message, self) {
	// Ignore own messages
	if (self) return;

	// Create log object
	const logEntry = {
		channelName: channel,
		username: tags.username,
		timestamp: new Date().toISOString(),
		message: message
	};

	// Добавляем в tempLogs
	tempLogs.push(logEntry);

	// Выводим в консоль
	const time = new Date(logEntry.timestamp).toLocaleTimeString('ru-RU', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});
	// console.log(`[${time}] ${logEntry.channelName} | ${logEntry.username}: ${logEntry.message}`);

	// Проверяем, нужно ли обработать данные по минутам
	processMinuteData();
}

/**
 * Получает текущие логи для API
 */
function getCurrentLogs() {
	return tempLogs;
}

/**
 * Получает статистику чата для API
 */
function getChatStats() {
	const stats = {};

	// Подсчитываем сообщения по каналам
	tempLogs.forEach(log => {
		if (!stats[log.channelName]) {
			stats[log.channelName] = {
				totalMessages: 0,
				uniqueUsers: new Set(),
				lastMessage: null
			};
		}
		stats[log.channelName].totalMessages++;
		stats[log.channelName].uniqueUsers.add(log.username);
		stats[log.channelName].lastMessage = log.timestamp;
	});

	// Преобразуем Set в число для uniqueUsers
	Object.keys(stats).forEach(channel => {
		stats[channel].uniqueUsers = stats[channel].uniqueUsers.size;
	});

	return stats;
}

module.exports = {
	handleMessage,
	getChatDataForSaving,
	clearAllTempData,
	getCurrentLogs,
	getChatStats,
	processMinuteData
};
