import { useState } from 'react';
import { Modal, inputClass, errorInputClass, labelClass } from '../../shared/Modal';
import { showToast } from '../../shared/Toast';
import { useCreateLead } from '../../../hooks/useLeads';
import { useAuth } from '../../../hooks/useAuth';
import type { LeadSource, LeadStatus } from '../../../lib/supabase/database.types';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOURCE_OPTIONS: LeadSource[] = ['website', 'referral', 'zillow', 'cinc', 'social', 'open_house', 'cold_call', 'other'];
const STATUS_OPTIONS: LeadStatus[] = ['new_lead', 'attempted_contact', 'contacted', 'appointment_set', 'appointment_met', 'active_client', 'pending_client', 'past_client', 'lost'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-().+]*$/;

function validateEmail(value: string): string | undefined {
  if (value.trim() && !EMAIL_REGEX.test(value.trim())) return 'Please enter a valid email address';
}

function validatePhone(value: string): string | undefined {
  if (value.trim() && !PHONE_REGEX.test(value.trim())) return 'Phone may only contain digits, dashes, parentheses, and spaces';
}

export function AddLeadModal({ isOpen, onClose }: AddLeadModalProps) {
  const { user } = useAuth();
  const createLead = useCreateLead();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState<LeadSource>('website');
  const [status, setStatus] = useState<LeadStatus>('new_lead');
  const [language, setLanguage] = useState('en');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [areas, setAreas] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

  const reset = () => {
    setFirstName(''); setLastName(''); setEmail(''); setPhone('');
    setSource('website'); setStatus('new_lead'); setLanguage('en');
    setBudgetMin(''); setBudgetMax(''); setAreas(''); setTags(''); setNotes('');
    setErrors({});
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = () => {
    const emailError = validateEmail(email);
    const phoneError = validatePhone(phone);
    if (emailError || phoneError) {
      setErrors({ email: emailError, phone: phoneError });
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !user) return;
    createLead.mutate({
      agent_id: user.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      source,
      status,
      preferred_language: language,
      budget_min: budgetMin ? Number(budgetMin) : null,
      budget_max: budgetMax ? Number(budgetMax) : null,
      preferred_areas: areas ? areas.split(',').map(a => a.trim()).filter(Boolean) : [],
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      notes: notes.trim() || null,
      score: 0,
    }, {
      onSuccess: () => { showToast('Lead added successfully'); reset(); onClose(); },
      onError: () => showToast('Failed to add lead', 'error'),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Lead" maxWidth="max-w-xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>First Name *</label>
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Last Name *</label>
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" className={inputClass} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: validateEmail(e.target.value) })); }}
              onBlur={() => setErrors(prev => ({ ...prev, email: validateEmail(email) }))}
              placeholder="email@example.com"
              className={errors.email ? errorInputClass : inputClass}
            />
            {errors.email && <p className="font-lato text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); if (errors.phone) setErrors(prev => ({ ...prev, phone: validatePhone(e.target.value) })); }}
              onBlur={() => setErrors(prev => ({ ...prev, phone: validatePhone(phone) }))}
              placeholder="(915) 555-0000"
              className={errors.phone ? errorInputClass : inputClass}
            />
            {errors.phone && <p className="font-lato text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Source</label>
            <select value={source} onChange={e => setSource(e.target.value as LeadSource)} className={inputClass}>
              {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as LeadStatus)} className={inputClass}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} className={inputClass}>
              <option value="en">English</option>
              <option value="es">Spanish</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Budget Min ($)</label>
            <input type="number" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} placeholder="150000" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Budget Max ($)</label>
            <input type="number" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} placeholder="300000" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Preferred Areas (comma-separated)</label>
          <input type="text" value={areas} onChange={e => setAreas(e.target.value)} placeholder="Eastlake, Pebble Hills, Northeast" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Tags (comma-separated)</label>
          <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="First-Time, FHA, Military" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes..." className={`${inputClass} min-h-[80px]`} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={handleClose} className="px-4 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-secondary hover:text-dashboard-body transition-colors min-h-[44px]">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!firstName.trim() || !lastName.trim() || createLead.isPending}
            className="px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] disabled:opacity-50 text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
          >
            {createLead.isPending ? 'Adding...' : 'Add Lead'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
