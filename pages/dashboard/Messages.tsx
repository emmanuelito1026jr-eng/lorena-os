import { useState, useEffect } from 'react';
import { MessageSquare, Send, Phone, Mail, Bot, Users } from 'lucide-react';
import { EmptyState } from '../../components/shared/EmptyState';
import { SkeletonList } from '../../components/shared/Skeleton';
import { LeadScoreBadge } from '../../components/shared/LeadScoreBadge';
import {
  useConversations,
  useMessages,
  useSendMessage,
  useUnreadCount,
  useMarkConversationRead,
  useChatSessions,
  useChatMessages,
  useSendChatMessage,
  useChatUnreadCount,
} from '../../hooks/useMessages';
import { useRealtimeMessages, useRealtimeChat } from '../../hooks/useRealtime';
import { useAuth } from '../../hooks/useAuth';
import type { MessageChannel } from '../../lib/supabase/database.types';
import { getTemperature } from '../../lib/chat/leadScoring';
import { format } from 'date-fns';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';

const CHANNEL_ICONS: Record<string, typeof Phone> = {
  sms: Phone,
  email: Mail,
  ai_sms: Bot,
  chatbot: Bot,
  phone: Phone,
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 24) return format(date, 'h:mm a');
  if (diffHours < 168) return format(date, 'EEE h:mm a');
  return format(date, 'MMM d');
}

const TEMP_COLORS: Record<string, string> = {
  hot: 'bg-red-500',
  warm: 'bg-orange-500',
  cool: 'bg-blue-500',
  cold: 'bg-gray-400',
};

type Tab = 'leads' | 'chat';

