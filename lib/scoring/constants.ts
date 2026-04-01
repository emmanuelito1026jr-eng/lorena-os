export type ActionType =
  | 'login'
  | 'property_view'
  | 'property_favorite'
  | 'search_save'
  | 'showing_request'
  | 'message_sent'
  | 'home_valuation'
  | 'email_open'
  | 'email_click'
  | 'session_5_plus'
  | 'return_visit'
  | 'ai_sms_reply'
  | 'chatbot_complete'
  | 'chatbot_handoff'
  | 'ai_sms_handoff'
  | 'showing_attended'
  | 'inactive_7d'
  | 'inactive_14d'
  | 'inactive_30d'
  | 'showing_missed'
  | 'email_bounce'
  | 'sms_opt_out';

export const SCORING_TABLE: Record<ActionType, number> = {
  // Engagement (+)
  login: 5,
  property_view: 2,         // +5 if same property 3x
  property_favorite: 5,
  search_save: 10,
  session_5_plus: 10,
  return_visit: 8,
  email_open: 2,
  email_click: 5,

  // Intent (+)
  showing_request: 20,
  message_sent: 10,
  home_valuation: 15,
  ai_sms_reply: 15,
  chatbot_complete: 15,
  chatbot_handoff: 20,
  ai_sms_handoff: 20,
  showing_attended: 15,

  // Decay (-)
  inactive_7d: -10,
  inactive_14d: -15,
  inactive_30d: -25,

  // Risk (-)
  showing_missed: -5,
  email_bounce: -5,
  sms_opt_out: -15,
};

export const SCORE_MIN = 0;
export const SCORE_MAX = 100;
export const HOT_THRESHOLD = 80;
export const WARM_THRESHOLD = 50;
export const COOL_THRESHOLD = 20;
export const ALERT_THRESHOLD = 70;       // Triggers Lorena notification
export const REENGAGE_THRESHOLD = 30;    // Triggers re-engagement sequence

export type ScoreCategory = 'Engagement' | 'Interest' | 'Intent' | 'Decay' | 'Risk';

export const ACTION_CATEGORIES: Record<ActionType, ScoreCategory> = {
  login: 'Engagement',
  property_view: 'Engagement',
  property_favorite: 'Interest',
  search_save: 'Interest',
  session_5_plus: 'Engagement',
  return_visit: 'Engagement',
  email_open: 'Engagement',
  email_click: 'Engagement',
  showing_request: 'Intent',
  message_sent: 'Intent',
  home_valuation: 'Intent',
  ai_sms_reply: 'Intent',
  chatbot_complete: 'Interest',
  chatbot_handoff: 'Intent',
  ai_sms_handoff: 'Intent',
  showing_attended: 'Intent',
  inactive_7d: 'Decay',
  inactive_14d: 'Decay',
  inactive_30d: 'Decay',
  showing_missed: 'Risk',
  email_bounce: 'Risk',
  sms_opt_out: 'Risk',
};
