const { getStreamsInfo } = require('./twitchService');
const { writeFile } = require('./file');
const path = require('path');
const { CHANNELS_TO_MONITOR } = require('./CHANNELS_TO_MONITOR');
const messagesActions = require('./messagesActions');

// Путь к папке для хранения данных о стримах
const STREAMS_DATA_DIR = path.join(__dirname, '..', 'streamsData');

// Глобальные переменные для хранения ID таймеров
let initialTimeoutId = null;
let intervalId = null;


/**
 * Вычисляет задержку до ближайшего целого десятка минут
 * @returns {number} Задержка в миллисекундах
 */
function getDelayToNextTenMinutes() {
	const now = new Date();
	const minutes = now.getMinutes();
	const seconds = now.getSeconds();
	const milliseconds = now.getMilliseconds();

	// Вычисляем сколько минут до следующего десятка
	const minutesToNextTen = (10 - (minutes % 10)) % 10;

	// Если сейчас уже на десятке минут, ждем до следующего
	const targetMinutes = minutesToNextTen === 0 ? 10 : minutesToNextTen;

	// Вычисляем общую задержку
	const delayMs = (targetMinutes * 60 - seconds) * 1000 - milliseconds;

	console.log(`Текущее время: ${now.toLocaleTimeString()}`);
	console.log(`Следующий опрос через: ${Math.round(delayMs / 1000)} секунд (через ${targetMinutes} минут)`);

	return delayMs;
}

/**
 * Создает объект данных о стримере на основе полученной информации
 * @param {Object} user - Информация о пользователе
 * @param {Object} stream - Информация о стриме (может быть undefined)
 * @param {Object} chatData - Данные чата за 10 минут
 * @returns {Object} Объект с данными о стримере
 */
function createStreamerData(user, stream, chatData = null) {
	const isActive = stream !== undefined && stream !== null;
	const channelName = `#${user.login}`;

	// Вычисляем статистику чата
	let messagesPerMinute = 0;
	let uniqueUsers = 0;
	let chattersPercentage = 0;

	if (chatData && chatData.tempPerTenMinutesLogs[channelName]) {
		const minuteData = chatData.tempPerTenMinutesLogs[channelName];
		if (minuteData.length > 0) {
			// Среднее количество сообщений в минуту
			messagesPerMinute = Math.round(
				minuteData.reduce((sum, data) => sum + data.messagesPerMinute, 0) / minuteData.length
			);

			// Среднее количество уникальных пользователей
			uniqueUsers = Math.round(
				minuteData.reduce((sum, data) => sum + data.uniqueUsers, 0) / minuteData.length
			);

			// Процент чатеров от зрителей
			const viewerCount = isActive ? stream.viewer_count : 0;
			chattersPercentage = viewerCount > 0 ? Math.round((uniqueUsers * 100 / viewerCount) * 100) / 100 : 0;
		}
	}

	return {
		user_login: user.login,
		title: isActive ? stream.title : '',
		game_name: isActive ? stream.game_name : '',
		viewer_count: isActive ? stream.viewer_count : 0,
		messagesPerMinute: messagesPerMinute,
		uniqueUsers: uniqueUsers,
		chattersPercentage: chattersPercentage,
		is_active: isActive,
		timestamp: new Date().toISOString()
	};
}

/**
 * Сохраняет данные о стримере в отдельный файл
 * @param {Object} streamerData - Данные о стримере
 */
async function saveStreamerData(streamerData) {
	try {
		const fs = require('fs');
		const fileName = `${streamerData.user_login}.json`;
		const filePath = path.join(STREAMS_DATA_DIR, fileName);

		// Читаем существующие данные
		let existingData = [];
		try {
			if (fs.existsSync(filePath)) {
				const fileContent = fs.readFileSync(filePath, 'utf8');
				const parsedData = JSON.parse(fileContent);
				existingData = parsedData[streamerData.user_login];
			}
		} catch (error) {
			console.log(`Создаем новый файл для стримера: ${streamerData.user_login}`);
		}

		// Добавляем новые данные
		existingData.push({
			title: streamerData.title,
			game_name: streamerData.game_name,
			viewer_count: streamerData.viewer_count,
			messagesPerMinute: streamerData.messagesPerMinute,
			uniqueUsers: streamerData.uniqueUsers,
			chattersPercentage: streamerData.chattersPercentage,
			is_active: streamerData.is_active,
			timestamp: streamerData.timestamp
		});

		// Создаем объект в нужном формате
		const dataToSave = {
			[streamerData.user_login]: existingData
		};

		// Сохраняем в файл
		await writeFile(filePath, dataToSave);
		// console.log(`Данные стримера ${streamerData.user_login} сохранены. Записей: ${existingData.length}`);
	} catch (error) {
		console.error(`Ошибка сохранения данных стримера ${streamerData.user_login}:`, error);
	}
}

