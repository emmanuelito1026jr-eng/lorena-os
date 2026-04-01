# Messages Hub Agent Skill
> Domain-specific knowledge for the Messages dashboard tab

## Purpose

The Messages tab is Lorena's unified inbox for all communication channels: SMS, email, AI SMS, and website chatbot conversations. It uses a two-tab layout (Leads for SMS/email threads, Chat for website chatbot sessions) with a split-pane design (conversation list on left, message thread on right). This is a critical screen because speed-to-lead response time directly impacts conversion -- Lorena needs to see and respond to messages within minutes, not hours. The system integrates with Twilio (SMS/voice), SendGrid (email), and the GPT-4o-powered chatbot.

## Files

- **Primary:** `pages/dashboard/Messages.tsx` (522 lines)
- **Hooks:**
  - `hooks/useMessages.ts` -- `useConversations()`, `useMessages(leadId, channel?)`, `useSendMessage()`, `useUnreadCount()`, `useChatSessions()`, `useChatMessages(sessionId)`, `useSendChatMessage()`, `useChatUnreadCount()`
  - `hooks/useRealtime.ts` -- `useRealtimeMessages()`, `useRealtimeChat()`
  - `hooks/useAuth.ts` -- `useAuth()` (for user.id on send)
  - `hooks/usePageTitle.ts` -- sets document title to "Messages"
- **Scoring Integration:**
  - `lib/chat/leadScoring.ts` -- `getTemperature(score)` (used for chat session temperature dots)
  - `lib/scoring/log-activity.ts` -- `logActivity()` (called on inbound message to log `message_sent` activity for scoring)
- **Components:**
  - `components/shared/EmptyState.tsx` -- branded empty state
  - `components/shared/Skeleton.tsx` -- `SkeletonList`
  - `components/shared/LeadScoreBadge.tsx` -- score badge on chat thread header
- **Types:**
  - `lib/supabase/database.types.ts` -- `Message`, `MessageChannel`, `MessageWithLead`, `ChatSession`, `ChatMessage`

## Data Sources

### Supabase Tables
| Table | Hook | Query Details |
|---|---|---|
| `messages` | `useConversations()` | `select('*, leads!inner(first_name, last_name)')` ordered by `created_at` desc. Client-side groups by `lead_id`, takes latest message per lead, counts unread inbound. |
| `messages` | `useMessages(leadId)` | `select('*')` filtered by `lead_id`, ordered by `created_at` asc. Optionally filtered by `channel`. |
| `messages` | `useSendMessage()` | Inserts new message row. On success: invalidates messages/conversations/unread queries. If direction=inbound, fires `logActivity('message_sent')`. |
| `messages` | `useUnreadCount()` | Count query: `select('*', { count: 'exact', head: true })` where `read=false` AND `direction='inbound'`. |
| `chat_sessions` | `useChatSessions()` | `select('*')` ordered by `updated_at` desc, limit 50. Then fetches `chat_messages` for each session to get latest message and count. |
| `chat_messages` | `useChatMessages(sessionId)` | `select('*')` filtered by `session_id`, ordered by `created_at` asc. |
| `chat_messages` | `useSendChatMessage()` | Inserts new chat message. On success: invalidates chat-messages/sessions/unread queries. |
| `chat_sessions` | `useChatUnreadCount()` | Complex query: fetches active sessions, then checks last message per session. If last message is from `role='user'`, counts as unread. |

### Realtime Subscriptions
- `useRealtimeMessages()` -- Subscribes to `messages` table (`*` events), invalidates `messages`, `conversations`, `unread-count`
- `useRealtimeChat()` -- Subscribes to `chat_messages` table (INSERT events only), invalidates `chat-sessions`, `chat-messages`, `chat-unread-count`

### Message Channel Types
```typescript
type MessageChannel = 'sms' | 'email' | 'ai_sms' | 'chatbot' | 'phone';
```

### Channel Icon Mapping
| Channel | Icon |
|---|---|
| `sms` | Phone |
| `email` | Mail |
| `ai_sms` | Bot |
| `chatbot` | Bot |
| `phone` | Phone |

### ChatSessionWithPreview Type
```typescript
interface ChatSessionWithPreview {
  id: string;
  visitor_id: string;
  status: 'active' | 'ended' | 'converted';
  lead_id: string | null;
  lead_score: number;
  visitor_name: string | null;
  visitor_phone: string | null;
  visitor_email: string | null;
  page_url: string | null;
  created_at: string;
  updated_at: string;
  last_message: string;
  last_message_at: string;
  message_count: number;
}
```

## Current Features

### Page Layout
- **Title:** "Messages" (Playfair Display)
- **Subtitle:** "{N} unread" or "All conversations in one place"
- **Two main tabs:** Leads | Chat (with unread count badges)

