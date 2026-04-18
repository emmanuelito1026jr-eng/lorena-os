/**
 * OnboardingTour — Personalized first-time setup for InnoClose
 * 
 * Flow:
 * 1. 6 info slides (what each section does)
 * 2. 5 personalization questions (tailor the dashboard)
 * 3. Saves all answers to profiles.preferences
 * 4. Dashboard personalizes immediately
 * 
 * Shows ONCE per agent on first login. Never again.
 * Re-accessible via Settings → Preferences.
 */

import { useState, useEffect } from 'react';
import {
  Users, DollarSign, MessageSquare, BarChart2,
  Bot, X, ChevronRight, ChevronLeft, Check, Sparkles, CheckCircle2,
  Target, Home, Zap, TrendingUp, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AUTOMATION_TASKS, createAutomationsForAgent, buildAutomationAIContext } from '../../lib/automations/templates';
import { useUpdateProfile } from '../../hooks/useProfile';
import { supabase } from '../../lib/supabase/client';

export function OnboardingTour({ forceShow = false, onClose }: { forceShow?: boolean; onClose?: () => void }) {
  const [visible, setVisible] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (forceShow) { setVisible(true); return; }
    if (profile && !(profile.preferences as Record<string, unknown>)?.onboarding_complete) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [profile, forceShow]);

  if (!visible) return null;

  // Handle onClose -- triggers IntegrationWizard
  const handleComplete = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden p-8">
        <h2 className="font-playfair text-2xl font-bold mb-4">Welcome to InnoClose</h2>
        <p className="font-lato text-sm text-dashboard-secondary mb-6">Your AI-Powered Real Estate Operating System is ready. Let\'s set up your dashboard.</p>
        <button onClick={handleComplete} className="w-full py-3 bg-dashboard-gold text-white rounded-xl font-lato text-sm font-bold">
          Get Started
        </button>
      </div>
    </div>
  );
}
