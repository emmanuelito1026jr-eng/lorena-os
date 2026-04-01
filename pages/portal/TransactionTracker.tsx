import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, CheckCircle, Circle, MessageSquare } from 'lucide-react';
import { useClientTransaction, DEAL_STAGES } from '../../hooks/portal/useClientTransaction';
import { SkeletonCard } from '../../components/shared/Skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';

const BUYER_CHECKLIST_KEYS = [
  'portal.transaction.buyerStep1',
  'portal.transaction.buyerStep2',
  'portal.transaction.buyerStep3',
  'portal.transaction.buyerStep4',
  'portal.transaction.buyerStep5',
  'portal.transaction.buyerStep6',
  'portal.transaction.buyerStep7',
  'portal.transaction.buyerStep8',
  'portal.transaction.buyerStep9',
];

const SELLER_CHECKLIST_KEYS = [
  'portal.transaction.sellerStep1',
  'portal.transaction.sellerStep2',
  'portal.transaction.sellerStep3',
  'portal.transaction.sellerStep4',
  'portal.transaction.sellerStep5',
  'portal.transaction.sellerStep6',
  'portal.transaction.sellerStep7',
  'portal.transaction.sellerStep8',
  'portal.transaction.sellerStep9',
  'portal.transaction.sellerStep10',
];

export default function TransactionTracker() {
  usePageTitle('My Transaction');
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: deal, isLoading } = useClientTransaction();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-dashboard-border rounded animate-pulse w-48" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="space-y-6">
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">{t('portal.transaction.title')}</h1>
        <EmptyState
          icon={ClipboardList}
          title={t('portal.transaction.emptyTitle')}
          description={t('portal.transaction.emptyDesc')}
          actionLabel={t('portal.home.messageLorena')}
          onAction={() => { navigate('/portal/messages'); }}
        />
      </div>
    );
  }

  const currentStageIdx = DEAL_STAGES.findIndex(s => s.key === deal.stage);
  const isSeller = deal.deal_type === 'seller';
  const checklistKeys = isSeller ? SELLER_CHECKLIST_KEYS : BUYER_CHECKLIST_KEYS;
  // Approximate checklist progress from stage
  const checklistProgress = Math.min(checklistKeys.length, Math.round((currentStageIdx / DEAL_STAGES.length) * checklistKeys.length) + 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">{t('portal.transaction.title')}</h1>
        <p className="font-lato text-sm text-dashboard-secondary mt-1">
          {deal.deal_type === 'buyer' ? t('portal.transaction.buying') : deal.deal_type === 'seller' ? t('portal.transaction.selling') : t('portal.transaction.buyingAndSelling')}
          {deal.property_address ? ` — ${deal.property_address}` : ''}
        </p>
      </div>

      {/* Stage stepper */}
      <div className="bg-white rounded-xl border border-dashboard-border p-6">
        <h2 className="font-playfair text-lg font-bold text-dashboard-black mb-6">{t('portal.transaction.progress')}</h2>
        <div className="space-y-0">
          {DEAL_STAGES.map((stage, i) => {
            const isPast = i < currentStageIdx;
            const isCurrent = i === currentStageIdx;
            return (
              <div key={stage.key} className="flex items-start gap-4">
                {/* Vertical line + dot */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isPast ? 'bg-green-500 text-white' : isCurrent ? 'bg-dashboard-gold text-white ring-4 ring-dashboard-gold/20' : 'bg-dashboard-border text-dashboard-secondary'
                  }`}>
                    {isPast ? <CheckCircle size={16} /> : <Circle size={16} />}
                  </div>
                  {i < DEAL_STAGES.length - 1 && (
                    <div className={`w-0.5 h-10 ${isPast ? 'bg-green-500' : 'bg-dashboard-border'}`} />
                  )}
                </div>
                <div className="pb-6">
                  <p className={`font-lato text-sm font-medium ${isCurrent ? 'text-dashboard-gold' : isPast ? 'text-green-700' : 'text-dashboard-secondary'}`}>
                    {stage.label}
                  </p>
                  {isCurrent && deal.notes && (
                    <p className="font-lato text-xs text-dashboard-secondary mt-1">{deal.notes}</p>
                  )}
                  {isCurrent && deal.estimated_close_date && (
                    <p className="font-lato text-xs text-dashboard-secondary mt-0.5">
                      {t('portal.transaction.estClose')}: {new Date(deal.estimated_close_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deal details */}
      <div className="bg-white rounded-xl border border-dashboard-border p-6">
        <h2 className="font-playfair text-lg font-bold text-dashboard-black mb-4">{t('portal.transaction.details')}</h2>
        <div className="grid grid-cols-2 gap-4">
          {deal.property_address && (
            <div>
              <p className="font-lato text-xs text-dashboard-secondary">{t('portal.transaction.property')}</p>
              <p className="font-lato text-sm text-dashboard-body">{deal.property_address}</p>
            </div>
          )}
          {deal.list_price && (
            <div>
              <p className="font-lato text-xs text-dashboard-secondary">{t('portal.transaction.listPrice')}</p>
              <p className="font-lato text-sm text-dashboard-body">${deal.list_price.toLocaleString()}</p>
            </div>
          )}
          {deal.sale_price && (
            <div>
              <p className="font-lato text-xs text-dashboard-secondary">{t('portal.transaction.salePrice')}</p>
              <p className="font-lato text-sm text-dashboard-body">${deal.sale_price.toLocaleString()}</p>
            </div>
          )}
          {deal.estimated_close_date && (
            <div>
              <p className="font-lato text-xs text-dashboard-secondary">{t('portal.transaction.estCloseDate')}</p>
              <p className="font-lato text-sm text-dashboard-body">{new Date(deal.estimated_close_date).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-xl border border-dashboard-border p-6">
        <h2 className="font-playfair text-lg font-bold text-dashboard-black mb-4">
          {isSeller ? t('portal.transaction.sellerChecklist') : t('portal.transaction.buyerChecklist')}
        </h2>
        <div className="space-y-2">
          {checklistKeys.map((key, i) => {
            const done = i < checklistProgress;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                  done ? 'bg-green-500 text-white' : 'border border-dashboard-border'
                }`}>
                  {done && <CheckCircle size={12} />}
                </div>
                <span className={`font-lato text-sm ${done ? 'text-dashboard-body line-through' : 'text-dashboard-body'}`}>
                  {t(key)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact CTA */}
      <Link
        to="/portal/messages"
        className="flex items-center justify-center gap-2 w-full py-3 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
      >
        <MessageSquare size={16} />
        {t('portal.transaction.questionsMessage')}
      </Link>
    </div>
  );
}