### Leads Tab (SMS/Email Threads)
- **Conversation list** (left pane, 320px width on desktop):
  - Avatar initials (gold), lead name, channel icon, last message preview (truncated), timestamp, unread badge
  - Sorted by last message time (most recent first)
  - Selected conversation has `bg-dashboard-surface` highlight
- **Message thread** (right pane):
  - Header: Back button (mobile), avatar, lead name
  - Messages: Bubble layout -- outbound (gold bg, right-aligned), inbound (gray bg, left-aligned)
  - Each bubble shows content + timestamp
  - Compose input with Send button at bottom
  - Enter key to send (Shift+Enter for newline not explicitly handled -- single-line input)
- **Responsive behavior:**
  - Mobile: conversation list fills screen. When a conversation is selected, thread fills screen with "Back" button.
  - Desktop: side-by-side split pane layout

### Chat Tab (Website Chatbot Sessions)
- **Session list** (left pane):
  - Chat icon with temperature dot (red/orange/blue/gray based on `lead_score`), visitor name (or "Anonymous Visitor"), last message preview, timestamp
  - Lead score display, "Converted" badge if status = 'converted'
- **Chat thread** (right pane):
  - Header: Back button (mobile), visitor name, phone, email, LeadScoreBadge
  - Messages: 3 roles with distinct styling:
    - `agent` -- gold bg, right-aligned (Lorena's replies)
    - `bot` -- blue bg with blue border, left-aligned, "Bot" label
    - `user` -- gray bg, left-aligned, "Visitor" label
  - Each bubble shows role label (except agent), content, timestamp
  - Compose: "Reply as Lorena..." placeholder, Send button
- **Temperature colors on session list:**
  - hot (score >= 80): `bg-red-500`
  - warm (score 50-79): `bg-orange-500`
  - cool (score 20-49): `bg-blue-500`
  - cold (score < 20): `bg-gray-400`

### Message Sending Flow
1. User types message in input field
2. Presses Enter or clicks Send button
3. `handleSend()` checks: non-empty text, selected lead/session, authenticated user
4. Calls `sendMessage.mutate()` with: lead_id, agent_id, channel (from last conversation channel or default 'sms'), direction: 'outbound', content
5. Input is cleared immediately (before server confirms -- optimistic clear)
6. On success: TanStack Query invalidates messages, conversations, unread counts
7. If the message was inbound (direction='inbound'), fires `logActivity('message_sent')` for lead scoring

### Chat Reply Flow
1. Agent types reply in "Reply as Lorena..." input
2. Calls `sendChatMessage.mutate()` with: session_id, role: 'agent', content
3. Input cleared immediately
4. On success: invalidates chat-messages, chat-sessions, chat-unread-count

## Business Rules

- **Speed-to-lead is critical** -- The faster Lorena responds, the higher the conversion rate. Unread messages should be the highest priority on the dashboard.
- **Lead replies to ANY message** -- Should pause all drip enrollments and notify Lorena to "take over" (this rule is defined in CLAUDE.md but NOT enforced in Messages.tsx -- it would need n8n workflow or Supabase trigger).
- **AI SMS active** -- Should pause drip sequences to prevent double-messaging (same caveat as above).
- **No SMS during quiet hours** (10 PM - 7 AM CST) except critical alerts -- NOT enforced in the UI. The send button works 24/7.
- **Max 1 AI SMS conversation per lead per 7 days** -- NOT enforced in this UI (handled by n8n workflows).
- **Stop after 2 unanswered AI SMS messages** -- NOT enforced in this UI.
- **All client-facing text must have EN and ES versions** -- NOT implemented in Messages.tsx. All UI text is English-only.
- **Inbound messages trigger scoring** -- `useSendMessage()` hook calls `logActivity('message_sent')` only for `direction === 'inbound'`. Outbound messages do not score.
- **Chat session temperature** -- Uses `getTemperature(score)` from `lib/chat/leadScoring.ts` to determine the colored dot on session cards.
- **Default channel for replies** -- Uses `selectedConv?.last_channel ?? 'sms'` -- replies default to SMS if no prior channel detected.

## Known Issues

1. **Message send clears input before confirmation** -- `setNewMessage('')` is called immediately after `sendMessage.mutate()` on line 87 (and `setChatReply('')` on line 97). If the mutation fails, the user's message is lost. Should only clear on `onSuccess`.
2. **No channel selection for new messages** -- When composing a reply, there's no way to choose between SMS, email, or phone. It defaults to the last channel used in that conversation (or SMS if none). Lorena might want to reply via email to an SMS conversation.
3. **No read-state sync on conversation open** -- Opening a conversation does NOT mark its messages as read. The unread badge persists until something else triggers a read update. Should call a `markAsRead` mutation when a conversation is selected.
4. **Chat unread count is expensive** -- `useChatUnreadCount()` makes 2 sequential Supabase queries (fetch active sessions, then fetch messages for all sessions) on every poll. This doesn't scale.
5. **No message search** -- Cannot search across all conversations for a specific keyword or phrase.
6. **No message templates** -- Lorena has to type every message from scratch. No quick-reply templates for common responses (showing confirmation, follow-up, etc.).
7. **No scheduling** -- Cannot schedule a message to be sent at a specific time. All sends are immediate.
8. **No attachment support** -- Cannot send or receive images, documents, or property listings.
9. **No typing indicator** -- No visual feedback when the other party is typing.
10. **Single-line input** -- The message compose input is `<input type="text">` not `<textarea>`. Cannot type multi-line messages.
11. **Conversation list loads ALL messages to group** -- `useConversations()` fetches ALL messages from the `messages` table to group by lead client-side. This is inefficient and will not scale.
12. **Chat session limit of 50** -- `useChatSessions()` has a hard `.limit(50)`. No pagination or "load more" for older sessions.
13. **No DND (Do Not Disturb) mode** -- No way for Lorena to mute notifications for a specific lead or time period.
14. **No AI-suggested replies** -- Unlike CINC's AI Alex ($200/mo), we don't yet offer AI-generated reply suggestions.

## CINC Pro Comparison

### What CINC Has That We Don't
- **AI Alex ($200/mo addon)** -- AI-powered automated SMS conversations that qualify leads, book appointments, and hand off to the agent. Our AI SMS engine (LOS-12) is designed in n8n but not yet live.
- **Message templates** -- CINC has pre-built and custom message templates for common scenarios (follow-up, showing confirmation, price drop alert, etc.)
- **Conversation assignment** -- CINC can assign conversations to team members. Not needed for solo Lorena, but needed for template.
- **SMS deliverability dashboard** -- CINC shows delivery rates, opt-outs, and carrier filtering stats.
- **Email open/click tracking inline** -- CINC shows email engagement directly in the message thread.
- **Phone call logging** -- CINC logs phone calls with duration and notes in the same conversation view.
- **Scheduled messages** -- CINC can schedule SMS/email to send at a specific time.
- **Message attachments** -- CINC supports sending images and property links in messages.

### What We Do BETTER Than CINC
- **Unified inbox with chat** -- CINC separates SMS/email from their website chat. We combine lead messages AND chatbot sessions in one screen with tabs.
- **Real-time everything** -- Supabase realtime channels mean messages appear instantly without refresh. CINC has noticeable delays.
- **Chat session scoring** -- Temperature dots on chat sessions give Lorena instant lead quality signals. CINC's chat has no scoring.
- **Bot/Agent/Visitor role distinction** -- In the chat tab, messages are visually distinguished by role (bot = blue, agent = gold, visitor = gray). CINC lumps them together.
- **Three-click reply** -- Select conversation -> type -> send. CINC requires navigating through multiple menus.
- **Score badge on chat header** -- Lorena immediately sees the lead score when opening a chat session. CINC hides this information.

## Improvement Roadmap

### Priority 1 -- Critical (Replace CINC AI Alex)
1. **AI-suggested replies** -- When Lorena opens a conversation, show 2-3 AI-generated reply suggestions based on the conversation context and lead profile. Uses Claude Sonnet. One-tap to send.
2. **Message templates** -- Create a template library (showing confirmation, follow-up, price drop, new listing match, general check-in). Quick-insert from a template picker in the compose area.
3. **Mark as read on open** -- When a conversation is selected, fire a mutation to mark all its inbound messages as `read = true`. Update the unread count immediately.

### Priority 2 -- High Value
4. **Channel selector** -- Add a channel picker (SMS/Email) next to the compose input so Lorena can choose how to reply.
5. **Message scheduling** -- Add a clock icon next to the Send button that opens a date/time picker. Scheduled messages stored with a `scheduled_at` timestamp, sent by n8n workflow.
6. **Conversation search** -- Add a search input above the conversation list to search across all messages by keyword.
7. **Multi-line compose** -- Replace `<input>` with `<textarea>` that auto-grows. Support Shift+Enter for newline.
8. **Fix optimistic input clear** -- Move `setNewMessage('')` and `setChatReply('')` into `onSuccess` callback instead of calling immediately after `mutate()`.
9. **Quiet hours warning** -- If Lorena tries to send a message during quiet hours (10 PM - 7 AM CST), show a warning: "This message will be sent at 7:00 AM" or let her override.

### Priority 3 -- Polish
10. **Message attachments** -- Support sending images and property listing cards in SMS/email. Use Supabase Storage for uploads.
11. **Typing indicator** -- Show "typing..." when the other party is composing (requires Supabase presence or websocket).
12. **DND mode per lead** -- Allow muting notifications for a specific conversation.
13. **Phone call logging** -- Log phone calls with duration and notes in the conversation timeline.
14. **Optimize conversation loading** -- Replace the full-table scan in `useConversations()` with a Supabase view or RPC that returns pre-grouped conversations.
15. **Paginate chat sessions** -- Replace `.limit(50)` with infinite scroll or "Load More" button.
16. **Email open/click tracking** -- Show email engagement events inline in the message thread (requires SendGrid webhook integration).
17. **Smart notification sound** -- Play a subtle notification sound when a new inbound message arrives via realtime subscription.

## Design System

### Colors Used
| Element | Class |
|---|---|
| Outbound message bubble | `bg-dashboard-gold text-white` |
| Inbound message bubble | `bg-dashboard-surface text-dashboard-body` |
| Bot message bubble | `bg-blue-50 text-dashboard-body border border-blue-100` |
| Unread badge | `bg-dashboard-gold text-white` (round, 18px) |
| Tab active | `bg-white text-dashboard-black shadow-sm` |
| Tab inactive | `text-dashboard-secondary hover:text-dashboard-black` |
| Selected conversation | `bg-dashboard-surface` |
| Send button | `bg-dashboard-gold hover:bg-[#B8952F] text-white` |
| Send button disabled | `disabled:opacity-50` |
| Compose input focus | `focus:border-dashboard-gold/50 focus:ring-dashboard-gold/20` |
| Bot label text | `text-blue-500` |
| Visitor label text | `text-dashboard-secondary` |
| Temperature dots | hot: `bg-red-500`, warm: `bg-orange-500`, cool: `bg-blue-500`, cold: `bg-gray-400` |
| Converted badge | `bg-green-50 text-green-700` |
| Timestamp (outbound) | `text-white/70` |
| Timestamp (inbound/bot) | `text-dashboard-secondary` |

### Typography
| Context | Class |
|---|---|
| Page title | `font-playfair text-2xl md:text-3xl font-bold text-dashboard-black` |
| Subtitle | `font-lato text-sm text-dashboard-secondary` |
| Lead name in conversation list | `font-lato text-sm font-medium text-dashboard-black` |
| Last message preview | `font-lato text-xs text-dashboard-secondary` |
| Message content | `font-lato text-sm` |
| Timestamp | `font-lato text-[10px]` |
| Unread badge | `text-[10px] font-lato font-bold` |
| "Back" button | `font-lato text-sm text-dashboard-gold` |
| Score display | `font-lato text-[10px] text-dashboard-secondary` |

### Layout
- **Tab bar:** `flex gap-1 bg-dashboard-surface rounded-lg p-1 max-w-xs`
- **Split pane container:** `flex gap-0 bg-white rounded-xl border border-dashboard-border overflow-hidden h-[calc(100vh-300px)] lg:h-[calc(100vh-260px)] min-h-[400px]`
- **Conversation list:** `w-full md:w-80 border-r border-dashboard-border overflow-y-auto shrink-0`
- **Thread area:** `flex-1 flex flex-col`
- **Message bubbles:** `max-w-[75%] rounded-lg p-3`
- **Compose area:** `p-4 border-t border-dashboard-border` with `flex gap-2`
- **Mobile responsive:** Conversation list and thread toggle visibility based on selection state (hidden/shown with responsive classes)

## Verification Checklist

1. [ ] Page loads with skeleton shimmer for conversation list
2. [ ] Leads tab shows all conversations sorted by most recent
3. [ ] Conversation cards show: avatar, name, channel icon, last message, timestamp, unread badge
4. [ ] Selecting a conversation shows the message thread
5. [ ] Outbound messages render right-aligned with gold background
6. [ ] Inbound messages render left-aligned with gray background
7. [ ] Send button works and message appears in thread
8. [ ] Enter key sends the message
9. [ ] Chat tab shows chatbot sessions with temperature dots
10. [ ] Chat messages distinguish Bot (blue), Agent (gold), and Visitor (gray) roles
11. [ ] "Back" button works on mobile to return to conversation list
12. [ ] Unread count badges show correct numbers on tabs
13. [ ] Total unread count in subtitle matches sum of leads + chat unread
14. [ ] "Converted" badge appears on converted chat sessions
15. [ ] LeadScoreBadge appears in chat thread header when score > 0
16. [ ] Realtime: new messages appear without page refresh
17. [ ] Empty states show for no conversations and no chat sessions
18. [ ] Mobile layout toggles between list and thread views correctly
19. [ ] All touch targets >= 44px (Send button, conversation items, back button)
20. [ ] No TypeScript errors (`npm run type-check`)
