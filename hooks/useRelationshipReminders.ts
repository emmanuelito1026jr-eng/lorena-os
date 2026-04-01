import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import { format } from 'date-fns';

export interface RelationshipReminder {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  preferredLanguage: string;
  type: 'birthday' | 'spouse_birthday' | 'home_anniversary';
  daysUntil: number;
  displayDate: string;
  yearsCount: number | null;
}

/**
 * Parse CINC date strings like "02/17/1988", "2/9/1982", "9/11/2020"
 * Returns { month, day, year } or null for unparseable strings.
 */
function parseCINCDate(dateStr: unknown): { month: number; day: number; year: number } | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day, year };
}

function getDaysUntil(month: number, day: number): number {
  const now = new Date();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  const thisYear = now.getFullYear();

  let eventDate = new Date(thisYear, month - 1, day);
  const today = new Date(thisYear, todayMonth - 1, todayDay);

  if (eventDate.getTime() < today.getTime()) {
    eventDate = new Date(thisYear + 1, month - 1, day);
  }

  const diffMs = eventDate.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function formatDisplayDate(daysUntil: number, month: number, day: number): string {
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  const thisYear = new Date().getFullYear();
  let eventDate = new Date(thisYear, month - 1, day);
  if (eventDate < new Date(thisYear, new Date().getMonth(), new Date().getDate())) {
    eventDate = new Date(thisYear + 1, month - 1, day);
  }
  return format(eventDate, 'MMM d');
}

function calcYears(parsed: { year: number }, type: string): number | null {
  const thisYear = new Date().getFullYear();
  if (type === 'birthday') return thisYear - parsed.year;
  if (type === 'home_anniversary') return thisYear - parsed.year;
  if (type === 'spouse_birthday') return thisYear - parsed.year;
  return null;
}

interface CustomFields {
  birthday?: unknown;
  spouse_birthday?: unknown;
  home_anniversary?: unknown;
  [key: string]: unknown;
}

const DATE_FIELDS: Array<{ key: keyof CustomFields; type: RelationshipReminder['type'] }> = [
  { key: 'birthday', type: 'birthday' },
  { key: 'spouse_birthday', type: 'spouse_birthday' },
  { key: 'home_anniversary', type: 'home_anniversary' },
];

export function useRelationshipReminders() {
  return useQuery({
    queryKey: ['relationship-reminders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, phone, email, preferred_language, custom_fields')
        .neq('custom_fields', '{}');

      if (error) throw error;

      const reminders: RelationshipReminder[] = [];

      for (const lead of data ?? []) {
        const cf = lead.custom_fields as CustomFields | null;
        if (!cf) continue;

        for (const { key, type } of DATE_FIELDS) {
          const raw = cf[key];
          const parsed = parseCINCDate(raw);
          if (!parsed) continue;

          const daysUntil = getDaysUntil(parsed.month, parsed.day);
          if (daysUntil > 30) continue;

          reminders.push({
            id: `${lead.id}-${type}`,
            firstName: lead.first_name,
            lastName: lead.last_name,
            phone: lead.phone,
            email: lead.email,
            preferredLanguage: lead.preferred_language,
            type,
            daysUntil,
            displayDate: formatDisplayDate(daysUntil, parsed.month, parsed.day),
            yearsCount: calcYears(parsed, type),
          });
        }
      }

      reminders.sort((a, b) => a.daysUntil - b.daysUntil);

      return {
        today: reminders.filter(r => r.daysUntil === 0),
        thisWeek: reminders.filter(r => r.daysUntil > 0 && r.daysUntil <= 7),
        thisMonth: reminders.filter(r => r.daysUntil > 7 && r.daysUntil <= 30),
        totalUpcoming: reminders.length,
      };
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
