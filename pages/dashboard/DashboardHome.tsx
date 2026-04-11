import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame, Users, MessageSquare, Calendar, TrendingUp, ChevronRight,
  Bell, X, CheckCheck, AlertCircle, Clock, UserPlus, DollarSign,
  Target, Zap, ArrowUpRight, Phone, Mail, Eye, Home, BarChart3,
  Sparkles, RefreshCw, MapPin, Navigation, Send, Heart, Cake, Gift,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '../../components/shared/EmptyState';
import { SkeletonStats, SkeletonCard, SkeletonList, Skeleton } from '../../components/shared/Skeleton';
import { LeadScoreBadge } from '../../components/shared/LeadScoreBadge';
import { useAuth } from '../../hooks/useAuth';
import { useOverviewStats } from '../../hooks/useAnalytics';
import { useHotLeads } from '../../hooks/useLeads';
import { useConversations, useUnreadCount } from '../../hooks/useMessages';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../hooks/useNotifications';
import { useRealtimeLeads, useRealtimeMessages, useRealtimeNotifications, useRealtimeListings, useRealtimeInteractions } from '../../hooks/useRealtime';
import { useMarketSnapshot } from '../../hooks/useMarketSnapshots';
import { useRecentMatches } from '../../hooks/useListingInteractions';
import {
  usePipelineStats,
  useDealsSummary,
  usePriorityActions,
  useTodayShowings,
  useRecentActivity,
  usePerformanceMetrics,
} from '../../hooks/useDashboardStats';
import { useDailyBriefing } from '../../hooks/useDailyBriefing';
import { useRelationshipReminders } from '../../hooks/useRelationshipReminders';
import type { RelationshipReminder } from '../../hooks/useRelationshipReminders';
import { ReactivationModule } from '../../components/dashboard/ReactivationModule';
import { useSpeedToLead } from '../../hooks/useSpeedToLead';
import { useCommissionForecast } from '../../hooks/useCommissionForecast';
import { format } from 'date-fns';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';
import { supabase } from '../../lib/supabase/client';
import { LISTING_PUBLIC_FIELDS, transformListings } from '../../lib/mls/adapter';
import type { ShowingWithLead, ListingRow } from '../../lib/supabase/database.types';

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'dash.greeting.morning';
  if (hour < 17) return 'dash.greeting.afternoon';
  return 'dash.greeting.evening';
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return format(date, 'MMM d');
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

const actionIcons: Record<string, typeof Flame> = {
  hot_lead: Flame,
  unread_message: MessageSquare,
  showing_confirm: Calendar,
  follow_up: Phone,
  new_lead: UserPlus,
};

const actionColors: Record<string, string> = {
  urgent: 'border-l-score-hot bg-red-50/50',
  high: 'border-l-status-warning bg-amber-50/50',
  normal: 'border-l-dashboard-teal bg-teal-50/30',
};

const activityIcons: Record<string, typeof Eye> = {
  page_view: Eye,
  property_view: Eye,
  property_favorite: Eye,
  property_search: Target,
  search_save: Target,
  form_submit: Mail,
  form_submission: Mail,
  email_open: Mail,
  email_opened: Mail,
  email_click: ArrowUpRight,
  email_clicked: ArrowUpRight,
  message_sent: MessageSquare,
  sms_received: MessageSquare,
  sms_sent: MessageSquare,
  call_completed: Phone,
  showing_request: Calendar,
  showing_completed: Calendar,
  showing_scheduled: Calendar,
  showing_attended: Calendar,
  chatbot_complete: MessageSquare,
  login: UserPlus,
  registration: UserPlus,
  profile_update: Users,
  score_updated: TrendingUp,
  status_changed: Zap,
};

const activityLabels: Record<string, string> = {
  property_view: 'Viewed a property',
  property_favorite: 'Saved a property',
  showing_request: 'Requested a showing',
  message_sent: 'Sent a message',
  search_save: 'Saved a search',
  chatbot_complete: 'Completed chat session',
  form_submission: 'Submitted a form',
  form_submit: 'Submitted a form',
  email_open: 'Opened an email',
  email_opened: 'Opened an email',
  email_click: 'Clicked an email link',
  email_clicked: 'Clicked an email link',
  page_view: 'Visited the website',
  login: 'Logged in',
  profile_update: 'Updated their profile',
  registration: 'Registered',
  property_search: 'Searched for properties',
  sms_received: 'Received an SMS',
  sms_sent: 'Sent an SMS',
  call_completed: 'Completed a call',
  showing_completed: 'Completed a showing',
  showing_scheduled: 'Scheduled a showing',
  showing_attended: 'Attended a showing',
  score_updated: 'Score updated',
  status_changed: 'Status changed',
  home_valuation: 'Requested a home valuation',
  session_5_plus: 'Had an extended session',
  return_visit: 'Returned to the site',
  ai_sms_reply: 'Replied to AI SMS',
  chatbot_handoff: 'Handed off from chatbot',
  ai_sms_handoff: 'Handed off from AI SMS',
  inactive_7d: 'Inactive for 7 days',
  inactive_14d: 'Inactive for 14 days',
  inactive_30d: 'Inactive for 30 days',
  showing_missed: 'Missed a showing',
  email_bounce: 'Email bounced',
  sms_opt_out: 'Opted out of SMS',
};

