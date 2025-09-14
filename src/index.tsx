import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import App from './App';

import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 60 * 60 * 1000,
			cacheTime: 60 * 60 * 1000,
			refetchOnWindowFocus: false,
			retry: 2
		}
	}
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
	<QueryClientProvider client={queryClient}>
		<App />
	</QueryClientProvider>
);
