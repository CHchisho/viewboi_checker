const tmi = require('tmi.js');
const messagesActions = require('./messagesActions');

class IRCManager {
	constructor() {
		this.connections = new Map(); // Хранит активные соединения
		this.isEnabled = false;
		this.connectionConfig = {
			options: { debug: false },
			connection: {
				reconnect: true,
				secure: true
			}
		};
		this.maxChannelsPerConnection = 30; // Максимум каналов на одно соединение
		this.channelsPerBatch = 10; // Количество каналов для подключения за раз
		this.batchDelay = 10000; // Задержка между подключениями (10 секунд)
	}

	/**
	 * Разделяет каналы на группы для разных соединений
	 * @param {string[]} channels - Массив каналов для мониторинга
	 * @returns {string[][]} Массив групп каналов
	 */
	splitChannelsIntoGroups(channels) {
		const groups = [];
		for (let i = 0; i < channels.length; i += this.maxChannelsPerConnection) {
			groups.push(channels.slice(i, i + this.maxChannelsPerConnection));
		}
		return groups;
	}

	/**
	 * Создает новое IRC соединение для группы каналов
	 * @param {string[]} channels - Каналы для этого соединения
	 * @param {number} connectionId - ID соединения
	 * @returns {tmi.Client} IRC клиент
	 */
	createConnection(channels, connectionId) {
		const client = new tmi.Client({
			...this.connectionConfig,
			channels: channels
		});

		// Обработчик сообщений
		client.on('message', messagesActions.handleMessage);

		// Обработчик подключения
		client.on('connected', (addr, port) => {
			console.log(`[Соединение ${connectionId}] Мониторим каналы: ${channels.join(', ')}`);
		});

		// Обработчик ошибок
		client.on('error', (err) => {
			console.error(`[Соединение ${connectionId}] Ошибка Twitch клиента:`, err);
		});

		// Обработчик отключения
		client.on('disconnected', (reason) => {
			console.log(`[Соединение ${connectionId}] Отключен от Twitch IRC. Причина: ${reason}`);
		});

		return client;
	}

	/**
	 * Постепенно подключается к каналам в пакетах
	 * @param {tmi.Client} client - IRC клиент
	 * @param {string[]} channels - Каналы для подключения
	 * @param {number} connectionId - ID соединения
	 */
	async connectToChannelsGradually(client, channels, connectionId) {
		console.log(`[Соединение ${connectionId}] Начинаем постепенное подключение к ${channels.length} каналам`);

		// Сначала подключаемся к IRC без каналов
		await client.connect();

		// Затем постепенно присоединяемся к каналам
		for (let i = 0; i < channels.length; i += this.channelsPerBatch) {
			const batch = channels.slice(i, i + this.channelsPerBatch);

			try {
				// Присоединяемся к пакету каналов
				await client.join(...batch);
				console.log(`[Соединение ${connectionId}] Подключились к пакету каналов: ${batch.join(', ')}`);

				// Ждем перед следующим пакетом (кроме последнего)
				if (i + this.channelsPerBatch < channels.length) {
					console.log(`[Соединение ${connectionId}] Ожидание ${this.batchDelay / 1000} секунд перед следующим пакетом...`);
					await new Promise(resolve => setTimeout(resolve, this.batchDelay));
				}
			} catch (error) {
				console.error(`[Соединение ${connectionId}] Ошибка подключения к пакету каналов ${batch.join(', ')}:`, error);
			}
		}

		console.log(`[Соединение ${connectionId}] Завершено подключение ко всем каналам`);
	}

	/**
	 * Включает мониторинг каналов
	 * @param {string[]} channels - Каналы для мониторинга
	 */
	async enableChecker(channels) {
		if (this.isEnabled) {
			console.log('ViewBoi Checker уже включен');
			return;
		}

		console.log('Включаем ViewBoi Checker...');
		this.isEnabled = true;

		// Разделяем каналы на группы
		const channelGroups = this.splitChannelsIntoGroups(channels);
		console.log(`Создаем ${channelGroups.length} соединений для ${channels.length} каналов`);

		// Создаем соединения для каждой группы
		for (let i = 0; i < channelGroups.length; i++) {
			const connectionId = i + 1;
			const groupChannels = channelGroups[i];

			console.log(`[Соединение ${connectionId}] Создаем соединение для ${groupChannels.length} каналов`);

			const client = this.createConnection(groupChannels, connectionId);
			this.connections.set(connectionId, {
				client: client,
				channels: groupChannels
			});

			// Подключаемся к каналам постепенно
			try {
				await this.connectToChannelsGradually(client, groupChannels, connectionId);
			} catch (error) {
				console.error(`[Соединение ${connectionId}] Ошибка подключения:`, error);
			}
		}

		console.log('ViewBoi Checker успешно включен');
	}

	/**
	 * Выключает мониторинг каналов
	 */
	async disableChecker() {
		if (!this.isEnabled) {
			console.log('ViewBoi Checker уже выключен');
			return;
		}

		console.log('Выключаем ViewBoi Checker...');
		this.isEnabled = false;

		// Отключаем все соединения
		const disconnectPromises = [];
		for (const [connectionId, connection] of this.connections) {
			console.log(`[Соединение ${connectionId}] Отключаем соединение`);
			disconnectPromises.push(
				connection.client.disconnect().catch(error => {
					console.error(`[Соединение ${connectionId}] Ошибка отключения:`, error);
				})
			);
		}

		// Ждем отключения всех соединений
		await Promise.all(disconnectPromises);

		// Очищаем карту соединений
		this.connections.clear();

		console.log('ViewBoi Checker успешно выключен');
	}

	/**
	 * Получает статус чекера
	 * @returns {Object} Статус чекера
	 */
	getStatus() {
		return {
			enabled: this.isEnabled,
			activeConnections: this.connections.size,
			connections: Array.from(this.connections.entries()).map(([id, conn]) => ({
				id: id,
				channels: conn.channels.length,
				channelList: conn.channels
			}))
		};
	}

	/**
	 * Получает все мониторимые каналы
	 * @returns {string[]} Массив всех каналов
	 */
	getAllChannels() {
		const allChannels = [];
		for (const connection of this.connections.values()) {
			allChannels.push(...connection.channels);
		}
		return allChannels;
	}
}

module.exports = IRCManager;
