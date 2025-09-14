import { copyToClipboard, createShareLink } from '../utils';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { CheckCheck, Copy, Share } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type CopyButtonProps = {
	paragraphRef: React.RefObject<HTMLParagraphElement>;
	year: string;
	wt_number: string;
	bookName?: string;
	isFromBook: boolean;
	[key: string]: any;
};

export const CopyButton: React.FC<CopyButtonProps> = ({
	paragraphRef,
	year,
	wt_number,
	bookName,
	isFromBook,
	...props
}) => {
	const [isCopied, setIsCopied] = useState(false);
	const { t } = useTranslation();

	return (
		<button
			{...props}
			onClick={() => {
				if (paragraphRef.current) {
					const clone = paragraphRef.current.cloneNode(true) as HTMLElement;
					clone.querySelectorAll('svg, .copy-icon').forEach((el) => el.remove());
					let textToCopy = clone.innerText.trim();
					textToCopy = textToCopy + (isFromBook ? ` - ${bookName}` : ` - №${wt_number} ${year}`);
					copyToClipboard(textToCopy);
					setIsCopied(true);
					setTimeout(() => setIsCopied(false), 2000);
				}
			}}
		>
			{isCopied ? <CheckCheck size={16} /> : <Copy size={16} />}
			<p>{isCopied ? t('buttons.copied') : t('buttons.copy')}</p>
		</button>
	);
};

type ShareButtonProps = {
	paragraphRef: React.RefObject<HTMLParagraphElement>;
	params: (string | number | boolean)[];
	bookName?: string;
	isFromBook: boolean;
	[key: string]: any;
};

export const ShareButton: React.FC<ShareButtonProps> = ({ paragraphRef, params, bookName, isFromBook, ...props }) => {
	const [year, wt_number, lineIndex, query, exactOrder, wholeWords, exactCase, wordsBeside] = params;
	const { t } = useTranslation();

	const [isCopied, setIsCopied] = useState(false);

	const handleClick = () => {
		if (paragraphRef.current) {
			const clone = paragraphRef.current.cloneNode(true) as HTMLElement;
			clone.querySelectorAll('svg, .copy-icon').forEach((el) => el.remove());
			const textToShare = clone.innerText.trim() + (isFromBook ? ` - ${bookName}` : ` - №${wt_number} ${year}`);
			const link = createShareLink(
				String(year),
				String(wt_number),
				String(lineIndex),
				String(query),
				Boolean(exactOrder),
				Boolean(wholeWords),
				Boolean(exactCase),
				Boolean(wordsBeside),
				Boolean(isFromBook),
				String(bookName)
			);

			setIsCopied(true);
			setTimeout(() => {
				setIsCopied(false);
			}, 2000);

			if (window.innerWidth > 600 || !navigator.share) {
				// Ссылка в буфер обмена
				copyToClipboard(textToShare + '\n' + link);
				// toast.success("")
			} else if (navigator.share) {
				// Web Share API для мобильных устройств
				navigator.share({ text: textToShare, url: link }).catch((error) => {
					console.error('Error using Web Share API: ', error);
					toast.error('Failed to share😔');
				});
			} else {
				toast.error('Web Share API is not supported on this browser.');
			}
		}
	};

	return (
		<button onClick={handleClick} {...props}>
			{isCopied ? <CheckCheck size={16} /> : <Share size={16} />}
			<p>{isCopied ? t('buttons.copied') : t('buttons.share')}</p>
		</button>
	);
};

type CopySelectedButtonProps = {
	selectedParagraphs: string[];
	year: string;
	wt_number: string;
	bookName?: string;
	isFromBook: boolean;
	[key: string]: any;
};

export const CopySelectedButton: React.FC<CopySelectedButtonProps> = ({
	selectedParagraphs,
	year,
	wt_number,
	bookName,
	isFromBook,
	...props
}) => {
	const [isCopied, setIsCopied] = useState(false);
	const { t } = useTranslation();

	const handleCopySelected = () => {
		if (selectedParagraphs.length === 0) return;

		const textsToCopy: string[] = [];

		// Проходим по всем выделенным абзацам
		selectedParagraphs.forEach((lineIndex) => {
			// Находим элемент параграфа по data-line-index
			const paragraphElement = document.querySelector(`[data-line-index="${lineIndex}"] p`) as HTMLParagraphElement;

			if (paragraphElement) {
				// Клонируем элемент и удаляем SVG и иконки копирования
				const clone = paragraphElement.cloneNode(true) as HTMLElement;
				clone.querySelectorAll('svg, .copy-icon').forEach((el) => el.remove());
				const textToCopy = clone.innerText.trim();
				textsToCopy.push(textToCopy);
			}
		});

		if (textsToCopy.length > 0) {
			// Объединяем все тексты с разделителями
			const combinedText = textsToCopy.join('\n\n');
			const finalText = combinedText + (isFromBook ? ` - ${bookName}` : ` - №${wt_number} ${year}`);

			copyToClipboard(finalText);
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000);
		}
	};

	return (
		<button
			{...props}
			onClick={handleCopySelected}
			disabled={selectedParagraphs.length === 0}
		>
			{isCopied ? <CheckCheck size={16} /> : <Copy size={16} />}
			<p>{isCopied ? t('buttons.copied') : t('buttons.copy')}</p>
			<h6>{selectedParagraphs.length}</h6>
		</button>
	);
};
