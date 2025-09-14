const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const twitchService = require('./services/twitchService');
const tenMinutesCheck = require('./services/tenMinutesCheck');
const { CHANNELS_TO_MONITOR } = require('./services/CHANNELS_TO_MONITOR');
const messagesActions = require('./services/messagesActions');
const IRCManager = require('./services/ircManager');

// npm install cors
// npm install tmi.js ws

const app = express();
const port = process.env.PORT || 4000;
app.use(cors());

// Increase the limit to 10MB (or any size you need)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	next();
});


// IRC Manager для управления соединениями
const ircManager = new IRCManager();

// Простой кеш для эндпоинтов (24 часа)
const cache = {
	streamsHistory: {
		data: null,
		timestamp: null
	},
	streamerHistory: {}
};

// Функция для проверки актуальности кеша (24 часа)
function isCacheValid(timestamp) {
	if (!timestamp) return false;
	const now = Date.now();
	const cacheAge = now - timestamp;
	const oneDayInMs = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
	return cacheAge < oneDayInMs;
}

app.post('/api/enable-checker', async (req, res) => {
	res.status(401).send(); // Для деплоя
	return;
	const { enabled } = req.body;

	try {
		if (enabled === true) {
			await ircManager.enableChecker(CHANNELS_TO_MONITOR);
		} else if (enabled === false) {
			await ircManager.disableChecker();
		}

		const status = ircManager.getStatus();
		res.json({
			enabled: status.enabled,
			activeConnections: status.activeConnections,
			connections: status.connections
		});
	} catch (error) {
		console.error('Ошибка управления чекером:', error);
		res.status(500).json({
			error: 'Ошибка управления чекером',
			message: error.message
		});
	}
});


app.get('/api/server-status', (req, res) => {
	res.sendStatus(200);
});

// API endpoint для получения состояния чекера
app.get('/api/checker-status', (req, res) => {
	const status = ircManager.getStatus();
	res.json({
		enabled: status.enabled
		// activeConnections: status.activeConnections,
		// connections: status.connections
	});
});

// API endpoint для получения истории данных о стримах
app.get('/api/streams-history', async (req, res) => {
	try {
		// Проверяем кеш
		if (isCacheValid(cache.streamsHistory.timestamp)) {
			console.log('Get data from cache for /api/streams-history');
			return res.json(cache.streamsHistory.data);
		}

		const fs = require('fs');
		const path = require('path');
		const { CHANNELS_TO_MONITOR } = require('./services/CHANNELS_TO_MONITOR.js');

		// Получаем информацию о всех стримерах
		const gui = await twitchService.getUsersInfo(CHANNELS_TO_MONITOR);

		const usersMap = new Map();
		gui.forEach(user => {
			usersMap.set(user.login.toLowerCase(), user);
		});

		const streamers = [];

		for (let i = 0; i < CHANNELS_TO_MONITOR.length; i++) {
			const streamer = CHANNELS_TO_MONITOR[i];
			const streamerInfo = usersMap.get(streamer.toLowerCase());
			const filePath = path.join(__dirname, 'streamsData', `${streamer}.json`);
			// console.log(filePath);

			// Пропускаем стримера, если информация о нем не найдена
			if (!streamerInfo) {
				console.log(`Информация о стримере ${streamer} не найдена в Twitch API`);
				continue;
			}

			let avgViewers = 0, maxViewers = 0, messagesPerMinute = 0, uniqueUsers = 0, chattersPercentage = 0;

			if (fs.existsSync(filePath)) {
				const fileContent = fs.readFileSync(filePath, 'utf8');
				const data = JSON.parse(fileContent);
				const streamerData = data[streamer] || [];

				// Вычисляем статистику только по активным стримам
				const activeStreams = streamerData.filter(item => item.is_active);
				// console.log(activeStreams.length);

				if (activeStreams.length > 0) {
					// Среднее количество зрителей
					avgViewers = activeStreams.reduce((sum, item) => sum + item.viewer_count, 0) / activeStreams.length;

					// Максимальное количество зрителей
					maxViewers = Math.max(...activeStreams.map(item => item.viewer_count));

					// Среднее количество сообщений в минуту
					messagesPerMinute = activeStreams.reduce((sum, item) => sum + item.messagesPerMinute, 0) / activeStreams.length;

					// Среднее количество уникальных пользователей
					uniqueUsers = activeStreams.reduce((sum, item) => sum + item.uniqueUsers, 0) / activeStreams.length;

					// Средний процент чатеров
					chattersPercentage = activeStreams.reduce((sum, item) => sum + item.chattersPercentage, 0) / activeStreams.length;
				}

				streamers.push({
					username: streamerInfo.login,
					display_name: streamerInfo.display_name,
					avatar: streamerInfo.profile_image_url,
					avgViewers: Math.round(avgViewers),
					maxViewers: maxViewers,
					messagesPerMinute: Math.round(messagesPerMinute),
					uniqueUsers: Math.round(uniqueUsers),
					chattersPercentage: parseFloat(chattersPercentage.toFixed(2))
				});
			} else {
				console.log(`Данные стримера ${streamer} не найдены!`);
			}
		}

		const responseData = {
			success: true,
			streamers: streamers
		};

		// Сохраняем в кеш
		cache.streamsHistory.data = responseData;
		cache.streamsHistory.timestamp = Date.now();

		res.json(responseData);

	} catch (error) {
		console.error('Ошибка получения истории стримов:', error);
		res.status(500).json({
			success: false,
			error: 'Ошибка получения истории стримов',
			message: error.message
		});
	}
});

