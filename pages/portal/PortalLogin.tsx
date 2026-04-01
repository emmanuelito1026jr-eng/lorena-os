import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';
import { BUSINESS_EMAIL } from '../../constants';

export default function PortalLogin() {
  const { t } = useTranslation();
  usePageTitle('Client Login');
  const { user, isLoading, isAgent, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF5] flex items-center justify-center">
        <div className="space-y-4 w-64">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  if (user && isAgent) return <Navigate to="/dashboard" replace />;
  if (user && !isAgent) return <Navigate to="/portal" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: authError } = await signIn(email, password);
    if (authError) {
      setError(
        authError.message === 'Invalid login credentials'
          ? t('auth.invalidCredentials')
          : authError.message || t('auth.invalidCredentials')
      );
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-playfair text-3xl font-bold text-[#0A0A0A]">
            {t('auth.clientPortal')}
          </h1>
          <p className="font-lato text-sm text-[#888888] mt-2">
            {t('auth.signInToPortal')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#E5E5E0] p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg font-lato text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="font-lato text-xs font-medium text-[#888888] mb-1 block">{t('auth.email')}</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                required
                className="w-full pl-9 pr-4 py-2.5 border border-[#E5E5E0] rounded-lg font-lato text-sm text-[#333333] placeholder:text-[#888888] focus:outline-none focus:border-[#C9A84C]/50 focus:ring-1 focus:ring-[#C9A84C]/20 min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-lato text-xs font-medium text-[#888888]">{t('auth.password')}</label>
              <Link to="/reset-password" className="font-lato text-xs text-[#C9A84C] hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                required
                className="w-full px-4 py-2.5 border border-[#E5E5E0] rounded-lg font-lato text-sm text-[#333333] placeholder:text-[#888888] focus:outline-none focus:border-[#C9A84C]/50 focus:ring-1 focus:ring-[#C9A84C]/20 min-h-[44px] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#333333] min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-[#C9A84C] hover:bg-[#B8952F] disabled:opacity-50 text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
          >
            {submitting ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>

        <p className="text-center mt-6 font-lato text-xs text-[#888888]">
          {t('auth.noAccessPortal')}{' '}
          <a
            href={`mailto:${BUSINESS_EMAIL}`}
            className="text-[#C9A84C] hover:underline"
          >
            {t('auth.contactLorena')}
          </a>
        </p>

        <p className="text-center mt-3">
          <Link to="/" className="font-lato text-xs text-[#888888] hover:text-[#C9A84C]">
            {t('auth.backToWebsite')}
          </Link>
        </p>
      </div>
    </div>
  );
}
