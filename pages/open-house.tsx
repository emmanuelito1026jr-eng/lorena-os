/**
 * /open-house — QR Code Lead Capture
 * Printed at every open house — visitors scan to get property info + auto-enroll in Speed-to-Lead
 * NO AUTH required — public page
 */
import { useState } from 'react';
import { Home, CheckCircle, Phone, MapPin, Star, QrCode } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const LORENA_PHONE = '(915) 500-0573';

export default function OpenHousePage() {
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [saving, setSaving] = useState(false);

  // Get property address from URL param
  const params = new URLSearchParams(window.location.search);
  const propertyAddress = params.get('address') || 'this property';
  const propertyPrice = params.get('price') || '';

  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', email: '', timeline: 'exploring' });

  const copy = {
    en: {
      headline: 'Welcome!',
      sub: `Register to receive property details, pricing, and updates about ${propertyAddress}`,
      cta: 'Get Property Details',
      success_title: 'You\'re registered!',
      success_sub: 'Lorena will follow up with full details shortly.',
    },
    es: {
      headline: '¡Bienvenido!',
      sub: `Regístrate para recibir detalles de la propiedad, precios y actualizaciones sobre ${propertyAddress}`,
      cta: 'Obtener Detalles',
      success_title: '¡Registrado!',
      success_sub: 'Lorena te enviará todos los detalles pronto.',
    },
  };
  const t = copy[lang];

  const submit = async () => {
    if (!form.first_name || !form.phone) return;
    setSaving(true);
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/capture-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name || '(open house)',
          phone: form.phone,
          email: form.email || null,
          source: 'open_house',
          tags: ['Open House', 'In-Person', lang === 'es' ? 'Spanish' : 'English', propertyAddress],
          notes: `Open house visitor: ${propertyAddress}${propertyPrice ? ` (${propertyPrice})` : ''} | Timeline: ${form.timeline}`,
          custom_fields: {
            open_house: true,
            property_address: propertyAddress,
            property_price: propertyPrice,
            visitor_timeline: form.timeline,
            lead_language: lang,
          }
        }),
      });
      setStep('success');
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <div className="bg-[#1a1a1a] text-white pt-8 pb-6 px-4 text-center">
        <div className="flex justify-center gap-2 mb-4">
          <button onClick={() => setLang('en')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${lang==='en' ? 'bg-[#C9A84C] text-white' : 'border border-white/30 text-white/70'}`}>English</button>
          <button onClick={() => setLang('es')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${lang==='es' ? 'bg-[#C9A84C] text-white' : 'border border-white/30 text-white/70'}`}>Español</button>
        </div>
        <QrCode size={32} className="mx-auto mb-3 text-[#C9A84C]" />
        <h1 className="text-2xl font-bold mb-1">{t.headline}</h1>
        {propertyAddress !== 'this property' && (
          <p className="text-sm text-white/80 flex items-center justify-center gap-1.5 mb-2">
            <MapPin size={13} /> {propertyAddress} {propertyPrice && `· ${propertyPrice}`}
          </p>
        )}
        <p className="text-sm text-white/60 max-w-xs mx-auto">{t.sub}</p>
        <div className="flex items-center justify-center gap-1 mt-3">
          {[1,2,3,4,5].map(i => <Star key={i} size={12} className="text-[#C9A84C] fill-[#C9A84C]" />)}
          <span className="text-xs text-white/50 ml-1">Lorena Ontiveros-Ortega · El Paso, TX</span>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-4 py-6">
        {step === 'success' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <h2 className="font-bold text-lg text-gray-900 mb-1">{t.success_title}</h2>
            <p className="text-sm text-gray-600 mb-5">{t.success_sub}</p>
            <a href={`tel:${LORENA_PHONE}`} className="flex items-center justify-center gap-2 w-full py-3 bg-[#C9A84C] text-white rounded-xl font-semibold text-sm">
              <Phone size={16} /> {LORENA_PHONE}
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{lang==='es' ? 'Nombre' : 'First Name'} *</label>
                <input value={form.first_name} onChange={e => f('first_name', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C]" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{lang==='es' ? 'Apellido' : 'Last Name'}</label>
                <input value={form.last_name} onChange={e => f('last_name', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C]" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{lang==='es' ? 'Teléfono' : 'Phone'} *</label>
              <input type="tel" value={form.phone} onChange={e => f('phone', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={e => f('email', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{lang==='es' ? '¿Cuándo planeas comprar?' : 'When are you looking to buy?'}</label>
              <select value={form.timeline} onChange={e => f('timeline', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C]">
                <option value="asap">{lang==='es' ? 'Lo antes posible' : 'ASAP'}</option>
                <option value="1_3_months">{lang==='es' ? '1-3 meses' : '1-3 months'}</option>
                <option value="3_6_months">{lang==='es' ? '3-6 meses' : '3-6 months'}</option>
                <option value="exploring">{lang==='es' ? 'Solo explorando' : 'Just exploring'}</option>
              </select>
            </div>
            <button onClick={submit} disabled={saving || !form.first_name || !form.phone} className="w-full py-3 bg-[#C9A84C] hover:bg-[#B8952F] disabled:bg-gray-200 text-white font-semibold rounded-xl transition-colors text-sm">
              {saving ? '...' : t.cta}
            </button>
            <p className="text-[11px] text-gray-400 text-center">
              {lang==='es' ? 'Lorena te contactará personalmente.' : "Lorena will follow up personally."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
