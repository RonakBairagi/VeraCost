import React, { useState } from 'react';
import { 
  Sparkles, 
  Cpu, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Lightbulb, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { ComparisonAnalysisResult, AiReviewResponse } from '../types/cost';

interface AiExecutiveReviewProps {
  analysis: ComparisonAnalysisResult;
  isAiLive: boolean;
  onOpenSettings: () => void;
}

export const AiExecutiveReview: React.FC<AiExecutiveReviewProps> = ({
  analysis,
  isAiLive,
  onOpenSettings,
}) => {
  const [review, setReview] = useState<AiReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAiReview = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Look for custom key in sessionStorage if configured in settings modal
      const customKey = sessionStorage.getItem('nebius_custom_api_key') || undefined;
      const customModel = sessionStorage.getItem('nebius_custom_model') || undefined;

      const resp = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customKey ? { 'x-nebius-api-key': customKey } : {}),
        },
        body: JSON.stringify({
          analysis,
          customModel,
        }),
      });

      if (!resp.ok) {
        throw new Error(`Server returned HTTP ${resp.status}`);
      }

      const data: AiReviewResponse = await resp.json();
      setReview(data);
    } catch (err: any) {
      console.error('AI Review Error:', err);
      setErrorMsg(err.message || 'Failed to generate review');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-panel">
      {/* Header */}
      <div className="ai-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span className="ai-badge">
              <Cpu size={14} />
              NVIDIA Nemotron Decision Support
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: isAiLive ? 'var(--emerald-success)' : 'var(--amber-warning)',
                background: isAiLive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${isAiLive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              }}
            >
              {isAiLive ? 'Live Nebius Token Factory' : 'Mock Mode (Simulated)'}
            </span>
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
            AI Executive Decision Review
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Deep plain-language synthesis, missing assumption detection, and trade-off analysis.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn-primary"
            onClick={fetchAiReview}
            disabled={isLoading}
            style={{ fontSize: '0.85rem', padding: '0.55rem 1.15rem' }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
            {isLoading ? 'Synthesizing with Nemotron...' : review ? 'Regenerate Review' : 'Generate AI Review'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#fb7185',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertTriangle size={18} />
          <span>Error generating AI review: {errorMsg}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
          <div style={{ height: '70px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: '120px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: '80px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s infinite' }} />
        </div>
      )}

      {/* Empty State before generating */}
      {!review && !isLoading && (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1.5rem',
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-medium)',
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'rgba(20, 184, 166, 0.1)',
              color: 'var(--teal-bright)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <Sparkles size={24} />
          </div>
          <h4 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
            Ready to Synthesize with NVIDIA Nemotron
          </h4>
          <p style={{ maxWidth: '540px', margin: '0 auto 1.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Click &quot;Generate AI Review&quot; to inspect plain-language rationale, sensitivity risks, 
            and uncover potential blind spots across your {analysis.horizonYears}-year TCO model.
          </p>
          <button className="btn-primary" onClick={fetchAiReview}>
            <Sparkles size={16} />
            Generate Review Now
          </button>
        </div>
      )}

      {/* Generated Review Content */}
      {review && !isLoading && (
        <div>
          {/* Executive Summary Quote */}
          <div className="ai-summary-box">
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--teal-bright)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Executive Synthesis
            </div>
            {review.executiveSummary}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
            {/* Why the lowest cost won */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--teal-bright)' }} />
                Cost Leadership Rationale
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {review.lowestCostExplanation}
              </p>
            </div>

            {/* Strategic Tradeoffs */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Lightbulb size={16} style={{ color: 'var(--amber-warning)' }} />
                Strategic Non-Financial Tradeoffs
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {review.strategicTradeoffs}
              </p>
            </div>
          </div>

          {/* Missing Assumptions Callout */}
          {review.missingAssumptionsFlags.length > 0 && (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                marginBottom: '1.75rem',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fb7185', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <ShieldAlert size={16} />
                Flagged Assumptions & Uncertainty Alerts
              </div>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {review.missingAssumptionsFlags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Hidden Overlooked Suggestions */}
          {review.hiddenCostSuggestions.length > 0 && (
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '0.75rem' }}>
                Suggested Additional Expense Items to Consider
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {review.hiddenCostSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(15, 23, 42, 0.5)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                      {item.costName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--teal-bright)', fontWeight: 600, marginBottom: '0.35rem' }}>
                      {item.typicalRange} • {item.category}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {item.rational}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scenario Sensitivity Notes */}
          {review.scenarioSensitivityNotes && (
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#a5b4fc', marginBottom: '0.35rem' }}>
                Scenario Stress-Test Sensitivity
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {review.scenarioSensitivityNotes}
              </div>
            </div>
          )}

          {/* Disclaimer & Metadata */}
          <div
            style={{
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            <div>
              <strong>Model:</strong> {review.modelUsed} | <strong>Status:</strong>{' '}
              {review.isMock ? 'Mock Fallback Mode' : 'Live Nebius Token Factory Inference'}
            </div>
            <div>{review.disclaimer}</div>
          </div>
        </div>
      )}
    </div>
  );
};
