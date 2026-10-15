import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Key, 
  Globe, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { BRAND_CONFIG } from '../config/branding';

interface NebiusSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAiLive: boolean;
  onConfigChanged: () => void;
}

export const NebiusSettingsModal: React.FC<NebiusSettingsModalProps> = ({
  isOpen,
  onClose,
  isAiLive,
  onConfigChanged,
}) => {
  const [apiKey, setApiKey] = useState(
    sessionStorage.getItem('nebius_custom_api_key') || ''
  );
  const [selectedModel, setSelectedModel] = useState(
    sessionStorage.getItem('nebius_custom_model') || BRAND_CONFIG.defaultModel
  );
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const resp = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
        }),
      });

      const data = await resp.json();
      if (resp.ok && data.valid) {
        setTestResult({
          success: true,
          message: data.message || 'Nebius Token Factory connection verified!',
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || 'Verification failed. Check your API key.',
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: `Connection error: ${e.message}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (apiKey.trim()) {
      sessionStorage.setItem('nebius_custom_api_key', apiKey.trim());
    } else {
      sessionStorage.removeItem('nebius_custom_api_key');
    }
    sessionStorage.setItem('nebius_custom_model', selectedModel);
    onConfigChanged();
    onClose();
  };

  const handleClear = () => {
    sessionStorage.removeItem('nebius_custom_api_key');
    setApiKey('');
    setTestResult(null);
    onConfigChanged();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Cpu size={22} style={{ color: 'var(--teal-bright)' }} />
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Nebius Token Factory & NVIDIA Nemotron</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Official Hackathon Integration Configuration
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Current Status banner */}
        <div
          style={{
            background: isAiLive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${isAiLive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          {isAiLive ? (
            <CheckCircle2 size={22} style={{ color: 'var(--emerald-success)', flexShrink: 0 }} />
          ) : (
            <AlertTriangle size={22} style={{ color: 'var(--amber-warning)', flexShrink: 0 }} />
          )}
          <div style={{ fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 700, color: '#fff' }}>
              {isAiLive ? 'Active Live Nebius Token Factory Connection' : 'Mock Development Mode Active'}
            </div>
            <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {isAiLive
                ? 'Your queries are processed live by NVIDIA Nemotron hosted on Nebius Token Factory.'
                : 'No active API key detected. VeraCost serves verified deterministic mock reasoning. Enter your key below or set NEBIUS_API_KEY in .env.'}
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Nebius API Key
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="password"
                className="input-box"
                placeholder="Enter your Nebius Token Factory key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button
                className="btn-secondary"
                style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                onClick={handleTestKey}
                disabled={isTesting || !apiKey.trim()}
              >
                {isTesting ? 'Testing...' : 'Test Key'}
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Get your key from the{' '}
              <a href="https://tokenfactory.nebius.com" target="_blank" rel="noopener noreferrer">
                Nebius Token Factory Console <ExternalLink size={10} />
              </a>
              . Key is kept in server memory or session only.
            </div>
          </div>

          {testResult && (
            <div
              style={{
                fontSize: '0.82rem',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                color: testResult.success ? '#34d399' : '#fb7185',
                border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              }}
            >
              {testResult.message}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              NVIDIA Nemotron Model Identifier
            </label>
            <select
              className="input-box"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {BRAND_CONFIG.supportedModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider})
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Hosted on Nebius Token Factory with OpenAI-compatible REST API.
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Verified Token Factory Base URL
            </label>
            <input
              type="text"
              className="input-box"
              disabled
              value="https://api.tokenfactory.us-central1.nebius.com/v1"
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleClear}
            style={{ fontSize: '0.82rem', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            Clear / Revert to Mock Mode
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-secondary" onClick={onClose} style={{ fontSize: '0.85rem' }}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave} style={{ fontSize: '0.85rem' }}>
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
