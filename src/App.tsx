import React, { useState, useEffect } from 'react';
import { BRAND_CONFIG } from './config/branding';
import { SAMPLE_COMPARISONS } from './data/sampleComparisons';
import { ComparisonProject, ComparisonOption, CostItem, ProductCategory } from './types/cost';
import { Header } from './components/Header';
import { LandingHero } from './components/LandingHero';
import { Workspace } from './components/Workspace';
import { SavedComparisonsModal } from './components/SavedComparisonsModal';
import { ReportViewModal } from './components/ReportViewModal';
import { NebiusSettingsModal } from './components/NebiusSettingsModal';
import { NewComparisonModal } from './components/NewComparisonModal';
import { DynamicBackground } from './components/DynamicBackground';
import { SmartPriceFinder } from './components/shopping/SmartPriceFinder';
import { ScreenshotImportModal } from './components/shopping/ScreenshotImportModal';
import { SupportPage } from './components/SupportPage';
import { VeraAssistantModal } from './components/chat/VeraAssistantModal';
import { StartupScreen } from './components/startup/StartupScreen';
import { AuthScreen } from './components/auth/AuthScreen';
import { auth, logoutUser, UserProfileData, isFirebaseConfigured } from './config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Bot, MessageSquare } from 'lucide-react';
import { calculateComparison } from './engine/calculator';
import { getSuggestionsForCategory, createCostItemFromSuggestion, inferProductCategory } from './engine/discovery';

