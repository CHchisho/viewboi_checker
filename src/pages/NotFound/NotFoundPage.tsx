import React from 'react';
import s from './NotFoundPage.module.scss';
import { useNavigate } from 'react-router-dom';
import { FileWarning } from 'lucide-react';

const NotFoundPage: React.FC = () => {
	const navigate = useNavigate();

	return (
		<div className={s.full_page}>
			<p style={{ fontSize: '6em', color: 'var(--red-1)' }}>
				<i className="bi bi-exclamation-triangle-fill"></i>
			</p>
			<FileWarning size={128} stroke={'#ff7070'} />
			<h1>404</h1>
			<p>Sorry, page not found.</p>
			<p>It may have been moved or deleted. Check the URL or return to the main page.</p>
			<button className={'simple_color_button red'} onClick={() => navigate('/')}>
				<p>RETURN TO HOME PAGE</p>{' '}
			</button>
		</div>
	);
};

export default NotFoundPage;
