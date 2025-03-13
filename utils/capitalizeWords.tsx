export const capitalizeWords = (word: string): string => {
	return word.split(' ').map(word =>
		word.charAt(0).toUpperCase() + word.slice(1)
	).join(' ')
};