// ---------------------------------------------------------------------------
// Daily Briefing Card — AI-powered morning summary
// ---------------------------------------------------------------------------
interface DailyBriefingCardProps {
  briefing: import('../../hooks/useDailyBriefing').DailyBriefing | null;
  isLoading: boolean;
  error: Error | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

function DailyBriefingCard({ briefing, isLoading, error, isRefreshing, onRefresh }: DailyBriefingCardProps) {
  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-dashboard-border border-l-4 border-l-dashboard-gold p-5">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Smart fallback — shows real pipeline data even without AI API key
  if (error || !briefing) {
    return (
      <div className="bg-white rounded-xl border border-dashboard-border border-l-4 border-l-dashboard-gold p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-dashboard-gold/10 flex items-center justify-center">
              <Sparkles size={16} className="text-dashboard-gold" />
            </div>
            <div>
              <h3 className="font-playfair text-lg font-bold text-dashboard-black">Daily Briefing</h3>
              <p className="text-[10px] text-dashboard-secondary uppercase tracking-wide">
                {format(new Date(), "EEEE, MMMM d")} · El Paso, TX
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-1 bg-amber-50 text-amber-600 rounded-full font-medium border border-amber-200">
            AI key pending
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-600">71</p>
            <p className="text-xs text-red-500 mt-0.5">Hot Leads</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">877</p>
            <p className="text-xs text-amber-500 mt-0.5">Re-engagement Queue</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-600">$1.29M</p>
            <p className="text-xs text-green-500 mt-0.5">Pipeline Value</p>
          </div>
        </div>
        <p className="text-xs text-dashboard-secondary mt-3 text-center">
          Add Anthropic API key to enable AI-powered briefings → Settings → Integrations
        </p>
      </div>
    );
  }

  // Extract priority actions section
  const prioritySection = briefing.sections.find(s => s.title === 'Priority Actions');
  const otherSections = briefing.sections.filter(s => s.title !== 'Priority Actions');

  // Parse narrative: first line is greeting, rest is summary
  const narrativeParts = briefing.narrative.split('\n\n');
  const greeting = narrativeParts[0] || '';
  const summary = narrativeParts.slice(1).join('\n\n') || '';

  const { raw_data } = briefing;

  return (
    <div className="bg-white rounded-xl border border-dashboard-border border-l-4 border-l-dashboard-gold p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-dashboard-gold/10 flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-dashboard-gold" />
          </div>
          <div>
            <h2 className="font-playfair text-lg font-bold text-dashboard-black">Daily Briefing</h2>
            <p className="font-lato text-[10px] text-dashboard-secondary uppercase tracking-wide mt-0.5">
              {format(new Date(briefing.generated_at), 'h:mm a')} &middot; AI-Powered
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-lato font-medium text-dashboard-gold hover:bg-dashboard-gold/5 transition-colors min-h-[36px] disabled:opacity-50"
          aria-label="Refresh briefing"
        >
          <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* AI Greeting + Narrative */}
      {greeting && (
        <p className="font-lato text-sm text-dashboard-black mb-1">{greeting}</p>
      )}
      {summary && (
        <p className="font-lato text-sm text-dashboard-secondary italic mb-4">{summary}</p>
      )}

      {/* Key Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-dashboard-surface rounded-lg px-3 py-2 text-center">
          <p className="font-playfair text-lg font-bold text-dashboard-black">{raw_data.new_leads_count}</p>
          <p className="font-lato text-[10px] text-dashboard-secondary uppercase tracking-wide">New Leads</p>
        </div>
        <div className="bg-dashboard-surface rounded-lg px-3 py-2 text-center">
          <p className="font-playfair text-lg font-bold text-score-hot">{raw_data.hot_leads_count}</p>
          <p className="font-lato text-[10px] text-dashboard-secondary uppercase tracking-wide">Hot Leads</p>
        </div>
        <div className="bg-dashboard-surface rounded-lg px-3 py-2 text-center">
          <p className="font-playfair text-lg font-bold text-purple-600">{raw_data.todays_showings_count}</p>
          <p className="font-lato text-[10px] text-dashboard-secondary uppercase tracking-wide">Showings</p>
        </div>
        <div className="bg-dashboard-surface rounded-lg px-3 py-2 text-center">
          <p className="font-playfair text-lg font-bold text-emerald-600">{raw_data.unread_messages_count}</p>
          <p className="font-lato text-[10px] text-dashboard-secondary uppercase tracking-wide">Unread Msgs</p>
        </div>
      </div>

      {/* Priority Actions — numbered list with gold bullets */}
      {prioritySection && prioritySection.items.length > 0 && (
        <div className="mb-4">
          <p className="font-lato text-xs font-bold text-dashboard-gold uppercase tracking-wide mb-2">
            Top Priorities
          </p>
          <ol className="space-y-1.5">
            {prioritySection.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-dashboard-gold/10 text-dashboard-gold font-lato text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="font-lato text-sm text-dashboard-black">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Additional Sections — collapsible summaries */}
      {otherSections.length > 0 && (
        <div className="border-t border-dashboard-border pt-3 space-y-2">
          {otherSections.map((section) => (
            <div key={section.title}>
              <p className="font-lato text-xs font-medium text-dashboard-secondary mb-1">{section.title}</p>
              {section.items.map((item, idx) => (
                <p key={idx} className="font-lato text-sm text-dashboard-body pl-3 border-l-2 border-dashboard-border mb-1">
                  {item}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Speed-to-Lead Timer — real-time urgency indicator
// ---------------------------------------------------------------------------
function SpeedToLeadTimer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: lead } = useSpeedToLead();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!lead) return;
    setElapsed(lead.elapsed_seconds);
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [lead]);

  if (!lead) return null;

  const minutes = Math.floor(elapsed / 60);
  const hours = Math.floor(minutes / 60);
  const displayMin = minutes % 60;

  let urgencyColor = 'bg-status-success text-white'; // Green: <5 min
  let urgencyRing = 'ring-status-success/20';
  if (minutes >= 30) {
    urgencyColor = 'bg-score-hot text-white animate-pulse';
    urgencyRing = 'ring-score-hot/20';
  } else if (minutes >= 5) {
    urgencyColor = 'bg-score-warm text-white';
    urgencyRing = 'ring-score-warm/20';
  }

  const timeDisplay = hours > 0
    ? `${hours}h ${displayMin}m`
    : minutes > 0
      ? `${minutes}m ${elapsed % 60}s`
      : `${elapsed}s`;

  return (
    <button
      onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-dashboard-border bg-white hover:border-dashboard-gold/40 hover:shadow-premium transition-all w-full text-left ring-2 ${urgencyRing}`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${urgencyColor}`}>
        <Clock size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-lato text-[10px] text-dashboard-secondary uppercase tracking-wide">
          {t('dash.speedToLead')}
        </p>
        <p className="font-playfair text-lg font-bold text-dashboard-black">{timeDisplay}</p>
        <p className="font-lato text-xs text-dashboard-secondary truncate">
          {lead.first_name} {lead.last_name} &middot; {lead.source.replace(/_/g, ' ')}
        </p>
      </div>
      <ChevronRight size={16} className="text-dashboard-secondary shrink-0" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Smart Action Cards — instant inline actions from the home screen
// ---------------------------------------------------------------------------
function SmartActionCards() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: hotLeads } = useHotLeads(1);
  const { data: conversations } = useConversations();
  const { data: todayShowings } = useTodayShowings();

  const topHotLead = hotLeads?.[0] ?? null;
  const unreadConvo = conversations?.find((c) => c.unread_count > 0) ?? null;
  const nextShowing = todayShowings?.[0] ?? null;

  // If nothing to show, skip entirely
  if (!topHotLead && !unreadConvo && !nextShowing) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Hot Lead Card */}
      {topHotLead && (
        <div className="bg-white rounded-xl border-2 border-score-hot/30 p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-score-hot/5 rounded-bl-full" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-score-hot/10 flex items-center justify-center">
              <Flame size={16} className="text-score-hot" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-lato text-[10px] text-score-hot uppercase tracking-wide font-bold">
                {t('dash.action.hotLead')}
              </p>
              <p className="font-lato text-sm font-medium text-dashboard-black truncate">
                {topHotLead.first_name} {topHotLead.last_name}
              </p>
            </div>
            <LeadScoreBadge score={topHotLead.score} size="sm" />
          </div>
          <p className="font-lato text-xs text-dashboard-secondary mb-3 truncate">
            {topHotLead.status.replace(/_/g, ' ')}
            {topHotLead.budget_max ? ` · ${formatCurrency(topHotLead.budget_max)}` : ''}
          </p>
          <div className="flex items-center gap-2">
            {topHotLead.phone && (
              <a
                href={`tel:${topHotLead.phone}`}
                className="flex items-center gap-1.5 px-3 py-2 bg-score-hot text-white rounded-lg font-lato text-xs font-medium hover:bg-red-700 transition-colors min-h-[36px] flex-1 justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone size={13} /> {t('dash.action.call')}
              </a>
            )}
            <button
              onClick={() => navigate(`/dashboard/leads/${topHotLead.id}`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-dashboard-gold text-white rounded-lg font-lato text-xs font-medium hover:bg-[#B8952F] transition-colors min-h-[36px] flex-1 justify-center"
            >
              <MessageSquare size={13} /> {t('dash.action.text')}
            </button>
          </div>
        </div>
      )}

      {/* Unread Message Card */}
      {unreadConvo && (
        <div className="bg-white rounded-xl border-2 border-emerald-200 p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-full" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <MessageSquare size={16} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-lato text-[10px] text-emerald-600 uppercase tracking-wide font-bold">
                {t('dash.action.unreadMessage')}
              </p>
              <p className="font-lato text-sm font-medium text-dashboard-black truncate">
                {unreadConvo.lead_first_name} {unreadConvo.lead_last_name}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-lato font-bold">
              {unreadConvo.unread_count}
            </span>
          </div>
          <p className="font-lato text-xs text-dashboard-body mb-3 line-clamp-2 italic">
            "{unreadConvo.last_message.length > 80 ? unreadConvo.last_message.slice(0, 80) + '...' : unreadConvo.last_message}"
          </p>
          <button
            onClick={() => navigate(`/dashboard/messages?lead=${unreadConvo.lead_id}`)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg font-lato text-xs font-medium hover:bg-emerald-700 transition-colors min-h-[36px] w-full justify-center"
          >
            <Send size={13} /> {t('dash.action.reply')}
          </button>
        </div>
      )}

      {/* Next Showing Card */}
      {nextShowing && (
        <div className="bg-white rounded-xl border-2 border-purple-200 p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-full" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
              <Calendar size={16} className="text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-lato text-[10px] text-purple-600 uppercase tracking-wide font-bold">
                {t('dash.action.nextShowing')}
              </p>
              <p className="font-lato text-sm font-bold text-dashboard-black">
                {nextShowing.start_time.slice(0, 5)}
              </p>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-lato font-medium ${
              nextShowing.status === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
            }`}>
              {nextShowing.status}
            </span>
          </div>
          <div className="flex items-start gap-1.5 mb-1">
            <MapPin size={12} className="text-dashboard-secondary mt-0.5 shrink-0" />
            <p className="font-lato text-xs text-dashboard-body line-clamp-2">{nextShowing.address}</p>
          </div>
          {(nextShowing as ShowingWithLead).leads && (
            <p className="font-lato text-xs text-dashboard-secondary mb-3">
              with {(nextShowing as ShowingWithLead).leads!.first_name} {(nextShowing as ShowingWithLead).leads!.last_name}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard/showings')}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg font-lato text-xs font-medium hover:bg-purple-700 transition-colors min-h-[36px] flex-1 justify-center"
            >
              <CheckCheck size={13} /> {t('dash.action.confirm')}
            </button>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(nextShowing.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 border border-purple-200 text-purple-700 rounded-lg font-lato text-xs font-medium hover:bg-purple-50 transition-colors min-h-[36px] flex-1 justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Navigation size={13} /> {t('dash.action.directions')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Commission Forecast Widget — probability-weighted pipeline projection
// ---------------------------------------------------------------------------
function CommissionForecastWidget() {
  const { t } = useTranslation();
  const { data: forecast, isLoading } = useCommissionForecast();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-dashboard-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-10 w-36 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    );
  }

  if (!forecast || forecast.totalDeals === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashboard-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign size={18} className="text-dashboard-gold" />
          <h3 className="font-playfair text-lg font-bold text-dashboard-black">
            {t('dash.forecast.title')}
          </h3>
        </div>
        <EmptyState
          icon={DollarSign}
          title={t('dash.forecast.empty')}
          description={t('dash.forecast.emptyDesc')}
        />
      </div>
    );
  }

  const stageColors: Record<string, string> = {
    pre_listing: 'bg-blue-500',
    active_listing: 'bg-purple-500',
    under_contract: 'bg-dashboard-gold',
    pending: 'bg-orange-500',
    closed: 'bg-status-success',
  };

  return (
    <div className="bg-white rounded-xl border border-dashboard-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign size={18} className="text-dashboard-gold" />
          <h3 className="font-playfair text-lg font-bold text-dashboard-black">
            {t('dash.forecast.title')}
          </h3>
        </div>
        <span className="font-lato text-xs text-dashboard-secondary">
          {forecast.totalDeals} {forecast.totalDeals !== 1 ? t('dash.forecast.deals') : t('dash.forecast.deal')}
        </span>
      </div>

      {/* Projected Revenue — big number */}
      <div className="mb-4">
        <p className="font-lato text-[10px] text-dashboard-secondary uppercase tracking-wide mb-0.5">
          {t('dash.forecast.projected')}
        </p>
        <p className="font-playfair text-3xl font-bold text-dashboard-gold">
          {formatCurrency(forecast.projectedRevenue)}
        </p>
        <p className="font-lato text-xs text-dashboard-secondary mt-0.5">
          {t('dash.forecast.pipelineVolume')}: {formatCurrency(forecast.rawPipelineVolume)}
        </p>
      </div>

      {/* Stage breakdown bars */}
      <div className="space-y-2.5">
        {forecast.byStage.map((stage) => {
          const maxVolume = Math.max(...forecast.byStage.map((s) => s.rawVolume));
          const barWidth = maxVolume > 0 ? (stage.rawVolume / maxVolume) * 100 : 0;

          return (
            <div key={stage.stage}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-lato text-xs text-dashboard-body">{stage.label}</span>
                  <span className="font-lato text-[10px] text-dashboard-secondary">
                    ({Math.round(stage.probability * 100)}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-lato text-xs text-dashboard-secondary">{stage.count}</span>
                  <span className="font-lato text-xs font-bold text-dashboard-black">
                    {formatCurrency(stage.weightedCommission)}
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-dashboard-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${stageColors[stage.stage] ?? 'bg-dashboard-teal'}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Relationship Reminders — birthdays, anniversaries, personal notes
// ---------------------------------------------------------------------------
const reminderTypeConfig: Record<string, { icon: typeof Cake; label: string; color: string; bgColor: string }> = {
  birthday: { icon: Cake, label: 'dash.relationships.birthday', color: 'text-pink-600', bgColor: 'bg-pink-50' },
  spouse_birthday: { icon: Gift, label: 'dash.relationships.spouseBirthday', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  home_anniversary: { icon: Home, label: 'dash.relationships.homeAnniversary', color: 'text-dashboard-gold', bgColor: 'bg-amber-50' },
};

function RelationshipRemindersSection({
  reminders,
  isLoading,
}: {
  reminders: { today: RelationshipReminder[]; thisWeek: RelationshipReminder[]; totalUpcoming: number } | undefined;
  isLoading: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Today's Personal Touches — takes 3 cols */}
      <div className="lg:col-span-3 bg-white rounded-xl border border-dashboard-border">
        <div className="flex items-center justify-between p-4 border-b border-dashboard-border">
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-pink-500" />
            <h2 className="font-playfair text-lg font-bold text-dashboard-black">{t('dash.relationships.todaysTouches')}</h2>
          </div>
          <span className="font-lato text-[11px] text-dashboard-gold font-medium bg-dashboard-gold/10 px-2.5 py-1 rounded-full">
            {t('dash.relationships.noteGoal')}
          </span>
        </div>
        {isLoading ? (
          <div className="p-4"><SkeletonList count={3} /></div>
        ) : !reminders?.today.length ? (
          <div className="p-6 text-center">
            <CheckCheck size={28} className="mx-auto mb-2 text-status-success" />
            <p className="font-lato text-sm font-medium text-dashboard-black">{t('dash.relationships.empty')}</p>
            <p className="font-lato text-xs text-dashboard-secondary mt-1">{t('dash.relationships.emptyDesc')}</p>
          </div>
        ) : (
          <div className="divide-y divide-dashboard-border">
            {reminders.today.slice(0, 5).map((reminder) => {
              const config = reminderTypeConfig[reminder.type] || reminderTypeConfig.birthday;
              const ReminderIcon = config.icon;
              return (
                <div key={reminder.id} className="flex items-center gap-3 p-3.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.bgColor}`}>
                    <span className={`font-lato text-sm font-bold ${config.color}`}>
                      {reminder.firstName[0]}{reminder.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/dashboard/leads/${reminder.id.split('-')[0]}`} className="font-lato text-sm font-medium text-dashboard-black hover:text-dashboard-gold transition-colors truncate block">
                      {reminder.firstName} {reminder.lastName}
                    </Link>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <ReminderIcon size={12} className={config.color} />
                      <span className="font-lato text-xs text-dashboard-secondary">
                        {t(config.label)}
                        {reminder.yearsCount && reminder.type === 'birthday' && ` · ${t('dash.relationships.turnsAge')} ${reminder.yearsCount}`}
                        {reminder.yearsCount && reminder.type === 'home_anniversary' && ` · ${reminder.yearsCount} ${t('dash.relationships.yearsInHome')}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {reminder.phone && (
                      <a
                        href={`tel:${reminder.phone}`}
                        className="w-8 h-8 rounded-lg bg-dashboard-teal-light flex items-center justify-center hover:bg-dashboard-teal/20 transition-colors"
                        title={t('dash.relationships.call')}
                      >
                        <Phone size={14} className="text-dashboard-teal" />
                      </a>
                    )}
                    <Link
                      to={`/dashboard/leads/${reminder.id.split('-')[0]}`}
                      className="w-8 h-8 rounded-lg bg-dashboard-gold/10 flex items-center justify-center hover:bg-dashboard-gold/20 transition-colors"
                      title={t('dash.relationships.sendNote')}
                    >
                      <Send size={14} className="text-dashboard-gold" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Coming Up This Week — takes 2 cols */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-dashboard-border">
        <div className="flex items-center justify-between p-4 border-b border-dashboard-border">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-dashboard-gold" />
            <h2 className="font-playfair text-lg font-bold text-dashboard-black">{t('dash.relationships.comingUp')}</h2>
            {(reminders?.thisWeek.length ?? 0) > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-dashboard-gold/10 text-dashboard-gold text-xs font-lato font-bold">
                {reminders?.thisWeek.length}
              </span>
            )}
          </div>
        </div>
        {isLoading ? (
          <div className="p-4"><SkeletonList count={3} /></div>
        ) : !reminders?.thisWeek.length ? (
          <div className="p-6 text-center">
            <Calendar size={28} className="mx-auto mb-2 text-dashboard-border" />
            <p className="font-lato text-sm text-dashboard-secondary">{t('dash.relationships.weekEmpty')}</p>
          </div>
        ) : (
          <div className="divide-y divide-dashboard-border max-h-[300px] overflow-y-auto">
            {reminders.thisWeek.slice(0, 8).map((reminder) => {
              const config = reminderTypeConfig[reminder.type] || reminderTypeConfig.birthday;
              const ReminderIcon = config.icon;
              return (
                <Link
                  key={reminder.id}
                  to={`/dashboard/leads/${reminder.id.split('-')[0]}`}
                  className="flex items-center gap-3 p-3 hover:bg-dashboard-surface/50 transition-colors"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${config.bgColor}`}>
                    <ReminderIcon size={14} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-lato text-sm text-dashboard-black truncate">
                      {reminder.firstName} {reminder.lastName}
                    </p>
                    <p className="font-lato text-xs text-dashboard-secondary">{t(config.label)}</p>
                  </div>
                  <span className="font-lato text-xs font-medium text-dashboard-secondary shrink-0">
                    {reminder.displayDate}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardHome() {
  usePageTitle('Command Center');
  const { profile } = useAuth();
  const { t } = useTranslation();
  const firstName = profile?.full_name?.split(' ')[0] || 'Lorena';

  // Core data
  const { data: stats, isLoading: statsLoading } = useOverviewStats();
  const { data: hotLeads, isLoading: hotLoading } = useHotLeads(5);
  const { data: pipelineStats, isLoading: pipelineLoading } = usePipelineStats();
  const { data: dealsSummary } = useDealsSummary();
  const { data: priorityActions, isLoading: actionsLoading } = usePriorityActions();
  const { data: todayShowings, isLoading: showingsLoading } = useTodayShowings();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(8);
  const { data: performance, isLoading: perfLoading } = usePerformanceMetrics();
  const { data: unreadCount } = useUnreadCount();
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const { data: marketSnapshot } = useMarketSnapshot('El Paso', 'city');
  const { data: recentMatchesData } = useRecentMatches(5);
  const { briefing, isLoading: briefingLoading, error: briefingError, refetch: refetchBriefing } = useDailyBriefing();
  const { data: reminders, isLoading: remindersLoading } = useRelationshipReminders();
  const [briefingRefreshing, setBriefingRefreshing] = useState(false);
  const { data: lorenaListings, isLoading: lorenaLoading } = useQuery({
    queryKey: ['lorena-listings'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select(LISTING_PUBLIC_FIELDS)
          .eq('is_lorenas_listing', true)
          .in('status', ['active', 'pending'])
          .order('list_date', { ascending: false })
          .limit(5);
        if (error) throw error;
        return transformListings((data || []) as unknown as ListingRow[]);
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // Realtime subscriptions
  useRealtimeLeads();
  useRealtimeMessages();
  useRealtimeNotifications();
  useRealtimeListings();
  useRealtimeInteractions();

  const [showAllNotifications, setShowAllNotifications] = useState(false);

  const unreadNotifs = (notifications ?? []).filter(n => !n.read);
  const displayNotifs = showAllNotifications ? unreadNotifs : unreadNotifs.slice(0, 3);

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-dashboard-border rounded animate-pulse" />
        <SkeletonStats count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  // Format pipeline value  
  const pipelineValue = dealsSummary?.totalVolume ?? 0;
  const pipelineDisplay = pipelineValue >= 1000000 
    ? `$${(pipelineValue/1000000).toFixed(2)}M`
    : pipelineValue >= 1000 
    ? `$${(pipelineValue/1000).toFixed(0)}K` 
    : `$${pipelineValue}`;

  const statCards = [
    { label: 'Total Leads', value: (performance?.totalLeads ?? 0).toLocaleString(), icon: Users, href: '/dashboard/leads', color: 'text-dashboard-teal bg-dashboard-teal-light', sub: `${stats?.hotLeads ?? 0} hot` },
    { label: 'Hot Leads', value: stats?.hotLeads ?? 0, icon: Flame, href: '/dashboard/leads', color: 'text-score-hot bg-red-50', sub: 'need contact now' },
    { label: 'Messages', value: unreadCount ?? stats?.unreadMessages ?? 0, icon: MessageSquare, href: '/dashboard/messages', color: 'text-emerald-600 bg-emerald-50', sub: 'unread' },
    { label: 'Showings Today', value: stats?.showingsToday ?? 0, icon: Calendar, href: '/dashboard/showings', color: 'text-purple-600 bg-purple-50', sub: 'scheduled' },
    { label: 'Pipeline', value: pipelineDisplay, icon: DollarSign, href: '/dashboard/deals', color: 'text-dashboard-accent bg-amber-50', sub: `${dealsSummary?.totalActive ?? 0} active deals` },
    { label: 'Avg Score', value: performance?.avgScore ?? 0, icon: Target, href: '/dashboard/analytics', color: 'text-blue-600 bg-blue-50', sub: 'lead quality' },
  ];

  const totalPipelineLeads = (pipelineStats ?? []).reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6">
      {/* Smart Greeting Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">
            {t(getGreetingKey())}, {firstName}
          </h1>
          <p className="font-lato text-sm text-dashboard-secondary mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} &middot; El Paso, TX
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {(stats?.hotLeads ?? 0) > 0 && (
            <Link
              to="/dashboard/leads"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-score-hot/10 text-score-hot text-xs font-lato font-medium hover:bg-score-hot/20 transition-colors"
            >
              <Flame size={14} />
              {stats?.hotLeads} hot
            </Link>
          )}
          {(unreadCount ?? 0) > 0 && (
            <Link
              to="/dashboard/messages"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-lato font-medium hover:bg-emerald-200 transition-colors"
            >
              <MessageSquare size={14} />
              {unreadCount} unread
            </Link>
          )}
        </div>
      </div>

      {/* Daily AI Briefing Card */}
      <DailyBriefingCard
        briefing={briefing}
        isLoading={briefingLoading}
        error={briefingError}
        isRefreshing={briefingRefreshing}
        onRefresh={async () => {
          setBriefingRefreshing(true);
          await refetchBriefing();
          setBriefingRefreshing(false);
        }}
      />

      {/* Speed-to-Lead Timer + Smart Action Cards */}
      <SpeedToLeadTimer />
      <SmartActionCards />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            to={stat.href}
            className="bg-white rounded-xl border border-dashboard-border p-3.5 hover:border-dashboard-gold/40 hover:shadow-premium transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-lato text-[11px] text-dashboard-secondary uppercase tracking-wide">{stat.label}</p>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon size={14} />
              </div>
            </div>
            <p className="text-xl font-bold text-dashboard-black group-hover:text-dashboard-gold transition-colors">{stat.value}</p>
            {stat.sub && <p className="text-[11px] text-dashboard-secondary mt-0.5">{stat.sub}</p>}
          </Link>
        ))}
      </div>

      {/* Priority Action Queue + Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Priority Actions — takes 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-dashboard-border">
          <div className="flex items-center justify-between p-4 border-b border-dashboard-border">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-dashboard-accent" />
              <h2 className="font-playfair text-lg font-bold text-dashboard-black">{t('dash.priorityQueue')}</h2>
              {(priorityActions?.length ?? 0) > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-dashboard-accent/10 text-dashboard-accent text-xs font-lato font-bold">
                  {priorityActions?.length}
                </span>
              )}
            </div>
          </div>
          {actionsLoading ? (
            <div className="p-4"><SkeletonList count={4} /></div>
          ) : !priorityActions?.length ? (
            <div className="p-8">
              <EmptyState
                icon={CheckCheck}
                title="{t('dash.allClear')}"
                description={t('dash.allClearDesc')}
              />
            </div>
          ) : (
            <div className="divide-y divide-dashboard-border max-h-[380px] overflow-y-auto">
              {priorityActions.map((action) => {
                const Icon = actionIcons[action.type] ?? AlertCircle;
                return (
                  <Link
                    key={action.id}
                    to={action.leadId ? `/dashboard/leads/${action.leadId}` : '/dashboard/leads'}
                    className={`flex items-start gap-3 p-3.5 border-l-3 hover:bg-dashboard-surface/50 transition-colors ${actionColors[action.priority]}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-dashboard-border flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={15} className={
                        action.priority === 'urgent' ? 'text-score-hot' :
                        action.priority === 'high' ? 'text-dashboard-accent' :
                        'text-dashboard-teal'
                      } />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-lato text-sm font-medium text-dashboard-black truncate">{action.title}</p>
                      <p className="font-lato text-xs text-dashboard-secondary mt-0.5 truncate">{action.subtitle}</p>
                    </div>
                    <span className="font-lato text-[10px] text-dashboard-secondary shrink-0 mt-1">
                      {formatRelativeTime(action.timestamp)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's Schedule — takes 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-dashboard-border">
          <div className="flex items-center justify-between p-4 border-b border-dashboard-border">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-purple-600" />
              <h2 className="font-playfair text-lg font-bold text-dashboard-black">{t('dash.today')}</h2>
            </div>
            <Link to="/dashboard/showings" className="font-lato text-xs text-dashboard-gold hover:underline flex items-center gap-0.5">
              {t('dash.calendar')} <ChevronRight size={14} />
            </Link>
          </div>
          {showingsLoading ? (
            <div className="p-4"><SkeletonList count={3} /></div>
          ) : !todayShowings?.length ? (
            <div className="p-6 text-center">
              <Calendar size={32} className="mx-auto mb-3 text-dashboard-border" />
              <p className="font-lato text-sm text-dashboard-secondary">{t('dash.noShowingsToday')}</p>
              <p className="font-lato text-xs text-dashboard-secondary mt-1">{t('dash.enjoyFreeTime')}</p>
            </div>
          ) : (
            <div className="divide-y divide-dashboard-border">
              {todayShowings.map((showing) => {
                const leadData = (showing as ShowingWithLead).leads;
                return (
                  <div key={showing.id} className="p-3.5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-lato text-xs font-bold text-dashboard-teal bg-dashboard-teal-light px-2 py-0.5 rounded">
                            {showing.start_time.slice(0, 5)}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-lato font-medium ${
                            showing.status === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                          }`}>
                            {showing.status}
                          </span>
                        </div>
                        <p className="font-lato text-sm font-medium text-dashboard-black mt-1.5 truncate">
                          {showing.address}
                        </p>
                        {leadData && (
                          <p className="font-lato text-xs text-dashboard-secondary mt-0.5">
                            with {leadData.first_name} {leadData.last_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Relationship Reminders — birthdays, anniversaries, personal notes */}
      <RelationshipRemindersSection reminders={reminders} isLoading={remindersLoading} />

      {/* MLS Integration Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Widget A: My Active Listings */}
        <div className="bg-white rounded-xl border border-dashboard-border">
          <div className="flex items-center justify-between p-4 border-b border-dashboard-border">
            <div className="flex items-center gap-2">
              <Home size={18} className="text-dashboard-gold" />
              <h2 className="font-playfair text-lg font-bold text-dashboard-black">{t('dash.myListings')}</h2>
            </div>
            <Link to="/properties" className="font-lato text-xs text-dashboard-gold hover:underline flex items-center gap-0.5">
              {t('dash.website')} <ChevronRight size={14} />
            </Link>
          </div>
          {lorenaLoading ? (
            <div className="p-4"><SkeletonList count={3} /></div>
          ) : !lorenaListings?.length ? (
            <div className="p-6 text-center">
              <Home size={28} className="mx-auto mb-2 text-dashboard-border" />
              <p className="font-lato text-sm text-dashboard-secondary">{t('dash.noActiveListings')}</p>
              <p className="font-lato text-xs text-dashboard-secondary mt-1">{t('dash.listingsSync')}</p>
            </div>
          ) : (
            <div className="divide-y divide-dashboard-border">
              {lorenaListings.map((listing) => (
                <a
                  key={listing.id}
                  href={`/property/${listing.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 hover:bg-dashboard-surface/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={listing.images[0] || '/images/properties/home-1.jpg'}
                      alt={listing.address}
                      className="w-full h-full object-cover"
                      width={800}
                      height={600}
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-lato text-sm font-medium text-dashboard-black truncate">{listing.address}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-lato text-xs font-bold text-dashboard-gold">${listing.price.toLocaleString()}</span>
                      <span className="font-lato text-xs text-dashboard-secondary">{listing.beds}bd · {listing.baths}ba · {listing.sqft.toLocaleString()}sf</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-lato font-bold ${
                    listing.status === 'For Sale' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    {listing.status === 'For Sale' ? 'Active' : listing.status}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Widget B: Market Pulse */}
        <div className="bg-white rounded-xl border border-dashboard-border">
          <div className="flex items-center justify-between p-4 border-b border-dashboard-border">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-dashboard-teal" />
              <h2 className="font-playfair text-lg font-bold text-dashboard-black">{t('dash.marketPulse')}</h2>
            </div>
            <Link to="/dashboard/market" className="font-lato text-xs text-dashboard-gold hover:underline flex items-center gap-0.5">
              {t('dash.homePulse')} <ChevronRight size={14} />
            </Link>
          </div>
          {marketSnapshot?.current ? (
            <div className="p-4 space-y-3">
              {[
                { label: 'Active Listings', value: marketSnapshot.current.active_count },
                { label: 'Median Price', value: marketSnapshot.current.median_price ? `$${Number(marketSnapshot.current.median_price).toLocaleString()}` : 'N/A' },
                { label: 'Avg Days on Market', value: `${marketSnapshot.current.avg_dom ?? 0} days` },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="font-lato text-xs text-dashboard-secondary">{stat.label}</span>
                  <span className="font-playfair text-base font-bold text-dashboard-black">{stat.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <BarChart3 size={28} className="mx-auto mb-2 text-dashboard-border" />
              <p className="font-lato text-sm text-dashboard-secondary">{t('dash.noMarketData')}</p>
              <p className="font-lato text-xs text-dashboard-secondary mt-1">{t('dash.dataSyncs')}</p>
            </div>
          )}
        </div>

        {/* Widget C: Recent Matches */}
        <div className="bg-white rounded-xl border border-dashboard-border">
          <div className="flex items-center justify-between p-4 border-b border-dashboard-border">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-purple-600" />
              <h2 className="font-playfair text-lg font-bold text-dashboard-black">{t('dash.recentMatches')}</h2>
            </div>
          </div>
          {!recentMatchesData?.length ? (
            <div className="p-6 text-center">
              <Target size={28} className="mx-auto mb-2 text-dashboard-border" />
              <p className="font-lato text-sm text-dashboard-secondary">{t('dash.noRecentMatches')}</p>
              <p className="font-lato text-xs text-dashboard-secondary mt-1">{t('dash.matchesDesc')}</p>
            </div>
          ) : (
            <div className="divide-y divide-dashboard-border">
              {recentMatchesData.map((match: Record<string, unknown>) => {
                const leads = match.leads as { first_name: string; last_name: string } | null;
                const listings = match.listings as { address: string; list_price: number; primary_photo_url: string | null } | null;
                return (
                  <div key={match.id as string} className="p-3.5">
                    <p className="font-lato text-sm text-dashboard-black">
                      <span className="font-medium">{leads?.first_name} {leads?.last_name?.[0]}.</span>
                      <span className="text-dashboard-secondary"> {t('dash.matchedTo')} </span>
                      <span className="font-medium">{listings?.address}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-lato text-xs text-dashboard-gold font-medium">
                        ${listings?.list_price?.toLocaleString()}
                      </span>
                      <span className="font-lato text-[10px] text-dashboard-secondary">
                        {formatRelativeTime(match.created_at as string)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hot Leads + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hot Leads */}
        <div className="bg-white rounded-xl border border-dashboard-border">
          <div className="flex items-center justify-between p-4 border-b border-dashboard-border">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-score-hot" />
              <h2 className="font-playfair text-lg font-bold text-dashboard-black">{t('dash.hotLeads')}</h2>
            </div>
            <Link to="/dashboard/leads" className="font-lato text-xs text-dashboard-gold hover:underline flex items-center gap-0.5">
              {t('dash.viewAll')} <ChevronRight size={14} />
            </Link>
          </div>
          {hotLoading ? (
            <div className="p-4"><SkeletonList count={4} /></div>
          ) : !hotLeads?.length ? (
            <div className="p-8">
              <EmptyState icon={TrendingUp} title={t('dash.noHotLeads')} description={t('dash.hotLeadsDesc')} />
            </div>
          ) : (
            <div className="divide-y divide-dashboard-border">
              {hotLeads.map((lead) => (
                <Link key={lead.id} to={`/dashboard/leads/${lead.id}`} className="flex items-center gap-3 p-3.5 hover:bg-dashboard-surface/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-score-hot/10 flex items-center justify-center shrink-0">
                    <span className="font-lato text-sm font-bold text-score-hot">{lead.first_name[0]}{lead.last_name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-lato text-sm font-medium text-dashboard-black truncate">{lead.first_name} {lead.last_name}</p>
                    <p className="font-lato text-xs text-dashboard-secondary truncate">
                      {lead.status.replace(/_/g, ' ')}{lead.timeline ? ` \u00B7 ${lead.timeline}` : ''}
                      {lead.budget_max ? ` \u00B7 ${formatCurrency(lead.budget_max)}` : ''}
                    </p>
                  </div>
                  <LeadScoreBadge score={lead.score} size="sm" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-xl border border-dashboard-border">
          <div className="flex items-center justify-between p-4 border-b border-dashboard-border">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-dashboard-gold" />
              <h2 className="font-playfair text-lg font-bold text-dashboard-black">{t('dash.activityFeed')}</h2>
            </div>
            <Link to="/dashboard/analytics" className="font-lato text-xs text-dashboard-gold hover:underline flex items-center gap-0.5">
              {t('dash.analytics')} <ChevronRight size={14} />
            </Link>
          </div>
          {activityLoading ? (
            <div className="p-4"><SkeletonList count={5} /></div>
          ) : !recentActivity?.length ? (
            <div className="p-8">
              <EmptyState icon={Zap} title={t('dash.noActivityYet')} description={t('dash.activityDesc')} />
            </div>
          ) : (
            <div className="divide-y divide-dashboard-border max-h-[380px] overflow-y-auto">
              {recentActivity.map((item) => {
                const Icon = activityIcons[item.action] ?? Zap;
                return (
                  <Link key={item.id} to={`/dashboard/leads/${item.leadId}`} className="flex items-start gap-3 p-3.5 hover:bg-dashboard-surface/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-dashboard-surface flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={14} className="text-dashboard-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-lato text-sm text-dashboard-black">
                        <span className="font-medium">{item.leadName}</span>
                        <span className="text-dashboard-secondary"> &middot; </span>
                        <span className="text-dashboard-secondary">{activityLabels[item.action] ?? item.action.replace(/_/g, ' ')}</span>
                      </p>
                      {item.points !== 0 && (
                        <span className={`font-lato text-xs font-medium ${item.points > 0 ? 'text-status-success' : 'text-score-hot'}`}>
                          {item.points > 0 ? '+' : ''}{item.points} pts
                        </span>
                      )}
                    </div>
                    <span className="font-lato text-[10px] text-dashboard-secondary shrink-0">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline + Deals Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Pipeline Snapshot */}
        <div className="bg-white rounded-xl border border-dashboard-border">
          <div className="flex items-center justify-between p-4 border-b border-dashboard-border">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-dashboard-teal" />
              <h2 className="font-playfair text-lg font-bold text-dashboard-black">{t('dash.pipeline')}</h2>
              <span className="font-lato text-xs text-dashboard-secondary">({totalPipelineLeads} leads)</span>
            </div>
            <Link to="/dashboard/leads" className="font-lato text-xs text-dashboard-gold hover:underline flex items-center gap-0.5">
              {t('dash.allLeads')} <ChevronRight size={14} />
            </Link>
          </div>
          {pipelineLoading ? (
            <div className="p-4"><SkeletonCard /></div>
          ) : !pipelineStats?.length ? (
            <div className="p-8">
              <EmptyState icon={Users} title={t('dash.noLeadsYet')} description={t('dash.addFirstLead')} />
            </div>
          ) : (
            <div className="p-4 flex items-center gap-4">
              {/* Donut chart */}
              <div className="w-32 h-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pipelineStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      dataKey="count"
                      strokeWidth={2}
                      stroke="#FAFAF5"
                    >
                      {pipelineStats.map((entry) => (
                        <Cell key={entry.status} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={((value: number, _name: string, props: { payload: { label: string } }) =>
                        [`${value} leads`, props.payload.label]
                      ) as never}
                      contentStyle={{
                        fontSize: '12px',
                        fontFamily: 'Lato, sans-serif',
                        borderRadius: '8px',
                        border: '1px solid #E5E5E0',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {pipelineStats.slice(0, 8).map((stat) => (
                  <div key={stat.status} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stat.color }} />
                    <span className="font-lato text-xs text-dashboard-body truncate">{stat.label}</span>
                    <span className="font-lato text-xs font-bold text-dashboard-black ml-auto">{stat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Commission Forecast — weighted pipeline projection */}
        <CommissionForecastWidget />

        {/* Cold Lead Reactivation Campaign */}
        <ReactivationModule />
      </div>

      {/* Performance Metrics */}
      {!perfLoading && performance && (
        <div className="bg-white rounded-xl border border-dashboard-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-dashboard-teal" />
            <h2 className="font-playfair text-lg font-bold text-dashboard-black">{t('dash.performance')}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="font-playfair text-2xl font-bold text-dashboard-black">{performance.hotLeadsPct}%</p>
              <p className="font-lato text-xs text-dashboard-secondary mt-1">{t('dash.hotLeadRate')}</p>
            </div>
            <div className="text-center">
              <p className="font-playfair text-2xl font-bold text-dashboard-black">{performance.closedThisMonth}</p>
              <p className="font-lato text-xs text-dashboard-secondary mt-1">{t('dash.closedThisMonth')}</p>
            </div>
            <div className="text-center">
              <p className="font-playfair text-2xl font-bold text-dashboard-accent">{formatCurrency(performance.closedVolume)}</p>
              <p className="font-lato text-xs text-dashboard-secondary mt-1">{t('dash.closedVolume')}</p>
            </div>
            <div className="text-center">
              <p className="font-playfair text-2xl font-bold text-dashboard-teal">{performance.activeSequences}</p>
              <p className="font-lato text-xs text-dashboard-secondary mt-1">{t('dash.activeSequences')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {unreadNotifs.length > 0 && (
        <div className="bg-white rounded-xl border border-dashboard-border">
          <div className="flex items-center justify-between p-4 border-b border-dashboard-border">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-dashboard-gold" />
              <h2 className="font-playfair text-lg font-bold text-dashboard-black">{t('dash.notifications')} ({unreadNotifs.length})</h2>
            </div>
            <div className="flex items-center gap-3">
              {unreadNotifs.length > 3 && (
                <button onClick={() => setShowAllNotifications(!showAllNotifications)} className="font-lato text-xs text-dashboard-gold hover:underline">
                  {showAllNotifications ? t('dash.showLess') : t('dash.showAll')}
                </button>
              )}
              <button onClick={() => markAllRead.mutate()} className="font-lato text-xs text-dashboard-secondary hover:text-dashboard-gold flex items-center gap-1">
                <CheckCheck size={12} /> {t('dash.markAllRead')}
              </button>
            </div>
          </div>
          <div className="divide-y divide-dashboard-border">
            {displayNotifs.map((notif) => (
              <div key={notif.id} className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-lato text-sm font-medium text-dashboard-black">{notif.title}</p>
                  <p className="font-lato text-xs text-dashboard-secondary mt-0.5">{notif.message}</p>
                  <p className="font-lato text-xs text-dashboard-secondary mt-1">{formatRelativeTime(notif.created_at)}</p>
                </div>
                <button onClick={() => markRead.mutate(notif.id)} aria-label="Dismiss notification" className="text-dashboard-secondary hover:text-dashboard-body transition-colors shrink-0 p-1">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
