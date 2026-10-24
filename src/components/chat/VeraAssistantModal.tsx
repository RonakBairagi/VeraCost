import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  HelpCircle, 
  ArrowRight, 
  ExternalLink,
  Bot,
  User,
  ShoppingBag,
  SlidersHorizontal,
  LifeBuoy
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    actionTab?: 'landing' | 'shopping' | 'workspace' | 'saved' | 'support' | 'screenshot';
  };
}

interface VeraAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'landing' | 'shopping' | 'workspace' | 'saved' | 'support') => void;
  onOpenScreenshotImport?: () => void;
}

const STARTER_QUESTIONS = [
  'How does VeraCost work?',
  'How do I scan a barcode?',
  'How can I search using a product image?',
  'Which retailer has the lowest verified price?',
  'How does total ownership cost work?',
  'Why could a product not be found?',
  'How do I compare multiple products?',
  'How can I contact support?',
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem('veracost_assistant_chat', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

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
          messages: messages.map((m) => ({ role: m.role, content: m.text })),
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
        throw new Error('Chat API returned error');
      }
    } catch {
      // Local fallback in case server is unreachable
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: 'VeraCost compares upfront retailer prices (Amazon India, Flipkart, Croma) against True Total Cost of Ownership (accessories, warranties, energy, resale recovery). You can scan a barcode, snap a product photo, or explore our Simulator Workspace.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedAction: { label: 'Explore Smart Price Finder', actionTab: 'shopping' },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
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
        width: 390,
        maxWidth: 'calc(100vw - 32px)',
        height: 560,
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
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--teal-bright), #3b82f6)',
              color: '#080c14',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
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
              padding: '0.3rem',
              borderRadius: 'var(--radius-xs)',
            }}
            title="Clear conversation"
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
              padding: '0.3rem',
              borderRadius: 'var(--radius-xs)',
            }}
            aria-label="Close assistant"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
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
                maxWidth: '85%',
                padding: '0.7rem 0.9rem',
                borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                background: m.role === 'user' ? 'var(--teal-bright)' : 'rgba(255, 255, 255, 0.06)',
                color: m.role === 'user' ? '#080c14' : 'var(--text-main)',
                fontSize: '0.84rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                fontWeight: m.role === 'user' ? 600 : 400,
                border: m.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
              }}
            >
              {m.text}
            </div>

            {/* Suggested Action Pill */}
            {m.suggestedAction && (
              <button
                type="button"
                onClick={() => handleActionClick(m.suggestedAction?.actionTab)}
                style={{
                  marginTop: '0.4rem',
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
                }}
              >
                <span>{m.suggestedAction.label}</span>
                <ArrowRight size={11} />
              </button>
            )}

            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem', padding: '0 0.3rem' }}>
              {m.timestamp}
            </span>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <RefreshCw size={14} className="spin" style={{ color: 'var(--teal-bright)' }} />
            <span>Vera is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompts (if chat is short) */}
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

      {/* Input Field */}
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
          background: 'var(--bg-card)',
        }}
      >
        <input
          type="text"
          className="form-input"
          placeholder="Ask Vera about prices, TCO, scanning..."
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
