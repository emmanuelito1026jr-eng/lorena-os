import { useState } from 'react';
import { Shield, MapPin, Calendar, DollarSign, Users, Phone, Mail, Plus, ChevronDown, Star } from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';
import { supabase } from '../../lib/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showToast } from '../../components/shared/Toast';
import { format } from 'date-fns';

interface MilitaryLead {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  score: number;
  status: string;
  tags: string[] | null;
  notes: string | null;
  custom_fields: Record<string, unknown> | null;
  created_at: string;
  last_activity: string | null;
}

// PCS pipeline stages
const PCS_STAGES = [
  { id: 'pcs_inquiry', label: 'Initial Inquiry', color: '#6366f1', description: 'Reached out, gathering info' },
  { id: 'pcs_orders', label: 'Orders Received', color: '#f59e0b', description: 'Has official PCS orders' },
  { id: 'pcs_searching', label: 'Actively Searching', color: '#3b82f6', description: 'Touring homes' },
  { id: 'pcs_under_contract', label: 'Under Contract', color: '#8b5cf6', description: 'Offer accepted' },
  { id: 'pcs_closed', label: 'Closed', color: '#10b981', description: 'Keys handed over' },
];

const VA_LOAN_STATUS = ['Pre-approved', 'In process', 'Not started', 'Conventional instead'];
const BASE_ASSIGNMENTS = ['Fort Bliss – 1st Armored Division', 'Fort Bliss – Air Defense Artillery', 'Fort Bliss – WSMR', 'Fort Bliss – JBLM', 'Biggs Army Airfield', 'Other'];

function AddMilitaryLeadModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', email: '',
    pcs_stage: 'pcs_inquiry', arrival_month: '', va_status: 'Not started',
    base_assignment: 'Fort Bliss – 1st Armored Division',
    family_size: '2', budget_min: '200000', budget_max: '350000', notes: ''
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.first_name || !form.last_name) return showToast('Name required', 'error');
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('leads').insert({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone || null,
        email: form.email || null,
        agent_id: user?.id,
        source: 'military_referral',
        status: 'new_lead',
        score: 75,
        tags: ['Fort Bliss', 'Military', 'PCS', form.pcs_stage],
        budget_min: parseInt(form.budget_min),
        budget_max: parseInt(form.budget_max),
        notes: form.notes || null,
        custom_fields: {
          pcs_stage: form.pcs_stage,
          arrival_month: form.arrival_month,
          va_loan_status: form.va_status,
          base_assignment: form.base_assignment,
          family_size: parseInt(form.family_size),
          military_lead: true,
        }
      });
      if (error) throw error;
      showToast('Military lead added successfully');
      queryClient.invalidateQueries({ queryKey: ['military-leads'] });
      onClose();
    } catch (e) {
      showToast('Failed to add lead', 'error');
    } finally {
      setSaving(false);
    }
  };

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-green-600" />
            </div>
            <h3 className="font-playfair font-bold text-dashboard-black">Add Military Lead</h3>
          </div>
          <button onClick={onClose} className="text-dashboard-secondary hover:text-dashboard-black text-xl">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-lato text-xs text-dashboard-secondary mb-1">First Name *</label>
              <input value={form.first_name} onChange={e => f('first_name', e.target.value)} className="w-full border border-dashboard-border rounded-lg px-3 py-2 font-lato text-sm focus:outline-none focus:border-dashboard-gold" />
            </div>
            <div>
              <label className="block font-lato text-xs text-dashboard-secondary mb-1">Last Name *</label>
              <input value={form.last_name} onChange={e => f('last_name', e.target.value)} className="w-full border border-dashboard-border rounded-lg px-3 py-2 font-lato text-sm focus:outline-none focus:border-dashboard-gold" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-lato text-xs text-dashboard-secondary mb-1">Phone</label>
              <input value={form.phone} onChange={e => f('phone', e.target.value)} className="w-full border border-dashboard-border rounded-lg px-3 py-2 font-lato text-sm focus:outline-none focus:border-dashboard-gold" />
            </div>
            <div>
              <label className="block font-lato text-xs text-dashboard-secondary mb-1">Email</label>
              <input value={form.email} onChange={e => f('email', e.target.value)} className="w-full border border-dashboard-border rounded-lg px-3 py-2 font-lato text-sm focus:outline-none focus:border-dashboard-gold" />
            </div>
          </div>
          <div>
            <label className="block font-lato text-xs text-dashboard-secondary mb-1">Base Assignment</label>
            <select value={form.base_assignment} onChange={e => f('base_assignment', e.target.value)} className="w-full border border-dashboard-border rounded-lg px-3 py-2 font-lato text-sm focus:outline-none focus:border-dashboard-gold">
              {BASE_ASSIGNMENTS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-lato text-xs text-dashboard-secondary mb-1">VA Loan Status</label>
              <select value={form.va_status} onChange={e => f('va_status', e.target.value)} className="w-full border border-dashboard-border rounded-lg px-3 py-2 font-lato text-sm focus:outline-none focus:border-dashboard-gold">
                {VA_LOAN_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-lato text-xs text-dashboard-secondary mb-1">PCS Arrival Month</label>
              <input type="month" value={form.arrival_month} onChange={e => f('arrival_month', e.target.value)} className="w-full border border-dashboard-border rounded-lg px-3 py-2 font-lato text-sm focus:outline-none focus:border-dashboard-gold" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-lato text-xs text-dashboard-secondary mb-1">Budget Min</label>
              <input type="number" value={form.budget_min} onChange={e => f('budget_min', e.target.value)} className="w-full border border-dashboard-border rounded-lg px-3 py-2 font-lato text-sm focus:outline-none focus:border-dashboard-gold" />
            </div>
            <div>
              <label className="block font-lato text-xs text-dashboard-secondary mb-1">Budget Max</label>
              <input type="number" value={form.budget_max} onChange={e => f('budget_max', e.target.value)} className="w-full border border-dashboard-border rounded-lg px-3 py-2 font-lato text-sm focus:outline-none focus:border-dashboard-gold" />
            </div>
          </div>
          <div>
            <label className="block font-lato text-xs text-dashboard-secondary mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={3} className="w-full border border-dashboard-border rounded-lg px-3 py-2 font-lato text-sm focus:outline-none focus:border-dashboard-gold resize-none" placeholder="PCS orders date, unit, any special requirements..." />
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button onClick={save} disabled={saving} className="flex-1 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm py-2.5 rounded-lg transition-colors">
            {saving ? 'Adding...' : 'Add Military Lead'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-lg font-lato text-sm text-dashboard-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function Military() {
  usePageTitle('Military Pipeline');
  const { t } = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);

  const { data: rawMilitaryData = [], isLoading } = useQuery<MilitaryLead[]>({
    queryKey: ['military-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .contains('tags', ['Military'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MilitaryLead[];
    },
  });
  const militaryLeads: MilitaryLead[] = Array.isArray(rawMilitaryData) ? rawMilitaryData : [];

  const getPCSStage = (lead: MilitaryLead) => {
    const cf = lead.custom_fields as Record<string, string> | null;
    return cf?.pcs_stage ?? 'pcs_inquiry';
  };

  const getArrivalMonth = (lead: MilitaryLead) => {
    const cf = lead.custom_fields as Record<string, string> | null;
    return cf?.arrival_month ?? null;
  };

  const getVAStatus = (lead: MilitaryLead) => {
    const cf = lead.custom_fields as Record<string, string> | null;
    return cf?.va_loan_status ?? 'Not started';
  };

  const leadsByStage = PCS_STAGES.reduce((acc, stage) => {
    acc[stage.id] = militaryLeads.filter(l => getPCSStage(l) === stage.id);
    return acc;
  }, {} as Record<string, MilitaryLead[]>);

  const arrivingThisMonth = militaryLeads.filter(l => {
    const arrival = getArrivalMonth(l);
    if (!arrival) return false;
    const now = new Date();
    return arrival.startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }).length;

  const vaPreApproved = militaryLeads.filter(l => getVAStatus(l) === 'Pre-approved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-dashboard-black">Military Pipeline</h1>
          <p className="font-lato text-sm text-dashboard-secondary mt-1">Fort Bliss PCS — VA loan ready buyers</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors">
          <Plus size={16} /> Add Military Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-dashboard-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-green-600" />
            <span className="font-lato text-xs text-dashboard-secondary uppercase tracking-wide">Total Military</span>
          </div>
          <p className="font-playfair text-2xl font-bold text-dashboard-black">{militaryLeads.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-dashboard-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-blue-600" />
            <span className="font-lato text-xs text-dashboard-secondary uppercase tracking-wide">Arriving This Month</span>
          </div>
          <p className="font-playfair text-2xl font-bold text-dashboard-black">{arrivingThisMonth}</p>
        </div>
        <div className="bg-white rounded-xl border border-dashboard-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Star size={16} className="text-dashboard-gold" />
            <span className="font-lato text-xs text-dashboard-secondary uppercase tracking-wide">VA Pre-Approved</span>
          </div>
          <p className="font-playfair text-2xl font-bold text-dashboard-black">{vaPreApproved}</p>
        </div>
        <div className="bg-white rounded-xl border border-dashboard-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-dashboard-gold" />
            <span className="font-lato text-xs text-dashboard-secondary uppercase tracking-wide">Est. Commission</span>
          </div>
          <p className="font-playfair text-2xl font-bold text-dashboard-black">
            ${Math.round(militaryLeads.length * 275000 * 0.03 * 0.15 / 1000)}K
          </p>
        </div>
      </div>

      {/* PCS Kanban */}
      {militaryLeads.length === 0 && !isLoading ? (
        <div className="bg-white rounded-xl border border-dashboard-border p-12 text-center">
          <Shield size={40} className="text-dashboard-border mx-auto mb-4" />
          <h3 className="font-playfair font-bold text-dashboard-black mb-2">No military leads yet</h3>
          <p className="font-lato text-sm text-dashboard-secondary mb-4">Start capturing Fort Bliss PCS leads to build your military pipeline</p>
          <button onClick={() => setShowAdd(true)} className="px-6 py-2.5 bg-dashboard-gold text-white font-lato font-medium text-sm rounded-lg">
            Add First Military Lead
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-2">
            {PCS_STAGES.map(stage => {
              const leads = leadsByStage[stage.id] ?? [];
              return (
                <div key={stage.id} className="w-64 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                        <span className="font-lato text-xs font-semibold text-dashboard-black uppercase tracking-wide">{stage.label}</span>
                      </div>
                      <p className="font-lato text-[10px] text-dashboard-secondary mt-0.5 ml-4">{stage.description}</p>
                    </div>
                    <span className="font-lato text-xs font-bold text-dashboard-secondary">{leads.length}</span>
                  </div>
                  <div className="space-y-2">
                    {leads.map(lead => {
                      const arrival = getArrivalMonth(lead);
                      const va = getVAStatus(lead);
                      return (
                        <div key={lead.id} className="bg-white rounded-lg border border-dashboard-border p-3 hover:border-dashboard-gold transition-colors cursor-pointer">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-lato text-sm font-semibold text-dashboard-black">{lead.first_name} {lead.last_name}</p>
                            <span className="font-lato text-[10px] px-1.5 py-0.5 rounded" style={{ background: stage.color + '20', color: stage.color }}>{lead.score}</span>
                          </div>
                          {arrival && (
                            <div className="flex items-center gap-1 mb-1">
                              <Calendar size={10} className="text-blue-500" />
                              <span className="font-lato text-[11px] text-dashboard-secondary">PCS: {format(new Date(arrival + '-01'), 'MMM yyyy')}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 mb-1">
                            <Shield size={10} className={va === 'Pre-approved' ? 'text-green-600' : 'text-dashboard-secondary'} />
                            <span className={`font-lato text-[11px] ${va === 'Pre-approved' ? 'text-green-600 font-semibold' : 'text-dashboard-secondary'}`}>VA: {va}</span>
                          </div>
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className="flex items-center gap-1 mt-1.5">
                              <Phone size={10} className="text-dashboard-gold" />
                              <span className="font-lato text-[11px] text-dashboard-gold">{lead.phone}</span>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAdd && <AddMilitaryLeadModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
