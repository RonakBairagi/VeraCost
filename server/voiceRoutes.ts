// Server-Side Voice Synthesis & Audio Generation Route
// Securely interfaces with the configured Text-to-Speech service.
// Keeps all API credentials strictly on the backend.

import { Router, Request, Response } from 'express';

export const voiceRouter = Router();

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

  // Clean currency symbols for phonetic clarity if needed
  cleaned = cleaned.replace(/₹\s?([0-9,]+)/g, 'Rs. $1');

  // Normalize multiple spaces and newlines
  cleaned = cleaned.replace(/\n+/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Limit to reasonable synthesis length (e.g. 1200 characters)
  if (cleaned.length > 1200) {
    cleaned = cleaned.slice(0, 1200) + '...';
  }

  return cleaned;
}

// 1. Text to Speech Synthesis Endpoint
voiceRouter.post('/tts', async (req: Request, res: Response) => {
  try {
    const { text, speaker, model } = req.body || {};

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'Text content is required for speech synthesis.' });
    }

    const apiKey = process.env.RIME_API_KEY?.trim();
    if (!apiKey || apiKey === '' || apiKey.includes('your_rime_tts')) {
      return res.status(503).json({
        error: 'Voice service is not configured on the server.',
        message: 'RIME_API_KEY environment variable is required for speech synthesis.',
      });
    }

    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) {
      return res.status(400).json({ error: 'Text content resulted in empty speech payload.' });
    }

    const targetSpeaker = speaker || process.env.RIME_SPEAKER || 'celeste';
    const targetModel = model || process.env.RIME_MODEL || 'coda';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const rimeResp = await fetch('https://users.rime.ai/v1/rime-tts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'audio/mp3',
      },
      body: JSON.stringify({
        text: cleanText,
        speaker: targetSpeaker,
        modelId: targetModel,
        lang: 'en',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!rimeResp.ok) {
      const errText = await rimeResp.text().catch(() => '');
      console.warn(`[VoiceService] TTS HTTP ${rimeResp.status}: ${errText.slice(0, 200)}`);
      return res.status(rimeResp.status).json({
        error: 'Voice synthesis service failed to generate audio.',
        details: errText.slice(0, 200),
      });
    }

    const arrayBuffer = await rimeResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=86400, immutable',
    });

    return res.send(buffer);
  } catch (err: any) {
    console.error('[VoiceService] Unexpected TTS error:', err.message);
    res.status(500).json({
      error: 'Voice generation error',
      message: err.message || 'An unexpected error occurred during speech synthesis.',
    });
  }
});

// 2. Voice Configuration Status Endpoint (Non-sensitive)
voiceRouter.get('/status', (req: Request, res: Response) => {
  const apiKey = process.env.RIME_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.trim() !== '' && !apiKey.includes('your_rime_tts'));

  res.json({
    isConfigured,
    defaultSpeaker: process.env.RIME_SPEAKER || 'celeste',
    defaultModel: process.env.RIME_MODEL || 'coda',
    format: 'audio/mp3',
  });
});
