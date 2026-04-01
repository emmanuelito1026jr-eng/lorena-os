import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePageTitle } from '../hooks/usePageTitle';
import { useRateLimit } from '../hooks/useRateLimit';
import { useTranslation } from '../lib/i18n/LanguageContext';

export default function Signup() {
  const { t } = useTranslation();
  usePageTitle('Sign Up');
  const { signUp, user, isLoading: authLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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

  // Signup creates clients — redirect to portal
  if (user) {
    return <Navigate to="/portal" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwordsMismatch'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      setError(t('auth.passwordRequirements'));
      return;
    }

    setIsSubmitting(true);

    const { error: authError, needsEmailConfirmation } = await signUp(email, password, fullName);

    if (authError) {
      recordAttempt();
      setError(authError.message);
      setIsSubmitting(false);
      return;
    }

    if (needsEmailConfirmation) {
      setSuccessMessage(t('auth.signUpSuccess'));
      setIsSubmitting(false);
      return;
    }

    // If no email confirmation needed, auth listener will set user → redirect via `if (user)` guard
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
          {successMessage ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="font-playfair text-2xl font-semibold text-dashboard-black mb-2">
                {t('auth.resetLinkSent')}
              </h2>
              <p className="font-lato text-sm text-dashboard-secondary mb-6">
                {successMessage}
              </p>
              <Link
                to="/login"
                className="inline-block py-3 px-6 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
              >
                {t('auth.backToLogin')}
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-playfair text-2xl font-semibold text-dashboard-black mb-2">
                {t('auth.createAccount')}
              </h2>
              <p className="font-lato text-sm text-dashboard-secondary mb-6">
                {t('auth.getStarted')}
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
                  <label htmlFor="fullName" className="block font-lato text-xs text-dashboard-secondary mb-1.5">
                    {t('auth.fullName')}
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                    className="w-full px-4 py-3 font-lato text-sm text-dashboard-body bg-dashboard-offwhite border border-dashboard-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dashboard-gold/50 focus:border-dashboard-gold transition-colors"
                    placeholder="Lorena Ontiveros-Ortega"
                  />
                </div>

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
                  <label htmlFor="password" className="block font-lato text-xs text-dashboard-secondary mb-1.5">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
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

                <div>
                  <label htmlFor="confirmPassword" className="block font-lato text-xs text-dashboard-secondary mb-1.5">
                    {t('auth.confirmPassword')}
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full px-4 py-3 font-lato text-sm text-dashboard-body bg-dashboard-offwhite border border-dashboard-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dashboard-gold/50 focus:border-dashboard-gold transition-colors"
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isLocked}
                  className="w-full py-3 px-4 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {isLocked
                    ? t('auth.pleaseWait').replace('{seconds}', String(remainingLockoutSeconds))
                    : isSubmitting
                      ? t('auth.creatingAccount')
                      : t('auth.createAccount')}
                </button>
              </form>

              <p className="mt-6 text-center font-lato text-sm text-dashboard-secondary">
                {t('auth.haveAccount')}{' '}
                <Link to="/login" className="text-dashboard-gold hover:underline font-medium">
                  {t('auth.signIn')}
                </Link>
              </p>
            </>
          )}
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
