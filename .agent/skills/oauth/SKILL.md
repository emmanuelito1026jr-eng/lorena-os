---
name: oauth
description: OAuth/social login implementation guide for Supabase Auth. Read this before adding Google, Facebook, Apple, or any third-party OAuth provider to the authentication system.
---

# OAuth Skill

> Read this skill before adding social login (Google, Facebook, Apple, etc.) to the project.
> Auth system: Supabase Auth + `components/auth/AuthProvider.tsx` + `hooks/useAuth.ts`

---

## Current Auth State

### What Exists (WORKING)
- Email/password authentication via Supabase Auth
- `AuthProvider` context wrapping entire app (`components/auth/AuthProvider.tsx`)
- `useAuth` hook for consuming auth state (`hooks/useAuth.ts`)
- `ProtectedRoute` for dashboard routes (`components/auth/ProtectedRoute.tsx`)
- `PortalRoute` for client portal routes (`components/portal/PortalRoute.tsx`)
- Profile creation via Edge Function (`supabase/functions/create-profile`)
- Role-based access: `agent` (Lorena) and `client` (portal users)
- Login page: `pages/Login.tsx`
- Signup page: `pages/Signup.tsx`

### What's Missing (TODO)
- OAuth/social login providers
- Account linking (social + email same user)

---

## Supabase OAuth Architecture

Supabase Auth supports OAuth out of the box. The flow is:

```
User clicks "Sign in with Google"
  → supabase.auth.signInWithOAuth({ provider: 'google' })
  → Redirects to Google consent screen
  → Google redirects back to your app with auth code
  → Supabase exchanges code for session
  → onAuthStateChange fires with new session
  → AuthProvider updates user + profile state
```

No custom backend needed — Supabase handles the OAuth flow entirely.

---

## Implementation Guide

### Step 1: Configure Provider in Supabase Dashboard

For each provider, go to **Supabase Dashboard → Authentication → Providers**:

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials (Web application)
3. Add authorized redirect URI: `https://zdonombljnuylmnwkhga.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase Dashboard → Auth → Providers → Google

#### Facebook OAuth
1. Go to [Meta Developers](https://developers.facebook.com/)
2. Create app → Add Facebook Login product
3. Add Valid OAuth Redirect URI: `https://zdonombljnuylmnwkhga.supabase.co/auth/v1/callback`
4. Copy App ID and App Secret to Supabase Dashboard → Auth → Providers → Facebook

#### Apple OAuth
1. Go to [Apple Developer](https://developer.apple.com/)
2. Create Services ID with "Sign In with Apple" capability
3. Configure Return URL: `https://zdonombljnuylmnwkhga.supabase.co/auth/v1/callback`
4. Copy Service ID, Team ID, Key ID, and Private Key to Supabase Dashboard

### Step 2: Add OAuth Methods to AuthProvider

Add to `components/auth/AuthProvider.tsx`:

```typescript
// Add to AuthContextType interface
signInWithOAuth: (provider: 'google' | 'facebook' | 'apple') => Promise<void>;

// Add to AuthProvider component
const signInWithOAuth = useCallback(async (provider: 'google' | 'facebook' | 'apple') => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });
  if (error) console.error(`OAuth ${provider} error:`, error);
}, []);
```

### Step 3: Add Social Buttons to Login/Signup Pages

Add OAuth buttons to `pages/Login.tsx` and `pages/Signup.tsx`:

```tsx
<div className="space-y-3">
  <button
    onClick={() => signInWithOAuth('google')}
    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm hover:bg-dashboard-surface transition-colors min-h-[44px]"
  >
    <GoogleIcon /> Continue with Google
  </button>
  {/* Similar for Facebook, Apple */}
</div>
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-dashboard-border" />
  </div>
  <div className="relative flex justify-center text-xs">
    <span className="px-3 bg-white font-lato text-dashboard-secondary">or</span>
  </div>
</div>
{/* Existing email/password form */}
```

### Step 4: Handle Profile Creation for OAuth Users

OAuth users don't go through the signup flow, so the profile may not exist. Handle this in `AuthProvider.tsx`:

```typescript
// In the onAuthStateChange callback
if (session?.user) {
  const profile = await fetchProfile(session.user.id);
  if (!profile) {
    // First OAuth login — create profile
    await createProfileFromOAuth(session.user);
  }
}
```

The profile creation should extract name and email from the OAuth user metadata:
```typescript
const createProfileFromOAuth = async (user: User) => {
  const fullName = user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.email?.split('@')[0]
    || 'Unknown';

  // Call the create-profile Edge Function
  // ...
};
```

### Step 5: Handle the Auth Callback

Add a callback route to handle the OAuth redirect:

```tsx
// In App.tsx routes
<Route path="/auth/callback" element={<AuthCallback />} />
```

The callback page handles the code exchange and redirects to the appropriate location (dashboard for agent, portal for client).

---

## Design Rules

- OAuth buttons follow the provider's branding guidelines
- Google: white button, Google "G" logo, "Continue with Google"
- Facebook: blue button (#1877F2), Facebook "f" logo, "Continue with Facebook"
- Apple: black button, Apple logo, "Continue with Apple"
- 44px minimum height on all OAuth buttons
- OAuth buttons appear ABOVE the email/password form, separated by an "or" divider
- Never show provider logos as small icons — full-width buttons for clarity

---

## Security Considerations

- OAuth redirect URL must match exactly what's configured in the provider dashboard
- Always use `redirectTo` option to control where users land after auth
- Handle account linking: if a user signs up with email, then later tries Google with same email, Supabase can auto-link (configurable in dashboard)
- Never store OAuth tokens client-side beyond Supabase's session management
- Rate-limit OAuth attempts to prevent abuse

---

## Role Assignment for OAuth Users

- Default role for new OAuth signups: `client`
- Lorena (agent) should use email/password login — OAuth is for client portal users
- The `create-profile` Edge Function determines role based on business logic
- No self-promotion to agent role — that's a manual database operation

---

## Testing Checklist

- [ ] Google OAuth: redirect → consent → callback → profile created → lands on correct page
- [ ] Facebook OAuth: same flow
- [ ] Apple OAuth: same flow
- [ ] Existing email user tries OAuth with same email → account linked (not duplicate)
- [ ] OAuth user signs out → signs back in → same profile loaded
- [ ] Mobile: OAuth buttons meet 44px touch target, redirect works on mobile browsers
- [ ] Dark mode: OAuth buttons look correct in both themes

---

## Files to Modify

| File | Change |
|------|--------|
| `components/auth/AuthProvider.tsx` | Add `signInWithOAuth` method |
| `hooks/useAuth.ts` | Expose `signInWithOAuth` from context |
| `pages/Login.tsx` | Add OAuth buttons above email form |
| `pages/Signup.tsx` | Add OAuth buttons above email form |
| `App.tsx` | Add `/auth/callback` route |
| `supabase/functions/create-profile/index.ts` | Handle OAuth user metadata |

---

## Priority Order

1. **Google** — most common, highest adoption
2. **Apple** — required if you ever ship an iOS app
3. **Facebook** — good for El Paso demographic reach
