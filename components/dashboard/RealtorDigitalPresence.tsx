/**
 * RealtorDigitalPresence — "What Makes Me Unique" section
 *
 * Two surfaces:
 * 1. Dashboard widget — shows on Command Center
 * 2. Public profile — /agent/:slug (needs routing)
 */

import { useState } from 'react';
import {
  Star, Home, Users, Award, Globe, Phone, Calendar,
  Copy, Check, ExternalLink, Edit3, MapPin, Zap,
  Shield, ChevronRight, TrendingUp
} from 'lucide-react';
import { useRealtorProfile } from '../../hooks/useIntegrations';

export function RealtorDigitalPresence({ mode = 'widget', onEditClick }) {
  const { data: rawProfile } = useRealtorProfile();
  const [copied, setCopied] = useState(false);
  return null; // placeholder
}
