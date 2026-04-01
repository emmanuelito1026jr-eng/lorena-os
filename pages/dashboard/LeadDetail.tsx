import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MessageSquare, Calendar, MapPin, Clock, Tag, DollarSign, Globe, Activity, Zap, CheckSquare, X, BarChart3 } from 'lucide-react';
import { EmptyState } from '../../components/shared/EmptyState';
import { SkeletonCard } from '../../components/shared/Skeleton';
import { LeadScoreBadge } from '../../components/shared/LeadScoreBadge';
import { EnrollLeadModal } from '../../components/dashboard/modals/EnrollLeadModal';
import { AssignChecklistModal } from '../../components/dashboard/modals/AssignChecklistModal';
import { AddShowingModal } from '../../components/dashboard/modals/AddShowingModal';
import { showToast } from '../../components/shared/Toast';
import { useLead, useLeadActivity, useUpdateLead } from '../../hooks/useLeads';
import type { LeadStatus, EnrollmentWithSequence, ChecklistInstanceWithTemplate } from '../../lib/supabase/database.types';
import { useMessages } from '../../hooks/useMessages';
import { useLeadShowings } from '../../hooks/useShowings';
import { useEnrollments, useChecklists } from '../../hooks/useAutoTracks';
import { format, differenceInDays } from 'date-fns';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';
import { SCORING_TABLE, ACTION_CATEGORIES } from '../../lib/scoring/constants';
import type { ActionType, ScoreCategory } from '../../lib/scoring/constants';
import { getNextBestAction } from '../../lib/scoring/nextAction';

const ACTION_LABELS: Record<string, string> = {
  login: 'Login',
  property_view: 'Property View',
  property_favorite: 'Property Favorite',
  search_save: 'Saved Search',
  session_5_plus: 'Extended Session (5+ min)',
  return_visit: 'Return Visit',
  email_open: 'Email Open',
  email_click: 'Email Click',
  showing_request: 'Showing Request',
  message_sent: 'Message Sent',
  home_valuation: 'Home Valuation Request',
  ai_sms_reply: 'AI SMS Reply',
  chatbot_complete: 'Chat Completed',
  chatbot_handoff: 'Chat Handoff',
  ai_sms_handoff: 'AI SMS Handoff',
  showing_attended: 'Showing Attended',
  inactive_7d: 'Inactive 7 Days',
  inactive_14d: 'Inactive 14 Days',
  inactive_30d: 'Inactive 30 Days',
  showing_missed: 'Showing Missed',
  email_bounce: 'Email Bounce',
  sms_opt_out: 'SMS Opt-Out',
};

const CATEGORY_COLORS: Record<ScoreCategory, string> = {
  Engagement: 'text-blue-600 bg-blue-50',
  Interest: 'text-purple-600 bg-purple-50',
  Intent: 'text-green-600 bg-green-50',
  Decay: 'text-amber-600 bg-amber-50',
  Risk: 'text-red-600 bg-red-50',
};

