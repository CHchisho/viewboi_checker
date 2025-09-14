import React, { useEffect } from 'react';
import './App.css';
import { HashRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import NotFoundPage from './pages/NotFound/NotFoundPage';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MainPage from './pages/MainPage/MainPage';
import { Tooltip } from 'react-tooltip';
import { AppProvider } from './contexts/AppContext';
import { Header } from './components/Header/Header';
import StreamerInfo from './pages/StreamerInfo/StreamerInfo';
import AboutPage from './pages/AboutPage/AboutPage';


const App: React.FC = () => {
	return (
		<AppProvider>
			<Router future={{ v7_startTransition: true }}>
				<AppContent />
			</Router>
		</AppProvider>
	);
};

const AppContent: React.FC = () => {
	const location = useLocation();

	useEffect(() => {
		switch (location.pathname) {
			case '/':
				document.title = 'ViewBoi Checker';
				break;
			case '/streamers':
				document.title = 'Каналы - ViewBoi Checker';
				break;
			default:
				if (location.pathname.startsWith('/streamer/')) {
					break;
				} else {
					document.title = 'Page not found';
				}
				break;
		}
	}, [location]);

	return (
		<>
			<Header />
			<Routes>
				<Route path="/" element={<AboutPage />} />
				<Route path="/streamer/:streamer" element={<StreamerInfo />} />
				<Route path="/streamers" element={<MainPage />} />
				<Route path="*" element={<NotFoundPage />} />
			</Routes>

			<ToastContainer />
			<Tooltip id="info-tooltip" delayShow={1000} style={{ zIndex: '1000' }} />
		</>
	);
};

export default App;
