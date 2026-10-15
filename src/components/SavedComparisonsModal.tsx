import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Trash2, 
  Copy, 
  FolderOpen, 
  BookmarkCheck, 
  Plus, 
  FileSpreadsheet,
  Edit2,
  Check
} from 'lucide-react';
import { ComparisonProject, ComparisonAnalysisResult } from '../types/cost';
import { SAMPLE_COMPARISONS } from '../data/sampleComparisons';

interface SavedComparisonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: ComparisonProject;
  onLoadProject: (project: ComparisonProject) => void;
  analysis: ComparisonAnalysisResult;
}

export const SavedComparisonsModal: React.FC<SavedComparisonsModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onLoadProject,
  analysis,
}) => {
  const [savedList, setSavedList] = useState<ComparisonProject[]>(() => {
    try {
      const stored = localStorage.getItem('veracost_saved_comparisons');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return SAMPLE_COMPARISONS;
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  if (!isOpen) return null;

  // Persist list to localStorage
  const updateSavedList = (newList: ComparisonProject[]) => {
    setSavedList(newList);
    try {
      localStorage.setItem('veracost_saved_comparisons', JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  // Save current project
  const handleSaveCurrent = () => {
    const updated = {
      ...currentProject,
      updatedAt: new Date().toISOString(),
    };

    const exists = savedList.some((p) => p.id === updated.id);
    let newList: ComparisonProject[];
    if (exists) {
      newList = savedList.map((p) => (p.id === updated.id ? updated : p));
    } else {
      newList = [updated, ...savedList];
    }
    updateSavedList(newList);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  // Delete a project
  const handleDelete = (id: string) => {
    const newList = savedList.filter((p) => p.id !== id);
    updateSavedList(newList);
  };

  // Duplicate a project
  const handleDuplicate = (project: ComparisonProject) => {
    const dup: ComparisonProject = {
      ...project,
      id: `proj-${Date.now()}`,
      title: `${project.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updateSavedList([dup, ...savedList]);
  };

  // Save rename
  const handleSaveRename = (id: string) => {
    if (!editTitle.trim()) return;
    const newList = savedList.map((p) => (p.id === id ? { ...p, title: editTitle } : p));
    updateSavedList(newList);
    setEditingId(null);
  };

  // CSV Export
  const handleExportCsv = () => {
    const rows: string[] = [];
    rows.push(`"VeraCost Decision Export - ${currentProject.title}"`);
    rows.push(`"Evaluation Horizon","${currentProject.horizonYears} Years"`);
    rows.push(`"Scenario","${currentProject.scenario}"`);
    rows.push(`"Currency","${currentProject.currency}"`);
    rows.push(`"Generated","${new Date().toLocaleString()}"`);
    rows.push('');

    // Summary headers
    const optionNames = currentProject.options.map((o) => `"${o.name}"`).join(',');
    rows.push(`"Category",${optionNames}`);

    const res = analysis.results;
    const ids = currentProject.options.map((o) => o.id);

    rows.push(`"Initial Purchase & Taxes",${ids.map((id) => res[id]?.initialAcquisitionTotal || 0).join(',')}`);
    rows.push(`"Setup & Accessories",${ids.map((id) => res[id]?.setupAccessoriesTotal || 0).join(',')}`);
    rows.push(`"Recurring Subscriptions",${ids.map((id) => res[id]?.recurringTotal || 0).join(',')}`);
    rows.push(`"Maintenance & Repairs",${ids.map((id) => res[id]?.maintenanceTotal || 0).join(',')}`);
    rows.push(`"Operating Utilities & Consumables",${ids.map((id) => res[id]?.operatingTotal || 0).join(',')}`);
    rows.push(`"Replacement Outlays",${ids.map((id) => res[id]?.replacementTotal || 0).join(',')}`);
    rows.push(`"Residual Resale Recovery",${ids.map((id) => -(res[id]?.residualRecoveryTotal || 0)).join(',')}`);
    rows.push(`"Net Total Cost of Ownership",${ids.map((id) => res[id]?.netTotalCost || 0).join(',')}`);
    rows.push(`"Monthly Equivalent Cost",${ids.map((id) => res[id]?.monthlyEquivalentCost || 0).join(',')}`);

    rows.push('');
    rows.push('"Monthly Cashflow Timeline"');
    rows.push(`"Month",${currentProject.options.map((o) => `"${o.name} Cumulative"`).join(',')}`);

    const horizonMonths = Math.max(1, Math.round(currentProject.horizonYears * 12));
    for (let m = 0; m <= horizonMonths; m++) {
      const vals = ids.map((id) => {
        const pt = res[id]?.timeline.find((t) => t.month === m);
        return pt ? pt.cumulativeCost : 0;
      });
      rows.push(`"Month ${m}",${vals.join(',')}`);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `VeraCost_${currentProject.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BookmarkCheck size={22} style={{ color: 'var(--teal-bright)' }} />
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Saved Comparisons & Benchmarks</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Reopen, clone, rename, or export your saved purchasing models.
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Action bar */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={handleSaveCurrent} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            <BookmarkCheck size={15} />
            {saveSuccessMsg ? 'Saved to LocalStorage!' : 'Save Active Comparison'}
          </button>
          <button className="btn-secondary" onClick={handleExportCsv} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            <FileSpreadsheet size={15} />
            Export CSV Spreadsheet
          </button>
        </div>

        {/* Saved List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {savedList.map((project) => {
            const isCurrent = project.id === currentProject.id;
            const isEditing = editingId === project.id;

            return (
              <div
                key={project.id}
                style={{
                  background: isCurrent ? 'rgba(20, 184, 166, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                  border: `1px solid ${isCurrent ? 'var(--teal-bright)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '220px' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="input-box"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.9rem' }}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                      />
                      <button className="icon-btn" onClick={() => handleSaveRename(project.id)}>
                        <Check size={16} style={{ color: 'var(--emerald-success)' }} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                          {project.title}
                        </span>
                        {isCurrent && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: 'var(--teal-primary)',
                              color: '#fff',
                              padding: '0.1rem 0.4rem',
                              borderRadius: 'var(--radius-full)',
                            }}
                          >
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {project.options.length} options • {project.horizonYears}-year horizon • {project.currency} • Last modified{' '}
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {!isCurrent && (
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                      onClick={() => {
                        onLoadProject(project);
                        onClose();
                      }}
                    >
                      <FolderOpen size={14} /> Load
                    </button>
                  )}
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setEditingId(project.id);
                      setEditTitle(project.title);
                    }}
                    title="Rename"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => handleDuplicate(project)}
                    title="Duplicate"
                  >
                    <Copy size={15} />
                  </button>
                  {savedList.length > 1 && (
                    <button
                      className="icon-btn danger"
                      onClick={() => handleDelete(project.id)}
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
