/**
 * /valor — Home Valuation Landing Page
 * Facebook Ad destination: "What's your El Paso home worth?"
 * EN/ES bilingual, auto-captures seller leads via capture-lead edge function
 */
import { useState } from 'react';
import { Home, CheckCircle, Phone, Star } from 'lucide-react';

const LORENA_PHONE = '(915) 500-0573';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export default function ValorPage() {
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', email: '',
    address: '', bedrooms: '3', bathrooms: '2', sqft: '',
    timeline: '3_6_months',
  });

  const copy = {
    en: {
      headline: 'What Is Your El Paso Home Worth?',
      sub: "Get a free, no-obligation home valuation from Lorena Ontiveros-Ortega — El Paso's bilingual real estate expert.",
      cta: 'Get My Free Home Value',
      success_title: 'Request Received!',
      success_sub: 'Lorena will contact you within 24 hours with your personalized home valuation.',
    },
    es: {
      headline: '¿Cuánto Vale Tu Casa en El Paso?',
      sub: 'Obtén una valuación gratuita y sin compromiso de Lorena Ontiveros-Ortega — experta bilingüe en bienes raíces en El Paso.',
      cta: 'Obtener Mi Valuación Gratis',
      success_title: '¡Solicitud Recibida!',
      success_sub: 'Lorena te contactará dentro de 24 horas con la valuación personalizada de tu hogar.',
    }
  };
  const t = copy[lang];

  const submit = async () => {
    if (!form.first_name || !form.phone || !form.address) return;
    setSaving(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/capture-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name || '(seller)',
          phone: form.phone,
          email: form.email || null,
          source: 'facebook_ad',
          tags: ['Seller Lead', 'Home Valuation', 'Facebook Ad', lang === 'es' ? 'Spanish' : 'English'],
          notes: `Home valuation: ${form.address} | ${form.bedrooms}bd/${form.bathrooms}ba | ${form.sqft || '?'} sqft | Timeline: ${form.timeline}`,
          custom_fields: {
            valuation_request: true,
            property_address: form.address,
            bedrooms: form.bedrooms,
            bathrooms: form.bathrooms,
            sqft: form.sqft,
            seller_timeline: form.timeline,
            lead_language: lang,
            facebook_lead: true,
          }
        }),
      });
      if (res.ok) setStep('success');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-2">{t.success_title}</h2>
          <p className="font-lato text-gray-600 mb-6">{t.success_sub}</p>
          <a href={`tel:${LORENA_PHONE}`} className="flex items-center justify-center gap-2 w-full py-3 bg-[#C9A84C] text-white rounded-xl font-lato font-semibold">
            <Phone size={18} /> {LORENA_PHONE}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <div className="bg-[#1a1a1a] text-white py-10 px-4 text-center">
        <div className="flex justify-center gap-2 mb-5">
          <button onClick={() => setLang('en')} className={`px-4 py-1.5 rounded-full text-sm font-lato font-medium transition-colors ${lang==='en' ? 'bg-[#C9A84C] text-white' : 'border border-white/30 text-white/70'}`}>English</button>
          <button onClick={() => setLang('es')} className={`px-4 py-1.5 rounded-full text-sm font-lato font-medium transition-colors ${lang==='es' ? 'bg-[#C9A84C] text-white' : 'border border-white/30 text-white/70'}`}>Español</button>
        </div>
        <Home size={36} className="mx-auto mb-3 text-[#C9A84C]" />
        <h1 className="font-playfair text-2xl sm:text-3xl font-bold mb-3 max-w-md mx-auto leading-tight">{t.headline}</h1>
        <p className="font-lato text-sm text-white/70 max-w-sm mx-auto">{t.sub}</p>
        <div className="flex items-center justify-center gap-1 mt-4">
          {[1,2,3,4,5].map(i => <Star key={i} size={14} className="text-[#C9A84C] fill-[#C9A84C]" />)}
          <span className="font-lato text-xs text-white/60 ml-1">5.0 · El Paso, TX</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-lato text-xs text-gray-500 mb-1 block">{lang==='es' ? 'Nombre' : 'First Name'} *</label>
              <input value={form.first_name} onChange={e => f('first_name', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-lato text-sm focus:outline-none focus:border-[#C9A84C]" />
            </div>
            <div>
              <label className="font-lato text-xs text-gray-500 mb-1 block">{lang==='es' ? 'Apellido' : 'Last Name'}</label>
              <input value={form.last_name} onChange={e => f('last_name', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-lato text-sm focus:outline-none focus:border-[#C9A84C]" />
            </div>
          </div>
          <div>
            <label className="font-lato text-xs text-gray-500 mb-1 block">{lang==='es' ? 'Teléfono' : 'Phone'} *</label>
            <input type="tel" value={form.phone} onChange={e => f('phone', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-lato text-sm focus:outline-none focus:border-[#C9A84C]" />
          </div>
          <div>
            <label className="font-lato text-xs text-gray-500 mb-1 block">Email</label>
            <input type="email" value={form.email} onChange={e => f('email', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-lato text-sm focus:outline-none focus:border-[#C9A84C]" />
          </div>
          <div>
            <label className="font-lato text-xs text-gray-500 mb-1 block">{lang==='es' ? 'Dirección de la propiedad' : 'Property Address'} *</label>
            <input value={form.address} onChange={e => f('address', e.target.value)} placeholder={lang==='es' ? 'Ej: 1234 Calle Mesa, El Paso TX 79912' : 'e.g. 1234 Mesa St, El Paso TX 79912'} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-lato text-sm focus:outline-none focus:border-[#C9A84C]" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-lato text-xs text-gray-500 mb-1 block">{lang==='es' ? 'Cuartos' : 'Beds'}</label>
              <select value={form.bedrooms} onChange={e => f('bedrooms', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-lato text-sm focus:outline-none focus:border-[#C9A84C]">
                {['2','3','4','5','6+'].map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="font-lato text-xs text-gray-500 mb-1 block">{lang==='es' ? 'Baños' : 'Baths'}</label>
              <select value={form.bathrooms} onChange={e => f('bathrooms', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-lato text-sm focus:outline-none focus:border-[#C9A84C]">
                {['1','1.5','2','2.5','3','3+'].map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="font-lato text-xs text-gray-500 mb-1 block">Sq Ft</label>
              <input type="number" value={form.sqft} onChange={e => f('sqft', e.target.value)} placeholder="1800" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-lato text-sm focus:outline-none focus:border-[#C9A84C]" />
            </div>
          </div>
          <div>
            <label className="font-lato text-xs text-gray-500 mb-1 block">{lang==='es' ? '¿Cuándo planeas vender?' : 'When are you looking to sell?'}</label>
            <select value={form.timeline} onChange={e => f('timeline', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-lato text-sm focus:outline-none focus:border-[#C9A84C]">
              <option value="asap">{lang==='es' ? 'Lo antes posible' : 'As soon as possible'}</option>
              <option value="1_3_months">{lang==='es' ? '1-3 meses' : '1-3 months'}</option>
              <option value="3_6_months">{lang==='es' ? '3-6 meses' : '3-6 months'}</option>
              <option value="6_12_months">{lang==='es' ? '6-12 meses' : '6-12 months'}</option>
              <option value="just_curious">{lang==='es' ? 'Solo curiosidad' : 'Just curious'}</option>
            </select>
          </div>
          <button
            onClick={submit}
            disabled={saving || !form.first_name || !form.phone || !form.address}
            className="w-full py-3.5 bg-[#C9A84C] hover:bg-[#B8952F] disabled:bg-gray-200 text-white font-lato font-semibold rounded-xl transition-colors text-sm"
          >
            {saving ? '...' : t.cta}
          </button>
          <p className="font-lato text-[11px] text-gray-400 text-center">
            {lang==='es' ? 'Sin compromiso. Lorena te contactará en 24 horas.' : 'No obligation. Lorena will contact you within 24 hours.'}
          </p>
        </div>
      </div>
    </div>
  );
}
