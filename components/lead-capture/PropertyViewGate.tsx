import React, { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

const STORAGE_KEY = 'casas_property_views';
const DISMISSED_KEY = 'casas_capture_dismissed';
const VIEW_THRESHOLD = 5;

/**
 * Soft lead capture gate — shown after 5th property view.
 * NOT a hard gate like CINC. Always dismissable.
 * Stores count in localStorage, respects dismissal.
 */
export default function PropertyViewGate() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const viewCount = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) + 1;
    localStorage.setItem(STORAGE_KEY, String(viewCount));

    if (viewCount >= VIEW_THRESHOLD) {
      // Delay slightly so it doesn't feel jarring
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
      if (webhookUrl && !webhookUrl.includes('your-n8n-instance')) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            phone: phone.trim() || undefined,
            source: 'property-view-gate',
            type: 'Buying',
            timestamp: new Date().toISOString(),
            page_url: window.location.href,
          }),
        });
      }
    } catch {
      // Silent fail — don't disrupt browsing
    }

    setSubmitted(true);
    localStorage.setItem(DISMISSED_KEY, 'true');
    setTimeout(() => setShow(false), 3000);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 animate-fade-in">
      <div className="bg-white w-full sm:w-[440px] sm:rounded-xl shadow-2xl mx-4 mb-0 sm:mb-0 animate-slide-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-gold" />
            <span className="font-playfair text-lg font-bold text-black">
              {submitted ? t('propertyGate.titleSubmitted') : t('propertyGate.title')}
            </span>
          </div>
          <button
            onClick={dismiss}
            className="p-1 text-black/40 hover:text-black transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {submitted ? (
            <div className="text-center py-4">
              <p className="text-black/70 text-sm">
                {t('propertyGate.successMessage')}
              </p>
            </div>
          ) : (
            <>
              <p className="text-black/70 text-sm mb-4">
                {t('propertyGate.description')}
              </p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('propertyGate.emailPlaceholder')}
                  className="w-full bg-white border border-gray-200 text-black px-4 py-3 focus:outline-none focus:border-gold transition-colors rounded-lg text-sm"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('propertyGate.phonePlaceholder')}
                  className="w-full bg-white border border-gray-200 text-black px-4 py-3 focus:outline-none focus:border-gold transition-colors rounded-lg text-sm"
                />
                <button
                  type="submit"
                  className="w-full bg-gold text-dark font-bold uppercase tracking-widest py-3 hover:shadow-gold-glow transition-all rounded-lg text-sm"
                >
                  {t('propertyGate.submitButton')}
                </button>
              </form>
            </>
          )}
        </div>

        {!submitted && (
          <div className="px-5 pb-4">
            <button
              onClick={dismiss}
              className="w-full text-center text-xs text-black/40 hover:text-black/60 transition-colors py-1"
            >
              {t('propertyGate.dismiss')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