const tabs = ['Overview', 'Activity', 'Messages', 'Showings', 'Sequences', 'Checklists'];
const STATUS_OPTIONS: LeadStatus[] = ['new_lead', 'attempted_contact', 'contacted', 'appointment_set', 'appointment_met', 'active_client', 'pending_client', 'past_client', 'lost'];

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('Overview');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showShowingModal, setShowShowingModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const updateLead = useUpdateLead();

  const { data: lead, isLoading, error } = useLead(id ?? '');
  usePageTitle(lead ? `${lead.first_name} ${lead.last_name}` : 'Lead Detail');
  const { data: activities } = useLeadActivity(id ?? '');
  const { data: messages } = useMessages(id ?? '');
  const { data: showings } = useLeadShowings(id ?? '');
  const { data: enrollments } = useEnrollments(id ?? '');
  const { data: checklists } = useChecklists(id ?? '');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-24 bg-dashboard-border rounded animate-pulse" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="space-y-6">
        <Link to="/dashboard/leads" className="inline-flex items-center gap-1.5 font-lato text-sm text-dashboard-secondary hover:text-dashboard-body transition-colors">
          <ArrowLeft size={16} /> Back to Leads
        </Link>
        <div className="bg-red-50 text-red-600 rounded-lg p-4 font-lato text-sm">Lead not found or failed to load.</div>
      </div>
    );
  }

  const { t } = useTranslation();
  const navigate = useNavigate();

  // Compute Next Best Action
  const nextAction = useMemo(() => {
    if (!lead) return null;
    const lastActivityDaysAgo = lead.last_activity
      ? differenceInDays(new Date(), new Date(lead.last_activity))
      : 999;
    return getNextBestAction(lead, {
      showingCount: showings?.length ?? 0,
      enrollmentCount: enrollments?.length ?? 0,
      messageCount: messages?.length ?? 0,
      lastActivityDaysAgo,
    });
  }, [lead, showings, enrollments, messages]);

  const nbaIcons: Record<string, typeof Phone> = {
    phone: Phone,
    message: MessageSquare,
    calendar: Calendar,
    zap: Zap,
    clock: Clock,
  };

  const nbaUrgencyStyles: Record<string, string> = {
    urgent: 'border-score-hot/40 bg-red-50/50',
    high: 'border-dashboard-gold/40 bg-amber-50/50',
    normal: 'border-dashboard-teal/40 bg-teal-50/30',
  };

  const budgetStr = lead.budget_min && lead.budget_max
    ? `$${(lead.budget_min / 1000).toFixed(0)}K - $${(lead.budget_max / 1000).toFixed(0)}K`
    : lead.budget_min ? `$${(lead.budget_min / 1000).toFixed(0)}K+` : null;

  return (
    <div className="space-y-6">
      <Link to="/dashboard/leads" className="inline-flex items-center gap-1.5 font-lato text-sm text-dashboard-secondary hover:text-dashboard-body transition-colors">
        <ArrowLeft size={16} /> Back to Leads
      </Link>

      {/* Lead Header */}
      <div className="bg-white rounded-xl border border-dashboard-border p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-dashboard-gold/10 flex items-center justify-center shrink-0">
            <span className="font-lato text-lg font-bold text-dashboard-gold">{lead.first_name[0]}{lead.last_name[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-playfair text-xl font-bold text-dashboard-black">{lead.first_name} {lead.last_name}</h1>
              <LeadScoreBadge score={lead.score} size="md" showLabel />
              {lead.preferred_language === 'es' && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-lato font-medium">Spanish</span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 flex-wrap">
              <select
                value={lead.status}
                onChange={(e) => updateLead.mutate({ id: lead.id, updates: { status: e.target.value as LeadStatus } }, { onSuccess: () => showToast('Status updated'), onError: () => showToast('Failed to update', 'error') })}
                className="font-lato text-sm text-dashboard-secondary capitalize bg-transparent border-none cursor-pointer hover:text-dashboard-gold focus:outline-none focus:ring-1 focus:ring-dashboard-gold/20 rounded px-1 py-0.5 -ml-1"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
              <span className="font-lato text-sm text-dashboard-secondary">{lead.source}</span>
              {lead.timeline && <span className="font-lato text-sm text-dashboard-secondary">{lead.timeline}</span>}
            </div>
          </div>
          <div className="flex gap-2 sm:shrink-0">
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 px-3 py-2 bg-dashboard-gold hover:bg-[#B8952F] text-white rounded-lg font-lato text-sm transition-colors min-h-[44px]">
                <Phone size={14} /> Call
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 px-3 py-2 border border-dashboard-border hover:border-dashboard-gold text-dashboard-body rounded-lg font-lato text-sm transition-colors min-h-[44px]">
                <Mail size={14} /> Email
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Next Best Action Card */}
      {nextAction && (
        <div className={`rounded-xl border-2 p-4 flex items-center gap-4 ${nbaUrgencyStyles[nextAction.urgency]}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            nextAction.urgency === 'urgent' ? 'bg-score-hot/10 text-score-hot' :
            nextAction.urgency === 'high' ? 'bg-dashboard-gold/10 text-dashboard-gold' :
            'bg-dashboard-teal/10 text-dashboard-teal'
          }`}>
            {(() => { const Icon = nbaIcons[nextAction.icon]; return <Icon size={20} />; })()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-lato text-sm font-bold text-dashboard-black">
              {t(nextAction.action)}
            </p>
            <p className="font-lato text-xs text-dashboard-secondary mt-0.5">
              {t(nextAction.reason)}
            </p>
          </div>
          {nextAction.icon === 'phone' && lead.phone ? (
            <a
              href={`tel:${lead.phone}`}
              className="px-4 py-2 bg-dashboard-gold text-white rounded-lg font-lato text-xs font-medium hover:bg-[#B8952F] transition-colors min-h-[36px] flex items-center gap-1.5 shrink-0"
            >
              <Phone size={13} /> {t('dash.action.call')}
            </a>
          ) : nextAction.icon === 'calendar' ? (
            <button
              onClick={() => setShowShowingModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-lato text-xs font-medium hover:bg-purple-700 transition-colors min-h-[36px] flex items-center gap-1.5 shrink-0"
            >
              <Calendar size={13} /> {t('dash.action.confirm')}
            </button>
          ) : nextAction.icon === 'zap' ? (
            <button
              onClick={() => setShowEnrollModal(true)}
              className="px-4 py-2 bg-dashboard-teal text-white rounded-lg font-lato text-xs font-medium hover:bg-teal-700 transition-colors min-h-[36px] flex items-center gap-1.5 shrink-0"
            >
              <Zap size={13} /> Enroll
            </button>
          ) : (
            <button
              onClick={() => navigate(`/dashboard/messages?lead=${lead.id}`)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-lato text-xs font-medium hover:bg-emerald-700 transition-colors min-h-[36px] flex items-center gap-1.5 shrink-0"
            >
              <MessageSquare size={13} /> {t('dash.action.text')}
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-dashboard-border overflow-x-auto">
        <div className="flex gap-0 min-w-max" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`tabpanel-${tab.toLowerCase()}`}
              id={`tab-${tab.toLowerCase()}`}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-lato text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
                activeTab === tab ? 'border-dashboard-gold text-dashboard-gold' : 'border-transparent text-dashboard-secondary hover:text-dashboard-body'
              }`}
            >
              {tab}
              {tab === 'Messages' && messages?.length ? <span className="ml-1 text-xs opacity-60">({messages.length})</span> : null}
              {tab === 'Showings' && showings?.length ? <span className="ml-1 text-xs opacity-60">({showings.length})</span> : null}
              {tab === 'Activity' && activities?.length ? <span className="ml-1 text-xs opacity-60">({activities.length})</span> : null}
              {tab === 'Sequences' && enrollments?.length ? <span className="ml-1 text-xs opacity-60">({enrollments.length})</span> : null}
              {tab === 'Checklists' && checklists?.length ? <span className="ml-1 text-xs opacity-60">({checklists.length})</span> : null}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-dashboard-border p-5 space-y-4">
            <h3 className="font-playfair text-base font-bold text-dashboard-black">Contact Information</h3>
            {lead.phone && (
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-dashboard-secondary shrink-0" />
                <span className="font-lato text-sm text-dashboard-body">{lead.phone}</span>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-dashboard-secondary shrink-0" />
                <span className="font-lato text-sm text-dashboard-body">{lead.email}</span>
              </div>
            )}
            {lead.preferred_language && (
              <div className="flex items-center gap-3">
                <Globe size={16} className="text-dashboard-secondary shrink-0" />
                <span className="font-lato text-sm text-dashboard-body">{lead.preferred_language === 'es' ? 'Spanish' : 'English'}</span>
              </div>
            )}
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-xl border border-dashboard-border p-5 space-y-4">
            <h3 className="font-playfair text-base font-bold text-dashboard-black">Preferences</h3>
            {budgetStr && (
              <div className="flex items-center gap-3">
                <DollarSign size={16} className="text-dashboard-secondary shrink-0" />
                <span className="font-lato text-sm text-dashboard-body">{budgetStr}</span>
              </div>
            )}
            {lead.property_type && (
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-dashboard-secondary shrink-0" />
                <span className="font-lato text-sm text-dashboard-body capitalize">{lead.property_type.replace('_', ' ')}</span>
              </div>
            )}
            {lead.preferred_areas?.length > 0 && (
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-dashboard-secondary shrink-0" />
                <span className="font-lato text-sm text-dashboard-body">{lead.preferred_areas.join(', ')}</span>
              </div>
            )}
            {lead.timeline && (
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-dashboard-secondary shrink-0" />
                <span className="font-lato text-sm text-dashboard-body">{lead.timeline}</span>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Tag size={16} className="text-dashboard-secondary shrink-0 mt-1" />
              <div>
                <div className="flex flex-wrap gap-1">
                  {(lead.tags || []).map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-dashboard-surface rounded text-xs font-lato text-dashboard-secondary inline-flex items-center gap-1">
                      {tag}
                      <button onClick={() => { const newTags = (lead.tags || []).filter(t => t !== tag); updateLead.mutate({ id: lead.id, updates: { tags: newTags } }, { onSuccess: () => showToast('Tag removed') }); }} aria-label={`Remove tag ${tag}`} className="hover:text-red-500 transition-colors"><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newTag.trim()) { const tags = [...(lead.tags || []), newTag.trim()]; updateLead.mutate({ id: lead.id, updates: { tags } }, { onSuccess: () => { showToast('Tag added'); setNewTag(''); } }); } }}
                  placeholder="Add tag..."
                  className="mt-1.5 px-2 py-1 border border-transparent hover:border-dashboard-border focus:border-dashboard-gold/50 rounded text-xs font-lato text-dashboard-body placeholder:text-dashboard-secondary focus:outline-none focus:ring-1 focus:ring-dashboard-gold/20 w-28"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-dashboard-border p-5 lg:col-span-2">
            <h3 className="font-playfair text-base font-bold text-dashboard-black mb-2">Notes</h3>
            {editingNotes ? (
              <textarea
                autoFocus
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                onBlur={() => { updateLead.mutate({ id: lead.id, updates: { notes: notesValue.trim() || null } }, { onSuccess: () => showToast('Notes saved') }); setEditingNotes(false); }}
                className="w-full px-3 py-2 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-body focus:outline-none focus:border-dashboard-gold/50 focus:ring-1 focus:ring-dashboard-gold/20 min-h-[100px]"
              />
            ) : (
              <p
                onClick={() => { setNotesValue(lead.notes || ''); setEditingNotes(true); }}
                className="font-lato text-sm text-dashboard-body whitespace-pre-wrap cursor-pointer hover:bg-dashboard-surface/50 rounded p-1 -m-1 min-h-[40px]"
              >
                {lead.notes || <span className="text-dashboard-secondary italic">Click to add notes...</span>}
              </p>
            )}
          </div>

          {/* Score Breakdown */}
          <div className="bg-white rounded-xl border border-dashboard-border p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-dashboard-gold" />
              <h3 className="font-playfair text-base font-bold text-dashboard-black">Score Breakdown</h3>
              <LeadScoreBadge score={lead.score} size="sm" />
            </div>
            {!activities?.length ? (
              <p className="font-lato text-sm text-dashboard-secondary">No scored activity yet. Actions that contribute to the lead score will appear here.</p>
            ) : (() => {
              // Count occurrences and total points per action type from lead_activity
              const actionCounts = new Map<string, { count: number; totalPoints: number }>();
              for (const act of activities) {
                const existing = actionCounts.get(act.action);
                if (existing) {
                  existing.count += 1;
                  existing.totalPoints += act.points;
                } else {
                  actionCounts.set(act.action, { count: 1, totalPoints: act.points });
                }
              }

              // Group by category
              const categoryGroups = new Map<ScoreCategory, { action: string; label: string; pointValue: number; count: number; totalPoints: number }[]>();
              for (const [action, data] of actionCounts.entries()) {
                const category = ACTION_CATEGORIES[action as ActionType] ?? 'Engagement';
                const pointValue = SCORING_TABLE[action as ActionType] ?? 0;
                if (!categoryGroups.has(category)) categoryGroups.set(category, []);
                categoryGroups.get(category)!.push({
                  action,
                  label: ACTION_LABELS[action] ?? action.replace(/_/g, ' '),
                  pointValue,
                  count: data.count,
                  totalPoints: data.totalPoints,
                });
              }

              const categoryOrder: ScoreCategory[] = ['Intent', 'Interest', 'Engagement', 'Decay', 'Risk'];

              return (
                <div className="space-y-4">
                  {categoryOrder.map((category) => {
                    const items = categoryGroups.get(category);
                    if (!items?.length) return null;
                    const categoryTotal = items.reduce((sum, item) => sum + item.totalPoints, 0);
                    return (
                      <div key={category}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-lato font-medium ${CATEGORY_COLORS[category]}`}>
                            {category}
                          </span>
                          <span className={`font-lato text-xs font-bold ${categoryTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {categoryTotal >= 0 ? '+' : ''}{categoryTotal} pts
                          </span>
                        </div>
                        <div className="space-y-1">
                          {items
                            .sort((a, b) => Math.abs(b.totalPoints) - Math.abs(a.totalPoints))
                            .map((item) => (
                              <div key={item.action} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-dashboard-surface/50">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="font-lato text-sm text-dashboard-body capitalize truncate">{item.label}</span>
                                  <span className="font-lato text-xs text-dashboard-secondary shrink-0">
                                    {item.pointValue >= 0 ? '+' : ''}{item.pointValue} pts each
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="font-lato text-xs text-dashboard-secondary">&times;{item.count}</span>
                                  <span className={`font-lato text-sm font-bold min-w-[50px] text-right ${item.totalPoints >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {item.totalPoints >= 0 ? '+' : ''}{item.totalPoints}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                  {/* Grand Total */}
                  <div className="border-t border-dashboard-border pt-3 flex items-center justify-between">
                    <span className="font-lato text-sm font-medium text-dashboard-black">Total from {activities.length} activities</span>
                    <span className="font-playfair text-lg font-bold text-dashboard-gold">
                      {activities.reduce((sum, act) => sum + act.points, 0)} pts
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === 'Activity' && (
        <div role="tabpanel" id="tabpanel-activity" aria-labelledby="tab-activity" className="bg-white rounded-xl border border-dashboard-border">
          {!activities?.length ? (
            <div className="p-8">
              <EmptyState icon={Activity} title="No Activity" description="Lead activity and score events will appear here." />
            </div>
          ) : (
            <div className="divide-y divide-dashboard-border">
              {activities.map((act) => (
                <div key={act.id} className="p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-dashboard-surface flex items-center justify-center shrink-0 mt-0.5">
                    <Activity size={14} className="text-dashboard-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-lato text-sm text-dashboard-body capitalize">{act.action.replace(/_/g, ' ')}</p>
                    <p className="font-lato text-xs text-dashboard-secondary mt-0.5">{format(new Date(act.created_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                  <span className={`font-lato text-sm font-medium ${act.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {act.points >= 0 ? '+' : ''}{act.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Messages' && (
        <div role="tabpanel" id="tabpanel-messages" aria-labelledby="tab-messages" className="bg-white rounded-xl border border-dashboard-border">
          {!messages?.length ? (
            <div className="p-8">
              <EmptyState icon={MessageSquare} title="No Messages" description="Conversations with this lead will appear here." />
            </div>
          ) : (
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-lg p-3 ${
                    msg.direction === 'outbound' ? 'bg-dashboard-gold text-white' : 'bg-dashboard-surface text-dashboard-body'
                  }`}>
                    <p className="font-lato text-sm">{msg.content}</p>
                    <p className={`font-lato text-[10px] mt-1 ${msg.direction === 'outbound' ? 'text-white/70' : 'text-dashboard-secondary'}`}>
                      {format(new Date(msg.created_at), 'MMM d, h:mm a')} &middot; {msg.channel}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Showings' && (
        <div role="tabpanel" id="tabpanel-showings" aria-labelledby="tab-showings" className="bg-white rounded-xl border border-dashboard-border">
          {!showings?.length ? (
            <div className="p-8">
              <EmptyState icon={Calendar} title="No Showings" description="Scheduled showings for this lead will appear here." actionLabel="Schedule Showing" onAction={() => setShowShowingModal(true)} />
            </div>
          ) : (
            <div className="divide-y divide-dashboard-border">
              {showings.map((showing) => (
                <div key={showing.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-lato text-sm font-medium text-dashboard-black">{showing.address}</p>
                      <p className="font-lato text-xs text-dashboard-secondary mt-0.5">
                        {format(new Date(showing.date), 'EEEE, MMM d, yyyy')} &middot; {showing.start_time.slice(0, 5)} - {showing.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-lato font-medium ${
                      showing.status === 'confirmed' ? 'bg-green-50 text-green-700'
                        : showing.status === 'completed' ? 'bg-blue-50 text-blue-700'
                        : showing.status === 'cancelled' ? 'bg-red-50 text-red-700'
                        : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {showing.status}
                    </span>
                  </div>
                  {showing.notes && <p className="font-lato text-xs text-dashboard-secondary mt-2">{showing.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Sequences' && (
        <div role="tabpanel" id="tabpanel-sequences" aria-labelledby="tab-sequences" className="bg-white rounded-xl border border-dashboard-border">
          {!enrollments?.length ? (
            <div className="p-8">
              <EmptyState icon={Zap} title="No Sequences" description="This lead is not enrolled in any drip sequences." actionLabel="Enroll in Sequence" onAction={() => setShowEnrollModal(true)} />
            </div>
          ) : (
            <div className="divide-y divide-dashboard-border">
              {enrollments.map((enrollment) => {
                const seqData = (enrollment as EnrollmentWithSequence).drip_sequences;
                return (
                  <div key={enrollment.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-lato text-sm font-medium text-dashboard-black">{seqData?.name ?? 'Sequence'}</p>
                        <p className="font-lato text-xs text-dashboard-secondary mt-0.5">
                          Step {enrollment.current_step} &middot; Enrolled {format(new Date(enrollment.enrolled_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-lato font-medium ${
                        enrollment.status === 'active' ? 'bg-green-50 text-green-700'
                          : enrollment.status === 'completed' ? 'bg-blue-50 text-blue-700'
                          : enrollment.status === 'paused' ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {enrollment.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Checklists' && (
        <div role="tabpanel" id="tabpanel-checklists" aria-labelledby="tab-checklists" className="bg-white rounded-xl border border-dashboard-border">
          {!checklists?.length ? (
            <div className="p-8">
              <EmptyState icon={CheckSquare} title="No Checklists" description="No checklists assigned to this lead yet." actionLabel="Assign Checklist" onAction={() => setShowChecklistModal(true)} />
            </div>
          ) : (
            <div className="divide-y divide-dashboard-border">
              {checklists.map((cl) => {
                const templateData = (cl as ChecklistInstanceWithTemplate).checklist_templates;
                return (
                  <div key={cl.id} className="p-4">
                    <p className="font-lato text-sm font-medium text-dashboard-black">{templateData?.name ?? cl.name}</p>
                    {(templateData?.description ?? cl.description) && (
                      <p className="font-lato text-xs text-dashboard-secondary mt-0.5">{templateData?.description ?? cl.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {lead && (
        <>
          <EnrollLeadModal isOpen={showEnrollModal} onClose={() => setShowEnrollModal(false)} leadId={lead.id} leadName={`${lead.first_name} ${lead.last_name}`} />
          <AssignChecklistModal isOpen={showChecklistModal} onClose={() => setShowChecklistModal(false)} leadId={lead.id} leadName={`${lead.first_name} ${lead.last_name}`} />
          <AddShowingModal isOpen={showShowingModal} onClose={() => setShowShowingModal(false)} preselectedLeadId={lead.id} />
        </>
      )}
    </div>
  );
}
