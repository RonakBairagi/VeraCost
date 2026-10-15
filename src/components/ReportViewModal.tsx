import React from 'react';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { ComparisonAnalysisResult, ComparisonProject } from '../types/cost';
import { BRAND_CONFIG } from '../config/branding';

interface ReportViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ComparisonProject;
  analysis: ComparisonAnalysisResult;
}

export const ReportViewModal: React.FC<ReportViewModalProps> = ({
  isOpen,
  onClose,
  project,
  analysis,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const optionIds = Object.keys(analysis.results);
  const lowestOption = analysis.results[analysis.lowestCostOptionId];

  return (
    <div className="modal-overlay print-mode-active" onClick={onClose}>
      <div
        className="modal-content print-report-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 900 }}
      >
        {/* Modal Controls (Hidden in Print) */}
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={22} style={{ color: 'var(--teal-bright)' }} />
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Executive TCO Decision Report</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Print-friendly formal document suitable for procurement review or archival.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn-primary" onClick={handlePrint} style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}>
              <Printer size={15} /> Print / Save as PDF
            </button>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* --- FORMAL PRINTABLE REPORT BODY --- */}
        <div className="printable-report">
          <div className="print-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="print-brand">{BRAND_CONFIG.name}</div>
                <div style={{ fontSize: '11pt', color: '#475569' }}>
                  Total Cost of Ownership (TCO) Decision Analysis
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '9pt', color: '#64748b' }}>
                <div>Report Date: {new Date().toLocaleDateString()}</div>
                <div>Status: Formal Decision Support Model</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '16pt', marginBottom: '0.25rem', color: '#0f172a' }}>
              {project.title}
            </h2>
            <div style={{ fontSize: '10pt', color: '#475569' }}>
              Evaluation Horizon: <strong>{project.horizonYears} Years ({project.horizonYears * 12} Months)</strong> | Scenario Model: <strong>{project.scenario.toUpperCase()}</strong> | Currency: <strong>{project.currency}</strong>
            </div>
          </div>

          {/* Executive Summary Box */}
          <div
            style={{
              border: '1px solid #0d9488',
              background: '#f0fdfa',
              padding: '12px 16px',
              borderRadius: '6px',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ fontWeight: 700, color: '#0f766e', fontSize: '11pt', marginBottom: '4px' }}>
              Recommended TCO Option: {lowestOption?.optionName}
            </div>
            <div style={{ fontSize: '10pt', color: '#134e4a' }}>
              Based on the deterministic calculation model, {lowestOption?.optionName} yields the lowest estimated net cost of{' '}
              <strong>{project.currency} {lowestOption?.netTotalCost.toLocaleString()}</strong> ({project.currency}{' '}
              {lowestOption?.monthlyEquivalentCost.toLocaleString()}/mo), delivering a projected lifecycle savings of{' '}
              <strong>{project.currency} {analysis.netSavings.toLocaleString()} ({analysis.percentageSavings}%)</strong>.
            </div>
          </div>

          {/* Detailed Cost Breakdown Table */}
          <table className="print-table">
            <thead>
              <tr>
                <th>Expense Classification</th>
                {optionIds.map((id) => (
                  <th key={id}>{analysis.results[id].optionName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Initial Acquisition Price & Taxes</td>
                {optionIds.map((id) => (
                  <td key={id}>{project.currency} {analysis.results[id].initialAcquisitionTotal.toLocaleString()}</td>
                ))}
              </tr>
              <tr>
                <td>Setup & Accessories</td>
                {optionIds.map((id) => (
                  <td key={id}>{project.currency} {analysis.results[id].setupAccessoriesTotal.toLocaleString()}</td>
                ))}
              </tr>
              <tr>
                <td>Recurring Subscriptions & Warranties ({project.horizonYears} Yrs)</td>
                {optionIds.map((id) => (
                  <td key={id}>{project.currency} {analysis.results[id].recurringTotal.toLocaleString()}</td>
                ))}
              </tr>
              <tr>
                <td>Scheduled Maintenance & Servicing</td>
                {optionIds.map((id) => (
                  <td key={id}>{project.currency} {analysis.results[id].maintenanceTotal.toLocaleString()}</td>
                ))}
              </tr>
              <tr>
                <td>Operating Utilities & Consumables</td>
                {optionIds.map((id) => (
                  <td key={id}>{project.currency} {analysis.results[id].operatingTotal.toLocaleString()}</td>
                ))}
              </tr>
              <tr>
                <td>Equipment Replacements ({project.horizonYears}-Yr Horizon)</td>
                {optionIds.map((id) => (
                  <td key={id}>
                    {project.currency} {analysis.results[id].replacementTotal.toLocaleString()} ({analysis.results[id].replacementsOccurred} cycles)
                  </td>
                ))}
              </tr>
              <tr>
                <td>Residual Resale Recovery</td>
                {optionIds.map((id) => (
                  <td key={id}>− {project.currency} {analysis.results[id].residualRecoveryTotal.toLocaleString()}</td>
                ))}
              </tr>
              <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                <td>Net Total Cost of Ownership (TCO)</td>
                {optionIds.map((id) => (
                  <td key={id}>
                    {project.currency} {analysis.results[id].netTotalCost.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <td>Monthly Equivalent Cost (MEC)</td>
                {optionIds.map((id) => (
                  <td key={id}>
                    {project.currency} {analysis.results[id].monthlyEquivalentCost.toLocaleString()} / mo
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* Key Drivers */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 700, fontSize: '11pt', marginBottom: '0.5rem', color: '#0f172a' }}>
              Primary Cost Differentiators
            </div>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '9.5pt', color: '#334155', lineHeight: 1.6 }}>
              {analysis.keyDrivers.map((d, idx) => (
                <li key={idx}>
                  <strong>{d.title}:</strong> {d.description} (Delta: {project.currency} {d.impactAmount.toLocaleString()})
                </li>
              ))}
            </ul>
          </div>

          {/* Limitations and Disclaimers */}
          <div className="print-disclaimer">
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>Model Limitations & Verification Notice:</div>
            <div>
              1. This document provides decision support modeling based on deterministic mathematical aggregation of user-specified and benchmarked assumptions.
            </div>
            <div>
              2. Projections assume consistent usage patterns and standard operating conditions. Unscheduled repairs, catastrophic wear, or sudden tariff changes may alter net figures.
            </div>
            <div>
              3. Resale values represent historical secondary market estimates and are not guaranteed equity redemption contracts.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
