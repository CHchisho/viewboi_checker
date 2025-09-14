require('dotenv').config();

const axios = require('axios');
const path = require('path');
const { readFile, writeFile } = require('./file');
const { CHANNELS_TO_MONITOR } = require('./CHANNELS_TO_MONITOR');

// Twitch API Configuration
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const TWITCH_API_BASE_URL = 'https://api.twitch.tv/helix';

// Batch processing configuration
const BATCH_SIZE = 50; // Максимальное количество аккаунтов в одном запросе

// Проверяем наличие необходимых переменных окружения
if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
	console.error('ОШИБКА: Не установлены переменные окружения TWITCH_CLIENT_ID и/или TWITCH_CLIENT_SECRET');
	console.error('Создайте файл .env в корне проекта со следующими переменными:');
	console.error('TWITCH_CLIENT_ID=your_client_id');
	console.error('TWITCH_CLIENT_SECRET=your_client_secret');
}

// Cache for access token
let twitchAccessToken = null;
let tokenExpiresAt = null;

// Cache file path for streamers info
const STREAMERS_CACHE_FILE = path.join(__dirname, '.', 'streamersInfo.json');

/**
 * Check if cache is expired (older than 1 day)
 */
function isCacheExpired(datestamp) {
	const cacheDate = new Date(datestamp);
	const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
	return cacheDate < oneDayAgo;
}

/**
 * Get cached streamers
 */
async function getCachedStreamers(usernames) {
	// console.log('getCachedStreamers');
	const cache = await readFile(STREAMERS_CACHE_FILE);
	const validStreamers = [];
	const expiredUsernames = [];

	if (Object.keys(cache).length === 0) {
		return {
			validStreamers: [],
			expiredUsernames: []
		};
	}

	usernames.forEach(username => {
		const login = username;
		const cachedStreamer = cache[login];

		if (cachedStreamer && !isCacheExpired(cachedStreamer.datestamp)) {
			validStreamers.push(cachedStreamer);
		} else {
			expiredUsernames.push(username);
		}
	});

	return {
		validStreamers,
		expiredUsernames
	};
}

/**
 * Обновляет кеш стримеров
 */
async function updateStreamersCache(users) {
	// console.log('updateStreamersCache');
	const cache = await readFile(STREAMERS_CACHE_FILE);
	const datestamp = new Date().toISOString();

	users.forEach(user => {
		cache[user.login] = {
			id: user.id,
			login: user.login,
			display_name: user.display_name,
			profile_image_url: user.profile_image_url,
			datestamp: datestamp
		};
	});

	await writeFile(STREAMERS_CACHE_FILE, cache);
}

/**
 * Разбивает массив на пакеты указанного размера
 * @param {Array} array - Массив для разбиения
 * @param {number} batchSize - Размер пакета
 * @returns {Array} Массив пакетов
 */
function chunkArray(array, batchSize) {
	const chunks = [];
	for (let i = 0; i < array.length; i += batchSize) {
		chunks.push(array.slice(i, i + batchSize));
	}
	return chunks;
}

/**
 * Получает Twitch App Access Token
 * @returns {Promise<string>} Access token
 */
async function getTwitchAccessToken() {
	try {
		// Check if we have a valid token
		if (twitchAccessToken && tokenExpiresAt && new Date() < tokenExpiresAt) {
			console.log('Twitch access token received from cache');
			return twitchAccessToken;
		}

		const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
			params: {
				client_id: TWITCH_CLIENT_ID,
				client_secret: TWITCH_CLIENT_SECRET,
				grant_type: 'client_credentials'
			}
		});

		// console.log(response.data);

		twitchAccessToken = response.data.access_token;
		tokenExpiresAt = new Date(Date.now() + response.data.expires_in * 1000);

		console.log('Twitch access token received from api');
		return twitchAccessToken;
	} catch (error) {
		// console.error('Ошибка получения Twitch access token:', error.response?.data || error.message);
		throw error;
	}
}

// stream
// [
//   {
//     id: '314298838614',
//     user_id: '32155044',
//     user_login: '5opka',
//     user_name: '5opka',
//     game_id: '6521',
//     game_name: 'Grand Theft Auto: San Andreas',
//     type: 'live',
//     title: 'ИГРАЕМ НА ARIZONA RP // !приватка !донат !правила !тг !мемы',
//     viewer_count: 3384,
//     started_at: '2025-09-07T14:07:28Z',
//     language: 'ru',
//     thumbnail_url: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_5opka-{width}x{height}.jpg',
//     tag_ids: [],
//     tags: [ 'Русский' ],
//     is_mature: false
//   },
// user
//   {
//     id: '32155044',
//     login: '5opka',
//     display_name: '5opka',
//     type: '',
//     broadcaster_type: 'affiliate',
//     description: 'Двукратный мем года № 5067382430',
//     profile_image_url: 'https://static-cdn.jtvnw.net/jtv_user_pictures/e70b3a04-a290-43e5-854f-96a495a2a330-profile_image-300x300.png',
//     offline_image_url: 'https://static-cdn.jtvnw.net/jtv_user_pictures/0494e3bc-62ad-4e74-a2b1-a6d694ff5b3b-channel_offline_image-1920x1080.png',
//     view_count: 0,
//     created_at: '2012-07-15T14:40:38Z'
//   }
// ]

