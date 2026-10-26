import React, { useState, useEffect } from 'react';
import { BRAND_CONFIG } from './config/branding';
import { SAMPLE_COMPARISONS } from './data/sampleComparisons';
import { ComparisonProject, ComparisonOption, CostItem, ProductCategory } from './types/cost';
import { Header, NavTabType } from './components/Header';
import { LandingHero } from './components/LandingHero';
import { Workspace } from './components/Workspace';
import { SavedComparisonsModal } from './components/SavedComparisonsModal';
import { ReportViewModal } from './components/ReportViewModal';
import { AppSettingsModal } from './components/settings/AppSettingsModal';
import { ProfileModal } from './components/profile/ProfileModal';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { NewComparisonModal } from './components/NewComparisonModal';
import { DynamicBackground } from './components/DynamicBackground';
import { SmartPriceFinder } from './components/shopping/SmartPriceFinder';
import { SupportPage } from './components/SupportPage';
import { VeraAssistantModal } from './components/chat/VeraAssistantModal';
import { StartupScreen } from './components/startup/StartupScreen';
import { AuthScreen } from './components/auth/AuthScreen';
import { auth, logoutUser, UserProfileData, isFirebaseConfigured } from './config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Bot } from 'lucide-react';
import { calculateComparison } from './engine/calculator';
import { getSuggestionsForCategory, createCostItemFromSuggestion, inferProductCategory } from './engine/discovery';
import { SUPPORT_CONFIG } from './config/support';
import { convertProjectCurrency, convertCurrency } from './services/currencyConverter';

export const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const startupMountedAt = React.useRef(Date.now());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('veracost_guest_session') === 'true';
    } catch {
      return false;
    }
  });

  const [currentTab, setCurrentTab] = useState<NavTabType>('shopping');
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

  const [currency, setCurrency] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('veracost_selected_currency');
      if (stored) return stored;
    } catch {}
    return 'INR';
  });

  const [project, setProject] = useState<ComparisonProject>(() => {
    let base = SAMPLE_COMPARISONS[0];
    try {
      const stored = localStorage.getItem('veracost_active_project');
      if (stored) {
        base = JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    const targetCurrency = (typeof localStorage !== 'undefined' ? localStorage.getItem('veracost_selected_currency') : null) || base.currency || 'INR';
    if (base.currency !== targetCurrency) {
      return convertProjectCurrency(base, targetCurrency);
    }
    return base;
  });

  const [isAiLive, setIsAiLive] = useState<boolean>(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNewComparisonModalOpen, setIsNewComparisonModalOpen] = useState(false);
  const [isAssistantChatOpen, setIsAssistantChatOpen] = useState(false);

  // Check server configuration on mount
  const checkServerConfig = async () => {
    try {
      const resp = await fetch('/api/config');
      if (resp.ok) {
        const data = await resp.json();
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

  // Firebase Authentication State Listener with 3.5s minimum startup duration
  useEffect(() => {
    let timer: any = null;
    let safetyTimer: any = null;

    const completeStartup = () => {
      const elapsed = Date.now() - startupMountedAt.current;
      const remaining = Math.max(0, 3500 - elapsed);
      timer = setTimeout(() => {
        setIsInitializing(false);
      }, remaining);
    };

    // Safety failsafe: never let initialization hang indefinitely
    safetyTimer = setTimeout(() => {
      setIsInitializing(false);
    }, 6000);

    if (auth && isFirebaseConfigured()) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setCurrentUser(user);
          setUserProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            photoURL: user.photoURL || undefined,
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
        completeStartup();
      });

      return () => {
        unsubscribe();
        if (timer) clearTimeout(timer);
        if (safetyTimer) clearTimeout(safetyTimer);
      };
    } else {
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
      completeStartup();
      return () => {
        if (timer) clearTimeout(timer);
        if (safetyTimer) clearTimeout(safetyTimer);
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

  // Sync currency changes into project with mathematical conversion and persistence
  const handleCurrencyChange = (newCurrency: string) => {
    const target = (newCurrency || 'INR').toUpperCase();
    setCurrency(target);
    try {
      localStorage.setItem('veracost_selected_currency', target);
    } catch {}
    setProject((prev) => convertProjectCurrency(prev, target));
  };

  // Auto-save active project to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('veracost_active_project', JSON.stringify(project));
    } catch (e) {
      console.error(e);
    }
  }, [project]);

  // Load sample from landing page, converted to active currency
  const handleSelectSample = (sample: ComparisonProject) => {
    const targetCurrency = currency || 'INR';
    const converted = convertProjectCurrency(sample, targetCurrency);
    setProject(converted);
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

    const sourceCurrency = optionPartial.currency || 'INR';
    const rawUpfront = optionPartial.initialPurchasePrice || 10000;
    // Mathematically convert to currently selected active currency if needed
    const upfront = sourceCurrency !== currency ? convertCurrency(rawUpfront, sourceCurrency, currency) : rawUpfront;

    const newOption: ComparisonOption = {
      id: `opt-${Date.now()}`,
      name: optionPartial.name || 'Verified Deal Option',
      category,
      currency: currency,
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
      residualValueEstimate: Math.round(upfront * 0.3),
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
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
        onOpenProfile={() => setIsProfileModalOpen(true)}
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
        ) : currentTab === 'dashboard' ? (
          <UserDashboard
            userProfile={userProfile || { uid: 'guest', email: 'guest@veracost.app', displayName: 'Explorer', createdAt: '', lastLoginAt: '' }}
            project={project}
            currency={currency}
            onNavigateToWorkspace={() => setCurrentTab('workspace')}
            onNavigateToShopping={() => setCurrentTab('shopping')}
            onOpenNewComparison={() => setIsNewComparisonModalOpen(true)}
            onOpenSavedModal={() => setIsSavedModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenAssistant={() => setIsAssistantChatOpen(true)}
            onSelectSample={handleSelectSample}
          />
        ) : currentTab === 'shopping' ? (
          <SmartPriceFinder
            onImportToCalculator={handleImportFromShopping}
            currentCurrency={currency}
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
      />

      {/* My Profile / Account Details Modal */}
      {userProfile && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          userProfile={userProfile}
          onProfileUpdated={(updated) => {
            setUserProfile(updated);
          }}
        />
      )}

      {/* Comprehensive Workspace Settings Modal */}
      <AppSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        userProfile={userProfile}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        isAiLive={isAiLive}
        onAiConfigChanged={checkServerConfig}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onSignOut={handleSignOut}
        project={project}
      />

      {/* Other Modals */}
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
              Contact & Support ({SUPPORT_CONFIG.leadDeveloper.name})
            </button>
            <span>•</span>
            <span>{BRAND_CONFIG.hackathonNotice} • Apache 2.0 License • Nebius Token Factory & NVIDIA Nemotron</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
