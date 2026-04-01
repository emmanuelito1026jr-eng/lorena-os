import { useState } from 'react';
import { Modal, inputClass, labelClass } from '../../shared/Modal';
import { showToast } from '../../shared/Toast';
import { useCreateDeal } from '../../../hooks/useDeals';
import { useLeads } from '../../../hooks/useLeads';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from '../../../lib/i18n/LanguageContext';
import type { DealStage, DealType } from '../../../lib/supabase/database.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const STAGE_OPTIONS: { value: DealStage; label: string }[] = [
  { value: 'pre_listing', label: 'Pre-Listing' },
  { value: 'active_listing', label: 'Active Listing' },
  { value: 'under_contract', label: 'Under Contract' },
  { value: 'pending', label: 'Pending' },
  { value: 'closed', label: 'Closed' },
];

const DEAL_TYPE_OPTIONS: { value: DealType; label: string }[] = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'dual', label: 'Dual' },
];

export function CreateDealModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const createDeal = useCreateDeal();
  const { data: leads } = useLeads();

  const [leadId, setLeadId] = useState('');
  const [dealType, setDealType] = useState<DealType>('buyer');
  const [stage, setStage] = useState<DealStage>('pre_listing');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [listPrice, setListPrice] = useState('');
  const [commissionRate, setCommissionRate] = useState('3');
  const [estimatedCloseDate, setEstimatedCloseDate] = useState('');

  const resetForm = () => {
    setLeadId('');
    setDealType('buyer');
    setStage('pre_listing');
    setPropertyAddress('');
    setListPrice('');
    setCommissionRate('3');
    setEstimatedCloseDate('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !user) return;

    createDeal.mutate(
      {
        lead_id: leadId,
        agent_id: user.id,
        deal_type: dealType,
        stage,
        property_address: propertyAddress || null,
        list_price: listPrice ? Number(listPrice) : null,
        commission_rate: commissionRate ? Number(commissionRate) : 3,
        estimated_close_date: estimatedCloseDate || null,
      },
      {
        onSuccess: () => {
          showToast(t('deals.dealCreated'), 'success');
          resetForm();
          onClose();
        },
        onError: () => {
          showToast(t('deals.dealCreateError'), 'error');
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('deals.addDeal')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Lead Selection */}
        <div>
          <label htmlFor="deal-lead" className={labelClass}>{t('deals.selectLead')} *</label>
          <select
            id="deal-lead"
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            className={inputClass}
            required
          >
            <option value="">{t('deals.chooseLead')}</option>
            {leads?.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.first_name} {lead.last_name} — {lead.email || lead.phone || 'No contact'}
              </option>
            ))}
          </select>
        </div>

        {/* Deal Type */}
        <div>
          <label htmlFor="deal-type" className={labelClass}>{t('deals.type')} *</label>
          <select
            id="deal-type"
            value={dealType}
            onChange={(e) => setDealType(e.target.value as DealType)}
            className={inputClass}
          >
            {DEAL_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Property Address */}
        <div>
          <label htmlFor="deal-address" className={labelClass}>{t('deals.property')}</label>
          <input
            id="deal-address"
            type="text"
            value={propertyAddress}
            onChange={(e) => setPropertyAddress(e.target.value)}
            placeholder="123 Mesa St, El Paso, TX"
            className={inputClass}
          />
        </div>

        {/* Price + Commission Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="deal-price" className={labelClass}>{t('deals.price')}</label>
            <input
              id="deal-price"
              type="number"
              value={listPrice}
              onChange={(e) => setListPrice(e.target.value)}
              placeholder="250000"
              min="0"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="deal-commission" className={labelClass}>{t('deals.commissionRate')}</label>
            <input
              id="deal-commission"
              type="number"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              placeholder="3"
              min="0"
              max="10"
              step="0.1"
              className={inputClass}
            />
          </div>
        </div>

        {/* Stage + Close Date Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="deal-stage" className={labelClass}>{t('deals.stage')}</label>
            <select
              id="deal-stage"
              value={stage}
              onChange={(e) => setStage(e.target.value as DealStage)}
              className={inputClass}
            >
              {STAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="deal-close" className={labelClass}>{t('deals.close')}</label>
            <input
              id="deal-close"
              type="date"
              value={estimatedCloseDate}
              onChange={(e) => setEstimatedCloseDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 font-lato text-sm font-medium text-dashboard-secondary hover:text-dashboard-body transition-colors min-h-[44px]"
          >
            {t('deals.cancel')}
          </button>
          <button
            type="submit"
            disabled={!leadId || createDeal.isPending}
            className="px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] disabled:opacity-50 text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
          >
            {createDeal.isPending ? t('deals.creating') : t('deals.createDeal')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
