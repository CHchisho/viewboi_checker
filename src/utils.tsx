import { toast } from 'react-toastify';
import { bookNamesYear } from './constants';
import { useTranslation } from 'react-i18next';

export const removeHTMLTags = (text: string) => {
	return text.replace(/<[^>]+>/g, '');
};

export const copyToClipboard = (text: string) => {
	console.log(removeHTMLTags(text));
	navigator.clipboard
		.writeText(removeHTMLTags(text))
		.then(() => {
			// toast.success('Copied!');
		})
		.catch((error) => {
			console.error('Failed to copy text: ', error);
			toast.error('Failed to copy text');
		});
};

export const createShareLink = (
	year: string,
	wt_number: string,
	lineIndex: string,
	query: string,
	exactOrder: boolean,
	wholeWords: boolean,
	exactCase: boolean,
	wordsBeside: boolean,
	isFromBook: boolean,
	bookName?: string
) => {
	const params = new URLSearchParams();
	if (query.length > 0) {
		params.append('q', encodeURIComponent(query));
	}
	if (exactOrder) {
		params.append('eo', '1');
	}
	if (wholeWords) {
		params.append('ww', '1');
	}
	if (exactCase) {
		params.append('ec', '1');
	}
	if (wordsBeside) {
		params.append('wb', '1');
	}
	params.append('li', lineIndex);

	const link = isFromBook
		? `/book/${bookNamesYear[bookName!].short}?${params.toString()}`
		: `/wt/${year}/${wt_number}?${params.toString()}`;

	return link;
};

// Открыть в переводчике
export const openInGoogleTranslate = (text: string, language: string) => {
	const plainText = removeHTMLTags(text);
	if (language === 'ua') {
		language = 'uk'; // Другой код
	}
	const googleTranslateUrl = `https://translate.google.com/?sl=en&tl=${language}&text=${encodeURIComponent(
		plainText
	)}&op=translate`;
	window.open(googleTranslateUrl, '_blank');
};

// Открыть в DeepL переводчике
export const openInDeepLTranslate = (text: string, language: string) => {
	const plainText = removeHTMLTags(text);
	if (language === 'ua') {
		language = 'uk'; // Другой код
	}
	const deepLTranslateUrl = `https://www.deepl.com/en/translator#en/${language}/${encodeURIComponent(plainText)}`;
	window.open(deepLTranslateUrl, '_blank');
};

// Функция для определения правильной формы слова в зависимости от числа
export const getPluralForm = (count: number, key: string, t: (key: string) => string) => {
	if (count === 1) {
		return t(`results.${key}_one`);
	} else if (count % 10 >= 2 && count % 10 <= 4) {
		return t(`results.${key}_few`);
	} else {
		return t(`results.${key}_many`);
	}
};

export function getFullBookNameByShort(short: string): string | undefined {
	for (const [fullName, data] of Object.entries(bookNamesYear)) {
		if (data.short === short) {
			return fullName;
		}
	}
	return undefined; // если не найдено
}

export const useBookTranslation = () => {
	const { t } = useTranslation();

	const getBookNameTranslated = (englishName: string): string => {
		return t(`bibleNames.${englishName}`, englishName);
	};

	const getBookAbbreviationTranslated = (englishName: string): string => {
		return t(`bibleAbbreviations.${englishName}`, englishName);
	};

	return {
		getBookNameTranslated,
		getBookAbbreviationTranslated
	};
};