export default function Messages() {
  usePageTitle('Messages');
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('leads');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [chatReply, setChatReply] = useState('');

  // Lead message hooks
  const { data: conversations, isLoading } = useConversations();
  const { data: messages } = useMessages(selectedLeadId ?? '');
  const { data: unreadCount } = useUnreadCount();
  const sendMessage = useSendMessage();
  const markRead = useMarkConversationRead();

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedLeadId) {
      markRead.mutate(selectedLeadId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeadId]);

  // Chat hooks
  const { data: chatSessions, isLoading: chatLoading } = useChatSessions();
  const { data: chatMessages } = useChatMessages(selectedSessionId ?? '');
  const { data: chatUnreadCount } = useChatUnreadCount();
  const sendChatMessage = useSendChatMessage();

  const { user } = useAuth();

  useRealtimeMessages();
  useRealtimeChat();

  const selectedConv = conversations?.find((c) => c.lead_id === selectedLeadId);
  const selectedSession = chatSessions?.find((s) => s.id === selectedSessionId);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedLeadId || !user) return;
    const content = newMessage.trim();
    sendMessage.mutate(
      {
        lead_id: selectedLeadId,
        agent_id: user.id,
        channel: selectedConv?.last_channel ?? ('sms' as MessageChannel),
        direction: 'outbound',
        content,
      },
      { onSuccess: () => setNewMessage('') }
    );
  };

  const handleChatReply = () => {
    if (!chatReply.trim() || !selectedSessionId) return;
    const content = chatReply.trim();
    sendChatMessage.mutate(
      {
        session_id: selectedSessionId,
        role: 'agent',
        content,
      },
      { onSuccess: () => setChatReply('') }
    );
  };

  const totalUnread = (unreadCount ?? 0) + (chatUnreadCount ?? 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">
          {t('messages.title')}
        </h1>
        <p className="font-lato text-sm text-dashboard-secondary mt-1">
          {totalUnread ? `${totalUnread} ${t('messages.unread')}` : t('messages.allConversations')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dashboard-surface rounded-lg p-1 max-w-xs">
        <button
          onClick={() => {
            setTab('leads');
            setSelectedSessionId(null);
          }}
          className={`flex-1 px-4 py-2 rounded-md font-lato text-sm font-medium transition-colors min-h-[40px] ${
            tab === 'leads'
              ? 'bg-white text-dashboard-black shadow-sm'
              : 'text-dashboard-secondary hover:text-dashboard-black'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Users size={14} />
            {t('messages.leadsTab')}
            {(unreadCount ?? 0) > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-dashboard-gold text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => {
            setTab('chat');
            setSelectedLeadId(null);
          }}
          className={`flex-1 px-4 py-2 rounded-md font-lato text-sm font-medium transition-colors min-h-[40px] ${
            tab === 'chat'
              ? 'bg-white text-dashboard-black shadow-sm'
              : 'text-dashboard-secondary hover:text-dashboard-black'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <MessageSquare size={14} />
            {t('messages.chatTab')}
            {(chatUnreadCount ?? 0) > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-dashboard-gold text-white text-[10px] font-bold flex items-center justify-center">
                {chatUnreadCount}
              </span>
            )}
          </span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* LEADS TAB */}
      {/* ============================================================ */}
      {tab === 'leads' && (
        <>
          {isLoading ? (
            <SkeletonList count={5} />
          ) : !conversations?.length ? (
            <EmptyState
              icon={MessageSquare}
              title={t('messages.noConversations')}
              description={t('messages.noConversationsDesc')}
            />
          ) : (
            <div className="flex gap-0 bg-white rounded-xl border border-dashboard-border overflow-hidden h-[calc(100vh-300px)] lg:h-[calc(100vh-260px)] min-h-[400px]">
              {/* Conversation List */}
              <div
                className={`w-full md:w-80 border-r border-dashboard-border overflow-y-auto shrink-0 ${
                  selectedLeadId ? 'hidden md:block' : ''
                }`}
              >
                {conversations.map((conv) => {
                  const ChannelIcon = CHANNEL_ICONS[conv.last_channel] || MessageSquare;
                  return (
                    <button
                      key={conv.lead_id}
                      onClick={() => setSelectedLeadId(conv.lead_id)}
                      className={`w-full text-left p-4 border-b border-dashboard-border hover:bg-dashboard-surface/50 transition-colors ${
                        selectedLeadId === conv.lead_id ? 'bg-dashboard-surface' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-dashboard-gold/10 flex items-center justify-center shrink-0">
                          <span className="font-lato text-sm font-bold text-dashboard-gold">
                            {conv.lead_first_name[0]}
                            {conv.lead_last_name[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-lato text-sm font-medium text-dashboard-black truncate">
                              {conv.lead_first_name} {conv.lead_last_name}
                            </p>
                            <span className="font-lato text-[10px] text-dashboard-secondary shrink-0 ml-2">
                              {formatTime(conv.last_message_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <ChannelIcon
                              size={12}
                              className="text-dashboard-secondary shrink-0"
                            />
                            <p className="font-lato text-xs text-dashboard-secondary truncate">
                              {conv.last_message}
                            </p>
                          </div>
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="w-5 h-5 rounded-full bg-dashboard-gold text-white text-[10px] font-lato font-bold flex items-center justify-center shrink-0">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Message Thread */}
              <div
                className={`flex-1 flex flex-col ${
                  !selectedLeadId ? 'hidden md:flex' : 'flex'
                }`}
              >
                {!selectedLeadId ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="font-lato text-sm text-dashboard-secondary">
                      {t('messages.selectConversation')}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 border-b border-dashboard-border flex items-center gap-3">
                      <button
                        onClick={() => setSelectedLeadId(null)}
                        className="md:hidden font-lato text-sm text-dashboard-gold"
                      >
                        {t('messages.back')}
                      </button>
                      <div className="w-8 h-8 rounded-full bg-dashboard-gold/10 flex items-center justify-center">
                        <span className="font-lato text-xs font-bold text-dashboard-gold">
                          {selectedConv?.lead_first_name[0]}
                          {selectedConv?.lead_last_name[0]}
                        </span>
                      </div>
                      <p className="font-lato text-sm font-medium text-dashboard-black">
                        {selectedConv?.lead_first_name} {selectedConv?.lead_last_name}
                      </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages?.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[75%] rounded-lg p-3 ${
                              msg.direction === 'outbound'
                                ? 'bg-dashboard-gold text-white'
                                : 'bg-dashboard-surface text-dashboard-body'
                            }`}
                          >
                            <p className="font-lato text-sm">{msg.content}</p>
                            <p
                              className={`font-lato text-[10px] mt-1 ${
                                msg.direction === 'outbound'
                                  ? 'text-white/70'
                                  : 'text-dashboard-secondary'
                              }`}
                            >
                              {format(new Date(msg.created_at), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 border-t border-dashboard-border">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder={t('messages.replyPlaceholder')}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSend();
                            }
                          }}
                          className="flex-1 px-4 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-body placeholder:text-dashboard-secondary focus:outline-none focus:border-dashboard-gold/50 focus:ring-1 focus:ring-dashboard-gold/20 min-h-[44px]"
                        />
                        <button
                          onClick={handleSend}
                          disabled={!newMessage.trim() || sendMessage.isPending}
                          aria-label="Send message"
                          className="px-4 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] disabled:opacity-50 text-white rounded-lg transition-colors min-h-[44px]"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* CHAT TAB */}
      {/* ============================================================ */}
      {tab === 'chat' && (
        <>
          {chatLoading ? (
            <SkeletonList count={5} />
          ) : !chatSessions?.length ? (
            <EmptyState
              icon={MessageSquare}
              title={t('messages.noChatSessions')}
              description={t('messages.noChatDesc')}
            />
          ) : (
            <div className="flex gap-0 bg-white rounded-xl border border-dashboard-border overflow-hidden h-[calc(100vh-300px)] lg:h-[calc(100vh-260px)] min-h-[400px]">
              {/* Session List */}
              <div
                className={`w-full md:w-80 border-r border-dashboard-border overflow-y-auto shrink-0 ${
                  selectedSessionId ? 'hidden md:block' : ''
                }`}
              >
                {chatSessions.map((session) => {
                  const temp = getTemperature(session.lead_score);
                  const tempColor = TEMP_COLORS[temp];
                  return (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`w-full text-left p-4 border-b border-dashboard-border hover:bg-dashboard-surface/50 transition-colors ${
                        selectedSessionId === session.id ? 'bg-dashboard-surface' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-dashboard-surface flex items-center justify-center shrink-0 relative">
                          <MessageSquare
                            size={18}
                            className="text-dashboard-secondary"
                          />
                          {session.lead_score > 0 && (
                            <span
                              className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${tempColor} border-2 border-white`}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-lato text-sm font-medium text-dashboard-black truncate">
                              {session.visitor_name || t('messages.anonymousVisitor')}
                            </p>
                            <span className="font-lato text-[10px] text-dashboard-secondary shrink-0 ml-2">
                              {formatTime(session.last_message_at || session.updated_at)}
                            </span>
                          </div>
                          <p className="font-lato text-xs text-dashboard-secondary truncate mt-0.5">
                            {session.last_message || t('messages.noMessagesYet')}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {session.lead_score > 0 && (
                              <span className="font-lato text-[10px] text-dashboard-secondary">
                                {t('messages.score')}: {session.lead_score}
                              </span>
                            )}
                            {session.status === 'converted' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-lato font-medium bg-green-50 text-green-700">
                                {t('messages.converted')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Chat Thread */}
              <div
                className={`flex-1 flex flex-col ${
                  !selectedSessionId ? 'hidden md:flex' : 'flex'
                }`}
              >
                {!selectedSessionId ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="font-lato text-sm text-dashboard-secondary">
                      {t('messages.selectChat')}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Thread Header */}
                    <div className="p-4 border-b border-dashboard-border">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedSessionId(null)}
                          className="md:hidden font-lato text-sm text-dashboard-gold"
                        >
                          {t('messages.back')}
                        </button>
                        <div>
                          <p className="font-lato text-sm font-medium text-dashboard-black">
                            {selectedSession?.visitor_name || t('messages.anonymousVisitor')}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {selectedSession?.visitor_phone && (
                              <span className="font-lato text-[11px] text-dashboard-secondary">
                                {selectedSession.visitor_phone}
                              </span>
                            )}
                            {selectedSession?.visitor_email && (
                              <span className="font-lato text-[11px] text-dashboard-secondary">
                                {selectedSession.visitor_email}
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedSession && selectedSession.lead_score > 0 && (
                          <div className="ml-auto">
                            <LeadScoreBadge score={selectedSession.lead_score} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {chatMessages?.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.role === 'agent' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[75%] rounded-lg p-3 ${
                              msg.role === 'agent'
                                ? 'bg-dashboard-gold text-white'
                                : msg.role === 'bot'
                                  ? 'bg-blue-50 text-dashboard-body border border-blue-100'
                                  : 'bg-dashboard-surface text-dashboard-body'
                            }`}
                          >
                            {msg.role !== 'agent' && (
                              <p
                                className={`font-lato text-[10px] font-medium mb-0.5 ${
                                  msg.role === 'bot' ? 'text-blue-500' : 'text-dashboard-secondary'
                                }`}
                              >
                                {msg.role === 'bot' ? t('messages.bot') : t('messages.visitor')}
                              </p>
                            )}
                            <p className="font-lato text-sm">{msg.content}</p>
                            <p
                              className={`font-lato text-[10px] mt-1 ${
                                msg.role === 'agent'
                                  ? 'text-white/70'
                                  : 'text-dashboard-secondary'
                              }`}
                            >
                              {format(new Date(msg.created_at), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Agent Reply */}
                    <div className="p-4 border-t border-dashboard-border">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder={t('messages.replyAs')}
                          value={chatReply}
                          onChange={(e) => setChatReply(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleChatReply();
                            }
                          }}
                          className="flex-1 px-4 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-body placeholder:text-dashboard-secondary focus:outline-none focus:border-dashboard-gold/50 focus:ring-1 focus:ring-dashboard-gold/20 min-h-[44px]"
                        />
                        <button
                          onClick={handleChatReply}
                          disabled={!chatReply.trim() || sendChatMessage.isPending}
                          aria-label="Send reply"
                          className="px-4 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] disabled:opacity-50 text-white rounded-lg transition-colors min-h-[44px]"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
