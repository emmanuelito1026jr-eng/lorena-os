import { useState } from 'react';
import { Modal, inputClass, labelClass } from '../../shared/Modal';
import { showToast } from '../../shared/Toast';
import { useChecklists, useAssignChecklist } from '../../../hooks/useAutoTracks';

interface AssignChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
}

export function AssignChecklistModal({ isOpen, onClose, leadId, leadName }: AssignChecklistModalProps) {
  const { data: checklists } = useChecklists();
  const assignChecklist = useAssignChecklist();

  const [selectedId, setSelectedId] = useState('');

  const handleClose = () => { setSelectedId(''); onClose(); };

  const allChecklists = checklists ?? [];

  const handleSubmit = () => {
    if (!selectedId || !leadId) return;
    const selectedTemplate = allChecklists.find(c => c.id === selectedId);
    assignChecklist.mutate({ templateId: selectedId, leadId, items: selectedTemplate?.items ?? [] }, {
      onSuccess: () => { showToast(`Checklist assigned to ${leadName}`); setSelectedId(''); onClose(); },
      onError: () => showToast('Failed to assign checklist', 'error'),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Assign Checklist">
      <div className="space-y-4">
        <p className="font-lato text-sm text-dashboard-body">
          Assign a checklist template to <span className="font-medium">{leadName}</span>.
        </p>
        <div>
          <label className={labelClass}>Select Checklist *</label>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className={inputClass}>
            <option value="">Choose a checklist...</option>
            {allChecklists.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {allChecklists.length === 0 && (
            <p className="font-lato text-xs text-dashboard-secondary mt-1">No active checklists found. Create one in AutoTracks first.</p>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={handleClose} className="px-4 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-secondary hover:text-dashboard-body transition-colors min-h-[44px]">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!selectedId || assignChecklist.isPending}
            className="px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] disabled:opacity-50 text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
          >
            {assignChecklist.isPending ? 'Assigning...' : 'Assign Checklist'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
