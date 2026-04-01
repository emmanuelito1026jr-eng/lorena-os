import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal, inputClass, labelClass } from '../../shared/Modal';
import { showToast } from '../../shared/Toast';
import { useCreateChecklist, useUpdateChecklist } from '../../../hooks/useAutoTracks';
import { useAuth } from '../../../hooks/useAuth';
import type { ChecklistTemplate } from '../../../lib/supabase/database.types';

interface CreateChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: ChecklistTemplate | null;
}

export function CreateChecklistModal({ isOpen, onClose, editItem }: CreateChecklistModalProps) {
  const { user } = useAuth();
  const createChecklist = useCreateChecklist();
  const updateChecklist = useUpdateChecklist();
  const isEditing = !!editItem;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<string[]>(['']);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setDescription(editItem.description || '');
      const parsed = Array.isArray(editItem.items)
        ? (editItem.items as unknown as { text: string; order: number }[]).map(i => i.text)
        : [''];
      setItems(parsed.length > 0 ? parsed : ['']);
    } else {
      reset();
    }
  }, [editItem]);

  const reset = () => { setName(''); setDescription(''); setItems(['']); };

  const handleClose = () => { reset(); onClose(); };

  const updateItem = (index: number, value: string) => {
    setItems(prev => prev.map((item, i) => i === index ? value : item));
  };

  const addItem = () => setItems(prev => [...prev, '']);
  const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));

  const validItems = items.filter(i => i.trim());
  const isPending = isEditing ? updateChecklist.isPending : createChecklist.isPending;

  const handleSubmit = () => {
    if (!name.trim() || !user || validItems.length === 0) return;
    const itemsJson = validItems.map((text, i) => ({ text: text.trim(), order: i })) as unknown as import('../../../lib/supabase/database.types').Json;
    if (isEditing) {
      updateChecklist.mutate({ id: editItem!.id, updates: { name: name.trim(), description: description.trim() || null, items: itemsJson } }, {
        onSuccess: () => { showToast('Checklist updated'); reset(); onClose(); },
        onError: () => showToast('Failed to update checklist', 'error'),
      });
    } else {
      createChecklist.mutate({
        agent_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        items: itemsJson,
      }, {
        onSuccess: () => { showToast('Checklist created'); reset(); onClose(); },
        onError: () => showToast('Failed to create checklist', 'error'),
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? 'Edit Checklist Template' : 'Create Checklist Template'}>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Template Name *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Buyer Closing Checklist" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What this checklist is for..." className={`${inputClass} min-h-[60px]`} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelClass}>Items ({validItems.length})</label>
            <button onClick={addItem} className="flex items-center gap-1 font-lato text-xs text-dashboard-gold hover:underline">
              <Plus size={14} /> Add Item
            </button>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-lato text-xs text-dashboard-secondary w-6 text-right shrink-0">{i + 1}.</span>
                <input
                  type="text"
                  value={item}
                  onChange={e => updateItem(i, e.target.value)}
                  placeholder={`Checklist item ${i + 1}...`}
                  className={inputClass}
                />
                {items.length > 1 && (
                  <button onClick={() => removeItem(i)} className="text-dashboard-secondary hover:text-red-500 transition-colors shrink-0">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={handleClose} className="px-4 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-secondary hover:text-dashboard-body transition-colors min-h-[44px]">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || validItems.length === 0 || isPending}
            className="px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] disabled:opacity-50 text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
          >
            {isPending ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Checklist' : 'Create Checklist')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