export const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('veracost_guest_session') === 'true';
    } catch {
      return false;
    }
  });

  const [currentTab, setCurrentTab] = useState<'landing' | 'shopping' | 'workspace' | 'saved' | 'support'>('shopping');
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
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
  const [pastedScreenshot, setPastedScreenshot] = useState<string | null>(null);
  const [isAssistantChatOpen, setIsAssistantChatOpen] = useState(false);

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

  // Firebase Authentication State Listener
  useEffect(() => {
    let timer: any = null;

    if (auth && isFirebaseConfigured()) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setCurrentUser(user);
          setUserProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            createdAt: user.metadata.creationTime || new Date().toISOString(),
            lastLoginAt: user.metadata.lastSignInTime || new Date().toISOString(),
          });
          setIsGuest(false);
        } else {
          setCurrentUser(null);
          const cachedUser = typeof localStorage !== 'undefined' ? localStorage.getItem('veracost_current_user') : null;
          if (cachedUser) {
            try {
              const parsed = JSON.parse(cachedUser);
              setUserProfile(parsed);
              setIsGuest(false);
            } catch {
              setUserProfile(null);
            }
          } else if (sessionStorage.getItem('veracost_guest_session') !== 'true') {
            setUserProfile(null);
          }
        }
        timer = setTimeout(() => setIsInitializing(false), 500);
      });

      return () => {
        unsubscribe();
        if (timer) clearTimeout(timer);
      };
    } else {
      // Firebase not configured or Guest mode active
      const savedGuest = sessionStorage.getItem('veracost_guest_session') === 'true';
      if (savedGuest) {
        setIsGuest(true);
        setUserProfile({
          uid: 'guest-session',
          email: 'guest@veracost.app',
          displayName: 'Guest Explorer',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        });
      }
      timer = setTimeout(() => setIsInitializing(false), 500);
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, []);

  const handleAuthenticated = (user: User | null, profile?: UserProfileData, guest?: boolean) => {
    if (user) {
      setCurrentUser(user);
      setIsGuest(false);
      setUserProfile(profile || {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'User',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });
      try { sessionStorage.removeItem('veracost_guest_session'); } catch {}
    } else if (guest) {
      setIsGuest(true);
      setCurrentUser(null);
      setUserProfile(profile || {
        uid: 'guest-session',
        email: 'guest@veracost.app',
        displayName: 'Guest Explorer',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });
      try { sessionStorage.setItem('veracost_guest_session', 'true'); } catch {}
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('[Firebase] Logout error:', err);
    }
    setCurrentUser(null);
    setUserProfile(null);
    setIsGuest(false);
    try { sessionStorage.removeItem('veracost_guest_session'); } catch {}
    try { localStorage.removeItem('veracost_current_user'); } catch {}
  };

  // Global listener for screenshot paste (Ctrl+V) and drag-and-drop from OS or other windows
  useEffect(() => {
    let lastPasteTime = 0;

    const handleGlobalPaste = (e: ClipboardEvent) => {
      // If user is currently focused in an input/textarea, ignore if pasting plain text
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const now = Date.now();
          if (now - lastPasteTime < 1500) {
            e.preventDefault();
            return;
          }
          lastPasteTime = now;

          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              setPastedScreenshot(dataUrl);
              setIsScreenshotModalOpen(true);
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };

    const handleGlobalDrop = (e: DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const imageFile = Array.from(files).find((f) => f.type.startsWith('image/'));
      if (imageFile) {
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setPastedScreenshot(dataUrl);
          setIsScreenshotModalOpen(true);
        };
        reader.readAsDataURL(imageFile);
      }
    };

    const handleGlobalDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    window.addEventListener('drop', handleGlobalDrop);
    window.addEventListener('dragover', handleGlobalDragOver);

    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
      window.removeEventListener('drop', handleGlobalDrop);
      window.removeEventListener('dragover', handleGlobalDragOver);
    };
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

  // Bridge from Smart Price Finder into VeraCost Lifetime TCO Calculator
  const handleImportFromShopping = (optionPartial: Partial<ComparisonOption>) => {
    const rawCategory = optionPartial.category as string;
    const inferred = inferProductCategory(optionPartial.name, optionPartial.brandOrModel, rawCategory);
    const category = (optionPartial.category && optionPartial.category !== 'other' && optionPartial.category !== 'custom'
      ? (optionPartial.category as ProductCategory)
      : inferred) || inferred || 'electronics';
    const allSuggestions = getSuggestionsForCategory(category);
    const setupSuggestions = allSuggestions.filter((s) => s.category === 'setup');
    const recurringSuggestions = allSuggestions.filter((s) => s.category === 'recurring').slice(0, 2);
    const maintenanceSuggestions = allSuggestions.filter((s) => s.category === 'maintenance').slice(0, 1);
    const operatingSuggestions = allSuggestions.filter((s) => s.category === 'operating').slice(0, 1);

    const setupAndAccessories: CostItem[] = setupSuggestions.map(createCostItemFromSuggestion);
    const recurringCosts: CostItem[] = recurringSuggestions.map(createCostItemFromSuggestion);
    const maintenanceCosts: CostItem[] = maintenanceSuggestions.map(createCostItemFromSuggestion);
    const operatingCosts: CostItem[] = operatingSuggestions.map(createCostItemFromSuggestion);

    const upfront = optionPartial.initialPurchasePrice || 10000;
    const newOption: ComparisonOption = {
      id: `opt-${Date.now()}`,
      name: optionPartial.name || 'Verified Deal Option',
      category,
      currency: optionPartial.currency || currency,
      brandOrModel: optionPartial.brandOrModel || '',
      initialPurchasePrice: upfront,
      salesTaxOrFees: 0,
      purchaseConfidence: 'confirmed',
      purchaseSource: {
        sourceName: 'Smart Price Finder Verified Retailer Offer',
        isVerified: true,
        retrievalDate: new Date().toISOString().slice(0, 10),
      },
      setupAndAccessories,
      recurringCosts,
      maintenanceCosts,
      operatingCosts,
      usefulLifeYears: 3,
      replaceAtEndOfLife: false,
      replacementCostEstimate: upfront,
      residualValueEstimate: Math.round(upfront * 0.3), // 30% typical resale recovery
      residualConfidence: 'user-estimate',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProject((prev) => ({
      ...prev,
      currency: newOption.currency,
      options: [...prev.options, newOption],
    }));
    setCurrency(newOption.currency);
    setCurrentTab('workspace');
  };

  const analysis = calculateComparison(project);

  if (isInitializing) {
    return <StartupScreen statusMessage="Initializing VeraCost platform…" />;
  }

  const isAuthenticated = Boolean(currentUser || isGuest);
  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

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
        onOpenScreenshotImport={() => setIsScreenshotModalOpen(true)}
        onToggleAssistant={() => setIsAssistantChatOpen((prev) => !prev)}
        userProfile={userProfile}
        onSignOut={handleSignOut}
      />

      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {currentTab === 'landing' ? (
          <LandingHero
            onStartComparison={() => setCurrentTab('workspace')}
            onOpenNewComparison={() => setIsNewComparisonModalOpen(true)}
            onSelectSample={handleSelectSample}
            onOpenSmartFinder={() => setCurrentTab('shopping')}
          />
        ) : currentTab === 'shopping' ? (
          <SmartPriceFinder
            onImportToCalculator={handleImportFromShopping}
            currentCurrency={currency}
            onOpenScreenshotImport={() => setIsScreenshotModalOpen(true)}
          />
        ) : currentTab === 'support' ? (
          <SupportPage
            onNavigateToShopping={() => setCurrentTab('shopping')}
            onNavigateToWorkspace={() => setCurrentTab('workspace')}
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

      {/* Floating Vera Assistant Launcher */}
      {!isAssistantChatOpen && (
        <button
          type="button"
          onClick={() => setIsAssistantChatOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            padding: '0.65rem 1.15rem',
            borderRadius: 'var(--radius-pill)',
            background: 'linear-gradient(135deg, #0d9488, #2563eb)',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 700,
            fontSize: '0.84rem',
            zIndex: 999,
            transition: 'transform 0.2s',
          }}
          title="Chat with Vera Assistant"
        >
          <Bot size={18} />
          <span>Chat with Vera</span>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#4ade80',
              boxShadow: '0 0 6px #4ade80',
              display: 'inline-block',
            }}
          />
        </button>
      )}

      {/* Vera Assistant Chatbot Modal */}
      <VeraAssistantModal
        isOpen={isAssistantChatOpen}
        onClose={() => setIsAssistantChatOpen(false)}
        onNavigateTab={(tab) => setCurrentTab(tab)}
        onOpenScreenshotImport={() => setIsScreenshotModalOpen(true)}
      />

      {/* Screenshot & Image Import Modal */}
      <ScreenshotImportModal
        isOpen={isScreenshotModalOpen}
        initialImage={pastedScreenshot}
        onClearInitialImage={() => setPastedScreenshot(null)}
        onClose={() => {
          setIsScreenshotModalOpen(false);
          setPastedScreenshot(null);
        }}
        onProductImported={(name, category, price) => {
          handleImportFromShopping({
            name,
            category,
            initialPurchasePrice: price || 10000,
          });
        }}
      />

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setCurrentTab('support')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--teal-bright)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              Contact & Support (Ronak Bairagi)
            </button>
            <span>•</span>
            <span>{BRAND_CONFIG.hackathonNotice} • Apache 2.0 License • Nebius Token Factory & NVIDIA Nemotron</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
