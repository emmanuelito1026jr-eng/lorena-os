import type { Lead } from '../supabase/database.types';
import { HOT_THRESHOLD, WARM_THRESHOLD } from './constants';

interface NextAction {
  action: string;
  reason: string;
  urgency: 'urgent' | 'high' | 'normal';
  icon: 'phone' | 'message' | 'calendar' | 'zap' | 'clock';
}

/**
 * Rule-based "Next Best Action" engine.
 * Checks status, score, last activity, showing history, and enrollments
 * to recommend the single best next action for a lead.
 */
export function getNextBestAction(
  lead: Lead,
  context: {
    showingCount: number;
    enrollmentCount: number;
    messageCount: number;
    lastActivityDaysAgo: number;
  }
): NextAction {
  const { showingCount, enrollmentCount, messageCount, lastActivityDaysAgo } = context;

  // 1. Hot lead going cold — no contact in 2+ days
  if (lead.score >= HOT_THRESHOLD && lastActivityDaysAgo >= 2) {
    return {
      action: 'nextAction.callNow',
      reason: 'nextAction.hotGoingCold',
      urgency: 'urgent',
      icon: 'phone',
    };
  }

  // 2. High engagement but no showing yet
  if (lead.score >= WARM_THRESHOLD && showingCount === 0) {
    return {
      action: 'nextAction.scheduleShowing',
      reason: 'nextAction.highEngagement',
      urgency: 'high',
      icon: 'calendar',
    };
  }

  // 3. Appointment set — confirm details
  if (lead.status === 'appointment_set') {
    return {
      action: 'nextAction.confirmShowing',
      reason: 'nextAction.appointmentSet',
      urgency: 'high',
      icon: 'calendar',
    };
  }

  // 4. New lead — no messages yet
  if (lead.status === 'new_lead' && messageCount === 0) {
    return {
      action: 'nextAction.sendIntro',
      reason: 'nextAction.newNoContact',
      urgency: 'urgent',
      icon: 'message',
    };
  }

  // 5. Inactive for 14+ days — re-engage
  if (lastActivityDaysAgo >= 14 && enrollmentCount === 0) {
    return {
      action: 'nextAction.enrollReactivation',
      reason: 'nextAction.inactive14d',
      urgency: 'normal',
      icon: 'zap',
    };
  }

  // 6. Inactive 7+ days with warm score
  if (lastActivityDaysAgo >= 7 && lead.score >= WARM_THRESHOLD) {
    return {
      action: 'nextAction.followUp',
      reason: 'nextAction.warmInactive',
      urgency: 'high',
      icon: 'phone',
    };
  }

  // 7. Active client — check in
  if (lead.status === 'active_client') {
    return {
      action: 'nextAction.checkIn',
      reason: 'nextAction.activeClient',
      urgency: 'normal',
      icon: 'message',
    };
  }

  // Default: general follow-up
  return {
    action: 'nextAction.generalFollowUp',
    reason: 'nextAction.keepMomentum',
    urgency: 'normal',
    icon: 'clock',
  };
}

export type { NextAction };
