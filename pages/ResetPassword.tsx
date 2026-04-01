import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePageTitle } from '../hooks/usePageTitle';
import { useTranslation } from '../lib/i18n/LanguageContext';

export default function ResetPassword() {
  const { t } = useTranslation();
  usePageTitle('Reset Password');
  const navigate = useNavigate();
  const { resetPassword, updatePassword } = useAuth();

  // Detect recovery mode from URL hash (Supabase appends #type=recovery&access_token=...)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecoveryMode(true);
    }
  }, []);

  // Request mode state
  const [email, setEmail] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  // Update mode state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError('');
    setRequestSubmitting(true);

    const { error } = await resetPassword(email);
    if (error) {
      setRequestError(error.message);
      setRequestSubmitting(false);
      return;
    }

    setRequestSent(true);
    setRequestSubmitting(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError('');

    if (newPassword !== confirmNewPassword) {
      setUpdateError(t('auth.passwordsMismatch'));
      return;
    }

    if (newPassword.length < 8) {
      setUpdateError(t('auth.passwordTooShort'));
      return;
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setUpdateError(t('auth.passwordRequirements'));
      return;
    }

    setUpdateSubmitting(true);

    const { error } = await updatePassword(newPassword);
    if (error) {
      setUpdateError(error.message);
      setUpdateSubmitting(false);
      return;
    }

    setUpdateSuccess(true);
    setUpdateSubmitting(false);

    // Redirect to login after 2 seconds
    setTimeout(() => navigate('/login'), 2000);
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
          {isRecoveryMode ? (
            // UPDATE PASSWORD MODE
            updateSuccess ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="font-playfair text-2xl font-semibold text-dashboard-black mb-2">
                  {t('auth.passwordUpdated')}
                </h2>
                <p className="font-lato text-sm text-dashboard-secondary">
                  {t('auth.signingIn')}
                </p>
              </div>
            ) : (
              <>
                <h2 className="font-playfair text-2xl font-semibold text-dashboard-black mb-2">
                  {t('auth.resetPassword')}
                </h2>
                <p className="font-lato text-sm text-dashboard-secondary mb-6">
                  {t('auth.passwordPlaceholder')}
                </p>

                {updateError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-lato text-sm text-status-error">{updateError}</p>
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label htmlFor="newPassword" className="block font-lato text-xs text-dashboard-secondary mb-1.5">
                      {t('auth.newPassword')}
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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
                    <label htmlFor="confirmNewPassword" className="block font-lato text-xs text-dashboard-secondary mb-1.5">
                      {t('auth.confirmNewPassword')}
                    </label>
                    <input
                      id="confirmNewPassword"
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="w-full px-4 py-3 font-lato text-sm text-dashboard-body bg-dashboard-offwhite border border-dashboard-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dashboard-gold/50 focus:border-dashboard-gold transition-colors"
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updateSubmitting}
                    className="w-full py-3 px-4 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    {updateSubmitting ? t('auth.updatingPassword') : t('auth.updatePassword')}
                  </button>
                </form>
              </>
            )
          ) : (
            // REQUEST RESET MODE
            requestSent ? (
              <div className="text-center py-4">
                <Mail className="w-12 h-12 text-dashboard-gold mx-auto mb-4" />
                <h2 className="font-playfair text-2xl font-semibold text-dashboard-black mb-2">
                  {t('auth.resetLinkSent')}
                </h2>
                <p className="font-lato text-sm text-dashboard-secondary mb-6">
                  {t('auth.resetLinkSentDesc').replace('{email}', email)}
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
                  {t('auth.resetPassword')}
                </h2>
                <p className="font-lato text-sm text-dashboard-secondary mb-6">
                  {t('auth.resetPasswordDesc')}
                </p>

                {requestError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-lato text-sm text-status-error">{requestError}</p>
                  </div>
                )}

                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div>
                    <label htmlFor="resetEmail" className="block font-lato text-xs text-dashboard-secondary mb-1.5">
                      {t('auth.email')}
                    </label>
                    <input
                      id="resetEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full px-4 py-3 font-lato text-sm text-dashboard-body bg-dashboard-offwhite border border-dashboard-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dashboard-gold/50 focus:border-dashboard-gold transition-colors"
                      placeholder={t('auth.emailPlaceholder')}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={requestSubmitting}
                    className="w-full py-3 px-4 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    {requestSubmitting ? t('auth.sendingResetLink') : t('auth.sendResetLink')}
                  </button>
                </form>

                <p className="mt-6 text-center font-lato text-sm text-dashboard-secondary">
                  <Link to="/login" className="text-dashboard-gold hover:underline font-medium">
                    {t('auth.backToLogin')}
                  </Link>
                </p>
              </>
            )
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
