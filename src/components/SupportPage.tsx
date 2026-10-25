import React, { useState } from 'react';
import { 
  LifeBuoy, 
  Phone, 
  Mail, 
  Send, 
  HelpCircle, 
  Wrench, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  UserCheck, 
  Clock, 
  MapPin,
  Sparkles
} from 'lucide-react';
import { SUPPORT_CONFIG, FaqItem, TroubleshootingGuide, createSupportMailtoUrl } from '../config/support';

interface SupportPageProps {
  onNavigateToShopping?: () => void;
  onNavigateToWorkspace?: () => void;
}

export const SupportPage: React.FC<SupportPageProps> = ({
  onNavigateToShopping,
  onNavigateToWorkspace,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>(SUPPORT_CONFIG.faqs[0]?.id || null);

  // Contact Form State
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const dev = SUPPORT_CONFIG.leadDeveloper;

  const filteredFaqs = selectedCategory === 'all'
    ? SUPPORT_CONFIG.faqs
    : SUPPORT_CONFIG.faqs.filter((f) => f.category === selectedCategory);

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!subject.trim() || !message.trim()) {
      setFormError('Please enter both a subject and a message.');
      return;
    }

    if (senderEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    // Generate pre-filled mailto link using official template
    const fullMessage = senderEmail 
      ? `${message.trim()}\n\nReply-To Email: ${senderEmail.trim()}`
      : message.trim();
    const mailtoUrl = createSupportMailtoUrl(subject, fullMessage);

    // Open user's configured email client
    window.location.href = mailtoUrl;
    setFormSubmitted(true);
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 4rem', maxWidth: 1080 }}>
      {/* Page Title */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(20, 184, 166, 0.12)',
            color: 'var(--teal-bright)',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
          }}
        >
          <LifeBuoy size={15} />
          <span>VeraCost Official Support & Help Center</span>
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Contact & Technical Support
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: 650, margin: '0 auto' }}>
          Get direct help with barcode and QR scanning, visual product recognition, TCO lifetime cost calculations, and retailer price verification.
        </p>
      </div>

      {/* Grid: Lead Developer Profile & Contact Form */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem',
        }}
      >
        {/* Developer Contact Card */}
        <div
          className="card"
          style={{
            padding: '1.75rem',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--bg-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--teal-bright), #3b82f6)',
                  color: '#080c14',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                }}
              >
                RB
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {dev.name}
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--teal-bright)', fontWeight: 600 }}>
                  {dev.role}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '1.5rem' }}>
              Lead architect of VeraCost. Feel free to connect directly for hackathon queries, retailer API integrations, scanning diagnostics, or feature suggestions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Phone Action */}
              <a
                href={`tel:${dev.phone}`}
                aria-label={`Call lead developer ${dev.name} at ${dev.formattedPhone}`}
                title="Call lead developer directly"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(20, 184, 166, 0.08)',
                  border: '1px solid rgba(20, 184, 166, 0.2)',
                  color: 'var(--text-main)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <Phone size={18} style={{ color: 'var(--teal-bright)' }} />
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Direct Phone Contact</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--teal-bright)' }}>
                    {dev.formattedPhone}
                  </div>
                </div>
              </a>

              {/* Email Action */}
              <a
                href={createSupportMailtoUrl()}
                aria-label={`Email support at ${dev.email}`}
                title="Open configured mail client with pre-filled support template"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  color: 'var(--text-main)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <Mail size={18} style={{ color: 'var(--blue-highlight, #3b82f6)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Official Support Email</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--blue-highlight, #3b82f6)' }}>
                    {dev.email}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: 'var(--blue-highlight, #3b82f6)',
                    fontWeight: 600,
                  }}
                >
                  Email Support
                </span>
              </a>
            </div>
          </div>

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.76rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Clock size={13} />
            <span>Availability: {dev.availability}</span>
          </div>
        </div>

        {/* Contact Support Form */}
        <div
          className="card"
          style={{
            padding: '1.75rem',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Send size={18} style={{ color: 'var(--teal-bright)' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Send a Support Message
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Have a question about a calculation or want to report an unverified product price? Submit a ticket below:
          </p>

          {formSubmitted ? (
            <div
              style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(20, 184, 166, 0.1)',
                border: '1px solid rgba(20, 184, 166, 0.3)',
                textAlign: 'center',
              }}
            >
              <CheckCircle2 size={36} style={{ color: 'var(--teal-bright)', margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Email Draft Prepared in Your Mail Client
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.45 }}>
                Your device's email application has been opened with your message pre-addressed to <strong>{dev.email}</strong>.
              </p>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.4 }}>
                <em>Note: A mailto link creates a pre-filled draft in your mail app. Please click <strong>Send</strong> in your email client to dispatch your message.</em>
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setFormSubmitted(false);
                  setSubject('');
                  setMessage('');
                }}
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
              >
                Draft Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit}>
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Subject *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Barcode scanning question or Price verification issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{ width: '100%', fontSize: '0.88rem' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Your Email (Optional, for reply)
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  style={{ width: '100%', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Message *
                </label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Describe your issue or question in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ width: '100%', fontSize: '0.88rem', resize: 'vertical' }}
                  required
                />
              </div>

              {formError && (
                <div
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: 'var(--coral-danger)',
                    fontSize: '0.78rem',
                    marginBottom: '1rem',
                  }}
                >
                  {formError}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Send size={15} /> Send Message to Lead Developer
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Troubleshooting Guides */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Wrench size={20} style={{ color: 'var(--teal-bright)' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Interactive Troubleshooting Guides
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {SUPPORT_CONFIG.troubleshootingGuides.map((guide) => (
            <div
              key={guide.id}
              className="card"
              style={{
                padding: '1.25rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-card)',
              }}
            >
              <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--teal-bright)', marginBottom: '0.35rem' }}>
                {guide.title}
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Problem: {guide.problem}
              </p>
              <ol style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {guide.steps.map((step, idx) => (
                  <li key={idx} style={{ marginBottom: '0.3rem' }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>

      {/* Frequently Asked Questions (FAQ) Accordion */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HelpCircle size={20} style={{ color: 'var(--teal-bright)' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Frequently Asked Questions
            </h2>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {['all', 'tco', 'scanning', 'pricing', 'troubleshooting', 'general'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-pill)',
                  border: selectedCategory === cat ? '1px solid var(--teal-bright)' : '1px solid var(--border-subtle)',
                  background: selectedCategory === cat ? 'rgba(20, 184, 166, 0.15)' : 'var(--bg-card)',
                  color: selectedCategory === cat ? 'var(--teal-bright)' : 'var(--text-secondary)',
                  fontSize: '0.74rem',
                  fontWeight: selectedCategory === cat ? 700 : 500,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredFaqs.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="card"
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-card)',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  style={{
                    width: '100%',
                    padding: '1.1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--text-main)',
                    fontSize: '0.94rem',
                    fontWeight: 600,
                  }}
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp size={18} style={{ color: 'var(--teal-bright)', flexShrink: 0, marginLeft: '0.75rem' }} />
                  ) : (
                    <ChevronDown size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: '0.75rem' }} />
                  )}
                </button>

                {isOpen && (
                  <div
                    style={{
                      padding: '0 1.25rem 1.25rem',
                      fontSize: '0.86rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      paddingTop: '0.85rem',
                    }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
