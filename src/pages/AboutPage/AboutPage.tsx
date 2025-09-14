import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import s from './AboutPage.module.scss';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';

const AboutPage = () => {
	const [showImage, setShowImage] = useState(false);
	const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

	const handleMouseEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		setImagePosition({
			x: rect.left + rect.width / 2,
			y: rect.top - 10
		});
		setShowImage(true);
	};

	const handleMouseLeave = () => {
		setShowImage(false);
	};

	return (
		<div className={'full_body'}>
			<div className={s.about}>
				<h1>О проекте</h1>
				<p>Я захотел проанализировать какой процент <span
					className={s.highlight}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
				>зрителей</span> стримов общаются в чате. Для этого я написал скрипт который подключается к чатам и мониторит
				   сообщения. А также использовал оффифиальное Helix API от Twitch. чтобы получить информацию об активных
				   стримах.</p>

				<AnimatePresence>
					{showImage && (
						<motion.div
							className={s.hoverImage}
							style={{
								left: `${imagePosition.x}px`,
								top: `${imagePosition.y}px`
							}}
							initial={{
								opacity: 0,
								y: -15,
								scale: 0.8,
								x: -40
							}}
							animate={{
								opacity: 1,
								y: -20,
								scale: 1
							}}
							exit={{
								opacity: 0,
								y: -15,
								scale: 0.8
							}}
							transition={{
								duration: 0.2,
								ease: 'easeInOut'
							}}
						>
							<p>💼</p>
							<img src="./images/Bedge-1x.webp" alt="Bedge" />
							<p>🤙</p>
						</motion.div>
					)}
				</AnimatePresence>

				<h2>Как это работает</h2>
				<p>Я использовал React и Express.js. Я подключаюсь к чатам из списка каналов по IRC, и слушаю все сообщения. Я
				   записываю ник пользователя, ник стримера, время отправки сообщения. Каждую минуту я суммаризирую данные и
				   получаю количество сообщений в минуту и количество уникальных пользователей, которые отправили хотя бы одно
				   сообщение в минуту.</p>
				<p><strong>Каждые 10 минут</strong> я получаю средние значения за последние 10 минут и сохраняю в файл. Также
				                                    запрашиваю
				                                    состояния стримов: включен ли, количество зрителей, название игры, название
				                                    стрима. Данные собраны с 09.09.2025 22:10 по 13.09.2025 19:10</p>
				<p>В основной таблице я отображаю средние значения за все время измерений. (в расчётах не учитываются измерения,
				   которые были сделаны при выключенном стриме)</p>
				<p>Я выбрал чуть больше <strong>100 каналов</strong> на основе топа на <strong>TwitchTracker</strong>. В
				   основном это русскоязычные персональные каналы, но есть несколько иностранных каналов для сравнения.</p>

				<p>Все данные взяты из открытых источников, и любой желающий может проверить или собрать эту статистику
				   самостоятельно. Мои результаты в файлах и исходный код вы можете посмотреть здесь: <a
						href="https://github.com/CHchisho/viewbot_checker" target="_blank" rel="noopener noreferrer">GitHub</a></p>

				<div className={s.buttons}>
					<Link to="/streamers" className={s.button}>
					<span>
					<Users size={16} />

					</span>
						Таблица стримеров</Link>
				</div>

				<p className={s.footer}>ViewBoi Checker is not affiliated with TwitchTracker, Twitch or Amazon. All Trademarks
				                        referred to are the property of their respective owners.</p>
			</div>
		</div>
	);
};

export default AboutPage;
