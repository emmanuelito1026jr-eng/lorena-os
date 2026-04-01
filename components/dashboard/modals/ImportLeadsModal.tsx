import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, AlertCircle, Check } from 'lucide-react';
import { Modal } from '../../shared/Modal';
import { showToast } from '../../shared/Toast';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import type { InsertTables, LeadSource, LeadStatus } from '../../../lib/supabase/database.types';

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'upload' | 'map' | 'preview' | 'importing' | 'done';

const LEAD_FIELDS = [
  { value: '', label: '— Skip —' },
  { value: 'first_name', label: 'First Name *' },
  { value: 'last_name', label: 'Last Name *' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'source', label: 'Source' },
  { value: 'status', label: 'Status' },
  { value: 'tags', label: 'Tags' },
  { value: 'notes', label: 'Notes' },
  { value: 'preferred_language', label: 'Language' },
  { value: 'preferred_areas', label: 'Areas' },
  { value: 'budget_min', label: 'Budget Min' },
  { value: 'budget_max', label: 'Budget Max' },
];

const FIELD_ALIASES: Record<string, string[]> = {
  first_name: ['first name', 'first', 'nombre', 'given name', 'firstname', 'first_name'],
  last_name: ['last name', 'last', 'apellido', 'surname', 'family name', 'lastname', 'last_name'],
  email: ['email', 'e-mail', 'correo', 'email address'],
  phone: ['phone', 'telephone', 'tel', 'telefono', 'mobile', 'cell', 'phone number'],
  source: ['source', 'lead source', 'fuente', 'origin'],
  status: ['status', 'estado', 'stage'],
  tags: ['tags', 'labels', 'etiquetas', 'categories'],
  notes: ['notes', 'comments', 'notas', 'remarks'],
  preferred_language: ['language', 'idioma', 'lang'],
  preferred_areas: ['areas', 'neighborhoods', 'location', 'zona'],
  budget_min: ['budget min', 'min budget', 'budget low', 'presupuesto min', 'budget_min'],
  budget_max: ['budget max', 'max budget', 'budget high', 'presupuesto max', 'budget_max'],
};

const VALID_SOURCES: LeadSource[] = ['website', 'referral', 'zillow', 'cinc', 'google', 'facebook', 'social', 'open_house', 'cold_call', 'other', 'apollo', 'instantly', 'import'];
const VALID_STATUSES: LeadStatus[] = ['new_lead', 'attempted_contact', 'contacted', 'appointment_set', 'appointment_met', 'active_client', 'pending_client', 'past_client', 'lost'];

function autoMapColumn(header: string): string {
  const lower = header.toLowerCase().trim();
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some(a => a === lower)) return field;
  }
  return '';
}

