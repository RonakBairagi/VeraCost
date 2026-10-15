import React, { useState } from 'react';
import { 
  Trash2, 
  Copy, 
  Plus, 
  Sparkles, 
  HelpCircle, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { 
  ComparisonOption, 
  CostItem, 
  ConfidenceLevel, 
  BillingFrequency, 
  ProductCategory 
} from '../types/cost';
import { getSuggestionsForCategory, DiscoverySuggestion, createCostItemFromSuggestion } from '../engine/discovery';

interface OptionCardProps {
  option: ComparisonOption;
  index: number;
  currency: string;
  onUpdate: (updated: ComparisonOption) => void;
  onDuplicate: (option: ComparisonOption) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

const OPTION_THEME_COLORS = ['#14b8a6', '#6366f1', '#f59e0b', '#ec4899'];

export const OptionCard: React.FC<OptionCardProps> = ({
  option,
  index,
  currency,
  onUpdate,
  onDuplicate,
  onRemove,
  canRemove,
}) => {
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    setup: true,
    recurring: true,
    maintenance: false,
    operating: false,
    longevity: true,
  });

  const themeColor = OPTION_THEME_COLORS[index % OPTION_THEME_COLORS.length];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Helper to add a blank cost item to a category
  const addCostItem = (category: 'setup' | 'recurring' | 'maintenance' | 'operating') => {
    const newItem: CostItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `New ${category} item`,
      category,
      amount: 0,
      frequency: category === 'setup' ? 'one-time' : category === 'recurring' ? 'monthly' : 'annual',
      confidence: 'user-estimate',
    };

    if (category === 'setup') {
      onUpdate({ ...option, setupAndAccessories: [...(option.setupAndAccessories || []), newItem] });
    } else if (category === 'recurring') {
      onUpdate({ ...option, recurringCosts: [...(option.recurringCosts || []), newItem] });
    } else if (category === 'maintenance') {
      onUpdate({ ...option, maintenanceCosts: [...(option.maintenanceCosts || []), newItem] });
    } else if (category === 'operating') {
      onUpdate({ ...option, operatingCosts: [...(option.operatingCosts || []), newItem] });
    }
  };

  // Helper to remove a cost item
  const removeCostItem = (itemId: string, category: 'setup' | 'recurring' | 'maintenance' | 'operating') => {
    if (category === 'setup') {
      onUpdate({ ...option, setupAndAccessories: option.setupAndAccessories.filter((i) => i.id !== itemId) });
    } else if (category === 'recurring') {
      onUpdate({ ...option, recurringCosts: option.recurringCosts.filter((i) => i.id !== itemId) });
    } else if (category === 'maintenance') {
      onUpdate({ ...option, maintenanceCosts: option.maintenanceCosts.filter((i) => i.id !== itemId) });
    } else if (category === 'operating') {
      onUpdate({ ...option, operatingCosts: option.operatingCosts.filter((i) => i.id !== itemId) });
    }
  };

  // Helper to update a single cost item
  const updateCostItem = (
    itemId: string,
    category: 'setup' | 'recurring' | 'maintenance' | 'operating',
    updates: Partial<CostItem>
  ) => {
    const updater = (list: CostItem[]) =>
      list.map((item) => (item.id === itemId ? { ...item, ...updates } : item));

    if (category === 'setup') {
      onUpdate({ ...option, setupAndAccessories: updater(option.setupAndAccessories) });
    } else if (category === 'recurring') {
      onUpdate({ ...option, recurringCosts: updater(option.recurringCosts) });
    } else if (category === 'maintenance') {
      onUpdate({ ...option, maintenanceCosts: updater(option.maintenanceCosts) });
    } else if (category === 'operating') {
      onUpdate({ ...option, operatingCosts: updater(option.operatingCosts) });
    }
  };

  // Accept a suggestion from discovery engine
  const handleAcceptSuggestion = (suggestion: DiscoverySuggestion) => {
    const newItem = createCostItemFromSuggestion(suggestion);
    if (suggestion.category === 'setup') {
      onUpdate({ ...option, setupAndAccessories: [...(option.setupAndAccessories || []), newItem] });
      setExpandedSections((prev) => ({ ...prev, setup: true }));
    } else if (suggestion.category === 'recurring') {
      onUpdate({ ...option, recurringCosts: [...(option.recurringCosts || []), newItem] });
      setExpandedSections((prev) => ({ ...prev, recurring: true }));
    } else if (suggestion.category === 'maintenance') {
      onUpdate({ ...option, maintenanceCosts: [...(option.maintenanceCosts || []), newItem] });
      setExpandedSections((prev) => ({ ...prev, maintenance: true }));
    } else if (suggestion.category === 'operating') {
      onUpdate({ ...option, operatingCosts: [...(option.operatingCosts || []), newItem] });
      setExpandedSections((prev) => ({ ...prev, operating: true }));
    }
  };

  const suggestions = getSuggestionsForCategory(option.category || 'electronics');

  return (
    <div className="option-card" style={{ borderTop: `4px solid ${themeColor}` }}>
      {/* Option Header */}
      <div className="option-header">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: themeColor,
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: themeColor, textTransform: 'uppercase' }}>
              Product {String.fromCharCode(65 + index)}
            </span>
            <select
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.1rem 0.35rem',
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                marginLeft: 'auto',
              }}
              value={option.category || 'smartphones'}
              onChange={(e) => onUpdate({ ...option, category: e.target.value as ProductCategory })}
            >
              <option value="smartphones">📱 Smartphone</option>
              <option value="electronics">💻 Laptop/Computer</option>
              <option value="audio-wearables">🎧 Audio/Wearable</option>
              <option value="gaming">🎮 Gaming</option>
              <option value="appliances">☕ Appliance</option>
              <option value="vehicles">🚗 Vehicle</option>
              <option value="cloud-software">☁️ Software</option>
              <option value="custom">📦 Custom Product</option>
              <option value="other">🌐 General</option>
            </select>
          </div>
          <input
            type="text"
            className="option-title-input"
            value={option.name}
            onChange={(e) => onUpdate({ ...option, name: e.target.value })}
            placeholder="Product Name (e.g. iPhone 16 Pro, Galaxy S24, Custom Product)"
          />
          <input
            type="text"
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px dashed rgba(255, 255, 255, 0.1)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              padding: '0.15rem 0',
              marginTop: '0.2rem',
              width: '100%',
            }}
            value={option.brandOrModel || ''}
            onChange={(e) => onUpdate({ ...option, brandOrModel: e.target.value })}
            placeholder="Brand, model, or store link (optional)"
          />
        </div>

        <div className="option-actions">
          <button
            className="icon-btn"
            onClick={() => onDuplicate(option)}
            title="Duplicate Option"
          >
            <Copy size={16} />
          </button>
          {canRemove && (
            <button
              className="icon-btn danger"
              onClick={() => onRemove(option.id)}
              title="Remove Option"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="option-body">
        {/* Upfront Acquisition Section */}
        <div className="field-group">
          <div className="field-label">
            <span>Initial Acquisition Price</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sticker Price</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                Purchase Price ({currency})
              </div>
              <input
                type="number"
                min="0"
                step="any"
                className="input-box"
                value={option.initialPurchasePrice || ''}
                onChange={(e) => onUpdate({ ...option, initialPurchasePrice: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                Sales Tax / Delivery ({currency})
              </div>
              <input
                type="number"
                min="0"
                step="any"
                className="input-box"
                value={option.salesTaxOrFees || ''}
                onChange={(e) => onUpdate({ ...option, salesTaxOrFees: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Confidence:</span>
            <select
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.15rem 0.4rem',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
              }}
              value={option.purchaseConfidence}
              onChange={(e) => onUpdate({ ...option, purchaseConfidence: e.target.value as ConfidenceLevel })}
            >
              <option value="confirmed">Confirmed (Receipt / Store MSRP)</option>
              <option value="user-estimate">User Estimate</option>
              <option value="external-source">External Source Citation</option>
              <option value="missing">Flag as Missing / Uncertain</option>
            </select>
          </div>
        </div>

        {/* Setup & Accessories Section */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => toggleSection('setup')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Setup & Accessories</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ({option.setupAndAccessories?.length || 0})
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className="icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  addCostItem('setup');
                }}
                title="Add Accessory Item"
              >
                <Plus size={15} />
              </button>
              {expandedSections.setup ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {expandedSections.setup && (
            <div className="cost-items-list">
              {option.setupAndAccessories?.map((item) => (
                <div key={item.id} className="cost-item-row">
                  <input
                    type="text"
                    style={{ background: 'transparent', border: 'none', color: '#fff', flex: 1, fontSize: '0.85rem' }}
                    value={item.name}
                    onChange={(e) => updateCostItem(item.id, 'setup', { name: e.target.value })}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{currency}</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 4,
                        width: '75px',
                        padding: '0.2rem 0.4rem',
                        fontSize: '0.85rem',
                        color: '#fff',
                      }}
                      value={item.amount || ''}
                      onChange={(e) => updateCostItem(item.id, 'setup', { amount: parseFloat(e.target.value) || 0 })}
                    />
                    <button
                      className="icon-btn danger"
                      onClick={() => removeCostItem(item.id, 'setup')}
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {(!option.setupAndAccessories || option.setupAndAccessories.length === 0) && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.25rem 0' }}>
                  No setup or accessories added.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recurring Expenses Section */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => toggleSection('recurring')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Recurring Services & Subscriptions</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ({option.recurringCosts?.length || 0})
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className="icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  addCostItem('recurring');
                }}
                title="Add Recurring Cost"
              >
                <Plus size={15} />
              </button>
              {expandedSections.recurring ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {expandedSections.recurring && (
            <div className="cost-items-list">
              {option.recurringCosts?.map((item) => (
                <div key={item.id} className="cost-item-row" style={{ flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    style={{ background: 'transparent', border: 'none', color: '#fff', flex: 1, fontSize: '0.85rem', minWidth: '130px' }}
                    value={item.name}
                    onChange={(e) => updateCostItem(item.id, 'recurring', { name: e.target.value })}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{currency}</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 4,
                        width: '70px',
                        padding: '0.2rem 0.4rem',
                        fontSize: '0.85rem',
                        color: '#fff',
                      }}
                      value={item.amount || ''}
                      onChange={(e) => updateCostItem(item.id, 'recurring', { amount: parseFloat(e.target.value) || 0 })}
                    />
                    <select
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 4,
                        padding: '0.2rem 0.3rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                      }}
                      value={item.frequency || 'monthly'}
                      onChange={(e) => updateCostItem(item.id, 'recurring', { frequency: e.target.value as BillingFrequency })}
                    >
                      <option value="monthly">/ mo</option>
                      <option value="annual">/ yr</option>
                      <option value="quarterly">/ qtr</option>
                      <option value="weekly">/ wk</option>
                    </select>
                    <button
                      className="icon-btn danger"
                      onClick={() => removeCostItem(item.id, 'recurring')}
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {(!option.recurringCosts || option.recurringCosts.length === 0) && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.25rem 0' }}>
                  No recurring costs.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Maintenance & Repairs Section */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => toggleSection('maintenance')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Maintenance & Repairs</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ({option.maintenanceCosts?.length || 0})
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className="icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  addCostItem('maintenance');
                }}
                title="Add Maintenance Cost"
              >
                <Plus size={15} />
              </button>
              {expandedSections.maintenance ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {expandedSections.maintenance && (
            <div className="cost-items-list">
              {option.maintenanceCosts?.map((item) => (
                <div key={item.id} className="cost-item-row">
                  <input
                    type="text"
                    style={{ background: 'transparent', border: 'none', color: '#fff', flex: 1, fontSize: '0.85rem' }}
                    value={item.name}
                    onChange={(e) => updateCostItem(item.id, 'maintenance', { name: e.target.value })}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{currency}</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 4,
                        width: '75px',
                        padding: '0.2rem 0.4rem',
                        fontSize: '0.85rem',
                        color: '#fff',
                      }}
                      value={item.amount || ''}
                      onChange={(e) => updateCostItem(item.id, 'maintenance', { amount: parseFloat(e.target.value) || 0 })}
                    />
                    <button
                      className="icon-btn danger"
                      onClick={() => removeCostItem(item.id, 'maintenance')}
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {(!option.maintenanceCosts || option.maintenanceCosts.length === 0) && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.25rem 0' }}>
                  No maintenance costs listed.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Operating Expenses Section */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => toggleSection('operating')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Operating (Energy & Consumables)</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ({option.operatingCosts?.length || 0})
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className="icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  addCostItem('operating');
                }}
                title="Add Operating Cost"
              >
                <Plus size={15} />
              </button>
              {expandedSections.operating ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {expandedSections.operating && (
            <div className="cost-items-list">
              {option.operatingCosts?.map((item) => (
                <div key={item.id} className="cost-item-row" style={{ flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    style={{ background: 'transparent', border: 'none', color: '#fff', flex: 1, fontSize: '0.85rem', minWidth: '130px' }}
                    value={item.name}
                    onChange={(e) => updateCostItem(item.id, 'operating', { name: e.target.value })}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{currency}</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 4,
                        width: '70px',
                        padding: '0.2rem 0.4rem',
                        fontSize: '0.85rem',
                        color: '#fff',
                      }}
                      value={item.amount || ''}
                      onChange={(e) => updateCostItem(item.id, 'operating', { amount: parseFloat(e.target.value) || 0 })}
                    />
                    <select
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 4,
                        padding: '0.2rem 0.3rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                      }}
                      value={item.frequency || 'monthly'}
                      onChange={(e) => updateCostItem(item.id, 'operating', { frequency: e.target.value as BillingFrequency })}
                    >
                      <option value="monthly">/ mo</option>
                      <option value="annual">/ yr</option>
                    </select>
                    <button
                      className="icon-btn danger"
                      onClick={() => removeCostItem(item.id, 'operating')}
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {(!option.operatingCosts || option.operatingCosts.length === 0) && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.25rem 0' }}>
                  No operating costs listed.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Longevity & Residual Value */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '0.5rem' }}
            onClick={() => toggleSection('longevity')}
          >
            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Longevity & Resale Recovery</span>
            {expandedSections.longevity ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          {expandedSections.longevity && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  Useful Life (Years)
                </div>
                <input
                  type="number"
                  min="1"
                  max="25"
                  className="input-box"
                  value={option.usefulLifeYears || ''}
                  onChange={(e) => onUpdate({ ...option, usefulLifeYears: parseFloat(e.target.value) || 1 })}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={option.replaceAtEndOfLife || false}
                    onChange={(e) => onUpdate({ ...option, replaceAtEndOfLife: e.target.checked })}
                  />
                  Auto-trigger replacement
                </label>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  Resale Recovery Value ({currency})
                </div>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="input-box"
                  value={option.residualValueEstimate || ''}
                  onChange={(e) => onUpdate({ ...option, residualValueEstimate: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Equity recovered at horizon end
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cost Discovery Trigger Button */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
          <button
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.55rem',
              borderRadius: 'var(--radius-md)',
              background: showDiscovery ? 'rgba(20, 184, 166, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              border: `1px dashed ${showDiscovery ? 'var(--teal-bright)' : 'var(--border-medium)'}`,
              color: showDiscovery ? 'var(--teal-bright)' : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onClick={() => setShowDiscovery(!showDiscovery)}
          >
            <Sparkles size={14} />
            {showDiscovery ? 'Hide Category Checklist' : 'Explore Category Hidden Costs'}
          </button>

          {/* Inline Discovery Checklist Drawer */}
          {showDiscovery && (
            <div
              style={{
                marginTop: '0.75rem',
                background: 'rgba(8, 12, 20, 0.9)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--teal-bright)' }}>
                Common Overlooked Expenses for {option.category}:
              </div>
              {suggestions.slice(0, 4).map((sug) => (
                <div
                  key={sug.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ fontSize: '0.78rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{sug.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      {sug.typicalRange} • {sug.category}
                    </div>
                  </div>
                  <button
                    style={{
                      background: 'rgba(20, 184, 166, 0.15)',
                      color: 'var(--teal-bright)',
                      border: '1px solid rgba(20, 184, 166, 0.3)',
                      borderRadius: 4,
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                    onClick={() => handleAcceptSuggestion(sug)}
                  >
                    <Plus size={11} /> Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
