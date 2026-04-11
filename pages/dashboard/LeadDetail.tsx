import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MessageSquare, Calendar, MapPin, Clock, Tag, DollarSign, Globe, Activity, Zap, CheckSquare, X, BarChart3, Send, Eye, Heart, Search, ChevronDown, ChevronRight, Shield, Home, Cake, Users, CheckCircle2, AlertTriangle, Pause } from 'lucide-react';
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

const tabs = ['Overview', 'Timeline', 'Showings', 'Sequences', 'Checklists'];
const STATUS_OPTIONS: LeadStatus[] = ['new_lead', 'attempted_contact', 'contacted', 'appointment_set', 'appointment_met', 'active_client', 'pending_client', 'past_client', 'lost'];

// ─── AI Call Prep Button ──────────────────────────────────────────────────────
// Self-contained component with its own state — safe to render anywhere
function AICallPrepButton({ lead }: { lead: { first_name: string; last_name: string; score: number; status: string; source: string; pre_approval_amount: number | null; tags: string[] | null; notes: string | null; phone: string | null } }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setOpen(true);
    setLoading(true);
    setContent('');
    try {
      const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': `Bearer ${ANON}` },
        body: JSON.stringify({
          agent: 'ceo',
          messages: [{ role: 'user', content: `Call prep for: ${lead.first_name} ${lead.last_name} | Score: ${lead.score} | Status: ${lead.status} | Source: ${lead.source} | Budget: ${lead.pre_approval_amount ? `$${lead.pre_approval_amount.toLocaleString()}` : 'unknown'} | Tags: ${lead.tags?.join(', ') || 'none'} | Notes: ${lead.notes || 'none'}. Give Lorena: 1) Who is this person, 2) What do they want, 3) 3 opening lines, 4) Objection handling. Be specific and concise.` }],
          context: 'Lorena Ontiveros-Ortega | El Paso TX REALTOR | military, first-time buyers, luxury',
        }),
      });
      const data = await res.json();
      setContent(data.text || data.content?.[0]?.text || 'Unable to generate. Try again.');
    } catch {
      setContent('Error generating brief. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={generate} className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-lato text-sm transition-colors min-h-[44px]" title="AI Call Prep">
        <Zap size={14} /> AI Prep
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><Zap size={16} className="text-purple-600" /></div>
                <div>
                  <h3 className="font-playfair font-bold text-dashboard-black">AI Call Prep</h3>
                  <p className="font-lato text-xs text-dashboard-secondary">{lead.first_name} {lead.last_name}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-dashboard-secondary hover:text-dashboard-black"><X size={20} /></button>
            </div>
            <div className="p-5">
              {loading ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <p className="font-lato text-sm text-dashboard-secondary">Analyzing lead profile...</p>
                </div>
              ) : (
                <div className="font-lato text-sm text-dashboard-body whitespace-pre-wrap leading-relaxed">{content}</div>
              )}
            </div>
            {!loading && (
              <div className="p-4 border-t border-gray-100 flex gap-2">
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-dashboard-gold text-white rounded-lg font-lato text-sm font-medium">
                    <Phone size={14} /> Call Now
                  </a>
                )}
                <button onClick={() => setOpen(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg font-lato text-sm text-dashboard-secondary">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showShowingModal, setShowShowingModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'activity' | 'message' | 'showing'>('all');
  const updateLead = useUpdateLead();

  const { data: lead, isLoading, error } = useLead(id ?? '');
  usePageTitle(lead ? `${lead.first_name} ${lead.last_name}` : 'Lead Detail');
  const { data: activities } = useLeadActivity(id ?? '');
  const { data: messages } = useMessages(id ?? '');
  const { data: showings } = useLeadShowings(id ?? '');
  const { data: enrollments } = useEnrollments(id ?? '');
  const { data: checklists } = useChecklists(id ?? '');

  // ── useMemo hooks MUST be before any early returns (Rules of Hooks) ──────
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

  type TimelineItem = {
    id: string;
    type: 'activity' | 'message_in' | 'message_out' | 'showing';
    timestamp: string;
    action?: string; points?: number;
    content?: string; channel?: string;
    address?: string; showingStatus?: string; startTime?: string;
  };

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    for (const act of activities ?? []) {
      items.push({ id: `act-${act.id}`, type: 'activity', timestamp: act.created_at, action: act.action, points: act.points });
    }
    for (const msg of messages ?? []) {
      items.push({ id: `msg-${msg.id}`, type: msg.direction === 'inbound' ? 'message_in' : 'message_out', timestamp: msg.created_at, content: msg.content, channel: msg.channel });
    }
    for (const sh of showings ?? []) {
      items.push({ id: `sh-${sh.id}`, type: 'showing', timestamp: sh.date, address: sh.address, showingStatus: sh.status, startTime: sh.start_time });
    }
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activities, messages, showings]);

  const filteredTimeline = useMemo(() => {
    if (timelineFilter === 'all') return timeline;
    if (timelineFilter === 'activity') return timeline.filter(t => t.type === 'activity');
    if (timelineFilter === 'message') return timeline.filter(t => t.type === 'message_in' || t.type === 'message_out');
    return timeline.filter(t => t.type === 'showing');
  }, [timeline, timelineFilter]);
  // ─────────────────────────────────────────────────────────────────────────

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

  // Compute Next Best Action

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

  // Parse custom_fields from CINC import
  const cf = ((lead.custom_fields ?? {}) as Record<string, unknown>);
  const cincActivity = (cf.cinc_activity ?? null) as {
    property_views?: number; favorite_properties?: number;
    saved_searches?: number; property_inquiries?: number; login_count?: number;
  } | null;
  const homeAddress = (cf.home_address ?? null) as {
    address?: string; city?: string; state?: string; zip?: string;
  } | null;
  const secondaryContact = (cf.secondary_contact ?? null) as {
    name?: string; phone?: string; relationship?: string;
  } | null;

  const parseCINCDate = (raw: unknown): { month: number; day: number; year: number } | null => {
    if (!raw || typeof raw !== 'string') return null;
    const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    const month = parseInt(m[1], 10);
    const day = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { month, day, year };
  };

  const formatCINCDate = (raw: unknown, type: 'birthday' | 'anniversary') => {
    const d = parseCINCDate(raw);
    if (!d) return null;
    const dateObj = new Date(d.year, d.month - 1, d.day);
    const formatted = format(dateObj, 'MMM d');
    const now = new Date();
    if (type === 'birthday') {
      const age = now.getFullYear() - d.year;
      return `${formatted} (${t('leadDetail.turnsAge').replace('{n}', String(age))})`;
    }
    const years = now.getFullYear() - d.year;
    return `${formatted} (${t('leadDetail.yearsInHome').replace('{n}', String(years))})`;
  };

  const hasFinancialData = lead.pre_approved || lead.budget_min || lead.budget_max || lead.deal_type || lead.lender_name;
  const hasCincActivity = cincActivity && (cincActivity.property_views || cincActivity.favorite_properties || cincActivity.saved_searches || cincActivity.property_inquiries);
  const hasPersonalDetails = homeAddress?.address || cf.birthday || cf.spouse_birthday || cf.home_anniversary;

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
              {lead.deal_type && (
                <span className={`px-2 py-0.5 rounded text-xs font-lato font-medium ${
                  lead.deal_type === 'buyer' ? 'bg-blue-50 text-blue-600'
                  : lead.deal_type === 'seller' ? 'bg-teal-50 text-teal-600'
                  : 'bg-purple-50 text-purple-600'
                }`}>
                  {lead.deal_type === 'dual' ? t('leadDetail.dual') : lead.deal_type === 'buyer' ? t('leadDetail.buyer') : t('leadDetail.seller')}
                </span>
              )}
              {(lead.verification_status === 'bad_info' || lead.verification_status === 'do_not_contact') && (
                <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-lato font-medium flex items-center gap-1">
                  <AlertTriangle size={10} />
                  {lead.verification_status === 'bad_info' ? t('leadDetail.badInfo') : t('leadDetail.doNotContact')}
                </span>
              )}
              {lead.nurture_paused && (
                <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded text-xs font-lato font-medium flex items-center gap-1">
                  <Pause size={10} /> {t('leadDetail.paused')}
                </span>
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
            <AICallPrepButton lead={lead} />
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
              {tab === 'Timeline' && timeline.length ? <span className="ml-1 text-xs opacity-60">({timeline.length})</span> : null}
              {tab === 'Showings' && showings?.length ? <span className="ml-1 text-xs opacity-60">({showings.length})</span> : null}
              {tab === 'Sequences' && enrollments?.length ? <span className="ml-1 text-xs opacity-60">({enrollments.length})</span> : null}
              {tab === 'Checklists' && checklists?.length ? <span className="ml-1 text-xs opacity-60">({checklists.length})</span> : null}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview" className="space-y-6">

          {/* Section 1: Financial Qualification */}
          {hasFinancialData && (
            <div className="bg-white rounded-xl border border-dashboard-border p-5">
              <h3 className="font-playfair text-base font-bold text-dashboard-black mb-4 flex items-center gap-2">
                <DollarSign size={18} className="text-dashboard-gold" />
                {t('leadDetail.financial')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="font-lato text-xs text-dashboard-secondary mb-1">{t('leadDetail.preApproved')}</p>
                  {lead.pre_approved ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-sm font-lato font-medium">
                      <CheckCircle2 size={12} /> {t('leadDetail.preApproved')}
                    </span>
                  ) : (
                    <span className="font-lato text-sm text-dashboard-secondary">{t('leadDetail.notPreApproved')}</span>
                  )}
                </div>
                {lead.pre_approval_amount && (
                  <div>
                    <p className="font-lato text-xs text-dashboard-secondary mb-1">{t('leadDetail.preApprovalAmount')}</p>
                    <p className="font-lato text-sm font-medium text-dashboard-black">
                      {new Intl.NumberFormat('en-US', { style: 'currency', maximumFractionDigits: 0 }).format(lead.pre_approval_amount)}
                    </p>
                  </div>
                )}
                {budgetStr && (
                  <div>
                    <p className="font-lato text-xs text-dashboard-secondary mb-1">{t('leadDetail.budget')}</p>
                    <p className="font-lato text-sm font-medium text-dashboard-black">{budgetStr}</p>
                  </div>
                )}
                {lead.lender_name && (
                  <div>
                    <p className="font-lato text-xs text-dashboard-secondary mb-1">{t('leadDetail.lender')}</p>
                    <p className="font-lato text-sm text-dashboard-body">{lead.lender_name}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 2: Property Activity (CINC metrics) */}
          <div className="bg-white rounded-xl border border-dashboard-border p-5">
            <h3 className="font-playfair text-base font-bold text-dashboard-black mb-4 flex items-center gap-2">
              <Eye size={18} className="text-dashboard-gold" />
              {t('leadDetail.propertyActivity')}
            </h3>
            {hasCincActivity ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-dashboard-surface rounded-lg">
                  <Eye size={20} className="mx-auto text-dashboard-secondary mb-1" />
                  <p className="font-lato text-xl font-bold text-dashboard-black">{cincActivity?.property_views ?? 0}</p>
                  <p className="font-lato text-xs text-dashboard-secondary">{t('leadDetail.propertyViews')}</p>
                </div>
                <div className="text-center p-3 bg-dashboard-surface rounded-lg">
                  <Heart size={20} className="mx-auto text-dashboard-secondary mb-1" />
                  <p className="font-lato text-xl font-bold text-dashboard-black">{cincActivity?.favorite_properties ?? 0}</p>
                  <p className="font-lato text-xs text-dashboard-secondary">{t('leadDetail.favorites')}</p>
                </div>
                <div className="text-center p-3 bg-dashboard-surface rounded-lg">
                  <Search size={20} className="mx-auto text-dashboard-secondary mb-1" />
                  <p className="font-lato text-xl font-bold text-dashboard-black">{cincActivity?.saved_searches ?? 0}</p>
                  <p className="font-lato text-xs text-dashboard-secondary">{t('leadDetail.savedSearches')}</p>
                </div>
                <div className="text-center p-3 bg-dashboard-surface rounded-lg">
                  <MessageSquare size={20} className="mx-auto text-dashboard-secondary mb-1" />
                  <p className="font-lato text-xl font-bold text-dashboard-black">{cincActivity?.property_inquiries ?? 0}</p>
                  <p className="font-lato text-xs text-dashboard-secondary">{t('leadDetail.inquiries')}</p>
                </div>
              </div>
            ) : (
              <p className="font-lato text-sm text-dashboard-secondary">{t('leadDetail.noActivity')}</p>
            )}
          </div>

          {/* Section 3: Contact & Communication */}
          <div className="bg-white rounded-xl border border-dashboard-border p-5">
            <h3 className="font-playfair text-base font-bold text-dashboard-black mb-4 flex items-center gap-2">
              <Phone size={18} className="text-dashboard-gold" />
              {t('leadDetail.contact')}
            </h3>
            <div className="space-y-3">
              {lead.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-dashboard-secondary shrink-0" />
                  <a href={`tel:${lead.phone}`} className="font-lato text-sm text-dashboard-body hover:text-dashboard-gold transition-colors">{lead.phone}</a>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-dashboard-secondary shrink-0" />
                  <a href={`mailto:${lead.email}`} className="font-lato text-sm text-dashboard-body hover:text-dashboard-gold transition-colors">{lead.email}</a>
                </div>
              )}
              <div className="flex flex-wrap gap-4">
                {lead.communication_preference && lead.communication_preference !== 'any' && (
                  <div className="flex items-center gap-2">
                    <span className="font-lato text-xs text-dashboard-secondary">{t('leadDetail.commPref')}:</span>
                    <span className="px-2 py-0.5 bg-dashboard-surface rounded text-xs font-lato font-medium text-dashboard-body uppercase">{lead.communication_preference}</span>
                  </div>
                )}
                {lead.best_call_time && (
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-dashboard-secondary" />
                    <span className="font-lato text-xs text-dashboard-secondary">{t('leadDetail.bestCallTime')}:</span>
                    <span className="font-lato text-xs text-dashboard-body">{lead.best_call_time}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Globe size={16} className="text-dashboard-secondary shrink-0" />
                <span className="font-lato text-sm text-dashboard-body">{lead.preferred_language === 'es' ? 'Spanish' : 'English'}</span>
              </div>
              {/* Co-Buyer / Spouse */}
              {secondaryContact?.name && (
                <div className="mt-3 pt-3 border-t border-dashboard-border">
                  <p className="font-lato text-xs text-dashboard-secondary mb-2 flex items-center gap-1.5">
                    <Users size={14} /> {t('leadDetail.cobuyer')}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="font-lato text-sm text-dashboard-body">{secondaryContact.name}</span>
                    {secondaryContact.relationship && (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px] font-lato font-medium">{secondaryContact.relationship}</span>
                    )}
                  </div>
                  {secondaryContact.phone && (
                    <a href={`tel:${secondaryContact.phone}`} className="font-lato text-sm text-dashboard-body hover:text-dashboard-gold transition-colors mt-1 inline-block">{secondaryContact.phone}</a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Preferences */}
          <div className="bg-white rounded-xl border border-dashboard-border p-5">
            <h3 className="font-playfair text-base font-bold text-dashboard-black mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-dashboard-gold" />
              {t('leadDetail.preferences')}
            </h3>
            <div className="space-y-3">
              {lead.property_type && (
                <div className="flex items-center gap-3">
                  <Home size={16} className="text-dashboard-secondary shrink-0" />
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
                        <button onClick={() => { const newTags = (lead.tags || []).filter(tg => tg !== tag); updateLead.mutate({ id: lead.id, updates: { tags: newTags } }, { onSuccess: () => showToast('Tag removed') }); }} aria-label={`Remove tag ${tag}`} className="hover:text-red-500 transition-colors"><X size={10} /></button>
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
          </div>

          {/* Section 5: Personal Details */}
          {hasPersonalDetails && (
            <div className="bg-white rounded-xl border border-dashboard-border p-5">
              <h3 className="font-playfair text-base font-bold text-dashboard-black mb-4 flex items-center gap-2">
                <Cake size={18} className="text-dashboard-gold" />
                {t('leadDetail.personal')}
              </h3>
              <div className="space-y-3">
                {homeAddress?.address && (
                  <div className="flex items-center gap-3">
                    <Home size={16} className="text-dashboard-secondary shrink-0" />
                    <span className="font-lato text-sm text-dashboard-body">
                      {[homeAddress.address, homeAddress.city, homeAddress.state, homeAddress.zip].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                {cf.birthday && (
                  <div className="flex items-center gap-3">
                    <Cake size={16} className="text-dashboard-secondary shrink-0" />
                    <span className="font-lato text-xs text-dashboard-secondary mr-1">{t('leadDetail.birthday')}:</span>
                    <span className="font-lato text-sm text-dashboard-body">{formatCINCDate(cf.birthday, 'birthday') ?? String(cf.birthday)}</span>
                  </div>
                )}
                {cf.spouse_birthday && (
                  <div className="flex items-center gap-3">
                    <Cake size={16} className="text-dashboard-secondary shrink-0" />
                    <span className="font-lato text-xs text-dashboard-secondary mr-1">{t('leadDetail.spouseBirthday')}:</span>
                    <span className="font-lato text-sm text-dashboard-body">{formatCINCDate(cf.spouse_birthday, 'birthday') ?? String(cf.spouse_birthday)}</span>
                  </div>
                )}
                {cf.home_anniversary && (
                  <div className="flex items-center gap-3">
                    <Home size={16} className="text-dashboard-secondary shrink-0" />
                    <span className="font-lato text-xs text-dashboard-secondary mr-1">{t('leadDetail.homeAnniversary')}:</span>
                    <span className="font-lato text-sm text-dashboard-body">{formatCINCDate(cf.home_anniversary, 'anniversary') ?? String(cf.home_anniversary)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 6: Notes */}
          <div className="bg-white rounded-xl border border-dashboard-border p-5">
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

          {/* Section 7: Score Breakdown */}
          <div className="bg-white rounded-xl border border-dashboard-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-dashboard-gold" />
              <h3 className="font-playfair text-base font-bold text-dashboard-black">Score Breakdown</h3>
              <LeadScoreBadge score={lead.score} size="sm" />
            </div>
            {!activities?.length ? (
              <p className="font-lato text-sm text-dashboard-secondary">No scored activity yet. Actions that contribute to the lead score will appear here.</p>
            ) : (() => {
              const actionCounts = new Map<string, { count: number; totalPoints: number }>();
              for (const act of activities) {
                const existing = actionCounts.get(act.action);
                if (existing) { existing.count += 1; existing.totalPoints += act.points; }
                else { actionCounts.set(act.action, { count: 1, totalPoints: act.points }); }
              }
              const categoryGroups = new Map<ScoreCategory, { action: string; label: string; pointValue: number; count: number; totalPoints: number }[]>();
              for (const [action, data] of actionCounts.entries()) {
                const category = ACTION_CATEGORIES[action as ActionType] ?? 'Engagement';
                const pointValue = SCORING_TABLE[action as ActionType] ?? 0;
                if (!categoryGroups.has(category)) categoryGroups.set(category, []);
                categoryGroups.get(category)!.push({ action, label: ACTION_LABELS[action] ?? action.replace(/_/g, ' '), pointValue, count: data.count, totalPoints: data.totalPoints });
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
                          <span className={`px-2 py-0.5 rounded text-xs font-lato font-medium ${CATEGORY_COLORS[category]}`}>{category}</span>
                          <span className={`font-lato text-xs font-bold ${categoryTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>{categoryTotal >= 0 ? '+' : ''}{categoryTotal} pts</span>
                        </div>
                        <div className="space-y-1">
                          {items.sort((a, b) => Math.abs(b.totalPoints) - Math.abs(a.totalPoints)).map((item) => (
                            <div key={item.action} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-dashboard-surface/50">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="font-lato text-sm text-dashboard-body capitalize truncate">{item.label}</span>
                                <span className="font-lato text-xs text-dashboard-secondary shrink-0">{item.pointValue >= 0 ? '+' : ''}{item.pointValue} pts each</span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-lato text-xs text-dashboard-secondary">&times;{item.count}</span>
                                <span className={`font-lato text-sm font-bold min-w-[50px] text-right ${item.totalPoints >= 0 ? 'text-green-600' : 'text-red-600'}`}>{item.totalPoints >= 0 ? '+' : ''}{item.totalPoints}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <div className="border-t border-dashboard-border pt-3 flex items-center justify-between">
                    <span className="font-lato text-sm font-medium text-dashboard-black">Total from {activities.length} activities</span>
                    <span className="font-playfair text-lg font-bold text-dashboard-gold">{activities.reduce((sum, act) => sum + act.points, 0)} pts</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Section 8: Verification & Import (collapsed) */}
          <div className="bg-white rounded-xl border border-dashboard-border">
            <button
              onClick={() => setShowVerification(!showVerification)}
              className="w-full p-5 flex items-center justify-between min-h-[44px]"
            >
              <h3 className="font-playfair text-base font-bold text-dashboard-black flex items-center gap-2">
                <Shield size={18} className="text-dashboard-secondary" />
                {t('leadDetail.verification')}
              </h3>
              {showVerification ? <ChevronDown size={18} className="text-dashboard-secondary" /> : <ChevronRight size={18} className="text-dashboard-secondary" />}
            </button>
            {showVerification && (
              <div className="px-5 pb-5 space-y-3 border-t border-dashboard-border pt-3">
                <div className="flex items-center gap-3">
                  <span className="font-lato text-xs text-dashboard-secondary w-24">{t('leadDetail.verification')}:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-lato font-medium ${
                    lead.verification_status === 'verified' ? 'bg-green-50 text-green-700'
                    : lead.verification_status === 'bad_info' ? 'bg-red-50 text-red-600'
                    : lead.verification_status === 'do_not_contact' ? 'bg-red-50 text-red-600'
                    : 'bg-gray-50 text-gray-600'
                  }`}>
                    {lead.verification_status === 'verified' ? t('leadDetail.verified')
                      : lead.verification_status === 'bad_info' ? t('leadDetail.badInfo')
                      : lead.verification_status === 'do_not_contact' ? t('leadDetail.doNotContact')
                      : t('leadDetail.unverified')}
                  </span>
                </div>
                {lead.imported_at && (
                  <div className="flex items-center gap-3">
                    <span className="font-lato text-xs text-dashboard-secondary w-24">{t('leadDetail.importedOn')}:</span>
                    <span className="font-lato text-sm text-dashboard-body">{format(new Date(lead.imported_at), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {lead.referral_count > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="font-lato text-xs text-dashboard-secondary w-24">{t('leadDetail.referrals')}:</span>
                    <span className="font-lato text-sm text-dashboard-body">{lead.referral_count}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unified Timeline Tab */}
      {activeTab === 'Timeline' && (
        <div role="tabpanel" id="tabpanel-timeline" aria-labelledby="tab-timeline" className="space-y-4">
          {/* Filter buttons */}
          <div className="flex gap-1 bg-dashboard-surface rounded-lg p-1">
            {(['all', 'activity', 'message', 'showing'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimelineFilter(filter)}
                className={`flex-1 px-3 py-2 rounded-md font-lato text-xs font-medium transition-colors min-h-[36px] ${
                  timelineFilter === filter
                    ? 'bg-white text-dashboard-gold shadow-sm'
                    : 'text-dashboard-secondary hover:text-dashboard-body'
                }`}
              >
                {filter === 'all' ? t('leadDetail.allFilter')
                  : filter === 'activity' ? t('leadDetail.activityFilter')
                  : filter === 'message' ? t('leadDetail.messagesFilter')
                  : t('leadDetail.showingsFilter')}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-dashboard-border">
            {!filteredTimeline.length ? (
              <div className="p-8">
                <EmptyState icon={Activity} title={t('leadDetail.noTimeline')} description={t('leadDetail.noTimelineDesc')} />
              </div>
            ) : (
              <div className="divide-y divide-dashboard-border">
                {filteredTimeline.map((item) => (
                  <div key={item.id} className="p-4 flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      item.type === 'activity' ? 'bg-dashboard-surface'
                      : item.type === 'message_in' ? 'bg-blue-50'
                      : item.type === 'message_out' ? 'bg-dashboard-gold/10'
                      : 'bg-purple-50'
                    }`}>
                      {item.type === 'activity' && <Activity size={14} className="text-dashboard-secondary" />}
                      {item.type === 'message_in' && <MessageSquare size={14} className="text-blue-600" />}
                      {item.type === 'message_out' && <Send size={14} className="text-dashboard-gold" />}
                      {item.type === 'showing' && <Calendar size={14} className="text-purple-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.type === 'activity' && (
                        <>
                          <p className="font-lato text-sm text-dashboard-body capitalize">{(item.action ?? '').replace(/_/g, ' ')}</p>
                          <p className="font-lato text-xs text-dashboard-secondary mt-0.5">{format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')}</p>
                        </>
                      )}
                      {(item.type === 'message_in' || item.type === 'message_out') && (
                        <>
                          <p className="font-lato text-sm text-dashboard-body">
                            {(item.content ?? '').length > 100 ? (item.content ?? '').slice(0, 100) + '...' : item.content}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="font-lato text-xs text-dashboard-secondary">{format(new Date(item.timestamp), 'MMM d, h:mm a')}</p>
                            {item.channel && <span className="px-1.5 py-0.5 bg-dashboard-surface rounded text-[10px] font-lato text-dashboard-secondary">{item.channel}</span>}
                            <span className="font-lato text-[10px] text-dashboard-secondary">{item.type === 'message_in' ? 'Inbound' : 'Outbound'}</span>
                          </div>
                        </>
                      )}
                      {item.type === 'showing' && (
                        <>
                          <p className="font-lato text-sm font-medium text-dashboard-black">{item.address}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="font-lato text-xs text-dashboard-secondary">{format(new Date(item.timestamp), 'MMM d, yyyy')}{item.startTime ? ` at ${item.startTime.slice(0, 5)}` : ''}</p>
                            {item.showingStatus && (
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-lato font-medium ${
                                item.showingStatus === 'confirmed' ? 'bg-green-50 text-green-700'
                                : item.showingStatus === 'completed' ? 'bg-blue-50 text-blue-700'
                                : item.showingStatus === 'cancelled' ? 'bg-red-50 text-red-700'
                                : 'bg-yellow-50 text-yellow-700'
                              }`}>{item.showingStatus}</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    {item.type === 'activity' && item.points !== undefined && (
                      <span className={`font-lato text-sm font-medium shrink-0 ${item.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.points >= 0 ? '+' : ''}{item.points}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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
