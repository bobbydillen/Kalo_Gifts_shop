/**
 * Common-sense checks for what a customer types at checkout, to stop obvious rubbish such as
 * "gjgghg" or "asdfgh" from becoming an order. They are deliberately gentle: they only reject
 * text that cannot be real, so real names and addresses (including short ones and odd spellings)
 * are never turned away. Used by the form and again on the server.
 */

const VOWELS = /[aeiouy]/i;
// runs of neighbouring keys on a keyboard, the usual way people mash text in
const KEYBOARD_RUNS = ["qwer", "wert", "erty", "rtyu", "tyui", "yuio", "uiop", "asdf", "sdfg", "dfgh", "fghj", "ghjk", "hjkl", "zxcv", "xcvb", "cvbn", "vbnm"];

/** True when the text cannot be something a person would really write. */
export function looksMashed(value: string): boolean {
  const text = value.toLowerCase();
  if (/(.)\1{3,}/.test(text)) return true; // the same character four or more times in a row
  const letters = text.replace(/[^a-z]/g, "");
  if (KEYBOARD_RUNS.some((run) => letters.includes(run))) return true;
  if (/[^aeiouy\W\d_]{6,}/.test(text)) return true; // six consonants in a row
  const words = text.split(/[^a-z]+/);
  // a word that is only a short chunk repeated, for example "xyzxyzxyz" or "sdfsdf"
  if (words.some((word) => word.length >= 6 && /^(.{2,5})\1+$/.test(word))) return true;
  // a long word with no vowel at all, for example "gjgghg"
  return words.filter((word) => word.length >= 5).some((word) => !VOWELS.test(word));
}

const wordsOf = (value: string) => value.split(/\s+/).filter(Boolean);

/** A person's name: letters, spaces and . ' - only, not mashed. Returns an error message or null. */
export function checkName(name: string): string | null {
  if (name.length < 2) return "Enter your full name.";
  if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(name)) return "Enter your name using letters only.";
  if (looksMashed(name)) return "That does not look like a real name. Please check it.";
  return null;
}

/** First line of an address: some real words, not just a few letters. */
export function checkAddressLine(line: string): string | null {
  const text = line.trim();
  if (text.length < 8 || wordsOf(text).length < 2) return "Enter your full address, with your house or flat number and street.";
  if (!/\p{L}/u.test(text)) return "Your address needs a street or building name, not only numbers.";
  if (looksMashed(text)) return "That does not look like a real address. Please check it.";
  return null;
}

/** Optional extra lines (landmark) only need to avoid being mashed. */
export function checkOptionalLine(line: string): string | null {
  const text = line.trim();
  return text && looksMashed(text) ? "That landmark does not look right. Please check it or leave it empty." : null;
}

/** A city or town typed by hand (only used when the pincode lookup is not available). */
export function checkPlace(place: string): string | null {
  const text = place.trim();
  if (text.length < 2 || !/^[\p{L}][\p{L}\s.'()-]*$/u.test(text)) return "Enter your city or town using letters only.";
  if (looksMashed(text)) return "That does not look like a real city or town. Please check it.";
  return null;
}

/** Numbers that are clearly made up: 9999999999, 9876543210 and similar. */
export function looksFakePhone(tenDigits: string): boolean {
  if (/^(\d)\1{9}$/.test(tenDigits)) return true;
  return ["9876543210", "9123456789", "8765432109", "7654321098", "6543210987", "9012345678"].includes(tenDigits);
}
