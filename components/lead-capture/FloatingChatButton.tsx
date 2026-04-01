import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, X, Send, User, Phone, Mail } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { PHONE_NUMBER } from '../../constants';
import { useTranslation } from '../../lib/i18n';

const HIDDEN_ROUTES = ['/dashboard', '/login', '/signup', '/landing'];

const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="bg-gray-100 rounded-lg px-4 py-3 flex gap-1.5 items-center">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  </div>
);

const FloatingChatButton = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [captureForm, setCaptureForm] = useState({ name: '', phone: '', email: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isOpen,
    isLoading,
    showCaptureForm,
    leadScore,
    visitorInfo,
    sendMessage,
    submitCapture,
    dismissCaptureForm,
    toggleChat,
    closeChat,
  } = useChat();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, showCaptureForm]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !showCaptureForm && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, showCaptureForm]);

  // Lock body scroll on mobile when chat is fullscreen
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Hide on certain routes
  if (HIDDEN_ROUTES.some((route) => location.pathname.startsWith(route))) {
    return null;
  }

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCaptureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!captureForm.name.trim()) return;
    submitCapture(
      captureForm.name.trim(),
      captureForm.phone.trim() || undefined,
      captureForm.email.trim() || undefined,
    );
    setCaptureForm({ name: '', phone: '', email: '' });
  };

  // Score indicator color (matches design system: hot=red, warm=orange, cool=blue, cold=gray)
  const scoreColor =
    leadScore >= 80 ? 'bg-red-600' : leadScore >= 50 ? 'bg-orange-600' : leadScore >= 20 ? 'bg-blue-600' : 'bg-gray-400';

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-24 md:right-6 z-50 md:w-[380px] md:h-[520px] md:rounded-xl md:shadow-2xl md:border md:border-gray-100 flex flex-col bg-white overflow-hidden">
          {/* Header */}
          <div className="bg-[#0A0A0A] px-5 py-4 flex items-center justify-between shrink-0">
            <div>
              <p className="font-playfair text-white font-bold text-sm">{t('chat.header')}</p>
              <p className="font-lato text-white/60 text-xs">{t('chat.subtitle')}</p>
            </div>
            <button
              onClick={closeChat}
              className="text-white/60 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'visitor' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                    msg.role === 'visitor'
                      ? 'bg-[#C9A84C] text-white'
                      : 'bg-white text-gray-800 border border-gray-100 shadow-sm'
                  }`}
                >
                  <p className="font-lato text-sm leading-relaxed">{msg.content}</p>
                  <p
                    className={`font-lato text-[10px] mt-1 ${
                      msg.role === 'visitor' ? 'text-white/70' : 'text-gray-400'
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && <TypingIndicator />}

            {/* Lead Capture Form (inline) */}
            {showCaptureForm && !visitorInfo && (
              <div className="bg-white rounded-lg border border-[#C9A84C]/30 p-4 shadow-sm">
                <p className="font-playfair text-sm font-bold text-[#0A0A0A] mb-1">
                  {t('chat.captureTitle')}
                </p>
                <p className="font-lato text-xs text-gray-500 mb-3">
                  {t('chat.captureDesc')}
                </p>
                <form onSubmit={handleCaptureSubmit} className="space-y-2.5">
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={captureForm.name}
                      onChange={(e) => setCaptureForm({ ...captureForm, name: e.target.value })}
                      placeholder={t('chat.yourName')}
                      required
                      autoComplete="name"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg font-lato text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C]/50 focus:ring-1 focus:ring-[#C9A84C]/20 min-h-[44px]"
                    />
                  </div>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={captureForm.phone}
                      onChange={(e) => setCaptureForm({ ...captureForm, phone: e.target.value })}
                      placeholder={t('chat.phone')}
                      autoComplete="tel"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg font-lato text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C]/50 focus:ring-1 focus:ring-[#C9A84C]/20 min-h-[44px]"
                    />
                  </div>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={captureForm.email}
                      onChange={(e) => setCaptureForm({ ...captureForm, email: e.target.value })}
                      placeholder={t('chat.email')}
                      autoComplete="email"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg font-lato text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C]/50 focus:ring-1 focus:ring-[#C9A84C]/20 min-h-[44px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#C9A84C] hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
                    >
                      {t('chat.continueChatting')}
                    </button>
                    <button
                      type="button"
                      onClick={dismissCaptureForm}
                      className="px-3 py-2.5 border border-gray-200 text-gray-500 hover:text-gray-700 font-lato text-sm rounded-lg transition-colors min-h-[44px]"
                    >
                      {t('chat.skip')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-white shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chat.typePlaceholder')}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg font-lato text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C]/50 focus:ring-1 focus:ring-[#C9A84C]/20 min-h-[44px] disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="px-4 py-2.5 bg-[#C9A84C] hover:bg-[#B8952F] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors min-h-[44px]"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2 font-lato">
              {t('chat.callDirectly')} {PHONE_NUMBER}
            </p>
          </div>
        </div>
      )}

      {/* FAB Toggle Button */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50">
        <button
          onClick={toggleChat}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 relative ${
            isOpen ? 'bg-[#0A0A0A]' : 'bg-[#C9A84C] hover:shadow-[0_0_20px_rgba(201,168,76,0.4)]'
          }`}
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          {isOpen ? (
            <X className="text-white" size={22} />
          ) : (
            <MessageSquare className="text-white" size={22} />
          )}
          {/* Score indicator dot (dev only) */}
          {!isOpen && leadScore > 0 && (
            <span
              className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${scoreColor} border-2 border-white`}
              data-score={leadScore}
            />
          )}
        </button>
      </div>
    </>
  );
};

export default FloatingChatButton;
