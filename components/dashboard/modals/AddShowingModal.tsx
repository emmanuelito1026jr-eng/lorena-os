import { useState, useEffect } from 'react';
import { Modal, inputClass, labelClass } from '../../shared/Modal';
import { showToast } from '../../shared/Toast';
import { useCreateShowing, useUpdateShowing } from '../../../hooks/useShowings';
import { useLeads } from '../../../hooks/useLeads';
import { useAuth } from '../../../hooks/useAuth';
import type { Tables } from '../../../lib/supabase/database.types';

interface AddShowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedLeadId?: string;
  editItem?: Tables<'showings'> | null;
}

export function AddShowingModal({ isOpen, onClose, preselectedLeadId, editItem }: AddShowingModalProps) {
  const { user } = useAuth();
  const createShowing = useCreateShowing();
  const updateShowing = useUpdateShowing();
  const { data: leads } = useLeads();
  const isEditing = !!editItem;

  const [leadId, setLeadId] = useState(preselectedLeadId || '');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editItem) {
      setLeadId(editItem.lead_id);
      setAddress(editItem.address);
      setDate(editItem.date);
      setStartTime(editItem.start_time);
      setEndTime(editItem.end_time);
      setNotes(editItem.notes || '');
    } else {
      reset();
    }
  }, [editItem]);

  const reset = () => {
    setLeadId(preselectedLeadId || ''); setAddress(''); setDate('');
    setStartTime('10:00'); setEndTime('11:00'); setNotes('');
  };

  const handleClose = () => { reset(); onClose(); };

  const isPending = isEditing ? updateShowing.isPending : createShowing.isPending;

  const handleSubmit = () => {
    if (!leadId || !address.trim() || !date || !user) return;
    if (isEditing) {
      updateShowing.mutate({ id: editItem!.id, updates: {
        lead_id: leadId,
        address: address.trim(),
        date,
        start_time: startTime,
        end_time: endTime,
        notes: notes.trim() || null,
      }}, {
        onSuccess: () => { showToast('Showing updated'); reset(); onClose(); },
        onError: () => showToast('Failed to update showing', 'error'),
      });
    } else {
      createShowing.mutate({
        agent_id: user.id,
        lead_id: leadId,
        address: address.trim(),
        date,
        start_time: startTime,
        end_time: endTime,
        notes: notes.trim() || null,
      }, {
        onSuccess: () => { showToast('Showing scheduled'); reset(); onClose(); },
        onError: () => showToast('Failed to create showing', 'error'),
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? 'Edit Showing' : 'Schedule Showing'}>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Lead *</label>
          <select value={leadId} onChange={e => setLeadId(e.target.value)} className={inputClass}>
            <option value="">Select a lead...</option>
            {leads?.map(l => <option key={l.id} value={l.id}>{l.first_name} {l.last_name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Address *</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, El Paso, TX 79901" className={inputClass} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Start Time</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>End Time</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions..." className={`${inputClass} min-h-[80px]`} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={handleClose} className="px-4 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-secondary hover:text-dashboard-body transition-colors min-h-[44px]">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!leadId || !address.trim() || !date || isPending}
            className="px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] disabled:opacity-50 text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
          >
            {isPending ? (isEditing ? 'Updating...' : 'Scheduling...') : (isEditing ? 'Update Showing' : 'Schedule Showing')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
