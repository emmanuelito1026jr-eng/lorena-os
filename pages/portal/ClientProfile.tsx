import { useState, useEffect } from 'react';
import { User, Mail, Phone, Globe, LogOut } from 'lucide-react';
import { useClientProfile, useUpdateClientProfile } from '../../hooks/portal/useClientProfile';
import { useAuth } from '../../hooks/useAuth';
import { SkeletonCard } from '../../components/shared/Skeleton';
import { showToast } from '../../components/shared/Toast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';

const inputClass = 'w-full px-3 py-2.5 border border-[#E5E5E0] rounded-lg font-lato text-sm text-[#333333] placeholder:text-[#888888] focus:outline-none focus:border-[#C9A84C]/50 focus:ring-1 focus:ring-[#C9A84C]/20 min-h-[44px]';

export default function ClientProfile() {
  usePageTitle('My Profile');
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { data: profile, isLoading } = useClientProfile();
  const updateProfile = useUpdateClientProfile();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      const prefs = profile.preferences as Record<string, unknown> | null;
      setLanguage((prefs?.language as 'en' | 'es') || 'en');
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate(
      {
        full_name: fullName,
        phone: phone || null,
        preferences: { ...(profile?.preferences as Record<string, unknown> || {}), language },
      },
      {
        onSuccess: () => {
          showToast('Profile updated', 'success');
          setDirty(false);
        },
        onError: () => showToast('Failed to update profile', 'error'),
      },
    );
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-lg">
        <div className="h-10 bg-dashboard-border rounded animate-pulse w-32" />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">{t('portal.profile.title')}</h1>
        <p className="font-lato text-sm text-dashboard-secondary mt-1">{t('portal.profile.subtitle')}</p>
      </div>

      {/* Avatar + name */}
      <div className="bg-white rounded-xl border border-dashboard-border p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-dashboard-gold/10 flex items-center justify-center flex-shrink-0">
          <User size={28} className="text-dashboard-gold" />
        </div>
        <div>
          <p className="font-playfair text-lg font-bold text-dashboard-black">{profile?.full_name || 'Client'}</p>
          <p className="font-lato text-sm text-dashboard-secondary">{profile?.email}</p>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-xl border border-dashboard-border p-6 space-y-4">
        <div>
          <label className="font-lato text-xs text-[#888888] mb-1 block">{t('portal.profile.fullName')}</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input
              type="text"
              value={fullName}
              onChange={e => { setFullName(e.target.value); setDirty(true); }}
              placeholder={t('portal.profile.yourName')}
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        <div>
          <label className="font-lato text-xs text-[#888888] mb-1 block">{t('portal.profile.email')}</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className={`${inputClass} pl-9 bg-gray-50 cursor-not-allowed`}
            />
          </div>
          <p className="font-lato text-[10px] text-dashboard-secondary mt-1">{t('portal.profile.emailReadonly')}</p>
        </div>

        <div>
          <label className="font-lato text-xs text-[#888888] mb-1 block">{t('portal.profile.phone')}</label>
          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setDirty(true); }}
              placeholder="(915) 555-0123"
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        <div>
          <label className="font-lato text-xs text-[#888888] mb-1 block">{t('portal.profile.preferredLanguage')}</label>
          <div className="relative">
            <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
            <select
              value={language}
              onChange={e => { setLanguage(e.target.value as 'en' | 'es'); setDirty(true); }}
              className={`${inputClass} pl-9 appearance-none`}
            >
              <option value="en">{t('portal.profile.english')}</option>
              <option value="es">{t('portal.profile.spanish')}</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!dirty || updateProfile.isPending}
          className="w-full py-2.5 bg-[#C9A84C] hover:bg-[#B8952F] disabled:opacity-50 text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
        >
          {updateProfile.isPending ? t('portal.profile.saving') : t('portal.profile.saveChanges')}
        </button>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
      >
        <LogOut size={16} />
        {t('portal.nav.signOut')}
      </button>

      <p className="font-lato text-[10px] text-dashboard-secondary text-center">
        {t('portal.profile.needHelp')}
      </p>
    </div>
  );
}
