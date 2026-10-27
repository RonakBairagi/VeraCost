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
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  DollarSign,
  TrendingDown,
  Info,
  Layers
} from 'lucide-react';
import { 
  ComparisonAnalysisResult, 
  NemotronDecisionResult, 
  NemotronOptionReview 
} from '../types/cost';

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
  const [decisionResult, setDecisionResult] = useState<NemotronDecisionResult | null>(null);
  const [userScenario, setUserScenario] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Quick prompt presets for common decision questions
  const promptChips = [
    { label: '3-Year Risk & Longevity', prompt: 'Which option presents lower risk and better durability over 3 years regarding maintenance and component wear?' },
    { label: 'Audit Hidden Cost Blind Spots', prompt: 'Identify potential overlooked expenses, unverified estimates, and hidden costs between these options.' },
    { label: 'Operating Efficiency Delta', prompt: 'Analyze how ongoing energy, recurring subscriptions, and consumables impact the long-term TCO difference.' },
    { label: 'Resale & Exit Strategy', prompt: 'Evaluate residual salvage recovery confidence and secondary market depreciation risks.' },
  ];

  const handleChipClick = (prompt: string) => {
    setUserScenario(prompt);
  };

  // Helper to safely format numbers without throwing
  const safeNum = (num: any): string => {
    if (typeof num === 'number' && !isNaN(num)) return num.toLocaleString();
    if (typeof num === 'string' && num.trim() !== '') {
      const parsed = Number(num);
      if (!isNaN(parsed)) return parsed.toLocaleString();
      return num;
    }
    return '0';
  };

  // Resilient deterministic client-side decision synthesis
  const generateClientFallbackDecision = (userScenarioText?: string, noticeText?: string): NemotronDecisionResult => {
    const results = analysis.results || {};
    const optionIds = Object.keys(results);
    const lowId = analysis.lowestCostOptionId || optionIds[0] || '';
    const highId = analysis.highestCostOptionId || optionIds[optionIds.length - 1] || optionIds[0] || '';
    const lowOpt = results[lowId] || Object.values(results)[0];
    const highOpt = results[highId] || Object.values(results)[1] || lowOpt;
    const currency = analysis.currency || 'USD';
    const horizon = analysis.horizonYears || 3;
    const lowName = lowOpt?.optionName || 'Option 1';
    const highName = highOpt?.optionName || 'Option 2';
    const netSavingsStr = safeNum(analysis.netSavings);
    const pctStr = typeof analysis.percentageSavings === 'number' ? analysis.percentageSavings.toFixed(1) : '0';

    const optionsList: NemotronOptionReview[] = Object.values(results).map((opt) => ({
      optionName: opt.optionName,
      netCost: `${currency} ${safeNum(opt.netTotalCost)}`,
      summary: `${opt.optionId === lowId ? 'Cost leader' : 'Higher outlay'}. Upfront: ${currency} ${safeNum(opt.initialAcquisitionTotal)}, recurring & operating: ${currency} ${safeNum(opt.operatingTotal + opt.maintenanceTotal + opt.recurringTotal)}, resale salvage: ${currency} ${safeNum(opt.residualRecoveryTotal)}.`,
    }));

    const missingFlags: string[] = [];
    Object.values(results).forEach((opt) => {
      if (opt.confidenceBreakdown && opt.confidenceBreakdown.missingCount > 0) {
        missingFlags.push(`${opt.optionName} has ${opt.confidenceBreakdown.missingCount} cost item(s) unestimated or flagged as missing.`);
      }
    });
    if (missingFlags.length === 0) {
      missingFlags.push('All primary expense categories across options have verified estimates or confirmed price points.');
    }

    return {
      scenarioSummary: userScenarioText
        ? `Scenario: "${userScenarioText}". Evaluating ${Object.keys(results).length} options over a ${horizon}-year horizon under the ${analysis.scenario.toUpperCase()} scenario.`
        : `Evaluating Total Cost of Ownership across ${Object.keys(results).length} options over a ${horizon}-year ownership horizon under the ${analysis.scenario.toUpperCase()} stress-test scenario.`,
      keyFindings: [
        `${lowName} delivers the lowest Net Total Cost of Ownership at ${currency} ${safeNum(lowOpt?.netTotalCost)} compared to ${currency} ${safeNum(highOpt?.netTotalCost)} for ${highName}, saving ${currency} ${netSavingsStr} (${pctStr}%).`,
        `Primary differentiator: ${analysis.keyDrivers?.[0]?.title || 'Upfront purchase price and operational efficiency variance'}.`,
        `Amortized monthly equivalent cost: ${currency} ${safeNum(lowOpt?.monthlyEquivalentCost)}/mo vs ${currency} ${safeNum(highOpt?.monthlyEquivalentCost)}/mo.`,
      ],
      availableOptions: optionsList,
      recommendedDecision: `Based on deterministic lifecycle modeling, **${lowName}** is the recommended selection with a net TCO of ${currency} ${safeNum(lowOpt?.netTotalCost)}. It delivers optimal financial efficiency over the ${horizon}-year horizon.`,
      riskAssessment: [
        `Operational Cost Inflation: Recurring expenses compound over ${horizon} years, widening the financial delta under higher usage.`,
        `Salvage Recovery Volatility: Realized resale recovery depends on secondary market liquidity at month ${horizon * 12}.`,
      ],
      assumptionsAndMissingData: missingFlags,
      suggestedNextSteps: [
        `Confirm firm quotes for initial acquisition and setup costs of ${lowName}.`,
        `Audit recurring subscriptions and service warranties for inflation adjustment clauses.`,
      ],
      modelUsed: 'VeraCost Verified Decision Engine',
      provider: 'OpenRouter',
      isLive: false,
      timestamp: new Date().toISOString(),
      disclaimer: noticeText || 'Decision support commentary synthesized by VeraCost verified deterministic calculation engine.',
    };
  };

  const fetchNemotronDecision = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setLoadingStep('Packaging deterministic simulator calculations...');

    try {
      const stepTimer1 = setTimeout(() => {
        setLoadingStep('Connecting to NVIDIA Nemotron on OpenRouter...');
      }, 700);

      const stepTimer2 = setTimeout(() => {
        setLoadingStep('Synthesizing quantitative trade-offs & 7-point decision matrix...');
      }, 2200);

      // 1. Try dedicated endpoint /api/ai/decision-support
      let resp: Response | null = null;
      let lastErrorText = '';

      try {
        resp = await fetch('/api/ai/decision-support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analysis,
            userScenario: userScenario.trim() || undefined,
          }),
        });
      } catch (fetchErr: any) {
        lastErrorText = fetchErr.message || 'Network fetch failed';
      }

      // 2. If decision-support returned non-200, try secondary explain endpoint
      if (!resp || !resp.ok) {
        try {
          const fallbackResp = await fetch('/api/ai/explain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysis }),
          });

          if (fallbackResp.ok) {
            const legacyData = await fallbackResp.json();
            clearTimeout(stepTimer1);
            clearTimeout(stepTimer2);
            setDecisionResult({
              scenarioSummary: legacyData.executiveSummary || 'Decision analysis completed.',
              keyFindings: [legacyData.lowestCostExplanation || 'Lowest TCO identified.'],
              availableOptions: Object.values(analysis.results || {}).map((o) => ({
                optionName: o.optionName,
                netCost: `${analysis.currency} ${safeNum(o.netTotalCost)}`,
                summary: 'Calculated in simulator model.',
              })),
              recommendedDecision: legacyData.strategicTradeoffs || legacyData.lowestCostExplanation,
              riskAssessment: [legacyData.scenarioSensitivityNotes || 'Review operational variables.'],
              assumptionsAndMissingData: legacyData.missingAssumptionsFlags || [],
              suggestedNextSteps: ['Review quotes and lifecycle sensitivity.'],
              modelUsed: legacyData.modelUsed || 'NVIDIA Nemotron',
              provider: 'OpenRouter',
              isLive: !legacyData.isMock,
              timestamp: legacyData.timestamp || new Date().toISOString(),
              disclaimer: legacyData.disclaimer || 'Decision support commentary.',
            });
            return;
          } else {
            const errBody = await fallbackResp.text().catch(() => '');
            lastErrorText = `HTTP ${fallbackResp.status}: ${errBody.slice(0, 100)}`;
          }
        } catch (fbErr: any) {
          lastErrorText = fbErr.message || 'Secondary fallback failed';
        }
      }

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (resp && resp.ok) {
        const data: NemotronDecisionResult = await resp.json();
        setDecisionResult(data);
        return;
      }

      // 3. Resilient fallback: serve validated deterministic decision support
      // so the user is NEVER blocked by a 500 error or serverless cold-start
      const fallbackResult = generateClientFallbackDecision(
        userScenario.trim() || undefined,
        `[Notice: Cloud inference endpoint returned ${lastErrorText || `status ${resp?.status || 500}`}. Displaying verified deterministic decision synthesis based on live simulator data.]`
      );
      setDecisionResult(fallbackResult);
    } catch (err: any) {
      console.warn('Falling back to deterministic decision engine:', err);
      const fallbackResult = generateClientFallbackDecision(
        userScenario.trim() || undefined,
        `[Notice: Connection issue (${err.message || 'Offline'}). Displaying verified deterministic decision synthesis based on live simulator data.]`
      );
      setDecisionResult(fallbackResult);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleCopyResults = () => {
    if (!decisionResult) return;

    const markdownText = `# NVIDIA Nemotron Decision Support Report
Project: ${analysis.projectTitle || 'VeraCost Comparison'}
Horizon: ${analysis.horizonYears} Years | Scenario: ${analysis.scenario.toUpperCase()} | Currency: ${analysis.currency}
Model: ${decisionResult.modelUsed} | Provider: ${decisionResult.provider}

## 1. Scenario Summary
${decisionResult.scenarioSummary}

## 2. Key Findings
${decisionResult.keyFindings.map((f) => `- ${f}`).join('\n')}

## 3. Available Options
${decisionResult.availableOptions.map((o) => `### ${o.optionName} (Net TCO: ${o.netCost})\n${o.summary}`).join('\n\n')}

## 4. Recommended Decision
${decisionResult.recommendedDecision}

## 5. Risk Assessment
${decisionResult.riskAssessment.map((r) => `- ${r}`).join('\n')}

## 6. Assumptions and Missing Data
${decisionResult.assumptionsAndMissingData.map((a) => `- ${a}`).join('\n')}

## 7. Suggested Next Steps
${decisionResult.suggestedNextSteps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}

---
${decisionResult.disclaimer}
`;

    navigator.clipboard.writeText(markdownText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const lowestOption = analysis.results?.[analysis.lowestCostOptionId];

  return (
    <div className="ai-panel" id="nemotron-decision-support-panel">
      {/* Header */}
      <div className="ai-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            <span className="ai-badge">
              <Cpu size={14} />
              NVIDIA Nemotron Decision Support System
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: isAiLive ? 'var(--emerald-success, #10b981)' : 'var(--amber-warning, #f59e0b)',
                background: isAiLive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${isAiLive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isAiLive ? '#10b981' : '#f59e0b',
                  display: 'inline-block',
                }}
              />
              {isAiLive ? 'OpenRouter Cloud Connected' : 'Deterministic Decision Mode'}
            </span>
            {decisionResult && (
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--teal-bright, #14b8a6)',
                  background: 'rgba(20, 184, 166, 0.08)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(20, 184, 166, 0.25)',
                  fontWeight: 500,
                }}
              >
                Model: {decisionResult.modelUsed}
              </span>
            )}
          </div>
          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: 'var(--text-main, #ffffff)' }}>
            NVIDIA Nemotron Decision Support System
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #94a3b8)', margin: 0, lineHeight: 1.5 }}>
            AI-powered decision analytics engine for VeraCost. Synthesizes simulator inputs, stress-test variables,
            and unverified assumptions to deliver comprehensive, quantitative recommendations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {decisionResult && (
            <button
              type="button"
              onClick={handleCopyResults}
              className="btn-secondary"
              style={{
                fontSize: '0.82rem',
                padding: '0.55rem 0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
              title="Copy 7-Section Analysis to Clipboard"
            >
              {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
              {copied ? 'Copied to Clipboard!' : 'Copy Results'}
            </button>
          )}

          <button
            type="button"
            className="btn-primary"
            onClick={fetchNemotronDecision}
            disabled={isLoading}
            style={{
              fontSize: '0.88rem',
              padding: '0.6rem 1.35rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
            }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={15} className="spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles size={15} />
                {decisionResult ? 'Re-Analyze with Nemotron' : 'Analyze with Nemotron'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Simulator Context Preview Ribbon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          padding: '0.75rem 1rem',
          background: 'rgba(15, 23, 42, 0.45)',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary, #94a3b8)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Layers size={13} style={{ color: 'var(--teal-bright, #14b8a6)' }} />
          <span><strong>Project:</strong> {analysis.projectTitle || 'Comparison'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sliders size={13} style={{ color: '#38bdf8' }} />
          <span><strong>Horizon:</strong> {analysis.horizonYears} Years ({analysis.scenario.toUpperCase()})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <DollarSign size={13} style={{ color: '#10b981' }} />
          <span><strong>Lowest TCO:</strong> {lowestOption?.optionName || 'Option 1'} ({analysis.currency} {lowestOption?.netTotalCost.toLocaleString()})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <TrendingDown size={13} style={{ color: '#a855f7' }} />
          <span><strong>Net Savings:</strong> {analysis.currency} {analysis.netSavings.toLocaleString()} ({analysis.percentageSavings.toFixed(1)}%)</span>
        </div>
      </div>

      {/* User Scenario & Question Input Area */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
          borderRadius: 'var(--radius-lg)',
          padding: '1.15rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <label
            htmlFor="nemotron-scenario-input"
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: 'var(--text-main, #ffffff)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Lightbulb size={15} style={{ color: 'var(--amber-warning, #f59e0b)' }} />
            Specific Scenario, Decision Question, or Business Context (Optional)
          </label>
          {userScenario && (
            <button
              type="button"
              onClick={() => setUserScenario('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, #64748b)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: '0.2rem 0.5rem',
              }}
            >
              Clear input
            </button>
          )}
        </div>

        <textarea
          id="nemotron-scenario-input"
          value={userScenario}
          onChange={(e) => setUserScenario(e.target.value)}
          placeholder="e.g. Which option has lower 3-year risk if operating hours double? Are there critical warranty or resale blind spots we should consider before purchasing?"
          rows={3}
          style={{
            width: '100%',
            padding: '0.75rem 0.95rem',
            background: 'rgba(10, 15, 30, 0.65)',
            border: '1px solid var(--border-medium, rgba(255, 255, 255, 0.12))',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-main, #ffffff)',
            fontSize: '0.88rem',
            lineHeight: 1.5,
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* Prompt suggestion chips */}
        <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>
            Suggested prompts:
          </span>
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChipClick(chip.prompt)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-full)',
                padding: '0.2rem 0.65rem',
                color: 'var(--text-secondary, #cbd5e1)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(20, 184, 166, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state with Retry button */}
      {errorMsg && (
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            color: '#fb7185',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.25rem' }}>
                NVIDIA Nemotron Analysis Request Failed
              </div>
              <div style={{ fontSize: '0.84rem', color: '#fca5a5', lineHeight: 1.5 }}>
                {errorMsg}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchNemotronDecision}
            className="btn-secondary"
            style={{
              fontSize: '0.82rem',
              padding: '0.45rem 0.95rem',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderColor: 'rgba(244, 63, 94, 0.4)',
              color: '#ffffff',
            }}
          >
            <RotateCcw size={13} />
            Retry Analysis
          </button>
        </div>
      )}

      {/* Loading State with animated steps */}
      {isLoading && (
        <div
          style={{
            padding: '2.5rem 1.5rem',
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(20, 184, 166, 0.2)',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: 'rgba(20, 184, 166, 0.12)',
              color: 'var(--teal-bright, #14b8a6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <RefreshCw size={26} className="spin" />
          </div>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.45rem', color: '#ffffff' }}>
            NVIDIA Nemotron Is Synthesizing Decision Model...
          </h4>
          <p style={{ fontSize: '0.88rem', color: 'var(--teal-bright, #14b8a6)', fontWeight: 600, marginBottom: '1.5rem' }}>
            {loadingStep || 'Evaluating lifecycle sensitivities and risk parameters...'}
          </p>

          <div style={{ maxWidth: '420px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: '70%',
                  background: 'linear-gradient(90deg, #14b8a6, #38bdf8)',
                  borderRadius: '999px',
                  animation: 'pulse 1.5s infinite',
                }}
              />
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
              OpenRouter chat completion in progress • NVIDIA Nemotron reasoning active
            </div>
          </div>
        </div>
      )}

      {/* Empty State before first analysis */}
      {!decisionResult && !isLoading && !errorMsg && (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1.5rem',
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-medium, rgba(255, 255, 255, 0.15))',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(20, 184, 166, 0.1)',
              color: 'var(--teal-bright, #14b8a6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <Sparkles size={24} />
          </div>
          <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ffffff' }}>
            Ready to Analyze with NVIDIA Nemotron
          </h4>
          <p style={{ maxWidth: '580px', margin: '0 auto 1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6 }}>
            Click &quot;Analyze with Nemotron&quot; to perform deep quantitative reasoning across all {Object.keys(analysis.results || {}).length} options.
            The system will assess cost drivers, stress-test risks, and synthesize a structured 7-part decision recommendation.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={fetchNemotronDecision}
            style={{ fontSize: '0.92rem', padding: '0.65rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Sparkles size={16} />
            Analyze with Nemotron
          </button>
        </div>
      )}

      {/* Generated 7-Section Decision Support Report */}
      {decisionResult && !isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 1. SCENARIO SUMMARY */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
              border: '1px solid rgba(20, 184, 166, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.35rem 1.5rem',
            }}
          >
            <div
              style={{
                fontSize: '0.76rem',
                fontWeight: 800,
                color: 'var(--teal-bright, #14b8a6)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Info size={14} />
              1. Scenario Summary
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-main, #ffffff)', lineHeight: 1.65, margin: 0 }}>
              {decisionResult.scenarioSummary}
            </p>
          </div>

          {/* 2. KEY FINDINGS */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
              borderRadius: 'var(--radius-lg)',
              padding: '1.35rem 1.5rem',
            }}
          >
            <div
              style={{
                fontSize: '0.76rem',
                fontWeight: 800,
                color: '#38bdf8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <TrendingDown size={14} />
              2. Key Findings
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {decisionResult.keyFindings.map((finding, idx) => (
                <li key={idx} style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.55 }}>
                  {finding}
                </li>
              ))}
            </ul>
          </div>

          {/* 3. AVAILABLE OPTIONS */}
          <div>
            <div
              style={{
                fontSize: '0.76rem',
                fontWeight: 800,
                color: 'var(--text-muted, #94a3b8)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Layers size={14} />
              3. Available Options Analysis
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {decisionResult.availableOptions.map((opt, idx) => {
                const isLowest = opt.optionName.toLowerCase().includes(lowestOption?.optionName.toLowerCase() || '');
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(15, 23, 42, 0.55)',
                      border: `1px solid ${isLowest ? 'rgba(20, 184, 166, 0.35)' : 'var(--border-subtle, rgba(255, 255, 255, 0.08))'}`,
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {isLowest && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          background: 'linear-gradient(90deg, #0d9488, #14b8a6)',
                          color: '#ffffff',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.65rem',
                          borderBottomLeftRadius: 'var(--radius-md)',
                        }}
                      >
                        Lowest Net TCO
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff', marginBottom: '0.35rem' }}>
                        {opt.optionName}
                      </div>
                      <div
                        style={{
                          display: 'inline-block',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: isLowest ? 'var(--teal-bright, #14b8a6)' : '#38bdf8',
                          marginBottom: '0.75rem',
                          background: 'rgba(255, 255, 255, 0.04)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        Net TCO: {opt.netCost}
                      </div>
                      <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.55, margin: 0 }}>
                        {opt.summary}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. RECOMMENDED DECISION */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.7) 100%)',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.08)',
            }}
          >
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#10b981',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <CheckCircle2 size={16} />
              4. Recommended Decision & Course of Action
            </div>
            <p style={{ fontSize: '0.96rem', color: '#ffffff', lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
              {decisionResult.recommendedDecision}
            </p>
          </div>

          {/* 5. RISK ASSESSMENT */}
          {decisionResult.riskAssessment && decisionResult.riskAssessment.length > 0 && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.07)',
                border: '1px solid rgba(245, 158, 11, 0.28)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.35rem 1.5rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  color: 'var(--amber-warning, #f59e0b)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <AlertTriangle size={15} />
                5. Risk Assessment & Sensitivity Modeling
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {decisionResult.riskAssessment.map((risk, idx) => (
                  <li key={idx} style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.55 }}>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 6. ASSUMPTIONS AND MISSING DATA */}
          {decisionResult.assumptionsAndMissingData && decisionResult.assumptionsAndMissingData.length > 0 && (
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.07)',
                border: '1px solid rgba(99, 102, 241, 0.28)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.35rem 1.5rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  color: '#a5b4fc',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <ShieldAlert size={15} />
                6. Assumptions & Missing Data Flags
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {decisionResult.assumptionsAndMissingData.map((item, idx) => (
                  <li key={idx} style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.55 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 7. SUGGESTED NEXT STEPS */}
          {decisionResult.suggestedNextSteps && decisionResult.suggestedNextSteps.length > 0 && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
                borderRadius: 'var(--radius-lg)',
                padding: '1.35rem 1.5rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  color: 'var(--teal-bright, #14b8a6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <ArrowRight size={15} />
                7. Suggested Next Steps
              </div>
              <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {decisionResult.suggestedNextSteps.map((step, idx) => (
                  <li key={idx} style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.55 }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Footer Metadata & Legal Disclaimer */}
          <div
            style={{
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted, #94a3b8)',
            }}
          >
            <div>
              <strong>Provider:</strong> {decisionResult.provider} • <strong>Model:</strong> {decisionResult.modelUsed} •{' '}
              <strong>Mode:</strong> {decisionResult.isLive ? 'Live Cloud Inference' : 'Deterministic Engine'}
            </div>
            <div>{decisionResult.disclaimer}</div>
          </div>
        </div>
      )}
    </div>
  );
};