export function ImportLeadsModal({ isOpen, onClose }: ImportLeadsModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState({ imported: 0, failed: 0 });

  const reset = () => {
    setStep('upload'); setHeaders([]); setRows([]); setMapping({}); setResult({ imported: 0, failed: 0 });
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = (file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data.length || !results.meta.fields?.length) {
          showToast('No data found in CSV', 'error');
          return;
        }
        setHeaders(results.meta.fields);
        setRows(results.data);
        const autoMap: Record<string, string> = {};
        results.meta.fields.forEach(h => { autoMap[h] = autoMapColumn(h); });
        setMapping(autoMap);
        setStep('map');
      },
      error: () => showToast('Failed to parse CSV', 'error'),
    });
  };

  const mappedFields = Object.values(mapping).filter(Boolean);
  const hasFirstName = mappedFields.includes('first_name');
  const hasLastName = mappedFields.includes('last_name');
  const canImport = hasFirstName && hasLastName;

  const buildLeadRow = (row: Record<string, string>): InsertTables<'leads'> | null => {
    const getValue = (field: string) => {
      const csvCol = Object.entries(mapping).find(([, v]) => v === field)?.[0];
      return csvCol ? (row[csvCol]?.trim() || '') : '';
    };

    const firstName = getValue('first_name');
    const lastName = getValue('last_name');
    if (!firstName || !lastName) return null;

    const source = getValue('source').toLowerCase().replace(/\s/g, '_');
    const status = getValue('status').toLowerCase().replace(/\s/g, '_');
    const tags = getValue('tags');
    const areas = getValue('preferred_areas');

    return {
      agent_id: user!.id,
      first_name: firstName,
      last_name: lastName,
      email: getValue('email') || null,
      phone: getValue('phone') || null,
      source: VALID_SOURCES.includes(source as LeadSource) ? (source as LeadSource) : 'other',
      status: VALID_STATUSES.includes(status as LeadStatus) ? (status as LeadStatus) : 'new_lead',
      tags: tags ? tags.split(/[,;]/).map(t => t.trim()).filter(Boolean) : [],
      notes: getValue('notes') || null,
      preferred_language: getValue('preferred_language') || 'en',
      preferred_areas: areas ? areas.split(/[,;]/).map(a => a.trim()).filter(Boolean) : [],
      budget_min: getValue('budget_min') ? Number(getValue('budget_min').replace(/[^0-9.]/g, '')) || null : null,
      budget_max: getValue('budget_max') ? Number(getValue('budget_max').replace(/[^0-9.]/g, '')) || null : null,
      score: 0,
    };
  };

  const handleImport = async () => {
    if (!user) return;
    setStep('importing');
    const leads = rows.map(buildLeadRow).filter((l): l is InsertTables<'leads'> => l !== null);

    let imported = 0;
    let failed = 0;
    const batchSize = 50;

    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      const { error } = await supabase.from('leads').insert(batch);
      if (error) failed += batch.length;
      else imported += batch.length;
    }

    setResult({ imported, failed });
    setStep('done');
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  };

  const previewRows = rows.slice(0, 5);

  const inputClass = 'w-full px-3 py-2 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-body focus:outline-none focus:border-dashboard-gold/50 focus:ring-1 focus:ring-dashboard-gold/20 min-h-[36px]';

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Import Leads from CSV" maxWidth="max-w-3xl">
      <div className="space-y-4">
        {step === 'upload' && (
          <div className="text-center py-8">
            <Upload size={40} className="mx-auto text-dashboard-secondary mb-4" />
            <p className="font-lato text-sm text-dashboard-body mb-4">Upload a CSV file with your contacts.</p>
            <p className="font-lato text-xs text-dashboard-secondary mb-6">Required columns: First Name, Last Name. Optional: Email, Phone, Source, Status, Tags, Notes.</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              className="hidden"
            />
            <button onClick={() => fileRef.current?.click()} className="px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]">
              Choose CSV File
            </button>
          </div>
        )}

        {step === 'map' && (
          <>
            <p className="font-lato text-sm text-dashboard-body">
              Found <span className="font-medium">{rows.length} rows</span> and <span className="font-medium">{headers.length} columns</span>. Map your CSV columns to lead fields:
            </p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {headers.map(h => (
                <div key={h} className="flex items-center gap-3">
                  <span className="font-lato text-sm text-dashboard-body w-40 truncate shrink-0">{h}</span>
                  <span className="text-dashboard-secondary">→</span>
                  <select value={mapping[h] || ''} onChange={(e) => setMapping(prev => ({ ...prev, [h]: e.target.value }))} className={inputClass}>
                    {LEAD_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {!canImport && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-3">
                <AlertCircle size={16} />
                <span className="font-lato text-xs">Map both First Name and Last Name to continue.</span>
              </div>
            )}
            <div className="flex justify-between pt-2">
              <button onClick={reset} className="px-4 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-secondary hover:text-dashboard-body transition-colors min-h-[44px]">Back</button>
              <button onClick={() => setStep('preview')} disabled={!canImport} className="px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] disabled:opacity-50 text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]">
                Preview
              </button>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <p className="font-lato text-sm text-dashboard-body">Preview of first {previewRows.length} rows:</p>
            <div className="overflow-x-auto border border-dashboard-border rounded-lg">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-dashboard-surface">
                    {mappedFields.map(f => (
                      <th key={f} className="px-3 py-2 font-lato text-xs font-medium text-dashboard-secondary capitalize">{f.replace('_', ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => {
                    const mapped = buildLeadRow(row);
                    if (!mapped) return null;
                    return (
                      <tr key={i} className="border-t border-dashboard-border">
                        {mappedFields.map(f => (
                          <td key={f} className="px-3 py-2 font-lato text-xs text-dashboard-body truncate max-w-[150px]">
                            {String((mapped as Record<string, unknown>)[f] ?? '')}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="font-lato text-sm text-dashboard-secondary">
              Ready to import <span className="font-medium text-dashboard-body">{rows.filter(r => buildLeadRow(r) !== null).length}</span> of {rows.length} rows.
            </p>
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep('map')} className="px-4 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-secondary hover:text-dashboard-body transition-colors min-h-[44px]">Back</button>
              <button onClick={handleImport} className="px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]">
                Import {rows.filter(r => buildLeadRow(r) !== null).length} Leads
              </button>
            </div>
          </>
        )}

        {step === 'importing' && (
          <div className="py-12 space-y-4 max-w-xs mx-auto">
            <div className="h-4 bg-dashboard-border rounded animate-pulse" />
            <div className="h-4 bg-dashboard-border rounded animate-pulse w-3/4" />
            <div className="h-4 bg-dashboard-border rounded animate-pulse w-1/2" />
            <p className="font-lato text-sm text-dashboard-secondary text-center mt-6">Importing leads...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <p className="font-lato text-lg font-medium text-dashboard-black">{result.imported} leads imported</p>
            {result.failed > 0 && <p className="font-lato text-sm text-red-500 mt-1">{result.failed} rows failed</p>}
            <button onClick={() => { reset(); onClose(); showToast(`${result.imported} leads imported successfully`); }} className="mt-6 px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]">
              Done
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
