import React, { useState } from 'react';
import s from './Header.module.scss';
import { Link, useNavigate } from 'react-router-dom';
import { Info, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Header: React.FC = () => {
	const navigate = useNavigate();
	const { t, i18n } = useTranslation();
	const [isHovered, setIsHovered] = useState(false);

	return (
		<header>
			<div className={s.header}>
				<Link
					className={s.logo}
					to="/"
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
				>
					<img
						src={isHovered ? './images/Susge-1x-anim.webp' : './images/Susge-1x.webp'}
						alt="logo"
						width={40}
						height={30}
					/>
					<div className={s.title}>
						<h1>ViewBoi Checker</h1>
					</div>
				</Link>
				<div className={s.buttons}>
					<Link to="/streamers" className={s.button}>
						<Users size={16} />
						<p>Каналы</p>
					</Link>
					<Link to="/" className={s.button}>
						<Info size={16} />
						<p>О проекте</p>
					</Link>
				</div>
			</div>
		</header>
	);
};
