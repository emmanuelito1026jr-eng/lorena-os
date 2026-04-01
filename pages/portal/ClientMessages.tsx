import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useClientMessages, useSendClientMessage, useMarkMessagesRead } from '../../hooks/portal/useClientMessages';
import { SkeletonList } from '../../components/shared/Skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { showToast } from '../../components/shared/Toast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useTranslation } from '../../lib/i18n/LanguageContext';

export default function ClientMessages() {
  usePageTitle('Messages');
  const { t } = useTranslation();
  const { data: messages = [], isLoading } = useClientMessages();
  const sendMessage = useSendClientMessage();
  const markRead = useMarkMessagesRead();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Mark as read when messages load
  useEffect(() => {
    if (messages.length > 0) {
      markRead.mutate();
    }
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendMessage.mutate(text, {
      onError: () => showToast('Failed to send message', 'error'),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-dashboard-border rounded animate-pulse w-32" />
        <SkeletonList count={6} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] lg:h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-dashboard-black">{t('portal.messages.title')}</h1>
        <p className="font-lato text-sm text-dashboard-secondary mt-1">{t('portal.messages.subtitle')}</p>
      </div>

      {/* Message thread */}
      <div className="flex-1 bg-white rounded-xl border border-dashboard-border overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <EmptyState
                icon={MessageSquare}
                title={t('portal.messages.emptyTitle')}
                description={t('portal.messages.emptyDesc')}
              />
            </div>
          ) : (
            messages.map(msg => {
              const isFromClient = msg.direction === 'inbound';
              return (
                <div key={msg.id} className={`flex ${isFromClient ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                    isFromClient
                      ? 'bg-dashboard-gold text-white rounded-br-md'
                      : 'bg-dashboard-surface text-dashboard-body rounded-bl-md'
                  }`}>
                    <p className="font-lato text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`font-lato text-[10px] mt-1 ${isFromClient ? 'text-white/60' : 'text-dashboard-secondary'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.is_ai && ' · AI'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-dashboard-border p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('portal.messages.placeholder')}
              rows={1}
              className="flex-1 px-3 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-body placeholder:text-dashboard-secondary focus:outline-none focus:border-dashboard-gold/50 focus:ring-1 focus:ring-dashboard-gold/20 resize-none min-h-[44px] max-h-24"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sendMessage.isPending}
              className="p-2.5 bg-dashboard-gold hover:bg-[#B8952F] disabled:opacity-50 text-white rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
