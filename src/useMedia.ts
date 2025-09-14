import { useMediaQuery } from 'react-responsive';

export const useMedia = () => {
	const isMobile = useMediaQuery({ query: '(max-width: 720px)' });
	const isTablet = useMediaQuery({
		query: '(min-width: 720px) and (max-width: 1200px)'
	});

	return { isMobile, isTablet, isDesktop: !isMobile && !isTablet };
};
