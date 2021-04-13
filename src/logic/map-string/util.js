const base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
export const endDelimChar = ".";

export function toBase64(number, padLength = 1) {
	if (number < 0) {
		throw new Error("negative number bad!");
	}

	let str = "";
	while (number !== 0) {
		str = base64[number % 64] + str;
		number = Math.floor(number / 64);
	}

	return str.padStart(padLength, base64[0]);
}

export function fromBase64(str) {
	let num = 0;
	for (let i = 0; i < str.length; i++) {
		const value = base64.indexOf(str[i]);
		const power = str.length - i - 1;
		num += value * 64 ** power;
	}

	return num;
}
