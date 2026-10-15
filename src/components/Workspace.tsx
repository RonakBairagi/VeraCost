import React, { useState } from 'react';
import { 
  Plus, 
  Bookmark, 
  Printer, 
  Share2, 
  SlidersHorizontal, 
  Layers, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { 
  ComparisonProject, 
  ComparisonOption, 
  ProductCategory, 
  ScenarioType 
} from '../types/cost';
import { calculateComparison } from '../engine/calculator';
import { OptionCard } from './OptionCard';
import { ResultsDashboard } from './ResultsDashboard';
import { CostAuditPanel } from './CostAuditPanel';
import { AiExecutiveReview } from './AiExecutiveReview';

interface WorkspaceProps {
  project: ComparisonProject;
  setProject: React.Dispatch<React.SetStateAction<ComparisonProject>>;
  currency: string;
  isAiLive: boolean;
  onOpenSettings: () => void;
  onOpenSavedModal: () => void;
  onOpenReportModal: () => void;
  onOpenNewComparison: () => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  project,
  setProject,
  currency,
  isAiLive,
  onOpenSettings,
  onOpenSavedModal,
  onOpenReportModal,
  onOpenNewComparison,
}) => {
  // Execute deterministic financial calculations on every update
  const analysis = calculateComparison(project);

  // Update a single option
  const handleUpdateOption = (updatedOption: ComparisonOption) => {
    setProject((prev) => ({
      ...prev,
      options: prev.options.map((opt) => (opt.id === updatedOption.id ? updatedOption : opt)),
      updatedAt: new Date().toISOString(),
    }));
  };

  // Duplicate an option
  const handleDuplicateOption = (opt: ComparisonOption) => {
    const duplicated: ComparisonOption = {
      ...opt,
      id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `${opt.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProject((prev) => ({
      ...prev,
      options: [...prev.options, duplicated],
      updatedAt: new Date().toISOString(),
    }));
  };

  // Remove an option
  const handleRemoveOption = (id: string) => {
    if (project.options.length <= 1) return;
    setProject((prev) => ({
      ...prev,
      options: prev.options.filter((opt) => opt.id !== id),
      updatedAt: new Date().toISOString(),
    }));
  };

  // Add a new blank custom option
  const handleAddOption = () => {
    const newOpt: ComparisonOption = {
      id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: project.category === 'smartphones' 
        ? `Custom Phone ${String.fromCharCode(65 + project.options.length)}`
        : `Custom Product ${String.fromCharCode(65 + project.options.length)}`,
      category: project.category,
      currency: project.currency,
      brandOrModel: '',
      notes: 'Custom product specifications and expenses.',
      initialPurchasePrice: 0,
      salesTaxOrFees: 0,
      purchaseConfidence: 'user-estimate',
      setupAndAccessories: [],
      recurringCosts: [],
      maintenanceCosts: [],
      operatingCosts: [],
      usefulLifeYears: project.horizonYears,
      replaceAtEndOfLife: false,
      residualValueEstimate: 0,
      residualConfidence: 'user-estimate',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProject((prev) => ({
      ...prev,
      options: [...prev.options, newOpt],
      updatedAt: new Date().toISOString(),
    }));
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Top Workspace Header & Metadata */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--teal-bright)',
                background: 'rgba(20, 184, 166, 0.12)',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              Active Decision Model
            </span>
            <select
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.2rem 0.6rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-main)',
              }}
              value={project.category}
              onChange={(e) => setProject({ ...project, category: e.target.value as ProductCategory })}
            >
              <option value="smartphones">📱 Smartphones & Mobile Devices</option>
              <option value="electronics">💻 Laptops & Computers</option>
              <option value="audio-wearables">🎧 Audio & Wearables</option>
              <option value="gaming">🎮 Gaming & Consoles</option>
              <option value="appliances">☕ Household Appliances & Kitchen</option>
              <option value="vehicles">🚗 Vehicles & Mobility</option>
              <option value="cloud-software">☁️ Cloud & Software SaaS</option>
              <option value="home-garden">🏡 Home & Garden</option>
              <option value="custom">📦 Custom Product / Any Online Purchase</option>
              <option value="other">🌐 General Purchasing</option>
            </select>
          </div>

          <input
            type="text"
            className="option-title-input"
            style={{ fontSize: '1.75rem', fontWeight: 800 }}
            value={project.title}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            placeholder="Comparison Title (e.g. Phone A vs Phone B)"
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            onClick={onOpenNewComparison}
            style={{ fontSize: '0.85rem', padding: '0.55rem 1rem' }}
            title="Create a new custom comparison from scratch"
          >
            <Plus size={15} /> New Comparison
          </button>
          <button
            className="btn-secondary"
            onClick={handleAddOption}
            style={{ fontSize: '0.85rem', padding: '0.55rem 1rem' }}
          >
            <Plus size={15} /> Add Product
          </button>
          <button
            className="btn-secondary"
            onClick={onOpenSavedModal}
            style={{ fontSize: '0.85rem', padding: '0.55rem 1rem' }}
          >
            <Bookmark size={15} /> Save / Benchmarks
          </button>
          <button
            className="btn-primary"
            onClick={onOpenReportModal}
            style={{ fontSize: '0.85rem', padding: '0.55rem 1.15rem' }}
          >
            <Printer size={15} /> Formal Report
          </button>
        </div>
      </div>

      {/* Helpful Banner explaining Custom Products */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.08), rgba(99, 102, 241, 0.05))',
          border: '1px solid rgba(20, 184, 166, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ color: 'var(--text-secondary)' }}>
          <strong style={{ color: '#fff' }}>Custom Product Flexibility:</strong> You can model <em>any</em> product you buy online (smartphones, gadgets, tech, appliances, subscriptions). Edit the titles, prices, accessories, and recurring costs below, or click <strong>New Comparison</strong> to start completely blank.
        </div>
        <button
          className="btn-secondary"
          onClick={handleAddOption}
          style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem' }}
        >
          <Plus size={13} /> Add Another Product
        </button>
      </div>

      {/* Comparison Options Grid */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SlidersHorizontal size={18} style={{ color: 'var(--teal-bright)' }} />
          Side-by-Side Products Model ({project.options.length})
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          All fields calculate live • Multi-frequency billing normalized automatically
        </span>
      </div>

      <div className="options-grid">
        {project.options.map((option, idx) => (
          <OptionCard
            key={option.id}
            option={option}
            index={idx}
            currency={project.currency}
            onUpdate={handleUpdateOption}
            onDuplicate={handleDuplicateOption}
            onRemove={handleRemoveOption}
            canRemove={project.options.length > 1}
          />
        ))}

        {/* Add Another Custom Product Card */}
        <button
          type="button"
          onClick={handleAddOption}
          style={{
            background: 'rgba(15, 23, 42, 0.4)',
            border: '2px dashed var(--border-medium)',
            borderRadius: 'var(--radius-xl)',
            padding: '2.5rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            minHeight: '380px',
            transition: 'all var(--transition-fast)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(20, 184, 166, 0.12)',
              color: 'var(--teal-bright)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={24} />
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
            + Add Another Custom Product
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '240px' }}>
            Compare a smartphone, gadget, alternative brand, appliance, or any custom internet purchase.
          </div>
        </button>
      </div>

      {/* Results Dashboard & Interactive Simulation */}
      <ResultsDashboard
        analysis={analysis}
        scenario={project.scenario}
        setScenario={(sc: ScenarioType) => setProject((prev) => ({ ...prev, scenario: sc }))}
        horizonYears={project.horizonYears}
        setHorizonYears={(y: number) => setProject((prev) => ({ ...prev, horizonYears: y }))}
        discountRatePct={project.discountRatePct}
        setDiscountRatePct={(r: number) => setProject((prev) => ({ ...prev, discountRatePct: r }))}
      />

      {/* Data Provenance & Cost Audit Panel */}
      <CostAuditPanel analysis={analysis} options={project.options} />

      {/* NVIDIA Nemotron Decision Support */}
      <AiExecutiveReview
        analysis={analysis}
        isAiLive={isAiLive}
        onOpenSettings={onOpenSettings}
      />
    </div>
  );
};
