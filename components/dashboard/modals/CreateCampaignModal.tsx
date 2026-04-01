import { useState, useEffect } from 'react';
import { Modal, inputClass, labelClass } from '../../shared/Modal';
import { showToast } from '../../shared/Toast';
import { useCreateCampaign, useUpdateCampaign } from '../../../hooks/useAutoTracks';
import { useAuth } from '../../../hooks/useAuth';
import type { MessageChannel, CalendarCampaign } from '../../../lib/supabase/database.types';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: CalendarCampaign | null;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function CreateCampaignModal({ isOpen, onClose, editItem }: CreateCampaignModalProps) {
  const { user } = useAuth();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const isEditing = !!editItem;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState('');
  const [channel, setChannel] = useState<MessageChannel>('sms');

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setDescription(editItem.description || '');
      setMonth(editItem.month);
      setDay(editItem.day ? String(editItem.day) : '');
      setChannel(editItem.channel);
    } else {
      reset();
    }
  }, [editItem]);

  const reset = () => { setName(''); setDescription(''); setMonth(1); setDay(''); setChannel('sms'); };

  const handleClose = () => { reset(); onClose(); };

  const isPending = isEditing ? updateCampaign.isPending : createCampaign.isPending;

  const handleSubmit = () => {
    if (!name.trim() || !user) return;
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      month,
      day: day ? Number(day) : null,
      channel,
      is_active: true,
    };
    if (isEditing) {
      updateCampaign.mutate({ id: editItem!.id, updates: payload }, {
        onSuccess: () => { showToast('Campaign updated'); reset(); onClose(); },
        onError: () => showToast('Failed to update campaign', 'error'),
      });
    } else {
      createCampaign.mutate({ agent_id: user.id, ...payload }, {
        onSuccess: () => { showToast('Campaign created'); reset(); onClose(); },
        onError: () => showToast('Failed to create campaign', 'error'),
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? 'Edit Calendar Campaign' : 'Create Calendar Campaign'}>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Campaign Name *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Valentine's Day" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Campaign description..." className={`${inputClass} min-h-[60px]`} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Month *</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className={inputClass}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Day (optional)</label>
            <input type="number" min={1} max={31} value={day} onChange={e => setDay(e.target.value)} placeholder="e.g. 14" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Channel</label>
            <select value={channel} onChange={e => setChannel(e.target.value as MessageChannel)} className={inputClass}>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={handleClose} className="px-4 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-secondary hover:text-dashboard-body transition-colors min-h-[44px]">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isPending}
            className="px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] disabled:opacity-50 text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
          >
            {isPending ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Campaign' : 'Create Campaign')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
