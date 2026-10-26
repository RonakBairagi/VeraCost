// Speech Sanitizer Utility
// Cleans markdown formatting, code blocks, raw URLs, and currency symbols
// for natural-sounding voice synthesis across both frontend (Web Speech API) and backend (TTS API).
// Contains ZERO server-side or Node.js dependencies so it can safely be bundled in the browser.

/**
 * Strips markdown symbols, code blocks, bullet points, and raw URLs
 * to ensure clear, natural-sounding voice synthesis.
 */
export function cleanTextForSpeech(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let cleaned = rawText;

  // Remove code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

  // Remove markdown links e.g. [text](url) -> text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove raw URLs
  cleaned = cleaned.replace(/https?:\/\/\S+/gi, '');

  // Remove markdown headers, bold, italics
  cleaned = cleaned.replace(/#{1,6}\s+/g, '');
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');

  // Clean bullet list markers and numbered lists
  cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, '');
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, '');

  // Clean currency symbols for phonetic clarity
  cleaned = cleaned.replace(/₹\s?([0-9,]+)/g, 'Rs. $1');

  // Normalize multiple spaces and newlines
  cleaned = cleaned.replace(/\n+/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Limit to reasonable synthesis length
  if (cleaned.length > 1200) {
    cleaned = cleaned.slice(0, 1200) + '...';
  }

  return cleaned;
}
