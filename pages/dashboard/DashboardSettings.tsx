import { useState, useEffect } from 'react';
import { User, Bell, Puzzle, FileText, Database, Trash2, Plus, Pencil } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUpdateProfile } from '../../hooks/useProfile';
import { useEmailTemplates, useDeleteEmailTemplate } from '../../hooks/useEmailTemplates';
import type { EmailTemplate } from '../../lib/supabase/database.types';
import { useLeads } from '../../hooks/useLeads';
import { CreateEmailTemplateModal } from '../../components/dashboard/modals/CreateEmailTemplateModal';
import { ImportLeadsModal } from '../../components/dashboard/modals/ImportLeadsModal';
import { showToast } from '../../components/shared/Toast';
import { EmptyState } from '../../components/shared/EmptyState';
import { inputClass } from '../../components/shared/Modal';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';

type TabId = 'Profile' | 'Notifications' | 'Integrations' | 'Templates' | 'Data';

interface NotificationPrefs {
  new_lead_alerts: boolean;
  hot_lead_alerts: boolean;
  message_notifications: boolean;
  showing_reminders: boolean;
  weekly_summary: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  new_lead_alerts: true,
  hot_lead_alerts: true,
  message_notifications: true,
  showing_reminders: true,
  weekly_summary: true,
};

