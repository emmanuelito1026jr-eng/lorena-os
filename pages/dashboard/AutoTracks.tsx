import { useState } from 'react';
import { Zap, Calendar as CalendarIcon, CheckSquare, Plus, Trash2, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { EmptyState } from '../../components/shared/EmptyState';
import { SkeletonList } from '../../components/shared/Skeleton';
import { CreateSequenceModal } from '../../components/dashboard/modals/CreateSequenceModal';
import { CreateCampaignModal } from '../../components/dashboard/modals/CreateCampaignModal';
import { CreateChecklistModal } from '../../components/dashboard/modals/CreateChecklistModal';
import { showToast } from '../../components/shared/Toast';
import { confirmAction } from '../../components/shared/ConfirmDialog';
import { useSequences, useCalendarCampaigns, useChecklists, useDeleteSequence, useDeleteCampaign, useDeleteChecklist, useSequenceEnrollmentCounts } from '../../hooks/useAutoTracks';
import type { DripSequence, CalendarCampaign, ChecklistTemplate } from '../../lib/supabase/database.types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';

const TABS = ['Sequences', 'Calendar', 'Checklists'] as const;
type Tab = typeof TABS[number];

const TAB_ICONS = { Sequences: Zap, Calendar: CalendarIcon, Checklists: CheckSquare };
const TAB_I18N_KEYS: Record<Tab, string> = { Sequences: 'autotracks.sequences', Calendar: 'autotracks.calendar', Checklists: 'autotracks.checklists' };

export default function AutoTracks() {
  usePageTitle('AutoTracks');
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('Sequences');
  const [showSeqModal, setShowSeqModal] = useState(false);
  const [showCampModal, setShowCampModal] = useState(false);
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [editingSequence, setEditingSequence] = useState<DripSequence | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<CalendarCampaign | null>(null);
  const [editingChecklist, setEditingChecklist] = useState<ChecklistTemplate | null>(null);
  const [expandedSeqId, setExpandedSeqId] = useState<string | null>(null);

  const deleteSequence = useDeleteSequence();
  const deleteCampaign = useDeleteCampaign();
  const deleteChecklist = useDeleteChecklist();

  const openCreateModal = () => {
    if (activeTab === 'Sequences') setShowSeqModal(true);
    else if (activeTab === 'Calendar') setShowCampModal(true);
    else setShowCheckModal(true);
  };

  const { data: sequences, isLoading: seqLoading } = useSequences();
  const { data: campaigns, isLoading: campLoading } = useCalendarCampaigns();
  const { data: checklists, isLoading: checkLoading } = useChecklists();
  const { data: enrollmentCounts } = useSequenceEnrollmentCounts();

  const isLoading = activeTab === 'Sequences' ? seqLoading : activeTab === 'Calendar' ? campLoading : checkLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">{t('autotracks.title')}</h1>
          <p className="font-lato text-sm text-dashboard-secondary mt-1">{t('autotracks.subtitle')}</p>
        </div>
        <button onClick={openCreateModal} className="px-4 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px] flex items-center gap-1.5">
          <Plus size={16} /> {t('autotracks.createNew')}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-dashboard-border">
        <div className="flex gap-0" role="tablist">
          {TABS.map((tab) => {
            const Icon = TAB_ICONS[tab];
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`tabpanel-${tab.toLowerCase()}`}
                id={`tab-${tab.toLowerCase()}`}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-lato text-sm font-medium border-b-2 transition-colors min-h-[44px] flex items-center gap-1.5 ${
                  activeTab === tab ? 'border-dashboard-gold text-dashboard-gold' : 'border-transparent text-dashboard-secondary hover:text-dashboard-body'
                }`}
              >
                <Icon size={14} /> {t(TAB_I18N_KEYS[tab])}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading && <SkeletonList count={3} />}

      {!isLoading && activeTab === 'Sequences' && (
        <div role="tabpanel" id="tabpanel-sequences" aria-labelledby="tab-sequences">
          {!sequences?.length ? (
            <EmptyState icon={Zap} title={t('autotracks.noSequences')} description={t('autotracks.noSequencesDesc')} actionLabel={t('autotracks.createSequence')} onAction={() => setShowSeqModal(true)} />
          ) : (
            <div className="space-y-3">
              {sequences.map((seq) => {
                const steps = Array.isArray(seq.steps) ? (seq.steps as Array<Record<string, unknown>>) : [];
                const isExpanded = expandedSeqId === seq.id;
                return (
                  <div key={seq.id} className="bg-white rounded-xl border border-dashboard-border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-lato text-sm font-medium text-dashboard-black">{seq.name}</p>
                        {seq.description && <p className="font-lato text-xs text-dashboard-secondary mt-0.5">{seq.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-lato font-medium ${seq.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
                          {seq.is_active ? t('autotracks.active') : t('autotracks.paused')}
                        </span>
                        <button onClick={() => setEditingSequence(seq)} aria-label={`Edit ${seq.name}`} className="text-dashboard-secondary hover:text-dashboard-gold transition-colors p-1"><Pencil size={14} /></button>
                        <button onClick={() => confirmAction(t('autotracks.confirmDeleteSeq'), () => deleteSequence.mutate(seq.id, { onSuccess: () => showToast(t('autotracks.sequenceDeleted')), onError: () => showToast(t('autotracks.deleteFailed'), 'error') }))} aria-label={`Delete ${seq.name}`} className="text-dashboard-secondary hover:text-red-500 transition-colors p-1"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {/* Enrollment stats */}
                    {(() => {
                      const stats = enrollmentCounts?.get(seq.id);
                      if (!stats || stats.total === 0) return null;
                      return (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-lato font-bold">
                            {stats.active} {t('autotracks.enrolled')}
                          </span>
                          {stats.completed > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-lato font-medium">
                              {stats.completed} {t('autotracks.completed')}
                            </span>
                          )}
                          {stats.paused > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-[10px] font-lato font-medium">
                              {stats.paused} {t('autotracks.pausedCount')}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="font-lato text-xs text-dashboard-secondary">{t('autotracks.trigger')}: {seq.trigger}</span>
                      <span className="font-lato text-xs text-dashboard-secondary">&middot; {steps.length} {t('autotracks.steps')}</span>
                      {steps.length > 0 && (
                        <button
                          onClick={() => setExpandedSeqId(isExpanded ? null : seq.id)}
                          className="flex items-center gap-0.5 font-lato text-xs text-dashboard-gold hover:underline ml-auto min-h-[44px] px-1"
                          aria-label={isExpanded ? 'Collapse step preview' : 'Expand step preview'}
                        >
                          {isExpanded ? t('autotracks.hide') : t('autotracks.preview')} {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}
                    </div>
                    {isExpanded && steps.length > 0 && (
                      <div className="mt-3 border-t border-dashboard-border pt-3 space-y-3">
                        {steps.map((step, i) => {
                          const hasEs = !!(step.template_body_es || step.template_subject_es);
                          return (
                            <div key={i} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-lato font-bold uppercase tracking-wider ${step.type === 'email' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                  {String(step.type)}
                                </span>
                                <span className="font-lato text-[10px] text-dashboard-secondary">{t('autotracks.day')} {String(step.delay_days)}</span>
                                {hasEs && <span className="px-1.5 py-0.5 rounded text-[10px] font-lato font-medium bg-dashboard-gold/10 text-dashboard-gold">{t('autotracks.enEs')}</span>}
                                {!hasEs && <span className="px-1.5 py-0.5 rounded text-[10px] font-lato font-medium bg-orange-50 text-orange-600">{t('autotracks.enOnly')}</span>}
                              </div>
                              {step.template_subject && (
                                <p className="font-lato text-xs font-medium text-dashboard-black mb-0.5">EN: {String(step.template_subject)}</p>
                              )}
                              {step.template_subject_es && (
                                <p className="font-lato text-xs font-medium text-dashboard-body mb-0.5">ES: {String(step.template_subject_es)}</p>
                              )}
                              <p className="font-lato text-xs text-dashboard-body whitespace-pre-line">{String(step.template_body || '')}</p>
                              {step.template_body_es && (
                                <p className="font-lato text-xs text-dashboard-secondary whitespace-pre-line mt-1 pt-1 border-t border-dashed border-dashboard-border">{String(step.template_body_es)}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!isLoading && activeTab === 'Calendar' && (
        <div role="tabpanel" id="tabpanel-calendar" aria-labelledby="tab-calendar">
          {!campaigns?.length ? (
            <EmptyState icon={CalendarIcon} title={t('autotracks.noCampaigns')} description={t('autotracks.noCampaignsDesc')} actionLabel={t('autotracks.createCampaign')} onAction={() => setShowCampModal(true)} />
          ) : (
            <div className="space-y-3">
              {campaigns.map((camp) => (
                <div key={camp.id} className="bg-white rounded-xl border border-dashboard-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-lato text-sm font-medium text-dashboard-black">{camp.name}</p>
                      {camp.description && <p className="font-lato text-xs text-dashboard-secondary mt-0.5">{camp.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-lato font-medium ${camp.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
                        {camp.is_active ? t('autotracks.active') : t('autotracks.inactive')}
                      </span>
                      <button onClick={() => setEditingCampaign(camp)} aria-label={`Edit ${camp.name}`} className="text-dashboard-secondary hover:text-dashboard-gold transition-colors p-1"><Pencil size={14} /></button>
                      <button onClick={() => confirmAction(t('autotracks.confirmDeleteCamp'), () => deleteCampaign.mutate(camp.id, { onSuccess: () => showToast(t('autotracks.campaignDeleted')), onError: () => showToast(t('autotracks.deleteFailed'), 'error') }))} aria-label={`Delete ${camp.name}`} className="text-dashboard-secondary hover:text-red-500 transition-colors p-1"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <p className="font-lato text-xs text-dashboard-secondary mt-1.5">
                    {t('autotracks.month')} {camp.month}{camp.day ? `, ${t('autotracks.day')} ${camp.day}` : ''} &middot; via {camp.channel}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isLoading && activeTab === 'Checklists' && (
        <div role="tabpanel" id="tabpanel-checklists" aria-labelledby="tab-checklists">
          {!checklists?.length ? (
            <EmptyState icon={CheckSquare} title={t('autotracks.noChecklists')} description={t('autotracks.noChecklistsDesc')} actionLabel={t('autotracks.createChecklist')} onAction={() => setShowCheckModal(true)} />
          ) : (
            <div className="space-y-3">
              {checklists.map((cl) => (
                <div key={cl.id} className="bg-white rounded-xl border border-dashboard-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-lato text-sm font-medium text-dashboard-black">{cl.name}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingChecklist(cl)} aria-label={`Edit ${cl.name}`} className="text-dashboard-secondary hover:text-dashboard-gold transition-colors p-1"><Pencil size={14} /></button>
                      <button onClick={() => confirmAction(t('autotracks.confirmDeleteCheck'), () => deleteChecklist.mutate(cl.id, { onSuccess: () => showToast(t('autotracks.checklistDeleted')), onError: () => showToast(t('autotracks.deleteFailed'), 'error') }))} aria-label={`Delete ${cl.name}`} className="text-dashboard-secondary hover:text-red-500 transition-colors p-1"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {cl.description && <p className="font-lato text-xs text-dashboard-secondary mt-0.5">{cl.description}</p>}
                  <p className="font-lato text-xs text-dashboard-secondary mt-1.5">
                    {Array.isArray(cl.items) ? (cl.items as unknown[]).length : 0} {t('autotracks.items')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <CreateSequenceModal isOpen={showSeqModal || !!editingSequence} onClose={() => { setShowSeqModal(false); setEditingSequence(null); }} editItem={editingSequence} />
      <CreateCampaignModal isOpen={showCampModal || !!editingCampaign} onClose={() => { setShowCampModal(false); setEditingCampaign(null); }} editItem={editingCampaign} />
      <CreateChecklistModal isOpen={showCheckModal || !!editingChecklist} onClose={() => { setShowCheckModal(false); setEditingChecklist(null); }} editItem={editingChecklist} />
    </div>
  );
}
