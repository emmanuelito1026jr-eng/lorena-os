import { useState, useRef, useEffect } from 'react';
import { Plus, UserPlus, Calendar, X } from 'lucide-react';
import { AddLeadModal } from './modals/AddLeadModal';
import { AddShowingModal } from './modals/AddShowingModal';
import { useTranslation } from '../../lib/i18n/LanguageContext';

interface QuickAction {
  id: string;
  icon: typeof UserPlus;
  labelKey: string;
  color: string;
}

const actions: QuickAction[] = [
  { id: 'add-lead', icon: UserPlus, labelKey: 'fab.addLead', color: 'bg-score-hot text-white' },
  { id: 'schedule-showing', icon: Calendar, labelKey: 'fab.scheduleShowing', color: 'bg-purple-600 text-white' },
];

export function QuickActionFAB() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddShowing, setShowAddShowing] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  function handleAction(actionId: string) {
    setIsOpen(false);
    if (actionId === 'add-lead') setShowAddLead(true);
    if (actionId === 'schedule-showing') setShowAddShowing(true);
  }

  return (
    <>
      <div ref={fabRef} className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-30">
        {/* Action items — expand upward */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col items-end gap-2 mb-2">
            {actions.map((action, idx) => (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="flex items-center gap-2.5 pl-3 pr-4 py-2.5 bg-white rounded-full shadow-premium border border-dashboard-border hover:border-dashboard-gold/40 transition-all min-h-[44px] animate-fade-in-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${action.color}`}>
                  <action.icon size={15} />
                </div>
                <span className="font-lato text-sm font-medium text-dashboard-black whitespace-nowrap">
                  {t(action.labelKey)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Main FAB button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? t('fab.close') : t('fab.quickActions')}
          aria-expanded={isOpen}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-premium-lg transition-all duration-200 ${
            isOpen
              ? 'bg-dashboard-black text-white rotate-45'
              : 'bg-dashboard-gold text-white hover:bg-[#B8952F] hover:shadow-xl'
          }`}
        >
          {isOpen ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      <AddLeadModal isOpen={showAddLead} onClose={() => setShowAddLead(false)} />
      <AddShowingModal isOpen={showAddShowing} onClose={() => setShowAddShowing(false)} />
    </>
  );
}
