import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal, inputClass, labelClass } from '../../shared/Modal';
import { showToast } from '../../shared/Toast';
import { useCreateSequence, useUpdateSequence } from '../../../hooks/useAutoTracks';
import { useAuth } from '../../../hooks/useAuth';
import type { DripSequence } from '../../../lib/supabase/database.types';

interface Step {
  type: 'sms' | 'email';
  delay_days: number;
  template_body: string;
  template_body_es?: string;
  template_subject?: string;
  template_subject_es?: string;
}

interface CreateSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: DripSequence | null;
}

const TRIGGERS = [
  { value: 'new_lead', label: 'New Lead Created' },
  { value: 'status_change:qualifying', label: 'Status → Qualifying' },
  { value: 'status_change:showing', label: 'Status → Showing' },
  { value: 'cma_request', label: 'CMA Requested' },
  { value: 'score_below_30', label: 'Score Drops Below 30' },
  { value: 'status_change:closed', label: 'Status → Closed' },
];

export function CreateSequenceModal({ isOpen, onClose, editItem }: CreateSequenceModalProps) {
  const { user } = useAuth();
  const createSequence = useCreateSequence();
  const updateSequence = useUpdateSequence();
  const isEditing = !!editItem;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState('new_lead');
  const [steps, setSteps] = useState<Step[]>([{ type: 'sms', delay_days: 0, template_body: '' }]);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setDescription(editItem.description || '');
      setTrigger(editItem.trigger);
      const parsed = Array.isArray(editItem.steps)
        ? (editItem.steps as unknown as Step[])
        : [{ type: 'sms' as const, delay_days: 0, template_body: '' }];
      setSteps(parsed);
    } else {
      reset();
    }
  }, [editItem]);

  const reset = () => {
    setName(''); setDescription(''); setTrigger('new_lead');
    setSteps([{ type: 'sms', delay_days: 0, template_body: '' }]);
  };

  const handleClose = () => { reset(); onClose(); };

  const updateStep = (index: number, field: keyof Step, value: string | number) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addStep = () => setSteps(prev => [...prev, { type: 'sms', delay_days: prev.length > 0 ? (prev[prev.length - 1].delay_days + 3) : 0, template_body: '' }]);
  const removeStep = (index: number) => setSteps(prev => prev.filter((_, i) => i !== index));

  const isPending = isEditing ? updateSequence.isPending : createSequence.isPending;

  const handleSubmit = () => {
    if (!name.trim() || !user || steps.length === 0) return;
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      trigger,
      steps: steps as unknown as import('../../../lib/supabase/database.types').Json,
      is_active: true,
    };
    if (isEditing) {
      updateSequence.mutate({ id: editItem!.id, updates: payload }, {
        onSuccess: () => { showToast('Sequence updated'); reset(); onClose(); },
        onError: () => showToast('Failed to update sequence', 'error'),
      });
    } else {
      createSequence.mutate({ agent_id: user.id, ...payload }, {
        onSuccess: () => { showToast('Sequence created'); reset(); onClose(); },
        onError: () => showToast('Failed to create sequence', 'error'),
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? 'Edit Sequence' : 'Create Sequence'} maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Name *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. New Buyer Welcome" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What this sequence does..." className={`${inputClass} min-h-[60px]`} />
        </div>
        <div>
          <label className={labelClass}>Trigger</label>
          <select value={trigger} onChange={e => setTrigger(e.target.value)} className={inputClass}>
            {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelClass}>Steps ({steps.length})</label>
            <button onClick={addStep} className="flex items-center gap-1 font-lato text-xs text-dashboard-gold hover:underline">
              <Plus size={14} /> Add Step
            </button>
          </div>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="border border-dashboard-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-lato text-xs font-medium text-dashboard-body">Step {i + 1}</span>
                  {steps.length > 1 && (
                    <button onClick={() => removeStep(i)} className="text-dashboard-secondary hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select value={step.type} onChange={e => updateStep(i, 'type', e.target.value)} className={inputClass}>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} value={step.delay_days} onChange={e => updateStep(i, 'delay_days', Number(e.target.value))} className={inputClass} />
                    <span className="font-lato text-xs text-dashboard-secondary whitespace-nowrap">days delay</span>
                  </div>
                </div>
                {step.type === 'email' && (
                  <>
                    <input
                      type="text"
                      value={step.template_subject || ''}
                      onChange={e => updateStep(i, 'template_subject', e.target.value)}
                      placeholder="Subject line (English)"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={step.template_subject_es || ''}
                      onChange={e => updateStep(i, 'template_subject_es', e.target.value)}
                      placeholder="Asunto (Español)"
                      className={inputClass}
                    />
                  </>
                )}
                <textarea
                  value={step.template_body}
                  onChange={e => updateStep(i, 'template_body', e.target.value)}
                  placeholder="Message template (English)... Use {{first_name}} for personalization"
                  className={`${inputClass} min-h-[60px]`}
                />
                <textarea
                  value={step.template_body_es || ''}
                  onChange={e => updateStep(i, 'template_body_es', e.target.value)}
                  placeholder="Mensaje en español... Usa {{first_name}} para personalización"
                  className={`${inputClass} min-h-[60px]`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={handleClose} className="px-4 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-secondary hover:text-dashboard-body transition-colors min-h-[44px]">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || steps.length === 0 || isPending}
            className="px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] disabled:opacity-50 text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
          >
            {isPending ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Sequence' : 'Create Sequence')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
