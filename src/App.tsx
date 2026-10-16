import React, { useState, useEffect } from 'react';
import { BRAND_CONFIG } from './config/branding';
import { SAMPLE_COMPARISONS } from './data/sampleComparisons';
import { ComparisonProject } from './types/cost';
import { Header } from './components/Header';
import { LandingHero } from './components/LandingHero';
import { Workspace } from './components/Workspace';
import { SavedComparisonsModal } from './components/SavedComparisonsModal';
import { ReportViewModal } from './components/ReportViewModal';
import { NebiusSettingsModal } from './components/NebiusSettingsModal';
import { NewComparisonModal } from './components/NewComparisonModal';
import { DynamicBackground } from './components/DynamicBackground';
import { calculateComparison } from './engine/calculator';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'landing' | 'workspace' | 'saved'>('workspace');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const storedTheme = localStorage.getItem('veracost_theme');
      if (storedTheme === 'dark' || storedTheme === 'light') {
        return storedTheme;
      }
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch (e) {
      console.error(e);
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.className = theme;
    try {
      localStorage.setItem('veracost_theme', theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };
  const [project, setProject] = useState<ComparisonProject>(() => {
    try {
      const stored = localStorage.getItem('veracost_active_project');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return SAMPLE_COMPARISONS[0];
  });

  const [currency, setCurrency] = useState<string>(project.currency || 'USD');
  const [isAiLive, setIsAiLive] = useState<boolean>(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNewComparisonModalOpen, setIsNewComparisonModalOpen] = useState(false);

  // Check server configuration on mount
  const checkServerConfig = async () => {
    try {
      const resp = await fetch('/api/config');
      if (resp.ok) {
        const data = await resp.json();
        // Also check if user has custom key in session
        const hasSessionKey = Boolean(sessionStorage.getItem('nebius_custom_api_key'));
        setIsAiLive(data.isLiveConfigured || hasSessionKey);
      }
    } catch (e) {
      console.warn('Could not reach backend /api/config; running in offline/mock mode.');
      setIsAiLive(Boolean(sessionStorage.getItem('nebius_custom_api_key')));
    }
  };

  useEffect(() => {
    checkServerConfig();
  }, []);

  // Sync currency changes into project
  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    setProject((prev) => ({
      ...prev,
      currency: newCurrency,
      options: prev.options.map((opt) => ({ ...opt, currency: newCurrency })),
    }));
  };

  // Auto-save active project to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('veracost_active_project', JSON.stringify(project));
    } catch (e) {
      console.error(e);
    }
  }, [project]);

  // Load sample from landing page
  const handleSelectSample = (sample: ComparisonProject) => {
    setProject(sample);
    setCurrency(sample.currency);
    setCurrentTab('workspace');
  };

  const analysis = calculateComparison(project);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <DynamicBackground theme={theme} />

      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currency={currency}
        setCurrency={handleCurrencyChange}
        isAiLive={isAiLive}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenSavedModal={() => setIsSavedModalOpen(true)}
        onOpenNewComparison={() => setIsNewComparisonModalOpen(true)}
      />

      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {currentTab === 'landing' ? (
          <LandingHero
            onStartComparison={() => setCurrentTab('workspace')}
            onOpenNewComparison={() => setIsNewComparisonModalOpen(true)}
            onSelectSample={handleSelectSample}
          />
        ) : (
          <Workspace
            project={project}
            setProject={setProject}
            currency={currency}
            isAiLive={isAiLive}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenSavedModal={() => setIsSavedModalOpen(true)}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            onOpenNewComparison={() => setIsNewComparisonModalOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <NewComparisonModal
        isOpen={isNewComparisonModalOpen}
        onClose={() => setIsNewComparisonModalOpen(false)}
        onCreateProject={(newProj) => {
          setProject(newProj);
          setCurrency(newProj.currency);
          setCurrentTab('workspace');
        }}
        currentCurrency={currency}
      />

      <SavedComparisonsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        currentProject={project}
        onLoadProject={(loaded) => {
          setProject(loaded);
          setCurrency(loaded.currency);
        }}
        analysis={analysis}
      />

      <ReportViewModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        project={project}
        analysis={analysis}
      />

      <NebiusSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isAiLive={isAiLive}
        onConfigChanged={checkServerConfig}
      />

      {/* Footer */}
      <footer
        className="no-print app-footer"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '2rem 0',
          background: 'var(--bg-footer, rgba(8, 12, 20, 0.95))',
          marginTop: 'auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            <strong style={{ color: 'var(--text-main)' }}>{BRAND_CONFIG.name}</strong> — {BRAND_CONFIG.descriptor}
          </div>
          <div>
            {BRAND_CONFIG.hackathonNotice} • Apache 2.0 License • Nebius Token Factory & NVIDIA Nemotron
          </div>
        </div>
      </footer>
    </div>
  );
};