export default function DashboardSettings() {
  usePageTitle('Settings');
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>('Profile');
  const { profile, user, refreshProfile } = useAuth();
  const updateProfile = useUpdateProfile();
  const { data: templates } = useEmailTemplates();
  const deleteTemplate = useDeleteEmailTemplate();
  const { data: leads } = useLeads();

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  // Sync profile data into form
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const tabs: { id: TabId; icon: typeof User; label: string }[] = [
    { id: 'Profile', icon: User, label: t('settings.profile') },
    { id: 'Notifications', icon: Bell, label: t('settings.notifications') },
    { id: 'Integrations', icon: Puzzle, label: t('settings.integrations') },
    { id: 'Templates', icon: FileText, label: t('settings.templates') },
    { id: 'Data', icon: Database, label: t('settings.data') },
  ];

  const NOTIF_ITEMS: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
    { key: 'new_lead_alerts', label: t('settings.newLeadAlerts'), desc: t('settings.newLeadAlertsDesc') },
    { key: 'hot_lead_alerts', label: t('settings.hotLeadAlerts'), desc: t('settings.hotLeadAlertsDesc') },
    { key: 'message_notifications', label: t('settings.messageNotifs'), desc: t('settings.messageNotifsDesc') },
    { key: 'showing_reminders', label: t('settings.showingReminders'), desc: t('settings.showingRemindersDesc') },
    { key: 'weekly_summary', label: t('settings.weeklySummary'), desc: t('settings.weeklySummaryDesc') },
  ];

  const handleProfileSave = () => {
    if (!user) return;
    updateProfile.mutate({ id: user.id, updates: { full_name: fullName.trim(), phone: phone.trim() || null } }, {
      onSuccess: () => { showToast(t('settings.profileUpdated')); refreshProfile(); },
      onError: () => showToast(t('settings.profileFailed'), 'error'),
    });
  };

  const handleExportCSV = () => {
    if (!leads?.length) { showToast(t('settings.noLeadsExport'), 'error'); return; }
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Source', 'Status', 'Score', 'Tags', 'Created'];
    const rows = leads.map(l => [
      l.first_name, l.last_name, l.email || '', l.phone || '', l.source || '',
      l.status, l.score, (l.tags || []).join('; '), l.created_at,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast(t('settings.csvDownloaded'));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">{t('settings.title')}</h1>
        <p className="font-lato text-sm text-dashboard-secondary mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-dashboard-border">
        <div className="flex gap-0 overflow-x-auto" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id.toLowerCase()}`}
              id={`tab-${tab.id.toLowerCase()}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-lato text-sm font-medium border-b-2 transition-colors min-h-[44px] whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id ? 'border-dashboard-gold text-dashboard-gold' : 'border-transparent text-dashboard-secondary hover:text-dashboard-body'
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'Profile' && (
        <div role="tabpanel" id="tabpanel-profile" aria-labelledby="tab-profile" className="bg-white rounded-xl border border-dashboard-border p-6 max-w-2xl">
          <h3 className="font-playfair text-lg font-bold text-dashboard-black mb-6">{t('settings.profileInfo')}</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-dashboard-gold/10 flex items-center justify-center">
                <span className="font-lato text-xl font-bold text-dashboard-gold">
                  {profile?.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                </span>
              </div>
              <div>
                <p className="font-lato text-base font-medium text-dashboard-black">{profile?.full_name || 'Unknown'}</p>
                <p className="font-lato text-sm text-dashboard-secondary">{profile?.role || 'agent'}</p>
              </div>
            </div>
            <div>
              <label htmlFor="profile-fullname" className="font-lato text-xs text-dashboard-secondary mb-1 block">{t('settings.fullName')}</label>
              <input id="profile-fullname" type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="profile-email" className="font-lato text-xs text-dashboard-secondary mb-1 block">{t('settings.email')}</label>
              <input id="profile-email" type="email" defaultValue={user?.email || ''} disabled className={`${inputClass} text-dashboard-secondary bg-dashboard-surface`} />
            </div>
            <div>
              <label htmlFor="profile-phone" className="font-lato text-xs text-dashboard-secondary mb-1 block">{t('settings.phone')}</label>
              <input id="profile-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
            </div>
            <button
              onClick={handleProfileSave}
              disabled={updateProfile.isPending}
              className="px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] disabled:opacity-50 text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px] mt-4"
            >
              {updateProfile.isPending ? t('settings.saving') : t('settings.saveChanges')}
            </button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'Notifications' && (() => {
        const savedPrefs = (profile?.preferences as Record<string, unknown>)?.notifications as Partial<NotificationPrefs> | undefined;
        const prefs: NotificationPrefs = { ...DEFAULT_PREFS, ...savedPrefs };
        const handleToggle = (key: keyof NotificationPrefs, value: boolean) => {
          if (!user) return;
          const newPrefs = { ...prefs, [key]: value };
          updateProfile.mutate({ id: user.id, updates: { preferences: { ...(profile?.preferences as object || {}), notifications: newPrefs } } }, {
            onSuccess: () => refreshProfile(),
            onError: () => showToast(t('settings.prefFailed'), 'error'),
          });
        };
        return (
          <div role="tabpanel" id="tabpanel-notifications" aria-labelledby="tab-notifications" className="bg-white rounded-xl border border-dashboard-border p-6 max-w-2xl">
            <h3 className="font-playfair text-lg font-bold text-dashboard-black mb-6">{t('settings.notifPrefs')}</h3>
            <div className="space-y-4">
              {NOTIF_ITEMS.map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-dashboard-border last:border-b-0">
                  <div>
                    <label htmlFor={`notif-${item.key}`} className="font-lato text-sm font-medium text-dashboard-black cursor-pointer">{item.label}</label>
                    <p className="font-lato text-xs text-dashboard-secondary mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input id={`notif-${item.key}`} type="checkbox" checked={prefs[item.key]} onChange={(e) => handleToggle(item.key, e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-dashboard-border rounded-full peer peer-checked:bg-dashboard-gold transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Integrations Tab */}
      {activeTab === 'Integrations' && (
        <div role="tabpanel" id="tabpanel-integrations" aria-labelledby="tab-integrations" className="bg-white rounded-xl border border-dashboard-border p-6 max-w-2xl">
          <h3 className="font-playfair text-lg font-bold text-dashboard-black mb-6">{t('settings.integrations')}</h3>
          <div className="space-y-4">
            {[
              { name: 'Twilio SMS', desc: 'Send/receive SMS messages', connected: false },
              { name: 'SendGrid Email', desc: 'Email campaigns and transactional emails', connected: false },
              { name: 'Zillow', desc: 'Import leads from Zillow', connected: false },
              { name: 'Spark MLS', desc: 'Sync listings from GEPAR MLS', connected: false },
              { name: 'Google Calendar', desc: 'Sync showings with Google Calendar', connected: false },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between py-3 border-b border-dashboard-border last:border-b-0">
                <div>
                  <p className="font-lato text-sm font-medium text-dashboard-black">{item.name}</p>
                  <p className="font-lato text-xs text-dashboard-secondary mt-0.5">{item.desc}</p>
                </div>
                <button onClick={() => showToast(t('settings.comingSoon'))} className="px-3 py-1.5 rounded-lg font-lato text-xs font-medium transition-colors min-h-[32px] border border-dashboard-border text-dashboard-secondary hover:border-dashboard-gold hover:text-dashboard-gold flex items-center gap-1.5">
                  {t('settings.connect')} <span className="px-1.5 py-0.5 bg-dashboard-surface text-dashboard-secondary text-[10px] rounded">{t('settings.soon')}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'Templates' && (
        <div role="tabpanel" id="tabpanel-templates" aria-labelledby="tab-templates" className="bg-white rounded-xl border border-dashboard-border p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-playfair text-lg font-bold text-dashboard-black">{t('settings.emailTemplates')}</h3>
              <p className="font-lato text-sm text-dashboard-secondary mt-0.5">{t('settings.emailTemplatesDesc')}</p>
            </div>
            <button onClick={() => setShowTemplateModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato text-sm rounded-lg transition-colors min-h-[44px]">
              <Plus size={14} /> {t('settings.newTemplate')}
            </button>
          </div>
          {!templates?.length ? (
            <EmptyState
              icon={FileText}
              title={t('settings.noTemplates')}
              description={t('settings.noTemplatesDesc')}
              actionLabel={t('settings.createTemplate')}
              onAction={() => setShowTemplateModal(true)}
            />
          ) : (
            <div className="space-y-3">
              {templates.map((tmpl) => (
                <div key={tmpl.id} className="border border-dashboard-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-lato text-sm font-medium text-dashboard-black">{tmpl.name}</p>
                      <p className="font-lato text-xs text-dashboard-secondary mt-0.5">{tmpl.subject}</p>
                      <div className="flex gap-2 mt-1.5">
                        <span className="px-2 py-0.5 bg-dashboard-surface rounded text-[10px] font-lato text-dashboard-secondary">{tmpl.category}</span>
                        <span className="px-2 py-0.5 bg-dashboard-surface rounded text-[10px] font-lato text-dashboard-secondary">{tmpl.language === 'es' ? 'Spanish' : 'English'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingTemplate(tmpl)} aria-label={`Edit ${tmpl.name}`} className="text-dashboard-secondary hover:text-dashboard-gold transition-colors p-1">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteTemplate.mutate(tmpl.id, {
                          onSuccess: () => showToast(t('settings.templateDeleted')),
                          onError: () => showToast(t('settings.templateDeleteFailed'), 'error'),
                        })}
                        aria-label={`Delete ${tmpl.name}`}
                        className="text-dashboard-secondary hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Data Tab */}
      {activeTab === 'Data' && (
        <div role="tabpanel" id="tabpanel-data" aria-labelledby="tab-data" className="bg-white rounded-xl border border-dashboard-border p-6 max-w-2xl">
          <h3 className="font-playfair text-lg font-bold text-dashboard-black mb-2">{t('settings.dataManagement')}</h3>
          <p className="font-lato text-sm text-dashboard-secondary mb-6">{t('settings.dataDesc')}</p>
          <div className="space-y-4">
            <button onClick={handleExportCSV} className="w-full py-3 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-body hover:border-dashboard-gold transition-colors text-left px-4">
              {t('settings.exportCSV')} ({leads?.length ?? 0} leads)
            </button>
            <button onClick={() => setShowImportModal(true)} className="w-full py-3 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-body hover:border-dashboard-gold transition-colors text-left px-4">
              {t('settings.importCSV')}
            </button>
          </div>
        </div>
      )}

      <CreateEmailTemplateModal isOpen={showTemplateModal || !!editingTemplate} onClose={() => { setShowTemplateModal(false); setEditingTemplate(null); }} editItem={editingTemplate} />
      <ImportLeadsModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />
    </div>
  );
}
