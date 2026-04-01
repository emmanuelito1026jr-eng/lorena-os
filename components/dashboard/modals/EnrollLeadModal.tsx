import { useState } from 'react';
import { Modal, inputClass, labelClass } from '../../shared/Modal';
import { showToast } from '../../shared/Toast';
import { useSequences, useEnrollLead } from '../../../hooks/useAutoTracks';

interface EnrollLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
}

export function EnrollLeadModal({ isOpen, onClose, leadId, leadName }: EnrollLeadModalProps) {
  const { data: sequences } = useSequences();
  const enrollLead = useEnrollLead();

  const [selectedId, setSelectedId] = useState('');

  const handleClose = () => { setSelectedId(''); onClose(); };

  const activeSequences = sequences?.filter(s => s.is_active) || [];

  const handleSubmit = () => {
    if (!selectedId || !leadId) return;
    enrollLead.mutate({ lead_id: leadId, sequence_id: selectedId }, {
      onSuccess: () => { showToast(`${leadName} enrolled in sequence`); setSelectedId(''); onClose(); },
      onError: () => showToast('Failed to enroll lead', 'error'),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Enroll in Sequence">
      <div className="space-y-4">
        <p className="font-lato text-sm text-dashboard-body">
          Enroll <span className="font-medium">{leadName}</span> in an automated drip sequence.
        </p>
        <div>
          <label className={labelClass}>Select Sequence *</label>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className={inputClass}>
            <option value="">Choose a sequence...</option>
            {activeSequences.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {activeSequences.length === 0 && (
            <p className="font-lato text-xs text-dashboard-secondary mt-1">No active sequences found. Create one in AutoTracks first.</p>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={handleClose} className="px-4 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-secondary hover:text-dashboard-body transition-colors min-h-[44px]">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!selectedId || enrollLead.isPending}
            className="px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] disabled:opacity-50 text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
          >
            {enrollLead.isPending ? 'Enrolling...' : 'Enroll Lead'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
