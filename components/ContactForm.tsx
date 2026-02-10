import React, { useState } from 'react';

interface ContactFormProps {
  minimal?: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

type ContactType = 'Buying' | 'Selling' | 'Investing' | 'Information';
type SubmitStatus = 'idle' | 'success' | 'error';

const ContactForm = ({ minimal = false }: ContactFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'Buying' as ContactType,
  });

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
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (10 digits)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (phoneDigits.length !== 10) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
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

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;

      if (!webhookUrl || webhookUrl.includes('your-n8n-instance')) {
        throw new Error('Webhook URL not configured');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString(),
          source: minimal ? 'landing-page' : 'home-page',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Contact form">
      <div>
        <label htmlFor="name" className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className={`w-full bg-white border ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          } text-gray-900 px-4 py-3 focus:outline-none focus:border-gold transition-colors rounded`}
          placeholder="Maria Gonzalez"
        />
        {errors.name && (
          <p id="name-error" className="text-red-500 text-xs mt-1">
            {errors.name}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={`w-full bg-white border ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            } text-gray-900 px-4 py-3 focus:outline-none focus:border-gold transition-colors rounded`}
            placeholder="email@example.com"
          />
          {errors.email && (
            <p id="email-error" className="text-red-500 text-xs mt-1">
              {errors.email}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="phone" className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            className={`w-full bg-white border ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            } text-gray-900 px-4 py-3 focus:outline-none focus:border-gold transition-colors rounded`}
            placeholder="(915) 555-0123"
          />
          {errors.phone && (
            <p id="phone-error" className="text-red-500 text-xs mt-1">
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="type" className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
          I am interested in
        </label>
        <select
          name="type"
          id="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-3 focus:outline-none focus:border-gold transition-colors appearance-none rounded"
        >
          <option value="Buying">Buying a Home / Comprar</option>
          <option value="Selling">Selling a Home / Vender</option>
          <option value="Investing">Investing / Invertir</option>
          <option value="Information">General Information</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gold text-white font-bold uppercase tracking-widest py-4 hover:bg-gray-900 transition-colors duration-300 mt-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {isSubmitting ? 'Sending...' : minimal ? 'Get Access Now' : 'Send Message / Enviar'}
      </button>

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <div className="bg-green-900/30 border border-green-500 text-green-300 px-4 py-3 rounded">
          <p className="text-sm">
            ✓ Message sent successfully! We'll contact you soon.
          </p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded">
          <p className="text-sm">
            ✗ Failed to send message. Please try again or call us directly at (915) 487-5581.
          </p>
        </div>
      )}

      <p className="text-[10px] text-gray-600 text-center mt-2">
        By submitting this form, you agree to receive communications from Casas En El Paso TX.
      </p>
    </form>
  );
};

export default ContactForm;
