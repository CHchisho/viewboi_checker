import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AppContextType {
	fontSize: number;
	setFontSize: (size: number) => void;
	language: string;
	setLanguage: (lang: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [fontSize, setFontSize] = useState(() => {
		return Number(localStorage.getItem('fontSize')) || 16;
	});
	const [language, setLanguage] = useState(() => {
		return localStorage.getItem('language') || 'en';
	});

	useEffect(() => {
		localStorage.setItem('fontSize', String(fontSize));
		localStorage.setItem('language', language);
	}, [language, fontSize]);

	const value = {
		fontSize,
		setFontSize,
		language,
		setLanguage
	};

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
	const context = useContext(AppContext);
	if (context === undefined) {
		throw new Error('useAppContext must be used within an AppProvider');
	}
	return context;
};
