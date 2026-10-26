import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  ArrowRight, 
  Bot, 
  User, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Pause, 
  Play, 
  RotateCcw, 
  Square, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { cleanTextForSpeech } from '../../utils/speechSanitizer';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    actionTab?: 'landing' | 'shopping' | 'workspace' | 'saved' | 'support' | 'screenshot';
  };
  isError?: boolean;
  retryText?: string;
}

interface VeraAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'landing' | 'shopping' | 'workspace' | 'saved' | 'support') => void;
  onOpenScreenshotImport?: () => void;
}

const STARTER_QUESTIONS = [
  'How does VeraCost work?',
  'What is the price of Apple iPhone 16 Pro?',
  'Compare iPhone 16 Pro and Galaxy S24 Ultra',
  'How do I scan a packaging barcode?',
  'How can I search using a product image or Google Lens?',
  'Which Indian retailer has the lowest verified price?',
  'How do I import a screenshot with Ctrl+V?',
  'How can I contact Lead Developer Ronak?',
];

export const VeraAssistantModal: React.FC<VeraAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenScreenshotImport,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('veracost_assistant_chat');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'welcome-1',
        role: 'assistant',
        text: 'Hi! I am Vera Assistant, your official AI shopping & total ownership cost guide. How can I help you make a smart buying decision today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Voice Input (Speech-to-Text) States
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Voice Output (Text-to-Speech) States
  const [activeAudioMessageId, setActiveAudioMessageId] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const [audioErrorId, setAudioErrorId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Persist messages in session
  useEffect(() => {
    try {
      sessionStorage.setItem('veracost_assistant_chat', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isLoading, isListening]);

  // Clean up audio and microphone on close or unmount
  const stopAudio = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setActiveAudioMessageId(null);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopAudio();
      stopListening();
    }
  }, [isOpen, stopAudio, stopListening]);

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      stopAudio();
      stopListening();
      Object.values(audioCacheRef.current).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
    };
  }, [stopAudio, stopListening]);

  // =========================================================================
  // VOICE INPUT (Speech to Text) Implementation via Web Speech API
  // =========================================================================
  const toggleVoiceInput = () => {
    setSpeechError(null);

    if (isListening) {
      stopListening();
      return;
    }

    // Check browser support for SpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Voice input is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputText(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[VeraVoice] Speech recognition event error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied. Please allow microphone access in your browser address bar.');
        } else if (event.error === 'no-speech') {
          setSpeechError('No speech was detected. Please tap the microphone and try speaking again.');
        } else if (event.error === 'network') {
          setSpeechError('Network error occurred during voice recognition.');
        } else {
          setSpeechError(`Voice recognition error (${event.error}). You can type your question directly.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('[VeraVoice] Could not start speech recognition:', err);
      setIsListening(false);
      setSpeechError('Could not initialize microphone. Please check permissions.');
    }
  };

  // =========================================================================
  // VOICE OUTPUT (Text to Speech) Implementation
  // Uses server-side synthesis route (Rime API backend) with browser fallback
  // =========================================================================
  const handleToggleVoiceOutput = async (messageId: string, rawText: string) => {
    setAudioErrorId(null);

    // If currently playing this message, toggle pause / resume
    if (activeAudioMessageId === messageId && audioPlayerRef.current) {
      if (isPlayingAudio) {
        audioPlayerRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioPlayerRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => setIsPlayingAudio(false));
      }
      return;
    }

    // Stop any existing audio
    stopAudio();

    // Check if we already have a cached audio Blob URL for this message
    if (audioCacheRef.current[messageId]) {
      const cachedUrl = audioCacheRef.current[messageId];
      playAudioElement(cachedUrl, messageId);
      return;
    }

    // Fetch synthesis audio from backend TTS service
    setAudioLoadingId(messageId);
    try {
      const resp = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      });

      if (resp.ok) {
        const audioBlob = await resp.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        audioCacheRef.current[messageId] = audioUrl;
        playAudioElement(audioUrl, messageId);
      } else {
        // Fallback to browser-native Web Speech Synthesis if available
        playNativeBrowserSpeech(rawText, messageId);
      }
    } catch (err) {
      console.warn('[VeraVoice] TTS service fetch error, falling back to browser speech:', err);
      playNativeBrowserSpeech(rawText, messageId);
    } finally {
      setAudioLoadingId(null);
    }
  };

  const playAudioElement = (audioUrl: string, messageId: string) => {
    const audio = new Audio(audioUrl);
    audioPlayerRef.current = audio;

    audio.onended = () => {
      setIsPlayingAudio(false);
      setActiveAudioMessageId(null);
    };

    audio.onerror = () => {
      setIsPlayingAudio(false);
      setActiveAudioMessageId(null);
      setAudioErrorId(messageId);
    };

    audio.play()
      .then(() => {
        setIsPlayingAudio(true);
        setActiveAudioMessageId(messageId);
      })
      .catch((playErr) => {
        console.warn('[VeraVoice] Playback error:', playErr);
        setIsPlayingAudio(false);
        setActiveAudioMessageId(null);
        setAudioErrorId(messageId);
      });
  };

  const playNativeBrowserSpeech = (rawText: string, messageId: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const clean = cleanTextForSpeech(rawText);
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';

        utterance.onstart = () => {
          setIsPlayingAudio(true);
          setActiveAudioMessageId(messageId);
        };
        utterance.onend = () => {
          setIsPlayingAudio(false);
          setActiveAudioMessageId(null);
        };
        utterance.onerror = () => {
          setIsPlayingAudio(false);
          setActiveAudioMessageId(null);
          setAudioErrorId(messageId);
        };

        window.speechSynthesis.speak(utterance);
      } catch {
        setAudioErrorId(messageId);
      }
    } else {
      setAudioErrorId(messageId);
    }
  };

  // =========================================================================
  // MESSAGE SENDING & CHATBOT PIPELINE
  // =========================================================================
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    // Stop voice listening if user clicks Send
    if (isListening) {
      stopListening();
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Append user message immediately
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);
    setSpeechError(null);

    const customKey = sessionStorage.getItem('nebius_custom_api_key') || '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (customKey) {
      headers['x-nebius-api-key'] = customKey;
    }

    try {
      const resp = await fetch('/api/support/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userMessage: text,
          // Pass the updated conversation history including the user's latest query
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.text })),
          customApiKey: customKey || undefined,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const replyText = data.reply || 'I am here to help. Could you please rephrase your question?';
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedAction: data.suggestedAction,
          },
        ]);
      } else {
        throw new Error(`Chat API error (${resp.status})`);
      }
    } catch (err: any) {
      console.warn('[VeraAssistant] Network or API error:', err.message);
      // Helpful error state with retry button, instead of a repeated static string!
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          text: 'Unable to connect to assistant service. Please check your internet connection or click below to retry.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
          retryText: text,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    stopAudio();
    stopListening();
    const welcomeMsg: ChatMessage = {
      id: 'welcome-reset',
      role: 'assistant',
      text: 'Conversation reset. How can I assist you with your cost comparison or shopping search?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([welcomeMsg]);
    try {
      sessionStorage.removeItem('veracost_assistant_chat');
    } catch {}
  };

  const handleActionClick = (actionTab?: string) => {
    if (!actionTab) return;
    if (actionTab === 'screenshot' && onOpenScreenshotImport) {
      onOpenScreenshotImport();
      onClose();
      return;
    }
    if (
      actionTab === 'landing' ||
      actionTab === 'shopping' ||
      actionTab === 'workspace' ||
      actionTab === 'saved' ||
      actionTab === 'support'
    ) {
      onNavigateTab(actionTab);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 410,
        maxWidth: 'calc(100vw - 32px)',
        height: 590,
        maxHeight: 'calc(100vh - 48px)',
        background: 'var(--bg-card, #0f172a)',
        border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
        borderRadius: 'var(--radius-xl, 16px)',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        overflow: 'hidden',
        backdropFilter: 'blur(16px)',
      }}
      role="dialog"
      aria-label="Vera Assistant Chat"
    >
      {/* Chat Header */}
      <div
        style={{
          padding: '0.9rem 1.1rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(20, 184, 166, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--teal-bright), #3b82f6)',
              color: '#080c14',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot size={19} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Vera Assistant
              </span>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--teal-bright)',
                  display: 'inline-block',
                }}
              />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              AI Shopping & Decision Guide
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            type="button"
            onClick={handleClearChat}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: 'var(--radius-xs)',
            }}
            title="Clear conversation"
            aria-label="Clear conversation"
          >
            <Trash2 size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: 'var(--radius-xs)',
            }}
            aria-label="Close assistant"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Global Speech Error Banner */}
      {speechError && (
        <div
          style={{
            padding: '0.5rem 0.85rem',
            background: 'rgba(245, 158, 11, 0.1)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
            fontSize: '0.74rem',
            color: 'var(--amber-warning, #f59e0b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{speechError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSpeechError(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.9rem',
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '88%',
                padding: '0.75rem 0.95rem',
                borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                background: m.role === 'user'
                  ? 'var(--teal-bright)'
                  : m.isError
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(255, 255, 255, 0.06)',
                color: m.role === 'user'
                  ? '#080c14'
                  : m.isError
                  ? 'var(--coral-danger, #ef4444)'
                  : 'var(--text-main)',
                fontSize: '0.84rem',
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
                fontWeight: m.role === 'user' ? 600 : 400,
                border: m.role === 'user'
                  ? 'none'
                  : m.isError
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : '1px solid var(--border-subtle)',
              }}
            >
              {m.text}
            </div>

            {/* Error Retry Button */}
            {m.isError && m.retryText && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleSendMessage(m.retryText)}
                style={{
                  marginTop: '0.4rem',
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.72rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: 'var(--teal-bright)',
                }}
              >
                <RotateCcw size={11} /> Retry Request
              </button>
            )}

            {/* Suggested Action Pill */}
            {m.suggestedAction && !m.isError && (
              <button
                type="button"
                onClick={() => handleActionClick(m.suggestedAction?.actionTab)}
                style={{
                  marginTop: '0.45rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(20, 184, 166, 0.12)',
                  border: '1px solid rgba(20, 184, 166, 0.3)',
                  color: 'var(--teal-bright)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <span>{m.suggestedAction.label}</span>
                <ArrowRight size={11} />
              </button>
            )}

            {/* Assistant Voice Output & Message Metadata */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                marginTop: '0.25rem',
                padding: '0 0.35rem',
              }}
            >
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {m.timestamp}
              </span>

              {/* Speaker / Voice Playback Button (for Assistant Messages) */}
              {m.role === 'assistant' && !m.isError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleVoiceOutput(m.id, m.text)}
                    disabled={audioLoadingId === m.id}
                    style={{
                      background: activeAudioMessageId === m.id ? 'rgba(20, 184, 166, 0.15)' : 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-xs)',
                      padding: '0.2rem 0.4rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: activeAudioMessageId === m.id ? 'var(--teal-bright)' : 'var(--text-muted)',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      transition: 'all 0.15s ease',
                    }}
                    title={activeAudioMessageId === m.id && isPlayingAudio ? 'Pause playback' : 'Speak response'}
                    aria-label={activeAudioMessageId === m.id && isPlayingAudio ? 'Pause playback' : 'Speak response'}
                  >
                    {audioLoadingId === m.id ? (
                      <RefreshCw size={12} className="spin" style={{ color: 'var(--teal-bright)' }} />
                    ) : activeAudioMessageId === m.id && isPlayingAudio ? (
                      <>
                        <Pause size={12} />
                        <span>Playing audio…</span>
                      </>
                    ) : activeAudioMessageId === m.id && !isPlayingAudio ? (
                      <>
                        <Play size={12} />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={12} />
                        <span>Speak response</span>
                      </>
                    )}
                  </button>

                  {/* Stop button when active */}
                  {activeAudioMessageId === m.id && (
                    <button
                      type="button"
                      onClick={stopAudio}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.2rem',
                      }}
                      title="Stop playback"
                      aria-label="Stop playback"
                    >
                      <Square size={11} />
                    </button>
                  )}

                  {audioErrorId === m.id && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--amber-warning)' }}>
                      Audio unavailable
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.5rem 0' }}>
            <RefreshCw size={14} className="spin" style={{ color: 'var(--teal-bright)' }} />
            <span>Vera is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Questions (when conversation is short) */}
      {messages.length <= 2 && (
        <div
          style={{
            padding: '0.5rem 0.85rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            Suggested questions:
          </div>
          <div
            style={{
              display: 'flex',
              gap: '0.35rem',
              overflowX: 'auto',
              paddingBottom: '0.25rem',
            }}
          >
            {STARTER_QUESTIONS.slice(0, 4).map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Listening Indicator */}
      {isListening && (
        <div
          style={{
            padding: '0.55rem 0.85rem',
            background: 'rgba(20, 184, 166, 0.12)',
            borderTop: '1px solid rgba(20, 184, 166, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: 'var(--teal-bright)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#ef4444',
                display: 'inline-block',
                animation: 'pulse 1.2s infinite',
              }}
            />
            <span style={{ fontWeight: 600 }}>Listening… speak your question now</span>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={stopListening}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => {
                stopListening();
                setInputText('');
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.72rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Input Form with Voice & Text Options */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        style={{
          padding: '0.75rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '0.45rem',
          alignItems: 'center',
          background: 'var(--bg-card)',
        }}
      >
        {/* Voice Input (Microphone) Button */}
        <button
          type="button"
          onClick={toggleVoiceInput}
          style={{
            padding: '0.55rem 0.65rem',
            borderRadius: 'var(--radius-md)',
            background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.06)',
            border: isListening ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
            color: isListening ? '#ef4444' : 'var(--teal-bright)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          title={isListening ? 'Stop listening' : 'Voice input (Click to speak)'}
          aria-label={isListening ? 'Stop listening' : 'Voice input'}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>

        <input
          type="text"
          className="form-input"
          placeholder={isListening ? 'Listening…' : 'Ask Vera about prices, TCO, scanning...'}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
          style={{ flex: 1, fontSize: '0.84rem', padding: '0.55rem 0.75rem' }}
        />

        <button
          type="submit"
          className="btn-primary"
          disabled={!inputText.trim() || isLoading}
          style={{ padding: '0.55rem 0.8rem', borderRadius: 'var(--radius-md)' }}
          aria-label="Send message"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};