// API endpoint для получения истории конкретного стримера
app.get('/api/streams-history/:streamer', async (req, res) => {
	try {
		const { streamer } = req.params;
		
		// Проверяем кеш для конкретного стримера
		if (cache.streamerHistory[streamer] && isCacheValid(cache.streamerHistory[streamer].timestamp)) {
			console.log(`Get data from cache for streamer: ${streamer}`);
			return res.json(cache.streamerHistory[streamer].data);
		}

		const fs = require('fs');
		const path = require('path');
		const filePath = path.join(__dirname, 'streamsData', `${streamer}.json`);
		const gui = await twitchService.getUsersInfo([streamer]);
		const streamerInfo = gui[0];

		if (!fs.existsSync(filePath)) {
			return res.json({
				success: true,
				data: [],
				message: `История стримера ${streamer} не найдена`
			});
		}

		const fileContent = fs.readFileSync(filePath, 'utf8');
		const data = JSON.parse(fileContent);

		// Получаем данные стримера
		const streamerData = data[streamer] || [];

		// Вычисляем статистику только по активным стримам
		let avgViewers, maxViewers, messagesPerMinute, uniqueUsers, chattersPercentage;

		const activeStreams = streamerData.filter(item => item.is_active);

		if (activeStreams.length > 0) {
			// Среднее количество зрителей
			avgViewers = activeStreams.reduce((sum, item) => sum + item.viewer_count, 0) / activeStreams.length;

			// Максимальное количество зрителей
			maxViewers = Math.max(...activeStreams.map(item => item.viewer_count));

			// Среднее количество сообщений в минуту
			messagesPerMinute = activeStreams.reduce((sum, item) => sum + item.messagesPerMinute, 0) / activeStreams.length;

			// Среднее количество уникальных пользователей
			uniqueUsers = activeStreams.reduce((sum, item) => sum + item.uniqueUsers, 0) / activeStreams.length;

			// Средний процент чатеров
			chattersPercentage = activeStreams.reduce((sum, item) => sum + item.chattersPercentage, 0) / activeStreams.length;
		} else {
			avgViewers = 0;
			maxViewers = 0;
			messagesPerMinute = 0;
			uniqueUsers = 0;
			chattersPercentage = 0;
		}

		const responseData = {
			success: true,
			data: streamerData,
			username: streamerInfo.login,
			display_name: streamerInfo.display_name,
			avatar: streamerInfo.profile_image_url,
			avgViewers: Math.round(avgViewers),
			maxViewers: maxViewers,
			messagesPerMinute: Math.round(messagesPerMinute),
			uniqueUsers: Math.round(uniqueUsers),
			chattersPercentage: parseFloat(chattersPercentage.toFixed(2))
		};

		// Сохраняем в кеш для конкретного стримера
		cache.streamerHistory[streamer] = {
			data: responseData,
			timestamp: Date.now()
		};

		res.json(responseData);

	} catch (error) {
		console.error(`Ошибка получения истории стримера ${req.params.streamer}:`, error);
		res.status(500).json({
			success: false,
			error: 'Ошибка получения истории стримера',
			message: error.message
		});
	}
});

app.get('/', (req, res) => {
	res.send(`Server started successfully`);
});

// Starting server
const server = app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}/`);

	// Запускаем систему мониторинга стримов
	tenMinutesCheck.startTenMinutesCheck();
});

// Обработчики сигналов для корректного завершения работы
async function gracefulShutdown(signal) {
	console.log(`\n🛑 Завершение работы...`);

	// Останавливаем мониторинг стримов
	tenMinutesCheck.stopTenMinutesCheck();

	// Отключаем все IRC соединения если они активны
	if (ircManager.isEnabled) {
		await ircManager.disableChecker();
		console.log('✅ IRC соединения отключены');
	}

	// Закрываем сервер
	server.close(() => {
		// console.log('✅ HTTP сервер закрыт');
		process.exit(0);
	});
}

// Обработчики различных сигналов завершения
process.on('SIGTERM', async () => await gracefulShutdown('SIGTERM'));
process.on('SIGINT', async () => await gracefulShutdown('SIGINT'));
process.on('SIGUSR2', async () => await gracefulShutdown('SIGUSR2')); // Для nodemon

// Обработчик необработанных исключений
process.on('uncaughtException', async (error) => {
	console.error('💥 Необработанное исключение:', error);
	await gracefulShutdown('uncaughtException');
});

// Обработчик необработанных отклонений промисов
process.on('unhandledRejection', async (reason, promise) => {
	console.error('💥 Необработанное отклонение промиса:', reason);
	await gracefulShutdown('unhandledRejection');
});

