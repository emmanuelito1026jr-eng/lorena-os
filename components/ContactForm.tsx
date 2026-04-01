import React, { useState } from 'react';
import { useTranslation } from '../lib/i18n';

interface PropertyContext {
  address: string;
  mlsNumber: string;
  price: number;
}

interface ContactFormProps {
  minimal?: boolean;
  propertyContext?: PropertyContext;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

type ContactType = 'Buying' | 'Selling' | 'Investing' | 'Information';
type SubmitStatus = 'idle' | 'success' | 'error';

const ContactForm = ({ minimal = false, propertyContext }: ContactFormProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'Buying' as ContactType,
  });

  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);

    if (!match) return value;

    const [, area, prefix, line] = match;
    if (line) return `(${area}) ${prefix}-${line}`;
    if (prefix) return `(${area}) ${prefix}`;
    if (area) return `(${area}`;
    return cleaned;
  };

  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = t('form.nameRequired');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('form.nameMinLength');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = t('form.emailRequired');
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t('form.emailInvalid');
    }

    // Phone validation (10 digits)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = t('form.phoneRequired');
    } else if (phoneDigits.length !== 10) {
      newErrors.phone = t('form.phoneInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }

    // Format phone number
    if (name === 'phone') {
      setFormData({ ...formData, [name]: formatPhoneNumber(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Reset submit status when user makes changes
    if (submitStatus !== 'idle') {
      setSubmitStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Honeypot check — bots fill hidden fields
    if (honeypot) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;

      // Capture UTM params from URL
      const urlParams = new URLSearchParams(window.location.search);
      const utmData = {
        utm_source: urlParams.get('utm_source') || '',
        utm_medium: urlParams.get('utm_medium') || '',
        utm_campaign: urlParams.get('utm_campaign') || '',
        utm_content: urlParams.get('utm_content') || '',
        utm_term: urlParams.get('utm_term') || '',
      };

      const payload = {
        ...formData,
        timestamp: new Date().toISOString(),
        source: propertyContext ? 'property-detail' : minimal ? 'landing-page' : 'home-page',
        page_url: window.location.href,
        referrer: document.referrer || '',
        ...utmData,
        ...(propertyContext && {
          property_address: propertyContext.address,
          property_mls: propertyContext.mlsNumber,
          property_price: propertyContext.price,
        }),
      };

      if (webhookUrl && !webhookUrl.includes('your-n8n-instance')) {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        // Webhook not configured — save lead directly to Supabase
        const { supabase } = await import('../lib/supabase/client');
        const nameParts = formData.name.trim().split(/\s+/);
        const { error: agentError, data: agent } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'agent')
          .limit(1)
          .single();

        await supabase.from('leads').insert({
          first_name: nameParts[0] || 'Contact',
          last_name: nameParts.slice(1).join(' ') || 'Form',
          email: formData.email || null,
          phone: formData.phone || null,
          source: 'website' as const,
          tags: ['contact-form'],
          preferred_language: 'en',
          notes: `Interest: ${formData.type}. Page: ${payload.page_url}`,
          agent_id: (!agentError && agent) ? agent.id : undefined,
        });
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', type: 'Buying' });
      setErrors({});
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Contact form">
      {/* Honeypot — hidden from real users, bots fill it */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="name" className="block text-xs uppercase tracking-widest text-black/60 mb-2 font-semibold">
          {t('form.fullName')}
        </label>
        <input
          type="text"
          id="name"
          name="name"
          autoComplete="name"
          value={formData.name}
          onChange={handleChange}
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className={`w-full bg-white border-2 ${
            errors.name ? 'border-gold' : 'border-gray-200'
          } text-black px-4 py-4 focus:outline-none focus:outline-2 focus:outline-gold focus:border-gold transition-premium`}
          placeholder={t('form.namePlaceholder')}
        />
        {errors.name && (
          <p id="name-error" className="text-gold text-xs mt-1">
            {errors.name}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="email" className="block text-xs uppercase tracking-widest text-black/60 mb-2 font-semibold">
            {t('form.email')}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={`w-full bg-white border-2 ${
              errors.email ? 'border-gold' : 'border-gray-200'
            } text-black px-4 py-4 focus:outline-none focus:outline-2 focus:outline-gold focus:border-gold transition-premium`}
            placeholder={t('form.emailPlaceholder')}
          />
          {errors.email && (
            <p id="email-error" className="text-gold text-xs mt-1">
              {errors.email}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="phone" className="block text-xs uppercase tracking-widest text-black/60 mb-2 font-semibold">
            {t('form.phone')}
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            autoComplete="tel"
            value={formData.phone}
            onChange={handleChange}
            aria-required="true"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            className={`w-full bg-white border-2 ${
              errors.phone ? 'border-gold' : 'border-gray-200'
            } text-black px-4 py-4 focus:outline-none focus:outline-2 focus:outline-gold focus:border-gold transition-premium`}
            placeholder={t('form.phonePlaceholder')}
          />
          {errors.phone && (
            <p id="phone-error" className="text-gold text-xs mt-1">
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="type" className="block text-xs uppercase tracking-widest text-black/60 mb-2 font-semibold">
          {t('form.interestedIn')}
        </label>
        <select
          name="type"
          id="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full bg-white border-2 border-gray-200 text-black px-4 py-4 focus:outline-none focus:outline-2 focus:outline-gold focus:border-gold transition-premium appearance-none"
        >
          <option value="Buying">{t('form.buyingOption')}</option>
          <option value="Selling">{t('form.sellingOption')}</option>
          <option value="Investing">{t('form.investingOption')}</option>
          <option value="Information">{t('form.informationOption')}</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gold text-white font-bold uppercase tracking-widest py-4 hover:shadow-gold-glow transition-premium mt-6 disabled:opacity-50 disabled:cursor-not-allowed shadow-premium"
      >
        {isSubmitting ? t('form.sending') : minimal ? t('form.getAccess') : t('form.sendMessage')}
      </button>

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <div className="bg-gold/10 border-2 border-gold text-black px-4 py-3">
          <p className="text-sm font-medium">
            ✓ {t('form.success')}
          </p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="bg-gold/10 border-2 border-gold text-black px-4 py-3">
          <p className="text-sm font-medium">
            ✗ {t('form.error')}
          </p>
        </div>
      )}

      <p className="text-[10px] text-black/50 text-center mt-2 font-light">
        {t('form.disclaimer')}
      </p>
    </form>
  );
};

export default ContactForm;
