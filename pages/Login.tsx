import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePageTitle } from '../hooks/usePageTitle';
import { useRateLimit } from '../hooks/useRateLimit';
import { useTranslation } from '../lib/i18n/LanguageContext';

export default function Login() {
  const { t } = useTranslation();
  usePageTitle('Login');
  const { signIn, user, isAgent, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isLocked, remainingLockoutSeconds, recordAttempt } = useRateLimit({
    maxAttempts: 5,
    windowMs: 60_000,
    lockoutMs: 30_000,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-dashboard-offwhite flex items-center justify-center">
        <div className="space-y-4 w-64">
          <div className="h-8 bg-dashboard-border rounded animate-pulse" />
          <div className="h-4 bg-dashboard-border rounded animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={isAgent ? '/dashboard' : '/portal'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setError('');
    setIsSubmitting(true);

    const { error: authError } = await signIn(email, password);

    if (authError) {
      recordAttempt();
      setError(
        authError.message === 'Invalid login credentials'
          ? t('auth.invalidCredentials')
          : authError.message
      );
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-dashboard-offwhite flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="font-playfair text-3xl font-bold text-dashboard-black">
            Casas En El Paso
          </h1>
          <p className="font-lato text-dashboard-secondary mt-1 text-sm">TX</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-premium p-8 border border-dashboard-border">
          <h2 className="font-playfair text-2xl font-semibold text-dashboard-black mb-2">
            {t('auth.welcomeBack')}
          </h2>
          <p className="font-lato text-sm text-dashboard-secondary mb-6">
            {t('auth.signInToDashboard')}
          </p>

          {isLocked && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-lato text-sm text-red-500">
                {t('auth.tooManyAttempts').replace('{seconds}', String(remainingLockoutSeconds))}
              </p>
            </div>
          )}

          {error && !isLocked && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-lato text-sm text-status-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block font-lato text-xs text-dashboard-secondary mb-1.5">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 font-lato text-sm text-dashboard-body bg-dashboard-offwhite border border-dashboard-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dashboard-gold/50 focus:border-dashboard-gold transition-colors"
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block font-lato text-xs text-dashboard-secondary">
                  {t('auth.password')}
                </label>
                <Link to="/reset-password" className="font-lato text-xs text-dashboard-gold hover:underline">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 font-lato text-sm text-dashboard-body bg-dashboard-offwhite border border-dashboard-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dashboard-gold/50 focus:border-dashboard-gold transition-colors"
                  placeholder={t('auth.passwordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dashboard-secondary hover:text-dashboard-body min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLocked}
              className="w-full py-3 px-4 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isLocked
                ? t('auth.pleaseWait').replace('{seconds}', String(remainingLockoutSeconds))
                : isSubmitting
                  ? t('auth.signingIn')
                  : t('auth.signIn')}
            </button>
          </form>

          <p className="mt-6 text-center font-lato text-sm text-dashboard-secondary">
            {t('auth.noAccount')}{' '}
            <Link to="/signup" className="text-dashboard-gold hover:underline font-medium">
              {t('auth.createAccount')}
            </Link>
          </p>
        </div>

        {/* Back to site */}
        <p className="mt-6 text-center font-lato text-xs text-dashboard-secondary">
          <Link to="/" className="hover:text-dashboard-body transition-colors">
            &larr; {t('auth.backToSite')}
          </Link>
        </p>
      </div>
    </div>
  );
}