/**
 * Получает информацию о пользователях (стримерах)
 * @param {string[]} usernames - Массив имен пользователей
 * @returns {Promise<Array>} Массив данных о пользователях
 */
async function getUsersInfo(usernames) {
	console.log('getUsersInfo...', usernames);
	try {
		// Получаем данные из кеша
		let { validStreamers, expiredUsernames } = await getCachedStreamers(usernames);

		if (validStreamers.length === 0) {
			expiredUsernames = [...usernames];
		}

		let allUsers = [...validStreamers];

		// Если есть устаревшие или отсутствующие стримеры, запрашиваем их
		if (expiredUsernames.length > 0) {
			// console.log('getUsersInfo: expiredUsernames', expiredUsernames.length);
			
			// Разбиваем на пакеты по BATCH_SIZE элементов
			const batches = chunkArray(expiredUsernames, BATCH_SIZE);
			console.log(`getUsersInfo: разбито на ${batches.length} пакетов`);

			const accessToken = await getTwitchAccessToken();

			// Выполняем запросы параллельно для всех пакетов
			const batchPromises = batches.map(async (batch) => {
				const params = new URLSearchParams();
				batch.forEach((username) => {
					params.append('login', username);
				});

				// console.log(`getUsersInfo: запрос пакета из ${batch.length} пользователей`);
				const userResponse = await axios.get(`${TWITCH_API_BASE_URL}/users?${params.toString()}`, {
					headers: {
						'Client-ID': TWITCH_CLIENT_ID,
						'Authorization': `Bearer ${accessToken}`
					}
				});

				return userResponse.data.data;
			});

			// Ждем завершения всех пакетов
			const batchResults = await Promise.all(batchPromises);
			
			// Объединяем результаты всех пакетов
			const newUsers = batchResults.flat();

			// Обновляем кеш новыми данными
			if (newUsers.length > 0) {
				updateStreamersCache(newUsers);
				allUsers = [...allUsers, ...newUsers];
			}
		}

		return allUsers;
	} catch (error) {
		console.error('Ошибка получения информации о пользователях:', error.response?.data || error.message);
		return [];
	}
}

/**
 * Получает информацию о стримах для указанных пользователей
 * @param {string[]} usernames - Массив имен пользователей
 * @returns {Promise<Array>} Массив данных о стримах
 */
async function getStreamsInfo(usernames) {
	console.log('getStreamsInfo...');
	try {
		// Получаем информацию о пользователях
		const allUsers = await getUsersInfo(usernames);

		if (allUsers.length === 0) {
			return { streams: [], users: [] };
		}

		const accessToken = await getTwitchAccessToken();

		// Получаем информацию о стримах для всех пользователей
		const userIds = allUsers.map(user => user.id);

		// Разбиваем userIds на пакеты по BATCH_SIZE элементов
		const batches = chunkArray(userIds, BATCH_SIZE);
		console.log(`getStreamsInfo: разбито на ${batches.length} пакетов для ${allUsers.length} пользователей`);

		// Выполняем запросы параллельно для всех пакетов
		const batchPromises = batches.map(async (batch) => {
			// Twitch API requires each user_id parameter separately, not comma-separated
			const streamParams = new URLSearchParams();
			batch.forEach((userId) => {
				streamParams.append('user_id', userId);
			});

			// console.log(`getStreamsInfo: запрос пакета из ${batch.length} пользователей`);
			const streamResponse = await axios.get(`${TWITCH_API_BASE_URL}/streams?${streamParams.toString()}`, {
				headers: {
					'Client-ID': TWITCH_CLIENT_ID,
					'Authorization': `Bearer ${accessToken}`
				}
			});

			return streamResponse.data.data;
		});

		// Ждем завершения всех пакетов
		const batchResults = await Promise.all(batchPromises);
		
		// Объединяем результаты всех пакетов
		const allStreams = batchResults.flat();

		return {
			streams: allStreams,
			users: allUsers
		};
	} catch (error) {
		console.error('Ошибка получения информации о стримах:', error.response?.data || error.message);
		// throw error;
	}
}

module.exports = {
	getTwitchAccessToken,
	getUsersInfo,
	getStreamsInfo
};
