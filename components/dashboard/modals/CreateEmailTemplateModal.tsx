import { useState, useEffect } from 'react';
import { Modal, inputClass, labelClass } from '../../shared/Modal';
import { showToast } from '../../shared/Toast';
import { useCreateEmailTemplate, useUpdateEmailTemplate } from '../../../hooks/useEmailTemplates';
import { useAuth } from '../../../hooks/useAuth';
import type { EmailTemplate } from '../../../lib/supabase/database.types';

interface CreateEmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: EmailTemplate | null;
}

const CATEGORIES = ['welcome', 'follow_up', 'market_update', 'listing', 'closing', 'holiday', 'other'];

export function CreateEmailTemplateModal({ isOpen, onClose, editItem }: CreateEmailTemplateModalProps) {
  const { user } = useAuth();
  const createTemplate = useCreateEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();
  const isEditing = !!editItem;

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [subjectEs, setSubjectEs] = useState('');
  const [body, setBody] = useState('');
  const [bodyEs, setBodyEs] = useState('');
  const [category, setCategory] = useState('follow_up');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setSubject(editItem.subject);
      setSubjectEs((editItem as Record<string, unknown>).subject_es as string || '');
      setBody(editItem.body_html || '');
      setBodyEs((editItem as Record<string, unknown>).body_html_es as string || '');
      setCategory(editItem.category);
      setLanguage(editItem.language);
    } else {
      reset();
    }
  }, [editItem]);

  const reset = () => { setName(''); setSubject(''); setSubjectEs(''); setBody(''); setBodyEs(''); setCategory('follow_up'); setLanguage('en'); };

  const handleClose = () => { reset(); onClose(); };

  const isPending = isEditing ? updateTemplate.isPending : createTemplate.isPending;

  const handleSubmit = () => {
    if (!name.trim() || !subject.trim() || !body.trim() || !user) return;
    if (isEditing) {
      updateTemplate.mutate({ id: editItem!.id, updates: {
        name: name.trim(),
        subject: subject.trim(),
        body_html: body.trim(),
        category,
        language,
      }}, {
        onSuccess: () => { showToast('Template updated'); reset(); onClose(); },
        onError: () => showToast('Failed to update template', 'error'),
      });
    } else {
      createTemplate.mutate({
        agent_id: user.id,
        name: name.trim(),
        subject: subject.trim(),
        body_html: body.trim(),
        category,
        language,
      }, {
        onSuccess: () => { showToast('Email template created'); reset(); onClose(); },
        onError: () => showToast('Failed to create template', 'error'),
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? 'Edit Email Template' : 'Create Email Template'} maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Template Name *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Market Update Monthly" className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
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
        <div>
          <label className={labelClass}>Subject Line (English) *</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Your El Paso Market Update for {{month}}" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Asunto (Español)</label>
          <input type="text" value={subjectEs} onChange={e => setSubjectEs(e.target.value)} placeholder="ej. Tu actualización del mercado de El Paso para {{month}}" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Body (English) *</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Hi {{first_name}},&#10;&#10;Write your email template here..."
            className={`${inputClass} min-h-[160px]`}
          />
        </div>
        <div>
          <label className={labelClass}>Cuerpo (Español)</label>
          <textarea
            value={bodyEs}
            onChange={e => setBodyEs(e.target.value)}
            placeholder="Hola {{first_name}},&#10;&#10;Escribe tu plantilla de email aquí..."
            className={`${inputClass} min-h-[160px]`}
          />
          <p className="font-lato text-xs text-dashboard-secondary mt-1">
            Use {'{{first_name}}'}, {'{{last_name}}'}, {'{{agent_name}}'} for personalization in both languages.
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={handleClose} className="px-4 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-secondary hover:text-dashboard-body transition-colors min-h-[44px]">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !subject.trim() || !body.trim() || isPending}
            className="px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] disabled:opacity-50 text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
          >
            {isPending ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Template' : 'Create Template')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
