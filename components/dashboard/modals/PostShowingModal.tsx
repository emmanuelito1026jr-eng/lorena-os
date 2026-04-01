import { useState } from 'react';
import { Star } from 'lucide-react';
import { Modal, inputClass, labelClass } from '../../shared/Modal';
import { showToast } from '../../shared/Toast';
import { useUpdateShowing } from '../../../hooks/useShowings';
import { logActivity } from '../../../lib/scoring/log-activity';
import { supabase } from '../../../lib/supabase/client';
import { useTranslation } from '../../../lib/i18n/LanguageContext';
import type { Json } from '../../../lib/supabase/database.types';

interface PostShowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  showingId: string;
  leadId: string;
  leadName: string;
  address: string;
}

const NEXT_ACTIONS = [
  'schedule_second_showing',
  'send_similar_listings',
  'enroll_nurture',
  'not_interested',
] as const;

type NextAction = typeof NEXT_ACTIONS[number];

const NEXT_ACTION_I18N: Record<NextAction, string> = {
  schedule_second_showing: 'showings.feedback.actionSecondShowing',
  send_similar_listings: 'showings.feedback.actionSimilarListings',
  enroll_nurture: 'showings.feedback.actionNurture',
  not_interested: 'showings.feedback.actionNotInterested',
};

export function PostShowingModal({ isOpen, onClose, showingId, leadId, leadName, address }: PostShowingModalProps) {
  const { t } = useTranslation();
  const updateShowing = useUpdateShowing();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState<NextAction | ''>('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast(t('showings.feedback.ratingRequired'), 'error');
      return;
    }
    setSaving(true);

    const feedback: Record<string, unknown> = {
      rating,
      notes: notes.trim() || null,
      next_action: nextAction || null,
      submitted_at: new Date().toISOString(),
    };

    try {
      await updateShowing.mutateAsync({
        id: showingId,
        updates: {
          status: 'completed',
          feedback: feedback as Json,
        },
      });

      // Log showing_attended activity for scoring (+15 points)
      await logActivity(supabase, {
        leadId,
        action: 'showing_attended',
        metadata: { showing_id: showingId, rating, next_action: nextAction || null },
        source: 'post_showing_feedback',
      });

      showToast(t('showings.feedback.saved'));
      resetAndClose();
    } catch {
      showToast(t('showings.feedback.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetAndClose = () => {
    setRating(0);
    setHoveredStar(0);
    setNotes('');
    setNextAction('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title={t('showings.feedback.title')}>
      <div className="space-y-5">
        {/* Context */}
        <div className="bg-dashboard-surface rounded-lg p-3">
          <p className="font-lato text-sm text-dashboard-body">
            <span className="font-medium text-dashboard-black">{leadName}</span>
            <span className="text-dashboard-secondary"> &mdash; </span>
            {address}
          </p>
        </div>

        {/* Star Rating */}
        <div>
          <label className={labelClass}>{t('showings.feedback.howDidItGo')}</label>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center transition-transform hover:scale-110"
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
              >
                <Star
                  size={28}
                  className={`transition-colors ${
                    star <= (hoveredStar || rating)
                      ? 'text-dashboard-gold fill-dashboard-gold'
                      : 'text-dashboard-border'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="font-lato text-sm text-dashboard-secondary ml-2">
                {rating}/5
              </span>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>{t('showings.feedback.notes')}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('showings.feedback.notesPlaceholder')}
            rows={3}
            className={inputClass + ' resize-none !min-h-[80px]'}
          />
        </div>

        {/* Next Action */}
        <div>
          <label className={labelClass}>{t('showings.feedback.nextAction')}</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {NEXT_ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => setNextAction(action === nextAction ? '' : action)}
                className={`px-3 py-2.5 rounded-lg border font-lato text-xs text-left transition-colors min-h-[44px] ${
                  nextAction === action
                    ? 'border-dashboard-gold bg-dashboard-gold/5 text-dashboard-gold font-medium'
                    : 'border-dashboard-border text-dashboard-body hover:border-dashboard-gold/40'
                }`}
              >
                {t(NEXT_ACTION_I18N[action])}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={resetAndClose}
            className="flex-1 px-4 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-secondary hover:text-dashboard-body transition-colors min-h-[44px]"
          >
            {t('showings.feedback.skip')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || rating === 0}
            className="flex-1 px-4 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] text-white rounded-lg font-lato text-sm font-medium transition-colors min-h-[44px] disabled:opacity-50"
          >
            {saving ? t('showings.feedback.saving') : t('showings.feedback.submit')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