/**
 * Сохраняет данные о всех стримерах
 * @param {Array} streamersData - Массив данных о стримерах
 */
async function saveStreamsData(streamersData) {
	try {
		// Сохраняем данные каждого стримера в отдельный файл
		for (const streamerData of streamersData) {
			await saveStreamerData(streamerData);
		}
		console.log(`Данные о стримах за минуту сохранены. Стримеров: ${streamersData.length}, сообщений: ${streamersData.reduce((sum, item) => sum + item.messagesPerMinute, 0)}`);
	} catch (error) {
		console.error('Ошибка сохранения данных о стримах:', error);
	}
}

/**
 * Выполняет опрос стримов и сохраняет данные
 */
async function performStreamsCheck() {
	messagesActions.processMinuteData(true); // Обрабатываем последнюю минуту

	try {
		console.log(`\n=== Опрос стримов в ${new Date().toLocaleTimeString()} ===`);

		// Получаем данные чата из messagesActions
		const chatData = messagesActions.getChatDataForSaving();

		// Получаем информацию о стримах
		const streamsData = await getStreamsInfo(CHANNELS_TO_MONITOR);

		if (!streamsData) {
			console.log('Не удалось получить данные о стримах');
			return;
		}

		const { streams, users } = streamsData;

		// Создаем массив данных о стримерах
		const streamersData = [];

		// Обрабатываем каждого пользователя
		for (const user of users) {
			// Ищем соответствующий стрим
			const stream = streams.find(s => s.user_id === user.id);

			// Создаем объект данных с учетом данных чата
			const streamerData = createStreamerData(user, stream, chatData);
			streamersData.push(streamerData);

			// Выводим информацию в консоль
			const status = streamerData.is_active ? '🟢 В эфире' : '🔴 Офлайн';
			console.log(`${user.display_name}: ${status} | Зрители: ${streamerData.viewer_count} | Игра: ${streamerData.game_name} | Сообщений/мин: ${streamerData.messagesPerMinute} | Уникальных: ${streamerData.uniqueUsers} | Чатерсы: ${streamerData.chattersPercentage}%`);
		}

		// Сохраняем данные
		await saveStreamsData(streamersData);

		// Очищаем временные данные после сохранения
		messagesActions.clearAllTempData();

		console.log(`=== Опрос завершен. Обработано стримеров: ${streamersData.length} ===`);

	} catch (error) {
		console.error('Ошибка при опросе стримов:', error);
	}
}

/**
 * Запускает периодический опрос стримов каждые 10 минут
 */
function startTenMinutesCheck() {
	console.log('🚀 Запуск системы мониторинга стримов...');

	console.log('⚠️ Warning: Skip ten minutes check!'); // Для деплоя
	return;

	// console.log(`Мониторим каналы: ${CHANNELS_TO_MONITOR.join(', ')}`);

	// Вычисляем задержку до первого опроса
	const initialDelay = getDelayToNextTenMinutes();

	// Запускаем первый опрос с задержкой
	initialTimeoutId = setTimeout(() => {
		// Выполняем первый опрос
		performStreamsCheck();

		// Устанавливаем интервал для последующих опросов (каждые 10 минут)
		intervalId = setInterval(performStreamsCheck, 10 * 60 * 1000);

		// console.log('✅ Система мониторинга запущена. Опросы каждые 10 минут.');
	}, initialDelay);
}

/**
 * Останавливает мониторинг стримов
 */
function stopTenMinutesCheck() {
	// Очищаем таймеры если они существуют
	if (initialTimeoutId) {
		clearTimeout(initialTimeoutId);
		initialTimeoutId = null;
	}

	if (intervalId) {
		clearInterval(intervalId);
		intervalId = null;
	}

	console.log('✅ stopTenMinutesCheck');
}

module.exports = {
	startTenMinutesCheck,
	stopTenMinutesCheck,
	performStreamsCheck,
	CHANNELS_TO_MONITOR
};
