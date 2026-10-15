import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  Smartphone, 
  Laptop, 
  Headphones, 
  Gamepad2, 
  Coffee, 
  Car, 
  Cloud, 
  Package, 
  Sparkles,
  ArrowRight,
  LucideIcon
} from 'lucide-react';
import { ComparisonProject, ComparisonOption, ProductCategory } from '../types/cost';
import { SAMPLE_COMPARISONS } from '../data/sampleComparisons';
import { BRAND_CONFIG } from '../config/branding';

interface NewComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: ComparisonProject) => void;
  currentCurrency: string;
}

const CATEGORY_CHOICES: {
  id: ProductCategory;
  label: string;
  icon: LucideIcon;
  desc: string;
}[] = [
  { id: 'smartphones', label: 'Smartphones & Mobile', icon: Smartphone, desc: 'Phones, cases, screen guards, 5G plans, AppleCare' },
  { id: 'electronics', label: 'Laptops & Computers', icon: Laptop, desc: 'MacBooks, PC laptops, docks, RAM, peripherals' },
  { id: 'audio-wearables', label: 'Audio & Wearables', icon: Headphones, desc: 'Headphones, smartwatches, earbuds, tips, battery' },
  { id: 'gaming', label: 'Gaming & Consoles', icon: Gamepad2, desc: 'PS5, Xbox, Switch, controllers, Game Pass' },
  { id: 'appliances', label: 'Home & Kitchen', icon: Coffee, desc: 'Coffee machines, ACs, vacuums, filters, energy' },
  { id: 'vehicles', label: 'Vehicles & Mobility', icon: Car, desc: 'EVs, hybrids, gas cars, fuel, insurance, tires' },
  { id: 'cloud-software', label: 'Cloud & Software', icon: Cloud, desc: 'SaaS tools, cloud storage, API seats, hosting' },
  { id: 'custom', label: 'Any Custom Product', icon: Package, desc: 'Anything you buy on the internet + its full after-costs' },
];

export const NewComparisonModal: React.FC<NewComparisonModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  currentCurrency,
}) => {
  const [title, setTitle] = useState('My Custom Product Comparison');
  const [category, setCategory] = useState<ProductCategory>('smartphones');
  const [starterType, setStarterType] = useState<'blank' | 'template'>('blank');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('sample-smartphones');
  const [horizonYears, setHorizonYears] = useState<number>(3);
  const [currency, setCurrency] = useState<string>(currentCurrency || 'USD');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (starterType === 'template') {
      const template = SAMPLE_COMPARISONS.find((t) => t.id === selectedTemplateId) || SAMPLE_COMPARISONS[0];
      const newProj: ComparisonProject = {
        ...template,
        id: `proj-${Date.now()}`,
        title: title.trim() || template.title,
        currency,
        horizonYears,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onCreateProject(newProj);
    } else {
      // Create completely blank custom comparison with 2 clean empty products
      const blankOption1: ComparisonOption = {
        id: `opt-${Date.now()}-1`,
        name: category === 'smartphones' ? 'Custom Phone A' : 'Custom Product A',
        category,
        currency,
        brandOrModel: '',
        notes: 'Enter your custom product specifications and expenses.',
        initialPurchasePrice: 0,
        salesTaxOrFees: 0,
        purchaseConfidence: 'user-estimate',
        setupAndAccessories: [],
        recurringCosts: [],
        maintenanceCosts: [],
        operatingCosts: [],
        usefulLifeYears: horizonYears,
        replaceAtEndOfLife: false,
        residualValueEstimate: 0,
        residualConfidence: 'user-estimate',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const blankOption2: ComparisonOption = {
        id: `opt-${Date.now()}-2`,
        name: category === 'smartphones' ? 'Custom Phone B' : 'Custom Product B',
        category,
        currency,
        brandOrModel: '',
        notes: 'Enter your alternative product to compare side-by-side.',
        initialPurchasePrice: 0,
        salesTaxOrFees: 0,
        purchaseConfidence: 'user-estimate',
        setupAndAccessories: [],
        recurringCosts: [],
        maintenanceCosts: [],
        operatingCosts: [],
        usefulLifeYears: horizonYears,
        replaceAtEndOfLife: false,
        residualValueEstimate: 0,
        residualConfidence: 'user-estimate',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const customProj: ComparisonProject = {
        id: `proj-${Date.now()}`,
        title: title.trim() || 'Custom Product Comparison',
        category,
        currency,
        horizonYears,
        discountRatePct: 0,
        scenario: 'typical',
        options: [blankOption1, blankOption2],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onCreateProject(customProj);
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <PlusCircle size={24} style={{ color: 'var(--teal-bright)' }} />
            <div>
              <h3 style={{ fontSize: '1.35rem' }}>Create Custom Decision Comparison</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Model any product you can buy on the internet with its true after-purchase costs.
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
          {/* Comparison Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              Comparison Title
            </label>
            <input
              type="text"
              className="input-box"
              style={{ fontSize: '1rem', padding: '0.65rem 0.9rem' }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. iPhone 16 Pro vs Galaxy S24 Ultra, or My Custom Gadgets"
            />
          </div>

          {/* Product Category Selector Grid */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              Select Product Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.6rem' }}>
              {CATEGORY_CHOICES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    style={{
                      background: isSelected ? 'rgba(20, 184, 166, 0.15)' : 'var(--bg-card)',
                      border: `1px solid ${isSelected ? 'var(--teal-bright)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 0.65rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                    onClick={() => {
                      setCategory(cat.id);
                      if (cat.id === 'smartphones') {
                        setTitle('Smartphone Comparison: Phone A vs Phone B');
                        setSelectedTemplateId('sample-smartphones');
                      } else if (cat.id === 'custom') {
                        setTitle('Custom Online Purchase Comparison');
                      }
                    }}
                  >
                    <Icon size={20} style={{ color: isSelected ? 'var(--teal-bright)' : 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: isSelected ? '#fff' : 'var(--text-main)' }}>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Canvas Mode Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              Choose Starting Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div
                style={{
                  background: starterType === 'blank' ? 'rgba(20, 184, 166, 0.12)' : 'var(--bg-card)',
                  border: `1.5px solid ${starterType === 'blank' ? 'var(--teal-bright)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem',
                  cursor: 'pointer',
                }}
                onClick={() => setStarterType('blank')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Package size={18} style={{ color: 'var(--teal-bright)' }} />
                  <strong style={{ fontSize: '0.92rem', color: '#fff' }}>Start with Blank Products</strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Zero preloaded data. Start with clean, empty product cards to enter your own items, prices, and ongoing expenses.
                </div>
              </div>

              <div
                style={{
                  background: starterType === 'template' ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card)',
                  border: `1.5px solid ${starterType === 'template' ? 'var(--indigo-accent)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem',
                  cursor: 'pointer',
                }}
                onClick={() => setStarterType('template')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Sparkles size={18} style={{ color: 'var(--indigo-accent)' }} />
                  <strong style={{ fontSize: '0.92rem', color: '#fff' }}>Load a Starter Benchmark</strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Preload realistic reference data (Phones, Laptops, Coffee, EVs) that you can customize and edit.
                </div>
              </div>
            </div>

            {starterType === 'template' && (
              <div style={{ marginTop: '0.75rem' }}>
                <select
                  className="input-box"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                >
                  {SAMPLE_COMPARISONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.options.length} options)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Horizon & Currency Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Evaluation Horizon
              </label>
              <select
                className="input-box"
                value={horizonYears}
                onChange={(e) => setHorizonYears(parseInt(e.target.value) || 3)}
              >
                <option value={1}>1 Year (12 Months)</option>
                <option value={2}>2 Years (24 Months - Common for Phones)</option>
                <option value={3}>3 Years (36 Months - Standard Lifecycle)</option>
                <option value={5}>5 Years (60 Months - Long Term)</option>
                <option value={10}>10 Years (120 Months)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Currency
              </label>
              <select
                className="input-box"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {BRAND_CONFIG.currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={onClose} style={{ fontSize: '0.88rem' }}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleCreate} style={{ fontSize: '0.88rem' }}>
            <span>Launch Comparison</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
